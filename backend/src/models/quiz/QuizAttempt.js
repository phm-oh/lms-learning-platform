// File: backend/src/models/quiz/QuizAttempt.js
// Path: backend/src/models/quiz/QuizAttempt.js

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const QuizAttempt = sequelize.define('QuizAttempt', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  quizId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'quiz_id',
    references: {
      model: 'quizzes',
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
  attemptNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'attempt_number'
  },
  startedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'started_at'
  },
  submittedAt: {
    type: DataTypes.DATE,
    field: 'submitted_at'
  },
  timeSpent: {
    type: DataTypes.INTEGER, // seconds
    field: 'time_spent'
  },
  score: {
    type: DataTypes.DECIMAL(5, 2)
  },
  maxScore: {
    type: DataTypes.DECIMAL(5, 2),
    field: 'max_score'
  },
  percentage: {
    type: DataTypes.DECIMAL(5, 2)
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_completed'
  },
  autoSubmitted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'auto_submitted' // if time ran out
  },
  answers: {
    type: DataTypes.JSONB, // Student's answers
    defaultValue: {}
  }
}, {
  tableName: 'quiz_attempts',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['quiz_id', 'student_id', 'attempt_number']
    }
  ]
});

// Instance methods
QuizAttempt.prototype.submitQuiz = async function(timeSpent) {
  this.submittedAt = new Date();
  this.timeSpent = timeSpent;
  this.isCompleted = true;
  
  // Calculate score
  await this.calculateScore();
  
  return await this.save();
};

QuizAttempt.prototype.calculateScore = async function() {
  const QuizQuestion = require('./QuizQuestion');
  const QuizResponse = require('./QuizResponse');
  
  const questions = await QuizQuestion.findAll({
    where: { quizId: this.quizId }
  });
  
  const responses = await QuizResponse.findAll({
    where: { attemptId: this.id }
  });
  
  let totalPoints = 0;
  let earnedPoints = 0;
  
  for (const question of questions) {
    totalPoints += parseFloat(question.points);
    
    const response = responses.find(r => r.questionId === question.id);
    if (response && response.isCorrect) {
      earnedPoints += parseFloat(response.pointsEarned || question.points);
    }
  }
  
  this.score = earnedPoints;
  this.maxScore = totalPoints;
  this.percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
  
  return await this.save();
};

QuizAttempt.prototype.isPassed = async function() {
  const Quiz = require('./Quiz');
  const quiz = await Quiz.findByPk(this.quizId);
  return this.percentage >= quiz.passingScore;
};

// Class methods
QuizAttempt.getNextAttemptNumber = async function(quizId, studentId) {
  const lastAttempt = await this.findOne({
    where: { quizId, studentId },
    order: [['attempt_number', 'DESC']]
  });
  
  return lastAttempt ? lastAttempt.attemptNumber + 1 : 1;
};

module.exports = QuizAttempt;