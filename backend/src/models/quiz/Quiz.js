// File: backend/src/models/quiz/Quiz.js
// Path: backend/src/models/quiz/Quiz.js

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Quiz = sequelize.define('Quiz', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
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
  lessonId: {
    type: DataTypes.INTEGER,
    field: 'lesson_id',
    references: {
      model: 'lessons',
      key: 'id'
    }
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  quizType: {
    type: DataTypes.ENUM('practice', 'assessment', 'final_exam'),
    defaultValue: 'practice',
    field: 'quiz_type'
  },
  timeLimit: {
    type: DataTypes.INTEGER, // minutes
    field: 'time_limit'
  },
  maxAttempts: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    field: 'max_attempts'
  },
  passingScore: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 70.00,
    field: 'passing_score'
  },
  randomizeQuestions: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'randomize_questions'
  },
  showCorrectAnswers: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'show_correct_answers'
  },
  showResultsImmediately: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'show_results_immediately'
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_published'
  },
  availableFrom: {
    type: DataTypes.DATE,
    field: 'available_from'
  },
  availableUntil: {
    type: DataTypes.DATE,
    field: 'available_until'
  }
}, {
  tableName: 'quizzes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Instance methods
Quiz.prototype.isAvailable = function() {
  const now = new Date();
  const fromDate = this.availableFrom || new Date(0);
  const untilDate = this.availableUntil || new Date('2099-12-31');
  
  return this.isPublished && now >= fromDate && now <= untilDate;
};

Quiz.prototype.getQuestionsCount = async function() {
  const QuizQuestion = require('./QuizQuestion');
  return await QuizQuestion.count({
    where: { quizId: this.id }
  });
};

Quiz.prototype.getTotalPoints = async function() {
  const QuizQuestion = require('./QuizQuestion');
  const result = await QuizQuestion.sum('points', {
    where: { quizId: this.id }
  });
  return result || 0;
};

Quiz.prototype.getStudentAttempts = async function(studentId) {
  const QuizAttempt = require('./QuizAttempt');
  return await QuizAttempt.findAll({
    where: {
      quizId: this.id,
      studentId: studentId
    },
    order: [['attempt_number', 'ASC']]
  });
};

Quiz.prototype.canStudentTakeQuiz = async function(studentId) {
  if (!this.isAvailable()) return { canTake: false, reason: 'Quiz not available' };
  
  const attempts = await this.getStudentAttempts(studentId);
  const completedAttempts = attempts.filter(a => a.isCompleted).length;
  
  if (completedAttempts >= this.maxAttempts) {
    return { canTake: false, reason: 'Maximum attempts reached' };
  }
  
  return { canTake: true };
};

// Class methods
Quiz.findByCourse = function(courseId, includeUnpublished = false) {
  const whereClause = { courseId };
  if (!includeUnpublished) {
    whereClause.isPublished = true;
  }
  
  return this.findAll({
    where: whereClause,
    order: [['created_at', 'DESC']]
  });
};

Quiz.findAvailable = function(courseId) {
  const now = new Date();
  return this.findAll({
    where: {
      courseId,
      isPublished: true,
      [sequelize.Op.or]: [
        { availableFrom: null },
        { availableFrom: { [sequelize.Op.lte]: now } }
      ],
      [sequelize.Op.or]: [
        { availableUntil: null },
        { availableUntil: { [sequelize.Op.gte]: now } }
      ]
    }
  });
};

module.exports = Quiz;