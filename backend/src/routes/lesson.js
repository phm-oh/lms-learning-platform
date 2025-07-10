// File: backend/src/routes/lesson.js
// Path: backend/src/routes/lesson.js

const express = require('express');
const router = express.Router();

// Import middleware
const { protect, isTeacherOrAdmin, isEnrolledOrTeacher, isStudent } = require('../middleware/auth');
const { validate, validateParams, paramSchemas } = require('../middleware/validation');
const { generalLimiter, contentCreationLimiter, roleBasedLimiter } = require('../middleware/rateLimit');

// Try to import lesson controller
let lessonController;
try {
  lessonController = require('../controllers/lesson');
} catch (error) {
  console.log('Lesson controller not available, using mock endpoints');
  lessonController = null;
}

// Helper function for safe routing
const safeLessonHandler = (controllerMethod, mockDataFunction) => {
  return (req, res, next) => {
    if (lessonController && typeof lessonController[controllerMethod] === 'function') {
      return lessonController[controllerMethod](req, res, next);
    } else {
      // If mockDataFunction is a function, call it with req to get dynamic data
      const mockData = typeof mockDataFunction === 'function' ? mockDataFunction(req) : mockDataFunction;
      
      return res.json({
        success: true,
        data: {
          ...mockData,
          message: 'Lesson controller not available - returning mock data',
          timestamp: new Date().toISOString()
        }
      });
    }
  };
};

// ========================================
// MIDDLEWARE - Authentication required for all routes
// ========================================

router.use(protect);
router.use(roleBasedLimiter);

// ========================================
// LESSON VIEWING ROUTES
// ========================================

// Get lessons for a course
router.get('/course/:courseId',
  validateParams(paramSchemas.courseId),
  isEnrolledOrTeacher,
  (req, res, next) => {
    req.params.courseId = parseInt(req.params.courseId);
    next();
  },
  safeLessonHandler('getCourseActions', (req) => ({
    lessons: [
      {
        id: 1,
        title: 'Introduction to the Course',
        description: 'Welcome to this amazing course!',
        lessonType: 'video',
        videoUrl: 'https://example.com/intro.mp4',
        estimatedTime: 30,
        orderIndex: 1,
        status: 'published',
        isRequired: true,
        isAccessible: true,
        progress: req.query.includeProgress === 'true' ? {
          status: 'not_started',
          completionPercentage: 0,
          timeSpent: 0
        } : null
      },
      {
        id: 2,
        title: 'Course Materials and Resources',
        description: 'Download and review the course materials',
        lessonType: 'document',
        estimatedTime: 15,
        orderIndex: 2,
        status: 'published',
        isRequired: false,
        isAccessible: true,
        progress: req.query.includeProgress === 'true' ? {
          status: 'completed',
          completionPercentage: 100,
          timeSpent: 900,
          completedAt: new Date()
        } : null
      }
    ],
    total: 2
  }))
);

// Get single lesson details
router.get('/:id',
  validateParams(paramSchemas.id),
  isEnrolledOrTeacher,
  safeLessonHandler('getLesson', (req) => ({
    lesson: {
      id: parseInt(req.params.id),
      title: 'Mock Lesson Details',
      description: 'This is a detailed mock lesson for testing',
      content: '<h2>Lesson Content</h2><p>This is where the lesson content would be displayed...</p>',
      lessonType: 'video',
      videoUrl: 'https://example.com/lesson-video.mp4',
      videoDuration: 1800,
      estimatedTime: 30,
      orderIndex: 1,
      status: 'published',
      isRequired: true,
      fileAttachments: [
        {
          name: 'lesson-slides.pdf',
          url: '/uploads/lesson-slides.pdf',
          type: 'pdf'
        }
      ],
      course: {
        id: 1,
        title: 'Mock Course',
        teacher: { firstName: 'John', lastName: 'Doe' }
      },
      progress: req.user?.role === 'student' ? {
        status: 'in_progress',
        completionPercentage: 45,
        timeSpent: 810,
        lastAccessed: new Date(),
        notes: 'Great lesson so far!'
      } : null
    }
  }))
);

// ========================================
// LESSON MANAGEMENT ROUTES (Teachers/Admin)
// ========================================

// Create new lesson
router.post('/',
  contentCreationLimiter,
  isTeacherOrAdmin,
  validate({
    courseId: require('joi').number().integer().positive().required(),
    title: require('joi').string().min(3).max(255).required(),
    description: require('joi').string().max(1000).optional().allow(''),
    content: require('joi').string().optional().allow(''),
    lessonType: require('joi').string().valid('video', 'text', 'document', 'quiz').required(),
    videoUrl: require('joi').string().uri().optional().allow(''),
    videoDuration: require('joi').number().integer().positive().optional(),
    fileAttachments: require('joi').array().optional(),
    estimatedTime: require('joi').number().integer().positive().optional(),
    isRequired: require('joi').boolean().optional(),
    prerequisites: require('joi').array().items(require('joi').number().integer().positive()).optional()
  }),
  safeLessonHandler('createLesson', (req) => ({
    lesson: {
      id: Math.floor(Math.random() * 1000),
      courseId: req.body.courseId,
      title: req.body.title,
      description: req.body.description || '',
      content: req.body.content || '',
      lessonType: req.body.lessonType,
      videoUrl: req.body.videoUrl || null,
      estimatedTime: req.body.estimatedTime || 30,
      orderIndex: 1,
      status: 'draft',
      isRequired: req.body.isRequired || true,
      created_at: new Date()
    }
  }))
);

// Update lesson
router.put('/:id',
  validateParams(paramSchemas.id),
  isTeacherOrAdmin,
  validate({
    title: require('joi').string().min(3).max(255).optional(),
    description: require('joi').string().max(1000).optional().allow(''),
    content: require('joi').string().optional().allow(''),
    lessonType: require('joi').string().valid('video', 'text', 'document', 'quiz').optional(),
    videoUrl: require('joi').string().uri().optional().allow(''),
    videoDuration: require('joi').number().integer().positive().optional(),
    fileAttachments: require('joi').array().optional(),
    estimatedTime: require('joi').number().integer().positive().optional(),
    isRequired: require('joi').boolean().optional(),
    prerequisites: require('joi').array().items(require('joi').number().integer().positive()).optional()
  }),
  (req, res) => {
    res.json({
      success: true,
      message: 'Lesson updated successfully',
      data: {
        lesson: {
          id: parseInt(req.params.id),
          ...req.body,
          updated_at: new Date()
        }
      },
      note: 'Mock response - Lesson controller not available'
    });
  }
);

// Delete lesson
router.delete('/:id',
  validateParams(paramSchemas.id),
  isTeacherOrAdmin,
  (req, res) => {
    res.json({
      success: true,
      message: 'Lesson deleted successfully',
      note: 'Mock response - Lesson controller not available'
    });
  }
);

// Publish/unpublish lesson
router.patch('/:id/publish',
  validateParams(paramSchemas.id),
  isTeacherOrAdmin,
  validate({
    status: require('joi').string().valid('published', 'draft', 'archived').required()
  }),
  (req, res) => {
    const { status } = req.body;
    
    res.json({
      success: true,
      message: `Lesson ${status} successfully`,
      data: {
        lesson: {
          id: parseInt(req.params.id),
          status
        }
      },
      note: 'Mock response - Lesson controller not available'
    });
  }
);

// ========================================
// LESSON PROGRESS ROUTES (Students)
// ========================================

// Update lesson progress
router.post('/:id/progress',
  validateParams(paramSchemas.id),
  isStudent,
  validate({
    timeSpent: require('joi').number().integer().min(0).optional(),
    completionPercentage: require('joi').number().min(0).max(100).optional(),
    notes: require('joi').string().max(1000).optional().allow(''),
    status: require('joi').string().valid('not_started', 'in_progress', 'completed').optional()
  }),
  safeLessonHandler('updateLessonProgress', (req) => ({
    progress: {
      status: req.body.status || 'in_progress',
      completionPercentage: req.body.completionPercentage || 0,
      timeSpent: req.body.timeSpent || 0,
      lastAccessed: new Date()
    }
  }))
);

// Mark lesson as completed
router.post('/:id/complete',
  validateParams(paramSchemas.id),
  isStudent,
  validate({
    timeSpent: require('joi').number().integer().min(0).optional()
  }),
  safeLessonHandler('markLessonComplete', (req) => ({
    progress: {
      status: 'completed',
      completionPercentage: 100,
      timeSpent: req.body.timeSpent || 0,
      completedAt: new Date()
    }
  }))
);

// Get lesson progress for student
router.get('/:id/progress',
  validateParams(paramSchemas.id),
  isStudent,
  (req, res) => {
    res.json({
      success: true,
      data: {
        progress: {
          lessonId: parseInt(req.params.id),
          studentId: req.user.id,
          status: 'in_progress',
          completionPercentage: 65,
          timeSpent: 1200,
          lastAccessed: new Date(),
          notes: 'Taking notes while watching the video',
          created_at: new Date()
        },
        lesson: {
          title: 'Mock Lesson',
          estimatedTime: 30
        },
        message: 'Mock progress data - LessonProgress model not available'
      }
    });
  }
);

// ========================================
// BULK OPERATIONS
// ========================================

// Reorder lessons
router.patch('/reorder',
  isTeacherOrAdmin,
  validate({
    courseId: require('joi').number().integer().positive().required(),
    lessonOrders: require('joi').array().items(
      require('joi').object({
        id: require('joi').number().integer().positive().required(),
        orderIndex: require('joi').number().integer().positive().required()
      })
    ).required()
  }),
  (req, res) => {
    res.json({
      success: true,
      message: 'Lessons reordered successfully',
      data: {
        updated: req.body.lessonOrders.length
      },
      note: 'Mock response - Lesson controller not available'
    });
  }
);

// Duplicate lesson
router.post('/:id/duplicate',
  validateParams(paramSchemas.id),
  isTeacherOrAdmin,
  validate({
    newTitle: require('joi').string().min(3).max(255).required(),
    courseId: require('joi').number().integer().positive().optional()
  }),
  (req, res) => {
    res.json({
      success: true,
      message: 'Lesson duplicated successfully',
      data: {
        lesson: {
          id: Math.floor(Math.random() * 1000),
          title: req.body.newTitle,
          courseId: req.body.courseId || 1,
          status: 'draft',
          created_at: new Date()
        }
      },
      note: 'Mock response - Lesson controller not available'
    });
  }
);

// ========================================
// LESSON FILE MANAGEMENT
// ========================================

// Upload lesson video
router.post('/:id/video',
  validateParams(paramSchemas.id),
  isTeacherOrAdmin,
  (req, res) => {
    res.json({
      success: true,
      message: 'Video upload endpoint ready',
      data: {
        lessonId: parseInt(req.params.id),
        uploadUrl: `/api/upload/lesson/${req.params.id}/video`
      },
      note: 'Mock response - Use upload routes for actual file upload'
    });
  }
);

// Upload lesson attachments
router.post('/:id/attachments',
  validateParams(paramSchemas.id),
  isTeacherOrAdmin,
  (req, res) => {
    res.json({
      success: true,
      message: 'Attachments upload endpoint ready',
      data: {
        lessonId: parseInt(req.params.id),
        uploadUrl: `/api/upload/lesson/${req.params.id}/attachments`
      },
      note: 'Mock response - Use upload routes for actual file upload'
    });
  }
);

// ========================================
// DOCUMENTATION
// ========================================

router.get('/docs', (req, res) => {
  res.json({
    title: 'Lesson API Documentation',
    version: '1.0.0',
    baseUrl: '/api/lessons',
    
    status: {
      lessonController: lessonController ? 'available' : 'mock mode'
    },
    
    viewingEndpoints: {
      'GET /course/:courseId': 'Get lessons for a course',
      'GET /:id': 'Get lesson details',
      'GET /:id/progress': 'Get lesson progress (students)'
    },
    
    managementEndpoints: {
      'POST /': 'Create new lesson',
      'PUT /:id': 'Update lesson',
      'DELETE /:id': 'Delete lesson',
      'PATCH /:id/publish': 'Publish/unpublish lesson'
    },
    
    progressEndpoints: {
      'POST /:id/progress': 'Update lesson progress',
      'POST /:id/complete': 'Mark lesson as completed'
    },
    
    fileEndpoints: {
      'POST /:id/video': 'Upload lesson video',
      'POST /:id/attachments': 'Upload lesson attachments'
    },
    
    bulkEndpoints: {
      'PATCH /reorder': 'Reorder lessons',
      'POST /:id/duplicate': 'Duplicate lesson'
    },
    
    authentication: {
      required: ['All endpoints'],
      roles: {
        student: ['GET routes', 'Progress routes'],
        teacher: ['All management endpoints for own courses'],
        admin: ['All endpoints']
      }
    }
  });
});

module.exports = router;