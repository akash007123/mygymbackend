const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { uploadFields } = require('../middleware/upload');

// Public routes
router.get('/featured', blogController.getFeaturedBlogs);
router.get('/category/:categorySlug', blogController.getBlogsByCategory);
router.get('/tag/:tagSlug', blogController.getBlogsByTag);
router.get('/:slug', blogController.getBlogBySlug);
router.get('/', blogController.getBlogs);

// Admin routes (would need authentication middleware in production)
router.post('/', uploadFields, blogController.createBlog);

router.put('/:id', uploadFields, blogController.updateBlog);

router.delete('/:id', blogController.deleteBlog);
router.get('/admin/:id', blogController.getBlogById);

module.exports = router;