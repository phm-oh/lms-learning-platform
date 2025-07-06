// File: backend/src/models/course/Course.js
// Path: backend/src/models/course/Course.js

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  shortDescription: {
    type: DataTypes.STRING(500),
    field: 'short_description'
  },
  thumbnail: {
    type: DataTypes.STRING(255)
  },
  categoryId: {
    type: DataTypes.INTEGER,
    field: 'category_id',
    references: {
      model: 'course_categories',
      key: 'id'
    }
  },
  teacherId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'teacher_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  courseCode: {
    type: DataTypes.STRING(20),
    unique: true,
    field: 'course_code'
  },
  difficultyLevel: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1,
      max: 5
    },
    field: 'difficulty_level'
  },
  estimatedDuration: {
    type: DataTypes.INTEGER,
    field: 'estimated_duration' // hours
  },
  maxStudents: {
    type: DataTypes.INTEGER,
    field: 'max_students'
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_published'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: []
  },
  prerequisites: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: []
  },
  learningObjectives: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: [],
    field: 'learning_objectives'
  }
}, {
  tableName: 'courses',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  
  hooks: {
    beforeCreate: async (course) => {
      if (!course.courseCode) {
        const count = await Course.count();
        course.courseCode = `COURSE${String(count + 1).padStart(4, '0')}`;
      }
    }
  }
});

// Instance methods
Course.prototype.getEnrollmentCount = async function() {
  const Enrollment = require('./Enrollment');
  return await Enrollment.count({
    where: { 
      courseId: this.id,
      status: 'approved' 
    }
  });
};

Course.prototype.hasSpaceForNewStudents = async function() {
  if (!this.maxStudents) return true;
  const enrollmentCount = await this.getEnrollmentCount();
  return enrollmentCount < this.maxStudents;
};

Course.prototype.getLessonsCount = async function() {
  const Lesson = require('../lesson/Lesson');
  return await Lesson.count({
    where: { 
      courseId: this.id,
      status: 'published' 
    }
  });
};

Course.prototype.getQuizzesCount = async function() {
  const Quiz = require('../quiz/Quiz');
  return await Quiz.count({
    where: { 
      courseId: this.id,
      isPublished: true 
    }
  });
};

// Class methods
Course.findPublished = function() {
  return this.findAll({ 
    where: { 
      isPublished: true,
      isActive: true 
    } 
  });
};

Course.findByTeacher = function(teacherId) {
  return this.findAll({ 
    where: { teacherId },
    order: [['created_at', 'DESC']]
  });
};

Course.findByCategory = function(categoryId) {
  return this.findAll({ 
    where: { 
      categoryId,
      isPublished: true,
      isActive: true 
    } 
  });
};

module.exports = Course;