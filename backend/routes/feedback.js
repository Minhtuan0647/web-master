const express = require('express');
const { body, validationResult } = require('express-validator');
const { dbRun, dbGet, dbAll } = require('../config/database');

const router = express.Router();

// POST /api/feedback - Create new feedback from website
// Public endpoint - no authentication required
router.post('/', [
  body('customer_name').optional().trim().isLength({ min: 2, max: 255 }).withMessage('Tên phải có từ 2-255 ký tự'),
  body('customer_email').optional().isEmail().normalizeEmail().withMessage('Email không hợp lệ'),
  body('customer_phone').optional().trim().isLength({ min: 9, max: 20 }).withMessage('Số điện thoại phải có từ 9-20 ký tự'),
  body('message').notEmpty().trim().isLength({ min: 10, max: 5000 }).withMessage('Nội dung phản hồi phải có từ 10-5000 ký tự'),
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Đánh giá phải từ 1-5 sao')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }

    const {
      customer_name,
      customer_email,
      customer_phone,
      message,
      rating
    } = req.body;

    // At least one contact method should be provided
    if (!customer_name && !customer_email && !customer_phone) {
      return res.status(400).json({ 
        error: 'Vui lòng cung cấp ít nhất một thông tin liên hệ (tên, email hoặc số điện thoại)'
      });
    }

    // Insert feedback into database
    // Status is automatically set to 'new' by default
    const result = await dbRun(
      `INSERT INTO customer_feedback (customer_name, customer_email, customer_phone, message, rating, status)
       VALUES (?, ?, ?, ?, ?, 'new')`,
      [
        customer_name || null,
        customer_email ? customer_email.toLowerCase() : null,
        customer_phone || null,
        message.trim(),
        rating ? Number(rating) : null
      ]
    );

    // Fetch the created feedback
    const feedback = await dbGet('SELECT * FROM customer_feedback WHERE id = ?', [result.lastID]);

    res.status(201).json({
      message: 'Cảm ơn bạn đã gửi phản hồi! Chúng tôi sẽ xem xét và phản hồi sớm nhất có thể.',
      success: true,
      feedback: {
        id: feedback.id,
        customer_name: feedback.customer_name,
        customer_email: feedback.customer_email,
        customer_phone: feedback.customer_phone,
        message: feedback.message,
        rating: feedback.rating ? Number(feedback.rating) : null,
        status: feedback.status,
        created_at: feedback.created_at
      }
    });

  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({ 
      error: 'Không thể gửi phản hồi. Vui lòng thử lại sau.',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/feedback - Get public feedback (optional - for displaying testimonials)
// This endpoint can be used to display published/approved feedback on the website
router.get('/', [
  // Optional query parameters for filtering
], async (req, res) => {
  try {
    const { limit = 10, rating } = req.query;
    const limitNumber = Math.min(parseInt(limit, 10) || 10, 50); // Max 50 items

    let query = 'SELECT id, customer_name, message, rating, created_at FROM customer_feedback WHERE status = ?';
    const params = ['resolved']; // Only show resolved/approved feedback

    if (rating) {
      const ratingNum = parseInt(rating, 10);
      if (ratingNum >= 1 && ratingNum <= 5) {
        query += ' AND rating = ?';
        params.push(ratingNum);
      }
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limitNumber);

    const feedbacks = await dbAll(query, params);

    res.json({
      success: true,
      count: feedbacks.length,
      feedbacks: feedbacks.map(fb => ({
        id: fb.id,
        customer_name: fb.customer_name || 'Khách hàng',
        message: fb.message,
        rating: fb.rating ? Number(fb.rating) : null,
        created_at: fb.created_at
      }))
    });

  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ 
      error: 'Không thể tải phản hồi',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;

