const express = require('express');
const { body, validationResult, query } = require('express-validator');
const { dbAll, dbGet } = require('../config/database');
const router = express.Router();

// GET /api/products - Get all products with filtering and search
router.get('/', [
  query('search').optional().isString().trim(),
  query('brand').optional().isString().trim(),
  query('category').optional().isString().trim(),
  query('gender').optional().isString().trim().isIn(['male', 'female', 'unisex', '']),
  query('product_type').optional().isString().trim().isIn(['full_bottle', 'decant', 'sample', 'gift_set', '']),
  query('concentration').optional().isString().trim(),
  query('min_price').optional().custom((value) => {
    if (value === '' || value === null || value === undefined) return true;
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0;
  }),
  query('max_price').optional().custom((value) => {
    if (value === '' || value === null || value === undefined) return true;
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0;
  }),
  query('volume').optional().custom((value) => {
    if (value === '' || value === null || value === undefined) return true;
    const num = parseInt(value);
    return !isNaN(num) && num >= 1;
  }),
  query('featured').optional().custom((value) => {
    if (value === '' || value === null || value === undefined) return true;
    return value === 'true' || value === 'false';
  }),
  query('new_arrival').optional().custom((value) => {
    if (value === '' || value === null || value === undefined) return true;
    return value === 'true' || value === 'false';
  }),
  query('on_sale').optional().custom((value) => {
    if (value === '' || value === null || value === undefined) return true;
    return value === 'true' || value === 'false';
  }),
  query('sort').optional().isString().trim().isIn(['newest', 'oldest', 'price_asc', 'price_desc', 'name_asc', 'name_desc', 'bestseller', '']),
  query('page').optional().custom((value) => {
    if (value === '' || value === null || value === undefined) return true;
    const num = parseInt(value);
    return !isNaN(num) && num >= 1;
  }),
  query('limit').optional().custom((value) => {
    if (value === '' || value === null || value === undefined) return true;
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 100;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      search,
      brand,
      category,
      gender,
      product_type,
      concentration,
      min_price,
      max_price,
      volume,
      featured,
      new_arrival,
      on_sale,
      sort,
      page = 1,
      limit = 12
    } = req.query;

    let sql = 'SELECT * FROM products WHERE is_active = 1';
    const params = [];

    // Add search filter
    if (search) {
      sql += ' AND (name LIKE ? OR brand LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Add brand filter
    if (brand) {
      sql += ' AND brand = ?';
      params.push(brand);
    }

    // Add category filter
    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    // Add gender filter
    if (gender) {
      sql += ' AND gender = ?';
      params.push(gender);
    }

    // Add product_type filter
    if (product_type) {
      sql += ' AND product_type = ?';
      params.push(product_type);
    }

    // Add concentration filter
    if (concentration) {
      sql += ' AND concentration = ?';
      params.push(concentration);
    }

    // Add price range filter
    if (min_price) {
      sql += ' AND price >= ?';
      params.push(min_price);
    }

    if (max_price) {
      sql += ' AND price <= ?';
      params.push(max_price);
    }

    // Add volume filter
    if (volume) {
      sql += ' AND volume_ml = ?';
      params.push(volume);
    }

    // Add featured filter
    if (featured === 'true') {
      sql += ' AND is_featured = 1';
    }

    // Add new_arrival filter
    if (new_arrival === 'true') {
      sql += ' AND is_new_arrival = 1';
    }

    // Add on_sale filter
    if (on_sale === 'true') {
      sql += ' AND is_on_sale = 1';
    }

    // Add ordering
    switch (sort) {
      case 'newest':
        sql += ' ORDER BY created_at DESC';
        break;
      case 'oldest':
        sql += ' ORDER BY created_at ASC';
        break;
      case 'price_asc':
        sql += ' ORDER BY price ASC';
        break;
      case 'price_desc':
        sql += ' ORDER BY price DESC';
        break;
      case 'name_asc':
        sql += ' ORDER BY name ASC';
        break;
      case 'name_desc':
        sql += ' ORDER BY name DESC';
        break;
      case 'bestseller':
        sql += ' ORDER BY is_featured DESC, created_at DESC';
        break;
      default:
        sql += ' ORDER BY created_at DESC';
    }
    
    const offset = (page - 1) * limit;
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const products = await dbAll(sql, params);

    // Get total count for pagination
    let countSql = 'SELECT COUNT(*) as total FROM products WHERE is_active = 1';
    const countParams = [];
    
    if (search) {
      countSql += ' AND (name LIKE ? OR brand LIKE ? OR description LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (brand) {
      countSql += ' AND brand = ?';
      countParams.push(brand);
    }
    if (category) {
      countSql += ' AND category = ?';
      countParams.push(category);
    }
    if (gender) {
      countSql += ' AND gender = ?';
      countParams.push(gender);
    }
    if (product_type) {
      countSql += ' AND product_type = ?';
      countParams.push(product_type);
    }
    if (concentration) {
      countSql += ' AND concentration = ?';
      countParams.push(concentration);
    }
    if (min_price) {
      countSql += ' AND price >= ?';
      countParams.push(min_price);
    }
    if (max_price) {
      countSql += ' AND price <= ?';
      countParams.push(max_price);
    }
    if (volume) {
      countSql += ' AND volume_ml = ?';
      countParams.push(volume);
    }
    if (featured === 'true') {
      countSql += ' AND is_featured = 1';
    }
    if (new_arrival === 'true') {
      countSql += ' AND is_new_arrival = 1';
    }
    if (on_sale === 'true') {
      countSql += ' AND is_on_sale = 1';
    }

    const countResult = await dbGet(countSql, countParams);
    const total = countResult.total;

    // Parse JSON fields
    const processedProducts = products.map(product => ({
      ...product,
      image_urls: JSON.parse(product.image_urls || '[]'),
      scent_notes: JSON.parse(product.scent_notes || '{}'),
      is_featured: Boolean(product.is_featured),
      is_new_arrival: Boolean(product.is_new_arrival),
      is_on_sale: Boolean(product.is_on_sale),
      is_active: Boolean(product.is_active)
    }));

    res.json({
      products: processedProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total_count: total,
        total_pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/products/brands/list - Get all brands
router.get('/brands/list', async (req, res) => {
  try {
    const brands = await dbAll('SELECT DISTINCT brand FROM products WHERE is_active = 1 ORDER BY brand');
    res.json(brands.map(row => row.brand));
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/products/categories/list - Get all categories
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await dbAll('SELECT DISTINCT category FROM products WHERE is_active = 1 ORDER BY category');
    res.json(categories.map(row => row.category));
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/products/genders/list - Get all genders
router.get('/genders/list', async (req, res) => {
  try {
    const genders = await dbAll('SELECT DISTINCT gender FROM products WHERE is_active = 1 AND gender IS NOT NULL ORDER BY gender');
    res.json(genders.map(row => row.gender));
  } catch (error) {
    console.error('Error fetching genders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/products/product-types/list - Get all product types
router.get('/product-types/list', async (req, res) => {
  try {
    const types = await dbAll('SELECT DISTINCT product_type FROM products WHERE is_active = 1 AND product_type IS NOT NULL ORDER BY product_type');
    res.json(types.map(row => row.product_type));
  } catch (error) {
    console.error('Error fetching product types:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/products/:id - Get single product
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await dbGet('SELECT * FROM products WHERE id = ? AND is_active = 1', [id]);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Parse JSON fields
    const processedProduct = {
      ...product,
      image_urls: JSON.parse(product.image_urls || '[]'),
      scent_notes: JSON.parse(product.scent_notes || '{}'),
      is_featured: Boolean(product.is_featured),
      is_new_arrival: Boolean(product.is_new_arrival),
      is_on_sale: Boolean(product.is_on_sale),
      is_active: Boolean(product.is_active)
    };

    res.json(processedProduct);

  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
