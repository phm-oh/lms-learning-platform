// File: backend/src/controllers/auth.js
// Path: backend/src/controllers/auth.js

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User } = require('../models');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { generateTokens, verifyToken } = require('../middleware/auth');

// ========================================
// HELPER FUNCTIONS
// ========================================

// Send token response
const createSendToken = (user, statusCode, res, message = 'Success') => {
  const { accessToken, refreshToken } = generateTokens(user);

  // Remove password from output
  const userOutput = user.toJSON();
  delete userOutput.password;

  res.status(statusCode).json({
    success: true,
    message,
    data: {
      user: userOutput,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRE || '7d'
      }
    }
  });
};

// Generate random token
const generateRandomToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// ========================================
// AUTHENTICATION CONTROLLERS
// ========================================

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = catchAsync(async (req, res, next) => {
  const { email, password, firstName, lastName, role = 'student', phone, dateOfBirth } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return next(new AppError('User with this email already exists', 409));
  }

  // Set user status based on role
  let status = 'active'; // Students are active by default
  if (role === 'teacher') {
    status = 'pending'; // Teachers need admin approval
  }

  // Create new user
  const newUser = await User.create({
    email,
    password,
    firstName,
    lastName,
    role,
    status,
    phone,
    dateOfBirth,
    emailVerified: true // For now, skip email verification
  });

  // Generate email verification token (for future use)
  const emailToken = generateRandomToken();
  newUser.emailVerificationToken = emailToken;
  await newUser.save();

  // Log activity
  try {
    const { UserActivity } = require('../models');
    await UserActivity.create({
      userId: newUser.id,
      activityType: 'registration',
      details: {
        registrationTime: new Date(),
        userAgent: req.get('User-Agent'),
        ip: req.ip
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
  } catch (error) {
    console.log('Activity logging failed:', error.message);
  }

  // Emit socket event if available
  const io = req.app.get('io');
  if (io) {
    io.emit('user-registered', {
      userId: newUser.id,
      role: newUser.role,
      timestamp: new Date()
    });
  }

  // Send response
  const message = role === 'teacher' 
    ? 'Registration successful! Your teacher account is pending admin approval.' 
    : 'Registration successful! You can now log in.';

  createSendToken(newUser, 201, res, message);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email and password are provided
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // Find user and include password field
  const user = await User.findOne({ 
    where: { email },
    attributes: { include: ['password'] }
  });

  // Check if user exists and password is correct
  if (!user || !(await user.validatePassword(password))) {
    return next(new AppError('Invalid email or password', 401));
  }

  // Check if user account is active
  if (user.status === 'inactive') {
    return next(new AppError('Your account has been deactivated. Please contact administrator.', 401));
  }

  if (user.status === 'suspended') {
    return next(new AppError('Your account has been suspended. Please contact administrator.', 401));
  }

  if (user.status === 'pending' && user.role === 'teacher') {
    return next(new AppError('Your teacher account is pending approval. Please wait for admin approval.', 401));
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Log activity
  try {
    const { UserActivity } = require('../models');
    await UserActivity.create({
      userId: user.id,
      activityType: 'login',
      details: {
        loginTime: new Date(),
        userAgent: req.get('User-Agent'),
        ip: req.ip
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
  } catch (error) {
    console.log('Activity logging failed:', error.message);
  }

  // Send response
  createSendToken(user, 200, res, 'Login successful');
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = catchAsync(async (req, res, next) => {
  // Log activity
  try {
    const { UserActivity } = require('../models');
    await UserActivity.create({
      userId: req.user.id,
      activityType: 'logout',
      details: {
        logoutTime: new Date(),
        userAgent: req.get('User-Agent'),
        ip: req.ip
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
  } catch (error) {
    console.log('Activity logging failed:', error.message);
  }

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshToken = catchAsync(async (req, res, next) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return next(new AppError('Refresh token is required', 400));
  }

  // Verify refresh token
  const decoded = verifyToken(token);

  if (decoded.type !== 'refresh') {
    return next(new AppError('Invalid refresh token', 401));
  }

  // Find user
  const user = await User.findByPk(decoded.id);
  if (!user) {
    return next(new AppError('User not found', 401));
  }

  if (user.status !== 'active') {
    return next(new AppError('User account is not active', 401));
  }

  // Generate new tokens
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

  res.status(200).json({
    success: true,
    message: 'Token refreshed successfully',
    data: {
      tokens: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: process.env.JWT_EXPIRE || '7d'
      }
    }
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getMe = catchAsync(async (req, res, next) => {
  try {
    // Get user with enrollments
    const user = await User.findByPk(req.user.id, {
      include: [
        {
          model: require('../models').Enrollment,
          as: 'enrollments',
          where: { status: 'approved', isActive: true },
          required: false,
          include: [
            {
              model: require('../models').Course,
              as: 'course',
              attributes: ['id', 'title', 'thumbnail', 'difficultyLevel']
            }
          ]
        }
      ]
    });

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    // If relation models don't exist, just return user without enrollments
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  }
});

// @desc    Update current user profile
// @route   PATCH /api/auth/profile
// @access  Private
const updateProfile = catchAsync(async (req, res, next) => {
  const { firstName, lastName, phone, dateOfBirth, bio, address } = req.body;

  // Update user
  const user = await User.findByPk(req.user.id);
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (phone !== undefined) user.phone = phone;
  if (dateOfBirth) user.dateOfBirth = dateOfBirth;
  if (bio !== undefined) user.bio = bio;
  if (address !== undefined) user.address = address;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user
    }
  });
});

// @desc    Change password
// @route   PATCH /api/auth/change-password
// @access  Private
const changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findByPk(req.user.id, {
    attributes: { include: ['password'] }
  });

  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // Check current password
  if (!(await user.validatePassword(currentPassword))) {
    return next(new AppError('Current password is incorrect', 400));
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Log activity
  try {
    const { UserActivity } = require('../models');
    await UserActivity.create({
      userId: user.id,
      activityType: 'password_changed',
      details: {
        changeTime: new Date(),
        userAgent: req.get('User-Agent'),
        ip: req.ip
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
  } catch (error) {
    console.log('Activity logging failed:', error.message);
  }

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  // Find user
  const user = await User.findOne({ where: { email } });
  if (!user) {
    return next(new AppError('No user found with that email address', 404));
  }

  // Generate reset token
  const resetToken = generateRandomToken();
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await user.save();

  // TODO: Send email with reset token
  // For now, just return the token (remove in production)
  
  res.status(200).json({
    success: true,
    message: 'Password reset token sent to email',
    ...(process.env.NODE_ENV === 'development' && { resetToken }) // Only in development
  });
});

// @desc    Reset password
// @route   PATCH /api/auth/reset-password/:token
// @access  Public
const resetPassword = catchAsync(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  // Hash the token
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find user with valid reset token
  const user = await User.findOne({
    where: {
      passwordResetToken: hashedToken,
      passwordResetExpires: {
        [require('sequelize').Op.gt]: new Date()
      }
    }
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  // Update password and clear reset token
  user.password = password;
  user.passwordResetToken = null;
  user.passwordResetExpires = null;
  await user.save();

  // Log activity
  try {
    const { UserActivity } = require('../models');
    await UserActivity.create({
      userId: user.id,
      activityType: 'password_reset',
      details: {
        resetTime: new Date(),
        userAgent: req.get('User-Agent'),
        ip: req.ip
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
  } catch (error) {
    console.log('Activity logging failed:', error.message);
  }

  res.status(200).json({
    success: true,
    message: 'Password reset successfully'
  });
});

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = catchAsync(async (req, res, next) => {
  const { token } = req.params;

  // Find user with verification token
  const user = await User.findOne({
    where: { emailVerificationToken: token }
  });

  if (!user) {
    return next(new AppError('Invalid verification token', 400));
  }

  // Verify email
  user.emailVerified = true;
  user.emailVerificationToken = null;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Email verified successfully'
  });
});

// ========================================
// EXPORTS
// ========================================

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail
};