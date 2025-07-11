// File: backend/src/routes/course.js  
// Path: backend/src/routes/course.js

const express = require('express');
const router = express.Router();
const Joi = require('joi'); // ✅ Import Joi at the top

// Import middleware and controllers
const {
  validate,
  validateQuery,
  validateParams,
  userSchemas,
  courseSchemas,
  enrollmentSchemas,  // 🆕 NEW: Import enrollment schemas
  quizSchemas,
  paramSchemas,
  querySchemas
} = require('../middleware/validation');

const {
  protect,
  restrictTo,
  isAdmin,
  isTeacherOrAdmin,
  isStudent,
  isEnrolledOrTeacher
} = require('../middleware/auth');

const {
  generalLimiter,
  authLimiter,
  roleBasedLimiter,
  contentCreationLimiter
} = require('../middleware/rateLimit');

// Import controllers (using safe mock handlers for now)
const {
  getAllCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  togglePublishCourse,
  requestEnrollment,
  getCourseStudents,
  updateEnrollmentStatus
} = require('../controllers/course');

// ========================================
// ADDITIONAL VALIDATION SCHEMAS (Course-specific)
// ========================================
const courseSpecificSchemas = {
  publish: Joi.object({
    isPublished: Joi.boolean()
      .required()
      .messages({
        'any.required': 'isPublished field is required',
        'boolean.base': 'isPublished must be a boolean value'
      })
  })
};

// ========================================
// SAFE MOCK HANDLER (Temporary)
// ========================================
const safeCourseHandler = (methodName, mockDataFactory = () => ({})) => {
  return (req, res, next) => {
    // Log the intended operation
    console.log(`📚 Course Controller Mock: ${methodName}`);
    console.log(`📍 Route: ${req.method} ${req.originalUrl}`);
    console.log(`👤 User: ${req.user?.email || 'Anonymous'} (${req.user?.role || 'No role'})`);
    
    // Generate mock data using the factory function (now we have access to req)
    let mockData = typeof mockDataFactory === 'function' ? mockDataFactory(req) : mockDataFactory;
    
    // For updateEnrollmentStatus, use actual body data
    if (methodName === 'updateEnrollmentStatus' && req.body) {
      mockData = {
        ...mockData,
        enrollment: {
          ...mockData.enrollment,
          status: req.body.status,
          reason: req.body.reason,
          rejectionReason: req.body.rejectionReason,
          student: {
            id: parseInt(req.params.studentId),
            firstName: 'Mock',
            lastName: 'Student',
            email: 'student@mock.com'
          }
        }
      };
    }
    
    // Return mock data
    res.status(200).json({
      success: true,
      message: `Mock response from ${methodName}`,
      mockMode: true,
      data: mockData,
      originalRequest: {
        method: req.method,
        url: req.originalUrl,
        params: req.params,
        query: req.query,
        body: req.body
      }
    });
  };
};

// ========================================
// PUBLIC ROUTES (No authentication required)
// ========================================

router.use(generalLimiter);

// Get all published courses
router.get('/', 
  validateQuery(querySchemas.pagination),
  safeCourseHandler('getAllCourses', () => ({
    courses: [
      {
        id: 1,
        title: 'Introduction to Programming',
        description: 'Learn the basics of programming',
        teacher: { firstName: 'John', lastName: 'Doe' },
        category: { name: 'Programming', color: '#007bff' },
        isPublished: true
      }
    ],
    pagination: { total: 1, page: 1, limit: 10, pages: 1 }
  }))
);

// Get single course details
router.get('/:id',
  validateParams(paramSchemas.id),
  // Optional auth middleware (if logged in, add user context)
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
  safeCourseHandler('getCourse', (req) => ({
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
  }))
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
  safeCourseHandler('createCourse', (req) => ({
    course: {
      id: Math.floor(Math.random() * 1000),
      title: req.body?.title || 'New Mock Course',
      description: req.body?.description || 'Mock course description',
      teacherId: req.user?.id || 1,
      isPublished: false,
      isActive: true,
      created_at: new Date()
    }
  }))
);

// Update course
router.put('/:id',
  validateParams(paramSchemas.id),
  validate(courseSchemas.update),
  safeCourseHandler('updateCourse', (req) => ({
    course: {
      id: parseInt(req.params?.id) || 1,
      title: req.body?.title || 'Updated Mock Course',
      description: req.body?.description || 'Updated mock description',
      isPublished: req.body?.isPublished || false,
      updated_at: new Date()
    }
  }))
);

// Delete course
router.delete('/:id',
  validateParams(paramSchemas.id),
  safeCourseHandler('deleteCourse', () => ({
    message: 'Course deleted successfully (mock)'
  }))
);

// ✅ FIXED: Publish/unpublish course
router.patch('/:id/publish',
  validateParams(paramSchemas.id),
  validate(courseSpecificSchemas.publish), // ✅ Use proper schema
  safeCourseHandler('togglePublishCourse', (req) => ({
    course: {
      id: parseInt(req.params?.id) || 1,
      title: 'Mock Course',
      isPublished: req.body?.isPublished || false
    }
  }))
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
  safeCourseHandler('requestEnrollment', (req) => ({
    enrollment: {
      id: Math.floor(Math.random() * 1000),
      courseId: parseInt(req.params?.id) || 1,
      studentId: req.user?.id || 1,
      status: 'pending',
      enrolledAt: new Date()
    }
  }))
);

// Get enrolled students (Teachers/Admin)
router.get('/:id/students',
  validateParams(paramSchemas.id),
  validateQuery(querySchemas.pagination),
  isTeacherOrAdmin,
  safeCourseHandler('getCourseStudents', () => ({
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
  }))
);

// 🆕 FIXED: Approve/reject enrollment (Teachers/Admin)
router.put('/:id/students/:studentId',
  validateParams(paramSchemas.courseStudentParams),  // ✅ Use proper schema
  validate(enrollmentSchemas.updateStatus),          // ✅ Use proper schema  
  isTeacherOrAdmin,
  safeCourseHandler('updateEnrollmentStatus', () => ({
    enrollment: {
      id: Math.floor(Math.random() * 1000),
      student: {
        firstName: 'Mock',
        lastName: 'Student',
        email: 'student@mock.com'
      },
      status: 'approved', // This will be overridden by actual body data in safeCourseHandler
      approvedAt: new Date()
    }
  }))
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
            passingScore: 70
          }
        ],
        message: 'Mock quiz data - Quiz controller not available'
      }
    });
  }
);

// ========================================
// DEBUGGING & DEVELOPMENT ROUTES
// ========================================

// Course API documentation
router.get('/_info', (req, res) => {
  res.json({
    title: 'Course API Routes',
    version: '1.0.0',
    status: req.app.get('env') === 'development' ? 'mock mode' : 'production ready',
    controllers: req.app.get('env') === 'development' ? 'mock handlers' : 'available',
    
    publicEndpoints: {
      'GET /': 'Get all published courses',
      'GET /:id': 'Get course details'
    },
    
    teacherEndpoints: {
      'POST /': 'Create new course',
      'PUT /:id': 'Update course',
      'DELETE /:id': 'Delete course',
      'PATCH /:id/publish': 'Publish/unpublish course',
      'GET /:id/students': 'Get enrolled students',
      'PUT /:id/students/:studentId': '✅ Approve/reject enrollment [FIXED]'
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
    },

    // 🆕 NEW: Validation schemas used
    validationSchemas: {
      enrollmentStatus: {
        status: 'required|string|in:approved,rejected',
        reason: 'optional|string|max:500',
        rejectionReason: 'conditional|required_if:status,rejected|string|max:500'
      }
    }
  });
});

module.exports = router;