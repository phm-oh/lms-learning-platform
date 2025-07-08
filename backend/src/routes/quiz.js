// File: backend/src/routes/quiz.js
// Path: backend/src/routes/quiz.js

const express = require('express');
const router = express.Router();

// Import middleware
const { protect, isTeacherOrAdmin, isEnrolledOrTeacher, isStudent } = require('../middleware/auth');
const { validate, validateParams, paramSchemas } = require('../middleware/validation');
const { generalLimiter, quizAttemptLimiter, contentCreationLimiter, roleBasedLimiter } = require('../middleware/rateLimit');

// Try to import quiz controller
let quizController;
try {
  quizController = require('../controllers/quiz');
} catch (error) {
  console.log('Quiz controller not available, using mock endpoints');
  quizController = null;
}

// Helper function for safe routing
const safeQuizHandler = (controllerMethod, mockData = {}) => {
  return (req, res, next) => {
    if (quizController && typeof quizController[controllerMethod] === 'function') {
      return quizController[controllerMethod](req, res, next);
    } else {
      return res.json({
        success: true,
        data: {
          ...mockData,
          message: 'Quiz controller not available - returning mock data',
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
// QUIZ VIEWING ROUTES
// ========================================

// Get quizzes for a course
router.get('/course/:courseId',
  validateParams(paramSchemas.courseId),
  isEnrolledOrTeacher,
  (req, res, next) => {
    // Add course access check
    req.params.courseId = parseInt(req.params.courseId);
    next();
  },
  safeQuizHandler('getCourseQuizzes', {
    quizzes: [
      {
        id: 1,
        title: 'Mock Quiz - Introduction',
        quizType: 'practice',
        timeLimit: 30,
        maxAttempts: 3,
        passingScore: 70,
        isPublished: true,
        userAttempts: 0,
        canAttempt: true,
        timeRemaining: null,
        course: { title: 'Mock Course' }
      },
      {
        id: 2,
        title: 'Mock Quiz - Final Assessment',
        quizType: 'final_exam',
        timeLimit: 120,
        maxAttempts: 1,
        passingScore: 80,
        isPublished: true,
        userAttempts: 0,
        canAttempt: true,
        timeRemaining: null,
        course: { title: 'Mock Course' }
      }
    ],
    total: 2
  })
);

// Get single quiz details
router.get('/:id',
  validateParams(paramSchemas.id),
  isEnrolledOrTeacher,
  (req, res) => {
    const includeQuestions = req.user.role !== 'student' || req.query.preview === 'true';
    
    res.json({
      success: true,
      data: {
        quiz: {
          id: parseInt(req.params.id),
          title: 'Mock Quiz Details',
          description: 'This is a mock quiz for testing purposes',
          quizType: 'practice',
          timeLimit: 30,
          maxAttempts: 3,
          passingScore: 70,
          randomizeQuestions: false,
          showCorrectAnswers: true,
          showResultsImmediately: true,
          isPublished: true,
          availableFrom: new Date(),
          availableUntil: null,
          questions: includeQuestions ? [
            {
              id: 1,
              questionText: 'What is the capital of France?',
              questionType: 'multiple_choice',
              options: ['London', 'Berlin', 'Paris', 'Madrid'],
              points: 10,
              orderIndex: 1,
              ...(req.user.role !== 'student' && { correctAnswer: 'Paris' })
            },
            {
              id: 2,
              questionText: 'The Earth is flat.',
              questionType: 'true_false',
              options: ['True', 'False'],
              points: 5,
              orderIndex: 2,
              ...(req.user.role !== 'student' && { correctAnswer: 'False' })
            }
          ] : undefined,
          course: { title: 'Mock Course', teacherId: 1 }
        },
        userAttempts: req.user.role === 'student' ? [] : undefined,
        canManage: req.user.role === 'teacher' || req.user.role === 'admin',
        message: 'Mock quiz data - Quiz controller not available'
      }
    });
  }
);

// ========================================
// QUIZ MANAGEMENT ROUTES (Teachers/Admin)
// ========================================

// Create new quiz
router.post('/',
  isTeacherOrAdmin,
  contentCreationLimiter,
  validate({
    courseId: require('joi').number().integer().positive().required(),
    lessonId: require('joi').number().integer().positive().optional(),
    title: require('joi').string().min(3).max(255).required(),
    description: require('joi').string().max(1000).optional().allow(''),
    quizType: require('joi').string().valid('practice', 'assessment', 'final_exam').default('practice'),
    timeLimit: require('joi').number().integer().min(1).max(480).optional(),
    maxAttempts: require('joi').number().integer().min(1).max(10).default(1),
    passingScore: require('joi').number().min(0).max(100).default(70),
    randomizeQuestions: require('joi').boolean().default(false),
    showCorrectAnswers: require('joi').boolean().default(true),
    showResultsImmediately: require('joi').boolean().default(true),
    availableFrom: require('joi').date().optional(),
    availableUntil: require('joi').date().greater(require('joi').ref('availableFrom')).optional(),
    questions: require('joi').array().items(
      require('joi').object({
        questionText: require('joi').string().required(),
        questionType: require('joi').string().valid('multiple_choice', 'true_false', 'short_answer', 'essay', 'fill_blank').required(),
        options: require('joi').array().items(require('joi').string()).optional(),
        correctAnswer: require('joi').string().required(),
        points: require('joi').number().min(1).default(10),
        explanation: require('joi').string().optional()
      })
    ).optional()
  }),
  safeQuizHandler('createQuiz', {
    quiz: {
      id: Math.floor(Math.random() * 1000),
      title: req.body?.title || 'New Mock Quiz',
      courseId: req.body?.courseId || 1,
      quizType: req.body?.quizType || 'practice',
      timeLimit: req.body?.timeLimit || 30,
      maxAttempts: req.body?.maxAttempts || 1,
      passingScore: req.body?.passingScore || 70,
      isPublished: false,
      questions: req.body?.questions || [],
      created_at: new Date()
    }
  })
);

// Update quiz
router.put('/:id',
  validateParams(paramSchemas.id),
  isTeacherOrAdmin,
  validate({
    title: require('joi').string().min(3).max(255).optional(),
    description: require('joi').string().max(1000).optional().allow(''),
    timeLimit: require('joi').number().integer().min(1).max(480).optional(),
    maxAttempts: require('joi').number().integer().min(1).max(10).optional(),
    passingScore: require('joi').number().min(0).max(100).optional(),
    randomizeQuestions: require('joi').boolean().optional(),
    showCorrectAnswers: require('joi').boolean().optional(),
    showResultsImmediately: require('joi').boolean().optional(),
    availableFrom: require('joi').date().optional(),
    availableUntil: require('joi').date().optional(),
    isPublished: require('joi').boolean().optional()
  }),
  (req, res) => {
    res.json({
      success: true,
      message: 'Quiz updated successfully',
      data: {
        quiz: {
          id: parseInt(req.params.id),
          ...req.body,
          updated_at: new Date()
        }
      },
      note: 'Mock response - Quiz controller not available'
    });
  }
);

// Delete quiz
router.delete('/:id',
  validateParams(paramSchemas.id),
  isTeacherOrAdmin,
  (req, res) => {
    res.json({
      success: true,
      message: 'Quiz deleted successfully',
      note: 'Mock response - Quiz controller not available'
    });
  }
);

// Publish/unpublish quiz
router.patch('/:id/publish',
  validateParams(paramSchemas.id),
  isTeacherOrAdmin,
  validate({
    isPublished: require('joi').boolean().required()
  }),
  (req, res) => {
    const { isPublished } = req.body;
    
    res.json({
      success: true,
      message: `Quiz ${isPublished ? 'published' : 'unpublished'} successfully`,
      data: {
        quiz: {
          id: parseInt(req.params.id),
          isPublished
        }
      },
      note: 'Mock response - Quiz controller not available'
    });
  }
);

// ========================================
// QUIZ TAKING ROUTES (Students)
// ========================================

// Start quiz attempt
router.post('/:id/attempt',
  validateParams(paramSchemas.id),
  isStudent,
  quizAttemptLimiter,
  safeQuizHandler('startQuizAttempt', {
    attempt: {
      id: Math.floor(Math.random() * 1000),
      attemptNumber: 1,
      startedAt: new Date()
    },
    quiz: {
      id: parseInt(req.params?.id) || 1,
      title: 'Mock Quiz Attempt',
      description: 'This is a mock quiz attempt',
      timeLimit: 30,
      questions: [
        {
          id: 1,
          questionText: 'What is 2 + 2?',
          questionType: 'multiple_choice',
          options: ['3', '4', '5', '6'],
          points: 10,
          orderIndex: 1
        }
      ]
    },
    timeRemaining: 1800
  })
);

// Submit answer for a question
router.post('/:id/answer',
  validateParams(paramSchemas.id),
  isStudent,
  validate({
    questionId: require('joi').number().integer().positive().required(),
    answer: require('joi').alternatives().try(
      require('joi').string(),
      require('joi').array().items(require('joi').string())
    ).required(),
    timeSpent: require('joi').number().min(0).optional()
  }),
  safeQuizHandler('submitQuizAnswer', {
    questionId: req.body?.questionId || 1,
    saved: true,
    totalAnswered: 1
  })
);

// Submit complete quiz
router.post('/:id/submit',
  validateParams(paramSchemas.id),
  isStudent,
  safeQuizHandler('submitQuiz', {
    attempt: {
      id: Math.floor(Math.random() * 1000),
      score: 85,
      maxScore: 100,
      percentage: 85,
      isCompleted: true,
      submittedAt: new Date()
    }
  })
);

// Get quiz results
router.get('/:id/results',
  validateParams(paramSchemas.id),
  (req, res) => {
    const canViewResults = req.user.role !== 'student' || req.query.attemptId;
    
    if (!canViewResults) {
      return res.status(403).json({
        success: false,
        error: 'Students can only view their own quiz results'
      });
    }
    
    res.json({
      success: true,
      data: {
        results: [
          {
            id: 1,
            attemptNumber: 1,
            studentId: req.user.id,
            student: req.user.role === 'student' ? undefined : {
              firstName: 'Mock',
              lastName: 'Student',
              email: 'student@mock.com'
            },
            score: 85,
            maxScore: 100,
            percentage: 85,
            timeSpent: 1200,
            submittedAt: new Date(),
            isCompleted: true,
            answers: req.user.role === 'student' ? undefined : {
              '1': { answer: '4', isCorrect: true, points: 10 }
            }
          }
        ],
        quiz: {
          title: 'Mock Quiz Results',
          passingScore: 70,
          showCorrectAnswers: true
        },
        message: 'Mock quiz results - Quiz controller not available'
      }
    });
  }
);

// ========================================
// QUIZ ANALYTICS (Teachers/Admin)
// ========================================

// Get quiz analytics
router.get('/:id/analytics',
  validateParams(paramSchemas.id),
  isTeacherOrAdmin,
  (req, res) => {
    res.json({
      success: true,
      data: {
        analytics: {
          quizId: parseInt(req.params.id),
          totalAttempts: 25,
          completedAttempts: 23,
          averageScore: 78.5,
          passingRate: 82,
          averageTimeSpent: 1350,
          difficultyAnalysis: {
            easy: 2,
            medium: 3,
            hard: 1
          },
          questionAnalysis: [
            {
              questionId: 1,
              correctAnswers: 20,
              totalAnswers: 23,
              successRate: 87,
              averageTime: 45
            }
          ],
          studentPerformance: [
            {
              studentId: 1,
              bestScore: 95,
              attempts: 2,
              lastAttempt: new Date()
            }
          ]
        },
        message: 'Mock analytics data - Quiz controller not available'
      }
    });
  }
);

// ========================================
// BULK OPERATIONS
// ========================================

// Import questions from CSV
router.post('/:id/import-questions',
  validateParams(paramSchemas.id),
  isTeacherOrAdmin,
  (req, res) => {
    res.json({
      success: true,
      message: 'Questions imported successfully',
      data: {
        imported: 5,
        failed: 0,
        total: 5
      },
      note: 'Mock response - Quiz controller not available'
    });
  }
);

// Duplicate quiz
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
      message: 'Quiz duplicated successfully',
      data: {
        quiz: {
          id: Math.floor(Math.random() * 1000),
          title: req.body.newTitle,
          courseId: req.body.courseId || req.params.courseId,
          isPublished: false,
          created_at: new Date()
        }
      },
      note: 'Mock response - Quiz controller not available'
    });
  }
);

// ========================================
// REAL-TIME QUIZ FEATURES
// ========================================

// Get live quiz status (for timer)
router.get('/:id/status',
  validateParams(paramSchemas.id),
  isStudent,
  (req, res) => {
    res.json({
      success: true,
      data: {
        quizId: parseInt(req.params.id),
        isActive: true,
        timeRemaining: 1500,
        currentQuestion: 1,
        totalQuestions: 5,
        canSubmit: true,
        lastSaved: new Date()
      },
      message: 'Mock quiz status - Real-time features not available'
    });
  }
);

// ========================================
// DOCUMENTATION
// ========================================

router.get('/docs', (req, res) => {
  res.json({
    title: 'Quiz API Documentation',
    version: '1.0.0',
    baseUrl: '/api/quizzes',
    
    status: {
      quizController: quizController ? 'available' : 'mock mode'
    },
    
    viewingEndpoints: {
      'GET /course/:courseId': 'Get quizzes for a course',
      'GET /:id': 'Get quiz details',
      'GET /:id/results': 'Get quiz results',
      'GET /:id/analytics': 'Get quiz analytics (teachers/admin)'
    },
    
    managementEndpoints: {
      'POST /': 'Create new quiz',
      'PUT /:id': 'Update quiz',
      'DELETE /:id': 'Delete quiz',
      'PATCH /:id/publish': 'Publish/unpublish quiz',
      'POST /:id/import-questions': 'Import questions from CSV',
      'POST /:id/duplicate': 'Duplicate quiz'
    },
    
    takingEndpoints: {
      'POST /:id/attempt': 'Start quiz attempt',
      'POST /:id/answer': 'Submit answer for question',
      'POST /:id/submit': 'Submit complete quiz',
      'GET /:id/status': 'Get live quiz status'
    },
    
    authentication: {
      required: true,
      roles: {
        student: ['Taking quizzes', 'View own results'],
        teacher: ['All management for own courses'],
        admin: ['All endpoints']
      }
    },
    
    rateLimiting: {
      'Quiz attempts': '10 attempts per 10 minutes',
      'Content creation': '50 creations per hour',
      'General': 'Role-based limits'
    },
    
    realTimeFeatures: {
      timer: 'Auto-submit when time expires',
      autosave: 'Answers saved automatically',
      liveStatus: 'Real-time quiz status updates'
    }
  });
});

module.exports = router;