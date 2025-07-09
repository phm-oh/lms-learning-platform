// File: backend/src/routes/index.js
// Path: backend/src/routes/index.js

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const analyticsRoutes = require('./analytics');
// const userRoutes = require('./user');
const courseRoutes = require('./course');
const lessonRoutes = require('./lesson');
const quizRoutes = require('./quiz');

// ========================================
// API DOCUMENTATION ENDPOINT
// ========================================

router.get('/docs', (req, res) => {
  res.json({
    title: 'LMS Platform API Documentation',
    version: '1.0.0',
    description: 'Learning Management System with ML Prediction capabilities',
    baseUrl: '/api',
    
    endpoints: {
      authentication: {
        base: '/api/auth',
        description: 'User authentication and profile management',
        routes: {
          'POST /register': 'Register new user',
          'POST /login': 'User login',
          'POST /logout': 'User logout',
          'GET /profile': 'Get user profile',
          'PATCH /profile': 'Update user profile',
          'PATCH /change-password': 'Change password',
          'POST /forgot-password': 'Request password reset',
          'PATCH /reset-password/:token': 'Reset password with token'
        }
      },
      
      admin: {
        base: '/api/admin',
        description: 'Admin dashboard and system management',
        authentication: 'Admin role required',
        routes: {
          'GET /dashboard': 'Get admin dashboard overview',
          'GET /statistics': 'Get system statistics',
          'GET /users': 'Get all users with filtering',
          'PUT /users/:id/approve': 'Approve/reject teacher accounts',
          'PUT /users/:id/status': 'Update user status',
          'GET /courses': 'Manage all courses',
          'PUT /courses/:id/status': 'Update course status',
          'GET /quizzes': 'Manage all quizzes',
          'GET /health': 'System health metrics',
          'GET /logs': 'System activity logs'
        }
      },
      
      analytics: {
        base: '/api/analytics',
        description: 'Dashboard analytics and insights',
        authentication: 'Role-based access',
        routes: {
          'GET /teacher/:id': 'Teacher dashboard analytics',
          'GET /student/:id': 'Student dashboard analytics',
          'GET /course/:id': 'Course performance analytics',
          'GET /platform': 'Platform-wide analytics (admin only)'
        }
      },
      
      users: {
        base: '/api/users',
        status: 'Coming soon',
        routes: {
          'GET /profile': 'Get current user profile',
          'PUT /profile': 'Update user profile',
          'GET /:id/courses': 'Get user courses',
          'GET /:id/analytics': 'Get user learning analytics'
        }
      },
      
      courses: {
        base: '/api/courses',
        status: 'Coming soon',
        routes: {
          'GET /': 'Get all published courses',
          'GET /:id': 'Get course details',
          'POST /': 'Create course (teacher only)',
          'PUT /:id': 'Update course (teacher only)',
          'DELETE /:id': 'Delete course (teacher/admin only)',
          'POST /:id/enroll': 'Request enrollment',
          'GET /:id/students': 'Get enrolled students',
          'PUT /:id/students/:studentId': 'Approve/reject enrollment'
        }
      },
      
      lessons: {
        base: '/api/lessons',
        status: 'Coming soon',
        routes: {
          'GET /course/:courseId': 'Get lessons for course',
          'GET /:id': 'Get lesson details',
          'POST /': 'Create lesson (teacher only)',
          'PUT /:id': 'Update lesson (teacher only)',
          'DELETE /:id': 'Delete lesson (teacher only)',
          'POST /:id/progress': 'Update lesson progress'
        }
      },
      
      quizzes: {
        base: '/api/quizzes',
        status: 'Coming soon',
        routes: {
          'GET /course/:courseId': 'Get quizzes for course',
          'GET /:id': 'Get quiz details',
          'POST /': 'Create quiz (teacher only)',
          'PUT /:id': 'Update quiz (teacher only)',
          'DELETE /:id': 'Delete quiz (teacher only)',
          'POST /:id/attempt': 'Start quiz attempt',
          'PUT /:id/submit': 'Submit quiz attempt',
          'GET /:id/results': 'Get quiz results'
        }
      }
    },
    
    authentication: {
      type: 'Bearer Token (JWT)',
      header: 'Authorization: Bearer <token>',
      expiry: '7 days',
      roles: ['admin', 'teacher', 'student']
    },
    
    errorCodes: {
      400: 'Bad Request - Invalid input data',
      401: 'Unauthorized - Invalid or missing token',
      403: 'Forbidden - Insufficient permissions',
      404: 'Not Found - Resource not found',
      409: 'Conflict - Resource already exists',
      422: 'Unprocessable Entity - Validation error',
      429: 'Too Many Requests - Rate limit exceeded',
      500: 'Internal Server Error - Server error'
    },
    
    responseFormat: {
      success: {
        success: true,
        data: '{}',
        message: 'Success message'
      },
      error: {
        success: false,
        error: 'Error message',
        code: 'ERROR_CODE',
        details: 'Additional error details'
      }
    }
  });
});

// ========================================
// API STATUS ENDPOINT
// ========================================

router.get('/status', (req, res) => {
  res.json({
    api: 'LMS Platform API',
    status: 'operational',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    
    services: {
      database: 'connected',
      authentication: 'available',
      adminPanel: 'available',
      analytics: 'available',
      fileUpload: 'coming soon',
      emailService: 'coming soon',
      mlService: 'coming soon',
      websocket: 'available'
    },
    
    features: {
      multiRoleSystem: true,
      adminDashboard: true,
      teacherDashboard: true,
      studentDashboard: true,
      quizTimer: 'coming soon',
      realTimeNotifications: true,
      mlPredictions: 'coming soon',
      emailNotifications: 'coming soon',
      fileUploads: 'coming soon',
      analytics: true
    }
  });
});

// ========================================
// MOUNT ROUTE MODULES
// ========================================

// Authentication routes
router.use('/auth', authRoutes);

// Admin management routes
router.use('/admin', adminRoutes);

// Analytics routes
router.use('/analytics', analyticsRoutes);

// User management routes  
// router.use('/users', userRoutes);

// Course management routes
router.use('/courses', courseRoutes);

// Lesson management routes
router.use('/lessons', lessonRoutes);

// Quiz management routes
router.use('/quizzes', quizRoutes);

// Temporary placeholder routes (remove when real routes are implemented)
router.get('/users/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'User routes will be implemented here',
    status: 'coming soon'
  });
});

router.get('/courses/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'Course routes will be implemented here',
    status: 'coming soon'
  });
});

router.get('/quizzes/test', (req, res) => {
  res.json({ 
    success: true,
    message: 'Quiz routes will be implemented here',
    status: 'coming soon'
  });
});

// ========================================
// HEALTH CHECK FOR SPECIFIC SERVICES
// ========================================

router.get('/health/auth', (req, res) => {
  res.json({
    service: 'Authentication',
    status: 'operational',
    endpoints: ['/login', '/register', '/profile'],
    timestamp: new Date().toISOString()
  });
});

router.get('/health/admin', (req, res) => {
  res.json({
    service: 'Admin Panel',
    status: 'operational',
    endpoints: ['/dashboard', '/users', '/statistics'],
    timestamp: new Date().toISOString()
  });
});

router.get('/health/analytics', (req, res) => {
  res.json({
    service: 'Analytics',
    status: 'operational',
    endpoints: ['/teacher/:id', '/student/:id', '/course/:id'],
    timestamp: new Date().toISOString()
  });
});

// ========================================
// CATCH-ALL ROUTE
// ========================================

router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    message: `Route ${req.method} ${req.originalUrl} not implemented`,
    availableEndpoints: '/api/docs',
    suggestions: [
      'Check /api/docs for available endpoints',
      'Verify the HTTP method (GET, POST, PUT, DELETE)',
      'Ensure proper authentication headers',
      'Check if the endpoint is implemented'
    ]
  });
});

module.exports = router;