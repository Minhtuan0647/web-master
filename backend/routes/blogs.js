const express = require('express');
const { query, param } = require('express-validator');
const { validationResult } = require('express-validator');
const { dbAll, dbGet } = require('../config/database');
const router = express.Router();

const parseBlogPost = (post) => {
  if (!post) return null;

  return {
    ...post,
    is_published: Boolean(post.is_published)
  };
};

// GET /api/blogs - Get all published blog posts
router.get('/', [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('page').optional().isInt({ min: 1 }),
  query('search').optional().trim().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { limit = 20, page = 1, search = '' } = req.query;
    const limitNumber = parseInt(limit, 10) || 20;
    const pageNumber = parseInt(page, 10) || 1;
    const offset = (pageNumber - 1) * limitNumber;

    const filters = ['CAST(is_published AS INTEGER) = 1']; // Only show published posts
    const params = [];

    if (search) {
      const term = `%${search.toLowerCase()}%`;
      filters.push('(LOWER(title) LIKE ? OR LOWER(slug) LIKE ? OR LOWER(author) LIKE ? OR LOWER(excerpt) LIKE ?)');
      params.push(term, term, term, term);
    }

    const whereClause = `WHERE ${filters.join(' AND ')}`;

    const [blogRows, totalCountRow] = await Promise.all([
      dbAll(
        `SELECT * FROM blog_posts ${whereClause} ORDER BY published_at DESC, created_at DESC LIMIT ? OFFSET ?`,
        [...params, limitNumber, offset]
      ),
      dbGet(
        `SELECT COUNT(*) as count FROM blog_posts ${whereClause}`,
        params
      )
    ]);

    const blogs = blogRows.map(parseBlogPost);
    const totalCount = Number(totalCountRow?.count || 0);

    res.json({
      blogs,
      pagination: {
        current_page: pageNumber,
        total_pages: Math.ceil(totalCount / limitNumber),
        total_count: totalCount,
        limit: limitNumber
      }
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

// GET /api/blogs/:slug - Get single published blog post by slug
router.get('/:slug', [
  param('slug').trim().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { slug } = req.params;

    const blog = await dbGet(
      'SELECT * FROM blog_posts WHERE slug = ? AND CAST(is_published AS INTEGER) = 1',
      [slug]
    );

    if (!blog) {
      return res.status(404).json({ error: 'Blog post not found' });
    }

    res.json(parseBlogPost(blog));
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).json({ error: 'Failed to fetch blog post' });
  }
});

module.exports = router;

