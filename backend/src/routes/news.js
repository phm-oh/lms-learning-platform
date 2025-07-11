// File: backend/src/routes/news.js
// Path: backend/src/routes/news.js

const express = require('express');
const router = express.Router();

// Import middleware
const { protect, isAdmin, isTeacherOrAdmin } = require('../middleware/auth');
const { validate, validateQuery, validateParams } = require('../middleware/validation');
const { generalLimiter, contentCreationLimiter, roleBasedLimiter } = require('../middleware/rateLimit');

// Import validation schemas
const { newsSchemas, newsCategorySchemas, paramSchemas, querySchemas } = require('../middleware/newsValidation');

// Import controllers
const {
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
} = require('../controllers/news');

// ========================================
// PUBLIC ROUTES (No authentication required)
// ========================================

// Apply general rate limiting to public routes
router.use(generalLimiter);

// @desc    Get all published news with filtering
// @route   GET /api/news
// @access  Public
router.get('/',
  validateQuery(querySchemas.newsList),
  getAllNews
);

// @desc    Get featured news
// @route   GET /api/news/featured
// @access  Public
router.get('/featured',
  validateQuery(querySchemas.newsLimit),
  getFeaturedNews
);

// @desc    Get popular news
// @route   GET /api/news/popular
// @access  Public
router.get('/popular',
  validateQuery(querySchemas.popularNews),
  getPopularNews
);

// @desc    Get news categories
// @route   GET /api/news/categories
// @access  Public
router.get('/categories',
  validateQuery(querySchemas.categoriesList),
  getNewsCategories
);

// @desc    Get single news by slug
// @route   GET /api/news/:slug
// @access  Public
router.get('/:slug',
  validateParams(paramSchemas.newsSlug),
  validateQuery(querySchemas.newsDetail),
  getNewsBySlug
);

// ========================================
// AUTHENTICATED ROUTES
// ========================================

// Apply authentication middleware to all routes below
router.use(protect);
router.use(roleBasedLimiter);

// ========================================
// NEWS MANAGEMENT (Admin/Teachers)
// ========================================

// @desc    Create new news
// @route   POST /api/news
// @access  Admin/Teacher
router.post('/',
  isTeacherOrAdmin,
  contentCreationLimiter,
  validate(newsSchemas.create),
  createNews
);

// @desc    Update news
// @route   PUT /api/news/:id
// @access  Admin/Author
router.put('/:id',
  validateParams(paramSchemas.newsId),
  validate(newsSchemas.update),
  updateNews
);

// @desc    Delete news
// @route   DELETE /api/news/:id
// @access  Admin/Author
router.delete('/:id',
  validateParams(paramSchemas.newsId),
  deleteNews
);

// @desc    Publish/unpublish/schedule/archive news
// @route   PATCH /api/news/:id/publish
// @access  Admin/Author
router.patch('/:id/publish',
  validateParams(paramSchemas.newsId),
  validate(newsSchemas.publishAction),
  togglePublishNews
);

// ========================================
// CATEGORY MANAGEMENT (Admin only)
// ========================================

// @desc    Create news category
// @route   POST /api/news/categories
// @access  Admin
router.post('/categories',
  isAdmin,
  contentCreationLimiter,
  validate(newsCategorySchemas.create),
  createNewsCategory
);

// @desc    Update news category
// @route   PUT /api/news/categories/:id
// @access  Admin
router.put('/categories/:id',
  isAdmin,
  validateParams(paramSchemas.categoryId),
  validate(newsCategorySchemas.update),
  updateNewsCategory
);

// @desc    Delete news category
// @route   DELETE /api/news/categories/:id
// @access  Admin
router.delete('/categories/:id',
  isAdmin,
  validateParams(paramSchemas.categoryId),
  deleteNewsCategory
);

// ========================================
// ANALYTICS & REPORTING (Admin only)
// ========================================

// @desc    Get news analytics
// @route   GET /api/news/analytics
// @access  Admin
router.get('/analytics',
  isAdmin,
  validateQuery(querySchemas.analytics),
  getNewsAnalytics
);

// ========================================
// ADDITIONAL ROUTES FOR FUTURE FEATURES
// ========================================

// @desc    Like/unlike news
// @route   POST /api/news/:id/like
// @access  Private (All authenticated users)
router.post('/:id/like',
  validateParams(paramSchemas.newsId),
  async (req, res, next) => {
    // This would be implemented for user engagement
    res.json({
      success: true,
      message: 'Like functionality - to be implemented',
      note: 'This endpoint will handle news likes/reactions'
    });
  }
);

// @desc    Share news (track sharing)
// @route   POST /api/news/:id/share
// @access  Public (with optional auth)
router.post('/:id/share',
  validateParams(paramSchemas.newsId),
  validate(newsSchemas.shareAction),
  async (req, res, next) => {
    // This would track sharing statistics
    res.json({
      success: true,
      message: 'Share tracking - to be implemented',
      note: 'This endpoint will track news sharing across platforms'
    });
  }
);

// @desc    Add comment to news
// @route   POST /api/news/:id/comments
// @access  Private (All authenticated users)
router.post('/:id/comments',
  validateParams(paramSchemas.newsId),
  validate(newsSchemas.createComment),
  async (req, res, next) => {
    // This would handle news comments
    res.json({
      success: true,
      message: 'Comments functionality - to be implemented',
      note: 'This endpoint will handle news comments'
    });
  }
);

// @desc    Get news comments
// @route   GET /api/news/:id/comments
// @access  Public
router.get('/:id/comments',
  validateParams(paramSchemas.newsId),
  validateQuery(querySchemas.comments),
  async (req, res, next) => {
    // This would fetch news comments
    res.json({
      success: true,
      data: {
        comments: [],
        pagination: { total: 0, page: 1, limit: 10, pages: 0 }
      },
      message: 'Comments functionality - to be implemented'
    });
  }
);

// ========================================
// BULK OPERATIONS (Admin only)
// ========================================

// @desc    Bulk publish/unpublish news
// @route   PATCH /api/news/bulk/publish
// @access  Admin
router.patch('/bulk/publish',
  isAdmin,
  validate(newsSchemas.bulkPublish),
  async (req, res, next) => {
    // This would handle bulk operations
    res.json({
      success: true,
      message: 'Bulk operations - to be implemented',
      note: 'This endpoint will handle bulk publish/unpublish operations'
    });
  }
);

// @desc    Bulk delete news
// @route   DELETE /api/news/bulk/delete
// @access  Admin
router.delete('/bulk/delete',
  isAdmin,
  validate(newsSchemas.bulkDelete),
  async (req, res, next) => {
    // This would handle bulk deletion
    res.json({
      success: true,
      message: 'Bulk delete - to be implemented',
      note: 'This endpoint will handle bulk deletion operations'
    });
  }
);

// ========================================
// ADMIN DASHBOARD HELPERS
// ========================================

// @desc    Get news management dashboard data
// @route   GET /api/news/admin/dashboard
// @access  Admin/Teacher
router.get('/admin/dashboard',
  isTeacherOrAdmin,
  async (req, res, next) => {
    try {
      // This would provide dashboard summary data
      res.json({
        success: true,
        data: {
          stats: {
            totalNews: 0,
            publishedNews: 0,
            draftNews: 0,
            scheduledNews: 0,
            myNews: 0 // for teachers
          },
          recentActivity: [],
          pendingActions: []
        },
        message: 'Dashboard data - to be fully implemented'
      });
    } catch (error) {
      return next(new AppError('Error fetching dashboard data', 500));
    }
  }
);

// @desc    Get my news (for teachers)
// @route   GET /api/news/my
// @access  Teacher/Admin
router.get('/my',
  isTeacherOrAdmin,
  validateQuery(querySchemas.myNews),
  async (req, res, next) => {
    try {
      // This would fetch news by current user
      const { page = 1, limit = 10, status } = req.query;
      
      res.json({
        success: true,
        data: {
          news: [],
          pagination: {
            total: 0,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: 0
          }
        },
        message: 'My news functionality - to be implemented'
      });
    } catch (error) {
      return next(new AppError('Error fetching user news', 500));
    }
  }
);

// ========================================
// SCHEDULED PUBLISHING (Internal/Cron)
// ========================================

// @desc    Publish scheduled news (for cron jobs)
// @route   POST /api/news/cron/publish-scheduled
// @access  Internal (API key required)
router.post('/cron/publish-scheduled',
  // Add API key validation middleware here
  async (req, res, next) => {
    try {
      // This would be called by cron to publish scheduled news
      const News = require('../models/news/news-model');
      const publishedNews = await News.publishScheduled();
      
      res.json({
        success: true,
        data: {
          publishedCount: publishedNews.length,
          publishedNews: publishedNews.map(news => ({
            id: news.id,
            title: news.title,
            publishedAt: news.publishedAt
          }))
        },
        message: `${publishedNews.length} scheduled news published successfully`
      });
    } catch (error) {
      return next(new AppError('Error publishing scheduled news', 500));
    }
  }
);

// ========================================
// DOCUMENTATION ROUTE
// ========================================

router.get('/docs', (req, res) => {
  res.json({
    title: 'News API Documentation',
    version: '1.0.0',
    baseUrl: '/api/news',
    
    endpoints: {
      public: {
        'GET /': 'Get all published news with filtering and pagination',
        'GET /featured': 'Get featured news',
        'GET /popular': 'Get popular news by views/likes',
        'GET /categories': 'Get news categories',
        'GET /:slug': 'Get single news by slug'
      },
      
      authenticated: {
        'POST /': 'Create news (Admin/Teacher)',
        'PUT /:id': 'Update news (Admin/Author)',
        'DELETE /:id': 'Delete news (Admin/Author)',
        'PATCH /:id/publish': 'Publish/unpublish news (Admin/Author)',
        'GET /my': 'Get my news (Teacher/Admin)',
        'GET /admin/dashboard': 'Get dashboard data (Admin/Teacher)'
      },
      
      admin: {
        'POST /categories': 'Create news category',
        'PUT /categories/:id': 'Update news category',
        'DELETE /categories/:id': 'Delete news category',
        'GET /analytics': 'Get news analytics',
        'PATCH /bulk/publish': 'Bulk publish/unpublish',
        'DELETE /bulk/delete': 'Bulk delete'
      },
      
      engagement: {
        'POST /:id/like': 'Like/unlike news (Future)',
        'POST /:id/share': 'Track sharing (Future)',
        'POST /:id/comments': 'Add comment (Future)',
        'GET /:id/comments': 'Get comments (Future)'
      }
    },
    
    authentication: {
      public: ['GET /', 'GET /featured', 'GET /popular', 'GET /categories', 'GET /:slug'],
      teacher: ['POST /', 'PUT /:id', 'DELETE /:id', 'PATCH /:id/publish', 'GET /my'],
      admin: ['All endpoints']
    },
    
    features: {
      implemented: [
        'CRUD operations for news',
        'Category management',
        'Publishing workflow',
        'SEO-friendly URLs',
        'View tracking',
        'Filtering and search',
        'Analytics dashboard'
      ],
      planned: [
        'Comments system',
        'Like/reaction system',
        'Share tracking',
        'Email notifications',
        'RSS feed',
        'Content scheduling',
        'Advanced analytics'
      ]
    }
  });
});

module.exports = router;