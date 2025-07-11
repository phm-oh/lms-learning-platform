// File: backend/src/routes/auth.js
// Path: backend/src/routes/auth.js

const express = require('express');
const router = express.Router();

// Import controllers and middleware
const {
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
} = require('../controllers/auth');

// Import middleware
const { protect, optionalAuth } = require('../middleware/auth');
const { validate, userSchemas } = require('../middleware/validation');
const { 
  authLimiter, 
  passwordResetLimiter, 
  generalLimiter 
} = require('../middleware/rateLimit');

// ========================================
// PUBLIC ROUTES (No authentication required)
// ========================================

// User registration
router.post('/register', 
  authLimiter,
  register
);

// User login
router.post('/login',
  authLimiter,
  login
);

// Forgot password - send reset token
router.post('/forgot-password',
  passwordResetLimiter,
  forgotPassword
);

// Reset password with token
router.patch('/reset-password/:token',
  passwordResetLimiter,
  resetPassword
);

// Email verification
router.get('/verify-email/:token',
  generalLimiter,
  verifyEmail
);

// ========================================
// PROTECTED ROUTES (Authentication required)
// ========================================

// Logout (clear token)
router.post('/logout',
  generalLimiter,
  logout
);

// Get current user profile
router.get('/profile',
  protect,
  getMe
);

// Update user profile
router.patch('/profile',
  protect,
  updateProfile
);

// Change password
router.patch('/change-password',
  protect,
  changePassword
);

// Refresh token
router.post('/refresh-token',
  protect,
  refreshToken
);

// ========================================
// TESTING/DEBUG ROUTES (Development only)
// ========================================

if (process.env.NODE_ENV === 'development') {
  // Test protected route
  router.get('/test-protected',
    protect,
    (req, res) => {
      res.json({
        success: true,
        message: 'Protected route accessed successfully',
        user: {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role,
          status: req.user.status
        }
      });
    }
  );

  // Test optional auth route
  router.get('/test-optional',
    optionalAuth,
    (req, res) => {
      res.json({
        success: true,
        message: 'Optional auth route accessed',
        authenticated: !!req.user,
        user: req.user ? {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role
        } : null
      });
    }
  );
}

// ========================================
// ROUTE DOCUMENTATION
// ========================================

router.get('/docs', (req, res) => {
  res.json({
    title: 'Authentication API Documentation',
    version: '1.0.0',
    baseUrl: '/api/auth',
    
    publicRoutes: {
      'POST /register': {
        description: 'Register new user account',
        body: {
          email: 'string (required)',
          password: 'string (required, min 6 chars)',
          confirmPassword: 'string (required, must match password)',
          firstName: 'string (required)',
          lastName: 'string (required)',
          role: 'string (optional: teacher|student, default: student)',
          phone: 'string (optional)',
          dateOfBirth: 'date (optional)'
        },
        responses: {
          201: 'User registered successfully',
          400: 'Validation error',
          409: 'User already exists'
        },
        notes: [
          'Teachers require admin approval',
          'Students are active immediately'
        ]
      },
      
      'POST /login': {
        description: 'User login',
        body: {
          email: 'string (required)',
          password: 'string (required)'
        },
        responses: {
          200: 'Login successful',
          401: 'Invalid credentials or account not active'
        }
      },
      
      'POST /forgot-password': {
        description: 'Request password reset token',
        body: {
          email: 'string (required)'
        },
        responses: {
          200: 'Reset token sent',
          404: 'User not found'
        }
      },
      
      'PATCH /reset-password/:token': {
        description: 'Reset password with token',
        params: {
          token: 'string (required)'
        },
        body: {
          password: 'string (required, min 6 chars)',
          confirmPassword: 'string (required, must match password)'
        },
        responses: {
          200: 'Password reset successful',
          400: 'Invalid or expired token'
        }
      }
    },
    
    protectedRoutes: {
      'GET /profile': {
        description: 'Get current user profile',
        headers: {
          Authorization: 'Bearer <token>'
        },
        responses: {
          200: 'Profile data returned',
          401: 'Unauthorized'
        }
      },
      
      'PATCH /profile': {
        description: 'Update user profile',
        headers: {
          Authorization: 'Bearer <token>'
        },
        body: {
          firstName: 'string (optional)',
          lastName: 'string (optional)',
          phone: 'string (optional)',
          dateOfBirth: 'date (optional)',
          bio: 'string (optional)'
        },
        responses: {
          200: 'Profile updated',
          400: 'Validation error'
        }
      },
      
      'PATCH /change-password': {
        description: 'Change user password',
        headers: {
          Authorization: 'Bearer <token>'
        },
        body: {
          currentPassword: 'string (required)',
          newPassword: 'string (required, min 6 chars)',
          confirmPassword: 'string (required, must match newPassword)'
        },
        responses: {
          200: 'Password changed',
          400: 'Invalid current password'
        }
      },
      
      'POST /refresh-token': {
        description: 'Get new JWT token',
        headers: {
          Authorization: 'Bearer <token>'
        },
        responses: {
          200: 'New token issued',
          401: 'Current token invalid'
        }
      },
      
      'POST /logout': {
        description: 'Logout user (clear token)',
        responses: {
          200: 'Logged out successfully'
        }
      }
    },
    
    rateLimiting: {
      'Authentication routes': '5 requests per 15 minutes',
      'Password reset': '3 requests per hour',
      'General routes': '100 requests per 15 minutes'
    },
    
    errorCodes: {
      400: 'Bad Request - Invalid input data',
      401: 'Unauthorized - Invalid or missing token',
      403: 'Forbidden - Account not active',
      404: 'Not Found - User not found',
      409: 'Conflict - User already exists',
      429: 'Too Many Requests - Rate limit exceeded',
      500: 'Internal Server Error'
    }
  });
});

module.exports = router;