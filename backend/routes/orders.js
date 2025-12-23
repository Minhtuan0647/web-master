const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { dbAll, dbGet, runInTransaction } = require('../config/database');

const router = express.Router();

const generateOrderNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `RP${timestamp.slice(-6)}${random}`;
};

const parseFirstImage = (imageJson) => {
  try {
    const images = JSON.parse(imageJson || '[]');
    return images.length > 0 ? images[0] : null;
  } catch (error) {
    return null;
  }
};

const getOrderItems = async (orderId) => {
  const rows = await dbAll(
    `SELECT oi.*, p.name AS product_name, p.image_urls
     FROM order_items oi
     LEFT JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = ?`,
    [orderId]
  );

  return rows.map((item) => ({
    id: item.id,
    product_id: item.product_id,
    quantity: item.quantity,
    price_at_purchase: item.price_at_purchase,
    product_name: item.product_name,
    product_image: parseFirstImage(item.image_urls)
  }));
};

// POST /api/orders - Create new order
// This endpoint creates an order and automatically creates/updates customer information
router.post('/', [
  body('customer_name').notEmpty().trim().isLength({ min: 2, max: 255 }),
  body('customer_email').isEmail().normalizeEmail(),
  body('customer_phone').notEmpty().trim().isLength({ min: 10, max: 20 }),
  body('shipping_address').notEmpty().trim().isLength({ min: 10 }),
  body('items').isArray({ min: 1 }),
  body('items.*.product_id').isInt({ min: 1 }),
  body('items.*.quantity').isInt({ min: 1 }),
  body('payment_method').optional().isString().trim(),
  body('shipping_method').optional().isString().trim(),
  body('notes').optional().isString().trim(),
  // Optional customer fields
  body('city').optional().isString().trim().isLength({ max: 100 }),
  body('country').optional().isString().trim().isLength({ max: 100 }),
  body('date_of_birth').optional().isISO8601().toDate(),
  body('gender').optional().isString().trim().isIn(['male', 'female', 'other'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      items,
      payment_method = 'qr_code',
      shipping_method = 'standard',
      notes,
      city,
      country = 'Vietnam',
      date_of_birth,
      gender
    } = req.body;

    // Pre-validate all product IDs exist before starting transaction
    const productIds = items.map(item => Number(item.product_id));
    console.log('📦 Received order items:', JSON.stringify(items, null, 2));
    console.log('🔍 Product IDs to validate:', productIds);
    
    if (productIds.length === 0) {
      return res.status(400).json({
        error: 'Giỏ hàng trống',
        message: 'Vui lòng thêm sản phẩm vào giỏ hàng trước khi đặt hàng.'
      });
    }
    
    const existingProducts = await dbAll(
      `SELECT id, name, price, stock_quantity, is_active FROM products WHERE id IN (${productIds.map(() => '?').join(',')})`,
      productIds
    );
    
    console.log('✅ Found products in database:', existingProducts.map(p => ({ id: p.id, name: p.name })));
    
    const existingProductMap = new Map(existingProducts.map(p => [p.id, p]));
    
    // Check for missing or invalid products
    const missingProductIds = [];
    for (const item of items) {
      const productId = Number(item.product_id);
      const product = existingProductMap.get(productId);
      
      if (!product) {
        missingProductIds.push(productId);
      }
    }
    
    if (missingProductIds.length > 0) {
      console.error('❌ Missing products:', missingProductIds);
      return res.status(400).json({
        error: 'Sản phẩm không tồn tại',
        message: `Sản phẩm với ID ${missingProductIds.join(', ')} không còn tồn tại trong hệ thống. Vui lòng làm mới giỏ hàng và thử lại.`
      });
    }
    
    for (const item of items) {
      const productId = Number(item.product_id);
      const product = existingProductMap.get(productId);
      
      if (product.is_active !== 1) {
        return res.status(400).json({
          error: 'Sản phẩm không khả dụng',
          message: `Sản phẩm "${product.name}" hiện không còn được bán. Vui lòng xóa khỏi giỏ hàng.`
        });
      }
      
      if (product.stock_quantity < item.quantity) {
        return res.status(400).json({
          error: 'Không đủ hàng trong kho',
          message: `Sản phẩm "${product.name}" chỉ còn ${product.stock_quantity} sản phẩm trong kho.`
        });
      }
    }

    const order = await runInTransaction(async (tx) => {
      let totalAmount = 0;
      const validatedItems = [];

      // Validate products and calculate total amount
      for (const item of items) {
        const productId = Number(item.product_id);
        const product = existingProductMap.get(productId);

        const itemTotal = Number(product.price) * item.quantity;
        totalAmount += itemTotal;

        validatedItems.push({
          product_id: productId,
          quantity: Number(item.quantity),
          price_at_purchase: Number(product.price),
          product_name: product.name
        });
      }

      // Handle customer information - create or update customer record
      let customerId;
      const existingCustomer = await tx.get(
        'SELECT id, total_orders, total_spent FROM customers WHERE email = ?',
        [customer_email]
      );

      if (existingCustomer) {
        // Update existing customer
        customerId = existingCustomer.id;
        const newTotalOrders = (existingCustomer.total_orders || 0) + 1;
        const newTotalSpent = Number(existingCustomer.total_spent || 0) + totalAmount;
        
        // Determine VIP status based on total spent
        // standard: < 10,000,000 VND
        // silver: >= 10,000,000 VND
        // gold: >= 25,000,000 VND
        // platinum: >= 50,000,000 VND
        // diamond: > 70,000,000 VND
        let vipStatus = 'standard';
        if (newTotalSpent > 70000000) {
          vipStatus = 'diamond';
        } else if (newTotalSpent >= 50000000) {
          vipStatus = 'platinum';
        } else if (newTotalSpent >= 25000000) {
          vipStatus = 'gold';
        } else if (newTotalSpent >= 10000000) {
          vipStatus = 'silver';
        }

        await tx.run(
          `UPDATE customers 
           SET name = ?, 
               phone = ?, 
               address = ?,
               city = COALESCE(?, city),
               country = COALESCE(?, country),
               date_of_birth = COALESCE(?, date_of_birth),
               gender = COALESCE(?, gender),
               total_orders = ?,
               total_spent = ?,
               vip_status = ?,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [
            customer_name,
            customer_phone,
            shipping_address,
            city || null,
            country || null,
            date_of_birth || null,
            gender || null,
            newTotalOrders,
            newTotalSpent,
            vipStatus,
            customerId
          ]
        );
      } else {
        // Create new customer
        // Determine VIP status for new customer based on first order amount
        let newCustomerVipStatus = 'standard';
        if (totalAmount > 70000000) {
          newCustomerVipStatus = 'diamond';
        } else if (totalAmount >= 50000000) {
          newCustomerVipStatus = 'platinum';
        } else if (totalAmount >= 25000000) {
          newCustomerVipStatus = 'gold';
        } else if (totalAmount >= 10000000) {
          newCustomerVipStatus = 'silver';
        }

        const createCustomerResult = await tx.run(
          `INSERT INTO customers (email, name, phone, address, city, country, date_of_birth, gender, total_orders, total_spent, vip_status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
          [
            customer_email,
            customer_name,
            customer_phone,
            shipping_address,
            city || null,
            country || null,
            date_of_birth || null,
            gender || null,
            totalAmount,
            newCustomerVipStatus
          ]
        );
        customerId = createCustomerResult.lastID;
      }

      // Create order
      const orderNumber = generateOrderNumber();

      const createOrderResult = await tx.run(
        `INSERT INTO orders (order_number, customer_name, customer_email, customer_phone,
         shipping_address, total_amount, payment_method, shipping_method, notes, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          orderNumber,
          customer_name,
          customer_email,
          customer_phone,
          shipping_address,
          totalAmount,
          payment_method,
          shipping_method,
          notes || null
        ]
      );

      const orderId = createOrderResult.lastID;

      if (!orderId || orderId <= 0) {
        const error = new Error('Failed to create order - invalid order ID');
        error.statusCode = 500;
        throw error;
      }

      // Create order items and update product stock
      for (const item of validatedItems) {
        await tx.run(
          'INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)',
          [orderId, item.product_id, item.quantity, item.price_at_purchase]
        );

        await tx.run(
          'UPDATE products SET stock_quantity = stock_quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }

      const createdOrder = await tx.get('SELECT * FROM orders WHERE id = ?', [orderId]);
      if (!createdOrder) {
        const error = new Error('Failed to retrieve created order');
        error.statusCode = 500;
        throw error;
      }
      return createdOrder;
    });

    if (!order) {
      return res.status(500).json({
        error: 'Failed to create order',
        message: 'Order was not created successfully'
      });
    }

    const orderItems = await getOrderItems(order.id);

    res.status(201).json({
      message: 'Order created successfully',
      order: {
        ...order,
        items: orderItems
      }
    });

  } catch (error) {
    console.error('❌ Error creating order:', error);
    
    // Handle specific SQLite constraint errors with user-friendly messages
    if (error.message && error.message.includes('FOREIGN KEY')) {
      console.error('🔍 FOREIGN KEY constraint failed. Request items:', JSON.stringify(req.body.items, null, 2));
      return res.status(400).json({
        error: 'Lỗi dữ liệu sản phẩm',
        message: 'Một số sản phẩm trong giỏ hàng không còn tồn tại. Vui lòng làm mới trang và thử lại.'
      });
    }
    
    if (error.message && error.message.includes('UNIQUE constraint')) {
      return res.status(400).json({
        error: 'Lỗi tạo đơn hàng',
        message: 'Đã xảy ra lỗi khi tạo mã đơn hàng. Vui lòng thử lại.'
      });
    }
    
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      error: statusCode === 500 ? 'Lỗi tạo đơn hàng' : error.message,
      message: statusCode === 500 ? 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.' : undefined
    });
  }
});

// GET /api/orders/:orderNumber - Get order by order number
router.get('/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;

    const order = await dbGet('SELECT * FROM orders WHERE order_number = ?', [orderNumber]);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const items = await getOrderItems(order.id);

    res.json({
      ...order,
      items
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// GET /api/orders - Get orders by email (for customer lookup)
router.get('/', [
  query('email').isEmail().withMessage('Valid email is required').normalizeEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email parameter is required' });
    }

    const orders = await dbAll(
      'SELECT * FROM orders WHERE customer_email = ? ORDER BY created_at DESC',
      [email]
    );

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => ({
        ...order,
        items: await getOrderItems(order.id)
      }))
    );

    res.json(ordersWithItems);

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

module.exports = router;
