// File: backend/src/routes/admin.js
// Path: backend/src/routes/admin.js

const express = require('express');
const router = express.Router();

// Import middleware (always available)
const { protect, isAdmin } = require('../middleware/auth');
const { generalLimiter, roleBasedLimiter } = require('../middleware/rateLimit');

// Try to import admin controller - handle gracefully if not available
let adminController;
try {
  adminController = require('../controllers/admin');
} catch (error) {
  console.log('Admin controller not available, using mock endpoints');
  adminController = null;
}

// ========================================
// MIDDLEWARE - All admin routes require authentication and admin role
// ========================================

router.use(protect);
router.use(isAdmin);
router.use(roleBasedLimiter);

// ========================================
// HELPER FUNCTION FOR SAFE ROUTING - FIXED VERSION
// ========================================

const safeAdminHandler = (controllerMethod, mockDataFunction = {}) => {
  return (req, res, next) => {
    if (adminController && typeof adminController[controllerMethod] === 'function') {
      return adminController[controllerMethod](req, res, next);
    } else {
      // If mockDataFunction is a function, call it with req to get dynamic data
      const mockData = typeof mockDataFunction === 'function' ? mockDataFunction(req) : mockDataFunction;
      
      // Return mock data if controller not available
      return res.json({
        success: true,
        data: {
          ...mockData,
          message: 'Admin controller not available - returning mock data',
          timestamp: new Date().toISOString()
        }
      });
    }
  };
};

// ========================================
// ADMIN DASHBOARD ROUTES
// ========================================

// Get admin dashboard overview
router.get('/dashboard', safeAdminHandler('getDashboard', {
  userStatistics: { 
    total: 1250, 
    admins: 5, 
    teachers: 45, 
    students: 1200, 
    pendingTeachers: 5 
  },
  courseStatistics: { 
    total: 125, 
    published: 98, 
    draft: 27 
  },
  enrollmentStatistics: { 
    total: 8750, 
    pending: 25, 
    approved: 8500, 
    rejected: 225 
  },
  quizStatistics: { 
    total: 380, 
    published: 350, 
    draft: 30 
  },
  recentActivities: [
    {
      type: 'user_registration',
      message: 'นักเรียนใหม่ลงทะเบียน: สมชาย ใจดี',
      timestamp: new Date(Date.now() - 1000 * 60 * 15) // 15 minutes ago
    },
    {
      type: 'course_published',
      message: 'เผยแพร่วิชาใหม่: React Advanced Concepts',
      timestamp: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
    },
    {
      type: 'teacher_approval',
      message: 'อนุมัติครูใหม่: อาจารย์สมหญิง ดีใจ',
      timestamp: new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
    }
  ],
  systemMetrics: {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development',
    databaseStatus: 'connected',
    storageUsed: '458GB',
    storageTotal: '2TB'
  }
}));

// Get system statistics
router.get('/statistics', safeAdminHandler('getSystemStatistics', (req) => ({
  period: req.query.period || '7d',
  dateRange: {
    start: req.query.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    end: req.query.endDate || new Date().toISOString()
  },
  userRegistrations: [
    { date: '2025-01-09', count: 12, type: 'student' },
    { date: '2025-01-10', count: 15, type: 'student' },
    { date: '2025-01-11', count: 8, type: 'student' },
    { date: '2025-01-12', count: 22, type: 'student' },
    { date: '2025-01-13', count: 18, type: 'student' },
    { date: '2025-01-14', count: 25, type: 'student' },
    { date: '2025-01-15', count: 19, type: 'student' }
  ],
  loginActivity: [
    { hour: '08:00', count: 45 },
    { hour: '09:00', count: 89 },
    { hour: '10:00', count: 156 },
    { hour: '11:00', count: 134 },
    { hour: '14:00', count: 178 },
    { hour: '15:00', count: 145 },
    { hour: '19:00', count: 234 },
    { hour: '20:00', count: 189 }
  ],
  courseCreations: [
    { date: '2025-01-09', count: 2 },
    { date: '2025-01-10', count: 1 },
    { date: '2025-01-11', count: 3 },
    { date: '2025-01-12', count: 0 },
    { date: '2025-01-13', count: 2 },
    { date: '2025-01-14', count: 1 },
    { date: '2025-01-15', count: 3 }
  ],
  topCourses: [
    { id: 1, title: 'JavaScript Fundamentals', enrollments: 456, rating: 4.8 },
    { id: 2, title: 'React for Beginners', enrollments: 389, rating: 4.7 },
    { id: 3, title: 'Node.js Backend Development', enrollments: 298, rating: 4.6 }
  ]
})));

// ========================================
// USER MANAGEMENT ROUTES
// ========================================

// Get all users with filtering and pagination
router.get('/users', safeAdminHandler('getUsers', (req) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const role = req.query.role;
  const status = req.query.status;
  const search = req.query.search;

  return {
    users: [
      {
        id: 15,
        email: 'teacher@example.com',
        firstName: 'อาจารย์',
        lastName: 'สมชาย',
        role: 'teacher',
        status: status || 'pending',
        profilePhoto: '/uploads/profiles/teacher_15.jpg',
        createdAt: '2025-01-10T09:00:00.000Z',
        lastLoginAt: '2025-01-14T16:30:00.000Z',
        stats: {
          totalCourses: 3,
          totalStudents: 125,
          averageRating: 4.6
        },
        pendingApproval: {
          submittedAt: '2025-01-10T09:00:00.000Z',
          documents: [
            '/uploads/applications/teacher_15_cv.pdf',
            '/uploads/applications/teacher_15_certificate.pdf'
          ]
        }
      },
      {
        id: 101,
        email: 'student@example.com',
        firstName: 'นาย',
        lastName: 'สมศักดิ์',
        role: 'student',
        status: 'active',
        profilePhoto: '/uploads/profiles/student_101.jpg',
        createdAt: '2025-01-08T14:30:00.000Z',
        lastLoginAt: '2025-01-15T10:15:00.000Z',
        stats: {
          totalCourses: 5,
          completedCourses: 2,
          averageScore: 78.5
        }
      }
    ],
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(156 / limit),
      totalUsers: 156,
      hasNext: page < Math.ceil(156 / limit),
      hasPrev: page > 1
    },
    filters: {
      roles: [
        { value: 'student', count: 1200 },
        { value: 'teacher', count: 45 },
        { value: 'admin', count: 5 }
      ],
      statuses: [
        { value: 'active', count: 1180 },
        { value: 'pending', count: 45 },
        { value: 'suspended', count: 15 },
        { value: 'banned', count: 10 }
      ]
    },
    appliedFilters: {
      role: role || null,
      status: status || null,
      search: search || null
    }
  };
}));

// Approve/reject teacher account
router.put('/users/:id/approve', safeAdminHandler('approveUser', (req) => {
  const { action, reason, notes } = req.body;
  
  return {
    user: {
      id: parseInt(req.params.id),
      email: 'teacher@example.com',
      firstName: 'อาจารย์',
      lastName: 'สมชาย',
      status: action === 'approve' ? 'active' : 'rejected',
      approvedAt: action === 'approve' ? new Date() : null,
      rejectedAt: action === 'reject' ? new Date() : null,
      approvedBy: req.user.id,
      reason: reason || null,
      notes: notes || null
    },
    emailSent: true,
    action: action
  };
}));

// Update user details (admin only)
router.put('/users/:id', safeAdminHandler('updateUser', (req) => {
  const { firstName, lastName, email, phone, dateOfBirth, bio, role, status } = req.body;
  
  return {
    user: {
      id: parseInt(req.params.id),
      email: email || 'user@example.com',
      firstName: firstName || 'นาย',
      lastName: lastName || 'สมศักดิ์',
      role: role || 'student',
      status: status || 'active',
      phone: phone || '0812345678',
      dateOfBirth: dateOfBirth || '1995-05-15',
      bio: bio || null,
      updatedAt: new Date()
    },
    message: 'อัปเดตข้อมูลผู้ใช้สำเร็จ'
  };
}));

// Update user status (suspend/ban/activate)
router.put('/users/:id/status', safeAdminHandler('updateUserStatus', (req) => {
  const { status, reason, duration } = req.body;
  
  return {
    user: {
      id: parseInt(req.params.id),
      status: status,
      suspendedUntil: status === 'suspended' && duration ? 
        new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null,
      reason: reason || null,
      updatedBy: req.user.id,
      updatedAt: new Date()
    },
    emailSent: true
  };
}));

// Get user details
router.get('/users/:id', safeAdminHandler('getUserDetails', (req) => ({
  user: {
    id: parseInt(req.params.id),
    email: 'user@example.com',
    firstName: 'นาย',
    lastName: 'สมศักดิ์',
    role: 'student',
    status: 'active',
    profilePhoto: '/uploads/profiles/user_' + req.params.id + '.jpg',
    phone: '0812345678',
    dateOfBirth: '1995-05-15',
    createdAt: '2025-01-08T14:30:00.000Z',
    lastLoginAt: '2025-01-15T10:15:00.000Z',
    emailVerified: true,
    stats: {
      totalCourses: 5,
      completedCourses: 2,
      averageScore: 78.5,
      totalQuizzesTaken: 28,
      lastActivity: '2025-01-15T10:15:00.000Z'
    },
    enrollments: [
      {
        courseId: 1,
        courseName: 'JavaScript Fundamentals',
        enrolledAt: '2025-01-10T09:00:00.000Z',
        status: 'approved',
        progress: 65.5
      }
    ]
  }
})));

// Delete user (soft delete)
router.delete('/users/:id', safeAdminHandler('deleteUser', (req) => ({
  user: {
    id: parseInt(req.params.id),
    deletedAt: new Date(),
    deletedBy: req.user.id
  },
  message: 'User deleted successfully'
})));

// ========================================
// COURSE MANAGEMENT ROUTES
// ========================================

// Get all courses for admin management
router.get('/courses', safeAdminHandler('getCourses', (req) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  
  return {
    courses: [
      {
        id: 1,
        title: 'JavaScript Fundamentals',
        description: 'เรียนรู้ JavaScript เบื้องต้น',
        isPublished: true,
        isActive: true,
        enrollmentCount: 456,
        rating: 4.8,
        createdAt: '2024-12-01T10:00:00.000Z',
        teacher: {
          id: 5,
          firstName: 'อาจารย์',
          lastName: 'สมชาย',
          email: 'teacher@example.com'
        },
        category: {
          id: 1,
          name: 'Programming'
        },
        stats: {
          totalLessons: 20,
          totalQuizzes: 5,
          completionRate: 78.5
        }
      },
      {
        id: 2,
        title: 'React for Beginners',
        description: 'เรียนรู้ React framework',
        isPublished: false,
        isActive: true,
        enrollmentCount: 0,
        rating: 0,
        createdAt: '2025-01-15T14:30:00.000Z',
        teacher: {
          id: 8,
          firstName: 'อาจารย์',
          lastName: 'สมหญิง',
          email: 'teacher2@example.com'
        },
        category: {
          id: 1,
          name: 'Programming'
        },
        stats: {
          totalLessons: 0,
          totalQuizzes: 0,
          completionRate: 0
        }
      }
    ],
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(125 / limit),
      totalCourses: 125,
      hasNext: page < Math.ceil(125 / limit),
      hasPrev: page > 1
    },
    summary: {
      total: 125,
      published: 98,
      draft: 27,
      totalEnrollments: 8750
    }
  };
}));

// Update course status (publish/unpublish/activate/deactivate)
router.put('/courses/:id/status', safeAdminHandler('updateCourseStatus', (req) => {
  const { isPublished, isActive } = req.body;
  
  return {
    course: {
      id: parseInt(req.params.id),
      isPublished: isPublished,
      isActive: isActive !== undefined ? isActive : true,
      updatedBy: req.user.id,
      updatedAt: new Date()
    },
    message: `Course ${isPublished ? 'published' : 'unpublished'} successfully`
  };
}));

// ========================================
// SYSTEM MONITORING ROUTES
// ========================================

// Get system health status
router.get('/health', safeAdminHandler('getSystemHealth', {
  status: 'healthy',
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
  checks: {
    database: { status: 'healthy', message: 'Database connection successful' },
    email: { status: 'healthy', message: 'Email service ready' },
    storage: { status: 'healthy', message: 'Storage system operational' },
    memory: { 
      status: 'healthy', 
      usage: process.memoryUsage(),
      percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
    }
  },
  performance: {
    averageResponseTime: '125ms',
    requestsPerMinute: 1250,
    errorRate: '0.02%'
  }
}));

// Get system logs
router.get('/logs', safeAdminHandler('getSystemLogs', (req) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const level = req.query.level; // 'error', 'warn', 'info'
  
  return {
    logs: [
      {
        id: 1,
        level: 'info',
        message: 'User login successful',
        userId: 123,
        userEmail: 'student@example.com',
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        timestamp: new Date(Date.now() - 1000 * 60 * 5) // 5 minutes ago
      },
      {
        id: 2,
        level: 'warn',
        message: 'Failed login attempt',
        userEmail: 'unknown@example.com',
        ip: '192.168.1.200',
        timestamp: new Date(Date.now() - 1000 * 60 * 15) // 15 minutes ago
      },
      {
        id: 3,
        level: 'error',
        message: 'Database connection timeout',
        details: { timeout: '5000ms', query: 'SELECT * FROM users' },
        timestamp: new Date(Date.now() - 1000 * 60 * 30) // 30 minutes ago
      }
    ],
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(500 / limit),
      totalLogs: 500,
      hasNext: page < Math.ceil(500 / limit),
      hasPrev: page > 1
    },
    filters: {
      level: level || null,
      availableLevels: ['error', 'warn', 'info', 'debug']
    }
  };
}));

// ========================================
// BACKUP & MAINTENANCE ROUTES
// ========================================

// Create system backup
router.post('/backup', safeAdminHandler('createBackup', (req) => ({
  backup: {
    id: 'backup_' + Date.now(),
    type: req.body.type || 'full', // 'full', 'database', 'files'
    status: 'completed',
    size: '2.5GB',
    location: '/backups/backup_' + Date.now() + '.tar.gz',
    createdAt: new Date(),
    createdBy: req.user.id
  },
  message: 'Backup created successfully'
})));

// System maintenance mode
router.post('/maintenance', safeAdminHandler('toggleMaintenance', (req) => {
  const { enabled, message, estimatedDuration } = req.body;
  
  return {
    maintenance: {
      enabled: enabled,
      message: message || 'ระบบอยู่ระหว่างการปรับปรุง กรุณาลองใหม่ภายหลัง',
      estimatedDuration: estimatedDuration || '30 minutes',
      scheduledBy: req.user.id,
      scheduledAt: new Date()
    },
    message: enabled ? 'Maintenance mode enabled' : 'Maintenance mode disabled'
  };
}));

// ========================================
// ANALYTICS & REPORTS
// ========================================

// Get admin analytics summary
router.get('/analytics', safeAdminHandler('getAdminAnalytics', (req) => {
  const period = req.query.period || '30d';
  
  return {
    period: period,
    userGrowth: {
      totalUsers: 1250,
      newUsers: 87,
      growthRate: 7.5,
      retentionRate: 68.3
    },
    courseMetrics: {
      totalCourses: 125,
      activeCourses: 98,
      avgEnrollmentsPerCourse: 70,
      completionRate: 67.8
    },
    revenueMetrics: {
      totalRevenue: 450000,
      monthlyRevenue: 75000,
      avgRevenuePerUser: 360,
      conversionRate: 12.5
    },
    engagementMetrics: {
      dailyActiveUsers: 456,
      avgSessionDuration: 45,
      bounceRate: 12.5,
      quizCompletionRate: 89.2
    },
    topPerformers: {
      courses: [
        { id: 1, title: 'JavaScript Fundamentals', enrollments: 456, revenue: 68400 },
        { id: 2, title: 'React for Beginners', enrollments: 389, revenue: 58350 }
      ],
      teachers: [
        { id: 5, name: 'อาจารย์สมชาย', students: 1250, rating: 4.8 },
        { id: 8, name: 'อาจารย์สมหญิง', students: 980, rating: 4.7 }
      ]
    }
  };
}));

// Export data report
router.post('/export', safeAdminHandler('exportData', (req) => {
  const { type, format, dateRange } = req.body;
  
  return {
    export: {
      id: 'export_' + Date.now(),
      type: type, // 'users', 'courses', 'analytics'
      format: format || 'csv', // 'csv', 'xlsx', 'json'
      status: 'completed',
      fileUrl: `/api/admin/downloads/export_${Date.now()}.${format}`,
      recordCount: 1250,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    },
    message: 'Export completed successfully'
  };
}));

// ========================================
// DOCUMENTATION ROUTE
// ========================================

router.get('/docs', (req, res) => {
  res.json({
    title: 'Admin API Documentation',
    version: '1.0.0',
    baseUrl: '/api/admin',
    
    status: {
      adminController: adminController ? 'available' : 'mock mode',
      message: adminController ? 
        'Full admin functionality available' : 
        'Using mock data - admin controller not loaded'
    },
    
    dashboardEndpoints: {
      'GET /dashboard': 'Get admin dashboard overview',
      'GET /statistics': 'Get system statistics',
      'GET /analytics': 'Get admin analytics'
    },
    
    userManagementEndpoints: {
      'GET /users': 'Get all users with filtering',
      'GET /users/:id': 'Get user details',
      'PUT /users/:id/approve': 'Approve/reject teacher account',
      'PUT /users/:id/status': 'Update user status',
      'DELETE /users/:id': 'Delete user (soft delete)'
    },
    
    courseManagementEndpoints: {
      'GET /courses': 'Get all courses for admin',
      'PUT /courses/:id/status': 'Update course status'
    },
    
    systemEndpoints: {
      'GET /health': 'Get system health status',
      'GET /logs': 'Get system logs',
      'POST /backup': 'Create system backup',
      'POST /maintenance': 'Toggle maintenance mode',
      'POST /export': 'Export data reports'
    },
    
    authentication: {
      required: true,
      role: 'admin',
      note: 'All endpoints require admin privileges'
    },
    
    rateLimiting: {
      standard: '100 requests per 15 minutes',
      export: '5 exports per hour',
      backup: '3 backups per hour'
    }
  });
});

module.exports = router;