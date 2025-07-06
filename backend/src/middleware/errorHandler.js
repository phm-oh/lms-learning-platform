// File: backend/src/middleware/errorHandler.js
// Path: backend/src/middleware/errorHandler.js

// ========================================
// CUSTOM ERROR CLASS
// ========================================

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// ========================================
// ERROR HANDLERS
// ========================================

// Handle Sequelize validation errors
const handleSequelizeValidationError = (err) => {
  const errors = err.errors.map(error => ({
    field: error.path,
    message: error.message,
    value: error.value
  }));
  
  return new AppError(`Validation failed: ${errors.map(e => e.message).join(', ')}`, 400);
};

// Handle Sequelize unique constraint errors
const handleSequelizeUniqueConstraintError = (err) => {
  const field = err.errors[0].path;
  const value = err.errors[0].value;
  return new AppError(`${field} '${value}' already exists`, 409);
};

// Handle Sequelize foreign key constraint errors
const handleSequelizeForeignKeyConstraintError = (err) => {
  return new AppError('Referenced resource does not exist', 400);
};

// Handle JWT errors
const handleJWTError = () => {
  return new AppError('Invalid token. Please log in again', 401);
};

const handleJWTExpiredError = () => {
  return new AppError('Your token has expired. Please log in again', 401);
};

// Handle Multer errors (file upload)
const handleMulterError = (err) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return new AppError('File too large. Maximum size is 10MB', 400);
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return new AppError('Too many files. Maximum is 5 files', 400);
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return new AppError('Unexpected file field', 400);
  }
  return new AppError(`File upload error: ${err.message}`, 400);
};

// ========================================
// SEND ERROR RESPONSE
// ========================================

const sendErrorDev = (err, req, res) => {
  // API error
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code || 'ERROR',
      stack: err.stack,
      details: {
        name: err.name,
        statusCode: err.statusCode,
        isOperational: err.isOperational,
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method
      }
    });
  }
  
  // Non-API error (shouldn't happen in our API-only app)
  return res.status(err.statusCode).json({
    success: false,
    error: 'Something went wrong',
    message: err.message
  });
};

const sendErrorProd = (err, req, res) => {
  // API error
  if (req.originalUrl.startsWith('/api')) {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        success: false,
        error: err.message,
        code: err.code || 'ERROR',
        timestamp: new Date().toISOString()
      });
    }
    
    // Programming or other unknown error: don't leak error details
    console.error('💥 ERROR:', err);
    return res.status(500).json({
      success: false,
      error: 'Something went wrong on our end',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    });
  }
  
  // Non-API error
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
  }
  
  console.error('💥 ERROR:', err);
  return res.status(500).json({
    success: false,
    error: 'Something went wrong'
  });
};

// ========================================
// GLOBAL ERROR HANDLER
// ========================================

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Log error
  if (process.env.NODE_ENV === 'development') {
    console.error('💥 ERROR:', err);
  }

  // Handle specific error types
  if (err.name === 'SequelizeValidationError') {
    error = handleSequelizeValidationError(error);
  }
  
  if (err.name === 'SequelizeUniqueConstraintError') {
    error = handleSequelizeUniqueConstraintError(error);
  }
  
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    error = handleSequelizeForeignKeyConstraintError(error);
  }
  
  if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  }
  
  if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  }
  
  if (err.name === 'MulterError') {
    error = handleMulterError(err);
  }

  // Handle validation errors from Joi
  if (err.name === 'ValidationError' && err.details) {
    const message = err.details.map(detail => detail.message).join(', ');
    error = new AppError(`Validation error: ${message}`, 400);
  }

  // Send error response
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, req, res);
  } else {
    sendErrorProd(error, req, res);
  }
};

// ========================================
// NOT FOUND HANDLER
// ========================================

const notFound = (req, res, next) => {
  const message = `Route ${req.method} ${req.originalUrl} not found`;
  const error = new AppError(message, 404);
  next(error);
};

// ========================================
// ASYNC ERROR CATCHER
// ========================================

const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

module.exports = {
  AppError,
  errorHandler,
  notFound,
  catchAsync
};