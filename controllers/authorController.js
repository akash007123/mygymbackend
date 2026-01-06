const Author = require('../models/Author');

// Get all authors
exports.getAuthors = async (req, res) => {
  try {
    const authors = await Author.find({ isActive: true }).sort({ name: 1 });
    res.json(authors);
  } catch (error) {
    console.error('Get authors error:', error);
    res.status(500).json({ message: 'Failed to fetch authors' });
  }
};

// Get single author by ID
exports.getAuthorById = async (req, res) => {
  try {
    const author = await Author.findById(req.params.id);
    if (!author) {
      return res.status(404).json({ message: 'Author not found' });
    }
    res.json(author);
  } catch (error) {
    console.error('Get author by ID error:', error);
    res.status(500).json({ message: 'Failed to fetch author' });
  }
};

// Create new author
exports.createAuthor = async (req, res) => {
  try {
    const { name, email, bio, profileImage, role, socialLinks } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and email are required' });
    }

    const author = new Author({
      name,
      email,
      bio,
      profileImage,
      role: role || 'author',
      socialLinks: socialLinks || {}
    });

    await author.save();
    res.status(201).json({
      message: 'Author created successfully',
      author
    });
  } catch (error) {
    console.error('Create author error:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Email must be unique' });
    } else {
      res.status(500).json({ message: 'Failed to create author' });
    }
  }
};

// Update author
exports.updateAuthor = async (req, res) => {
  try {
    const { name, email, bio, profileImage, role, socialLinks, isActive } = req.body;

    const author = await Author.findById(req.params.id);
    if (!author) {
      return res.status(404).json({ message: 'Author not found' });
    }

    if (name) author.name = name;
    if (email) author.email = email;
    if (bio !== undefined) author.bio = bio;
    if (profileImage !== undefined) author.profileImage = profileImage;
    if (role) author.role = role;
    if (socialLinks) author.socialLinks = socialLinks;
    if (isActive !== undefined) author.isActive = isActive;

    await author.save();
    res.json({
      message: 'Author updated successfully',
      author
    });
  } catch (error) {
    console.error('Update author error:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Email must be unique' });
    } else {
      res.status(500).json({ message: 'Failed to update author' });
    }
  }
};

// Delete author (soft delete by setting isActive to false)
exports.deleteAuthor = async (req, res) => {
  try {
    const author = await Author.findById(req.params.id);
    if (!author) {
      return res.status(404).json({ message: 'Author not found' });
    }

    author.isActive = false;
    await author.save();

    res.json({ message: 'Author deactivated successfully' });
  } catch (error) {
    console.error('Delete author error:', error);
    res.status(500).json({ message: 'Failed to delete author' });
  }
};