const Fee = require('../models/Fee');
const { validationResult } = require('express-validator');

// Get fees with pagination, filtering, and search
exports.getFees = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search
    } = req.query;

    // Build filter object
    const filter = {};

    // Search filter (user name)
    if (search) {
      filter.$or = [
        { 'user.fullName': { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const total = await Fee.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    // Fetch fees with filter, pagination, and sorting, populate user
    const fees = await Fee.find(filter)
      .populate('user', 'fullName profilePic')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      data: fees,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Get fees error:', error);
    res.status(500).json({ message: 'Failed to fetch fees' });
  }
};

// Get single fee by ID
exports.getFeeById = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id).populate('user', 'fullName profilePic');
    if (!fee) {
      return res.status(404).json({ message: 'Fee not found' });
    }

    res.json(fee);
  } catch (error) {
    console.error('Get fee by ID error:', error);
    res.status(500).json({ message: 'Failed to fetch fee' });
  }
};

// Create new fee
exports.createFee = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { user, totalFee, depositFee, depositDate } = req.body;

    const fee = new Fee({
      user,
      totalFee,
      depositFee,
      depositDate
    });

    await fee.save();

    // Populate user for response
    await fee.populate('user', 'fullName profilePic');

    // Emit Socket.IO event
    req.io.emit('feeCreated', {
      id: fee._id,
      user: fee.user,
      totalFee: fee.totalFee,
      depositFee: fee.depositFee,
      depositDate: fee.depositDate,
      createdAt: fee.createdAt
    });

    res.status(201).json({
      message: 'Fee created successfully',
      fee: {
        id: fee._id,
        user: fee.user,
        totalFee: fee.totalFee,
        depositFee: fee.depositFee,
        depositDate: fee.depositDate,
        createdAt: fee.createdAt
      }
    });
  } catch (error) {
    console.error('Create fee error:', error);
    res.status(500).json({ message: 'Failed to create fee' });
  }
};

// Update fee
exports.updateFee = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { user, totalFee, depositFee, depositDate } = req.body;
    const feeId = req.params.id;

    const fee = await Fee.findById(feeId);
    if (!fee) {
      return res.status(404).json({ message: 'Fee not found' });
    }

    // Update fields
    if (user) fee.user = user;
    if (totalFee !== undefined) fee.totalFee = totalFee;
    if (depositFee !== undefined) fee.depositFee = depositFee;
    if (depositDate) fee.depositDate = depositDate;

    await fee.save();

    // Populate user for response
    await fee.populate('user', 'fullName profilePic');

    // Emit Socket.IO event
    req.io.emit('feeUpdated', {
      id: fee._id,
      user: fee.user,
      totalFee: fee.totalFee,
      depositFee: fee.depositFee,
      depositDate: fee.depositDate,
      updatedAt: fee.updatedAt
    });

    res.json({
      message: 'Fee updated successfully',
      fee: {
        id: fee._id,
        user: fee.user,
        totalFee: fee.totalFee,
        depositFee: fee.depositFee,
        depositDate: fee.depositDate,
        updatedAt: fee.updatedAt
      }
    });
  } catch (error) {
    console.error('Update fee error:', error);
    res.status(500).json({ message: 'Failed to update fee' });
  }
};

// Delete fee
exports.deleteFee = async (req, res) => {
  try {
    const fee = await Fee.findByIdAndDelete(req.params.id);
    if (!fee) {
      return res.status(404).json({ message: 'Fee not found' });
    }

    // Emit Socket.IO event
    req.io.emit('feeDeleted', fee._id);

    res.json({ message: 'Fee deleted successfully' });
  } catch (error) {
    console.error('Delete fee error:', error);
    res.status(500).json({ message: 'Failed to delete fee' });
  }
};