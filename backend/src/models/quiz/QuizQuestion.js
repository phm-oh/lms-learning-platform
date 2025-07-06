// File: backend/src/models/quiz/QuizQuestion.js
// Path: backend/src/models/quiz/QuizQuestion.js

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const QuizQuestion = sequelize.define('QuizQuestion', {
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
  questionText: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'question_text'
  },
  questionType: {
    type: DataTypes.ENUM('multiple_choice', 'true_false', 'short_answer', 'essay', 'fill_blank'),
    allowNull: false,
    field: 'question_type'
  },
  points: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 1.00
  },
  orderIndex: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'order_index'
  },
  explanation: {
    type: DataTypes.TEXT
  },
  imageUrl: {
    type: DataTypes.STRING(255),
    field: 'image_url'
  },
  options: {
    type: DataTypes.JSONB, // For multiple choice: [{"text": "A", "is_correct": true}]
    defaultValue: []
  },
  correctAnswer: {
    type: DataTypes.TEXT,
    field: 'correct_answer' // For short answer/fill blank
  }
}, {
  tableName: 'quiz_questions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// Instance methods
QuizQuestion.prototype.checkAnswer = function(studentAnswer) {
  switch (this.questionType) {
    case 'multiple_choice':
      const correctOptions = this.options.filter(opt => opt.is_correct);
      const selectedOptions = Array.isArray(studentAnswer) ? studentAnswer : [studentAnswer];
      return correctOptions.length === selectedOptions.length &&
             correctOptions.every(opt => selectedOptions.includes(opt.text));
             
    case 'true_false':
      return this.correctAnswer.toLowerCase() === studentAnswer.toLowerCase();
      
    case 'short_answer':
    case 'fill_blank':
      return this.correctAnswer.toLowerCase().trim() === studentAnswer.toLowerCase().trim();
      
    case 'essay':
      // Essay questions need manual grading
      return null;
      
    default:
      return false;
  }
};

QuizQuestion.prototype.getCorrectAnswers = function() {
  switch (this.questionType) {
    case 'multiple_choice':
      return this.options.filter(opt => opt.is_correct).map(opt => opt.text);
    case 'true_false':
    case 'short_answer':
    case 'fill_blank':
      return [this.correctAnswer];
    default:
      return [];
  }
};

module.exports = QuizQuestion;