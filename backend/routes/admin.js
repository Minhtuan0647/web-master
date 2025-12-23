const express = require('express');
const { body, validationResult, query, param } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { dbGet, dbAll, dbRun } = require('../config/database');
const { jwtSecret } = require('../config/security');
const router = express.Router();

const createSlug = (value = '') => {
  return value
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') || `blog-${Date.now()}`;
};

const safeJsonParse = (value, fallback) => {
  try {
    return JSON.parse(value || JSON.stringify(fallback));
  } catch (error) {
    return fallback;
  }
};

const parseTags = (value) => {
  const parsed = safeJsonParse(value, []);
  return Array.isArray(parsed) ? parsed : [];
};

const FEEDBACK_STATUSES = ['new', 'in_progress', 'resolved', 'archived'];
const VIP_LEVELS = ['standard', 'gold', 'platinum', 'diamond'];

const parseProduct = (product) => {
  if (!product) return null;

  return {
    ...product,
    image_urls: safeJsonParse(product.image_urls, []),
    scent_notes: safeJsonParse(product.scent_notes, {}),
    is_featured: Boolean(product.is_featured),
    is_active: Boolean(product.is_active),
    is_new_arrival: Boolean(product.is_new_arrival),
    is_on_sale: Boolean(product.is_on_sale)
  };
};

const parseBlogPost = (post) => {
  if (!post) {
    console.warn('parseBlogPost received null/undefined post');
    return null;
  }

  // Ensure ID is a valid number
  let parsedId = null;
  if (post.id !== null && post.id !== undefined) {
    parsedId = Number(post.id);
    if (isNaN(parsedId) || parsedId <= 0) {
      console.warn('Blog post has invalid ID:', post.id, 'Type:', typeof post.id);
      // Use original ID value as fallback
      parsedId = post.id;
    }
  } else {
    console.warn('Blog post missing ID:', post.title || 'Untitled');
    // Return null only if ID is completely missing (not just invalid)
    // This is important for filtering out invalid records
    return null;
  }

  // Always return the blog post with parsed/validated ID
  return {
    ...post,
    id: parsedId,
    is_published: Boolean(post.is_published)
  };
};

const mapCustomerRecord = (row, profile = {}) => {
  if (!row) return null;

  return {
    email: (profile.email || row.customer_email || row.email_key || '').toLowerCase(),
    name: profile.name || row.customer_name || '',
    phone: profile.phone || row.customer_phone || '',
    total_orders: Number(row.total_orders || 0),
    total_spent: Number(row.total_spent || 0),
    last_order_at: row.last_order_at || null,
    note: profile.note || '',
    tags: parseTags(profile.tags),
    vip_status: profile.vip_status || 'standard',
    last_contacted_at: profile.last_contacted_at || null,
    profile_updated_at: profile.updated_at || null
  };
};

const getCustomerInsights = async (email) => {
  const normalizedEmail = (email || '').toLowerCase();

  const [profile, orders, feedbacks, aggregatedRow] = await Promise.all([
    dbGet('SELECT * FROM customer_profiles WHERE LOWER(email) = ?', [normalizedEmail]),
    dbAll(
      'SELECT * FROM orders WHERE LOWER(customer_email) = ? ORDER BY created_at DESC LIMIT 50',
      [normalizedEmail]
    ),
    dbAll(
      'SELECT * FROM customer_feedback WHERE LOWER(customer_email) = ? ORDER BY created_at DESC LIMIT 20',
      [normalizedEmail]
    ),
    dbGet(
      `SELECT
         LOWER(customer_email) AS email_key,
         MAX(customer_name) AS customer_name,
         MAX(customer_email) AS customer_email,
         MAX(customer_phone) AS customer_phone,
         COUNT(*) AS total_orders,
         SUM(total_amount) AS total_spent,
         MAX(created_at) AS last_order_at
       FROM orders
       WHERE LOWER(customer_email) = ?`,
      [normalizedEmail]
    )
  ]);

  const totalSpent = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

  const fallbackRow = {
    email_key: normalizedEmail,
    customer_email: profile?.email || email,
    customer_name: profile?.name || (orders[0]?.customer_name ?? ''),
    customer_phone: profile?.phone || (orders[0]?.customer_phone ?? ''),
    total_orders: orders.length,
    total_spent: totalSpent,
    last_order_at: orders[0]?.created_at || null
  };

  const row = aggregatedRow || fallbackRow;
  const profileData = profile || { email }; // ensure email for mapping

  return {
    profile,
    orders,
    feedbacks,
    customer: mapCustomerRecord(row, profileData)
  };
};

const parseFirstImage = (imageJson) => {
  try {
    const images = JSON.parse(imageJson || '[]');
    return images.length > 0 ? images[0] : null;
  } catch (error) {
    return null;
  }
};

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT secret is not configured');
  }

  return secret;
};

const fetchOrderItems = async (orderId) => {
  const rows = await dbAll(
    `SELECT oi.*, p.name as product_name, p.image_urls
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

// Role-based access control middleware
const requireRole = (...allowedRoles) => {
  // Normalize roles - handle both array and spread arguments
  const roles = allowedRoles.length === 1 && Array.isArray(allowedRoles[0])
    ? allowedRoles[0]
    : allowedRoles;

  if (!Array.isArray(roles) || roles.length === 0) {
    throw new Error('requireRole requires at least one allowed role');
  }

  return (req, res, next) => {
    // Check if user is authenticated first
    if (!req.admin) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.admin.role;

    if (!userRole) {
      return res.status(403).json({ error: 'User role not found' });
    }

    // Check if user role is in allowed roles (case-insensitive)
    const normalizedUserRole = String(userRole).toLowerCase();
    const normalizedAllowedRoles = roles.map(r => String(r).toLowerCase());

    if (!normalizedAllowedRoles.includes(normalizedUserRole)) {
      return res.status(403).json({ 
        error: 'Access denied',
        message: `Required roles: ${roles.join(', ')}. Your role: ${userRole}`
      });
    }

    next();
  };
};

// Middleware to verify admin token
const verifyAdminToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, jwtSecret);
    
    // Verify admin user exists and is active
    const admin = await dbGet(
      'SELECT id, email, name, role FROM admin_users WHERE id = ? AND is_active = 1',
      [decoded.userId]
    );

    if (!admin) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    if (error.message === 'JWT secret is not configured') {
      console.error('JWT secret is not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    res.status(401).json({ error: 'Invalid token' });
  }
};

// POST /api/admin/login - Admin login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    
    // Normalize email to lowercase for case-insensitive comparison
    const normalizedEmail = (email || '').toLowerCase().trim();
    
    const admin = await dbGet(
      'SELECT id, email, password_hash, name, role FROM admin_users WHERE LOWER(email) = ? AND is_active = 1',
      [normalizedEmail]
    );

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, admin.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const jwtSecret = getJwtSecret();

    const token = jwt.sign(
      { userId: admin.id, email: admin.email },
      jwtSecret,
      { expiresIn: '24h' }
    );
    res.json({
      message: 'Login successful',
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });

  } catch (error) {
    if (error.message === 'JWT secret is not configured') {
      console.error('JWT secret is not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    console.error('❌ Error during admin login:', error.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Apply admin authentication middleware to all routes below (except login)
// This ensures req.admin is set before any route handlers
router.use(async (req, res, next) => {
  // Skip authentication for login route
  if (req.path === '/login' || req.path.startsWith('/login')) {
    return next();
  }
  // Call verifyAdminToken middleware
  await verifyAdminToken(req, res, next);
});

// GET /api/admin/orders - Get all orders
router.get('/orders',
  requireRole('admin', 'sale'),
  [
  query('status').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
  ],
async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const adminUser = req.admin;

    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 20;
    const offset = (pageNumber - 1) * limitNumber;

    const filters = [];
    const filterParams = [];

    if (status) {
      filters.push('o.status = ?');
      filterParams.push(status);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const orders = await dbAll(
      `SELECT o.* FROM orders o ${whereClause} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
      [...filterParams, limitNumber, offset]
    );

    const totalCountRow = await dbGet(
      `SELECT COUNT(*) as count FROM orders o ${whereClause}`,
      filterParams
    );

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => ({
        ...order,
        items: await fetchOrderItems(order.id)
      }))
    );

    const totalCount = Number(totalCountRow?.count || 0);

    res.json({
      orders: ordersWithItems,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role
      },
      pagination: {
        current_page: pageNumber,
        total_pages: Math.ceil(totalCount / limitNumber),
        total_count: totalCount,
        limit: limitNumber
      }
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// PUT /api/admin/orders/:id - Update order status (Admin only)
router.put('/orders/:id',
  requireRole('admin'),
  [
  body('status').isIn(['pending', 'paid', 'shipped', 'delivered', 'cancelled'])
  ],
async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;

    const result = await dbRun(
      'UPDATE orders SET status = ?, updated_at = datetime("now") WHERE id = ?',
      [status, id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Get updated order
    const updatedOrder = await dbGet('SELECT * FROM orders WHERE id = ?', [id]);

    res.json({
      message: 'Order status updated successfully',
      order: updatedOrder
    });

  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// GET /api/admin/products - Get all products for admin
router.get('/products',
  requireRole('admin'),
  [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
  ],
async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 20;

    // Get admin user info
    const adminUser = req.admin;

    const offset = (pageNumber - 1) * limitNumber;

    const productRows = await dbAll(
      'SELECT * FROM products ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limitNumber, offset]
    );

    const countResult = await dbGet('SELECT COUNT(*) as count FROM products');
    const totalCount = countResult?.count || 0;

    res.json({
      products: productRows.map(parseProduct),
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role
      },
      pagination: {
        current_page: pageNumber,
        total_pages: Math.ceil(totalCount / limitNumber),
        total_count: totalCount,
        limit: limitNumber
      }
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// POST /api/admin/products - Create new product
router.post('/products',
  requireRole('admin'),
  [
  body('name').notEmpty().trim().isLength({ min: 2, max: 255 }),
  body('brand').notEmpty().trim().isLength({ min: 2, max: 100 }),
  body('description').notEmpty().trim(),
  body('price').isFloat({ min: 0 }),
  body('stock_quantity').isInt({ min: 0 }),
  body('volume_ml').isInt({ min: 1 }),
  body('category').optional().isString().trim(),
  body('is_featured').optional().isBoolean(),
  body('scent_notes').optional().isObject(),
  body('gender').optional().isIn(['male', 'female', 'unisex']),
  body('product_type').optional().isIn(['full_bottle', 'decant', 'sample', 'gift_set']),
  body('concentration').optional().isIn(['EDT', 'EDP', 'Parfum', 'EDC', 'Other']),
  body('origin_country').optional().isString().trim(),
  body('release_year').optional().isInt({ min: 1900, max: new Date().getFullYear() + 5 }),
  body('is_new_arrival').optional().isBoolean(),
  body('is_on_sale').optional().isBoolean(),
  body('sale_price').optional().isFloat({ min: 0 }),
  body('image_urls').optional().isArray()
  ],
async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      brand,
      description,
      price,
      image_urls = [],
      stock_quantity,
      scent_notes = {},
      volume_ml,
      category = 'perfume',
      is_featured = false,
      gender = 'unisex',
      product_type = 'full_bottle',
      concentration = null,
      origin_country = null,
      release_year = null,
      is_new_arrival = false,
      is_on_sale = false,
      sale_price = null
    } = req.body;

    const result = await dbRun(
      `INSERT INTO products (name, brand, description, price, image_urls, stock_quantity,
       scent_notes, volume_ml, category, is_featured, gender, product_type, concentration,
       origin_country, release_year, is_new_arrival, is_on_sale, sale_price)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        brand,
        description,
        price,
        JSON.stringify(image_urls),
        stock_quantity,
        JSON.stringify(scent_notes),
        volume_ml,
        category,
        is_featured ? 1 : 0,
        gender,
        product_type,
        concentration,
        origin_country,
        release_year,
        is_new_arrival ? 1 : 0,
        is_on_sale ? 1 : 0,
        sale_price
      ]
    );

    const product = await dbGet('SELECT * FROM products WHERE id = ?', [result.lastID]);

    res.status(201).json({
      message: 'Product created successfully',
      product: parseProduct(product)
    });

  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /api/admin/products/:id - Update product
router.put('/products/:id',
  requireRole('admin'),
  [
  body('name').optional().trim().isLength({ min: 2, max: 255 }),
  body('brand').optional().trim().isLength({ min: 2, max: 100 }),
  body('description').optional().trim(),
  body('price').optional().isFloat({ min: 0 }),
  body('image_urls').optional().isArray(),
  body('stock_quantity').optional().isInt({ min: 0 }),
  body('volume_ml').optional().isInt({ min: 1 }),
  body('category').optional().isString().trim(),
  body('is_featured').optional().isBoolean(),
  body('is_active').optional().isBoolean(),
  body('scent_notes').optional().isObject(),
  body('gender').optional().isIn(['male', 'female', 'unisex']),
  body('product_type').optional().isIn(['full_bottle', 'decant', 'sample', 'gift_set']),
  body('concentration').optional().isIn(['EDT', 'EDP', 'Parfum', 'EDC', 'Other']),
  body('origin_country').optional().isString().trim(),
  body('release_year').optional().isInt({ min: 1900, max: new Date().getFullYear() + 5 }),
  body('is_new_arrival').optional().isBoolean(),
  body('is_on_sale').optional().isBoolean(),
  body('sale_price').optional().isFloat({ min: 0 })
  ],
async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateFields = req.body;

    const allowedFieldTransformers = {
      name: (value) => value,
      brand: (value) => value,
      description: (value) => value,
      price: (value) => value,
      image_urls: (value) => JSON.stringify(value ?? []),
      stock_quantity: (value) => value,
      scent_notes: (value) => JSON.stringify(value ?? {}),
      volume_ml: (value) => value,
      category: (value) => value,
      is_featured: (value) => (value ? 1 : 0),
      is_active: (value) => (value ? 1 : 0),
      gender: (value) => value,
      product_type: (value) => value,
      concentration: (value) => value,
      origin_country: (value) => value,
      release_year: (value) => value,
      is_new_arrival: (value) => (value ? 1 : 0),
      is_on_sale: (value) => (value ? 1 : 0),
      sale_price: (value) => value
    };

    const setClause = [];
    const values = [];

    Object.entries(allowedFieldTransformers).forEach(([field, transform]) => {
      if (!Object.prototype.hasOwnProperty.call(updateFields, field)) {
        return;
      }

      const rawValue = updateFields[field];

      if (rawValue === undefined) {
        return;
      }

      const processedValue = transform(rawValue);
      setClause.push(`${field} = ?`);
      values.push(processedValue);
    });

    if (setClause.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    setClause.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE products SET ${setClause.join(', ')} WHERE id = ?`;

    const result = await dbRun(query, values);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = await dbGet('SELECT * FROM products WHERE id = ?', [id]);

    res.json({
      message: 'Product updated successfully',
      product: parseProduct(product)
    });

  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/admin/products/:id - Delete product
router.delete('/products/:id', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const product = await dbGet('SELECT * FROM products WHERE id = ?', [id]);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await dbRun('DELETE FROM products WHERE id = ?', [id]);

    res.json({
      message: 'Product deleted successfully',
      product: parseProduct(product)
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Feedback management
router.get('/feedbacks',
  requireRole('admin'),
  [
    query('status').optional().isIn(['all', ...FEEDBACK_STATUSES]),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim().isString()
  ],
async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status = 'all', page = 1, limit = 20, search = '' } = req.query;
    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 20;
    const offset = (pageNumber - 1) * limitNumber;

    const filters = [];
    const params = [];

    if (status && status !== 'all') {
      filters.push('status = ?');
      params.push(status);
    }

    if (search) {
      const term = `%${search.toLowerCase()}%`;
      filters.push('(LOWER(customer_name) LIKE ? OR LOWER(customer_email) LIKE ? OR LOWER(message) LIKE ? OR LOWER(admin_notes) LIKE ?)');
      params.push(term, term, term, term);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const feedbackRows = await dbAll(
      `SELECT * FROM customer_feedback ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limitNumber, offset]
    );

    const totalCountRow = await dbGet(
      `SELECT COUNT(*) as count FROM customer_feedback ${whereClause}`,
      params
    );

    const summaryRows = await dbAll(
      'SELECT status, COUNT(*) as count FROM customer_feedback GROUP BY status'
    );

    const summary = FEEDBACK_STATUSES.reduce(
      (acc, key) => {
        acc[key] = 0;
        return acc;
      },
      { total: 0 }
    );

    summaryRows.forEach((row) => {
      if (summary[row.status] !== undefined) {
        summary[row.status] = Number(row.count || 0);
      }
    });

    summary.total = FEEDBACK_STATUSES.reduce((acc, key) => acc + summary[key], 0);

    res.json({
      feedbacks: feedbackRows.map((row) => ({
        ...row,
        rating: row.rating === null || row.rating === undefined ? null : Number(row.rating)
      })),
      pagination: {
        current_page: pageNumber,
        total_pages: Math.ceil((totalCountRow?.count || 0) / limitNumber),
        total_count: Number(totalCountRow?.count || 0),
        limit: limitNumber
      },
      summary
    });
  } catch (error) {
    console.error('Error fetching customer feedback:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

router.post('/feedbacks',
  requireRole('admin'),
  [
    body('customer_name').optional().trim().isLength({ min: 2 }).withMessage('Customer name should have at least 2 characters'),
    body('customer_email').optional().isEmail().normalizeEmail(),
    body('customer_phone').optional().trim().isLength({ min: 9, max: 20 }),
    body('message').notEmpty().trim(),
    body('rating').optional().isInt({ min: 0, max: 5 }),
    body('status').optional().isIn(FEEDBACK_STATUSES),
    body('admin_notes').optional().isString(),
    body('follow_up_date').optional().isISO8601()
  ],
async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      customer_name,
      customer_email,
      customer_phone,
      message,
      rating = null,
      status = 'new',
      admin_notes = null,
      follow_up_date = null
    } = req.body;

    const statusValue = FEEDBACK_STATUSES.includes(status) ? status : 'new';
    const followUpDate = follow_up_date ? new Date(follow_up_date).toISOString() : null;

    const result = await dbRun(
      `INSERT INTO customer_feedback (customer_name, customer_email, customer_phone, message, rating, status, admin_notes, follow_up_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customer_name || null,
        customer_email ? customer_email.toLowerCase() : null,
        customer_phone || null,
        message,
        rating === null ? null : Number(rating),
        statusValue,
        admin_notes || null,
        followUpDate
      ]
    );

    const feedback = await dbGet('SELECT * FROM customer_feedback WHERE id = ?', [result.lastID]);

    res.status(201).json({
      message: 'Feedback created successfully',
      feedback: {
        ...feedback,
        rating: feedback?.rating === null || feedback?.rating === undefined ? null : Number(feedback.rating)
      }
    });
  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({ error: 'Failed to create feedback' });
  }
});

router.patch('/feedbacks/:id',
  requireRole('admin'),
  [
    body('status').optional().isIn(FEEDBACK_STATUSES),
    body('admin_notes').optional().isString(),
    body('follow_up_date').optional().isISO8601(),
    body('rating').optional().isInt({ min: 0, max: 5 })
  ],
async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updates = req.body;

    const fields = [];
    const values = [];

    if (updates.status) {
      fields.push('status = ?');
      values.push(updates.status);
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'admin_notes')) {
      fields.push('admin_notes = ?');
      values.push(updates.admin_notes || null);
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'rating')) {
      fields.push('rating = ?');
      values.push(updates.rating === null ? null : Number(updates.rating));
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'follow_up_date')) {
      const followUpDate = updates.follow_up_date ? new Date(updates.follow_up_date).toISOString() : null;
      fields.push('follow_up_date = ?');
      values.push(followUpDate);
    }

    if (!fields.length) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE customer_feedback SET ${fields.join(', ')} WHERE id = ?`;

    const result = await dbRun(query, values);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    const feedback = await dbGet('SELECT * FROM customer_feedback WHERE id = ?', [id]);

    res.json({
      message: 'Feedback updated successfully',
      feedback: {
        ...feedback,
        rating: feedback?.rating === null || feedback?.rating === undefined ? null : Number(feedback.rating)
      }
    });
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({ error: 'Failed to update feedback' });
  }
});

// Customer management (Admin only)
router.get('/customers',
  requireRole('admin'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim().isString()
  ],
async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 20, search = '' } = req.query;
    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 20;
    const offset = (pageNumber - 1) * limitNumber;
    const searchTerm = search.toLowerCase();

    const filters = [];
    const params = [];

    if (searchTerm) {
      const likeTerm = `%${searchTerm}%`;
      filters.push('(LOWER(customer_name) LIKE ? OR LOWER(customer_email) LIKE ? OR LOWER(customer_phone) LIKE ?)');
      params.push(likeTerm, likeTerm, likeTerm);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const baseQuery = `FROM orders ${whereClause} GROUP BY LOWER(customer_email)`;

    const [customerRows, totalCountRow, aggregatedRows, vipCountRow, followUpRow] = await Promise.all([
      dbAll(
        `SELECT
           LOWER(customer_email) AS email_key,
           MAX(customer_name) AS customer_name,
           MAX(customer_email) AS customer_email,
           MAX(customer_phone) AS customer_phone,
           COUNT(*) AS total_orders,
           SUM(total_amount) AS total_spent,
           MAX(created_at) AS last_order_at
         ${baseQuery}
         ORDER BY last_order_at DESC
         LIMIT ? OFFSET ?`,
        [...params, limitNumber, offset]
      ),
      dbGet(
        `SELECT COUNT(*) as count FROM (SELECT 1 ${baseQuery}) as customer_counts`,
        params
      ),
      dbAll(
        `SELECT
           LOWER(customer_email) AS email_key,
           MAX(customer_name) AS customer_name,
           MAX(customer_email) AS customer_email,
           MAX(customer_phone) AS customer_phone,
           COUNT(*) AS total_orders,
           SUM(total_amount) AS total_spent,
           MAX(created_at) AS last_order_at
         FROM orders
         GROUP BY LOWER(customer_email)`
      ),
      dbGet("SELECT COUNT(*) as count FROM customer_profiles WHERE vip_status != 'standard'"),
      dbGet("SELECT COUNT(*) as count FROM customer_feedback WHERE status IN ('new', 'in_progress')")
    ]);

    const emailKeys = customerRows
      .map((row) => (row.email_key || row.customer_email || '').toLowerCase())
      .filter(Boolean);

    let profileRows = [];
    if (emailKeys.length) {
      const placeholders = emailKeys.map(() => '?').join(', ');
      profileRows = await dbAll(
        `SELECT * FROM customer_profiles WHERE LOWER(email) IN (${placeholders})`,
        emailKeys
      );
    }

    const profileMap = new Map();
    profileRows.forEach((profile) => {
      profileMap.set((profile.email || '').toLowerCase(), profile);
    });

    const customers = customerRows.map((row) => {
      const key = (row.email_key || row.customer_email || '').toLowerCase();
      return mapCustomerRecord(row, profileMap.get(key) || { email: row.customer_email });
    });

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const summaryTotals = aggregatedRows.reduce(
      (acc, row) => {
        const totalOrders = Number(row.total_orders || 0);
        const lastOrderTime = row.last_order_at ? new Date(row.last_order_at).getTime() : null;

        acc.total_customers += 1;
        if (totalOrders > 1) {
          acc.repeat_customers += 1;
        }

        if (lastOrderTime && lastOrderTime >= thirtyDaysAgo) {
          acc.recent_customers += 1;
        }

        if (Number(row.total_spent || 0) >= 1000) {
          acc.high_value_customers += 1;
        }

        return acc;
      },
      {
        total_customers: 0,
        repeat_customers: 0,
        recent_customers: 0,
        high_value_customers: 0
      }
    );

    const summary = {
      ...summaryTotals,
      vip_customers: Number(vipCountRow?.count || 0),
      pending_followups: Number(followUpRow?.count || 0)
    };

    res.json({
      customers,
      pagination: {
        current_page: pageNumber,
        total_pages: Math.ceil((totalCountRow?.count || 0) / limitNumber),
        total_count: Number(totalCountRow?.count || 0),
        limit: limitNumber
      },
      summary
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

router.get('/customers/:email', requireRole('admin'), async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const insights = await getCustomerInsights(email);

    res.json({
      customer: insights.customer,
      profile: insights.profile,
      orders: insights.orders,
      feedbacks: insights.feedbacks
    });
  } catch (error) {
    console.error('Error fetching customer detail:', error);
    res.status(500).json({ error: 'Failed to fetch customer detail' });
  }
});

router.put('/customers/:email',
  requireRole('admin'),
  [
    body('name').optional().trim().isLength({ min: 2 }).withMessage('Name should have at least 2 characters'),
    body('phone').optional().trim().isLength({ min: 8, max: 20 }),
    body('note').optional().isString(),
    body('tags').optional().isArray({ max: 10 }),
    body('vip_status').optional().isIn(VIP_LEVELS),
    body('last_contacted_at').optional().isISO8601()
  ],
async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const email = (req.params.email || '').toLowerCase();
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const existingProfile = await dbGet('SELECT * FROM customer_profiles WHERE LOWER(email) = ?', [email]);

    const hasName = Object.prototype.hasOwnProperty.call(req.body, 'name');
    const hasPhone = Object.prototype.hasOwnProperty.call(req.body, 'phone');
    const hasNote = Object.prototype.hasOwnProperty.call(req.body, 'note');
    const hasTags = Object.prototype.hasOwnProperty.call(req.body, 'tags');
    const hasVip = Object.prototype.hasOwnProperty.call(req.body, 'vip_status');
    const hasLastContact = Object.prototype.hasOwnProperty.call(req.body, 'last_contacted_at');

    const tagsArray = hasTags ? req.body.tags : parseTags(existingProfile?.tags);
    const normalizedTags = Array.isArray(tagsArray)
      ? tagsArray.map((tag) => String(tag).trim()).filter(Boolean)
      : [];

    const vipStatus = hasVip
      ? req.body.vip_status
      : existingProfile?.vip_status || 'standard';

    const lastContacted = hasLastContact
      ? (req.body.last_contacted_at ? new Date(req.body.last_contacted_at).toISOString() : null)
      : existingProfile?.last_contacted_at || null;

    const name = hasName ? (req.body.name || null) : (existingProfile?.name || null);
    const phone = hasPhone ? (req.body.phone || null) : (existingProfile?.phone || null);
    const note = hasNote ? (req.body.note || null) : (existingProfile?.note || null);

    await dbRun(
      `INSERT INTO customer_profiles (email, name, phone, note, tags, vip_status, last_contacted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET
         name = excluded.name,
         phone = excluded.phone,
         note = excluded.note,
         tags = excluded.tags,
         vip_status = excluded.vip_status,
         last_contacted_at = excluded.last_contacted_at,
         updated_at = CURRENT_TIMESTAMP`,
      [
        email,
        name,
        phone,
        note,
        JSON.stringify(normalizedTags),
        vipStatus,
        lastContacted
      ]
    );

    const insights = await getCustomerInsights(email);

    res.json({
      message: 'Customer profile updated successfully',
      customer: insights.customer,
      profile: insights.profile,
      orders: insights.orders,
      feedbacks: insights.feedbacks
    });
  } catch (error) {
    console.error('Error updating customer profile:', error);
    res.status(500).json({ error: 'Failed to update customer profile' });
  }
});

// Blog management
router.get('/blogs',
  requireRole('admin'),
  [
    query('status').optional().isIn(['all', 'published', 'draft']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('search').optional().trim().isString()
  ],
async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status = 'all', page = 1, limit = 20, search = '' } = req.query;
    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 20;
    const offset = (pageNumber - 1) * limitNumber;

    const filters = [];
    const params = [];

    if (status === 'published') {
      filters.push('CAST(is_published AS INTEGER) = 1');
    } else if (status === 'draft') {
      filters.push('CAST(is_published AS INTEGER) = 0');
    }

    if (search) {
      const term = `%${search.toLowerCase()}%`;
      filters.push('(LOWER(title) LIKE ? OR LOWER(slug) LIKE ? OR LOWER(author) LIKE ? OR LOWER(content) LIKE ?)');
      params.push(term, term, term, term);
    }

    // Always filter out blogs with null IDs
    filters.push('id IS NOT NULL');
    const whereClause = `WHERE ${filters.join(' AND ')}`;

    const [blogRows, totalCountRow, statusCounts] = await Promise.all([
      dbAll(
        `SELECT * FROM blog_posts ${whereClause} ORDER BY updated_at DESC LIMIT ? OFFSET ?`,
        [...params, limitNumber, offset]
      ),
      dbGet(
        `SELECT COUNT(*) as count FROM blog_posts ${whereClause}`,
        params
      ),
      dbAll('SELECT is_published, COUNT(*) as count FROM blog_posts WHERE id IS NOT NULL GROUP BY is_published')
    ]);

    const summary = {
      total: 0,
      published: 0,
      drafts: 0
    };

    statusCounts.forEach((row) => {
      const count = Number(row.count || 0);
      summary.total += count;
      if (row.is_published) {
        summary.published = count;
      } else {
        summary.drafts = count;
      }
    });

    const parsedBlogs = blogRows.map(parseBlogPost).filter(blog => {
      if (blog === null) {
        console.warn('Filtered out null blog from parsed results');
        return false;
      }
      // Also filter out blogs without valid IDs for display
      if (!blog.id || blog.id === null || blog.id === undefined) {
        console.warn('Filtered out blog without ID:', blog);
        return false;
      }
      return true;
    });

    console.log(`[Admin Blogs API] Fetched ${blogRows.length} blogs from DB, ${parsedBlogs.length} after parsing`);
    console.log(`[Admin Blogs API] Filter: status=${status}, page=${pageNumber}, limit=${limitNumber}`);
    console.log(`[Admin Blogs API] Summary:`, summary);
    console.log(`[Admin Blogs API] Parsed blogs:`, parsedBlogs.map(b => ({ id: b?.id, title: b?.title, is_published: b?.is_published })));

    // Disable caching for admin endpoints to ensure fresh data
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({
      blogs: parsedBlogs,
      pagination: {
        current_page: pageNumber,
        total_pages: Math.ceil((totalCountRow?.count || 0) / limitNumber),
        total_count: Number(totalCountRow?.count || 0),
        limit: limitNumber
      },
      summary
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

router.post('/blogs',
  requireRole('admin'),
  [
    body('title').notEmpty().trim(),
    body('slug').optional().trim(),
    body('content').notEmpty(),
    body('excerpt').optional().isString(),
    body('featured_image').optional().isString(),
    body('author').optional().trim(),
    body('is_published').optional().isBoolean().toBoolean(),
    body('published_at').optional().isISO8601()
  ],
async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      slug,
      content,
      excerpt = '',
      featured_image = null,
      author = 'Rare Parfume Team',
      is_published = false,
      published_at = null
    } = req.body;

    const finalSlug = createSlug(slug || title);

    const existing = await dbGet('SELECT id FROM blog_posts WHERE slug = ?', [finalSlug]);
    if (existing) {
      return res.status(400).json({ error: 'Slug already exists' });
    }

    const isPublished = Boolean(is_published);
    const publishedAtValue = isPublished
      ? (published_at ? new Date(published_at).toISOString() : new Date().toISOString())
      : null;

    const result = await dbRun(
      `INSERT INTO blog_posts (title, slug, content, excerpt, featured_image, author, is_published, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        finalSlug,
        content,
        excerpt || null,
        featured_image || null,
        author || 'Rare Parfume Team',
        isPublished ? 1 : 0,
        publishedAtValue
      ]
    );

    if (!result.lastID) {
      console.error('Failed to get lastID from insert result:', result);
      return res.status(500).json({ error: 'Failed to create blog post: No ID returned' });
    }

    const blog = await dbGet('SELECT * FROM blog_posts WHERE id = ?', [result.lastID]);
    
    if (!blog) {
      console.error('Blog post not found after creation, lastID:', result.lastID);
      return res.status(500).json({ error: 'Failed to retrieve created blog post' });
    }

    const parsedBlog = parseBlogPost(blog);
    if (!parsedBlog) {
      console.error('Failed to parse blog post:', blog);
      return res.status(500).json({ error: 'Failed to parse created blog post' });
    }

    res.status(201).json({
      message: 'Blog post created successfully',
      blog: parsedBlog
    });
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({ error: 'Failed to create blog post' });
  }
});

router.put('/blogs/:id',
  requireRole('admin'),
  [
    body('title').optional().trim().isLength({ min: 1 }),
    body('slug').optional().trim(),
    body('content').optional().isString(),
    body('excerpt').optional().isString(),
    body('featured_image').optional().isString(),
    body('author').optional().trim(),
    body('is_published').optional().custom((value) => {
      if (value === undefined || value === null) return true;
      return typeof value === 'boolean' || value === 'true' || value === 'false' || value === 1 || value === 0;
    }),
    body('published_at').optional().isISO8601()
  ],
async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updates = req.body;

    if (updates.slug) {
      updates.slug = createSlug(updates.slug);
      const slugOwner = await dbGet('SELECT id FROM blog_posts WHERE slug = ? AND id != ?', [updates.slug, id]);
      if (slugOwner) {
        return res.status(400).json({ error: 'Slug already exists' });
      }
    }

    const fields = [];
    const values = [];

    if (updates.title !== undefined && updates.title !== null) {
      fields.push('title = ?');
      values.push(String(updates.title).trim() || null);
    }

    if (updates.slug !== undefined && updates.slug !== null) {
      fields.push('slug = ?');
      values.push(String(updates.slug).trim() || null);
    }

    if (updates.content !== undefined && updates.content !== null) {
      fields.push('content = ?');
      values.push(String(updates.content).trim() || null);
    }

    if (updates.excerpt !== undefined && updates.excerpt !== null) {
      fields.push('excerpt = ?');
      values.push(String(updates.excerpt).trim() || null);
    }

    if (updates.featured_image !== undefined && updates.featured_image !== null) {
      fields.push('featured_image = ?');
      values.push(String(updates.featured_image).trim() || null);
    }

    if (updates.author !== undefined && updates.author !== null) {
      fields.push('author = ?');
      values.push(String(updates.author).trim() || 'Rare Parfume Team');
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'is_published')) {
      // Handle various boolean formats
      let isPublished = false;
      if (typeof updates.is_published === 'boolean') {
        isPublished = updates.is_published;
      } else if (typeof updates.is_published === 'string') {
        isPublished = updates.is_published === 'true' || updates.is_published === '1';
      } else if (typeof updates.is_published === 'number') {
        isPublished = updates.is_published === 1;
      }
      
      fields.push('is_published = ?');
      values.push(isPublished ? 1 : 0);

      const publishedAtValue = isPublished
        ? (updates.published_at ? new Date(updates.published_at).toISOString() : new Date().toISOString())
        : null;

      fields.push('published_at = ?');
      values.push(publishedAtValue);
    } else if (Object.prototype.hasOwnProperty.call(updates, 'published_at')) {
      const publishedAtValue = updates.published_at ? new Date(updates.published_at).toISOString() : null;
      fields.push('published_at = ?');
      values.push(publishedAtValue);
    }

    if (!fields.length) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const result = await dbRun(
      `UPDATE blog_posts SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    const blog = await dbGet('SELECT * FROM blog_posts WHERE id = ?', [id]);

    res.json({
      message: 'Blog post updated successfully',
      blog: parseBlogPost(blog)
    });
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({ error: 'Failed to update blog post' });
  }
});

router.delete('/blogs/:id', requireRole('admin'), [
  param('id').isInt({ min: 1 }).withMessage('Invalid blog post ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const blogId = parseInt(id, 10);

    if (!blogId || isNaN(blogId)) {
      return res.status(400).json({ error: 'Invalid blog post ID' });
    }

    const blog = await dbGet('SELECT * FROM blog_posts WHERE id = ?', [blogId]);
    if (!blog) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    await dbRun('DELETE FROM blog_posts WHERE id = ?', [blogId]);

    res.json({
      message: 'Blog post deleted successfully',
      blog: parseBlogPost(blog)
    });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({ error: 'Failed to delete blog post' });
  }
});

// GET /api/admin/dashboard - Get dashboard statistics
router.get('/dashboard', requireRole('admin', 'sale'), async (req, res) => {
  try {
    const adminUser = req.admin;

    // Helper function to safely execute queries
    const safeQuery = async (queryFn, fallback = null) => {
      try {
        return await queryFn();
      } catch (error) {
        console.warn('Query failed, using fallback:', error.message);
        return fallback;
      }
    };

    const [
      totalProducts,
      totalOrders,
      totalRevenue,
      feedbackCounts,
      blogCounts,
      customerAggregates,
      vipCountRow,
      recentFeedbackRows
    ] = await Promise.all([
      safeQuery(() => dbGet('SELECT COUNT(*) as count FROM products WHERE is_active = 1'), { count: 0 }),
      safeQuery(() => dbGet('SELECT COUNT(*) as count FROM orders'), { count: 0 }),
      safeQuery(() => dbGet("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status != 'cancelled'"), { total: 0 }),
      safeQuery(() => dbAll('SELECT status, COUNT(*) as count FROM customer_feedback GROUP BY status'), []),
      safeQuery(() => dbAll('SELECT is_published, COUNT(*) as count FROM blog_posts GROUP BY is_published'), []),
      safeQuery(() => dbAll(
        `SELECT
           LOWER(customer_email) AS email_key,
           MAX(customer_name) AS customer_name,
           MAX(customer_email) AS customer_email,
           MAX(customer_phone) AS customer_phone,
           COUNT(*) AS total_orders,
           SUM(total_amount) AS total_spent,
           MAX(created_at) AS last_order_at
         FROM orders
         GROUP BY LOWER(customer_email)`
      ), []),
      safeQuery(() => dbGet("SELECT COUNT(*) as count FROM customer_profiles WHERE vip_status != 'standard'"), { count: 0 }),
      safeQuery(() => dbAll('SELECT * FROM customer_feedback ORDER BY created_at DESC LIMIT 4'), [])
    ]);

    const recentOrderRows = await safeQuery(
      () => dbAll('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5'),
      []
    );

    const recentOrders = await Promise.all(
      recentOrderRows.map(async (order) => {
        try {
          const items = await dbAll(
            `SELECT oi.*, p.name as product_name, p.image_urls
             FROM order_items oi
             LEFT JOIN products p ON oi.product_id = p.id
             WHERE oi.order_id = ?`,
            [order.id]
          );

          return {
            ...order,
            items: items.map((item) => ({
              product_name: item.product_name,
              quantity: item.quantity,
              price_at_purchase: item.price_at_purchase,
              product_image: parseFirstImage(item.image_urls)
            }))
          };
        } catch (error) {
          console.warn(`Error fetching items for order ${order.id}:`, error.message);
          return {
            ...order,
            items: []
          };
        }
      })
    );

    const feedbackSummary = FEEDBACK_STATUSES.reduce(
      (acc, key) => {
        acc[key] = 0;
        return acc;
      },
      { total: 0 }
    );

    // Ensure feedbackCounts is an array
    const safeFeedbackCounts = Array.isArray(feedbackCounts) ? feedbackCounts : [];
    safeFeedbackCounts.forEach((row) => {
      if (row && feedbackSummary[row.status] !== undefined) {
        const count = Number(row.count || 0);
        feedbackSummary[row.status] = count;
      }
    });

    feedbackSummary.total = FEEDBACK_STATUSES.reduce((acc, key) => acc + feedbackSummary[key], 0);

    const blogSummary = {
      total: 0,
      published: 0,
      drafts: 0
    };

    // Ensure blogCounts is an array
    const safeBlogCounts = Array.isArray(blogCounts) ? blogCounts : [];
    safeBlogCounts.forEach((row) => {
      if (row) {
        const count = Number(row.count || 0);
        blogSummary.total += count;
        if (row.is_published) {
          blogSummary.published = count;
        } else {
          blogSummary.drafts = count;
        }
      }
    });

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    // Ensure customerAggregates is an array
    const safeCustomerAggregates = Array.isArray(customerAggregates) ? customerAggregates : [];
    const customerSummary = safeCustomerAggregates.reduce(
      (acc, row) => {
        if (!row) return acc;
        const totalOrders = Number(row.total_orders || 0);
        const totalSpent = Number(row.total_spent || 0);
        const lastOrderTime = row.last_order_at ? new Date(row.last_order_at).getTime() : null;

        acc.total_customers += 1;
        if (totalOrders > 1) {
          acc.repeat_customers += 1;
        }

        if (totalSpent >= 1000) {
          acc.high_value_customers += 1;
        }

        if (lastOrderTime && lastOrderTime >= thirtyDaysAgo) {
          acc.recent_customers += 1;
        }

        return acc;
      },
      {
        total_customers: 0,
        repeat_customers: 0,
        high_value_customers: 0,
        recent_customers: 0
      }
    );

    customerSummary.vip_customers = Number(vipCountRow?.count || 0);

    const topCustomers = safeCustomerAggregates
      .filter((row) => row && (row.customer_email || row.email_key))
      .sort((a, b) => Number(b.total_spent || 0) - Number(a.total_spent || 0))
      .slice(0, 5)
      .map((row) => mapCustomerRecord(row, { email: row.customer_email || row.email_key }))
      .filter(Boolean); // Remove any null results

    // Ensure recentFeedbackRows is an array
    const safeRecentFeedbackRows = Array.isArray(recentFeedbackRows) ? recentFeedbackRows : [];
    const recentFeedbacks = safeRecentFeedbackRows.map((row) => ({
      ...row,
      rating: row.rating === null || row.rating === undefined ? null : Number(row.rating)
    }));

    res.json({
      stats: {
        total_products: Number(totalProducts?.count || 0),
        total_orders: Number(totalOrders?.count || 0),
        total_revenue: Number(totalRevenue?.total || 0)
      },
      recent_orders: recentOrders,
      feedback_summary: feedbackSummary,
      blog_summary: blogSummary,
      customer_summary: customerSummary,
      top_customers: topCustomers,
      recent_feedbacks: recentFeedbacks,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router;
