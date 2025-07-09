// File: backend/src/controllers/admin.js
// Path: backend/src/controllers/admin.js

const { User, Course, Quiz, Enrollment, UserActivity, LearningAnalytics } = require('../models');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { sendEmail } = require('../utils/emailService');
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

  const oldStatus = user.status;
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

  // 📧 SEND EMAIL NOTIFICATION TO TEACHER
  try {
    if (status === 'active') {
      // Teacher approved
      await sendEmail({
        to: user.email,
        subject: '🎉 บัญชีครูผู้สอนของคุณได้รับการอนุมัติแล้ว!',
        template: 'teacher-approved',
        data: {
          firstName: user.firstName,
          lastName: user.lastName,
          approvedBy: `${req.user.firstName} ${req.user.lastName}`,
          approvedDate: new Date().toLocaleDateString('th-TH'),
          loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`,
          dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/teacher/dashboard`,
          supportEmail: process.env.SUPPORT_EMAIL || 'support@lms.com',
          guideUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/teacher/guide`
        }
      });

      console.log(`✅ Teacher approval email sent to: ${user.email}`);

    } else if (status === 'rejected') {
      // Teacher rejected
      await sendEmail({
        to: user.email,
        subject: '❌ การสมัครบัญชีครูผู้สอน',
        template: 'teacher-rejected',
        data: {
          firstName: user.firstName,
          lastName: user.lastName,
          rejectedDate: new Date().toLocaleDateString('th-TH'),
          supportEmail: process.env.SUPPORT_EMAIL || 'support@lms.com',
          contactUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/contact`,
          reapplyInfo: 'คุณสามารถติดต่อทีมงานเพื่อสอบถามรายละเอียดและสมัครใหม่ได้'
        }
      });

      console.log(`✅ Teacher rejection email sent to: ${user.email}`);
    }

  } catch (emailError) {
    console.error('❌ Failed to send teacher approval/rejection email:', emailError.message);
    // Don't fail the approval process if email fails
  }

  // 📧 NOTIFY OTHER ADMINS ABOUT THE DECISION
  try {
    const otherAdmins = await User.findAll({
      where: { 
        role: 'admin', 
        status: 'active',
        id: { [Op.ne]: req.user.id } // Exclude current admin
      }
    });

    for (const admin of otherAdmins) {
      await sendEmail({
        to: admin.email,
        subject: `👨‍💼 การอนุมัติครู: ${user.firstName} ${user.lastName}`,
        template: 'admin-teacher-decision-notification',
        data: {
          adminName: admin.firstName,
          teacherName: `${user.firstName} ${user.lastName}`,
          teacherEmail: user.email,
          decision: status === 'active' ? 'อนุมัติ' : 'ปฏิเสธ',
          decidedBy: `${req.user.firstName} ${req.user.lastName}`,
          decisionDate: new Date().toLocaleDateString('th-TH'),
          teacherManagementUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/teachers`
        }
      });
    }

    console.log(`✅ Admin notification emails sent for teacher ${status}`);
  } catch (emailError) {
    console.error('❌ Failed to send admin notifications:', emailError.message);
  }

  // Emit socket event for real-time updates
  const io = req.app.get('io');
  if (io) {
    io.to('admin-room').emit('teacher-status-updated', {
      teacherId: user.id,
      teacherName: `${user.firstName} ${user.lastName}`,
      status: status,
      updatedBy: req.user.id,
      timestamp: new Date()
    });

    // Notify the teacher if they're online
    io.to(`user-${user.id}`).emit('account-status-updated', {
      status: status,
      message: status === 'active' 
        ? 'บัญชีครูของคุณได้รับการอนุมัติแล้ว! ยินดีต้อนรับ' 
        : 'ขออภัย บัญชีครูของคุณไม่ได้รับการอนุมัติ',
      timestamp: new Date()
    });
  }

  res.status(200).json({
    success: true,
    message: `Teacher account ${status === 'active' ? 'approved' : 'rejected'} successfully`,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: user.status,
        previousStatus: oldStatus
      }
    }
  });
});

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Admin only
const updateUserStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status, reason } = req.body;

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

  const oldStatus = user.status;
  user.status = status;
  await user.save();

  // Log activity
  await UserActivity.create({
    userId: req.user.id,
    activityType: 'user_status_update',
    details: {
      targetUserId: user.id,
      newStatus: status,
      oldStatus: oldStatus,
      reason: reason || 'ไม่ระบุเหตุผล',
      updatedBy: req.user.id,
      timestamp: new Date()
    },
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  }).catch(() => {});

  // 📧 SEND STATUS UPDATE EMAIL TO USER
  try {
    const statusMessages = {
      active: {
        subject: '✅ บัญชีของคุณถูกเปิดใช้งานแล้ว',
        title: 'บัญชีเปิดใช้งาน',
        message: 'บัญชีของคุณได้รับการเปิดใช้งานแล้ว คุณสามารถเข้าสู่ระบบได้ตามปกติ',
        action: 'เข้าสู่ระบบ',
        actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`
      },
      inactive: {
        subject: '⚠️ บัญชีของคุณถูกปิดใช้งานชั่วคราว',
        title: 'บัญชีปิดใช้งาน',
        message: 'บัญชีของคุณถูกปิดใช้งานชั่วคราว หากมีข้อสงสัยกรุณาติดต่อผู้ดูแลระบบ',
        action: 'ติดต่อฝ่ายสนับสนุน',
        actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/contact`
      },
      suspended: {
        subject: '🚫 บัญชีของคุณถูกระงับการใช้งาน',
        title: 'บัญชีถูกระงับ',
        message: 'บัญชีของคุณถูกระงับการใช้งาน เนื่องจากการกระทำที่ไม่เหมาะสม',
        action: 'ติดต่อฝ่ายสนับสนุน',
        actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/contact`
      }
    };

    const statusInfo = statusMessages[status];
    
    await sendEmail({
      to: user.email,
      subject: statusInfo.subject,
      template: 'user-status-update',
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        statusTitle: statusInfo.title,
        statusMessage: statusInfo.message,
        reason: reason || 'ไม่ระบุเหตุผล',
        updatedBy: `${req.user.firstName} ${req.user.lastName}`,
        updateDate: new Date().toLocaleDateString('th-TH'),
        actionText: statusInfo.action,
        actionUrl: statusInfo.actionUrl,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@lms.com'
      }
    });

    console.log(`✅ Status update email sent to: ${user.email} (${status})`);

  } catch (emailError) {
    console.error('❌ Failed to send status update email:', emailError.message);
  }

  // 📧 NOTIFY OTHER ADMINS ABOUT STATUS CHANGE (except for routine activations)
  if (status !== 'active' || oldStatus === 'suspended') {
    try {
      const otherAdmins = await User.findAll({
        where: { 
          role: 'admin', 
          status: 'active',
          id: { [Op.ne]: req.user.id }
        }
      });

      for (const admin of otherAdmins) {
        await sendEmail({
          to: admin.email,
          subject: `🔄 การเปลี่ยนสถานะผู้ใช้: ${user.firstName} ${user.lastName}`,
          template: 'admin-user-status-notification',
          data: {
            adminName: admin.firstName,
            targetUserName: `${user.firstName} ${user.lastName}`,
            targetUserEmail: user.email,
            targetUserRole: user.role,
            oldStatus: oldStatus,
            newStatus: status,
            reason: reason || 'ไม่ระบุเหตุผล',
            updatedBy: `${req.user.firstName} ${req.user.lastName}`,
            updateDate: new Date().toLocaleDateString('th-TH'),
            userManagementUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/users`
          }
        });
      }

      console.log(`✅ Admin notification emails sent for status change`);
    } catch (emailError) {
      console.error('❌ Failed to send admin status notifications:', emailError.message);
    }
  }

  // Emit socket events
  const io = req.app.get('io');
  if (io) {
    // Notify admins
    io.to('admin-room').emit('user-status-updated', {
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      role: user.role,
      oldStatus: oldStatus,
      newStatus: status,
      updatedBy: req.user.id,
      timestamp: new Date()
    });

    // Notify the user if they're online
    io.to(`user-${user.id}`).emit('account-status-updated', {
      status: status,
      reason: reason,
      message: status === 'active' 
        ? 'บัญชีของคุณถูกเปิดใช้งานแล้ว' 
        : status === 'inactive'
        ? 'บัญชีของคุณถูกปิดใช้งานชั่วคราว'
        : 'บัญชีของคุณถูกระงับการใช้งาน',
      timestamp: new Date()
    });
  }

  res.status(200).json({
    success: true,
    message: `User status updated to ${status}`,
    data: {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        previousStatus: oldStatus
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