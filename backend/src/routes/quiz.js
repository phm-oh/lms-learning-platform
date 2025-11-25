// File: backend/src/routes/quiz.js
// Path: backend/src/routes/quiz.js

const express = require('express');
const router = express.Router();
const Joi = require('joi');

// Import middleware
const { protect, isTeacherOrAdmin, isEnrolledOrTeacher, isStudent } = require('../middleware/auth');
const { validate, validateParams, paramSchemas } = require('../middleware/validation');
const { generalLimiter, quizAttemptLimiter, contentCreationLimiter, roleBasedLimiter } = require('../middleware/rateLimit');

// Import controllers
const {
  getCourseQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  togglePublishQuiz,
  startQuizAttempt,
  submitQuizAnswer,
  submitQuiz
} = require('../controllers/quiz');

// Helper function for safe routing (for unimplemented features)
const safeQuizHandler = (methodName, mockDataFunction = {}) => {
  return (req, res, next) => {
    // If controller method exists (even if not imported above, but attached to module), use it
    // But here we only imported specific ones.
    // So this is mainly for the ones we KNOW are missing.

    // If mockDataFunction is a function, call it with req to get dynamic data
    const mockData = typeof mockDataFunction === 'function' ? mockDataFunction(req) : mockDataFunction;

    return res.json({
      success: true,
      data: {
        ...mockData,
        message: `Mock response for ${methodName} - Feature not fully implemented`,
        timestamp: new Date().toISOString()
      }
    });
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
  getCourseQuizzes
);

// Get single quiz details
router.get('/:id',
  validateParams(paramSchemas.id),
  isEnrolledOrTeacher,
  getQuiz
);

// ========================================
// QUIZ MANAGEMENT ROUTES (Teachers/Admin)
// ========================================

// Create new quiz
router.post('/',
  isTeacherOrAdmin,
  contentCreationLimiter,
  validate({
    courseId: Joi.number().integer().positive().required(),
    lessonId: Joi.number().integer().positive().optional(),
    title: Joi.string().min(3).max(255).required(),
    description: Joi.string().max(1000).optional().allow(''),
    quizType: Joi.string().valid('practice', 'assessment', 'final_exam').default('practice'),
    timeLimit: Joi.number().integer().min(1).max(480).optional(),
    maxAttempts: Joi.number().integer().min(1).max(10).default(1),
    passingScore: Joi.number().min(0).max(100).default(70),
    randomizeQuestions: Joi.boolean().default(false),
    showCorrectAnswers: Joi.boolean().default(true),
    showResultsImmediately: Joi.boolean().default(true),
    availableFrom: Joi.date().optional(),
    availableUntil: Joi.date().greater(Joi.ref('availableFrom')).optional(),
    questions: Joi.array().items(
      Joi.object({
        questionText: Joi.string().required(),
        questionType: Joi.string().valid('multiple_choice', 'true_false', 'short_answer', 'essay', 'fill_blank').required(),
        options: Joi.array().items(Joi.string()).optional(),
        correctAnswer: Joi.string().required(),
        points: Joi.number().min(1).default(10),
        explanation: Joi.string().optional()
      })
    ).optional()
  }),
  createQuiz
);

// Update quiz
router.put('/:id',
  validateParams(paramSchemas.id),
  isTeacherOrAdmin,
  validate({
    title: Joi.string().min(3).max(255).optional(),
    description: Joi.string().max(1000).optional().allow(''),
    timeLimit: Joi.number().integer().min(1).max(480).optional(),
    maxAttempts: Joi.number().integer().min(1).max(10).optional(),
    passingScore: Joi.number().min(0).max(100).optional(),
    randomizeQuestions: Joi.boolean().optional(),
    showCorrectAnswers: Joi.boolean().optional(),
    showResultsImmediately: Joi.boolean().optional(),
    availableFrom: Joi.date().optional(),
    availableUntil: Joi.date().optional(),
    isPublished: Joi.boolean().optional()
  }),
  updateQuiz
);

// Delete quiz
router.delete('/:id',
  validateParams(paramSchemas.id),
  isTeacherOrAdmin,
  deleteQuiz
);

// Publish/unpublish quiz
router.patch('/:id/publish',
  validateParams(paramSchemas.id),
  isTeacherOrAdmin,
  validate({
    isPublished: Joi.boolean().required()
  }),
  togglePublishQuiz
);

// ========================================
// QUIZ TAKING ROUTES (Students)
// ========================================

// Start quiz attempt
router.post('/:id/attempt',
  validateParams(paramSchemas.id),
  isStudent,
  quizAttemptLimiter,
  startQuizAttempt
);

// Submit answer for a question
router.post('/:id/answer',
  validateParams(paramSchemas.id),
  isStudent,
  validate({
    attemptId: Joi.number().integer().positive().optional(), // Optional if we infer from active attempt
    questionId: Joi.number().integer().positive().required(),
    answer: Joi.string().required(), // Changed from answerText/selectedOptions to generic 'answer' to match controller
    timeSpent: Joi.number().min(0).optional()
  }),
  submitQuizAnswer
);

// Submit complete quiz
router.post('/:id/submit',
  validateParams(paramSchemas.id),
  isStudent,
  // Controller submitQuiz doesn't validate body much, it just completes the attempt
  submitQuiz
);

// Get quiz results
// Note: This is not explicitly in the controller exports I saw, 
// but usually handled by getQuiz with attempt history or a specific endpoint.
// Since I didn't implement getQuizResults in controller, I'll keep this as mock or redirect to getQuiz?
// Actually getQuiz returns studentProgress which has attempts.
// But a dedicated results view might be needed.
// I'll keep the mock for now as I didn't implement `getQuizResults` in controller.
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
        message: 'Mock quiz results - Feature not fully implemented'
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
  safeQuizHandler('getQuizAnalytics', (req) => ({
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
    }
  }))
);

// ========================================
// BULK OPERATIONS
// ========================================

// Import questions from CSV
router.post('/:id/import-questions',
  validateParams(paramSchemas.id),
  isTeacherOrAdmin,
  safeQuizHandler('importQuizQuestions', (req) => ({
    imported: 5,
    failed: 0,
    total: 5,
    quizId: parseInt(req.params.id)
  }))
);

// Duplicate quiz
router.post('/:id/duplicate',
  validateParams(paramSchemas.id),
  isTeacherOrAdmin,
  validate({
    newTitle: Joi.string().min(3).max(255).required(),
    courseId: Joi.number().integer().positive().optional()
  }),
  safeQuizHandler('duplicateQuiz', (req) => ({
    quiz: {
      id: Math.floor(Math.random() * 1000),
      title: req.body.newTitle,
      courseId: req.body.courseId || parseInt(req.params.courseId),
      originalQuizId: parseInt(req.params.id),
      isPublished: false,
      created_at: new Date()
    }
  }))
);

// ========================================
// REAL-TIME QUIZ FEATURES
// ========================================

// Get live quiz status (for timer)
router.get('/:id/status',
  validateParams(paramSchemas.id),
  isStudent,
  safeQuizHandler('getQuizStatus', (req) => ({
    quizId: parseInt(req.params.id),
    studentId: req.user.id,
    isActive: true,
    timeRemaining: 1500,
    currentQuestion: 1,
    totalQuestions: 5,
    answeredQuestions: 0,
    canSubmit: true,
    lastSaved: new Date(),
    autoSaveEnabled: true
  }))
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
      quizController: 'available (partial)',
      mockedFeatures: ['analytics', 'import-questions', 'duplicate', 'status', 'results']
    },

    viewingEndpoints: {
      'GET /course/:courseId': 'Get quizzes for a course',
      'GET /:id': 'Get quiz details',
      'GET /:id/results': 'Get quiz results (Mock)',
      'GET /:id/analytics': 'Get quiz analytics (Mock)'
    },

    managementEndpoints: {
      'POST /': 'Create new quiz',
      'PUT /:id': 'Update quiz',
      'DELETE /:id': 'Delete quiz',
      'PATCH /:id/publish': 'Publish/unpublish quiz',
      'POST /:id/import-questions': 'Import questions from CSV (Mock)',
      'POST /:id/duplicate': 'Duplicate quiz (Mock)'
    },

    takingEndpoints: {
      'POST /:id/attempt': 'Start quiz attempt',
      'POST /:id/answer': 'Submit answer for question',
      'POST /:id/submit': 'Submit complete quiz',
      'GET /:id/status': 'Get live quiz status (Mock)'
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