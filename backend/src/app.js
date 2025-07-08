// File: backend/src/app.js
// Path: backend/src/app.js

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

// Import routes
const routes = require('./routes');

// Import middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimit');

// Create Express app
const app = express();

// ========================================
// BASIC MIDDLEWARE
// ========================================

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'http://localhost:3000'
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
app.use(generalLimiter);

// ========================================
// HEALTH CHECK ROUTES
// ========================================

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'LMS Platform API',
    version: '1.0.0',
    status: 'running',
    documentation: '/api/docs',
    health: '/health'
  });
});

// ========================================
// API ROUTES
// ========================================

// Mount all API routes
app.use('/api', routes);

// API documentation (direct access)
app.get('/docs', (req, res) => {
  res.redirect('/api/docs');
});

// ========================================
// ERROR HANDLING MIDDLEWARE
// ========================================

// Handle 404 errors
app.use(notFound);

// Global error handler
app.use(errorHandler);

// ========================================
// GRACEFUL SHUTDOWN
// ========================================

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received');
  console.log('🔄 Shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});

module.exports = app;

// ========================================
// START SERVER (ถ้ารันไฟล์นี้โดยตรง)
// ========================================

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  
  const server = app.listen(PORT, () => {
    console.log('🚀 LMS Server Started!');
    console.log(`📍 Server running on: http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('');
    console.log('📋 Available endpoints:');
    console.log(`   Health: http://localhost:${PORT}/health`);
    console.log(`   API Docs: http://localhost:${PORT}/api/docs`);
    console.log(`   Auth: http://localhost:${PORT}/api/auth/*`);
    console.log('');
    console.log('🔐 Auth endpoints:');
    console.log(`   Register: POST http://localhost:${PORT}/api/auth/register`);
    console.log(`   Login: POST http://localhost:${PORT}/api/auth/login`);
    console.log(`   Profile: GET http://localhost:${PORT}/api/auth/profile`);
    console.log('');
    console.log('✅ Server ready for requests!');
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err, promise) => {
    console.error('💥 Unhandled Promise Rejection:', err.message);
    server.close(() => {
      process.exit(1);
    });
  });
}