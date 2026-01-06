const mongoose = require('mongoose');
const { slugifyMiddleware } = require('../middleware/slugify');

const tagSchema = new mongoose.Schema({
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
  color: {
    type: String,
    default: '#6b7280' // Default gray color
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Slug generation middleware
tagSchema.pre('save', slugifyMiddleware(require('./Tag')));

module.exports = mongoose.model('Tag', tagSchema);