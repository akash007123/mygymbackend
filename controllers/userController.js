const User = require('../models/User');
const { validationResult } = require('express-validator');

// Get users with pagination, filtering, and search
exports.getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search
    } = req.query;

    // Build filter object
    const filter = {};

    // Search filter (fullName or email)
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const total = await User.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    // Fetch users with filter, pagination, and sorting
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      data: users,
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
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// Get single user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
};

// Create new user
exports.createUser = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, email, mobile, address, joiningDate, dateOfBirth } = req.body;

    const user = new User({
      fullName,
      email,
      mobile,
      address,
      joiningDate,
      dateOfBirth,
      profilePic: req.file ? req.file.filename : null
    });

    await user.save();

    // Emit Socket.IO event
    req.io.emit('userCreated', {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      mobile: user.mobile,
      address: user.address,
      profilePic: user.profilePic,
      joiningDate: user.joiningDate,
      dateOfBirth: user.dateOfBirth,
      createdAt: user.createdAt
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        address: user.address,
        profilePic: user.profilePic,
        joiningDate: user.joiningDate,
        dateOfBirth: user.dateOfBirth,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Email already exists' });
    } else {
      res.status(500).json({ message: 'Failed to create user' });
    }
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, email, mobile, address, joiningDate, dateOfBirth } = req.body;
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    if (fullName) user.fullName = fullName;
    if (email) user.email = email;
    if (mobile) user.mobile = mobile;
    if (address) user.address = address;
    if (joiningDate) user.joiningDate = joiningDate;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (req.file) user.profilePic = req.file.filename;

    await user.save();

    // Emit Socket.IO event
    req.io.emit('userUpdated', {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      mobile: user.mobile,
      address: user.address,
      profilePic: user.profilePic,
      joiningDate: user.joiningDate,
      dateOfBirth: user.dateOfBirth,
      updatedAt: user.updatedAt
    });

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        address: user.address,
        profilePic: user.profilePic,
        joiningDate: user.joiningDate,
        dateOfBirth: user.dateOfBirth,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Email already exists' });
    } else {
      res.status(500).json({ message: 'Failed to update user' });
    }
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Emit Socket.IO event
    req.io.emit('userDeleted', user._id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};
