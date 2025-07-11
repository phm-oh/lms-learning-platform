// File: backend/src/controllers/auth.js
// Path: backend/src/controllers/auth.js

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, UserActivity } = require('../models');
const { validationResult } = require('express-validator');
const { emailService } = require('../utils/emailService'); // 🔧 FIX: Import emailService

// ========================================
// AUTHENTICATION CONTROLLERS
// ========================================

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'ข้อมูลไม่ถูกต้อง',
        errors: errors.array()
      });
    }

    const {
      email,
      password,
      confirmPassword,
      firstName,
      lastName,
      role = 'student',
      phone,
      dateOfBirth
    } = req.body;

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'รหัสผ่านไม่ตรงกัน'
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'อีเมลนี้มีผู้ใช้แล้ว'
      });
    }

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      phone,
      dateOfBirth,
      status: role === 'student' ? 'active' : 'pending', // Students auto-active, teachers need approval
      emailVerificationToken,
      emailVerified: false
    });

    // Create JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        status: user.status 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Log user activity
    await UserActivity.create({
      userId: user.id,
      activityType: 'user_registration',
      details: `User registered with role: ${role}`,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // 📧 Send welcome email
    try {
      await emailService.sendWelcomeEmail(user);
      console.log(`✅ Welcome email sent to: ${user.email}`);
    } catch (emailError) {
      console.error('❌ Email sending failed during registration:', emailError.message);
      // Don't fail registration if email fails
    }

    // Return user data (without password)
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      profilePhoto: user.profileImage,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt
    };

    res.status(201).json({
      success: true,
      message: role === 'student' 
        ? 'ลงทะเบียนสำเร็จ' 
        : 'ลงทะเบียนสำเร็จ รอการอนุมัติจากผู้ดูแลระบบ',
      data: {
        user: userResponse,
        token,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRE || '7d'
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลงทะเบียน',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'ข้อมูลไม่ถูกต้อง',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      let message = 'บัญชีของคุณยังไม่ได้รับการอนุมัติ';
      if (user.status === 'suspended') {
        message = 'บัญชีของคุณถูกระงับการใช้งาน';
      } else if (user.status === 'banned') {
        message = 'บัญชีของคุณถูกระงับการใช้งานอย่างถาวร';
      }
      
      return res.status(403).json({
        success: false,
        message
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        status: user.status 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Log user activity
    await UserActivity.create({
      userId: user.id,
      activityType: 'user_login',
      details: 'User logged in successfully',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Return user data (without password)
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status,
      profilePhoto: user.profileImage,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      emailVerified: user.emailVerified,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };

    res.status(200).json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      data: {
        user: userResponse,
        token,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRE || '7d'
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/profile
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
          profilePhoto: user.profileImage,
          phone: user.phone,
          dateOfBirth: user.dateOfBirth,
          emailVerified: user.emailVerified,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูล',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update user profile
// @route   PATCH /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'ข้อมูลไม่ถูกต้อง',
        errors: errors.array()
      });
    }

    const { firstName, lastName, phone, dateOfBirth, bio } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้'
      });
    }

    // Update user data
    await user.update({
      firstName: firstName || user.firstName,
      lastName: lastName || user.lastName,
      phone: phone || user.phone,
      dateOfBirth: dateOfBirth || user.dateOfBirth,
      bio: bio || user.bio
    });

    // Log user activity
    await UserActivity.create({
      userId: user.id,
      activityType: 'profile_update',
      details: 'User updated profile information',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({
      success: true,
      message: 'อัปเดตข้อมูลสำเร็จ',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
          profilePhoto: user.profileImage,
          phone: user.phone,
          dateOfBirth: user.dateOfBirth,
          bio: user.bio,
          updatedAt: user.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดต',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Change password
// @route   PATCH /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'ข้อมูลไม่ถูกต้อง',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'รหัสผ่านใหม่ไม่ตรงกัน'
      });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้'
      });
    }

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง'
      });
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await user.update({ password: hashedPassword });

    // Log user activity
    await UserActivity.create({
      userId: user.id,
      activityType: 'password_change',
      details: 'User changed password',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({
      success: true,
      message: 'เปลี่ยนรหัสผ่านสำเร็จ'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'ข้อมูลไม่ถูกต้อง',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if user exists or not
      return res.status(200).json({
        success: true,
        message: 'หากอีเมลนี้มีในระบบ เราจะส่งลิงก์รีเซ็ตรหัสผ่านไปให้'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save reset token
    await user.update({
      passwordResetToken: resetToken,
      passwordResetExpires: resetTokenExpiry
    });

    // 📧 Send reset email
    try {
      await emailService.sendPasswordResetEmail(user, resetToken);
      console.log(`✅ Password reset email sent to: ${user.email}`);
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError.message);
      // Reset the token if email fails
      await user.update({
        passwordResetToken: null,
        passwordResetExpires: null
      });
      
      return res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการส่งอีเมล'
      });
    }

    res.status(200).json({
      success: true,
      message: 'ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลแล้ว'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการขอรีเซ็ตรหัสผ่าน',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Reset password
// @route   PATCH /api/auth/reset-password/:token
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'ข้อมูลไม่ถูกต้อง',
        errors: errors.array()
      });
    }

    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'รหัสผ่านไม่ตรงกัน'
      });
    }

    // Find user by reset token
    const user = await User.findOne({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          [require('sequelize').Op.gt]: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'รหัสรีเซ็ตไม่ถูกต้องหรือหมดอายุแล้ว'
      });
    }

    // Hash new password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Update password and clear reset token
    await user.update({
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null
    });

    // Log user activity
    await UserActivity.create({
      userId: user.id,
      activityType: 'password_reset',
      details: 'User reset password via email',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({
      success: true,
      message: 'รีเซ็ตรหัสผ่านสำเร็จ'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // Log user activity
    await UserActivity.create({
      userId: req.user.id,
      activityType: 'user_logout',
      details: 'User logged out',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({
      success: true,
      message: 'ออกจากระบบสำเร็จ'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการออกจากระบบ',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'ไม่พบ refresh token'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    
    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'ไม่พบผู้ใช้'
      });
    }

    // Generate new access token
    const newToken = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        status: user.status 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(200).json({
      success: true,
      data: {
        token: newToken,
        expiresIn: process.env.JWT_EXPIRE || '7d'
      }
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Refresh token ไม่ถูกต้อง'
    });
  }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Find user by verification token
    const user = await User.findOne({
      where: {
        emailVerificationToken: token,
        emailVerified: false
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'รหัสยืนยันอีเมลไม่ถูกต้องหรือหมดอายุแล้ว'
      });
    }

    // Update user as verified
    await user.update({
      emailVerified: true,
      emailVerificationToken: null
    });

    // Log user activity
    await UserActivity.create({
      userId: user.id,
      activityType: 'email_verified',
      details: 'User verified email address',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({
      success: true,
      message: 'ยืนยันอีเมลสำเร็จ'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการยืนยันอีเมล',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

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