// File: backend/src/routes/course.js
// Path: backend/src/routes/course.js

const express = require('express');
const router = express.Router();
const Joi = require('joi');

// Import middleware and controllers
const {
  validate,
  validateQuery,
  validateParams,
  courseSchemas,
  enrollmentSchemas,
  paramSchemas,
  querySchemas
} = require('../middleware/validation');

const {
  protect,
  isTeacherOrAdmin,
  isEnrolledOrTeacher
} = require('../middleware/auth');

const {
  generalLimiter,
  roleBasedLimiter,
  contentCreationLimiter
} = require('../middleware/rateLimit');

// Import controllers
const {
  getAllCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  togglePublishCourse,
  requestEnrollment,
  getCourseStudents,
  updateEnrollmentStatus,
  uploadCourseThumbnail,
  deleteCourseThumbnail
} = require('../controllers/course');

// Import file upload middleware
const { uploadCourseThumbnail: uploadThumbnailMiddleware } = require('../middleware/upload');

// ========================================
// PUBLIC ROUTES (No authentication required)
// ========================================

router.use(generalLimiter);

// Get all published courses
router.get('/',
  validateQuery(querySchemas.pagination),
  getAllCourses
);

// Get single course details
router.get('/:id',
  validateParams(paramSchemas.id),
  // Optional auth middleware is handled inside getCourse or via a wrapper if needed.
  // The controller getCourse checks req.user if it exists.
  // We need a middleware to populate req.user if token exists but not enforce it.
  (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const { verifyToken } = require('../middleware/auth');
        const decoded = verifyToken(token);
        const { User } = require('../models');
        User.findByPk(decoded.id)
          .then(user => {
            if (user && user.status === 'active') {
              req.user = user;
            }
            next();
          })
          .catch(() => next());
      } catch (error) {
        next();
      }
    } else {
      next();
    }
  },
  getCourse
);

// ========================================
// AUTHENTICATION REQUIRED ROUTES
// ========================================

router.use(protect);
router.use(roleBasedLimiter);

// ========================================
// COURSE MANAGEMENT (Teachers/Admin)
// ========================================

// Create new course
router.post('/',
  isTeacherOrAdmin,
  contentCreationLimiter,
  validate(courseSchemas.create),
  createCourse
);

// Update course
router.put('/:id',
  validateParams(paramSchemas.id),
  validate(courseSchemas.update),
  updateCourse
);

// Delete course
router.delete('/:id',
  validateParams(paramSchemas.id),
  deleteCourse
);

// Publish/unpublish course
router.patch('/:id/publish',
  validateParams(paramSchemas.id),
  validate(Joi.object({
    isPublished: Joi.boolean().required()
  })),
  togglePublishCourse
);

// Upload course thumbnail
router.post('/:id/thumbnail',
  validateParams(paramSchemas.id),
  isTeacherOrAdmin,
  uploadThumbnailMiddleware,
  uploadCourseThumbnail
);

// Delete course thumbnail
router.delete('/:id/thumbnail',
  validateParams(paramSchemas.id),
  isTeacherOrAdmin,
  deleteCourseThumbnail
);

// ========================================
// ENROLLMENT MANAGEMENT
// ========================================

// Request enrollment (Students only)
router.post('/:id/enroll',
  validateParams(paramSchemas.id),
  (req, res, next) => {
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        error: 'Only students can enroll in courses'
      });
    }
    next();
  },
  requestEnrollment
);

// Get enrolled students (Teachers/Admin)
router.get('/:id/students',
  validateParams(paramSchemas.id),
  validateQuery(querySchemas.pagination),
  isTeacherOrAdmin,
  getCourseStudents
);

// Approve/reject enrollment (Teachers/Admin)
router.put('/:id/students/:studentId',
  validateParams(paramSchemas.courseStudentParams),
  validate(enrollmentSchemas.updateStatus),
  isTeacherOrAdmin,
  updateEnrollmentStatus
);

// ========================================
// COURSE CONTENT ACCESS (Enrolled students + Teachers)
// ========================================

// Note: Lesson and Quiz routes are handled in their respective files,
// but we might want to redirect or handle them here if structured that way.
// Currently, backend/src/routes/index.js mounts /api/lessons and /api/quizzes separately.
// So we don't need nested routes here for lessons/quizzes content, 
// unless we want to get *all* lessons/quizzes for a course, which is usually done via 
// /api/lessons/course/:courseId or /api/quizzes/course/:courseId defined in those files.

// However, the previous mock routes had:
// GET /:id/lessons
// GET /:id/quizzes
// We should check if we want to keep these convenience routes or rely on the other files.
// The controller `course.js` does NOT have `getCourseLessons` or `getCourseQuizzes`.
// Those are in `lesson.js` (`getCourseActions`) and `quiz.js` (`getCourseQuizzes`).
// So we should NOT define them here to avoid duplication or missing controllers.
// The frontend should use /api/lessons/course/:courseId and /api/quizzes/course/:courseId.

module.exports = router;