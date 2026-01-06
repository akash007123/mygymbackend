const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');

// Public routes
router.get('/:slug', tagController.getTagBySlug);
router.get('/', tagController.getTags);

// Admin routes
router.post('/', tagController.createTag);
router.put('/:id', tagController.updateTag);
router.delete('/:id', tagController.deleteTag);
router.get('/admin/:id', tagController.getTagById);

module.exports = router;