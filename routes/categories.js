const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// Public routes
router.get('/:slug', categoryController.getCategoryBySlug);
router.get('/', categoryController.getCategories);

// Admin routes
router.post('/', categoryController.createCategory);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);
router.get('/admin/:id', categoryController.getCategoryById);

module.exports = router;