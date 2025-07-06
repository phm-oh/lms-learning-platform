// File: backend/src/models/lesson/LessonProgress.js
// Path: backend/src/models/lesson/LessonProgress.js

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const LessonProgress = sequelize.define('LessonProgress', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  lessonId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'lesson_id',
    references: {
      model: 'lessons',
      key: 'id'
    }
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'student_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'not_started' // not_started, in_progress, completed
  },
  timeSpent: {
    type: DataTypes.INTEGER,
    defaultValue: 0, // seconds
    field: 'time_spent'
  },
  completionPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    field: 'completion_percentage'
  },
  lastAccessed: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'last_accessed'
  },
  completedAt: {
    type: DataTypes.DATE,
    field: 'completed_at'
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'lesson_progress',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['lesson_id', 'student_id']
    }
  ]
});

// Instance methods
LessonProgress.prototype.markAsCompleted = async function() {
  this.status = 'completed';
  this.completionPercentage = 100;
  this.completedAt = new Date();
  return await this.save();
};

LessonProgress.prototype.updateProgress = async function(timeSpent, percentage) {
  this.timeSpent += timeSpent || 0;
  this.completionPercentage = Math.max(this.completionPercentage, percentage || 0);
  this.lastAccessed = new Date();
  
  if (this.completionPercentage >= 100 && this.status !== 'completed') {
    await this.markAsCompleted();
  } else if (this.status === 'not_started') {
    this.status = 'in_progress';
  }
  
  return await this.save();
};

module.exports = LessonProgress;