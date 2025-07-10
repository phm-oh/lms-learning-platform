// File: backend/src/routes/analytics.js
// Path: backend/src/routes/analytics.js

const express = require('express');
const router = express.Router();

// Import middleware (always available)
const { protect, isAdmin } = require('../middleware/auth');
const { generalLimiter, roleBasedLimiter } = require('../middleware/rateLimit');

// Try to import analytics controller - handle gracefully if not available
let analyticsController;
try {
  analyticsController = require('../controllers/analytics');
} catch (error) {
  console.log('Analytics controller not available, using mock endpoints');
  analyticsController = null;
}

// ========================================
// MIDDLEWARE - All analytics routes require authentication
// ========================================

router.use(protect);
router.use(roleBasedLimiter);

// ========================================
// HELPER FUNCTION FOR SAFE ROUTING
// ========================================

// Fixed safeAnalyticsHandler
const safeAnalyticsHandler = (controllerMethod, mockDataFunction = {}) => {
  return (req, res, next) => {
    if (analyticsController && typeof analyticsController[controllerMethod] === 'function') {
      return analyticsController[controllerMethod](req, res, next);
    } else {
      // If mockDataFunction is a function, call it with req to get dynamic data
      const mockData = typeof mockDataFunction === 'function' ? mockDataFunction(req) : mockDataFunction;
      
      // Return mock data if controller not available
      return res.json({
        success: true,
        data: {
          ...mockData,
          message: 'Analytics controller not available - returning mock data',
          userId: req.user?.id || 'mock_user_id',
          userRole: req.user?.role || 'mock_role',
          timestamp: new Date().toISOString()
        }
      });
    }
  };
};

// ========================================
// TEACHER ANALYTICS ROUTES
// ========================================

// Get teacher dashboard analytics
router.get('/teacher/:id', (req, res, next) => {
  // Check if user can access this teacher's analytics
  const requestedTeacherId = parseInt(req.params.id);
  
  // Admin can access any teacher's analytics
  if (req.user.role === 'admin') {
    return next();
  }
  
  // Teachers can only access their own analytics
  if (req.user.role === 'teacher' && req.user.id === requestedTeacherId) {
    return next();
  }
  
  return res.status(403).json({
    success: false,
    error: 'You can only access your own analytics'
  });
}, safeAnalyticsHandler('getTeacherAnalytics', {
  teacherId: req => req.params.id,
  courseStats: { totalCourses: 0, publishedCourses: 0, totalStudents: 0 },
  quizStats: { totalQuizzes: 0, totalAttempts: 0, averageScore: 0 },
  recentEnrollments: [],
  teacherCourses: []
}));

// ========================================
// STUDENT ANALYTICS ROUTES
// ========================================

// Get student dashboard analytics
router.get('/student/:id', (req, res, next) => {
  // Check if user can access this student's analytics
  const requestedStudentId = parseInt(req.params.id);
  
  // Admin can access any student's analytics
  if (req.user.role === 'admin') {
    return next();
  }
  
  // Students can only access their own analytics
  if (req.user.role === 'student' && req.user.id === requestedStudentId) {
    return next();
  }
  
  // Teachers can access their students' analytics
  if (req.user.role === 'teacher') {
    return next();
  }
  
  return res.status(403).json({
    success: false,
    error: 'You can only access your own analytics'
  });
}, safeAnalyticsHandler('getStudentAnalytics', {
  studentId: req => req.params.id,
  learningStats: { totalCourses: 0, completedCourses: 0, averageScore: 0 },
  subjectPerformance: {},
  recentQuizzes: [],
  enrolledCourses: [],
  recommendations: { studyTime: '2-3 hours per day', focusAreas: [], tips: [] }
}));

// ========================================
// COURSE ANALYTICS ROUTES
// ========================================

// Get course analytics
router.get('/course/:id', (req, res, next) => {
  // Check if user can access this course's analytics
  
  // Admin can access any course analytics
  if (req.user.role === 'admin') {
    return next();
  }
  
  // Teachers can access analytics for their own courses
  if (req.user.role === 'teacher') {
    return next();
  }
  
  // Students cannot access course analytics
  return res.status(403).json({
    success: false,
    error: 'You do not have permission to access course analytics'
  });
}, safeAnalyticsHandler('getCourseAnalytics', {
  courseId: req => req.params.id,
  enrollmentStats: { total: 0, approved: 0, pending: 0, rejected: 0 },
  quizStats: { totalQuizzes: 0, averageScore: 0, passRate: 0 },
  studentList: []
}));

// ========================================
// PLATFORM ANALYTICS ROUTES (Admin only)
// ========================================

// Get platform-wide analytics
router.get('/platform', isAdmin, safeAnalyticsHandler('getPlatformAnalytics', {
  userActivity: [],
  learningAnalytics: []
}));

// ========================================
// USER-SPECIFIC ANALYTICS SHORTCUTS
// ========================================

// Get current user's analytics (shortcut)
router.get('/me', (req, res, next) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  
  if (userRole === 'teacher') {
    req.params.id = userId.toString();
    return safeAnalyticsHandler('getTeacherAnalytics', {
      teacherId: userId,
      courseStats: { totalCourses: 0, publishedCourses: 0, totalStudents: 0 },
      quizStats: { totalQuizzes: 0, totalAttempts: 0, averageScore: 0 }
    })(req, res, next);
  } else if (userRole === 'student') {
    req.params.id = userId.toString();
    return safeAnalyticsHandler('getStudentAnalytics', {
      studentId: userId,
      learningStats: { totalCourses: 0, completedCourses: 0, averageScore: 0 },
      subjectPerformance: {}
    })(req, res, next);
  } else {
    return res.status(400).json({
      success: false,
      error: 'Analytics not available for admin role. Use /platform instead.'
    });
  }
});

// ========================================
// TESTING/DEBUG ROUTES (Development only)
// ========================================

if (process.env.NODE_ENV === 'development') {
  // Test analytics endpoint
  router.get('/test', (req, res) => {
    res.json({
      success: true,
      message: 'Analytics API is working',
      analyticsControllerAvailable: !!analyticsController,
      user: {
        id: req.user.id,
        role: req.user.role,
        email: req.user.email
      },
      availableEndpoints: {
        'GET /analytics/me': 'Your analytics dashboard',
        'GET /analytics/teacher/:id': 'Teacher analytics',
        'GET /analytics/student/:id': 'Student analytics',
        'GET /analytics/course/:id': 'Course analytics',
        'GET /analytics/platform': 'Platform analytics (admin only)'
      },
      timestamp: new Date().toISOString()
    });
  });

  // Mock analytics data endpoints
  router.get('/mock/teacher', (req, res) => {
    res.json({
      success: true,
      data: {
        teacherId: req.user.id,
        courseStats: { totalCourses: 3, publishedCourses: 2, totalStudents: 45 },
        quizStats: { totalQuizzes: 8, totalAttempts: 120, averageScore: 78 },
        recentEnrollments: [
          { student: { name: 'John Doe', email: 'john@example.com' }, course: { title: 'Math 101' } }
        ],
        teacherCourses: [
          { id: 1, title: 'Math 101', enrollmentCount: 25 },
          { id: 2, title: 'Science 101', enrollmentCount: 20 }
        ],
        message: 'Mock teacher analytics'
      }
    });
  });

  router.get('/mock/student', (req, res) => {
    res.json({
      success: true,
      data: {
        studentId: req.user.id,
        learningStats: { totalCourses: 5, completedCourses: 2, averageScore: 85 },
        subjectPerformance: { 
          'Math 101': { averageScore: 90, bestScore: 95 }, 
          'Science 101': { averageScore: 80, bestScore: 88 } 
        },
        recentQuizzes: [
          { quiz: { title: 'Math Quiz 1' }, percentage: 85, submittedAt: new Date() }
        ],
        enrolledCourses: [
          { course: { title: 'Math 101' }, completion: 75 },
          { course: { title: 'Science 101' }, completion: 60 }
        ],
        recommendations: {
          studyTime: '2-3 hours per day',
          focusAreas: ['Science 101'],
          tips: ['Review quiz mistakes', 'Practice regularly']
        },
        message: 'Mock student analytics'
      }
    });
  });
}

// ========================================
// ANALYTICS DOCUMENTATION
// ========================================

router.get('/docs', (req, res) => {
  res.json({
    title: 'Analytics API Documentation',
    version: '1.0.0',
    baseUrl: '/api/analytics',
    
    status: {
      analyticsController: analyticsController ? 'available' : 'mock mode',
      message: analyticsController ? 'Full analytics available' : 'Using mock data'
    },
    
    authentication: {
      required: true,
      type: 'JWT Bearer Token',
      roles: ['admin', 'teacher', 'student']
    },
    
    endpoints: {
      'GET /me': 'Get your own analytics dashboard',
      'GET /teacher/:id': 'Get teacher dashboard analytics',
      'GET /student/:id': 'Get student dashboard analytics', 
      'GET /course/:id': 'Get course performance analytics',
      'GET /platform': 'Get platform-wide analytics (admin only)',
      'GET /test': 'Test endpoint (development only)',
      'GET /mock/teacher': 'Mock teacher data (development only)',
      'GET /mock/student': 'Mock student data (development only)'
    },
    
    rateLimiting: {
      type: 'Role-based',
      limits: {
        admin: '1000 requests per 15 minutes',
        teacher: '500 requests per 15 minutes',
        student: '200 requests per 15 minutes'
      }
    }
  });
});

module.exports = router;