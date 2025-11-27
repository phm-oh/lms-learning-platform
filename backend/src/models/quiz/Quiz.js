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
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
    comment: 'เปิด/ปิดการทำแบบทดสอบ (แยกจาก isPublished - ใช้สำหรับปิดชั่วคราว)'
  },
  allowRetake: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'allow_retake',
    comment: 'อนุญาตให้ทำซ้ำได้หรือไม่ (ถ้า false แม้จะยังไม่ถึง maxAttempts ก็ทำซ้ำไม่ได้)'
  },
  availableFrom: {
    type: DataTypes.DATE,
    field: 'available_from'
  },
  availableUntil: {
    type: DataTypes.DATE,
    field: 'available_until'
  },
  orderIndex: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    field: 'order_index',
    comment: 'เรียงลำดับ Quiz: Course-level (lessonId=null) หรือ Lesson-level (lessonId!=null)'
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
  
  return this.isPublished && this.isActive && now >= fromDate && now <= untilDate;
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
  
  // Check if quiz is active
  if (!this.isActive) {
    return { canTake: false, reason: 'Quiz is currently disabled' };
  }
  
  const attempts = await this.getStudentAttempts(studentId);
  const completedAttempts = attempts.filter(a => a.isCompleted).length;
  
  // Check max attempts
  if (completedAttempts >= this.maxAttempts) {
    return { canTake: false, reason: 'Maximum attempts reached' };
  }
  
  // Check allowRetake - if false and has any completed attempt, cannot retake
  if (!this.allowRetake && completedAttempts > 0) {
    return { canTake: false, reason: 'Retake is not allowed for this quiz' };
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
    order: [
      ['lessonId', 'ASC NULLS LAST'], // Course-level (null) มาก่อน
      ['orderIndex', 'ASC'],           // เรียงตาม orderIndex
      ['created_at', 'ASC']
    ]
  });
};

Quiz.findAvailable = function(courseId) {
  const now = new Date();
  return this.findAll({
    where: {
      courseId,
      isPublished: true,
      isActive: true,
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