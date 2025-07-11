// File: backend/src/middleware/validation.js
// Path: backend/src/middleware/validation.js

const Joi = require('joi');
const { AppError } = require('./errorHandler');

// ========================================
// VALIDATION SCHEMAS
// ========================================

// User validation schemas
const userSchemas = {
  register: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .min(6)
      .max(50)
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters long',
        'string.max': 'Password cannot exceed 50 characters',
        'any.required': 'Password is required'
      }),
    firstName: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.min': 'First name must be at least 2 characters long',
        'string.max': 'First name cannot exceed 50 characters',
        'any.required': 'First name is required'
      }),
    lastName: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.min': 'Last name must be at least 2 characters long',
        'string.max': 'Last name cannot exceed 50 characters',
        'any.required': 'Last name is required'
      }),
    role: Joi.string()
      .valid('teacher', 'student')
      .default('student')
      .messages({
        'any.only': 'Role must be either teacher or student'
      }),
    phone: Joi.string()
      .pattern(/^\+?[\d\s\-()]+$/)
      .optional()
      .messages({
        'string.pattern.base': 'Please provide a valid phone number'
      }),
    dateOfBirth: Joi.date()
      .max('now')
      .optional()
      .messages({
        'date.max': 'Date of birth cannot be in the future'
      })
  }),

  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required'
      })
  }),

  updateProfile: Joi.object({
    firstName: Joi.string()
      .min(2)
      .max(50)
      .optional(),
    lastName: Joi.string()
      .min(2)
      .max(50)
      .optional(),
    phone: Joi.string()
      .pattern(/^\+?[\d\s\-()]+$/)
      .optional()
      .allow(''),
    dateOfBirth: Joi.date()
      .max('now')
      .optional(),
    bio: Joi.string()
      .max(500)
      .optional()
      .allow(''),
    address: Joi.string()
      .max(200)
      .optional()
      .allow('')
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string()
      .required()
      .messages({
        'any.required': 'Current password is required'
      }),
    newPassword: Joi.string()
      .min(6)
      .max(50)
      .required()
      .messages({
        'string.min': 'New password must be at least 6 characters long',
        'string.max': 'New password cannot exceed 50 characters',
        'any.required': 'New password is required'
      })
  })
};

// Course validation schemas
const courseSchemas = {
  create: Joi.object({
    title: Joi.string()
      .min(3)
      .max(255)
      .required()
      .messages({
        'string.min': 'Course title must be at least 3 characters long',
        'string.max': 'Course title cannot exceed 255 characters',
        'any.required': 'Course title is required'
      }),
    description: Joi.string()
      .max(2000)
      .optional()
      .allow(''),
    shortDescription: Joi.string()
      .max(500)
      .optional()
      .allow(''),
    categoryId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Category ID must be a number',
        'number.positive': 'Category ID must be positive',
        'any.required': 'Category is required'
      }),
    difficultyLevel: Joi.number()
      .integer()
      .min(1)
      .max(5)
      .optional()
      .messages({
        'number.min': 'Difficulty level must be between 1 and 5',
        'number.max': 'Difficulty level must be between 1 and 5'
      }),
    estimatedDuration: Joi.number()
      .integer()
      .positive()
      .optional()
      .messages({
        'number.positive': 'Estimated duration must be positive'
      }),
    maxStudents: Joi.number()
      .integer()
      .positive()
      .optional()
      .messages({
        'number.positive': 'Maximum students must be positive'
      }),
    tags: Joi.array()
      .items(Joi.string().max(50))
      .max(10)
      .optional()
      .messages({
        'array.max': 'Maximum 10 tags allowed'
      }),
    prerequisites: Joi.array()
      .items(Joi.string().max(100))
      .max(5)
      .optional()
      .messages({
        'array.max': 'Maximum 5 prerequisites allowed'
      }),
    learningObjectives: Joi.array()
      .items(Joi.string().max(200))
      .max(10)
      .optional()
      .messages({
        'array.max': 'Maximum 10 learning objectives allowed'
      })
  }),

  update: Joi.object({
    title: Joi.string()
      .min(3)
      .max(255)
      .optional(),
    description: Joi.string()
      .max(2000)
      .optional()
      .allow(''),
    shortDescription: Joi.string()
      .max(500)
      .optional()
      .allow(''),
    categoryId: Joi.number()
      .integer()
      .positive()
      .optional(),
    difficultyLevel: Joi.number()
      .integer()
      .min(1)
      .max(5)
      .optional(),
    estimatedDuration: Joi.number()
      .integer()
      .positive()
      .optional(),
    maxStudents: Joi.number()
      .integer()
      .positive()
      .optional(),
    isPublished: Joi.boolean()
      .optional(),
    tags: Joi.array()
      .items(Joi.string().max(50))
      .max(10)
      .optional(),
    prerequisites: Joi.array()
      .items(Joi.string().max(100))
      .max(5)
      .optional(),
    learningObjectives: Joi.array()
      .items(Joi.string().max(200))
      .max(10)
      .optional()
  })
};

// ========================================
// NEW: ENROLLMENT VALIDATION SCHEMAS  🆕
// ========================================
const enrollmentSchemas = {
  updateStatus: Joi.object({
    status: Joi.string()
      .valid('approved', 'rejected')
      .required()
      .messages({
        'any.only': 'Status must be either approved or rejected',
        'any.required': 'Status is required'
      }),
    reason: Joi.string()
      .max(500)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Reason cannot exceed 500 characters'
      }),
    rejectionReason: Joi.string()
      .max(500)
      .optional()
      .allow('')
      .when('status', {
        is: 'rejected',
        then: Joi.string().required().messages({
          'any.required': 'Rejection reason is required when rejecting enrollment'
        }),
        otherwise: Joi.optional()
      })
      .messages({
        'string.max': 'Rejection reason cannot exceed 500 characters'
      })
  })
};

// Quiz validation schemas
const quizSchemas = {
  create: Joi.object({
    courseId: Joi.number()
      .integer()
      .positive()
      .required(),
    lessonId: Joi.number()
      .integer()
      .positive()
      .optional(),
    title: Joi.string()
      .min(3)
      .max(255)
      .required(),
    description: Joi.string()
      .max(1000)
      .optional()
      .allow(''),
    quizType: Joi.string()
      .valid('practice', 'assessment', 'final_exam')
      .default('practice'),
    timeLimit: Joi.number()
      .integer()
      .min(1)
      .max(480)
      .optional()
      .messages({
        'number.min': 'Time limit must be at least 1 minute',
        'number.max': 'Time limit cannot exceed 8 hours (480 minutes)'
      }),
    maxAttempts: Joi.number()
      .integer()
      .min(1)
      .max(10)
      .default(1),
    passingScore: Joi.number()
      .min(0)
      .max(100)
      .default(70),
    randomizeQuestions: Joi.boolean()
      .default(false),
    showCorrectAnswers: Joi.boolean()
      .default(true),
    showResultsImmediately: Joi.boolean()
      .default(true),
    availableFrom: Joi.date()
      .optional(),
    availableUntil: Joi.date()
      .greater(Joi.ref('availableFrom'))
      .optional()
      .messages({
        'date.greater': 'Available until date must be after available from date'
      })
  })
};

// ========================================
// VALIDATION MIDDLEWARE
// ========================================

const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Get all validation errors
      allowUnknown: false, // Don't allow unknown fields
      stripUnknown: true // Remove unknown fields
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      
      return next(new AppError(`Validation error: ${errorMessage}`, 400));
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};

// Validate query parameters
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      
      return next(new AppError(`Query validation error: ${errorMessage}`, 400));
    }

    req.query = value;
    next();
  };
};

// Validate URL parameters
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      
      return next(new AppError(`Parameter validation error: ${errorMessage}`, 400));
    }

    req.params = value;
    next();
  };
};

// ========================================
// COMMON PARAMETER SCHEMAS
// ========================================
const paramSchemas = {
  id: Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'ID must be a number',
        'number.positive': 'ID must be positive',
        'any.required': 'ID is required'
      })
  }),
  
  userId: Joi.object({
    userId: Joi.number()
      .integer()
      .positive()
      .required()
  }),
  
  courseId: Joi.object({
    courseId: Joi.number()
      .integer()
      .positive()
      .required()
  }),

  // 🆕 NEW: Course and Student ID validation for enrollment
  courseStudentParams: Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Course ID must be a number',
        'number.positive': 'Course ID must be positive',
        'any.required': 'Course ID is required'
      }),
    studentId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Student ID must be a number',
        'number.positive': 'Student ID must be positive',
        'any.required': 'Student ID is required'
      })
  })
};

// Common query schemas
const querySchemas = {
  pagination: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10),
    sort: Joi.string()
      .optional(),
    order: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
  })
};

module.exports = {
  validate,
  validateQuery,
  validateParams,
  userSchemas,
  courseSchemas,
  enrollmentSchemas,    // 🆕 NEW
  quizSchemas,
  paramSchemas,
  querySchemas
};