// File: backend/src/server.js  
// Path: backend/src/server.js

const app = require('./app');
const { syncDatabase } = require('./models');
const { createServer } = require('http');
const { Server: SocketIO } = require('socket.io');

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO for real-time features
const io = new SocketIO(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);
  
  // Join room for quiz sessions
  socket.on('join-quiz', (quizId) => {
    socket.join(`quiz-${quizId}`);
    console.log(`📝 User ${socket.id} joined quiz ${quizId}`);
  });
  
  // Handle quiz timer events
  socket.on('quiz-timer-start', (data) => {
    socket.to(`quiz-${data.quizId}`).emit('timer-started', data);
  });
  
  socket.on('quiz-timer-update', (data) => {
    socket.to(`quiz-${data.quizId}`).emit('timer-update', data);
  });
  
  socket.on('quiz-submitted', (data) => {
    socket.to(`quiz-${data.quizId}`).emit('quiz-submitted', data);
  });
  
  // Handle notifications
  socket.on('join-notifications', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`🔔 User ${socket.id} joined notifications for user ${userId}`);
  });
  
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// Make io available to other modules
app.set('io', io);

// Port configuration
const PORT = process.env.PORT || 5000;

// Database connection and server startup
async function startServer() {
  try {
    console.log('🚀 Starting LMS Platform Server...');
    console.log('');
    
    // Test database connection
    console.log('📊 Connecting to database...');
    const dbConnected = await syncDatabase(false);
    
    if (dbConnected) {
      console.log('✅ Database connected successfully');
    } else {
      throw new Error('Failed to connect to database');
    }
    
    console.log('');
    
    // Start HTTP server
    server.listen(PORT, () => {
      console.log('🎉 Server started successfully!');
      console.log('');
      console.log(`📍 Server running on: http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Database: ${process.env.DB_NAME || 'lms_platform'}`);
      console.log(`🔌 Socket.IO: Enabled`);
      console.log('');
      console.log('📋 Available endpoints:');
      console.log(`   Health Check: http://localhost:${PORT}/health`);
      console.log(`   API Base: http://localhost:${PORT}/api`);
      console.log(`   Documentation: http://localhost:${PORT}/api/docs`);
      console.log('');
      console.log('🔑 Ready to accept requests!');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('1. Check database connection in .env file');
    console.error('2. Ensure PostgreSQL server is running');
    console.error('3. Run database migrations: npm run db:migrate');
    console.error('4. Check if port is already in use');
    console.error('');
    process.exit(1);
  }
}

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    console.error('💡 Try a different port or stop the other process');
  } else {
    console.error('❌ Server error:', error);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = { server, io };