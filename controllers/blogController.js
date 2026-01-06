const mongoose = require('mongoose');
const Blog = require('../models/Blog');
const Category = require('../models/Category');
const Tag = require('../models/Tag');
const Author = require('../models/Author');

// Get all blogs with filtering, pagination, and search
exports.getBlogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      category,
      tag,
      author,
      search,
      featured,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    // Status filter
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Category filter
    if (category && category !== 'all') {
      filter.category = category;
    }

    // Tag filter
    if (tag) {
      filter.tags = tag;
    }

    // Author filter
    if (author) {
      filter.author = author;
    }

    // Featured filter
    if (featured === 'true') {
      filter.isFeatured = true;
    }

    // Search filter
    if (search) {
      filter.$text = { $search: search };
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get total count
    const total = await Blog.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    // Fetch blogs with population
    const blogs = await Blog.find(filter)
      .populate('author', 'name profileImage')
      .populate('category', 'name slug color')
      .populate('tags', 'name slug color')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    res.json({
      data: blogs,
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
    console.error('Get blogs error:', error);
    res.status(500).json({ message: 'Failed to fetch blogs' });
  }
};

// Get single blog by slug
exports.getBlogBySlug = async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug })
      .populate('author', 'name profileImage bio socialLinks')
      .populate('category', 'name slug color')
      .populate('tags', 'name slug color');

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Increment view count
    blog.views += 1;
    await blog.save();

    res.json(blog);
  } catch (error) {
    console.error('Get blog by slug error:', error);
    res.status(500).json({ message: 'Failed to fetch blog' });
  }
};

// Get single blog by ID (for admin)
exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate('author', 'name profileImage')
      .populate('category', 'name slug color')
      .populate('tags', 'name slug color');

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.json(blog);
  } catch (error) {
    console.error('Get blog by ID error:', error);
    res.status(500).json({ message: 'Failed to fetch blog' });
  }
};

// Create new blog
exports.createBlog = async (req, res) => {
  try {
    const {
      title,
      excerpt,
      content,
      sections,
      author,
      category,
      tags,
      status,
      isFeatured,
      seoTitle,
      seoDescription,
      seoKeywords
    } = req.body;

    // Validate required fields
    if (!title || !excerpt || !content || !author || !category) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Parse JSON fields
    let parsedSections = [];
    let parsedTags = [];
    let parsedSeoKeywords = [];

    try {
      if (sections) parsedSections = JSON.parse(sections);
      if (tags) parsedTags = JSON.parse(tags);
      if (seoKeywords) parsedSeoKeywords = JSON.parse(seoKeywords);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid JSON in sections, tags, or seoKeywords' });
    }

    // Assign section images
    if (parsedSections && parsedSections.length > 0 && req.files?.sectionImages) {
      parsedSections.forEach((section, index) => {
        if (req.files.sectionImages[index]) {
          section.image = req.files.sectionImages[index].path;
        }
      });
    }

    // Validate author exists
    const authorExists = await Author.findById(author);
    if (!authorExists) {
      return res.status(400).json({ message: 'Invalid author' });
    }

    // Validate category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    // Validate tags exist
    if (parsedTags && parsedTags.length > 0) {
      const tagExists = await Tag.find({ _id: { $in: parsedTags } });
      if (tagExists.length !== parsedTags.length) {
        return res.status(400).json({ message: 'Invalid tags' });
      }
    }

    const blog = new Blog({
      title,
      excerpt,
      content,
      sections: parsedSections || [],
      featuredImage: req.files?.featuredImage ? req.files.featuredImage[0].path : null,
      author,
      category,
      tags: parsedTags || [],
      status: status || 'draft',
      isFeatured: isFeatured || false,
      seoTitle,
      seoDescription,
      seoKeywords: parsedSeoKeywords || []
    });

    await blog.save();

    // Populate the created blog
    const populatedBlog = await Blog.findById(blog._id)
      .populate('author', 'name profileImage')
      .populate('category', 'name slug color')
      .populate('tags', 'name slug color');

    res.status(201).json({
      message: 'Blog created successfully',
      blog: populatedBlog
    });
  } catch (error) {
    console.error('Create blog error:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Blog title must be unique' });
    } else {
      res.status(500).json({ message: 'Failed to create blog' });
    }
  }
};

// Update blog
exports.updateBlog = async (req, res) => {
  try {
    const {
      title,
      excerpt,
      content,
      sections,
      author,
      category,
      tags,
      status,
      isFeatured,
      seoTitle,
      seoDescription,
      seoKeywords
    } = req.body;

    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Normalize existing string fields to ObjectIds for old blogs
    if (typeof blog.author === 'string') {
      const authorDoc = await Author.findOne({ name: blog.author });
      if (authorDoc) blog.author = authorDoc._id;
    }

    if (typeof blog.category === 'string') {
      const categoryDoc = await Category.findOne({ name: blog.category });
      if (categoryDoc) blog.category = categoryDoc._id;
    }

    if (Array.isArray(blog.tags) && blog.tags.length > 0 && typeof blog.tags[0] === 'string') {
      const tagIds = [];
      for (const tagName of blog.tags) {
        const tagDoc = await Tag.findOne({ name: tagName });
        if (tagDoc) tagIds.push(tagDoc._id);
      }
      blog.tags = tagIds;
    }

    // Validate and convert author if provided
    let authorId = author;
    if (author) {
      let authorExists;
      if (mongoose.Types.ObjectId.isValid(author)) {
        authorExists = await Author.findById(author);
      } else {
        authorExists = await Author.findOne({ name: author });
      }
      if (!authorExists) {
        return res.status(400).json({ message: 'Invalid author' });
      }
      authorId = authorExists._id;
    }

    // Validate and convert category if provided
    let categoryId = category;
    if (category) {
      let categoryExists;
      if (mongoose.Types.ObjectId.isValid(category)) {
        categoryExists = await Category.findById(category);
      } else {
        categoryExists = await Category.findOne({ name: category });
      }
      if (!categoryExists) {
        return res.status(400).json({ message: 'Invalid category' });
      }
      categoryId = categoryExists._id;
    }

    // Parse JSON fields for update
    let parsedSections = [];
    let parsedTags = [];
    let parsedSeoKeywords = [];

    try {
      if (sections) parsedSections = JSON.parse(sections);
      if (tags) parsedTags = JSON.parse(tags);
      if (seoKeywords) parsedSeoKeywords = JSON.parse(seoKeywords);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid JSON in sections, tags, or seoKeywords' });
    }

    // Assign section images
    if (parsedSections && parsedSections.length > 0 && req.files?.sectionImages) {
      parsedSections.forEach((section, index) => {
        if (req.files.sectionImages[index]) {
          section.image = req.files.sectionImages[index].path;
        }
      });
    }

    // Validate and convert tags if provided
    if (parsedTags && parsedTags.length > 0) {
      const tagIds = [];
      for (const tag of parsedTags) {
        if (mongoose.Types.ObjectId.isValid(tag)) {
          tagIds.push(tag);
        } else {
          const tagExists = await Tag.findOne({ name: tag });
          if (tagExists) {
            tagIds.push(tagExists._id);
          } else {
            return res.status(400).json({ message: `Invalid tag: ${tag}` });
          }
        }
      }
      parsedTags = tagIds;
    }

    // Update fields
    if (title) blog.title = title;
    if (excerpt) blog.excerpt = excerpt;
    if (content) blog.content = content;
    if (parsedSections) blog.sections = parsedSections;
    if (req.files?.featuredImage) blog.featuredImage = req.files.featuredImage[0].path;
    if (authorId) blog.author = authorId;
    if (categoryId) blog.category = categoryId;
    if (parsedTags) blog.tags = parsedTags;
    if (status) blog.status = status;
    if (isFeatured !== undefined) blog.isFeatured = isFeatured;
    if (seoTitle !== undefined) blog.seoTitle = seoTitle;
    if (seoDescription !== undefined) blog.seoDescription = seoDescription;
    if (parsedSeoKeywords) blog.seoKeywords = parsedSeoKeywords;

    await blog.save();

    // Populate the updated blog
    const populatedBlog = await Blog.findById(blog._id)
      .populate('author', 'name profileImage')
      .populate('category', 'name slug color')
      .populate('tags', 'name slug color');

    res.json({
      message: 'Blog updated successfully',
      blog: populatedBlog
    });
  } catch (error) {
    console.error('Update blog error:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Blog title must be unique' });
    } else {
      res.status(500).json({ message: 'Failed to update blog' });
    }
  }
};

// Delete blog
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({ message: 'Failed to delete blog' });
  }
};

// Get featured blogs
exports.getFeaturedBlogs = async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const blogs = await Blog.find({
      status: 'published',
      isFeatured: true
    })
      .populate('author', 'name profileImage')
      .populate('category', 'name slug color')
      .populate('tags', 'name slug color')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(blogs);
  } catch (error) {
    console.error('Get featured blogs error:', error);
    res.status(500).json({ message: 'Failed to fetch featured blogs' });
  }
};

// Get blogs by category
exports.getBlogsByCategory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const categorySlug = req.params.categorySlug;

    const category = await Category.findOne({ slug: categorySlug });
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const filter = {
      category: category._id,
      status: 'published'
    };

    const total = await Blog.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    const blogs = await Blog.find(filter)
      .populate('author', 'name profileImage')
      .populate('category', 'name slug color')
      .populate('tags', 'name slug color')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      data: blogs,
      category,
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
    console.error('Get blogs by category error:', error);
    res.status(500).json({ message: 'Failed to fetch blogs by category' });
  }
};

// Get blogs by tag
exports.getBlogsByTag = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const tagSlug = req.params.tagSlug;

    const tag = await Tag.findOne({ slug: tagSlug });
    if (!tag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const filter = {
      tags: tag._id,
      status: 'published'
    };

    const total = await Blog.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    const blogs = await Blog.find(filter)
      .populate('author', 'name profileImage')
      .populate('category', 'name slug color')
      .populate('tags', 'name slug color')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.json({
      data: blogs,
      tag,
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
    console.error('Get blogs by tag error:', error);
    res.status(500).json({ message: 'Failed to fetch blogs by tag' });
  }
};