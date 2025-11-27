// File: backend/src/routes/lesson.js
// Path: backend/src/routes/lesson.js

const express = require('express');
const router = express.Router();
const Joi = require('joi');

// Import middleware
const {
  protect,
  isTeacherOrAdmin,
  isEnrolledOrTeacher,
  isStudent
} = require('../middleware/auth');

const {
  validate,
  validateParams,
  paramSchemas
} = require('../middleware/validation');

const {
  generalLimiter,
  contentCreationLimiter,
  roleBasedLimiter
} = require('../middleware/rateLimit');

// Import controllers
const {
  getCourseActions, // This is actually getLessonsForCourse
  getLesson,
  createLesson,
  updateLesson,
  deleteLesson,
  togglePublishLesson,
  updateLessonProgress,
  markLessonComplete,
  uploadLessonVideo,
  deleteLessonVideo,
  uploadLessonAttachments,
  deleteLessonAttachment
} = require('../controllers/lesson');

// Import file upload middleware
const {
  uploadLessonVideo: uploadVideoMiddleware,
  uploadLessonAttachments: uploadAttachmentsMiddleware
} = require('../middleware/upload');

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
  getCourseActions
);

// Get single lesson details
router.get('/:id',
  validateParams(paramSchemas.id),
  isEnrolledOrTeacher,
  getLesson
);

// ========================================
// LESSON MANAGEMENT ROUTES (Teachers/Admin)
// ========================================

// Create new lesson
router.post('/',
  contentCreationLimiter,
  isTeacherOrAdmin,
  validate(Joi.object({
    courseId: Joi.number().integer().positive().required(),
    title: Joi.string().min(3).max(255).required(),
    description: Joi.string().max(1000).optional().allow(''),
    content: Joi.string().optional().allow(''),
    lessonType: Joi.string().valid('video', 'text', 'document', 'quiz').required(),
    videoUrl: Joi.string().uri().optional().allow(''),
    videoDuration: Joi.number().integer().positive().optional(),
    fileAttachments: Joi.array().optional(),
    estimatedTime: Joi.number().integer().positive().optional(),
    isRequired: Joi.boolean().optional(),
    prerequisites: Joi.array().items(Joi.number().integer().positive()).optional()
  })),
  createLesson
);

// Update lesson
router.put('/:id',
  validateParams(paramSchemas.id),
  isTeacherOrAdmin,
  validate(Joi.object({
    title: Joi.string().min(3).max(255).optional(),
    description: Joi.string().max(1000).optional().allow(''),
    content: Joi.string().optional().allow(''),
    lessonType: Joi.string().valid('video', 'text', 'document', 'quiz').optional(),
    videoUrl: Joi.string().uri().optional().allow(''),
    videoDuration: Joi.number().integer().positive().optional(),
    fileAttachments: Joi.array().optional(),
    estimatedTime: Joi.number().integer().positive().optional(),
    isRequired: Joi.boolean().optional(),
    prerequisites: Joi.array().items(Joi.number().integer().positive()).optional()
  })),
  updateLesson
);

// Delete lesson
router.delete('/:id',
  validateParams(paramSchemas.id),
  isTeacherOrAdmin,
  deleteLesson
);

// Publish/unpublish lesson
router.patch('/:id/publish',
  validateParams(paramSchemas.id),
  isTeacherOrAdmin,
  validate(Joi.object({
    status: Joi.string().valid('published', 'draft', 'archived').required()
  })),
  togglePublishLesson
);

// ========================================
// LESSON FILE MANAGEMENT
// ========================================

// Upload lesson video
router.post('/:id/video',
  validateParams(paramSchemas.id),
  isTeacherOrAdmin,
  uploadVideoMiddleware,
  uploadLessonVideo
);

// Delete lesson video
router.delete('/:id/video',
  validateParams(paramSchemas.id),
  isTeacherOrAdmin,
  deleteLessonVideo
);

// Upload lesson attachments
router.post('/:id/attachments',
  validateParams(paramSchemas.id),
  isTeacherOrAdmin,
  uploadAttachmentsMiddleware,
  uploadLessonAttachments
);

// Delete lesson attachment
router.delete('/:id/attachments',
  validateParams(paramSchemas.id),
  isTeacherOrAdmin,
  deleteLessonAttachment
);

// ========================================
// LESSON PROGRESS ROUTES (Students)
// ========================================

// Update lesson progress
router.post('/:id/progress',
  validateParams(paramSchemas.id),
  isStudent,
  validate(Joi.object({
    timeSpent: Joi.number().integer().min(0).optional(),
    completionPercentage: Joi.number().min(0).max(100).optional(),
    notes: Joi.string().max(1000).optional().allow(''),
    status: Joi.string().valid('not_started', 'in_progress', 'completed').optional()
  })),
  updateLessonProgress
);

// Mark lesson as completed
router.post('/:id/complete',
  validateParams(paramSchemas.id),
  isStudent,
  validate(Joi.object({
    timeSpent: Joi.number().integer().min(0).optional()
  })),
  markLessonComplete
);

// Get lesson progress for student
// Note: This is usually handled in getLesson with includeProgress=true, 
// but if we need a separate endpoint:
router.get('/:id/progress',
  validateParams(paramSchemas.id),
  isStudent,
  (req, res, next) => {
    // We can reuse getLesson but force includeProgress logic if needed,
    // or just rely on getLesson. 
    // For now, let's redirect to getLesson with query param?
    // Or just use getLesson directly as it handles progress for students.
    req.query.includeProgress = 'true';
    getLesson(req, res, next);
  }
);

module.exports = router;