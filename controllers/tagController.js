const Tag = require('../models/Tag');

// Get all tags
exports.getTags = async (req, res) => {
  try {
    const tags = await Tag.find().sort({ name: 1 });
    res.json(tags);
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ message: 'Failed to fetch tags' });
  }
};

// Get single tag by slug
exports.getTagBySlug = async (req, res) => {
  try {
    const tag = await Tag.findOne({ slug: req.params.slug });
    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }
    res.json(tag);
  } catch (error) {
    console.error('Get tag by slug error:', error);
    res.status(500).json({ message: 'Failed to fetch tag' });
  }
};

// Get single tag by ID
exports.getTagById = async (req, res) => {
  try {
    const tag = await Tag.findById(req.params.id);
    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }
    res.json(tag);
  } catch (error) {
    console.error('Get tag by ID error:', error);
    res.status(500).json({ message: 'Failed to fetch tag' });
  }
};

// Create new tag
exports.createTag = async (req, res) => {
  try {
    const { name, color } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Tag name is required' });
    }

    const tag = new Tag({
      name,
      color
    });

    await tag.save();
    res.status(201).json({
      message: 'Tag created successfully',
      tag
    });
  } catch (error) {
    console.error('Create tag error:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Tag name must be unique' });
    } else {
      res.status(500).json({ message: 'Failed to create tag' });
    }
  }
};

// Update tag
exports.updateTag = async (req, res) => {
  try {
    const { name, color } = req.body;

    const tag = await Tag.findById(req.params.id);
    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    if (name) tag.name = name;
    if (color) tag.color = color;

    await tag.save();
    res.json({
      message: 'Tag updated successfully',
      tag
    });
  } catch (error) {
    console.error('Update tag error:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Tag name must be unique' });
    } else {
      res.status(500).json({ message: 'Failed to update tag' });
    }
  }
};

// Delete tag
exports.deleteTag = async (req, res) => {
  try {
    const tag = await Tag.findByIdAndDelete(req.params.id);
    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Delete tag error:', error);
    res.status(500).json({ message: 'Failed to delete tag' });
  }
};