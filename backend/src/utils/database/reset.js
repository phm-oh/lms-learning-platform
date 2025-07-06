
// File: backend/src/utils/database/reset.js
// Path: backend/src/utils/database/reset.js

const { runMigration } = require('./migrate');
const { seedDatabase } = require('./seed');

async function resetDatabase() {
  try {
    console.log('🔄 Resetting database...');
    
    // Run migration with force
    process.argv.push('--force');
    await runMigration();
    
    // Seed with initial data
    await seedDatabase();
    
    console.log('✅ Database reset completed!');
    
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  }
}

// Run reset if called directly
if (require.main === module) {
  resetDatabase();
}

module.exports = { resetDatabase };