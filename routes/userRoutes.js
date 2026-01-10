const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const upload = require('../middleware/upload');

const router = express.Router();

// Validation middleware
const validateUserInput = [
  body('fullName')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full Name must be between 2 and 100 characters')
    .trim(),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('mobile')
    .isLength({ min: 10, max: 15 })
    .withMessage('Mobile must be between 10 and 15 characters')
    .trim(),
  body('address')
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters')
    .trim(),
  body('joiningDate')
    .isISO8601()
    .withMessage('Joining Date must be a valid date'),
  body('dateOfBirth')
    .isISO8601()
    .withMessage('Date of Birth must be a valid date')
];

const validateUpdateUserInput = [
  body('fullName')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full Name must be between 2 and 100 characters')
    .trim(),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('mobile')
    .optional()
    .isLength({ min: 10, max: 15 })
    .withMessage('Mobile must be between 10 and 15 characters')
    .trim(),
  body('address')
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage('Address must be between 5 and 200 characters')
    .trim(),
  body('joiningDate')
    .optional()
    .isISO8601()
    .withMessage('Joining Date must be a valid date'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Date of Birth must be a valid date')
];

// Routes

// GET /api/users - List users
router.get('/', userController.getUsers);

// POST /api/users - Create user
router.post('/', upload.single('profilePic'), validateUserInput, userController.createUser);

// GET /api/users/:id - Get single user
router.get('/:id', userController.getUserById);

// PUT /api/users/:id - Update user
router.put('/:id', upload.single('profilePic'), validateUpdateUserInput, userController.updateUser);

// DELETE /api/users/:id - Delete user
router.delete('/:id', userController.deleteUser);

module.exports = router;