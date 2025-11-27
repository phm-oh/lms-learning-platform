// File: backend/src/models/user/User.js
// Path: backend/src/models/user/User.js

const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [6, 255]
    }
  },
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'first_name'
  },
  lastName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'last_name'
  },
  role: {
    type: DataTypes.ENUM('admin', 'teacher', 'student'),
    allowNull: false,
    defaultValue: 'student'
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'inactive', 'suspended'),
    allowNull: false,
    defaultValue: 'pending'
  },
  profileImage: {
    type: DataTypes.STRING(255),
    field: 'profile_image'
  },
  phone: {
    type: DataTypes.STRING(20)
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    field: 'date_of_birth'
  },
  address: {
    type: DataTypes.TEXT
  },
  bio: {
    type: DataTypes.TEXT
  },
  lastLogin: {
    type: DataTypes.DATE,
    field: 'last_login'
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'email_verified'
  },
  emailVerificationToken: {
    type: DataTypes.STRING(255),
    field: 'email_verification_token'
  },
  passwordResetToken: {
    type: DataTypes.STRING(255),
    field: 'password_reset_token'
  },
  passwordResetExpires: {
    type: DataTypes.DATE,
    field: 'password_reset_expires'
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        // Only hash if password is not already hashed (check if it starts with $2a$ or $2b$)
        if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
          user.password = await bcrypt.hash(user.password, 10);
          console.log('Password hashed in beforeCreate hook');
        } else {
          console.log('Password already hashed, skipping hash');
        }
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 10);
      }
    }
  },

  instanceMethods: {
    toJSON: function() {
      const values = Object.assign({}, this.get());
      delete values.password;
      delete values.passwordResetToken;
      delete values.emailVerificationToken;
      return values;
    }
  }
});

// Instance methods
User.prototype.validatePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

User.prototype.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};

User.prototype.isAdmin = function() {
  return this.role === 'admin';
};

User.prototype.isTeacher = function() {
  return this.role === 'teacher';
};

User.prototype.isStudent = function() {
  return this.role === 'student';
};

User.prototype.isActive = function() {
  return this.status === 'active';
};

// Class methods
User.findByEmail = function(email) {
  return this.findOne({ where: { email } });
};

User.findActiveUsers = function() {
  return this.findAll({ where: { status: 'active' } });
};

User.findByRole = function(role) {
  return this.findAll({ where: { role } });
};

// Custom toJSON to exclude sensitive fields
User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  delete values.passwordResetToken;
  delete values.emailVerificationToken;
  return values;
};

module.exports = User;