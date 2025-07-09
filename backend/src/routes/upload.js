// File: backend/src/routes/upload.js
// Path: backend/src/routes/upload.js

const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const {
  uploadProfilePhoto,
  uploadCourseThumbnail,
  uploadLessonVideo,
  uploadLessonDocuments,
  uploadLessonAttachments,
  uploadQuizCSV,
  uploadAssignmentSubmission,
  uploadMultipleFiles
} = require('../middleware/upload');
const uploadController = require('../controllers/upload');
const { rateLimit } = require('../middleware/rateLimit');

const router = express.Router();

// ========================================
// RATE LIMITING
// ========================================

// General upload rate limiting
const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 uploads per window
  message: 'อัปโหลดไฟล์เกินจำนวนที่อนุญาต กรุณาลองใหม่ในภายหลัง',
  standardHeaders: true,
  legacyHeaders: false
});

// Heavy file upload rate limiting (videos, large files)
const heavyUploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 heavy uploads per hour
  message: 'อัปโหลดไฟล์ขนาดใหญ่เกินจำนวนที่อนุญาต กรุณาลองใหม่ในภายหลัง',
  standardHeaders: true,
  legacyHeaders: false
});

// CSV import rate limiting
const csvImportRateLimit = rateLimit({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 5, // 5 CSV imports per 30 minutes
  message: 'นำเข้าไฟล์ CSV เกินจำนวนที่อนุญาต กรุณาลองใหม่ในภายหลัง',
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
  uploadController.uploadProfilePhoto
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
  uploadController.uploadCourseThumbnail
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
  uploadController.uploadLessonVideo
);

// @desc    Upload lesson documents (multiple files)
// @route   POST /api/upload/lesson/:lessonId/documents
// @access  Teacher/Admin
router.post('/lesson/:lessonId/documents',
  authenticate,
  authorize(['teacher', 'admin']),
  uploadRateLimit,
  uploadLessonDocuments,
  uploadController.uploadLessonAttachments
);

// @desc    Upload lesson attachments (mixed file types)
// @route   POST /api/upload/lesson/:lessonId/attachments
// @access  Teacher/Admin
router.post('/lesson/:lessonId/attachments',
  authenticate,
  authorize(['teacher', 'admin']),
  uploadRateLimit,
  uploadLessonAttachments,
  uploadController.uploadLessonAttachments
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
  uploadController.importQuizCSV
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
  async (req, res, next) => {
    // TODO: Implement assignment submission controller
    res.status(501).json({
      success: false,
      message: 'Assignment submission not yet implemented'
    });
  }
);

// ========================================
// GENERAL FILE UPLOADS
// ========================================

// @desc    Upload multiple files (general purpose)
// @route   POST /api/upload/files
// @access  Teacher/Admin
router.post('/files',
  authenticate,
  authorize(['teacher', 'admin']),
  uploadRateLimit,
  uploadMultipleFiles,
  async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'ไม่พบไฟล์ที่อัปโหลด'
      });
    }

    try {
      const { saveFileLocally, generateUniqueFileName, formatFileSize, getFileCategory, getFileIcon } = require('../utils/fileHelper');
      const uploadedFiles = [];
      const errors = [];

      // Process each file
      for (const file of req.files) {
        try {
          const fileName = generateUniqueFileName(file.originalname, 'general');
          const fileBuffer = file.buffer || require('fs').readFileSync(file.path);
          const saveResult = await saveFileLocally(fileBuffer, fileName, 'misc');

          if (saveResult.success) {
            uploadedFiles.push({
              originalName: file.originalname,
              fileName: fileName,
              url: saveResult.fullUrl,
              size: formatFileSize(file.size || fileBuffer.length),
              mimeType: file.mimetype,
              category: getFileCategory(file.mimetype),
              icon: getFileIcon(file.mimetype),
              uploadedAt: new Date()
            });
          } else {
            errors.push(`${file.originalname}: การบันทึกไฟล์ล้มเหลว`);
          }

          // Clean up temp file
          if (file.path) {
            try {
              const { deleteFileLocally } = require('../utils/fileHelper');
              await deleteFileLocally(file.path);
            } catch (error) {
              console.log('Failed to clean up temp file:', error.message);
            }
          }

        } catch (error) {
          console.error(`Error processing file ${file.originalname}:`, error);
          errors.push(`${file.originalname}: เกิดข้อผิดพลาดในการประมวลผล`);
        }
      }

      const response = {
        success: true,
        message: `อัปโหลดไฟล์สำเร็จ ${uploadedFiles.length} ไฟล์`,
        data: {
          uploadedFiles: uploadedFiles,
          totalFiles: uploadedFiles.length
        }
      };

      if (errors.length > 0) {
        response.warnings = errors;
        response.message += ` (มีข้อผิดพลาด ${errors.length} ไฟล์)`;
      }

      res.status(200).json(response);

    } catch (error) {
      console.error('General file upload error:', error);
      next(new (require('../middleware/errorHandler')).AppError('เกิดข้อผิดพลาดในการอัปโหลดไฟล์', 500));
    }
  }
);

// ========================================
// FILE MANAGEMENT ROUTES
// ========================================

// @desc    Delete uploaded file
// @route   DELETE /api/upload/file
// @access  Private (File owner or Admin)
router.delete('/file',
  authenticate,
  uploadController.deleteUploadedFile
);

// @desc    Get file information
// @route   GET /api/upload/info
// @access  Private
router.get('/info',
  authenticate,
  uploadController.getFileInfo
);

// ========================================
// STORAGE STATISTICS
// ========================================

// @desc    Get storage statistics
// @route   GET /api/upload/stats
// @access  Private
router.get('/stats',
  authenticate,
  async (req, res, next) => {
    try {
      const { getDirectorySize } = require('../utils/fileHelper');
      const path = require('path');

      // Get storage usage by category
      const baseDir = './uploads';
      const categories = ['profiles', 'courses', 'lessons', 'misc', 'temp'];
      
      const stats = {
        user: req.user.id,
        categories: {},
        total: { size: 0, fileCount: 0, formattedSize: '0 Bytes' }
      };

      // Calculate size for each category
      for (const category of categories) {
        const categoryPath = path.join(baseDir, category);
        const categoryStats = await getDirectorySize(categoryPath);
        stats.categories[category] = categoryStats;
        stats.total.size += categoryStats.size;
        stats.total.fileCount += categoryStats.fileCount;
      }

      // Format total size
      const { formatFileSize } = require('../utils/fileHelper');
      stats.total.formattedSize = formatFileSize(stats.total.size);

      // Get storage limits
      const config = require('../config/storage').getStorageConfig();
      stats.limits = config.default.limits;

      res.status(200).json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Storage stats error:', error);
      next(new (require('../middleware/errorHandler')).AppError('เกิดข้อผิดพลาดในการดึงข้อมูลการใช้งาน', 500));
    }
  }
);

// ========================================
// CLEANUP ROUTES (Admin only)
// ========================================

// @desc    Clean up temporary files
// @route   POST /api/upload/cleanup
// @access  Admin only
router.post('/cleanup',
  authenticate,
  authorize(['admin']),
  async (req, res, next) => {
    try {
      const { cleanupTempFiles } = require('../utils/fileHelper');
      const { maxAgeHours = 24 } = req.body;

      const cleanupResult = await cleanupTempFiles('./uploads/temp', maxAgeHours);

      res.status(200).json({
        success: true,
        message: `ทำความสะอาดไฟล์ชั่วคราวสำเร็จ`,
        data: {
          deletedCount: cleanupResult.deletedCount || 0,
          maxAgeHours: maxAgeHours
        }
      });

    } catch (error) {
      console.error('Cleanup error:', error);
      next(new (require('../middleware/errorHandler')).AppError('เกิดข้อผิดพลาดในการทำความสะอาดไฟล์', 500));
    }
  }
);

// ========================================
// HEALTH CHECK
// ========================================

// @desc    Check upload system health
// @route   GET /api/upload/health
// @access  Admin only
router.get('/health',
  authenticate,
  authorize(['admin']),
  async (req, res) => {
    try {
      const { getDirectorySize, ensureDirectoryExists } = require('../utils/fileHelper');
      const fs = require('fs').promises;
      const path = require('path');

      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        checks: {
          directories: { status: 'checking', details: {} },
          permissions: { status: 'checking', details: {} },
          storage: { status: 'checking', details: {} },
          dependencies: { status: 'checking', details: {} }
        }
      };

      // Check directories
      const requiredDirs = ['uploads', 'uploads/profiles', 'uploads/courses', 'uploads/lessons', 'uploads/temp'];
      for (const dir of requiredDirs) {
        try {
          await ensureDirectoryExists(dir);
          health.checks.directories.details[dir] = 'exists';
        } catch (error) {
          health.checks.directories.details[dir] = `error: ${error.message}`;
          health.checks.directories.status = 'error';
        }
      }
      if (health.checks.directories.status === 'checking') {
        health.checks.directories.status = 'healthy';
      }

      // Check permissions
      try {
        const testFile = path.join('./uploads/temp', 'health_check.txt');
        await fs.writeFile(testFile, 'health check');
        await fs.unlink(testFile);
        health.checks.permissions.status = 'healthy';
        health.checks.permissions.details.write = 'ok';
        health.checks.permissions.details.delete = 'ok';
      } catch (error) {
        health.checks.permissions.status = 'error';
        health.checks.permissions.details.error = error.message;
      }

      // Check storage usage
      try {
        const storageStats = await getDirectorySize('./uploads');
        health.checks.storage.status = 'healthy';
        health.checks.storage.details = storageStats;
      } catch (error) {
        health.checks.storage.status = 'error';
        health.checks.storage.details.error = error.message;
      }

      // Check dependencies
      try {
        require('multer');
        require('sharp');
        require('uuid');
        health.checks.dependencies.status = 'healthy';
        health.checks.dependencies.details = {
          multer: 'available',
          sharp: 'available',
          uuid: 'available'
        };
      } catch (error) {
        health.checks.dependencies.status = 'error';
        health.checks.dependencies.details.error = error.message;
      }

      // Overall status
      const hasErrors = Object.values(health.checks).some(check => check.status === 'error');
      if (hasErrors) {
        health.status = 'unhealthy';
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

module.exports = router;

// ========================================
// USAGE DOCUMENTATION
// ========================================

/*
Upload API Endpoints:

POST /api/upload/profile
- Content-Type: multipart/form-data
- Field: profilePhoto (single image file)
- Max size: 5MB
- Allowed: JPEG, PNG, WebP
- Rate limit: 20/15min

POST /api/upload/course/:courseId/thumbnail
- Content-Type: multipart/form-data
- Field: courseThumbnail (single image file)
- Max size: 10MB
- Allowed: JPEG, PNG, WebP
- Rate limit: 20/15min

POST /api/upload/lesson/:lessonId/video
- Content-Type: multipart/form-data
- Field: lessonVideo (single video file)
- Max size: 500MB
- Allowed: MP4, WebM, MOV, AVI
- Rate limit: 5/hour

POST /api/upload/lesson/:lessonId/documents
- Content-Type: multipart/form-data
- Field: lessonDocuments (multiple files)
- Max size: 50MB per file, 10 files max
- Allowed: PDF, Word, PowerPoint, Excel
- Rate limit: 20/15min

POST /api/upload/lesson/:lessonId/attachments
- Content-Type: multipart/form-data
- Field: lessonAttachments (multiple files)
- Max size: 100MB per file, 5 files max
- Allowed: Most file types (except dangerous ones)
- Rate limit: 20/15min

POST /api/upload/quiz/:quizId/import
- Content-Type: multipart/form-data
- Field: quizImport (single CSV file)
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