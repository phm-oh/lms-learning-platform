// File: backend/src/models/lesson/Lesson.js
// Path: backend/src/models/lesson/Lesson.js

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Lesson = sequelize.define('Lesson', {
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
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  content: {
    type: DataTypes.TEXT // Rich text content
  },
  lessonType: {
    type: DataTypes.ENUM('video', 'text', 'document', 'quiz', 'assignment', 'discussion'),
    allowNull: false,
    field: 'lesson_type'
  },
  videoUrl: {
    type: DataTypes.STRING(500),
    field: 'video_url',
    validate: {
      isUrl: true
    }
  },
  videoDuration: {
    type: DataTypes.INTEGER, // seconds
    field: 'video_duration'
  },
  fileAttachments: {
    type: DataTypes.JSONB,
    defaultValue: [],
    field: 'file_attachments'
  },
  orderIndex: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'order_index'
  },
  estimatedTime: {
    type: DataTypes.INTEGER, // minutes
    field: 'estimated_time'
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'archived'),
    defaultValue: 'draft'
  },
  isRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_required'
  },
  prerequisites: {
    type: DataTypes.ARRAY(DataTypes.INTEGER),
    defaultValue: [] // lesson IDs
  }
}, {
  tableName: 'lessons',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// Instance methods
Lesson.prototype.isAccessibleToStudent = async function(studentId) {
  if (this.status !== 'published') return false;
  
  // Check if student is enrolled in the course
  const Enrollment = require('../course/Enrollment');
  const enrollment = await Enrollment.findOne({
    where: {
      courseId: this.courseId,
      studentId: studentId,
      status: 'approved',
      isActive: true
    }
  });
  
  if (!enrollment) return false;
  
  // Check prerequisites
  if (this.prerequisites && this.prerequisites.length > 0) {
    const LessonProgress = require('./LessonProgress');
    const completedPrereqs = await LessonProgress.count({
      where: {
        studentId: studentId,
        lessonId: this.prerequisites,
        status: 'completed'
      }
    });
    
    return completedPrereqs === this.prerequisites.length;
  }
  
  return true;
};

Lesson.prototype.getStudentProgress = async function(studentId) {
  const LessonProgress = require('./LessonProgress');
  return await LessonProgress.findOne({
    where: {
      lessonId: this.id,
      studentId: studentId
    }
  });
};

// Class methods
Lesson.findByCourse = function(courseId, includeUnpublished = false) {
  const whereClause = { courseId };
  if (!includeUnpublished) {
    whereClause.status = 'published';
  }
  
  return this.findAll({
    where: whereClause,
    order: [['order_index', 'ASC']]
  });
};

Lesson.findPublishedByCourse = function(courseId) {
  return this.findByCourse(courseId, false);
};

module.exports = Lesson;