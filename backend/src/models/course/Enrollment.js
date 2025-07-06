// File: backend/src/models/course/Enrollment.js
// Path: backend/src/models/course/Enrollment.js

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Enrollment = sequelize.define('Enrollment', {
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
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'student_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  enrolledAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'enrolled_at'
  },
  approvedAt: {
    type: DataTypes.DATE,
    field: 'approved_at'
  },
  approvedBy: {
    type: DataTypes.INTEGER,
    field: 'approved_by',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  completionPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    field: 'completion_percentage'
  },
  finalGrade: {
    type: DataTypes.DECIMAL(5, 2),
    field: 'final_grade'
  },
  certificateIssued: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'certificate_issued'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  }
}, {
  tableName: 'enrollments',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['course_id', 'student_id']
    }
  ]
});

// Instance methods
Enrollment.prototype.approve = async function(approvedBy) {
  this.status = 'approved';
  this.approvedAt = new Date();
  this.approvedBy = approvedBy;
  return await this.save();
};

Enrollment.prototype.reject = async function() {
  this.status = 'rejected';
  return await this.save();
};

Enrollment.prototype.updateProgress = async function() {
  const Lesson = require('../lesson/Lesson');
  const LessonProgress = require('../lesson/LessonProgress');
  
  // Get total lessons in course
  const totalLessons = await Lesson.count({
    where: { 
      courseId: this.courseId,
      status: 'published',
      isRequired: true
    }
  });
  
  if (totalLessons === 0) {
    this.completionPercentage = 0;
    return await this.save();
  }
  
  // Get completed lessons by student
  const completedLessons = await LessonProgress.count({
    include: [{
      model: Lesson,
      where: { 
        courseId: this.courseId,
        status: 'published',
        isRequired: true
      }
    }],
    where: { 
      studentId: this.studentId,
      status: 'completed'
    }
  });
  
  this.completionPercentage = (completedLessons / totalLessons) * 100;
  return await this.save();
};

// Class methods
Enrollment.findPending = function() {
  return this.findAll({ 
    where: { status: 'pending' },
    order: [['enrolled_at', 'ASC']]
  });
};

Enrollment.findByStudent = function(studentId) {
  return this.findAll({ 
    where: { 
      studentId,
      status: 'approved',
      isActive: true 
    } 
  });
};

Enrollment.findByCourse = function(courseId) {
  return this.findAll({ 
    where: { 
      courseId,
      status: 'approved',
      isActive: true 
    } 
  });
};

Enrollment.findPendingForTeacher = function(teacherId) {
  const Course = require('./Course');
  return this.findAll({
    include: [{
      model: Course,
      where: { teacherId }
    }],
    where: { status: 'pending' },
    order: [['enrolled_at', 'ASC']]
  });
};

module.exports = Enrollment;