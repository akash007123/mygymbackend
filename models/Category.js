const mongoose = require('mongoose');
const { slugifyMiddleware } = require('../middleware/slugify');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    default: '#3b82f6' // Default blue color
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Slug generation middleware
categorySchema.pre('save', slugifyMiddleware(require('./Category')));

module.exports = mongoose.model('Category', categorySchema);