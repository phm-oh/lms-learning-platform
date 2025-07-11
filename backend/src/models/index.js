// File: backend/src/models/index.js
// Path: backend/src/models/index.js

const sequelize = require('../config/database');

// Import all existing models
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

// 🆕 Import News models with kebab-case filenames (avoiding case sensitivity)
const News = require('./news/news-model');               // ← kebab-case filename
const NewsCategory = require('./news/news-category');    // ← kebab-case filename

// ========================================
// DEFINE ASSOCIATIONS
// ========================================

// Existing User associations
User.hasMany(Course, { foreignKey: 'teacherId', as: 'teachingCourses' });
User.hasMany(Enrollment, { foreignKey: 'studentId', as: 'enrollments' });
User.hasMany(LessonProgress, { foreignKey: 'studentId', as: 'lessonProgress' });
User.hasMany(QuizAttempt, { foreignKey: 'studentId', as: 'quizAttempts' });
User.hasMany(Notification, { foreignKey: 'recipientId', as: 'receivedNotifications' });
User.hasMany(Notification, { foreignKey: 'senderId', as: 'sentNotifications' });
User.hasMany(UserActivity, { foreignKey: 'userId', as: 'activities' });
User.hasMany(LearningAnalytics, { foreignKey: 'userId', as: 'analytics' });

// 🆕 NEW: User-News associations
User.hasMany(News, { foreignKey: 'authorId', as: 'authoredNews' });

// Existing Course associations
Course.belongsTo(User, { foreignKey: 'teacherId', as: 'teacher' });
Course.belongsTo(CourseCategory, { foreignKey: 'categoryId', as: 'category' });
Course.hasMany(Enrollment, { foreignKey: 'courseId', as: 'enrollments' });
Course.hasMany(Lesson, { foreignKey: 'courseId', as: 'lessons' });
Course.hasMany(Quiz, { foreignKey: 'courseId', as: 'quizzes' });
Course.hasMany(UserActivity, { foreignKey: 'courseId', as: 'activities' });
Course.hasMany(LearningAnalytics, { foreignKey: 'courseId', as: 'analytics' });

// Existing Course Category associations
CourseCategory.hasMany(Course, { foreignKey: 'categoryId', as: 'courses' });

// Existing Enrollment associations
Enrollment.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
Enrollment.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });
Enrollment.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// Existing Lesson associations
Lesson.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
Lesson.hasMany(LessonProgress, { foreignKey: 'lessonId', as: 'progress' });
Lesson.hasMany(Quiz, { foreignKey: 'lessonId', as: 'quizzes' });

// Existing Lesson Progress associations
LessonProgress.belongsTo(Lesson, { foreignKey: 'lessonId', as: 'lesson' });
LessonProgress.belongsTo(User, { foreignKey: 'studentId', as: 'student' });

// Existing Quiz associations
Quiz.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
Quiz.belongsTo(Lesson, { foreignKey: 'lessonId', as: 'lesson' });
Quiz.hasMany(QuizQuestion, { foreignKey: 'quizId', as: 'questions' });
Quiz.hasMany(QuizAttempt, { foreignKey: 'quizId', as: 'attempts' });

// Existing Quiz Question associations
QuizQuestion.belongsTo(Quiz, { foreignKey: 'quizId', as: 'quiz' });
QuizQuestion.hasMany(QuizResponse, { foreignKey: 'questionId', as: 'responses' });

// Existing Quiz Attempt associations
QuizAttempt.belongsTo(Quiz, { foreignKey: 'quizId', as: 'quiz' });
QuizAttempt.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
QuizAttempt.hasMany(QuizResponse, { foreignKey: 'attemptId', as: 'responses' });

// Existing Quiz Response associations
QuizResponse.belongsTo(QuizAttempt, { foreignKey: 'attemptId', as: 'attempt' });
QuizResponse.belongsTo(QuizQuestion, { foreignKey: 'questionId', as: 'question' });

// Existing Notification associations
Notification.belongsTo(User, { foreignKey: 'recipientId', as: 'recipient' });
Notification.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

// Existing Analytics associations
UserActivity.belongsTo(User, { foreignKey: 'userId', as: 'user' });
UserActivity.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });
UserActivity.belongsTo(Lesson, { foreignKey: 'lessonId', as: 'lesson' });
UserActivity.belongsTo(Quiz, { foreignKey: 'quizId', as: 'quiz' });

LearningAnalytics.belongsTo(User, { foreignKey: 'userId', as: 'user' });
LearningAnalytics.belongsTo(Course, { foreignKey: 'courseId', as: 'course' });

// ========================================
// 🆕 NEW: NEWS ASSOCIATIONS
// ========================================

console.log('✅ Setting up News model associations...');

// News Category associations
NewsCategory.hasMany(News, { foreignKey: 'categoryId', as: 'news' });

// News associations
News.belongsTo(NewsCategory, { foreignKey: 'categoryId', as: 'category' });
News.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

console.log('✅ News associations set up successfully');

// ========================================
// SYNC DATABASE
// ========================================

const syncDatabase = async (force = false) => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    await sequelize.sync({ force });
    console.log('Database synchronized successfully.');
    
    // 🆕 Create default news categories if News models are available
    if (!force && NewsCategory && typeof NewsCategory.createDefaultCategories === 'function') {
      try {
        await NewsCategory.createDefaultCategories();
        console.log('✅ News default categories initialized');
      } catch (categoryError) {
        console.warn('⚠️  Could not create default news categories:', categoryError.message);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    return false;
  }
};

// ========================================
// EXPORT MODELS
// ========================================

const exportedModels = {
  sequelize,
  syncDatabase,
  
  // Existing Models
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
  LearningAnalytics,
  
  // 🆕 News Models
  News,
  NewsCategory
};

// Log model export summary
console.log(`📦 Models exported: ${Object.keys(exportedModels).filter(key => !['sequelize', 'syncDatabase'].includes(key)).join(', ')}`);

module.exports = exportedModels;