// File: backend/src/middleware/auth.js
// Path: backend/src/middleware/auth.js

const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { AppError } = require('./errorHandler');
const { catchAsync } = require('./errorHandler');

// ========================================
// JWT CONFIGURATION
// ========================================

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRE || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRE || '30d';

// ========================================
// JWT UTILITY FUNCTIONS
// ========================================

// Generate access token
const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

// Generate refresh token
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN
  });
};

// Generate both tokens
const generateTokens = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({ ...payload, type: 'refresh' });

  return { accessToken, refreshToken };
};

// Verify token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Token has expired', 401);
    }
    if (error.name === 'JsonWebTokenError') {
      throw new AppError('Invalid token', 401);
    }
    throw new AppError('Token verification failed', 401);
  }
};

// ========================================
// AUTHENTICATION MIDDLEWARE
// ========================================

// Protect routes - require valid JWT token
const protect = catchAsync(async (req, res, next) => {
  let token;

  // 1) Get token from header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 2) Check if token exists
  if (!token) {
    return next(new AppError('You are not logged in. Please log in to access this resource.', 401));
  }

  // 3) Verify token
  const decoded = verifyToken(token);

  // 4) Check if user still exists
  const currentUser = await User.findByPk(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  // 5) Check if user is active
  if (currentUser.status !== 'active') {
    return next(new AppError('Your account is not active. Please contact administrator.', 401));
  }

  // 6) Grant access to protected route
  req.user = currentUser;
  next();
});

// Optional authentication - don't require token but decode if present
const optionalAuth = catchAsync(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = verifyToken(token);
      const currentUser = await User.findByPk(decoded.id);
      
      if (currentUser && currentUser.status === 'active') {
        req.user = currentUser;
      }
    } catch (error) {
      // Ignore token errors for optional auth
    }
  }

  next();
});

// ========================================
// ROLE-BASED ACCESS CONTROL
// ========================================

// Restrict access to specific roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('You are not logged in.', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }

    next();
  };
};

// Check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new AppError('Admin access required.', 403));
  }
  next();
};

// Check if user is teacher or admin
const isTeacherOrAdmin = (req, res, next) => {
  if (!req.user || !['teacher', 'admin'].includes(req.user.role)) {
    return next(new AppError('Teacher or Admin access required.', 403));
  }
  next();
};

// Check if user is student (for student-specific routes)
const isStudent = (req, res, next) => {
  if (!req.user || req.user.role !== 'student') {
    return next(new AppError('Student access required.', 403));
  }
  next();
};

// ========================================
// RESOURCE OWNERSHIP MIDDLEWARE
// ========================================

// Check if user owns the resource or is admin
const isOwnerOrAdmin = (resourceModel, resourceIdParam = 'id', userIdField = 'userId') => {
  return catchAsync(async (req, res, next) => {
    if (!req.user) {
      return next(new AppError('You are not logged in.', 401));
    }

    // Admin can access everything
    if (req.user.role === 'admin') {
      return next();
    }

    const resourceId = req.params[resourceIdParam];
    const resource = await resourceModel.findByPk(resourceId);

    if (!resource) {
      return next(new AppError('Resource not found.', 404));
    }

    // Check ownership
    if (resource[userIdField] !== req.user.id) {
      return next(new AppError('You can only access your own resources.', 403));
    }

    req.resource = resource;
    next();
  });
};

// ========================================
// COURSE OWNERSHIP MIDDLEWARE
// ========================================

// Check if user is the teacher of the course or admin
const isCourseTeacherOrAdmin = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return next(new AppError('You are not logged in.', 401));
  }

  // Admin can access everything
  if (req.user.role === 'admin') {
    return next();
  }

  const { Course } = require('../models');
  const courseId = req.params.courseId || req.params.id;
  
  const course = await Course.findByPk(courseId);
  if (!course) {
    return next(new AppError('Course not found.', 404));
  }

  // Check if user is the teacher of this course
  if (course.teacherId !== req.user.id) {
    return next(new AppError('You can only manage your own courses.', 403));
  }

  req.course = course;
  next();
});

// ========================================
// ENROLLMENT CHECKING MIDDLEWARE
// ========================================

// Check if user is enrolled in the course
const isEnrolledOrTeacher = catchAsync(async (req, res, next) => {
  if (!req.user) {
    return next(new AppError('You are not logged in.', 401));
  }

  // Admin can access everything
  if (req.user.role === 'admin') {
    return next();
  }

  const { Course, Enrollment } = require('../models');
  const courseId = req.params.courseId || req.params.id;

  const course = await Course.findByPk(courseId);
  if (!course) {
    return next(new AppError('Course not found.', 404));
  }

  // Teacher of the course can access
  if (req.user.role === 'teacher' && course.teacherId === req.user.id) {
    req.course = course;
    return next();
  }

  // Check if student is enrolled
  if (req.user.role === 'student') {
    const enrollment = await Enrollment.findOne({
      where: {
        courseId: courseId,
        studentId: req.user.id,
        status: 'approved',
        isActive: true
      },
      attributes: {
        exclude: ['rejectionReason'] // Exclude field that doesn't exist in DB
      }
    });

    if (!enrollment) {
      return next(new AppError('You must be enrolled in this course to access this resource.', 403));
    }

    req.course = course;
    req.enrollment = enrollment;
    return next();
  }

  return next(new AppError('Access denied.', 403));
});

// ========================================
// ACCOUNT STATUS MIDDLEWARE
// ========================================

// Check if teacher account is approved
const isApprovedTeacher = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('You are not logged in.', 401));
  }

  if (req.user.role === 'teacher' && req.user.status !== 'active') {
    return next(new AppError('Your teacher account is pending approval. Please wait for admin approval.', 403));
  }

  next();
};

// ========================================
// EXPORTS
// ========================================

module.exports = {
  // Token utilities
  generateTokens,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  
  // Authentication middleware
  protect,
  optionalAuth,
  
  // Role-based access
  restrictTo,
  isAdmin,
  isTeacherOrAdmin,
  isStudent,
  
  // Resource ownership
  isOwnerOrAdmin,
  isCourseTeacherOrAdmin,
  isEnrolledOrTeacher,
  
  // Account status
  isApprovedTeacher
};