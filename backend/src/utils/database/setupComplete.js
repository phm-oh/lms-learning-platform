// File: backend/src/utils/database/setupComplete.js
// Path: backend/src/utils/database/setupComplete.js

const { createDatabase } = require('./createDatabase');
const { runMigration } = require('./migrate');
const { seedDatabase } = require('./seed');

async function setupComplete() {
  try {
    console.log('🚀 Starting complete database setup...');
    console.log('');
    
    // Step 1: Create database
    console.log('📁 Step 1: Creating database...');
    const dbCreated = await createDatabase();
    if (!dbCreated) {
      throw new Error('Failed to create database');
    }
    console.log('');
    
    // Step 2: Run migrations
    console.log('🔧 Step 2: Running migrations...');
    const migrationSuccess = await runMigration();
    if (!migrationSuccess) {
      throw new Error('Failed to run migrations');
    }
    console.log('');
    
    // Step 3: Seed data
    console.log('🌱 Step 3: Seeding initial data...');
    await seedDatabase();
    console.log('');
    
    console.log('🎉 Complete database setup finished successfully!');
    console.log('');
    console.log('🔑 Login credentials:');
    console.log('Admin:    admin@lms-platform.com / admin123');
    console.log('Teacher:  teacher1@lms-platform.com / teacher123');
    console.log('Student:  student1@lms-platform.com / student123');
    console.log('');
    console.log('🚀 Ready to start development:');
    console.log('npm run dev');
    
  } catch (error) {
    console.error('❌ Complete setup failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupComplete();
}

module.exports = { setupComplete };