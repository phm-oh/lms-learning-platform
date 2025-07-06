// File: backend/src/models/course/CourseCategory.js
// Path: backend/src/models/course/CourseCategory.js

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const CourseCategory = sequelize.define('CourseCategory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  color: {
    type: DataTypes.STRING(7), // hex color
    validate: {
      is: /^#[0-9A-F]{6}$/i
    }
  },
  icon: {
    type: DataTypes.STRING(50)
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'course_categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = CourseCategory;