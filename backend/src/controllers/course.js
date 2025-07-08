// File: backend/src/controllers/course.js
// Path: backend/src/controllers/course.js

const { Course, User, Enrollment, Lesson, Quiz, CourseCategory } = require('../models');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

// ========================================
// COURSE CRUD OPERATIONS
// ========================================

// @desc    Get all published courses
// @route   GET /api/courses
// @access  Public
const getAllCourses = catchAsync(async (req, res, next) => {
  const { page = 1, limit = 12, category, search, difficulty, sort = 'newest' } = req.query;
  
  const offset = (page - 1) * limit;
  const where = { isPublished: true, isActive: true };
  
  // Filter by category
  if (category) {
    where.categoryId = category;
  }
  
  // Filter by difficulty level
  if (difficulty) {
    where.difficultyLevel = difficulty;
  }
  
  // Search by title or description
  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
      { tags: { [Op.contains]: [search] } }
    ];
  }
  
  // Sorting options
  let order = [['created_at', 'DESC']]; // Default: newest first
  switch (sort) {
    case 'oldest':
      order = [['created_at', 'ASC']];
      break;
    case 'title':
      order = [['title', 'ASC']];
      break;
    case 'difficulty':
      order = [['difficultyLevel', 'ASC']];
      break;
    case 'popular':
      // TODO: Sort by enrollment count
      order = [['created_at', 'DESC']];
      break;
  }
  
  try {
    const courses = await Course.findAndCountAll({
      where,
      offset,
      limit: parseInt(limit),
      order,
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['firstName', 'lastName', 'email']
        },
        {
          model: CourseCategory,
          as: 'category',
          attributes: ['name', 'color']
        },
        {
          model: Enrollment,
          as: 'enrollments',
          where: { status: 'approved' },
          required: false,
          attributes: []
        }
      ],
      distinct: true
    });
    
    res.status(200).json({
      success: true,
      data: {
        courses: courses.rows,
        pagination: {
          total: courses.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(courses.count / limit)
        }
      }
    });
    
  } catch (error) {
    // Fallback if models don't exist
    res.status(200).json({
      success: true,
      data: {
        courses: [],
        pagination: { total: 0, page: 1, limit: 12, pages: 0 },
        message: 'Course models not available'
      }
    });
  }
});

// @desc    Get single course details
// @route   GET /api/courses/:id
// @access  Public (for published courses)
const getCourse = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  try {
    const course = await Course.findByPk(id, {
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['firstName', 'lastName', 'email', 'bio']
        },
        {
          model: CourseCategory,
          as: 'category',
          attributes: ['name', 'color', 'icon']
        },
        {
          model: Lesson,
          as: 'lessons',
          where: { status: 'published' },
          required: false,
          order: [['orderIndex', 'ASC']],
          attributes: ['id', 'title', 'lessonType', 'estimatedTime', 'orderIndex']
        },
        {
          model: Quiz,
          as: 'quizzes',
          where: { isPublished: true },
          required: false,
          attributes: ['id', 'title', 'quizType', 'timeLimit', 'maxAttempts']
        }
      ]
    });
    
    if (!course) {
      return next(new AppError('Course not found', 404));
    }
    
    // Check if course is published (unless user is teacher/admin)
    if (!course.isPublished) {
      if (!req.user || 
          (req.user.role !== 'admin' && 
           req.user.role !== 'teacher' || 
           req.user.id !== course.teacherId)) {
        return next(new AppError('Course not found', 404));
      }
    }
    
    // Get enrollment statistics
    const enrollmentStats = await Enrollment.findAll({
      where: { courseId: id },
      attributes: [
        'status',
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    }).catch(() => []);
    
    const stats = {
      totalEnrollments: 0,
      approvedEnrollments: 0,
      pendingEnrollments: 0
    };
    
    enrollmentStats.forEach(stat => {
      stats.totalEnrollments += parseInt(stat.count);
      if (stat.status === 'approved') {
        stats.approvedEnrollments = parseInt(stat.count);
      } else if (stat.status === 'pending') {
        stats.pendingEnrollments = parseInt(stat.count);
      }
    });
    
    // Check if current user is enrolled
    let userEnrollment = null;
    if (req.user) {
      userEnrollment = await Enrollment.findOne({
        where: { courseId: id, studentId: req.user.id }
      }).catch(() => null);
    }
    
    res.status(200).json({
      success: true,
      data: {
        course,
        stats,
        userEnrollment,
        canManage: req.user && 
                   (req.user.role === 'admin' || 
                    (req.user.role === 'teacher' && req.user.id === course.teacherId))
      }
    });
    
  } catch (error) {
    return next(new AppError('Error fetching course details', 500));
  }
});

// @desc    Create new course
// @route   POST /api/courses
// @access  Teacher/Admin
const createCourse = catchAsync(async (req, res, next) => {
  const {
    title,
    description,
    shortDescription,
    categoryId,
    difficultyLevel,
    estimatedDuration,
    maxStudents,
    tags,
    prerequisites,
    learningObjectives
  } = req.body;
  
  try {
    // Generate unique course code
    const courseCode = `COURSE_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const course = await Course.create({
      title,
      description,
      shortDescription,
      categoryId,
      teacherId: req.user.id,
      courseCode,
      difficultyLevel: difficultyLevel || 1,
      estimatedDuration,
      maxStudents,
      tags: tags || [],
      prerequisites: prerequisites || [],
      learningObjectives: learningObjectives || [],
      isPublished: false,
      isActive: true
    });
    
    // Fetch course with relations
    const newCourse = await Course.findByPk(course.id, {
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['firstName', 'lastName', 'email']
        },
        {
          model: CourseCategory,
          as: 'category',
          attributes: ['name', 'color']
        }
      ]
    });
    
    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: {
        course: newCourse
      }
    });
    
  } catch (error) {
    return next(new AppError('Error creating course', 500));
  }
});

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Teacher (own courses)/Admin
const updateCourse = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  try {
    const course = await Course.findByPk(id);
    
    if (!course) {
      return next(new AppError('Course not found', 404));
    }
    
    // Check ownership
    if (req.user.role !== 'admin' && course.teacherId !== req.user.id) {
      return next(new AppError('You can only update your own courses', 403));
    }
    
    // Update course fields
    const updateFields = [
      'title', 'description', 'shortDescription', 'categoryId',
      'difficultyLevel', 'estimatedDuration', 'maxStudents',
      'tags', 'prerequisites', 'learningObjectives'
    ];
    
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        course[field] = req.body[field];
      }
    });
    
    await course.save();
    
    // Fetch updated course with relations
    const updatedCourse = await Course.findByPk(id, {
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['firstName', 'lastName', 'email']
        },
        {
          model: CourseCategory,
          as: 'category',
          attributes: ['name', 'color']
        }
      ]
    });
    
    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: {
        course: updatedCourse
      }
    });
    
  } catch (error) {
    return next(new AppError('Error updating course', 500));
  }
});

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Teacher (own courses)/Admin
const deleteCourse = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  try {
    const course = await Course.findByPk(id);
    
    if (!course) {
      return next(new AppError('Course not found', 404));
    }
    
    // Check ownership
    if (req.user.role !== 'admin' && course.teacherId !== req.user.id) {
      return next(new AppError('You can only delete your own courses', 403));
    }
    
    // Check if course has enrollments
    const enrollmentCount = await Enrollment.count({
      where: { courseId: id, status: 'approved' }
    }).catch(() => 0);
    
    if (enrollmentCount > 0) {
      return next(new AppError('Cannot delete course with active enrollments', 400));
    }
    
    await course.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Course deleted successfully'
    });
    
  } catch (error) {
    return next(new AppError('Error deleting course', 500));
  }
});

// @desc    Publish/unpublish course
// @route   PATCH /api/courses/:id/publish
// @access  Teacher (own courses)/Admin
const togglePublishCourse = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { isPublished } = req.body;
  
  try {
    const course = await Course.findByPk(id);
    
    if (!course) {
      return next(new AppError('Course not found', 404));
    }
    
    // Check ownership
    if (req.user.role !== 'admin' && course.teacherId !== req.user.id) {
      return next(new AppError('You can only publish your own courses', 403));
    }
    
    course.isPublished = isPublished;
    await course.save();
    
    res.status(200).json({
      success: true,
      message: `Course ${isPublished ? 'published' : 'unpublished'} successfully`,
      data: {
        course: {
          id: course.id,
          title: course.title,
          isPublished: course.isPublished
        }
      }
    });
    
  } catch (error) {
    return next(new AppError('Error updating course publication status', 500));
  }
});

// ========================================
// ENROLLMENT MANAGEMENT
// ========================================

// @desc    Request enrollment in course
// @route   POST /api/courses/:id/enroll
// @access  Student
const requestEnrollment = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  if (req.user.role !== 'student') {
    return next(new AppError('Only students can enroll in courses', 403));
  }
  
  try {
    const course = await Course.findByPk(id);
    
    if (!course) {
      return next(new AppError('Course not found', 404));
    }
    
    if (!course.isPublished) {
      return next(new AppError('Cannot enroll in unpublished course', 400));
    }
    
    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      where: { courseId: id, studentId: req.user.id }
    });
    
    if (existingEnrollment) {
      const statusMessage = {
        pending: 'Your enrollment request is pending approval',
        approved: 'You are already enrolled in this course',
        rejected: 'Your enrollment request was rejected. Contact the teacher for more information.'
      };
      
      return next(new AppError(statusMessage[existingEnrollment.status], 400));
    }
    
    // Check max students limit
    if (course.maxStudents) {
      const currentEnrollments = await Enrollment.count({
        where: { courseId: id, status: 'approved' }
      });
      
      if (currentEnrollments >= course.maxStudents) {
        return next(new AppError('Course is full', 400));
      }
    }
    
    // Create enrollment request
    const enrollment = await Enrollment.create({
      courseId: id,
      studentId: req.user.id,
      status: 'pending',
      enrolledAt: new Date()
    });
    
    // TODO: Send notification to teacher
    
    res.status(201).json({
      success: true,
      message: 'Enrollment request submitted. Waiting for teacher approval.',
      data: {
        enrollment: {
          id: enrollment.id,
          courseId: enrollment.courseId,
          status: enrollment.status,
          enrolledAt: enrollment.enrolledAt
        }
      }
    });
    
  } catch (error) {
    return next(new AppError('Error requesting enrollment', 500));
  }
});

// @desc    Get enrolled students for a course
// @route   GET /api/courses/:id/students
// @access  Teacher (own courses)/Admin
const getCourseStudents = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status = 'all', page = 1, limit = 20 } = req.query;
  
  try {
    const course = await Course.findByPk(id);
    
    if (!course) {
      return next(new AppError('Course not found', 404));
    }
    
    // Check ownership
    if (req.user.role !== 'admin' && course.teacherId !== req.user.id) {
      return next(new AppError('You can only view students from your own courses', 403));
    }
    
    const offset = (page - 1) * limit;
    const where = { courseId: id };
    
    if (status !== 'all') {
      where.status = status;
    }
    
    const enrollments = await Enrollment.findAndCountAll({
      where,
      offset,
      limit: parseInt(limit),
      order: [['enrolledAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone']
        }
      ]
    });
    
    res.status(200).json({
      success: true,
      data: {
        students: enrollments.rows,
        pagination: {
          total: enrollments.count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(enrollments.count / limit)
        }
      }
    });
    
  } catch (error) {
    return next(new AppError('Error fetching course students', 500));
  }
});

// @desc    Approve/reject student enrollment
// @route   PUT /api/courses/:id/students/:studentId
// @access  Teacher (own courses)/Admin
const updateEnrollmentStatus = catchAsync(async (req, res, next) => {
  const { id, studentId } = req.params;
  const { status } = req.body;
  
  if (!['approved', 'rejected'].includes(status)) {
    return next(new AppError('Status must be either approved or rejected', 400));
  }
  
  try {
    const course = await Course.findByPk(id);
    
    if (!course) {
      return next(new AppError('Course not found', 404));
    }
    
    // Check ownership
    if (req.user.role !== 'admin' && course.teacherId !== req.user.id) {
      return next(new AppError('You can only manage enrollments for your own courses', 403));
    }
    
    const enrollment = await Enrollment.findOne({
      where: { courseId: id, studentId },
      include: [
        {
          model: User,
          as: 'student',
          attributes: ['firstName', 'lastName', 'email']
        }
      ]
    });
    
    if (!enrollment) {
      return next(new AppError('Enrollment not found', 404));
    }
    
    enrollment.status = status;
    enrollment.approvedAt = status === 'approved' ? new Date() : null;
    enrollment.approvedBy = req.user.id;
    
    await enrollment.save();
    
    // TODO: Send notification to student
    
    res.status(200).json({
      success: true,
      message: `Student enrollment ${status} successfully`,
      data: {
        enrollment: {
          id: enrollment.id,
          student: enrollment.student,
          status: enrollment.status,
          approvedAt: enrollment.approvedAt
        }
      }
    });
    
  } catch (error) {
    return next(new AppError('Error updating enrollment status', 500));
  }
});

module.exports = {
  getAllCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  togglePublishCourse,
  requestEnrollment,
  getCourseStudents,
  updateEnrollmentStatus
};

// ========================================
// MEMORY ALERT: 3 ไฟล์ครบแล้ว!
// ========================================
// Files created:
// 1. routes/index.js (fixed) - Added admin & analytics routes
// 2. routes/analytics.js - Analytics routes with auth
// 3. controllers/course.js - Course CRUD & enrollment management
// 
// Next needed: routes/course.js, quiz controllers, frontend React!