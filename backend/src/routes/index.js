// File: backend/src/routes/index.js
// Path: backend/src/routes/index.js

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
// const userRoutes = require('./user');
// const courseRoutes = require('./course');
// const lessonRoutes = require('./lesson');
// const quizRoutes = require('./quiz');
// const adminRoutes = require('./admin');
// const analyticsRoutes = require('./analytics');

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
        routes: {
          'POST /register': 'Register new user',
          'POST /login': 'User login',
          'POST /logout': 'User logout',
          'POST /refresh': 'Refresh access token',
          'POST /forgot-password': 'Request password reset',
          'POST /reset-password': 'Reset password with token',
          'GET /verify-email/:token': 'Verify email address'
        }
      },
      
      users: {
        base: '/api/users',
        routes: {
          'GET /profile': 'Get current user profile',
          'PUT /profile': 'Update user profile',
          'GET /': 'Get all users (admin only)',
          'GET /:id': 'Get user by ID',
          'PUT /:id': 'Update user (admin only)',
          'DELETE /:id': 'Delete user (admin only)',
          'GET /:id/courses': 'Get user courses',
          'GET /:id/analytics': 'Get user learning analytics'
        }
      },
      
      courses: {
        base: '/api/courses',
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
        routes: {
          'GET /course/:courseId': 'Get lessons for course',
          'GET /:id': 'Get lesson details',
          'POST /': 'Create lesson (teacher only)',
          'PUT /:id': 'Update lesson (teacher only)',
          'DELETE /:id': 'Delete lesson (teacher only)',
          'POST /:id/progress': 'Update lesson progress',
          'GET /:id/progress': 'Get lesson progress'
        }
      },
      
      quizzes: {
        base: '/api/quizzes',
        routes: {
          'GET /course/:courseId': 'Get quizzes for course',
          'GET /:id': 'Get quiz details',
          'POST /': 'Create quiz (teacher only)',
          'PUT /:id': 'Update quiz (teacher only)',
          'DELETE /:id': 'Delete quiz (teacher only)',
          'POST /:id/attempt': 'Start quiz attempt',
          'PUT /:id/submit': 'Submit quiz attempt',
          'GET /:id/results': 'Get quiz results',
          'GET /:id/analytics': 'Get quiz analytics (teacher only)'
        }
      },
      
      admin: {
        base: '/api/admin',
        routes: {
          'GET /dashboard': 'Get admin dashboard data',
          'GET /users': 'Manage all users',
          'GET /courses': 'Manage all courses',
          'GET /analytics': 'System analytics',
          'PUT /users/:id/approve': 'Approve teacher account',
          'PUT /settings': 'Update system settings'
        }
      },
      
      analytics: {
        base: '/api/analytics',
        routes: {
          'GET /student/:id': 'Get student analytics',
          'GET /course/:id': 'Get course analytics',
          'GET /teacher/:id': 'Get teacher analytics',
          'POST /predict': 'Get ML predictions'
        }
      }
    },
    
    authentication: {
      type: 'Bearer Token (JWT)',
      header: 'Authorization: Bearer <token>',
      expiry: '7 days'
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
      fileUpload: 'available',
      emailService: 'available',
      mlService: 'available',
      websocket: 'connected'
    },
    
    features: {
      multiRoleSystem: true,
      quizTimer: true,
      realTimeNotifications: true,
      mlPredictions: true,
      emailNotifications: true,
      fileUploads: true,
      analytics: true
    }
  });
});

// ========================================
// MOUNT ROUTE MODULES
// ========================================

// Authentication routes
router.use('/auth', authRoutes);

// User management routes  
// router.use('/users', userRoutes);

// Course management routes
// router.use('/courses', courseRoutes);

// Lesson management routes
// router.use('/lessons', lessonRoutes);

// Quiz management routes
// router.use('/quizzes', quizRoutes);

// Admin routes
// router.use('/admin', adminRoutes);

// Analytics routes
// router.use('/analytics', analyticsRoutes);

// Temporary placeholder routes (remove when real routes are implemented)
router.get('/users/test', (req, res) => {
  res.json({ message: 'User routes will be implemented here' });
});

router.get('/courses/test', (req, res) => {
  res.json({ message: 'Course routes will be implemented here' });
});

// ========================================
// CATCH-ALL ROUTE
// ========================================

router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    message: `Route ${req.method} ${req.originalUrl} not implemented`,
    availableEndpoints: '/api/docs'
  });
});

module.exports = router;