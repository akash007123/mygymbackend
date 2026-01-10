const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');

const router = express.Router();

// Validation middleware for login
const validateLoginInput = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// POST /api/auth/login - Login
router.post('/login', validateLoginInput, userController.login);

module.exports = router;