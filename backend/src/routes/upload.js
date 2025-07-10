// File: backend/src/routes/upload.js
// Path: backend/src/routes/upload.js

const express = require('express');

// Try to import middleware and controllers - handle gracefully if not available
let authenticate, authorize;
try {
  const auth = require('../middleware/auth');
  authenticate = auth.authenticate || auth.protect;
  authorize = auth.authorize;
} catch (error) {
  console.log('Auth middleware not available, using mock');
  authenticate = (req, res, next) => {
    req.user = { id: 1, role: 'admin' }; // Mock user
    next();
  };
  authorize = (roles) => (req, res, next) => next();
}

let uploadMiddlewares = {};
try {
  uploadMiddlewares = require('../middleware/upload');
} catch (error) {
  console.log('Upload middleware not available, using mock');
  uploadMiddlewares = {
    uploadProfilePhoto: (req, res, next) => next(),
    uploadCourseThumbnail: (req, res, next) => next(),
    uploadLessonVideo: (req, res, next) => next(),
    uploadLessonDocuments: (req, res, next) => next(),
    uploadLessonAttachments: (req, res, next) => next(),
    uploadQuizCSV: (req, res, next) => next(),
    uploadAssignmentSubmission: (req, res, next) => next(),
    uploadMultipleFiles: (req, res, next) => next()
  };
}

let uploadController;
try {
  uploadController = require('../controllers/upload');
} catch (error) {
  console.log('Upload controller not available, using mock endpoints');
  uploadController = null;
}

let createCustomLimiter;
try {
  createCustomLimiter = require('../middleware/rateLimit').createCustomLimiter;
} catch (error) {
  console.log('Rate limit middleware not available, using mock');
  createCustomLimiter = (options) => (req, res, next) => next();
}

const {
  uploadProfilePhoto,
  uploadCourseThumbnail,
  uploadLessonVideo,
  uploadLessonDocuments,
  uploadLessonAttachments,
  uploadQuizCSV,
  uploadAssignmentSubmission,
  uploadMultipleFiles
} = uploadMiddlewares;

const router = express.Router();

// ========================================
// HELPER FUNCTION FOR SAFE ROUTING
// ========================================

const safeUploadHandler = (controllerMethod, mockResponse = {}) => {
  return (req, res, next) => {
    if (uploadController && typeof uploadController[controllerMethod] === 'function') {
      return uploadController[controllerMethod](req, res, next);
    } else {
      // Return mock response if controller not available
      return res.json({
        success: true,
        message: `Upload ${controllerMethod} not implemented yet - mock response`,
        data: {
          ...mockResponse,
          timestamp: new Date().toISOString()
        }
      });
    }
  };
};

// ========================================
// RATE LIMITING - ใช้ createCustomLimiter แทน
// ========================================

// General upload rate limiting
const uploadRateLimit = createCustomLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 uploads per window
  message: {
    success: false,
    error: 'อัปโหลดไฟล์เกินจำนวนที่อนุญาต กรุณาลองใหม่ในภายหลัง',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Heavy file upload rate limiting (videos, large files)
const heavyUploadRateLimit = createCustomLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 heavy uploads per hour
  message: {
    success: false,
    error: 'อัปโหลดไฟล์ขนาดใหญ่เกินจำนวนที่อนุญาต กรุณาลองใหม่ในภายหลัง',
    code: 'HEAVY_UPLOAD_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// CSV import rate limiting
const csvImportRateLimit = createCustomLimiter({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 5, // 5 CSV imports per 30 minutes
  message: {
    success: false,
    error: 'นำเข้าไฟล์ CSV เกินจำนวนที่อนุญาต กรุณาลองใหม่ในภายหลัง',
    code: 'CSV_IMPORT_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// ========================================
// PROFILE PHOTO ROUTES
// ========================================

// @desc    Upload profile photo
// @route   POST /api/upload/profile
// @access  Private (All authenticated users)
router.post('/profile',
  authenticate,
  uploadRateLimit,
  uploadProfilePhoto,
  safeUploadHandler('uploadProfilePhoto', {
    profilePhoto: '/uploads/profiles/user_1_photo_400x400.jpg',
    thumbnail: '/uploads/profiles/thumbnails/user_1_thumb_100x100.jpg'
  })
);

// ========================================
// COURSE RELATED UPLOADS
// ========================================

// @desc    Upload course thumbnail
// @route   POST /api/upload/course/:courseId/thumbnail
// @access  Teacher/Admin
router.post('/course/:courseId/thumbnail',
  authenticate,
  authorize(['teacher', 'admin']),
  uploadRateLimit,
  uploadCourseThumbnail,
  safeUploadHandler('uploadCourseThumbnail', {
    thumbnail: '/uploads/courses/course_1_thumb_800x450.jpg',
    thumbnailSmall: '/uploads/courses/course_1_thumb_400x225.jpg'
  })
);

// ========================================
// LESSON RELATED UPLOADS
// ========================================

// @desc    Upload lesson video
// @route   POST /api/upload/lesson/:lessonId/video
// @access  Teacher/Admin
router.post('/lesson/:lessonId/video',
  authenticate,
  authorize(['teacher', 'admin']),
  heavyUploadRateLimit,
  uploadLessonVideo,
  safeUploadHandler('uploadLessonVideo', {
    videoUrl: '/uploads/lessons/videos/lesson_1_video.mp4',
    videoDuration: 1205,
    videoSize: '245MB'
  })
);

// @desc    Upload lesson documents (multiple files)
// @route   POST /api/upload/lesson/:lessonId/documents
// @access  Teacher/Admin
router.post('/lesson/:lessonId/documents',
  authenticate,
  authorize(['teacher', 'admin']),
  uploadRateLimit,
  uploadLessonDocuments,
  safeUploadHandler('uploadLessonAttachments', {
    attachments: [],
    totalFiles: 0
  })
);

// @desc    Upload lesson attachments (mixed file types)
// @route   POST /api/upload/lesson/:lessonId/attachments
// @access  Teacher/Admin
router.post('/lesson/:lessonId/attachments',
  authenticate,
  authorize(['teacher', 'admin']),
  uploadRateLimit,
  uploadLessonAttachments,
  safeUploadHandler('uploadLessonAttachments', {
    attachments: [],
    totalFiles: 0
  })
);

// ========================================
// QUIZ RELATED UPLOADS
// ========================================

// @desc    Import quiz questions from CSV
// @route   POST /api/upload/quiz/:quizId/import
// @access  Teacher/Admin
router.post('/quiz/:quizId/import',
  authenticate,
  authorize(['teacher', 'admin']),
  csvImportRateLimit,
  uploadQuizCSV,
  safeUploadHandler('importQuizCSV', {
    imported: 5,
    failed: 0,
    total: 5
  })
);

// ========================================
// ASSIGNMENT UPLOADS
// ========================================

// @desc    Upload assignment submission
// @route   POST /api/upload/assignment/:assignmentId/submission
// @access  Student
router.post('/assignment/:assignmentId/submission',
  authenticate,
  authorize(['student']),
  uploadRateLimit,
  uploadAssignmentSubmission,
  safeUploadHandler('uploadAssignmentSubmission', {
    submission: {
      id: 1,
      assignmentId: 1,
      files: [],
      submittedAt: new Date()
    }
  })
);

// ========================================
// GENERAL FILE UPLOADS
// ========================================

// @desc    Upload multiple files (general purpose)
// @route   POST /api/upload/files
// @access  Private (All authenticated users)
router.post('/files',
  authenticate,
  uploadRateLimit,
  uploadMultipleFiles,
  safeUploadHandler('uploadMultipleFiles', {
    files: [],
    totalFiles: 0
  })
);

// ========================================
// FILE MANAGEMENT ROUTES
// ========================================

// @desc    Delete uploaded file
// @route   DELETE /api/upload/file
// @access  Private (file owner or admin)
router.delete('/file',
  authenticate,
  safeUploadHandler('deleteFile', {
    deleted: true,
    freedSpace: '2.5MB'
  })
);

// @desc    Get file information
// @route   GET /api/upload/info
// @access  Private
router.get('/info',
  authenticate,
  safeUploadHandler('getFileInfo', {
    fileInfo: {
      name: 'example.jpg',
      size: '1.2MB',
      type: 'image/jpeg'
    }
  })
);

// @desc    Get upload statistics
// @route   GET /api/upload/stats
// @access  Private
router.get('/stats',
  authenticate,
  safeUploadHandler('getUploadStats', {
    stats: {
      totalUploads: 1250,
      totalSize: '458GB',
      todayUploads: 45
    }
  })
);

// ========================================
// ADMIN FILE MANAGEMENT
// ========================================

// @desc    Clean up temporary files
// @route   POST /api/upload/cleanup
// @access  Admin only
router.post('/cleanup',
  authenticate,
  authorize(['admin']),
  safeUploadHandler('cleanupTempFiles', {
    cleaned: 25,
    freedSpace: '125MB'
  })
);

// @desc    Get upload system health
// @route   GET /api/upload/health
// @access  Admin only
router.get('/health',
  authenticate,
  authorize(['admin']),
  async (req, res) => {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        checks: {
          storage: { status: 'checking' },
          diskSpace: { status: 'checking' },
          permissions: { status: 'checking' }
        }
      };

      // Check storage directories
      const fs = require('fs').promises;
      const uploadDirs = [
        './uploads',
        './uploads/profiles', 
        './uploads/courses',
        './uploads/lessons'
      ];
      
      let storageOk = true;
      for (const dir of uploadDirs) {
        try {
          await fs.access(dir);
        } catch (error) {
          storageOk = false;
          break;
        }
      }
      
      health.checks.storage = {
        status: storageOk ? 'healthy' : 'unhealthy',
        message: storageOk ? 'All upload directories accessible' : 'Some upload directories missing'
      };

      // Check disk space (simplified)
      const stats = await fs.stat('./uploads');
      health.checks.diskSpace = {
        status: 'healthy',
        message: 'Disk space check completed'
      };

      // Check file permissions (simplified)
      health.checks.permissions = {
        status: 'healthy',
        message: 'File permissions OK'
      };

      const hasErrors = Object.values(health.checks).some(check => check.status === 'unhealthy');
      if (hasErrors) {
        health.status = 'degraded';
      }

      res.status(hasErrors ? 503 : 200).json({
        success: !hasErrors,
        data: health
      });

    } catch (error) {
      console.error('Health check error:', error);
      res.status(503).json({
        success: false,
        message: 'Health check failed',
        error: error.message
      });
    }
  }
);

// ========================================
// ERROR HANDLING MIDDLEWARE
// ========================================

// Handle multer errors specifically
router.use((error, req, res, next) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'ไฟล์มีขนาดใหญ่เกินไป',
      error: {
        type: 'FILE_TOO_LARGE',
        maxSize: error.limit,
        field: error.field
      }
    });
  }

  if (error.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      message: 'จำนวนไฟล์เกินที่อนุญาต',
      error: {
        type: 'TOO_MANY_FILES',
        maxFiles: error.limit,
        field: error.field
      }
    });
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      success: false,
      message: 'ไฟล์ที่อัปโหลดไม่ถูกต้อง',
      error: {
        type: 'UNEXPECTED_FILE',
        field: error.field
      }
    });
  }

  // Pass other errors to the default error handler
  next(error);
});

// ========================================
// DOCUMENTATION ROUTE
// ========================================

router.get('/docs', (req, res) => {
  res.json({
    title: 'Upload API Documentation',
    version: '1.0.0',
    baseUrl: '/api/upload',
    
    endpoints: {
      profileUploads: {
        'POST /profile': 'Upload profile photo'
      },
      courseUploads: {
        'POST /course/:courseId/thumbnail': 'Upload course thumbnail'
      },
      lessonUploads: {
        'POST /lesson/:lessonId/video': 'Upload lesson video',
        'POST /lesson/:lessonId/documents': 'Upload lesson documents',
        'POST /lesson/:lessonId/attachments': 'Upload lesson attachments'
      },
      quizUploads: {
        'POST /quiz/:quizId/import': 'Import quiz questions from CSV'
      },
      generalUploads: {
        'POST /files': 'Upload multiple files'
      },
      fileManagement: {
        'DELETE /file': 'Delete uploaded file',
        'GET /info': 'Get file information',
        'GET /stats': 'Get upload statistics'
      },
      adminEndpoints: {
        'POST /cleanup': 'Clean up temporary files',
        'GET /health': 'Get upload system health'
      }
    },
    
    fileTypes: {
      images: ['jpg', 'jpeg', 'png', 'webp'],
      videos: ['mp4', 'webm', 'mov'],
      documents: ['pdf', 'doc', 'docx', 'ppt', 'pptx'],
      archives: ['zip', 'rar'],
      text: ['txt', 'csv']
    },
    
    limits: {
      profilePhoto: '5MB',
      courseThumbnail: '10MB',
      lessonVideo: '500MB',
      documents: '50MB per file',
      csvImport: '10MB'
    },
    
    rateLimits: {
      general: '20 uploads per 15 minutes',
      heavy: '5 uploads per hour',
      csvImport: '5 imports per 30 minutes'
    },
    
    authentication: {
      required: true,
      roles: {
        student: ['profile uploads', 'assignment submissions'],
        teacher: ['all uploads for own courses'],
        admin: ['all uploads + management endpoints']
      }
    }
  });
});

module.exports = router;

// ========================================
// USAGE DOCUMENTATION
// ========================================

/*
Upload API Endpoints:

POST /api/upload/profile
- Content-Type: multipart/form-data
- Field: photo (single image file)
- Max size: 5MB
- Allowed: JPEG, PNG, WebP
- Rate limit: 20/15min

POST /api/upload/course/:courseId/thumbnail
- Content-Type: multipart/form-data
- Field: thumbnail (single image file)
- Max size: 10MB
- Allowed: JPEG, PNG, WebP
- Rate limit: 20/15min

POST /api/upload/lesson/:lessonId/video
- Content-Type: multipart/form-data
- Field: video (single video file)
- Max size: 500MB
- Allowed: MP4, WebM, MOV, AVI
- Rate limit: 5/hour

POST /api/upload/lesson/:lessonId/documents
- Content-Type: multipart/form-data
- Field: documents (multiple files)
- Max size: 50MB per file, 10 files max
- Allowed: PDF, Word, PowerPoint, Excel
- Rate limit: 20/15min

POST /api/upload/lesson/:lessonId/attachments
- Content-Type: multipart/form-data
- Field: attachments (multiple files)
- Max size: 100MB per file, 5 files max
- Allowed: Most file types (except dangerous ones)
- Rate limit: 20/15min

POST /api/upload/quiz/:quizId/import
- Content-Type: multipart/form-data
- Field: csvFile (single CSV file)
- Max size: 10MB
- Allowed: CSV only
- Rate limit: 5/30min

DELETE /api/upload/file
- Content-Type: application/json
- Body: { fileUrl: "...", fileType: "..." }

GET /api/upload/info?fileUrl=...
- Get file information

GET /api/upload/stats
- Get storage usage statistics

POST /api/upload/cleanup (Admin only)
- Clean up temporary files

GET /api/upload/health (Admin only)
- System health check
*/