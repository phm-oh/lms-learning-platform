
// File: backend/src/utils/database/createDatabase.js
// Path: backend/src/utils/database/createDatabase.js

const { Client } = require('pg');
require('dotenv').config();

async function createDatabase() {
  // Connect to postgres database (default) to create our database
  const client = new Client({
    host: process.env.DB_HOST || '192.168.191.66',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'oasisuser',
    password: process.env.DB_PASSWORD || 'Oasis6566',
    database: 'postgres' // Connect to default postgres database
  });

  try {
    console.log('🔗 Connecting to PostgreSQL server...');
    await client.connect();
    console.log('✅ Connected successfully!');

    const databaseName = process.env.DB_NAME || 'lms_platform';
    
    // Check if database already exists
    const checkDbQuery = `
      SELECT 1 FROM pg_database WHERE datname = $1
    `;
    
    const result = await client.query(checkDbQuery, [databaseName]);
    
    if (result.rows.length > 0) {
      console.log(`⚠️  Database "${databaseName}" already exists.`);
      return true;
    }
    
    // Create database
    console.log(`🗃️  Creating database "${databaseName}"...`);
    await client.query(`CREATE DATABASE "${databaseName}"`);
    console.log(`✅ Database "${databaseName}" created successfully!`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to create database:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure PostgreSQL server is running and accessible.');
      console.error('💡 Check your connection details in .env file:');
      console.error(`   DB_HOST: ${process.env.DB_HOST || '192.168.191.66'}`);
      console.error(`   DB_PORT: ${process.env.DB_PORT || 5432}`);
      console.error(`   DB_USER: ${process.env.DB_USER || 'oasisuser'}`);
    }
    
    return false;
    
  } finally {
    await client.end();
  }
}

// Run if called directly
if (require.main === module) {
  createDatabase().then(success => {
    if (success) {
      console.log('');
      console.log('🎉 Database creation completed!');
      console.log('Next steps:');
      console.log('1. npm run db:migrate');
      console.log('2. npm run db:seed');
      process.exit(0);
    } else {
      process.exit(1);
    }
  });
}

module.exports = { createDatabase };