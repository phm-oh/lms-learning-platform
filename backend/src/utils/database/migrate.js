// File: backend/src/utils/database/migrate.js
// Path: backend/src/utils/database/migrate.js

const { syncDatabase } = require('../../models');
const sequelize = require('../../config/database');

async function runMigration() {
  try {
    console.log('🚀 Starting database migration...');
    
    // Test connection first
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Drop all tables if they exist (use with caution!)
    if (process.env.NODE_ENV === 'development' && process.argv.includes('--force')) {
      console.log('⚠️  Dropping all existing tables...');
      await sequelize.drop();
    }
    
    // Create all tables
    console.log('📊 Creating database schema...');
    await syncDatabase(false); // Don't force drop
    
    console.log('✅ Database migration completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run: npm run db:seed');
    console.log('2. Start the server: npm run dev');
    
    return true; // ✅ แก้ตรงนี้ - return true เมื่อสำเร็จ
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    if (require.main === module) {
      process.exit(1);
    }
    return false;
  } finally {
    // ✅ แก้ตรงนี้ - ไม่ปิด connection ถ้าเรียกจาก setupComplete
    if (require.main === module) {
      await sequelize.close();
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };