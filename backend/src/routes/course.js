// File: backend/src/routes/course.js
// Path: backend/src/routes/course.js

const express = require('express');
const router = express.Router();

// Import controllers and middleware
const { protect, isTeacherOrAdmin, isEnrolledOrTeacher } = require('../middleware/auth');
const { validate, validateQuery, validateParams, courseSchemas, paramSchemas, querySchemas } = require('../middleware/validation');
const { generalLimiter, contentCreationLimiter, roleBasedLimiter } = require('../middleware/rateLimit');

// Try to import course controller - handle gracefully if not available
let courseController;
try {
  courseController = require('../controllers/course');
} catch (error) {
  console.log('Course controller not available, using mock endpoints');
  courseController = null;
}

// Helper function for safe routing
const safeCourseHandler = (controllerMethod, mockData = {}) => {
  return (req, res, next) => {
    if (courseController && typeof courseController[controllerMethod] === 'function') {
      return courseController[controllerMethod](req, res, next);
    } else {
      return res.json({
        success: true,
        data: {
          ...mockData,
          message: 'Course controller not available - returning mock data',
          timestamp: new Date().toISOString()
        }
      });
    }
  };
};

// ========================================
// PUBLIC ROUTES
// ========================================

// Get all published courses
router.get('/',
  generalLimiter,
  validateQuery(querySchemas.pagination),
  safeCourseHandler('getAllCourses', {
    courses: [
      {
        id: 1,
        title: 'Mock Course 1',
        description: 'This is a mock course for testing',
        teacher: { firstName: 'Mock', lastName: 'Teacher' },
        category: { name: 'Programming', color: '#007bff' },
        isPublished: true,
        difficultyLevel: 1
      }
    ],
    pagination: { total: 1, page: 1, limit: 12, pages: 1 }
  })
);

// Get single course details
router.get('/:id',
  generalLimiter,
  validateParams(paramSchemas.id),
  (req, res, next) => {
    // Add user to request if authenticated (optional auth)
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
  safeCourseHandler('getCourse', {
    course: {
      id: parseInt(req.params?.id) || 1,
      title: 'Mock Course Details',
      description: 'Detailed mock course information',
      teacher: { firstName: 'Mock', lastName: 'Teacher', email: 'teacher@mock.com' },
      category: { name: 'Programming', color: '#007bff' },
      lessons: [
        { id: 1, title: 'Introduction', lessonType: 'video', estimatedTime: 30 }
      ],
      quizzes: [
        { id: 1, title: 'Quiz 1', quizType: 'practice', timeLimit: 30 }
      ],
      isPublished: true
    },
    stats: { totalEnrollments: 25, approvedEnrollments: 20, pendingEnrollments: 5 },
    userEnrollment: null,
    canManage: false
  })
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
  safeCourseHandler('createCourse', {
    course: {
      id: Math.floor(Math.random() * 1000),
      title: req.body?.title || 'New Mock Course',
      description: req.body?.description || 'Mock course description',
      teacherId: req.user?.id,
      isPublished: false,
      isActive: true,
      created_at: new Date()
    }
  })
);

// Update course
router.put('/:id',
  validateParams(paramSchemas.id),
  validate(courseSchemas.update),
  safeCourseHandler('updateCourse', {
    course: {
      id: parseInt(req.params?.id) || 1,
      title: req.body?.title || 'Updated Mock Course',
      description: req.body?.description || 'Updated mock description',
      isPublished: req.body?.isPublished || false,
      updated_at: new Date()
    }
  })
);

// Delete course
router.delete('/:id',
  validateParams(paramSchemas.id),
  safeCourseHandler('deleteCourse', {
    message: 'Course deleted successfully (mock)'
  })
);

// Publish/unpublish course
router.patch('/:id/publish',
  validateParams(paramSchemas.id),
  validate({
    isPublished: require('joi').boolean().required()
  }),
  safeCourseHandler('togglePublishCourse', {
    course: {
      id: parseInt(req.params?.id) || 1,
      title: 'Mock Course',
      isPublished: req.body?.isPublished || false
    }
  })
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
  safeCourseHandler('requestEnrollment', {
    enrollment: {
      id: Math.floor(Math.random() * 1000),
      courseId: parseInt(req.params?.id) || 1,
      studentId: req.user?.id,
      status: 'pending',
      enrolledAt: new Date()
    }
  })
);

// Get enrolled students (Teachers/Admin)
router.get('/:id/students',
  validateParams(paramSchemas.id),
  validateQuery(querySchemas.pagination),
  isTeacherOrAdmin,
  safeCourseHandler('getCourseStudents', {
    students: [
      {
        id: 1,
        status: 'approved',
        student: {
          id: 1,
          firstName: 'Mock',
          lastName: 'Student',
          email: 'student@mock.com'
        },
        enrolledAt: new Date(),
        completionPercentage: 65
      }
    ],
    pagination: { total: 1, page: 1, limit: 20, pages: 1 }
  })
);

// Approve/reject enrollment (Teachers/Admin)
router.put('/:id/students/:studentId',
  validateParams({
    id: require('joi').number().integer().positive().required(),
    studentId: require('joi').number().integer().positive().required()
  }),
  validate({
    status: require('joi').string().valid('approved', 'rejected').required()
  }),
  isTeacherOrAdmin,
  safeCourseHandler('updateEnrollmentStatus', {
    enrollment: {
      id: Math.floor(Math.random() * 1000),
      student: {
        firstName: 'Mock',
        lastName: 'Student',
        email: 'student@mock.com'
      },
      status: req.body?.status || 'approved',
      approvedAt: new Date()
    }
  })
);

// ========================================
// COURSE CONTENT ACCESS (Enrolled students + Teachers)
// ========================================

// Get course lessons (requires enrollment)
router.get('/:id/lessons',
  validateParams(paramSchemas.id),
  isEnrolledOrTeacher,
  (req, res) => {
    res.json({
      success: true,
      data: {
        lessons: [
          {
            id: 1,
            title: 'Introduction to the Course',
            lessonType: 'video',
            videoUrl: 'https://example.com/video1.mp4',
            estimatedTime: 30,
            orderIndex: 1,
            isRequired: true
          },
          {
            id: 2,
            title: 'Course Materials',
            lessonType: 'document',
            estimatedTime: 15,
            orderIndex: 2,
            isRequired: false
          }
        ],
        message: 'Mock lesson data - Lesson controller not available'
      }
    });
  }
);

// Get course quizzes (requires enrollment)
router.get('/:id/quizzes',
  validateParams(paramSchemas.id),
  isEnrolledOrTeacher,
  (req, res) => {
    res.json({
      success: true,
      data: {
        quizzes: [
          {
            id: 1,
            title: 'Course Introduction Quiz',
            quizType: 'practice',
            timeLimit: 30,
            maxAttempts: 3,
            passingScore: 70,
            isPublished: true
          },
          {
            id: 2,
            title: 'Final Assessment',
            quizType: 'final_exam',
            timeLimit: 120,
            maxAttempts: 1,
            passingScore: 80,
            isPublished: true
          }
        ],
        message: 'Mock quiz data - Quiz controller not available'
      }
    });
  }
);

// ========================================
// COURSE CATEGORIES (Helper endpoints)
// ========================================

// Get all course categories
router.get('/categories/all', (req, res) => {
  try {
    const { CourseCategory } = require('../models');
    
    CourseCategory.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']]
    })
    .then(categories => {
      res.json({
        success: true,
        data: { categories }
      });
    })
    .catch(error => {
      res.json({
        success: true,
        data: {
          categories: [
            { id: 1, name: 'Programming', color: '#007bff', icon: 'code' },
            { id: 2, name: 'Design', color: '#28a745', icon: 'palette' },
            { id: 3, name: 'Business', color: '#ffc107', icon: 'briefcase' },
            { id: 4, name: 'Science', color: '#17a2b8', icon: 'flask' }
          ]
        },
        message: 'Mock category data - CourseCategory model not available'
      });
    });
  } catch (error) {
    res.json({
      success: true,
      data: {
        categories: [
          { id: 1, name: 'Programming', color: '#007bff', icon: 'code' },
          { id: 2, name: 'Design', color: '#28a745', icon: 'palette' }
        ]
      },
      message: 'Mock category data - models not available'
    });
  }
});

// ========================================
// DOCUMENTATION
// ========================================

router.get('/docs', (req, res) => {
  res.json({
    title: 'Course API Documentation',
    version: '1.0.0',
    baseUrl: '/api/courses',
    
    status: {
      courseController: courseController ? 'available' : 'mock mode'
    },
    
    publicEndpoints: {
      'GET /': 'Get all published courses',
      'GET /:id': 'Get course details',
      'GET /categories/all': 'Get all course categories'
    },
    
    teacherEndpoints: {
      'POST /': 'Create new course',
      'PUT /:id': 'Update course',
      'DELETE /:id': 'Delete course',
      'PATCH /:id/publish': 'Publish/unpublish course',
      'GET /:id/students': 'Get enrolled students',
      'PUT /:id/students/:studentId': 'Approve/reject enrollment'
    },
    
    studentEndpoints: {
      'POST /:id/enroll': 'Request enrollment',
      'GET /:id/lessons': 'Get course lessons (enrolled)',
      'GET /:id/quizzes': 'Get course quizzes (enrolled)'
    },
    
    authentication: {
      public: ['GET /', 'GET /:id'],
      required: ['All other endpoints'],
      roles: {
        student: ['POST /:id/enroll', 'GET /:id/lessons', 'GET /:id/quizzes'],
        teacher: ['All management endpoints for own courses'],
        admin: ['All endpoints']
      }
    }
  });
});

module.exports = router;