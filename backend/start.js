// File: backend/start.js
// Path: backend/start.js

// Simple startup script for testing
const sequelize = require('./src/config/database');
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Start server
const startServer = async () => {
  try {
    console.log('🚀 Starting LMS Server...');
    
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.log('⚠️  Database connection failed, but server will start anyway');
    }
    
    // Start Express server
    app.listen(PORT, () => {
      console.log('');
      console.log('🎉 LMS Server Started Successfully!');
      console.log(`📍 Server running on: http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('');
      console.log('📋 Available endpoints:');
      console.log(`   Health: GET http://localhost:${PORT}/health`);
      console.log(`   API Docs: GET http://localhost:${PORT}/api/docs`);
      console.log(`   Auth Docs: GET http://localhost:${PORT}/api/auth/docs`);
      console.log('');
      console.log('🔐 Auth endpoints:');
      console.log(`   Register: POST http://localhost:${PORT}/api/auth/register`);
      console.log(`   Login: POST http://localhost:${PORT}/api/auth/login`);
      console.log(`   Profile: GET http://localhost:${PORT}/api/auth/profile`);
      console.log('');
      console.log('✅ Ready to accept requests!');
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down gracefully...');
  try {
    await sequelize.close();
    console.log('📊 Database connection closed');
  } catch (error) {
    console.error('❌ Error closing database:', error.message);
  }
  process.exit(0);
});

// Start the server
startServer();