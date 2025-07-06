
// File: backend/src/models/analytics/LearningAnalytics.js
// Path: backend/src/models/analytics/LearningAnalytics.js

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const LearningAnalytics = sequelize.define('LearningAnalytics', {
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
    allowNull: false,
    field: 'course_id',
    references: {
      model: 'courses',
      key: 'id'
    }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  
  // Engagement metrics
  timeSpent: {
    type: DataTypes.INTEGER,
    defaultValue: 0, // seconds
    field: 'time_spent'
  },
  lessonsViewed: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'lessons_viewed'
  },
  quizzesTaken: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'quizzes_taken'
  },
  loginCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'login_count'
  },
  
  // Performance metrics
  avgQuizScore: {
    type: DataTypes.DECIMAL(5, 2),
    field: 'avg_quiz_score'
  },
  completionRate: {
    type: DataTypes.DECIMAL(5, 2),
    field: 'completion_rate'
  },
  
  // Behavioral patterns
  preferredStudyTime: {
    type: DataTypes.INTEGER, // hour of day (0-23)
    field: 'preferred_study_time'
  },
  studyStreak: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'study_streak'
  },
  helpRequests: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'help_requests'
  },
  
  // ML features
  featureVector: {
    type: DataTypes.JSONB, // Computed features for ML
    defaultValue: {},
    field: 'feature_vector'
  }
}, {
  tableName: 'learning_analytics',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'course_id', 'date']
    }
  ]
});

// Class methods
LearningAnalytics.updateDailyStats = async function(userId, courseId, date, updates) {
  const [analytics] = await this.findOrCreate({
    where: { userId, courseId, date },
    defaults: { userId, courseId, date, ...updates }
  });
  
  if (updates) {
    await analytics.update(updates);
  }
  
  return analytics;
};

module.exports = LearningAnalytics;