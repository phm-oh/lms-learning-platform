// File: backend/src/server.js
// Path: backend/src/server.js

const {app} = require('./app');
const http = require('http');
const socketIo = require('socket.io');
const sequelize = require('./config/database');
require('dotenv').config();

// ========================================
// SERVER SETUP
// ========================================

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

// Setup Socket.IO
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL || 'http://localhost:3000'
      : ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Store io instance in app for use in controllers
app.set('io', io);

// ========================================
// SOCKET.IO EVENTS
// ========================================

io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Join user to their personal room
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`👤 User ${userId} joined personal room`);
  });

  // Join course room
  socket.on('join-course-room', (courseId) => {
    socket.join(`course-${courseId}`);
    console.log(`📚 User joined course room: ${courseId}`);
  });

  // Handle quiz start
  socket.on('quiz-start', (data) => {
    const { userId, quizId, courseId } = data;
    socket.join(`quiz-${quizId}`);
    
    // Broadcast to course room
    io.to(`course-${courseId}`).emit('quiz-started', {
      userId,
      quizId,
      timestamp: new Date()
    });
  });

  // Handle quiz submission
  socket.on('quiz-submit', (data) => {
    const { userId, quizId, courseId, score } = data;
    
    // Broadcast to course room
    io.to(`course-${courseId}`).emit('quiz-completed', {
      userId,
      quizId,
      score,
      timestamp: new Date()
    });
  });

  // Handle real-time notifications
  socket.on('send-notification', (data) => {
    const { recipientId, notification } = data;
    
    // Send to specific user
    io.to(`user-${recipientId}`).emit('notification', {
      ...notification,
      timestamp: new Date()
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
  });
});

// ========================================
// DATABASE CONNECTION
// ========================================

const connectDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('📊 Database connected successfully');
    
    // Sync database (only in development)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      console.log('🔄 Database synchronized');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// ========================================
// START SERVER
// ========================================

const startServer = async () => {
  try {
    // Connect to database
    const dbConnected = await connectDatabase();
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Start server
    server.listen(PORT, () => {
      console.log('🚀 LMS Server Started!');
      console.log(`📍 Server running on: http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Database: ${process.env.DB_NAME} @ ${process.env.DB_HOST}:${process.env.DB_PORT}`);
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
      console.log('🌐 Socket.IO ready for real-time communications');
      console.log('✅ Server ready for requests!');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// ========================================
// GRACEFUL SHUTDOWN
// ========================================

const gracefulShutdown = (signal) => {
  console.log(`👋 ${signal} received`);
  console.log('🔄 Shutting down gracefully...');
  
  server.close(async () => {
    console.log('🔌 HTTP server closed');
    
    try {
      await sequelize.close();
      console.log('📊 Database connection closed');
    } catch (error) {
      console.error('❌ Error closing database:', error);
    }
    
    console.log('✅ Process terminated');
    process.exit(0);
  });
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('💥 Unhandled Promise Rejection:', err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err.message);
  console.error(err.stack);
  process.exit(1);
});

// ========================================
// START THE SERVER
// ========================================

startServer();

// Export for testing
module.exports = { app, server, io };