// File: backend/src/models/index.js
// Path: backend/src/models/index.js

const sequelize = require('../config/database');

// Import all models
const User = require('./user/User');
const Course = require('./course/Course');
const CourseCategory = require('./course/CourseCategory');
const Enrollment = require('./course/Enrollment');
const Lesson = require('./lesson/Lesson');
const LessonProgress = require('./lesson/LessonProgress');
const Quiz = require('./quiz/Quiz');
const QuizQuestion = require('./quiz/QuizQuestion');
const QuizAttempt = require('./quiz/QuizAttempt');
const QuizResponse = require('./quiz/QuizResponse');
const Notification = require('./notification/Notification');
const UserActivity = require('./analytics/UserActivity');
const LearningAnalytics = require('./analytics/LearningAnalytics');

// ========================================
// DEFINE ASSOCIATIONS
// ========================================

// User associations
User.hasMany(Course, { foreignKey: 'teacherId', as: 'teachingCourses' });
User.hasMany(Enrollment, { foreignKey: 'studentId', as: 'enrollments' });
User.hasMany(LessonProgress, { foreignKey: 'studentId', as: 'lessonProgress' });
User.hasMany(QuizAttempt, { foreignKey: 'studentId', as: 'quizAttempts' });
User.hasMany(Notification, { foreignKey: 'recipientId', as: 'receivedNotifications' });
User.hasMany(Notification, { foreignKey: 'senderId', as: 'sentNotifications' });
User.hasMany(UserActivity, { foreignKey: 'userId', as: 'activities' });
User.hasMany(LearningAnalytics, { foreignKey: 'userId', as: 'analytics' });

// Course associations
Course.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });
Course.belongsTo(CourseCategory, { foreignKey: 'categoryId', as: 'category' });
Course.hasMany(Enrollment, { foreignKey: 'courseId', as: 'enrollments' });
Course.hasMany(Lesson, { foreignKey: 'courseId', as: 'lessons' });
Course.hasMany(Quiz, { foreignKey: 'courseId', as: 'quizzes' });
Course.hasMany(UserActivity, { foreignKey: 'courseId', as: 'activities' });
Course.hasMany(LearningAnalytics, { foreignKey: 'courseId', as: 'analytics' });

// Course Category associations
CourseCategory.hasMany(Course, { foreignKey: 'categoryId', as: 'courses' });

// Enrollment associations
Enrollment.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
Enrollment.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });
Enrollment.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// Lesson associations
Lesson.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
Lesson.hasMany(LessonProgress, { foreignKey: 'lessonId', as: 'progress' });
Lesson.hasMany(Quiz, { foreignKey: 'lessonId', as: 'quizzes' });

// Lesson Progress associations
LessonProgress.belongsTo(Lesson, { foreignKey: 'lessonId', as: 'lesson' });
LessonProgress.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

// Quiz associations
Quiz.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
Quiz.belongsTo(Lesson, { foreignKey: 'lessonId', as: 'lesson' });
Quiz.hasMany(QuizQuestion, { foreignKey: 'quizId', as: 'questions' });
Quiz.hasMany(QuizAttempt, { foreignKey: 'quizId', as: 'attempts' });

// Quiz Question associations
QuizQuestion.belongsTo(Quiz, { foreignKey: 'quizId', as: 'quiz' });
QuizQuestion.hasMany(QuizResponse, { foreignKey: 'questionId', as: 'responses' });

// Quiz Attempt associations
QuizAttempt.belongsTo(Quiz, { foreignKey: 'quizId', as: 'quiz' });
QuizAttempt.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
QuizAttempt.hasMany(QuizResponse, { foreignKey: 'attemptId', as: 'responses' });

// Quiz Response associations
QuizResponse.belongsTo(QuizAttempt, { foreignKey: 'attemptId', as: 'attempt' });
QuizResponse.belongsTo(QuizQuestion, { foreignKey: 'questionId', as: 'question' });

// Notification associations
Notification.belongsTo(User, { foreignKey: 'recipientId', as: 'recipient' });
Notification.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

// Analytics associations
UserActivity.belongsTo(User, { foreignKey: 'userId', as: 'user' });
UserActivity.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
UserActivity.belongsTo(Lesson, { foreignKey: 'lessonId', as: 'lesson' });
UserActivity.belongsTo(Quiz, { foreignKey: 'quizId', as: 'quiz' });

LearningAnalytics.belongsTo(User, { foreignKey: 'userId', as: 'user' });
LearningAnalytics.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// ========================================
// SYNC DATABASE
// ========================================

const syncDatabase = async (force = false) => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    await sequelize.sync({ force });
    console.log('Database synchronized successfully.');
    
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
  }
};

// Export models and database connection
module.exports = {
  sequelize,
  syncDatabase,
  
  // Models
  User,
  Course,
  CourseCategory,
  Enrollment,
  Lesson,
  LessonProgress,
  Quiz,
  QuizQuestion,
  QuizAttempt,
  QuizResponse,
  Notification,
  UserActivity,
  LearningAnalytics
};