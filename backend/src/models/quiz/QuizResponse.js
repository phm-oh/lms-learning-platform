// File: backend/src/models/quiz/QuizResponse.js
// Path: backend/src/models/quiz/QuizResponse.js

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const QuizResponse = sequelize.define('QuizResponse', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  attemptId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'attempt_id',
    references: {
      model: 'quiz_attempts',
      key: 'id'
    }
  },
  questionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'question_id',
    references: {
      model: 'quiz_questions',
      key: 'id'
    }
  },
  answerText: {
    type: DataTypes.TEXT,
    field: 'answer_text'
  },
  selectedOptions: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    defaultValue: [],
    field: 'selected_options' // For multiple choice
  },
  pointsEarned: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    field: 'points_earned'
  },
  isCorrect: {
    type: DataTypes.BOOLEAN,
    field: 'is_correct'
  },
  timeSpent: {
    type: DataTypes.INTEGER, // seconds on this question
    field: 'time_spent'
  }
}, {
  tableName: 'quiz_responses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// Instance methods
QuizResponse.prototype.grade = async function() {
  const QuizQuestion = require('./QuizQuestion');
  const question = await QuizQuestion.findByPk(this.questionId);
  
  if (!question) return false;
  
  let answer;
  if (question.questionType === 'multiple_choice') {
    answer = this.selectedOptions;
  } else {
    answer = this.answerText;
  }
  
  const isCorrect = question.checkAnswer(answer);
  
  if (isCorrect === null) {
    // Essay questions need manual grading
    this.isCorrect = null;
    this.pointsEarned = 0;
  } else if (isCorrect) {
    this.isCorrect = true;
    this.pointsEarned = question.points;
  } else {
    this.isCorrect = false;
    this.pointsEarned = 0;
  }
  
  return await this.save();
};

module.exports = QuizResponse;