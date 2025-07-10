// File: backend/src/app.js
// Path: backend/src/app.js

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimit');

// Import routes
const apiRoutes = require('./routes');

// 🆕 Import upload utilities
const { ensureDirectoryExists, cleanupTempFiles } = require('./utils/fileHelper');
const { storageManager } = require('./config/storage');

// ========================================
// CREATE EXPRESS APP
// ========================================

const app = express();
const server = http.createServer(app);

// ========================================
// 🆕 INITIALIZE UPLOAD SYSTEM
// ========================================

const initializeUploadSystem = async () => {
  try {
    console.log('📁 Initializing upload system...');
    
    // Create upload directories
    const uploadDirectories = [
      './uploads',
      './uploads/profiles',
      './uploads/profiles/thumbnails',
      './uploads/courses', 
      './uploads/courses/thumbnails',
      './uploads/lessons',
      './uploads/lessons/videos',
      './uploads/lessons/documents',
      './uploads/lessons/attachments',
      './uploads/quizzes',
      './uploads/assignments',
      './uploads/temp',
      './uploads/misc'
    ];

    for (const dir of uploadDirectories) {
      await ensureDirectoryExists(dir);
    }

    // Initialize storage manager
    console.log('☁️ Initializing storage manager...');
    
    // Storage manager is already initialized in config/storage.js
    const storageConfig = storageManager.getConfig();
    console.log(`📦 Storage type: ${storageConfig.active?.type || 'local'}`);
    
    if (storageConfig.fallback) {
      console.log(`🔄 Fallback storage: ${storageConfig.fallback.type}`);
    }

    console.log('✅ Upload system initialized successfully');
    
  } catch (error) {
    console.error('❌ Upload system initialization failed:', error.message);
    console.error('📁 File uploads may not work properly');
  }
};

// ========================================
// SOCKET.IO SETUP
// ========================================

const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Handle user authentication for socket
  socket.on('authenticate', (data) => {
    if (data.userId) {
      socket.join(`user-${data.userId}`);
      if (data.role) {
        socket.join(`${data.role}-room`);
      }
      console.log(`✅ User ${data.userId} authenticated and joined rooms`);
    }
  });

  // 🆕 Handle file upload progress events
  socket.on('upload-progress', (data) => {
    // Broadcast upload progress to user
    socket.to(`user-${data.userId}`).emit('upload-progress-update', {
      uploadId: data.uploadId,
      progress: data.progress,
      fileName: data.fileName
    });
  });

  // 🆕 Handle file upload completion
  socket.on('upload-complete', (data) => {
    socket.to(`user-${data.userId}`).emit('upload-complete', {
      uploadId: data.uploadId,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      success: data.success
    });
  });

  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
  });
});

// Make io accessible to routes
app.set('io', io);

// ========================================
// SECURITY MIDDLEWARE
// ========================================

// Helmet for security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },  // 🆕 Allow cross-origin resources for file serving
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],      // 🆕 Allow images from various sources
      mediaSrc: ["'self'", "https:", "http:"],             // 🆕 Allow video/audio files
      connectSrc: ["'self'", "wss:", "ws:"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000'
    ];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-File-Name', 'X-File-Size']  // 🆕 Expose file-related headers
}));

// ========================================
// GENERAL MIDDLEWARE
// ========================================

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));  // 🆕 Increased limit for file metadata
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Global rate limiting
app.use(generalLimiter);

// ========================================
// 🆕 STATIC FILE SERVING
// ========================================

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: '1y',           // Cache for 1 year
  etag: true,             // Enable ETags
  lastModified: true,     // Enable Last-Modified headers
  setHeaders: (res, filePath, stat) => {
    // Set appropriate headers based on file type
    const ext = path.extname(filePath).toLowerCase();
    
    // Image files
    if (['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
      res.set('Content-Type', `image/${ext.slice(1)}`);
      res.set('Cache-Control', 'public, max-age=31536000'); // 1 year
    }
    
    // Video files
    else if (['.mp4', '.webm', '.ogg', '.mov'].includes(ext)) {
      res.set('Accept-Ranges', 'bytes'); // Enable range requests for video streaming
      res.set('Cache-Control', 'public, max-age=86400'); // 1 day
    }
    
    // Document files
    else if (['.pdf', '.doc', '.docx', '.ppt', '.pptx'].includes(ext)) {
      res.set('Cache-Control', 'public, max-age=3600'); // 1 hour
      res.set('Content-Disposition', 'inline'); // Display in browser if possible
    }
    
    // CSV files
    else if (ext === '.csv') {
      res.set('Content-Type', 'text/csv');
      res.set('Cache-Control', 'no-cache'); // Don't cache CSV files
    }
    
    // Default
    else {
      res.set('Cache-Control', 'public, max-age=3600'); // 1 hour
    }
    
    // Security headers for all files
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
  }
}));

// 🆕 File download endpoint with authentication
app.get('/api/files/download/:category/*', async (req, res, next) => {
  try {
    // This would require authentication middleware
    const { authenticate } = require('./middleware/auth');
    await authenticate(req, res, () => {});
    
    const category = req.params.category;
    const fileName = req.params[0];
    const filePath = path.join(__dirname, '../uploads', category, fileName);
    
    // Check if file exists
    const fs = require('fs').promises;
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    // Set download headers
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.sendFile(path.resolve(filePath));
    
  } catch (error) {
    next(error);
  }
});

// ========================================
// API ROUTES
// ========================================

// Mount API routes
app.use('/api', apiRoutes);

// ========================================
// ROOT ROUTE
// ========================================

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'LMS Backend Server is running! 🚀',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    features: {
      authentication: '✅ JWT + Role-based',
      fileUpload: '✅ Multi-type with processing',     // 🆕
      staticFiles: '✅ Optimized serving',             // 🆕
      emailSystem: '✅ Multi-template',
      realtime: '✅ Socket.IO',
      database: '✅ PostgreSQL + Sequelize',
      security: '✅ Helmet + CORS + Rate limiting',
      analytics: '✅ Learning analytics ready'
    },
    endpoints: {
      api: '/api',
      health: '/api/health',
      docs: '/api/docs',
      uploads: '/uploads',          // 🆕
      fileDownload: '/api/files/download'  // 🆕
    },
    uploadSystem: {                // 🆕
      status: '✅ Active',
      storageType: storageManager.getConfig().active?.type || 'local',
      maxFileSize: process.env.MAX_FILE_SIZE || '100MB',
      supportedTypes: ['images', 'videos', 'documents', 'csv'],
      endpoints: [
        'POST /api/upload/profile',
        'POST /api/upload/course/:id/thumbnail',
        'POST /api/upload/lesson/:id/video',
        'POST /api/upload/lesson/:id/attachments',
        'POST /api/upload/quiz/:id/import'
      ]
    }
  });
});

// ========================================
// 🆕 UPLOAD SYSTEM STATUS ENDPOINT
// ========================================

app.get('/uploads/status', async (req, res) => {
  try {
    const { getDirectorySize } = require('./utils/fileHelper');
    
    // Get storage usage for each category
    const categories = ['profiles', 'courses', 'lessons', 'quizzes', 'temp'];
    const usage = {};
    let totalSize = 0;
    let totalFiles = 0;
    
    for (const category of categories) {
      const categoryPath = path.join(__dirname, '../uploads', category);
      const stats = await getDirectorySize(categoryPath);
      usage[category] = stats;
      totalSize += stats.size;
      totalFiles += stats.fileCount;
    }
    
    res.status(200).json({
      success: true,
      data: {
        storageType: storageManager.getConfig().active?.type || 'local',
        totalSize: totalSize,
        totalFiles: totalFiles,
        formattedTotalSize: require('./utils/fileHelper').formatFileSize(totalSize),
        categories: usage,
        limits: {
          maxFileSize: process.env.MAX_FILE_SIZE || '100MB',
          maxTotalSize: process.env.MAX_TOTAL_SIZE || '1GB'
        },
        health: 'healthy',
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get upload system status',
      error: error.message
    });
  }
});

// ========================================
// ERROR HANDLING
// ========================================

// Handle 404 for all other routes
app.all('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found on this server`,
    timestamp: new Date().toISOString(),
    method: req.method,
    availableRoutes: {
      api: '/api',
      uploads: '/uploads',
      health: '/api/health',
      documentation: '/api/docs'
    }
  });
});

// Global error handling middleware
app.use(errorHandler);

// ========================================
// 🆕 SCHEDULED CLEANUP TASKS
// ========================================

const setupCleanupTasks = () => {
  const cron = require('node-cron');
  
  // Clean up temporary files daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    try {
      console.log('🧹 Starting scheduled cleanup of temporary files...');
      const result = await cleanupTempFiles('./uploads/temp', 24); // 24 hours
      console.log(`✅ Cleanup completed: ${result.deletedCount || 0} files removed`);
    } catch (error) {
      console.error('❌ Cleanup task failed:', error.message);
    }
  });
  
  console.log('⏰ Cleanup tasks scheduled');
};

// ========================================
// STARTUP INITIALIZATION
// ========================================

const initializeApp = async () => {
  try {
    // Initialize upload system
    await initializeUploadSystem();
    
    // Setup cleanup tasks
    if (process.env.ENABLE_CLEANUP_TASKS !== 'false') {
      setupCleanupTasks();
    }
    
    console.log('🚀 Application initialized successfully');
    
  } catch (error) {
    console.error('❌ Application initialization failed:', error.message);
    process.exit(1);
  }
};

// Initialize when app starts
initializeApp();

// ========================================
// GRACEFUL SHUTDOWN
// ========================================

const gracefulShutdown = async (signal) => {
  console.log(`\n📴 Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Close HTTP server
    server.close(() => {
      console.log('🌐 HTTP server closed');
    });
    
    // Close Socket.IO server
    io.close(() => {
      console.log('🔌 Socket.IO server closed');
    });
    
    // Close database connections
    const sequelize = require('./config/database');
    await sequelize.close();
    console.log('🗄️ Database connections closed');
    
    // 🆕 Cleanup any pending file operations
    console.log('📁 Cleaning up file operations...');
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error during shutdown:', error.message);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled Rejection:', error);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// ========================================
// EXPORT
// ========================================

module.exports = { app, server, io };

// ========================================
// DEVELOPMENT HELPERS
// ========================================

if (process.env.NODE_ENV === 'development') {
  // Log available routes in development
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      const methods = Object.keys(middleware.route.methods).join(', ').toUpperCase();
      console.log(`📍 ${methods} ${middleware.route.path}`);
    }
  });
  
  // 🆕 Log upload system info in development
  console.log('\n📁 Upload System Info:');
  console.log(`   Storage Type: ${storageManager.getConfig().active?.type || 'local'}`);
  console.log(`   Upload Path: ./uploads`);
  console.log(`   Static Serving: /uploads`);
  console.log(`   Max File Size: ${process.env.MAX_FILE_SIZE || '100MB'}`);
  console.log(`   Supported Types: images, videos, documents, csv`);
}