// File: backend/src/controllers/auth.js
// Path: backend/src/controllers/auth.js

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User } = require('../models');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { generateTokens, verifyToken } = require('../middleware/auth');
const { sendEmail } = require('../utils/emailService');
const { 
  processImage, 
  generateUniqueFileName, 
  formatFileSize, 
  saveFileLocally,
  deleteFileLocally,
  validateFile,
  FILE_TYPE_CONFIGS
} = require('../utils/fileHelper');

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

  // 📧 SEND EMAILS BASED ON ROLE
  try {
    if (role === 'student') {
      // Send welcome email to student
      await sendEmail({
        to: email,
        subject: '🎉 ยินดีต้อนรับสู่ระบบ LMS!',
        template: 'welcome-student',
        data: {
          firstName,
          lastName,
          loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`,
          supportEmail: process.env.SUPPORT_EMAIL || 'support@lms.com'
        }
      });

      console.log(`✅ Welcome email sent to student: ${email}`);

    } else if (role === 'teacher') {
      // Send welcome email to teacher (pending approval)
      await sendEmail({
        to: email,
        subject: '👩‍🏫 ยินดีต้อนรับครูผู้สอน - รอการอนุมัติ',
        template: 'welcome-teacher-pending',
        data: {
          firstName,
          lastName,
          adminContact: process.env.ADMIN_EMAIL || 'admin@lms.com',
          loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`
        }
      });

      // 🚨 NOTIFY ADMIN ABOUT NEW TEACHER REGISTRATION
      const adminUsers = await User.findAll({
        where: { role: 'admin', status: 'active' }
      }).catch(() => []);

      for (const admin of adminUsers) {
        await sendEmail({
          to: admin.email,
          subject: '🆕 ครูใหม่ลงทะเบียนรอการอนุมัติ',
          template: 'admin-new-teacher-notification',
          data: {
            adminName: admin.firstName,
            teacherName: `${firstName} ${lastName}`,
            teacherEmail: email,
            teacherPhone: phone || 'ไม่ระบุ',
            registrationDate: new Date().toLocaleDateString('th-TH'),
            approvalUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/teachers`,
            teacherId: newUser.id
          }
        });
      }

      console.log(`✅ Teacher registration emails sent: ${email} + admins notified`);
    }

  } catch (emailError) {
    console.error('❌ Email sending failed during registration:', emailError.message);
    // Don't fail registration if email fails - just log it
  }

  // Emit socket event if available
  const io = req.app.get('io');
  if (io) {
    io.emit('user-registered', {
      userId: newUser.id,
      role: newUser.role,
      timestamp: new Date(),
      needsApproval: role === 'teacher'
    });

    // Emit to admin room for teacher registrations
    if (role === 'teacher') {
      io.to('admin-room').emit('teacher-registration', {
        teacherId: newUser.id,
        teacherName: `${firstName} ${lastName}`,
        email: email,
        timestamp: new Date()
      });
    }
  }

  // Send response
  const message = role === 'teacher' 
    ? 'Registration successful! Your teacher account is pending admin approval. You will receive an email once approved.' 
    : 'Registration successful! You can now log in and start learning.';

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
    return next(new AppError('Your teacher account is pending approval. Please wait for admin approval or contact support.', 401));
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

  // Emit socket event for real-time user tracking
  const io = req.app.get('io');
  if (io) {
    io.emit('user-online', {
      userId: user.id,
      role: user.role,
      timestamp: new Date()
    });
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

  // Emit socket event
  const io = req.app.get('io');
  if (io) {
    io.emit('user-offline', {
      userId: req.user.id,
      timestamp: new Date()
    });
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

// ========================================
// 📸 PROFILE PHOTO UPLOAD INTEGRATION
// ========================================

// @desc    Upload and update profile photo
// @route   POST /api/auth/profile/photo
// @access  Private
const uploadProfilePhoto = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('ไม่พบไฟล์รูปภาพที่อัปโหลด', 400));
  }

  const userId = req.user.id;
  const file = req.file;

  // Validate file
  const validation = validateFile(file, FILE_TYPE_CONFIGS.profile);
  if (!validation.isValid) {
    return next(new AppError(validation.errors.join(', '), 400));
  }

  try {
    // Process image
    const imageBuffer = file.buffer || require('fs').readFileSync(file.path);
    const processResult = await processImage(imageBuffer, {
      width: 400,
      height: 400,
      quality: 85,
      format: 'jpeg',
      generateThumbnail: true,
      thumbnailSize: 150
    });

    if (!processResult.success) {
      return next(new AppError('เกิดข้อผิดพลาดในการประมวลผลรูปภาพ', 500));
    }

    // Generate unique filename
    const fileName = generateUniqueFileName(file.originalname, `profile_${userId}`);
    const thumbnailName = generateUniqueFileName(file.originalname, `profile_${userId}_thumb`);

    // Save processed image
    const saveResult = await saveFileLocally(processResult.processedBuffer, fileName, 'profiles');
    if (!saveResult.success) {
      return next(new AppError('เกิดข้อผิดพลาดในการบันทึกรูปภาพ', 500));
    }

    // Save thumbnail
    let thumbnailUrl = null;
    if (processResult.thumbnail) {
      const thumbnailResult = await saveFileLocally(processResult.thumbnail, thumbnailName, 'profiles/thumbnails');
      if (thumbnailResult.success) {
        thumbnailUrl = thumbnailResult.fullUrl;
      }
    }

    // Get user and delete old photo if exists
    const user = await User.findByPk(userId);
    if (!user) {
      return next(new AppError('ไม่พบผู้ใช้', 404));
    }

    // Delete old profile photo if exists
    if (user.profilePhoto && user.profilePhoto !== saveResult.fullUrl) {
      try {
        const oldPath = user.profilePhoto.replace(process.env.API_URL || 'http://localhost:5000', '.');
        await deleteFileLocally(oldPath);
      } catch (error) {
        console.log('Failed to delete old profile photo:', error.message);
      }
    }

    // Delete old thumbnail if exists
    if (user.profileThumbnail && user.profileThumbnail !== thumbnailUrl) {
      try {
        const oldThumbPath = user.profileThumbnail.replace(process.env.API_URL || 'http://localhost:5000', '.');
        await deleteFileLocally(oldThumbPath);
      } catch (error) {
        console.log('Failed to delete old profile thumbnail:', error.message);
      }
    }

    // Update user with new photo URLs
    user.profilePhoto = saveResult.fullUrl;
    user.profileThumbnail = thumbnailUrl;
    await user.save();

    // Clean up temp file if using local storage
    if (file.path) {
      try {
        await deleteFileLocally(file.path);
      } catch (error) {
        console.log('Failed to clean up temp file:', error.message);
      }
    }

    // 📧 Send profile update notification
    try {
      await sendEmail({
        to: user.email,
        subject: '📸 รูปโปรไฟล์ของคุณอัปเดตแล้ว',
        template: 'profile-photo-updated',
        data: {
          firstName: user.firstName,
          lastName: user.lastName,
          updateDate: new Date().toLocaleDateString('th-TH'),
          profileUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile`,
          photoUrl: saveResult.fullUrl
        }
      });

      console.log(`✅ Profile photo update email sent to: ${user.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send profile update email:', emailError.message);
    }

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${userId}`).emit('profile-photo-updated', {
        profilePhoto: user.profilePhoto,
        profileThumbnail: user.profileThumbnail,
        timestamp: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: 'อัปโหลดรูปโปรไฟล์สำเร็จ',
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePhoto: user.profilePhoto,
          profileThumbnail: user.profileThumbnail
        },
        fileInfo: {
          originalName: file.originalname,
          fileName: fileName,
          size: formatFileSize(processResult.processedSize),
          url: saveResult.fullUrl,
          thumbnailUrl: thumbnailUrl
        }
      }
    });

  } catch (error) {
    console.error('Profile photo upload error:', error);
    return next(new AppError('เกิดข้อผิดพลาดในการอัปโหลดรูปโปรไฟล์', 500));
  }
});

// @desc    Delete profile photo
// @route   DELETE /api/auth/profile/photo
// @access  Private
const deleteProfilePhoto = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return next(new AppError('ไม่พบผู้ใช้', 404));
    }

    if (!user.profilePhoto) {
      return next(new AppError('ไม่มีรูปโปรไฟล์ที่จะลบ', 400));
    }

    // Delete profile photo file
    try {
      const photoPath = user.profilePhoto.replace(process.env.API_URL || 'http://localhost:5000', '.');
      await deleteFileLocally(photoPath);
    } catch (error) {
      console.log('Failed to delete profile photo file:', error.message);
    }

    // Delete thumbnail file
    if (user.profileThumbnail) {
      try {
        const thumbPath = user.profileThumbnail.replace(process.env.API_URL || 'http://localhost:5000', '.');
        await deleteFileLocally(thumbPath);
      } catch (error) {
        console.log('Failed to delete profile thumbnail file:', error.message);
      }
    }

    // Clear photo URLs from database
    user.profilePhoto = null;
    user.profileThumbnail = null;
    await user.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${userId}`).emit('profile-photo-deleted', {
        timestamp: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: 'ลบรูปโปรไฟล์สำเร็จ',
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePhoto: null,
          profileThumbnail: null
        }
      }
    });

  } catch (error) {
    console.error('Profile photo deletion error:', error);
    return next(new AppError('เกิดข้อผิดพลาดในการลบรูปโปรไฟล์', 500));
  }
});

// ========================================
// EXISTING PASSWORD FUNCTIONS (UNCHANGED)
// ========================================

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

  // 📧 Send password change confirmation email
  try {
    await sendEmail({
      to: user.email,
      subject: '🔐 รหัสผ่านของคุณถูกเปลี่ยนแล้ว',
      template: 'password-changed',
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        changeTime: new Date().toLocaleString('th-TH'),
        loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@lms.com'
      }
    });

    console.log(`✅ Password change confirmation sent to: ${user.email}`);
  } catch (emailError) {
    console.error('❌ Failed to send password change email:', emailError.message);
  }

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

  // 📧 Send password reset email
  try {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;
    
    await sendEmail({
      to: email,
      subject: '🔑 รีเซ็ตรหัสผ่าน LMS',
      template: 'password-reset',
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        resetUrl,
        expirationTime: '10 นาที',
        supportEmail: process.env.SUPPORT_EMAIL || 'support@lms.com'
      }
    });

    console.log(`✅ Password reset email sent to: ${email}`);
    
    res.status(200).json({
      success: true,
      message: 'Password reset email sent successfully'
    });

  } catch (emailError) {
    // Clear reset token if email fails
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    console.error('❌ Failed to send reset email:', emailError.message);
    return next(new AppError('Error sending password reset email. Please try again.', 500));
  }
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

  // 📧 Send password reset success email
  try {
    await sendEmail({
      to: user.email,
      subject: '✅ รหัสผ่านใหม่ของคุณพร้อมใช้งานแล้ว',
      template: 'password-reset-success',
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        resetTime: new Date().toLocaleString('th-TH'),
        loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@lms.com'
      }
    });

    console.log(`✅ Password reset success email sent to: ${user.email}`);
  } catch (emailError) {
    console.error('❌ Failed to send success email:', emailError.message);
  }

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

  // 📧 Send welcome email after verification
  try {
    await sendEmail({
      to: user.email,
      subject: '🎉 ยืนยันอีเมลสำเร็จ - ยินดีต้อนรับ!',
      template: 'email-verified',
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`
      }
    });

    console.log(`✅ Email verification success email sent to: ${user.email}`);
  } catch (emailError) {
    console.error('❌ Failed to send verification success email:', emailError.message);
  }

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
  uploadProfilePhoto,    // 🆕 NEW: Profile photo upload
  deleteProfilePhoto,    // 🆕 NEW: Profile photo deletion
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail
};