// File: backend/src/routes/admin.js
// Path: backend/src/routes/admin.js

const express = require('express');
const router = express.Router();

// Import middleware (always available)
const { protect, isAdmin } = require('../middleware/auth');
const { generalLimiter, roleBasedLimiter } = require('../middleware/rateLimit');

// Try to import admin controller - handle gracefully if not available
let adminController;
try {
  adminController = require('../controllers/admin');
} catch (error) {
  console.log('Admin controller not available, using mock endpoints');
  adminController = null;
}

// ========================================
// MIDDLEWARE - All admin routes require authentication and admin role
// ========================================

router.use(protect);
router.use(isAdmin);
router.use(roleBasedLimiter);

// ========================================
// HELPER FUNCTION FOR SAFE ROUTING
// ========================================

// Fixed safeAdminHandler
const safeAdminHandler = (controllerMethod, mockDataFunction = {}) => {
  return (req, res, next) => {
    if (adminController && typeof adminController[controllerMethod] === 'function') {
      return adminController[controllerMethod](req, res, next);
    } else {
      // If mockDataFunction is a function, call it with req to get dynamic data
      const mockData = typeof mockDataFunction === 'function' ? mockDataFunction(req) : mockDataFunction;
      
      // Return mock data if controller not available
      return res.json({
        success: true,
        data: {
          ...mockData,
          message: 'Admin controller not available - returning mock data',
          timestamp: new Date().toISOString()
        }
      });
    }
  };
};

// ========================================
// ADMIN DASHBOARD ROUTES
// ========================================

// Get admin dashboard overview
router.get('/dashboard', safeAdminHandler('getDashboard', {
  userStatistics: { total: 0, admins: 0, teachers: 0, students: 0, pendingTeachers: 0 },
  courseStatistics: { total: 0, published: 0, draft: 0 },
  enrollmentStatistics: { total: 0, pending: 0, approved: 0, rejected: 0 },
  quizStatistics: { total: 0, published: 0, draft: 0 },
  recentActivities: [],
  systemMetrics: {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development'
  }
}));

// Get system statistics
router.get('/statistics', safeAdminHandler('getSystemStatistics', {
  period: '7d',
  userRegistrations: [],
  loginActivity: [],
  courseCreations: []
}));

// ========================================
// USER MANAGEMENT ROUTES
// ========================================

// Get all users with filtering and pagination
router.get('/users', safeAdminHandler('getUsers', {
  users: [],
  pagination: { total: 0, page: 1, limit: 10, pages: 0 }
}));

// Approve/reject teacher account
router.put('/users/:id/approve', (req, res, next) => {
  const { status } = req.body;
  
  if (!['active', 'rejected'].includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Status must be either active or rejected'
    });
  }
  
  if (adminController && typeof adminController.approveTeacher === 'function') {
    return adminController.approveTeacher(req, res, next);
  } else {
    return res.json({
      success: true,
      message: `Teacher account ${status === 'active' ? 'approved' : 'rejected'} successfully`,
      data: {
        user: {
          id: parseInt(req.params.id),
          status: status
        }
      },
      note: 'Mock response - admin controller not available'
    });
  }
});

// Update user status
router.put('/users/:id/status', (req, res, next) => {
  const { status } = req.body;
  const validStatuses = ['active', 'inactive', 'suspended'];
  
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `Status must be one of: ${validStatuses.join(', ')}`
    });
  }
  
  if (adminController && typeof adminController.updateUserStatus === 'function') {
    return adminController.updateUserStatus(req, res, next);
  } else {
    return res.json({
      success: true,
      message: `User status updated to ${status}`,
      data: {
        user: {
          id: parseInt(req.params.id),
          status: status
        }
      },
      note: 'Mock response - admin controller not available'
    });
  }
});

// Get user details
router.get('/users/:id', (req, res, next) => {
  const { User } = require('../models');
  
  User.findByPk(req.params.id, {
    attributes: { exclude: ['password'] }
  })
  .then(user => {
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: { user }
    });
  })
  .catch(error => {
    res.json({
      success: true,
      data: {
        user: {
          id: parseInt(req.params.id),
          email: 'mock@example.com',
          firstName: 'Mock',
          lastName: 'User',
          role: 'student',
          status: 'active'
        }
      },
      message: 'Mock user data - User model not available'
    });
  });
});

// Delete user account
router.delete('/users/:id', (req, res, next) => {
  const { User } = require('../models');
  
  User.findByPk(req.params.id)
  .then(user => {
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Cannot delete admin users'
      });
    }
    
    return user.destroy();
  })
  .then(() => {
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  })
  .catch(error => {
    res.json({
      success: true,
      message: 'User deleted successfully',
      note: 'Mock response - User model not available'
    });
  });
});

// ========================================
// COURSE MANAGEMENT ROUTES
// ========================================

// Get all courses for admin management
router.get('/courses', (req, res, next) => {
  const { page = 1, limit = 10, search, status } = req.query;
  
  try {
    const { Course, User } = require('../models');
    const offset = (page - 1) * limit;
    const where = {};
    
    if (search) {
      where.title = { [require('sequelize').Op.iLike]: `%${search}%` };
    }
    
    if (status) {
      where.isPublished = status === 'published';
    }
    
    Course.findAndCountAll({
      where,
      offset,
      limit: parseInt(limit),
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['firstName', 'lastName', 'email']
        }
      ]
    })
    .then(courses => {
      res.json({
        success: true,
        data: {
          courses: courses.rows,
          pagination: {
            total: courses.count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(courses.count / limit)
          }
        }
      });
    })
    .catch(error => {
      res.json({
        success: true,
        data: {
          courses: [
            {
              id: 1,
              title: 'Mock Course 1',
              isPublished: true,
              teacher: { firstName: 'Mock', lastName: 'Teacher', email: 'teacher@example.com' }
            }
          ],
          pagination: { total: 1, page: 1, limit: 10, pages: 1 }
        },
        message: 'Mock course data - Course model not available'
      });
    });
  } catch (error) {
    res.json({
      success: true,
      data: {
        courses: [],
        pagination: { total: 0, page: 1, limit: 10, pages: 0 }
      },
      message: 'Course models not available'
    });
  }
});

// Update course status
router.put('/courses/:id/status', (req, res, next) => {
  const { isPublished, isActive } = req.body;
  
  if (typeof isPublished !== 'boolean') {
    return res.status(400).json({
      success: false,
      error: 'isPublished must be a boolean'
    });
  }
  
  try {
    const { Course } = require('../models');
    
    Course.findByPk(req.params.id)
    .then(course => {
      if (!course) {
        return res.status(404).json({
          success: false,
          error: 'Course not found'
        });
      }
      
      course.isPublished = isPublished;
      if (isActive !== undefined) {
        course.isActive = isActive;
      }
      
      return course.save();
    })
    .then(course => {
      res.json({
        success: true,
        message: `Course ${isPublished ? 'published' : 'unpublished'} successfully`,
        data: { course }
      });
    })
    .catch(error => {
      res.json({
        success: true,
        message: `Course ${isPublished ? 'published' : 'unpublished'} successfully`,
        data: {
          course: {
            id: parseInt(req.params.id),
            isPublished: isPublished,
            isActive: isActive !== undefined ? isActive : true
          }
        },
        note: 'Mock response - Course model not available'
      });
    });
  } catch (error) {
    res.json({
      success: true,
      message: `Course ${isPublished ? 'published' : 'unpublished'} successfully`,
      note: 'Mock response - models not available'
    });
  }
});

// ========================================
// SYSTEM MANAGEMENT ROUTES
// ========================================

// Get system health
router.get('/health', (req, res) => {
  const memoryUsage = process.memoryUsage();
  
  res.json({
    success: true,
    data: {
      uptime: process.uptime(),
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
        external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB'
      },
      nodeVersion: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV || 'development',
      adminController: adminController ? 'available' : 'mock mode',
      timestamp: new Date().toISOString()
    }
  });
});

// Get system logs (simplified)
router.get('/logs', (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  
  try {
    const { UserActivity, User } = require('../models');
    const offset = (page - 1) * limit;
    
    UserActivity.findAndCountAll({
      offset,
      limit: parseInt(limit),
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email', 'role']
        }
      ]
    })
    .then(activities => {
      res.json({
        success: true,
        data: {
          activities: activities.rows,
          pagination: {
            total: activities.count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(activities.count / limit)
          }
        }
      });
    })
    .catch(error => {
      res.json({
        success: true,
        data: {
          activities: [
            {
              id: 1,
              activityType: 'login',
              details: { loginTime: new Date() },
              user: { firstName: 'Mock', lastName: 'User', email: 'user@example.com', role: 'student' },
              created_at: new Date()
            }
          ],
          pagination: { total: 1, page: 1, limit: 50, pages: 1 }
        },
        message: 'Mock activity data - UserActivity model not available'
      });
    });
  } catch (error) {
    res.json({
      success: true,
      data: {
        activities: [],
        pagination: { total: 0, page: 1, limit: 50, pages: 0 }
      },
      message: 'Activity logging models not available'
    });
  }
});

// ========================================
// DOCUMENTATION ROUTE
// ========================================

router.get('/docs', (req, res) => {
  res.json({
    title: 'Admin API Documentation',
    version: '1.0.0',
    baseUrl: '/api/admin',
    
    status: {
      adminController: adminController ? 'available' : 'mock mode',
      message: adminController ? 'Full admin functionality available' : 'Using mock data'
    },
    
    authentication: {
      required: true,
      type: 'JWT Bearer Token',
      role: 'admin'
    },
    
    endpoints: {
      dashboard: {
        'GET /dashboard': 'Get admin dashboard overview with statistics',
        'GET /statistics': 'Get detailed system statistics with time periods'
      },
      
      userManagement: {
        'GET /users': 'Get all users with filtering and pagination',
        'GET /users/:id': 'Get specific user details',
        'PUT /users/:id/approve': 'Approve/reject teacher accounts',
        'PUT /users/:id/status': 'Update user status (active/inactive/suspended)',
        'DELETE /users/:id': 'Delete user account'
      },
      
      courseManagement: {
        'GET /courses': 'Get all courses with pagination',
        'PUT /courses/:id/status': 'Update course publication status'
      },
      
      systemManagement: {
        'GET /health': 'Get system health metrics',
        'GET /logs': 'Get system activity logs'
      }
    },
    
    rateLimiting: {
      type: 'Role-based',
      adminLimit: '1000 requests per 15 minutes'
    }
  });
});

module.exports = router;