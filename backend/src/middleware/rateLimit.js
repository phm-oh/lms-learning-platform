// File: backend/src/middleware/rateLimit.js
// Path: backend/src/middleware/rateLimit.js

const rateLimit = require('express-rate-limit');
const { AppError } = require('./errorHandler');

// ========================================
// RATE LIMITING CONFIGURATIONS
// ========================================

// General API rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req, res) => {
    // Skip rate limiting for health checks and status endpoints
    return req.path === '/health' || req.path === '/api/status';
  }
});

// Strict rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 5, // Very high limit in development (almost unlimited)
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  skipFailedRequests: true, // ⚠️ IMPORTANT: Don't count failed requests in development (for testing)
  skip: (req) => {
    // Skip rate limiting completely in development mode
    if (process.env.NODE_ENV === 'development') {
      return true; // Skip all rate limiting in development
    }
    // Skip rate limiting for localhost in production (for testing)
    const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress;
    const isLocalhost = ip === '127.0.0.1' || 
                       ip === '::1' || 
                       ip === '::ffff:127.0.0.1' ||
                       ip?.includes('127.0.0.1') ||
                       ip?.includes('localhost');
    return isLocalhost;
  }
});

// Very strict rate limiting for password reset
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    error: 'Too many password reset attempts, please try again in 1 hour.',
    retryAfter: '1 hour',
    code: 'PASSWORD_RESET_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting for quiz attempts
const quizAttemptLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // Limit each IP to 10 quiz attempts per 10 minutes
  message: {
    success: false,
    error: 'Too many quiz attempts, please wait before trying again.',
    retryAfter: '10 minutes',
    code: 'QUIZ_ATTEMPT_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID + IP for authenticated users
    const userId = req.user?.id;
    const ip = req.ip;
    return userId ? `${userId}_${ip}` : ip;
  }
});

// Rate limiting for file uploads
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 file uploads per 15 minutes
  message: {
    success: false,
    error: 'Too many file uploads, please try again later.',
    retryAfter: '15 minutes',
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting for content creation (courses, lessons, quizzes)
const contentCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each authenticated user to 50 content creation requests per hour
  message: {
    success: false,
    error: 'You have created too much content recently, please try again later.',
    retryAfter: '1 hour',
    code: 'CONTENT_CREATION_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID for authenticated users
    return req.user?.id || req.ip;
  },
  skip: (req) => {
    // Only apply to teachers and admins
    return !req.user || !['teacher', 'admin'].includes(req.user.role);
  }
});

// Rate limiting for email notifications
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each user to 10 email notifications per hour
  message: {
    success: false,
    error: 'Too many email requests, please try again later.',
    retryAfter: '1 hour',
    code: 'EMAIL_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

// ========================================
// CUSTOM RATE LIMITERS
// ========================================

// Create a custom rate limiter with specific configuration
const createCustomLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
      success: false,
      error: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false
  };

  return rateLimit({ ...defaultOptions, ...options });
};

// Progressive rate limiting based on user role
const roleBasedLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    if (!req.user) return 50; // Unauthenticated users
    
    switch (req.user.role) {
      case 'admin':
        return 1000; // Admins get higher limits
      case 'teacher':
        return 500; // Teachers get moderate limits
      case 'student':
        return 200; // Students get standard limits
      default:
        return 50;
    }
  },
  message: {
    success: false,
    error: 'Rate limit exceeded for your user role.',
    code: 'ROLE_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  }
});

// ========================================
// RATE LIMIT BYPASS MIDDLEWARE
// ========================================

// Middleware to bypass rate limits for certain conditions
const bypassRateLimit = (conditions = []) => {
  return (req, res, next) => {
    // Check if any bypass condition is met
    const shouldBypass = conditions.some(condition => {
      if (typeof condition === 'function') {
        return condition(req);
      }
      return false;
    });

    if (shouldBypass) {
      // Set a flag to bypass rate limiting
      req.bypassRateLimit = true;
    }

    next();
  };
};

// Common bypass conditions
const bypassConditions = {
  // Bypass for admin users
  adminUser: (req) => req.user?.role === 'admin',
  
  // Bypass for local development
  localDevelopment: (req) => {
    return process.env.NODE_ENV === 'development' && 
           (req.ip === '127.0.0.1' || req.ip === '::1');
  },
  
  // Bypass for specific API keys
  apiKey: (req) => {
    const apiKey = req.headers['x-api-key'];
    return apiKey && apiKey === process.env.BYPASS_API_KEY;
  },
  
  // Bypass for health checks
  healthCheck: (req) => {
    return req.path === '/health' || req.path === '/api/status';
  }
};

// ========================================
// RATE LIMIT ERROR HANDLER
// ========================================

const handleRateLimitError = (req, res, next) => {
  return (req, res, next) => {
    // This middleware can be used to customize rate limit error handling
    // Currently, the rate limiters handle their own errors
    next();
  };
};

// ========================================
// EXPORTS
// ========================================

module.exports = {
  // Standard limiters
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  quizAttemptLimiter,
  uploadLimiter,
  contentCreationLimiter,
  emailLimiter,
  roleBasedLimiter,
  
  // Custom limiter creator
  createCustomLimiter,
  
  // Bypass functionality
  bypassRateLimit,
  bypassConditions,
  
  // Error handling
  handleRateLimitError
};