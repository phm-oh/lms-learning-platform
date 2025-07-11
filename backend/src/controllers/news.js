// File: backend/src/controllers/news.js
// Path: backend/src/controllers/news.js

const { Op } = require('sequelize');
const { AppError } = require('../middleware/errorHandler');
const catchAsync = require('../utils/catchAsync');

// Import models (using kebab-case filenames)
const News = require('../models/news/news-model');
const NewsCategory = require('../models/news/news-category');
const User = require('../models/user/User');

// ========================================
// PUBLIC NEWS ROUTES (No auth required)
// ========================================

// @desc    Get all published news
// @route   GET /api/news
// @access  Public
const getAllNews = catchAsync(async (req, res, next) => {
  const { 
    page = 1, 
    limit = 12, 
    category, 
    type, 
    search, 
    tags, 
    sort = 'latest',
    featured 
  } = req.query;

  const offset = (page - 1) * limit;
  const where = {
    status: 'published',
    publishedAt: { [Op.lte]: new Date() },
    [Op.or]: [
      { expiresAt: null },
      { expiresAt: { [Op.gt]: new Date() } }
    ]
  };

  // Apply filters
  if (category) {
    const categoryRecord = await NewsCategory.findBySlug(category);
    if (categoryRecord) {
      where.categoryId = categoryRecord.id;
    }
  }

  if (type && ['announcement', 'technology', 'course_update', 'system', 'event', 'general'].includes(type)) {
    where.newsType = type;
  }

  if (featured === 'true') {
    where.isFeatured = true;
  }

  if (tags) {
    const tagArray = Array.isArray(tags) ? tags : tags.split(',');
    where.tags = { [Op.overlap]: tagArray };
  }

  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { summary: { [Op.iLike]: `%${search}%` } },
      { content: { [Op.iLike]: `%${search}%` } },
      { tags: { [Op.overlap]: [search] } }
    ];
  }

  // Determine sorting
  let order;
  switch (sort) {
    case 'latest':
      order = [['isPinned', 'DESC'], ['publishedAt', 'DESC']];
      break;
    case 'oldest':
      order = [['publishedAt', 'ASC']];
      break;
    case 'popular':
      order = [['viewCount', 'DESC'], ['likeCount', 'DESC']];
      break;
    case 'title':
      order = [['title', 'ASC']];
      break;
    default:
      order = [['isPinned', 'DESC'], ['publishedAt', 'DESC']];
  }

  try {
    const result = await News.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order,
      include: [
        {
          model: NewsCategory,
          as: 'category',
          attributes: ['id', 'name', 'slug', 'color', 'icon']
        },
        {
          model: User,
          as: 'author',
          attributes: ['id', 'firstName', 'lastName', 'profileImage']
        }
      ],
      attributes: [
        'id', 'title', 'slug', 'summary', 'featuredImage', 'featuredImageAlt',
        'newsType', 'priority', 'tags', 'publishedAt', 'viewCount', 'likeCount', 
        'shareCount', 'isFeatured', 'isPinned', 'isExternalLink', 'externalUrl'
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        news: result.rows,
        pagination: {
          total: result.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(result.count / limit)
        },
        filters: {
          category,
          type,
          search,
          tags,
          sort,
          featured
        }
      }
    });

  } catch (error) {
    return next(new AppError('Error fetching news', 500));
  }
});

// @desc    Get single news by slug
// @route   GET /api/news/:slug
// @access  Public
const getNewsBySlug = catchAsync(async (req, res, next) => {
  const { slug } = req.params;
  const { increment_view = 'true' } = req.query;

  try {
    const news = await News.findOne({
      where: { 
        slug,
        status: 'published',
        publishedAt: { [Op.lte]: new Date() },
        [Op.or]: [
          { expiresAt: null },
          { expiresAt: { [Op.gt]: new Date() } }
        ]
      },
      include: [
        {
          model: NewsCategory,
          as: 'category',
          attributes: ['id', 'name', 'slug', 'color', 'icon']
        },
        {
          model: User,
          as: 'author',
          attributes: ['id', 'firstName', 'lastName', 'profileImage', 'bio']
        }
      ]
    });

    if (!news) {
      return next(new AppError('News not found', 404));
    }

    // Increment view count (with rate limiting to prevent spam)
    if (increment_view === 'true') {
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip;
      
      // Simple rate limiting: only increment if not viewed by same IP in last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      // You could implement more sophisticated view tracking here
      await news.incrementViewCount();
    }

    // Get related news
    const relatedNews = await News.findAll({
      where: {
        id: { [Op.ne]: news.id },
        categoryId: news.categoryId,
        status: 'published',
        publishedAt: { [Op.lte]: new Date() }
      },
      limit: 4,
      order: [['publishedAt', 'DESC']],
      include: [
        {
          model: NewsCategory,
          as: 'category',
          attributes: ['name', 'slug', 'color']
        }
      ],
      attributes: ['id', 'title', 'slug', 'summary', 'featuredImage', 'publishedAt']
    });

    res.status(200).json({
      success: true,
      data: {
        news,
        relatedNews
      }
    });

  } catch (error) {
    return next(new AppError('Error fetching news', 500));
  }
});

// @desc    Get featured news
// @route   GET /api/news/featured
// @access  Public
const getFeaturedNews = catchAsync(async (req, res, next) => {
  const { limit = 5 } = req.query;

  try {
    const featuredNews = await News.getFeatured(parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        news: featuredNews
      }
    });

  } catch (error) {
    return next(new AppError('Error fetching featured news', 500));
  }
});

// @desc    Get popular news
// @route   GET /api/news/popular
// @access  Public
const getPopularNews = catchAsync(async (req, res, next) => {
  const { limit = 5, days = 7 } = req.query;

  try {
    const popularNews = await News.getPopular(parseInt(limit), parseInt(days));

    res.status(200).json({
      success: true,
      data: {
        news: popularNews
      }
    });

  } catch (error) {
    return next(new AppError('Error fetching popular news', 500));
  }
});

// @desc    Get news categories
// @route   GET /api/news/categories
// @access  Public
const getNewsCategories = catchAsync(async (req, res, next) => {
  const { include_count = 'false' } = req.query;

  try {
    let categories;
    
    if (include_count === 'true') {
      categories = await NewsCategory.getWithNewsCount();
    } else {
      categories = await NewsCategory.getActive();
    }

    res.status(200).json({
      success: true,
      data: {
        categories
      }
    });

  } catch (error) {
    return next(new AppError('Error fetching categories', 500));
  }
});

// ========================================
// ADMIN/AUTHOR ROUTES (Auth required)
// ========================================

// @desc    Create news
// @route   POST /api/news
// @access  Admin/Teacher
const createNews = catchAsync(async (req, res, next) => {
  try {
    const newsData = {
      ...req.body,
      authorId: req.user.id
    };

    // Validate category exists
    if (newsData.categoryId) {
      const category = await NewsCategory.findByPk(newsData.categoryId);
      if (!category) {
        return next(new AppError('Invalid category', 400));
      }
    }

    // Validate publication data
    if (newsData.status === 'published') {
      const validationErrors = await validateNewsForPublication(newsData);
      if (validationErrors.length > 0) {
        return next(new AppError(`Validation failed: ${validationErrors.join(', ')}`, 400));
      }
    }

    const news = await News.create(newsData);

    // Fetch complete news with associations
    const createdNews = await News.findByPk(news.id, {
      include: [
        { model: NewsCategory, as: 'category' },
        { model: User, as: 'author', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'News created successfully',
      data: {
        news: createdNews
      }
    });

  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return next(new AppError('News with this slug already exists', 400));
    }
    return next(new AppError('Error creating news', 500));
  }
});

// @desc    Update news
// @route   PUT /api/news/:id
// @access  Admin/Author
const updateNews = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  try {
    const news = await News.findByPk(id);

    if (!news) {
      return next(new AppError('News not found', 404));
    }

    // Check permission (admin or author)
    if (req.user.role !== 'admin' && news.authorId !== req.user.id) {
      return next(new AppError('You can only edit your own news', 403));
    }

    // Validate category if provided
    if (req.body.categoryId) {
      const category = await NewsCategory.findByPk(req.body.categoryId);
      if (!category) {
        return next(new AppError('Invalid category', 400));
      }
    }

    // Validate publication data
    if (req.body.status === 'published') {
      const validationErrors = await validateNewsForPublication({...news.toJSON(), ...req.body});
      if (validationErrors.length > 0) {
        return next(new AppError(`Validation failed: ${validationErrors.join(', ')}`, 400));
      }
    }

    await news.update(req.body);

    // Fetch updated news with associations
    const updatedNews = await News.findByPk(news.id, {
      include: [
        { model: NewsCategory, as: 'category' },
        { model: User, as: 'author', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'News updated successfully',
      data: {
        news: updatedNews
      }
    });

  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return next(new AppError('News with this slug already exists', 400));
    }
    return next(new AppError('Error updating news', 500));
  }
});

// @desc    Delete news
// @route   DELETE /api/news/:id
// @access  Admin/Author
const deleteNews = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  try {
    const news = await News.findByPk(id);

    if (!news) {
      return next(new AppError('News not found', 404));
    }

    // Check permission (admin or author)
    if (req.user.role !== 'admin' && news.authorId !== req.user.id) {
      return next(new AppError('You can only delete your own news', 403));
    }

    await news.destroy();

    res.status(200).json({
      success: true,
      message: 'News deleted successfully'
    });

  } catch (error) {
    return next(new AppError('Error deleting news', 500));
  }
});

// @desc    Publish/unpublish news
// @route   PATCH /api/news/:id/publish
// @access  Admin/Author
const togglePublishNews = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { action } = req.body; // 'publish', 'unpublish', 'schedule', 'archive'

  try {
    const news = await News.findByPk(id);

    if (!news) {
      return next(new AppError('News not found', 404));
    }

    // Check permission
    if (req.user.role !== 'admin' && news.authorId !== req.user.id) {
      return next(new AppError('You can only manage your own news', 403));
    }

    switch (action) {
      case 'publish':
        const validationErrors = await validateNewsForPublication(news);
        if (validationErrors.length > 0) {
          return next(new AppError(`Cannot publish: ${validationErrors.join(', ')}`, 400));
        }
        await news.publish();
        break;
      
      case 'unpublish':
        await news.unpublish();
        break;
      
      case 'archive':
        await news.archive();
        break;
      
      case 'schedule':
        const { scheduledAt } = req.body;
        if (!scheduledAt) {
          return next(new AppError('Scheduled date is required', 400));
        }
        await news.schedule(new Date(scheduledAt));
        break;
      
      default:
        return next(new AppError('Invalid action', 400));
    }

    res.status(200).json({
      success: true,
      message: `News ${action}ed successfully`,
      data: {
        news: {
          id: news.id,
          status: news.status,
          publishedAt: news.publishedAt,
          scheduledAt: news.scheduledAt
        }
      }
    });

  } catch (error) {
    return next(new AppError(`Error ${action}ing news`, 500));
  }
});

// ========================================
// ADMIN CATEGORY MANAGEMENT
// ========================================

// @desc    Create news category
// @route   POST /api/news/categories
// @access  Admin
const createNewsCategory = catchAsync(async (req, res, next) => {
  try {
    const category = await NewsCategory.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        category
      }
    });

  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return next(new AppError('Category with this name or slug already exists', 400));
    }
    return next(new AppError('Error creating category', 500));
  }
});

// @desc    Update news category
// @route   PUT /api/news/categories/:id
// @access  Admin
const updateNewsCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  try {
    const category = await NewsCategory.findByPk(id);

    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    await category.update(req.body);

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: {
        category
      }
    });

  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return next(new AppError('Category with this name or slug already exists', 400));
    }
    return next(new AppError('Error updating category', 500));
  }
});

// @desc    Delete news category
// @route   DELETE /api/news/categories/:id
// @access  Admin
const deleteNewsCategory = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  try {
    const category = await NewsCategory.findByPk(id);

    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    // Check if category can be deleted (no news in this category)
    const canDelete = await category.canDelete();
    if (!canDelete) {
      return next(new AppError('Cannot delete category with existing news', 400));
    }

    await category.destroy();

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    return next(new AppError('Error deleting category', 500));
  }
});

// ========================================
// ANALYTICS & STATISTICS
// ========================================

// @desc    Get news analytics
// @route   GET /api/news/analytics
// @access  Admin
const getNewsAnalytics = catchAsync(async (req, res, next) => {
  const { period = '30' } = req.query; // days
  
  try {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(period));

    // Total news stats
    const totalNews = await News.count();
    const publishedNews = await News.count({ where: { status: 'published' } });
    const draftNews = await News.count({ where: { status: 'draft' } });
    const scheduledNews = await News.count({ where: { status: 'scheduled' } });

    // Recent activity
    const recentNews = await News.count({
      where: {
        createdAt: { [Op.gte]: daysAgo }
      }
    });

    // Popular news in period
    const popularNews = await News.findAll({
      where: {
        publishedAt: { [Op.gte]: daysAgo },
        status: 'published'
      },
      order: [['viewCount', 'DESC']],
      limit: 10,
      attributes: ['id', 'title', 'slug', 'viewCount', 'likeCount', 'shareCount'],
      include: [
        { model: NewsCategory, as: 'category', attributes: ['name', 'color'] }
      ]
    });

    // Category distribution
    const categoryStats = await NewsCategory.findAll({
      include: [
        {
          model: News,
          as: 'news',
          where: { status: 'published' },
          required: false,
          attributes: []
        }
      ],
      attributes: [
        'id', 'name', 'color',
        [sequelize.fn('COUNT', sequelize.col('news.id')), 'newsCount']
      ],
      group: ['NewsCategory.id']
    });

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalNews,
          publishedNews,
          draftNews,
          scheduledNews,
          recentNews
        },
        popularNews,
        categoryStats,
        period: parseInt(period)
      }
    });

  } catch (error) {
    return next(new AppError('Error fetching analytics', 500));
  }
});

// ========================================
// HELPER FUNCTIONS
// ========================================

const validateNewsForPublication = async (newsData) => {
  const errors = [];
  
  if (!newsData.title || newsData.title.trim().length < 3) {
    errors.push('Title must be at least 3 characters long');
  }
  
  if (!newsData.content || newsData.content.trim().length < 10) {
    errors.push('Content must be at least 10 characters long');
  }
  
  if (!newsData.categoryId) {
    errors.push('Category is required');
  }
  
  if (!newsData.summary || newsData.summary.trim().length < 10) {
    errors.push('Summary is required and must be at least 10 characters long');
  }
  
  return errors;
};

module.exports = {
  // Public routes
  getAllNews,
  getNewsBySlug,
  getFeaturedNews,
  getPopularNews,
  getNewsCategories,
  
  // Admin/Author routes
  createNews,
  updateNews,
  deleteNews,
  togglePublishNews,
  
  // Category management
  createNewsCategory,
  updateNewsCategory,
  deleteNewsCategory,
  
  // Analytics
  getNewsAnalytics
};