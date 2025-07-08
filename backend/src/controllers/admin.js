// File: backend/src/controllers/admin.js
// Path: backend/src/controllers/admin.js

const { User, Course, Quiz, Enrollment, UserActivity, LearningAnalytics } = require('../models');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// ========================================
// ADMIN DASHBOARD CONTROLLERS
// ========================================

// @desc    Get admin dashboard overview
// @route   GET /api/admin/dashboard
// @access  Admin only
const getDashboard = catchAsync(async (req, res, next) => {
  try {
    // Get user statistics
    const userStats = await User.findAll({
      attributes: [
        'role',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['role'],
      raw: true
    });

    const userStatistics = {
      total: 0,
      admins: 0,
      teachers: 0,
      students: 0,
      pendingTeachers: 0,
      activeUsers: 0
    };

    // Process user stats
    for (const stat of userStats) {
      userStatistics[stat.role + 's'] = parseInt(stat.count);
      userStatistics.total += parseInt(stat.count);
    }

    // Get pending teachers
    const pendingTeachers = await User.count({
      where: { role: 'teacher', status: 'pending' }
    });
    userStatistics.pendingTeachers = pendingTeachers;

    // Get active users (logged in within last 7 days)
    const activeUsers = await User.count({
      where: {
        lastLogin: {
          [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });
    userStatistics.activeUsers = activeUsers;

    // Get course statistics
    const courseStats = await Course.findAll({
      attributes: [
        'isPublished',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['isPublished'],
      raw: true
    });

    const courseStatistics = {
      total: 0,
      published: 0,
      draft: 0,
      totalEnrollments: 0
    };

    for (const stat of courseStats) {
      if (stat.isPublished) {
        courseStatistics.published = parseInt(stat.count);
      } else {
        courseStatistics.draft = parseInt(stat.count);
      }
      courseStatistics.total += parseInt(stat.count);
    }

    // Get enrollment statistics
    const enrollmentStats = await Enrollment.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    const enrollmentStatistics = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0
    };

    for (const stat of enrollmentStats) {
      enrollmentStatistics[stat.status] = parseInt(stat.count);
      enrollmentStatistics.total += parseInt(stat.count);
    }

    // Get quiz statistics
    const quizStats = await Quiz.findAll({
      attributes: [
        'isPublished',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['isPublished'],
      raw: true
    });

    const quizStatistics = {
      total: 0,
      published: 0,
      draft: 0
    };

    for (const stat of quizStats) {
      if (stat.isPublished) {
        quizStatistics.published = parseInt(stat.count);
      } else {
        quizStatistics.draft = parseInt(stat.count);
      }
      quizStatistics.total += parseInt(stat.count);
    }

    // Get recent activities
    const recentActivities = await UserActivity.findAll({
      limit: 10,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email', 'role']
        }
      ]
    });

    // System health metrics
    const systemMetrics = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development'
    };

    res.status(200).json({
      success: true,
      data: {
        userStatistics,
        courseStatistics,
        enrollmentStatistics,
        quizStatistics,
        recentActivities,
        systemMetrics,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    // If models don't exist, return basic stats
    const basicStats = {
      userStatistics: { total: 0, admins: 0, teachers: 0, students: 0 },
      courseStatistics: { total: 0, published: 0, draft: 0 },
      enrollmentStatistics: { total: 0, pending: 0, approved: 0 },
      quizStatistics: { total: 0, published: 0, draft: 0 },
      recentActivities: [],
      systemMetrics: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development'
      }
    };

    res.status(200).json({
      success: true,
      data: basicStats,
      message: 'Basic statistics (some models not available)'
    });
  }
});

// @desc    Get all users for admin management
// @route   GET /api/admin/users
// @access  Admin only
const getUsers = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 10, role, status, search } = req.query;

  const offset = (page - 1) * limit;
  const where = {};

  // Filter by role
  if (role) {
    where.role = role;
  }

  // Filter by status
  if (status) {
    where.status = status;
  }

  // Search by name or email
  if (search) {
    where[Op.or] = [
      { firstName: { [Op.iLike]: `%${search}%` } },
      { lastName: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const users = await User.findAndCountAll({
    where,
    offset,
    limit: parseInt(limit),
    order: [['created_at', 'DESC']],
    attributes: { exclude: ['password'] }
  });

  res.status(200).json({
    success: true,
    data: {
      users: users.rows,
      pagination: {
        total: users.count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(users.count / limit)
      }
    }
  });
});

// @desc    Approve/reject teacher account
// @route   PUT /api/admin/users/:id/approve
// @access  Admin only
const approveTeacher = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body; // 'active' or 'rejected'

  if (!['active', 'rejected'].includes(status)) {
    return next(new AppError('Status must be either active or rejected', 400));
  }

  const user = await User.findByPk(id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  if (user.role !== 'teacher') {
    return next(new AppError('Only teacher accounts can be approved', 400));
  }

  user.status = status;
  await user.save();

  // Log activity
  await UserActivity.create({
    userId: req.user.id,
    activityType: 'teacher_approval',
    details: {
      teacherId: user.id,
      status: status,
      approvedBy: req.user.id,
      timestamp: new Date()
    },
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  }).catch(() => {}); // Ignore if model doesn't exist

  // Send notification (TODO: implement email)
  const message = status === 'active' 
    ? 'Your teacher account has been approved!' 
    : 'Your teacher account has been rejected.';

  res.status(200).json({
    success: true,
    message: `Teacher account ${status === 'active' ? 'approved' : 'rejected'} successfully`,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status
      }
    }
  });
});

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Admin only
const updateUserStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['active', 'inactive', 'suspended'];
  if (!validStatuses.includes(status)) {
    return next(new AppError(`Status must be one of: ${validStatuses.join(', ')}`, 400));
  }

  const user = await User.findByPk(id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Don't allow changing admin status
  if (user.role === 'admin' && req.user.id !== user.id) {
    return next(new AppError('Cannot change admin status', 403));
  }

  user.status = status;
  await user.save();

  // Log activity
  await UserActivity.create({
    userId: req.user.id,
    activityType: 'user_status_update',
    details: {
      targetUserId: user.id,
      newStatus: status,
      updatedBy: req.user.id,
      timestamp: new Date()
    },
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  }).catch(() => {});

  res.status(200).json({
    success: true,
    message: `User status updated to ${status}`,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status
      }
    }
  });
});

// @desc    Get system statistics
// @route   GET /api/admin/statistics
// @access  Admin only
const getSystemStatistics = catchAsync(async (req, res, next) => {
  const { period = '7d' } = req.query;

  // Calculate date range
  let dateRange;
  switch (period) {
    case '1d':
      dateRange = new Date(Date.now() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      dateRange = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      dateRange = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      dateRange = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  }

  try {
    // User registration trends
    const userRegistrations = await User.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        created_at: { [Op.gte]: dateRange }
      },
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
      raw: true
    });

    // Login activity
    const loginActivity = await UserActivity.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        activityType: 'login',
        created_at: { [Op.gte]: dateRange }
      },
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
      raw: true
    });

    // Course creation trends
    const courseCreations = await Course.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        created_at: { [Op.gte]: dateRange }
      },
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
      raw: true
    });

    res.status(200).json({
      success: true,
      data: {
        period,
        userRegistrations,
        loginActivity,
        courseCreations,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    // Return mock data if models don't exist
    res.status(200).json({
      success: true,
      data: {
        period,
        userRegistrations: [],
        loginActivity: [],
        courseCreations: [],
        message: 'Statistics not available (models not found)'
      }
    });
  }
});

module.exports = {
  getDashboard,
  getUsers,
  approveTeacher,
  updateUserStatus,
  getSystemStatistics
};