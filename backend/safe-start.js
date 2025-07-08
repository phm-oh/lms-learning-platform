// File: backend/safe-start.js
// Path: backend/safe-start.js

const fs = require('fs');
const path = require('path');

// ========================================
// SYSTEM CHECK FUNCTIONS
// ========================================

const checkFileExists = (filePath) => {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
};

const checkRequiredFiles = () => {
  const requiredFiles = [
    'src/app.js',
    'src/routes/index.js',
    'src/routes/auth.js',
    'src/controllers/auth.js',
    'src/middleware/auth.js',
    'src/middleware/errorHandler.js',
    'src/middleware/rateLimit.js',
    'src/middleware/validation.js',
    'src/config/database.js'
  ];

  const optionalFiles = [
    'src/routes/admin.js',
    'src/routes/analytics.js',
    'src/controllers/admin.js',
    'src/controllers/analytics.js',
    'src/controllers/course.js'
  ];

  console.log('🔍 Checking required files...');
  
  let allRequired = true;
  requiredFiles.forEach(file => {
    const exists = checkFileExists(file);
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${file}`);
    if (!exists) allRequired = false;
  });

  console.log('\n📋 Checking optional files...');
  optionalFiles.forEach(file => {
    const exists = checkFileExists(file);
    const status = exists ? '✅' : '⚠️ ';
    console.log(`${status} ${file} ${!exists ? '(will use mock)' : ''}`);
  });

  return allRequired;
};

const testDatabase = async () => {
  try {
    console.log('🔌 Testing database connection...');
    const sequelize = require('./src/config/database');
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    return true;
  } catch (error) {
    console.log('⚠️  Database connection failed:', error.message);
    console.log('   Server will start anyway with limited functionality');
    return false;
  }
};

const checkEnvironment = () => {
  console.log('🌍 Checking environment variables...');
  
  const requiredEnvVars = ['JWT_SECRET'];
  const optionalEnvVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  
  let allRequired = true;
  
  requiredEnvVars.forEach(envVar => {
    const exists = !!process.env[envVar];
    const status = exists ? '✅' : '❌';
    console.log(`${status} ${envVar}`);
    if (!exists) allRequired = false;
  });

  optionalEnvVars.forEach(envVar => {
    const exists = !!process.env[envVar];
    const status = exists ? '✅' : '⚠️ ';
    console.log(`${status} ${envVar} ${!exists ? '(using default)' : ''}`);
  });

  return allRequired;
};

const checkModels = () => {
  console.log('📊 Checking database models...');
  
  try {
    const models = require('./src/models');
    const modelNames = Object.keys(models).filter(key => key !== 'sequelize' && key !== 'Sequelize');
    
    if (modelNames.length > 0) {
      console.log('✅ Models available:', modelNames.join(', '));
      return true;
    } else {
      console.log('⚠️  No models found, will use mock data');
      return false;
    }
  } catch (error) {
    console.log('⚠️  Models not available:', error.message);
    console.log('   Will use mock data instead');
    return false;
  }
};

// ========================================
// MAIN STARTUP FUNCTION
// ========================================

const startServer = async () => {
  console.log('🚀 Starting LMS Platform...\n');

  // Check all requirements
  const filesOk = checkRequiredFiles();
  console.log('');
  
  const envOk = checkEnvironment();
  console.log('');
  
  const dbOk = await testDatabase();
  console.log('');
  
  const modelsOk = checkModels();
  console.log('');

  // Determine startup mode
  if (!filesOk) {
    console.error('❌ Critical files missing. Cannot start server.');
    console.error('   Please ensure all required files are present.');
    process.exit(1);
  }

  if (!envOk) {
    console.error('❌ Critical environment variables missing.');
    console.error('   Please check your .env file.');
    process.exit(1);
  }

  // Determine feature availability
  const features = {
    authentication: true,
    database: dbOk,
    models: modelsOk,
    adminPanel: checkFileExists('src/controllers/admin.js'),
    analytics: checkFileExists('src/controllers/analytics.js'),
    courses: checkFileExists('src/controllers/course.js')
  };

  console.log('🎯 Feature availability:');
  Object.entries(features).forEach(([feature, available]) => {
    const status = available ? '✅' : '⚠️ ';
    const note = available ? '' : ' (mock/limited)';
    console.log(`${status} ${feature}${note}`);
  });
  console.log('');

  // Start the server
  try {
    console.log('🔥 Starting Express server...');
    const app = require('./src/app');
    const PORT = process.env.PORT || 5000;

    const server = app.listen(PORT, () => {
      console.log('');
      console.log('🎉 LMS Server Started Successfully!');
      console.log(`📍 Server running on: http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('');
      console.log('📋 Available endpoints:');
      console.log(`   Health: GET http://localhost:${PORT}/health`);
      console.log(`   API Docs: GET http://localhost:${PORT}/api/docs`);
      console.log(`   Auth: POST http://localhost:${PORT}/api/auth/*`);
      
      if (features.adminPanel) {
        console.log(`   Admin: GET http://localhost:${PORT}/api/admin/*`);
      }
      
      if (features.analytics) {
        console.log(`   Analytics: GET http://localhost:${PORT}/api/analytics/*`);
      }
      
      console.log('');
      console.log('🔐 Test auth endpoints:');
      console.log(`   Register: POST http://localhost:${PORT}/api/auth/register`);
      console.log(`   Login: POST http://localhost:${PORT}/api/auth/login`);
      console.log('');
      
      if (!dbOk) {
        console.log('⚠️  Note: Database not connected, some features use mock data');
      }
      
      if (!modelsOk) {
        console.log('⚠️  Note: Models not available, using mock data for database operations');
      }
      
      console.log('✅ Server ready for requests!');
      console.log('');
    });

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n👋 Shutting down gracefully...');
      
      server.close(async () => {
        if (dbOk) {
          try {
            const sequelize = require('./src/config/database');
            await sequelize.close();
            console.log('📊 Database connection closed');
          } catch (error) {
            console.log('⚠️  Error closing database:', error.message);
          }
        }
        
        console.log('✅ Server shut down complete');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

// ========================================
// ERROR HANDLING
// ========================================

process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (err, promise) => {
  console.error('💥 Unhandled Promise Rejection:', err.message);
  console.error(err.stack);
  process.exit(1);
});

// ========================================
// START THE SERVER
// ========================================

if (require.main === module) {
  // Load environment variables
  require('dotenv').config();
  
  // Start the server
  startServer();
}

module.exports = { startServer, checkRequiredFiles, testDatabase };