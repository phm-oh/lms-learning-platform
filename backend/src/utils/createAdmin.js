// File: createAdmin.js
// Path: backend/src/utils/createAdmin.js
// Script to create admin account manually

const bcrypt = require('bcryptjs');
const { User } = require('../models');
const sequelize = require('../config/database');

async function createAdmin() {
  try {
    console.log('🔧 Creating admin account...');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ where: { email: 'admin@lms-platform.com' } });
    if (existingAdmin) {
      console.log('⚠️  Admin account already exists!');
      console.log(`Email: ${existingAdmin.email}`);
      console.log(`Status: ${existingAdmin.status}`);
      console.log(`Role: ${existingAdmin.role}`);
      
      // Hash new password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const hashedPassword = await bcrypt.hash('admin123', saltRounds);
      
      // Update password and status using raw query to avoid double hashing
      // (beforeUpdate hook will hash again if we use update())
      await sequelize.query(
        `UPDATE users SET password = :password, status = :status, email_verified = :emailVerified, updated_at = NOW() WHERE id = :id`,
        {
          replacements: {
            password: hashedPassword,
            status: 'active',
            emailVerified: true,
            id: existingAdmin.id
          }
        }
      );
      
      console.log('✅ Updated admin password and status to active');
      console.log('');
      console.log('🔑 Login credentials:');
      console.log('Email: admin@lms-platform.com');
      console.log('Password: admin123');
      console.log('');
      
      return existingAdmin;
    }
    
    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash('admin123', saltRounds);
    
    // Create admin user
    const admin = await User.create({
      email: 'admin@lms-platform.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'admin',
      status: 'active',
      emailVerified: true
    });
    
    console.log('✅ Admin account created successfully!');
    console.log('');
    console.log('🔑 Login credentials:');
    console.log('Email: admin@lms-platform.com');
    console.log('Password: admin123');
    console.log('');
    
    return admin;
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  sequelize.authenticate()
    .then(() => {
      console.log('✅ Database connection established');
      return createAdmin();
    })
    .then(() => {
      console.log('✅ Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error:', error.message);
      process.exit(1);
    });
}

module.exports = { createAdmin };

