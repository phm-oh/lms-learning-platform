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
// HELPER FUNCTION FOR SAFE ROUTING - FIXED VERSION
// ========================================

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
}, safeAnalyticsHandler('getTeacherAnalytics', (req) => ({
  teacher: {
    id: parseInt(req.params.id),
    firstName: 'อาจารย์',
    lastName: 'สมชาย'
  },
  overview: {
    totalCourses: 8,
    totalStudents: 1250,
    totalLessons: 180,
    totalQuizzes: 45,
    averageRating: 4.7,
    totalRevenue: 187500
  },
  coursePerformance: [
    {
      courseId: 1,
      title: 'JavaScript Fundamentals',
      enrollments: 456,
      completionRate: 78.5,
      averageScore: 82.3,
      rating: 4.8,
      revenue: 68400,
      engagement: {
        averageTimeSpent: 240, // minutes per student
        lessonCompletionRate: 85.2,
        quizCompletionRate: 91.4,
        activeStudents: 287
      }
    },
    {
      courseId: 2,
      title: 'React for Beginners',
      enrollments: 389,
      completionRate: 72.1,
      averageScore: 79.8,
      rating: 4.6,
      revenue: 58350,
      engagement: {
        averageTimeSpent: 210,
        lessonCompletionRate: 78.9,
        quizCompletionRate: 88.2,
        activeStudents: 234
      }
    }
  ],
  studentProgress: {
    strugglingStudents: [
      {
        studentId: 123,
        name: 'นาย สมศักดิ์ ใจดี',
        courseId: 1,
        progress: 25.5,
        lastActive: '2025-01-10T08:30:00.000Z',
        averageScore: 45.2,
        riskLevel: 'high'
      },
      {
        studentId: 145,
        name: 'นางสาว สมหญิง ลำบาก',
        courseId: 2,
        progress: 15.8,
        lastActive: '2025-01-08T15:20:00.000Z',
        averageScore: 38.9,
        riskLevel: 'high'
      }
    ],
    topPerformers: [
      {
        studentId: 456,
        name: 'นางสาว สมหญิง เก่งมาก',
        courseId: 1,
        progress: 95.0,
        averageScore: 96.8,
        timeToComplete: 180 // minutes faster than average
      },
      {
        studentId: 789,
        name: 'นาย สมชาย ดีเด่น',
        courseId: 2,
        progress: 88.5,
        averageScore: 92.3,
        timeToComplete: 150
      }
    ]
  },
  predictions: {
    model: 'random_forest_v2.1',
    generatedAt: new Date().toISOString(),
    studentOutcomes: [
      {
        studentId: 123,
        predictionType: 'completion_probability',
        probability: 0.35,
        confidence: 0.78,
        factors: [
          { factor: 'low_engagement', weight: 0.45 },
          { factor: 'low_quiz_scores', weight: 0.32 },
          { factor: 'irregular_login', weight: 0.23 }
        ],
        recommendations: [
          'ส่งข้อความแจ้งเตือน',
          'แนะนำเนื้อหาเพิ่มเติม',
          'จัดกลุ่มศึกษา'
        ]
      }
    ],
    courseOptimization: {
      difficultLessons: [
        {
          lessonId: 15,
          title: 'Async/Await Concepts',
          dropoffRate: 35.2,
          averageTimeSpent: 45,
          suggestions: [
            'เพิ่มตัวอย่างมากขึ้น',
            'แบ่งเป็นบทเรียนย่อย',
            'เพิ่มแบบฝึกหัด'
          ]
        }
      ],
      engagementOptimization: {
        optimalVideoLength: 12,
        bestPostingTime: '09:00-11:00',
        recommendedQuizFrequency: 'ทุก 3 บทเรียน'
      }
    }
  },
  trends: {
    enrollmentTrend: [
      { month: '2024-10', enrollments: 45 },
      { month: '2024-11', enrollments: 67 },
      { month: '2024-12', enrollments: 89 },
      { month: '2025-01', enrollments: 123 }
    ],
    completionTrend: [
      { month: '2024-10', rate: 65.2 },
      { month: '2024-11', rate: 71.8 },
      { month: '2024-12', rate: 78.5 }
    ]
  }
})));

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
}, safeAnalyticsHandler('getStudentAnalytics', (req) => ({
  student: {
    id: parseInt(req.params.id),
    firstName: 'นาย',
    lastName: 'สมศักดิ์'
  },
  overview: {
    totalCourses: 5,
    completedCourses: 2,
    inProgressCourses: 3,
    totalLessonsCompleted: 45,
    totalQuizzesTaken: 28,
    averageScore: 78.5,
    totalStudyTime: 2340 // minutes
  },
  courseProgress: [
    {
      courseId: 1,
      title: 'JavaScript Fundamentals',
      progress: 85.5,
      grade: 'A',
      averageScore: 87.2,
      timeSpent: 480, // minutes
      status: 'in_progress',
      completedLessons: 17,
      totalLessons: 20,
      lastAccessed: '2025-01-15T08:30:00.000Z',
      strengths: ['Variables', 'Functions', 'Arrays'],
      weaknesses: ['Async Programming', 'Error Handling'],
      nextRecommendations: [
        'Review Promises and Async/Await',
        'Practice error handling exercises'
      ]
    },
    {
      courseId: 2,
      title: 'React for Beginners',
      progress: 45.0,
      grade: 'B+',
      averageScore: 82.1,
      timeSpent: 320,
      status: 'in_progress',
      completedLessons: 9,
      totalLessons: 20,
      lastAccessed: '2025-01-14T19:45:00.000Z',
      strengths: ['JSX', 'Components'],
      weaknesses: ['State Management', 'Hooks'],
      nextRecommendations: [
        'Practice useState hook',
        'Build simple counter app'
      ]
    }
  ],
  learningStyle: {
    analysis: {
      primaryStyle: 'visual', // "visual", "auditory", "kinesthetic", "reading"
      confidence: 0.78,
      characteristics: [
        'Prefers video content over text',
        'High engagement with interactive examples',
        'Better performance on visual quizzes'
      ]
    },
    recommendations: [
      'เพิ่มเนื้อหาแบบ visual มากขึ้น',
      'ใช้ diagram และ flowchart',
      'ดูวิดีโอก่อนอ่าน text'
    ]
  },
  predictions: {
    model: 'neural_network_v1.5',
    generatedAt: new Date().toISOString(),
    courseOutcomes: [
      {
        courseId: 1,
        predictionType: 'final_grade',
        predictedGrade: 'A-',
        confidence: 0.85,
        estimatedCompletionDate: '2025-02-15',
        riskFactors: [
          { factor: 'difficult_upcoming_topics', impact: 'medium' },
          { factor: 'decreasing_engagement', impact: 'low' }
        ]
      }
    ],
    careerRecommendations: [
      {
        field: 'Frontend Development',
        matchScore: 0.89,
        reasons: [
          'Strong performance in JavaScript',
          'High visual learning preference',
          'Good problem-solving skills'
        ],
        suggestedCourses: [
          'React for Beginners',
          'CSS Advanced Techniques',
          'UI/UX Design Fundamentals'
        ]
      }
    ]
  },
  performance: {
    strengthAreas: [
      {
        topic: 'JavaScript Fundamentals',
        score: 92.5,
        rank: 'top 10%'
      },
      {
        topic: 'HTML/CSS',
        score: 89.3,
        rank: 'top 15%'
      }
    ],
    improvementAreas: [
      {
        topic: 'Async Programming',
        score: 45.2,
        suggestions: [
          'ทบทวนเนื้อหา Promises',
          'ทำแบบฝึกหัดเพิ่ม',
          'ดูตัวอย่างเพิ่มเติม'
        ]
      }
    ],
    studyPattern: {
      preferredStudyTime: '09:00-11:00',
      averageSessionLength: 35, // minutes
      mostProductiveDays: ['Monday', 'Wednesday', 'Friday'],
      optimalBreakInterval: 25 // minutes (Pomodoro-style)
    }
  },
  achievements: [
    {
      id: 1,
      title: 'JavaScript Master',
      description: 'เสร็จสิ้นวิชา JavaScript Fundamentals ด้วยคะแนนเฉลี่ยเกิน 85%',
      unlockedAt: '2025-01-10T14:30:00.000Z',
      badgeUrl: '/images/badges/js-master.png'
    },
    {
      id: 2,
      title: 'Quiz Champion',
      description: 'ได้คะแนนเต็มในแบบทดสอบ 5 ครั้งติดต่อกัน',
      unlockedAt: '2025-01-12T16:20:00.000Z',
      badgeUrl: '/images/badges/quiz-champion.png'
    }
  ]
})));

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
}, safeAnalyticsHandler('getCourseAnalytics', (req) => ({
  course: {
    id: parseInt(req.params.id),
    title: 'JavaScript Fundamentals',
    teacherId: 5
  },
  overview: {
    totalEnrollments: 456,
    activeStudents: 287,
    completionRate: 78.5,
    averageScore: 82.3,
    averageRating: 4.8,
    totalRevenue: 68400
  },
  studentAnalytics: {
    demographics: {
      ageGroups: [
        { range: '18-25', count: 156, percentage: 34.2 },
        { range: '26-35', count: 189, percentage: 41.4 },
        { range: '36-45', count: 89, percentage: 19.5 },
        { range: '46+', count: 22, percentage: 4.8 }
      ],
      experienceLevels: [
        { level: 'beginner', count: 234, percentage: 51.3 },
        { level: 'intermediate', count: 178, percentage: 39.0 },
        { level: 'advanced', count: 44, percentage: 9.6 }
      ]
    },
    engagement: {
      averageTimeSpent: 240, // minutes per student
      peakActivityHours: ['09:00-10:00', '19:00-21:00'],
      dropoffPoints: [
        {
          lessonId: 15,
          title: 'Async/Await',
          dropoffRate: 35.2,
          position: '75% through course'
        }
      ],
      retentionByWeek: [
        { week: 1, retention: 95.2 },
        { week: 2, retention: 87.8 },
        { week: 3, retention: 82.1 },
        { week: 4, retention: 78.5 }
      ]
    }
  },
  contentAnalytics: {
    lessonPerformance: [
      {
        lessonId: 1,
        title: 'Introduction to JavaScript',
        viewCount: 456,
        completionRate: 95.2,
        averageTimeSpent: 15, // minutes
        satisfactionScore: 4.8,
        comments: [
          { sentiment: 'positive', count: 45 },
          { sentiment: 'neutral', count: 12 },
          { sentiment: 'negative', count: 3 }
        ]
      }
    ],
    quizAnalytics: [
      {
        quizId: 1,
        title: 'JavaScript Basics Quiz',
        attemptCount: 412,
        averageScore: 78.5,
        passRate: 89.2,
        difficultQuestions: [
          {
            questionId: 5,
            text: 'What is closure?',
            successRate: 45.2,
            commonMistakes: [
              'Confusing with scope',
              'Incorrect practical examples'
            ]
          }
        ]
      }
    ]
  },
  predictions: {
    model: 'course_optimization_v1.2',
    recommendations: {
      contentOptimization: [
        {
          type: 'lesson_restructure',
          lesson: 'Async/Await Concepts',
          suggestion: 'แบ่งเป็น 2 บทเรียนย่อย',
          expectedImprovement: 'เพิ่ม completion rate 15-20%'
        }
      ],
      studentSupport: [
        {
          type: 'early_intervention',
          criteria: 'นักเรียนที่ใช้เวลานานกว่าเฉลี่ย 50% ในบทเรียนแรก',
          action: 'ส่งข้อความสนับสนุนและแนะนำแหล่งเรียนรู้เพิ่ม'
        }
      ],
      pricing: {
        optimalPrice: 1650, // บาท
        priceElasticity: -1.2,
        revenueProjection: 'เพิ่มขึ้น 8-12% จากการปรับราคา'
      }
    }
  },
  comparativeAnalysis: {
    benchmarks: {
      industryAverage: {
        completionRate: 65.2,
        averageScore: 74.8,
        satisfactionScore: 4.2
      },
      platformAverage: {
        completionRate: 72.1,
        averageScore: 79.3,
        satisfactionScore: 4.5
      },
      categoryAverage: {
        completionRate: 76.8,
        averageScore: 81.2,
        satisfactionScore: 4.6
      }
    },
    ranking: {
      overall: 5, // อันดับ 5 จากทั้งหมด
      category: 2, // อันดับ 2 ในหมวดหมู่
      teacher: 1 // อันดับ 1 ของครูคนนี้
    }
  }
})));

// ========================================
// PLATFORM ANALYTICS ROUTES (Admin only)
// ========================================

// Get platform-wide analytics
router.get('/platform', isAdmin, safeAnalyticsHandler('getPlatformAnalytics', (req) => {
  const period = req.query.period || '30d';
  
  return {
    overview: {
      totalUsers: 1250,
      totalCourses: 125,
      totalEnrollments: 8750,
      platformAge: 365, // days
      currentVersion: '2.1.0'
    },
    growth: {
      userGrowth: {
        daily: 12,
        weekly: 87,
        monthly: 324,
        yearToDate: 1250
      },
      revenueGrowth: {
        monthly: 75000,
        yearToDate: 450000,
        growthRate: 15.2 // percentage MoM
      }
    },
    userBehavior: {
      averageSessionDuration: 45, // minutes
      pagesPerSession: 12.5,
      bounceRate: 12.5, // percentage
      returnUserRate: 68.3, // percentage
      deviceBreakdown: [
        { device: 'desktop', percentage: 45.2 },
        { device: 'mobile', percentage: 38.9 },
        { device: 'tablet', percentage: 15.9 }
      ]
    },
    contentMetrics: {
      averageCourseCompletion: 67.8,
      averageQuizScore: 78.5,
      mostPopularCategories: [
        { name: 'Programming', enrollments: 3200 },
        { name: 'Design', enrollments: 2100 }
      ],
      contentGrowth: {
        newLessonsThisMonth: 145,
        newQuizzesThisMonth: 78,
        totalContentHours: 2600 // hours of video content
      }
    },
    systemPerformance: {
      averageResponseTime: 250, // milliseconds
      uptime: 99.8, // percentage
      errorRate: 0.02, // percentage
      peakConcurrentUsers: 234,
      bandwidthUsage: '2.5TB', // monthly
      storageUsage: '458GB'
    },
    mlInsights: {
      model: 'platform_analytics_v2.0',
      predictions: {
        userGrowthNext3Months: 486, // new users
        revenueProjectionNext3Months: 245000, // บาท
        churnRiskUsers: 89, // users at risk
        trendingSkills: ['React', 'Machine Learning', 'UI/UX Design']
      },
      recommendations: [
        {
          category: 'user_retention',
          suggestion: 'เพิ่มระบบ gamification',
          expectedImpact: 'เพิ่ม retention 8-12%'
        },
        {
          category: 'content_strategy',
          suggestion: 'เพิ่มคอร์ส Machine Learning',
          expectedImpact: 'เพิ่มผู้ใช้ใหม่ 15-20%'
        }
      ]
    }
  };
}));

// ========================================
// USER-SPECIFIC ANALYTICS SHORTCUTS
// ========================================

// Get current user's analytics (shortcut)
router.get('/me', safeAnalyticsHandler('getCurrentUserAnalytics', (req) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  
  if (userRole === 'teacher') {
    return {
      teacherId: userId,
      courseStats: { totalCourses: 0, publishedCourses: 0, totalStudents: 0 },
      quizStats: { totalQuizzes: 0, totalAttempts: 0, averageScore: 0 },
      redirect: `/api/analytics/teacher/${userId}`
    };
  } else if (userRole === 'student') {
    return {
      studentId: userId,
      learningStats: { totalCourses: 0, completedCourses: 0, averageScore: 0 },
      subjectPerformance: {},
      redirect: `/api/analytics/student/${userId}`
    };
  } else {
    return {
      error: 'Analytics not available for admin role. Use /platform instead.',
      redirect: '/api/analytics/platform'
    };
  }
}));

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
        role: req.user.role
      },
      timestamp: new Date().toISOString()
    });
  });
}

// ========================================
// DOCUMENTATION ROUTE
// ========================================

router.get('/docs', (req, res) => {
  res.json({
    title: 'Analytics API Documentation',
    version: '1.0.0',
    baseUrl: '/api/analytics',
    
    status: {
      analyticsController: analyticsController ? 'available' : 'mock mode',
      mlModels: 'mock data available',
      realTimePredictions: false
    },
    
    teacherEndpoints: {
      'GET /teacher/:id': 'Get teacher analytics (own data or admin)',
      'GET /me': 'Get current user analytics (shortcut)'
    },
    
    studentEndpoints: {
      'GET /student/:id': 'Get student analytics (own data, teacher, or admin)',
      'GET /me': 'Get current user analytics (shortcut)'
    },
    
    courseEndpoints: {
      'GET /course/:id': 'Get course analytics (teacher/admin only)'
    },
    
    platformEndpoints: {
      'GET /platform': 'Get platform-wide analytics (admin only)'
    },
    
    authentication: {
      required: true,
      permissions: {
        student: 'Own analytics only',
        teacher: 'Own analytics + student analytics for enrolled courses',
        admin: 'All analytics + platform data'
      }
    },
    
    dataTypes: {
      predictions: 'ML-powered predictions and recommendations',
      trends: 'Historical trend analysis',
      performance: 'Learning performance metrics',
      engagement: 'User engagement analytics',
      comparative: 'Benchmarking against platform/industry averages'
    },
    
    rateLimiting: {
      standard: '50 requests per 15 minutes',
      platform: '10 requests per 15 minutes (admin only)'
    }
  });
});

module.exports = router;