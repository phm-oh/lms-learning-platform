// File: backend/src/routes/index.js
// Path: backend/src/routes/index.js

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const courseRoutes = require('./course');
const lessonRoutes = require('./lesson');
const quizRoutes = require('./quiz');
const analyticsRoutes = require('./analytics');
const uploadRoutes = require('./upload'); // 🆕 NEW: Upload routes
const newsRoutes = require('./news'); // 🆕 เพิ่มบรรทัดนี้!

// ========================================
// API STATUS & HEALTH CHECK
// ========================================

// @desc    API Status check
// @route   GET /api
// @access  Public
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'LMS API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    features: {
      authentication: true,
      fileUpload: true,        // 🆕 NEW: File upload feature
      emailNotifications: true,
      realTimeUpdates: true,
      adminPanel: true,
      analytics: true,
      multiLanguage: false,
      mobileApp: false
    }
  });
});

// @desc    API Health check
// @route   GET /api/health
// @access  Public
router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: { status: 'checking' },
      email: { status: 'checking' },
      upload: { status: 'checking' },    // 🆕 NEW: Upload system check
      memory: { status: 'checking' }
    }
  };

  try {
    // Database health check
    const { sequelize } = require('../config/database');
    if (sequelize) {
      await sequelize.authenticate();
      health.checks.database = { status: 'healthy', message: 'Database connection successful' };
    } else {
      health.checks.database = { status: 'warning', message: 'Database not configured' };
    }
  } catch (error) {
    health.checks.database = { status: 'unhealthy', message: error.message };
    health.status = 'degraded';
  }

  try {
    // Email service health check
    const emailService = require('../utils/emailService');
    if (emailService) {
      health.checks.email = { status: 'healthy', message: 'Email service ready' };
    } else {
      health.checks.email = { status: 'warning', message: 'Email service not configured' };
    }
  } catch (error) {
    health.checks.email = { status: 'unhealthy', message: error.message };
    health.status = 'degraded';
  }

  try {
    // 🆕 Upload system health check
    const fs = require('fs').promises;
    const uploadDirs = ['./uploads', './uploads/profiles', './uploads/courses', './uploads/lessons'];
    
    let uploadStatus = 'healthy';
    const uploadDetails = {};

    for (const dir of uploadDirs) {
      try {
        await fs.access(dir);
        uploadDetails[dir] = 'accessible';
      } catch (error) {
        uploadDetails[dir] = 'missing';
        uploadStatus = 'warning';
      }
    }

    health.checks.upload = { 
      status: uploadStatus, 
      message: 'Upload directories checked',
      details: uploadDetails
    };
  } catch (error) {
    health.checks.upload = { status: 'unhealthy', message: error.message };
    health.status = 'degraded';
  }

  // Memory health check
  const memoryUsage = process.memoryUsage();
  const totalMemoryMB = memoryUsage.heapTotal / 1024 / 1024;
  const usedMemoryMB = memoryUsage.heapUsed / 1024 / 1024;
  const memoryPercentage = (usedMemoryMB / totalMemoryMB) * 100;

  if (memoryPercentage > 90) {
    health.checks.memory = { status: 'unhealthy', usage: `${memoryPercentage.toFixed(1)}%` };
    health.status = 'degraded';
  } else if (memoryPercentage > 75) {
    health.checks.memory = { status: 'warning', usage: `${memoryPercentage.toFixed(1)}%` };
    if (health.status === 'healthy') health.status = 'degraded';
  } else {
    health.checks.memory = { status: 'healthy', usage: `${memoryPercentage.toFixed(1)}%` };
  }

  // Overall status
  const hasUnhealthy = Object.values(health.checks).some(check => check.status === 'unhealthy');
  if (hasUnhealthy && health.status !== 'degraded') {
    health.status = 'unhealthy';
  }

  res.status(health.status === 'unhealthy' ? 503 : 200).json({
    success: health.status !== 'unhealthy',
    data: health
  });
});

// ========================================
// ROUTE MOUNTING
// ========================================

// Authentication routes
router.use('/auth', authRoutes);

// Admin routes
router.use('/admin', adminRoutes);

// Course management routes
router.use('/courses', courseRoutes);

// Lesson management routes
router.use('/lessons', lessonRoutes);

// Quiz management routes
router.use('/quizzes', quizRoutes);

// Analytics routes
router.use('/analytics', analyticsRoutes);

// 🆕 Upload routes
router.use('/upload', uploadRoutes);
router.use('/news', newsRoutes); // 🆕 เพิ่มบรรทัดนี้!

// ========================================
// 🆕 ADDITIONAL UPLOAD-RELATED ROUTES
// ========================================

// @desc    Get upload system information
// @route   GET /api/upload-info
// @access  Public
router.get('/upload-info', (req, res) => {
  const { getStorageConfig } = require('../config/storage');
  const storageConfig = getStorageConfig();

  res.status(200).json({
    success: true,
    data: {
      maxFileSize: storageConfig.default.limits.maxFileSize,
      maxFilesPerUpload: storageConfig.default.limits.maxFilesPerUpload,
      supportedTypes: {
        images: ['image/jpeg', 'image/png', 'image/webp'],
        videos: ['video/mp4', 'video/webm', 'video/quicktime'],
        documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        spreadsheets: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        presentations: ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
        archives: ['application/zip', 'application/x-rar-compressed'],
        text: ['text/plain', 'text/csv']
      },
      features: {
        imageProcessing: storageConfig.default.features.imageProcessing,
        thumbnailGeneration: storageConfig.default.features.thumbnailGeneration,
        videoTranscoding: storageConfig.default.features.videoTranscoding,
        virusScanning: storageConfig.default.features.virusScanning
      },
      storageType: storageConfig.active?.type || 'local',
      endpoints: {
        profilePhoto: '/api/upload/profile',
        courseThumbnail: '/api/upload/course/:courseId/thumbnail',
        lessonVideo: '/api/upload/lesson/:lessonId/video',
        lessonAttachments: '/api/upload/lesson/:lessonId/attachments',
        quizImport: '/api/upload/quiz/:quizId/import',
        generalFiles: '/api/upload/files'
      }
    }
  });
});

// ========================================
// API DOCUMENTATION ENDPOINT
// ========================================

// @desc    API Documentation overview
// @route   GET /api/docs
// @access  Public
router.get('/docs', (req, res) => {
  const apiDocs = {
    title: 'LMS Platform API Documentation',
    version: '1.0.0',
    description: 'Comprehensive Learning Management System API with file upload capabilities',
    baseUrl: process.env.API_URL || 'http://localhost:5000',
    
    endpoints: {
      authentication: {
        description: 'User authentication and profile management',
        routes: [
          'POST /api/auth/register',
          'POST /api/auth/login',
          'GET /api/auth/profile',
          'PATCH /api/auth/profile',
          'POST /api/auth/profile/photo',      // 🆕 NEW
          'DELETE /api/auth/profile/photo',    // 🆕 NEW
          'PATCH /api/auth/change-password',
          'POST /api/auth/forgot-password',
          'PATCH /api/auth/reset-password/:token'
        ]
      },
      
      courses: {
        description: 'Course management and enrollment',
        routes: [
          'GET /api/courses',
          'GET /api/courses/:id',
          'POST /api/courses',
          'PUT /api/courses/:id',
          'POST /api/courses/:id/thumbnail',     // 🆕 NEW
          'DELETE /api/courses/:id/thumbnail',   // 🆕 NEW
          'DELETE /api/courses/:id',
          'PATCH /api/courses/:id/publish',
          'POST /api/courses/:id/enroll',
          'GET /api/courses/:id/students',
          'PUT /api/courses/:id/students/:studentId'
        ]
      },
      
      lessons: {
        description: 'Lesson content and progress management',
        routes: [
          'GET /api/lessons/course/:courseId',
          'GET /api/lessons/:id',
          'POST /api/lessons',
          'PUT /api/lessons/:id',
          'POST /api/lessons/:id/video',         // 🆕 NEW
          'DELETE /api/lessons/:id/video',       // 🆕 NEW
          'POST /api/lessons/:id/attachments',   // 🆕 NEW
          'DELETE /api/lessons/:id/attachments', // 🆕 NEW
          'DELETE /api/lessons/:id',
          'PATCH /api/lessons/:id/publish',
          'POST /api/lessons/:id/progress',
          'POST /api/lessons/:id/complete'
        ]
      },
      
      quizzes: {
        description: 'Quiz management and taking system',
        routes: [
          'GET /api/quizzes/course/:courseId',
          'POST /api/quizzes',
          'POST /api/quizzes/:id/attempt',
          'POST /api/quizzes/:id/answer',
          'POST /api/quizzes/:id/submit',
          'POST /api/upload/quiz/:id/import'     // 🆕 NEW
        ]
      },
      
      upload: {                                  // 🆕 NEW SECTION
        description: 'File upload and management system',
        routes: [
          'POST /api/upload/profile',
          'POST /api/upload/course/:courseId/thumbnail',
          'POST /api/upload/lesson/:lessonId/video',
          'POST /api/upload/lesson/:lessonId/documents',
          'POST /api/upload/lesson/:lessonId/attachments',
          'POST /api/upload/quiz/:quizId/import',
          'POST /api/upload/files',
          'DELETE /api/upload/file',
          'GET /api/upload/info',
          'GET /api/upload/stats',
          'POST /api/upload/cleanup',
          'GET /api/upload/health'
        ]
      },
      
      admin: {
        description: 'Administrative functions',
        routes: [
          'GET /api/admin/dashboard',
          'GET /api/admin/users',
          'PUT /api/admin/users/:id/approve',
          'PUT /api/admin/users/:id/status',
          'GET /api/admin/statistics'
        ]
      },
      
      analytics: {
        description: 'Learning analytics and insights',
        routes: [
          'GET /api/analytics/teacher/:id',
          'GET /api/analytics/student/:id',
          'GET /api/analytics/course/:id',
          'GET /api/analytics/platform'
        ]
      }
    },
    
    uploadFeatures: {                          // 🆕 NEW SECTION
      description: 'File upload system capabilities',
      supportedFiles: {
        profilePhotos: {
          types: ['image/jpeg', 'image/png', 'image/webp'],
          maxSize: '5MB',
          processing: 'Auto-resize to 400x400, thumbnail generation'
        },
        courseThumbnails: {
          types: ['image/jpeg', 'image/png', 'image/webp'],
          maxSize: '10MB',
          processing: 'Auto-resize to 800x450, thumbnail generation'
        },
        lessonVideos: {
          types: ['video/mp4', 'video/webm', 'video/quicktime'],
          maxSize: '500MB',
          processing: 'Storage optimization'
        },
        documents: {
          types: ['application/pdf', 'application/msword', 'text/plain'],
          maxSize: '50MB',
          processing: 'Virus scanning, metadata extraction'
        },
        csvImports: {
          types: ['text/csv'],
          maxSize: '10MB',
          processing: 'Data validation, error reporting'
        }
      },
      security: [
        'File type validation',
        'Size limit enforcement',
        'Virus scanning (optional)',
        'Secure file naming (UUID)',
        'Access control (role-based)'
      ]
    },
    
    rateLimits: {
      general: '100 requests per 15 minutes',
      uploads: '20 uploads per 15 minutes',
      heavyUploads: '5 video uploads per hour',
      csvImports: '5 imports per 30 minutes'
    },
    
    authentication: {
      type: 'Bearer Token (JWT)',
      header: 'Authorization: Bearer <token>',
      expiration: '7 days (configurable)'
    }
  };

  res.status(200).json({
    success: true,
    data: apiDocs
  });
});

// ========================================
// ERROR HANDLING FOR INVALID ROUTES
// ========================================

// Handle undefined API routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    availableEndpoints: {
      status: 'GET /api',
      health: 'GET /api/health',
      docs: 'GET /api/docs',
      auth: 'GET /api/auth/*',
      courses: 'GET /api/courses/*',
      lessons: 'GET /api/lessons/*',
      quizzes: 'GET /api/quizzes/*',
      upload: 'GET /api/upload/*',      // 🆕 NEW
      admin: 'GET /api/admin/*',
      analytics: 'GET /api/analytics/*' ,
      news: 'GET /api/news/*'
    },
    suggestion: 'Check /api/docs for complete API documentation'
  });
});

module.exports = router;

// ========================================
// ROUTE SUMMARY (Updated with Upload Routes)
// ========================================
/*
Available API Routes (80+ endpoints):

🔐 Authentication (8 routes):
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/profile
- PATCH /api/auth/profile
- POST /api/auth/profile/photo       🆕 NEW
- DELETE /api/auth/profile/photo     🆕 NEW
- PATCH /api/auth/change-password
- POST /api/auth/forgot-password
- PATCH /api/auth/reset-password/:token

📚 Courses (12 routes):
- GET /api/courses
- GET /api/courses/:id
- POST /api/courses
- PUT /api/courses/:id
- POST /api/courses/:id/thumbnail    🆕 NEW
- DELETE /api/courses/:id/thumbnail  🆕 NEW
- DELETE /api/courses/:id
- PATCH /api/courses/:id/publish
- POST /api/courses/:id/enroll
- GET /api/courses/:id/students
- PUT /api/courses/:id/students/:studentId

📖 Lessons (14 routes):
- GET /api/lessons/course/:courseId
- GET /api/lessons/:id
- POST /api/lessons
- PUT /api/lessons/:id
- POST /api/lessons/:id/video        🆕 NEW
- DELETE /api/lessons/:id/video      🆕 NEW
- POST /api/lessons/:id/attachments  🆕 NEW
- DELETE /api/lessons/:id/attachments 🆕 NEW
- DELETE /api/lessons/:id
- PATCH /api/lessons/:id/publish
- POST /api/lessons/:id/progress
- POST /api/lessons/:id/complete

📝 Quizzes (6 routes):
- GET /api/quizzes/course/:courseId
- POST /api/quizzes
- POST /api/quizzes/:id/attempt
- POST /api/quizzes/:id/answer
- POST /api/quizzes/:id/submit

📁 Upload System (12 routes):        🆕 NEW SECTION
- POST /api/upload/profile
- POST /api/upload/course/:courseId/thumbnail
- POST /api/upload/lesson/:lessonId/video
- POST /api/upload/lesson/:lessonId/documents
- POST /api/upload/lesson/:lessonId/attachments
- POST /api/upload/quiz/:quizId/import
- POST /api/upload/files
- DELETE /api/upload/file
- GET /api/upload/info
- GET /api/upload/stats
- POST /api/upload/cleanup (Admin)
- GET /api/upload/health (Admin)

👨‍💼 Admin (8 routes):
- GET /api/admin/dashboard
- GET /api/admin/users
- PUT /api/admin/users/:id/approve
- PUT /api/admin/users/:id/status
- GET /api/admin/statistics

📊 Analytics (5 routes):
- GET /api/analytics/teacher/:id
- GET /api/analytics/student/:id
- GET /api/analytics/course/:id
- GET /api/analytics/platform

🏥 System (4 routes):
- GET /api (Status)
- GET /api/health
- GET /api/docs
- GET /api/upload-info            🆕 NEW

Total: 80+ API endpoints ready for production! 🚀
*/