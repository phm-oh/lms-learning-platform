
// File: backend/src/models/analytics/UserActivity.js
// Path: backend/src/models/analytics/UserActivity.js

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const UserActivity = sequelize.define('UserActivity', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  courseId: {
    type: DataTypes.INTEGER,
    field: 'course_id',
    references: {
      model: 'courses',
      key: 'id'
    }
  },
  lessonId: {
    type: DataTypes.INTEGER,
    field: 'lesson_id',
    references: {
      model: 'lessons',
      key: 'id'
    }
  },
  quizId: {
    type: DataTypes.INTEGER,
    field: 'quiz_id',
    references: {
      model: 'quizzes',
      key: 'id'
    }
  },
  activityType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'activity_type' // login, view_lesson, start_quiz, submit_quiz, etc.
  },
  details: {
    type: DataTypes.JSONB, // Additional activity details
    defaultValue: {}
  },
  sessionDuration: {
    type: DataTypes.INTEGER, // seconds
    field: 'session_duration'
  },
  ipAddress: {
    type: DataTypes.INET,
    field: 'ip_address'
  },
  userAgent: {
    type: DataTypes.TEXT,
    field: 'user_agent'
  }
}, {
  tableName: 'user_activities',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// Class methods
UserActivity.logActivity = async function(data) {
  return await this.create(data);
};

UserActivity.getActivityByUser = function(userId, limit = 100) {
  return this.findAll({
    where: { userId },
    order: [['created_at', 'DESC']],
    limit
  });
};

module.exports = UserActivity;