const express = require('express');
const { body } = require('express-validator');
const feeController = require('../controllers/feeController');

const router = express.Router();

// Validation middleware
const validateFeeInput = [
  body('user')
    .isMongoId()
    .withMessage('User must be a valid ObjectId'),
  body('totalFee')
    .isFloat({ min: 0 })
    .withMessage('Total Fee must be a positive number'),
  body('depositFee')
    .isFloat({ min: 0 })
    .withMessage('Deposit Fee must be a non-negative number'),
  body('depositDate')
    .isISO8601()
    .withMessage('Deposit Date must be a valid date')
];

const validateUpdateFeeInput = [
  body('user')
    .optional()
    .isMongoId()
    .withMessage('User must be a valid ObjectId'),
  body('totalFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total Fee must be a positive number'),
  body('depositFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Deposit Fee must be a non-negative number'),
  body('depositDate')
    .optional()
    .isISO8601()
    .withMessage('Deposit Date must be a valid date')
];

// Routes

// GET /api/fees - List fees
router.get('/', feeController.getFees);

// POST /api/fees - Create fee
router.post('/', validateFeeInput, feeController.createFee);

// GET /api/fees/:id - Get single fee
router.get('/:id', feeController.getFeeById);

// PUT /api/fees/:id - Update fee
router.put('/:id', validateUpdateFeeInput, feeController.updateFee);

// DELETE /api/fees/:id - Delete fee
router.delete('/:id', feeController.deleteFee);

module.exports = router;