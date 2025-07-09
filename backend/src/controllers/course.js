// File: backend/src/controllers/course.js
// Path: backend/src/controllers/course.js

const { Course, User, Enrollment, Lesson, Quiz, CourseCategory } = require('../models');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { sendEmail } = require('../utils/emailService');
const { 
  processImage, 
  generateUniqueFileName, 
  formatFileSize, 
  saveFileLocally,
  deleteFileLocally,
  validateFile,
  FILE_TYPE_CONFIGS
} = require('../utils/fileHelper');
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
    
    // 📧 SEND COURSE CREATION CONFIRMATION EMAIL
    try {
      await sendEmail({
        to: req.user.email,
        subject: '🎯 คอร์สใหม่ของคุณถูกสร้างแล้ว!',
        template: 'course-created',
        data: {
          teacherName: `${req.user.firstName} ${req.user.lastName}`,
          courseTitle: title,
          courseCode: courseCode,
          createdDate: new Date().toLocaleDateString('th-TH'),
          courseUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/teacher/courses/${course.id}`,
          dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/teacher/dashboard`,
          nextSteps: [
            'เพิ่มรูปปกคอร์ส',
            'เพิ่มบทเรียนและเนื้อหา',
            'สร้างแบบทดสอบ',
            'ตั้งค่าการเผยแพร่คอร์ส'
          ]
        }
      });

      console.log(`✅ Course creation email sent to teacher: ${req.user.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send course creation email:', emailError.message);
    }

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

// ========================================
// 🖼️ COURSE THUMBNAIL UPLOAD INTEGRATION
// ========================================

// @desc    Upload course thumbnail
// @route   POST /api/courses/:id/thumbnail
// @access  Teacher (own courses)/Admin
const uploadCourseThumbnail = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('ไม่พบไฟล์รูปภาพที่อัปโหลด', 400));
  }

  const { id } = req.params;
  const file = req.file;

  // Check if course exists and user has permission
  const course = await Course.findByPk(id, {
    include: [
      {
        model: User,
        as: 'teacher',
        attributes: ['firstName', 'lastName', 'email']
      }
    ]
  });

  if (!course) {
    return next(new AppError('ไม่พบคอร์สที่ระบุ', 404));
  }

  if (req.user.role !== 'admin' && course.teacherId !== req.user.id) {
    return next(new AppError('คุณไม่มีสิทธิ์แก้ไขคอร์สนี้', 403));
  }

  // Validate file
  const validation = validateFile(file, FILE_TYPE_CONFIGS.courseThumbnail);
  if (!validation.isValid) {
    return next(new AppError(validation.errors.join(', '), 400));
  }

  try {
    // Process image
    const imageBuffer = file.buffer || require('fs').readFileSync(file.path);
    const processResult = await processImage(imageBuffer, {
      width: 800,
      height: 450,
      quality: 90,
      format: 'jpeg',
      fit: 'cover',
      generateThumbnail: true,
      thumbnailSize: 300
    });

    if (!processResult.success) {
      return next(new AppError('เกิดข้อผิดพลาดในการประมวลผลรูปภาพ', 500));
    }

    // Generate unique filename
    const fileName = generateUniqueFileName(file.originalname, `course_${id}`);
    const thumbnailName = generateUniqueFileName(file.originalname, `course_${id}_thumb`);

    // Save processed image
    const saveResult = await saveFileLocally(processResult.processedBuffer, fileName, 'courses');
    if (!saveResult.success) {
      return next(new AppError('เกิดข้อผิดพลาดในการบันทึกรูปภาพ', 500));
    }

    // Save thumbnail
    let thumbnailUrl = null;
    if (processResult.thumbnail) {
      const thumbnailResult = await saveFileLocally(processResult.thumbnail, thumbnailName, 'courses/thumbnails');
      if (thumbnailResult.success) {
        thumbnailUrl = thumbnailResult.fullUrl;
      }
    }

    // Delete old thumbnail if exists
    if (course.thumbnail && course.thumbnail !== saveResult.fullUrl) {
      try {
        const oldPath = course.thumbnail.replace(process.env.API_URL || 'http://localhost:5000', '.');
        await deleteFileLocally(oldPath);
      } catch (error) {
        console.log('Failed to delete old course thumbnail:', error.message);
      }
    }

    // Delete old small thumbnail if exists
    if (course.thumbnailSmall && course.thumbnailSmall !== thumbnailUrl) {
      try {
        const oldThumbPath = course.thumbnailSmall.replace(process.env.API_URL || 'http://localhost:5000', '.');
        await deleteFileLocally(oldThumbPath);
      } catch (error) {
        console.log('Failed to delete old course thumbnail small:', error.message);
      }
    }

    // Update course with new thumbnail
    course.thumbnail = saveResult.fullUrl;
    course.thumbnailSmall = thumbnailUrl;
    await course.save();

    // Clean up temp file
    if (file.path) {
      try {
        await deleteFileLocally(file.path);
      } catch (error) {
        console.log('Failed to clean up temp file:', error.message);
      }
    }

    // 📧 Send thumbnail update notification
    try {
      await sendEmail({
        to: course.teacher.email,
        subject: '🖼️ รูปปกคอร์สอัปเดตแล้ว',
        template: 'course-thumbnail-updated',
        data: {
          teacherName: `${course.teacher.firstName} ${course.teacher.lastName}`,
          courseTitle: course.title,
          updateDate: new Date().toLocaleDateString('th-TH'),
          courseUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/teacher/courses/${course.id}`,
          thumbnailUrl: saveResult.fullUrl
        }
      });

      console.log(`✅ Course thumbnail update email sent to: ${course.teacher.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send thumbnail update email:', emailError.message);
    }

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${course.teacherId}`).emit('course-thumbnail-updated', {
        courseId: course.id,
        thumbnail: course.thumbnail,
        thumbnailSmall: course.thumbnailSmall,
        timestamp: new Date()
      });

      // Notify enrolled students about course update
      const enrolledStudents = await Enrollment.findAll({
        where: { courseId: id, status: 'approved' },
        attributes: ['studentId']
      });

      enrolledStudents.forEach(enrollment => {
        io.to(`user-${enrollment.studentId}`).emit('course-updated', {
          courseId: course.id,
          updateType: 'thumbnail',
          timestamp: new Date()
        });
      });
    }

    res.status(200).json({
      success: true,
      message: 'อัปโหลดรูปปกคอร์สสำเร็จ',
      data: {
        course: {
          id: course.id,
          title: course.title,
          thumbnail: course.thumbnail,
          thumbnailSmall: course.thumbnailSmall
        },
        fileInfo: {
          originalName: file.originalname,
          fileName: fileName,
          size: formatFileSize(processResult.processedSize),
          url: saveResult.fullUrl,
          thumbnailUrl: thumbnailUrl
        }
      }
    });

  } catch (error) {
    console.error('Course thumbnail upload error:', error);
    return next(new AppError('เกิดข้อผิดพลาดในการอัปโหลดรูปปกคอร์ส', 500));
  }
});

// @desc    Delete course thumbnail
// @route   DELETE /api/courses/:id/thumbnail
// @access  Teacher (own courses)/Admin
const deleteCourseThumbnail = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  try {
    const course = await Course.findByPk(id);
    if (!course) {
      return next(new AppError('ไม่พบคอร์สที่ระบุ', 404));
    }

    // Check ownership
    if (req.user.role !== 'admin' && course.teacherId !== req.user.id) {
      return next(new AppError('คุณไม่มีสิทธิ์แก้ไขคอร์สนี้', 403));
    }

    if (!course.thumbnail) {
      return next(new AppError('ไม่มีรูปปกคอร์สที่จะลบ', 400));
    }

    // Delete thumbnail file
    try {
      const thumbnailPath = course.thumbnail.replace(process.env.API_URL || 'http://localhost:5000', '.');
      await deleteFileLocally(thumbnailPath);
    } catch (error) {
      console.log('Failed to delete thumbnail file:', error.message);
    }

    // Delete small thumbnail file
    if (course.thumbnailSmall) {
      try {
        const thumbSmallPath = course.thumbnailSmall.replace(process.env.API_URL || 'http://localhost:5000', '.');
        await deleteFileLocally(thumbSmallPath);
      } catch (error) {
        console.log('Failed to delete small thumbnail file:', error.message);
      }
    }

    // Clear thumbnail URLs from database
    course.thumbnail = null;
    course.thumbnailSmall = null;
    await course.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${course.teacherId}`).emit('course-thumbnail-deleted', {
        courseId: course.id,
        timestamp: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: 'ลบรูปปกคอร์สสำเร็จ',
      data: {
        course: {
          id: course.id,
          title: course.title,
          thumbnail: null,
          thumbnailSmall: null
        }
      }
    });

  } catch (error) {
    console.error('Course thumbnail deletion error:', error);
    return next(new AppError('เกิดข้อผิดพลาดในการลบรูปปกคอร์ส', 500));
  }
});

// ========================================
// EXISTING COURSE FUNCTIONS (UNCHANGED)
// ========================================

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
    
    // Delete course thumbnail files if exist
    if (course.thumbnail) {
      try {
        const thumbnailPath = course.thumbnail.replace(process.env.API_URL || 'http://localhost:5000', '.');
        await deleteFileLocally(thumbnailPath);
      } catch (error) {
        console.log('Failed to delete course thumbnail:', error.message);
      }
    }

    if (course.thumbnailSmall) {
      try {
        const thumbSmallPath = course.thumbnailSmall.replace(process.env.API_URL || 'http://localhost:5000', '.');
        await deleteFileLocally(thumbSmallPath);
      } catch (error) {
        console.log('Failed to delete course thumbnail small:', error.message);
      }
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
    const course = await Course.findByPk(id, {
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['firstName', 'lastName', 'email']
        }
      ]
    });
    
    if (!course) {
      return next(new AppError('Course not found', 404));
    }
    
    // Check ownership
    if (req.user.role !== 'admin' && course.teacherId !== req.user.id) {
      return next(new AppError('You can only publish your own courses', 403));
    }
    
    course.isPublished = isPublished;
    await course.save();

    // 📧 NOTIFY INTERESTED STUDENTS WHEN COURSE IS PUBLISHED
    if (isPublished) {
      try {
        // Get all students who might be interested (enrolled or pending)
        const interestedStudents = await Enrollment.findAll({
          where: { 
            courseId: id, 
            status: { [Op.in]: ['pending', 'approved'] }
          },
          include: [
            {
              model: User,
              as: 'student',
              attributes: ['firstName', 'lastName', 'email']
            }
          ]
        });

        // Send notifications to interested students
        for (const enrollment of interestedStudents) {
          await sendEmail({
            to: enrollment.student.email,
            subject: '🚀 คอร์สที่คุณสนใจเผยแพร่แล้ว!',
            template: 'course-published-notification',
            data: {
              studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
              courseTitle: course.title,
              teacherName: `${course.teacher.firstName} ${course.teacher.lastName}`,
              publishedDate: new Date().toLocaleDateString('th-TH'),
              courseUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/courses/${course.id}`,
              enrollmentStatus: enrollment.status,
              enrollmentMessage: enrollment.status === 'approved' 
                ? 'คุณสามารถเข้าเรียนได้ทันที!' 
                : 'รอการอนุมัติจากครูผู้สอน'
            }
          });
        }

        console.log(`✅ Course published notifications sent to ${interestedStudents.length} students`);
      } catch (emailError) {
        console.error('❌ Failed to send course published notifications:', emailError.message);
      }
    }
    
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
// ENROLLMENT MANAGEMENT (UNCHANGED)
// ========================================

// @desc    Request enrollment in course
// @route   POST /api/courses/:id/enroll
// @access  Student
const requestEnrollment = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { message } = req.body; // Optional message from student
  
  if (req.user.role !== 'student') {
    return next(new AppError('Only students can enroll in courses', 403));
  }
  
  try {
    const course = await Course.findByPk(id, {
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['firstName', 'lastName', 'email']
        }
      ]
    });
    
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
      enrolledAt: new Date(),
      studentMessage: message || null
    });
    
    // 📧 NOTIFY TEACHER ABOUT NEW ENROLLMENT REQUEST
    try {
      await sendEmail({
        to: course.teacher.email,
        subject: '👋 มีนักเรียนใหม่ขอเข้าเรียนคอร์สของคุณ!',
        template: 'enrollment-request-teacher',
        data: {
          teacherName: `${course.teacher.firstName} ${course.teacher.lastName}`,
          studentName: `${req.user.firstName} ${req.user.lastName}`,
          studentEmail: req.user.email,
          courseTitle: course.title,
          studentMessage: message || 'ไม่มีข้อความเพิ่มเติม',
          requestDate: new Date().toLocaleDateString('th-TH'),
          approvalUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/teacher/courses/${id}/students`,
          studentProfileUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/teacher/students/${req.user.id}`
        }
      });

      console.log(`✅ Enrollment request email sent to teacher: ${course.teacher.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send enrollment request email:', emailError.message);
    }

    // 📧 SEND CONFIRMATION EMAIL TO STUDENT
    try {
      await sendEmail({
        to: req.user.email,
        subject: '📝 คำขอเข้าเรียนของคุณถูกส่งแล้ว',
        template: 'enrollment-request-student',
        data: {
          studentName: `${req.user.firstName} ${req.user.lastName}`,
          courseTitle: course.title,
          teacherName: `${course.teacher.firstName} ${course.teacher.lastName}`,
          requestDate: new Date().toLocaleDateString('th-TH'),
          courseUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/courses/${id}`,
          statusCheckUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/student/enrollments`
        }
      });

      console.log(`✅ Enrollment confirmation email sent to student: ${req.user.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send enrollment confirmation email:', emailError.message);
    }

    // Emit socket events for real-time notifications
    const io = req.app.get('io');
    if (io) {
      // Notify teacher
      io.to(`user-${course.teacherId}`).emit('enrollment-request', {
        enrollmentId: enrollment.id,
        studentName: `${req.user.firstName} ${req.user.lastName}`,
        courseTitle: course.title,
        timestamp: new Date()
      });

      // Notify in teacher room
      io.to('teacher-room').emit('new-enrollment-request', {
        teacherId: course.teacherId,
        courseId: id,
        studentId: req.user.id,
        timestamp: new Date()
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Enrollment request submitted successfully. You will be notified once the teacher reviews your request.',
      data: {
        enrollment: {
          id: enrollment.id,
          courseId: enrollment.courseId,
          status: enrollment.status,
          enrolledAt: enrollment.enrolledAt,
          course: {
            title: course.title,
            teacher: course.teacher
          }
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
  const { status, rejectionReason } = req.body;
  
  if (!['approved', 'rejected'].includes(status)) {
    return next(new AppError('Status must be either approved or rejected', 400));
  }
  
  try {
    const course = await Course.findByPk(id, {
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['firstName', 'lastName', 'email']
        }
      ]
    });
    
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
    enrollment.rejectionReason = rejectionReason || null;
    
    await enrollment.save();
    
    // 📧 SEND EMAIL NOTIFICATION TO STUDENT
    try {
      if (status === 'approved') {
        // Student approved
        await sendEmail({
          to: enrollment.student.email,
          subject: '🎉 คุณได้รับการอนุมัติให้เข้าเรียนแล้ว!',
          template: 'enrollment-approved',
          data: {
            studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
            courseTitle: course.title,
            teacherName: `${course.teacher.firstName} ${course.teacher.lastName}`,
            approvedDate: new Date().toLocaleDateString('th-TH'),
            courseUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/courses/${id}`,
            learningUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/student/courses/${id}`,
            dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/student/dashboard`,
            welcomeMessage: 'ยินดีต้อนรับสู่คอร์สเรียน! เริ่มต้นการเรียนรู้ของคุณได้เลย'
          }
        });

        console.log(`✅ Enrollment approval email sent to: ${enrollment.student.email}`);

      } else if (status === 'rejected') {
        // Student rejected
        await sendEmail({
          to: enrollment.student.email,
          subject: '❌ คำขอเข้าเรียนคอร์ส',
          template: 'enrollment-rejected',
          data: {
            studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
            courseTitle: course.title,
            teacherName: `${course.teacher.firstName} ${course.teacher.lastName}`,
            rejectedDate: new Date().toLocaleDateString('th-TH'),
            rejectionReason: rejectionReason || 'ไม่ระบุเหตุผล',
            supportEmail: process.env.SUPPORT_EMAIL || 'support@lms.com',
            courseUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/courses/${id}`,
            contactTeacherUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/contact/teacher/${course.teacherId}`
          }
        });

        console.log(`✅ Enrollment rejection email sent to: ${enrollment.student.email}`);
      }

    } catch (emailError) {
      console.error('❌ Failed to send enrollment status email:', emailError.message);
    }

    // Emit socket events for real-time notifications
    const io = req.app.get('io');
    if (io) {
      // Notify student
      io.to(`user-${studentId}`).emit('enrollment-status-updated', {
        courseId: id,
        courseTitle: course.title,
        status: status,
        message: status === 'approved' 
          ? 'ยินดีด้วย! คุณได้รับการอนุมัติให้เข้าเรียนแล้ว' 
          : 'ขออภัย คำขอเข้าเรียนของคุณไม่ได้รับการอนุมัติ',
        timestamp: new Date()
      });

      // Notify teacher room
      io.to('teacher-room').emit('enrollment-processed', {
        teacherId: req.user.id,
        courseId: id,
        studentId: studentId,
        status: status,
        timestamp: new Date()
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Student enrollment ${status} successfully`,
      data: {
        enrollment: {
          id: enrollment.id,
          student: enrollment.student,
          status: enrollment.status,
          approvedAt: enrollment.approvedAt,
          rejectionReason: enrollment.rejectionReason
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
  uploadCourseThumbnail,    // 🆕 NEW: Course thumbnail upload
  deleteCourseThumbnail,    // 🆕 NEW: Course thumbnail deletion
  deleteCourse,
  togglePublishCourse,
  requestEnrollment,
  getCourseStudents,
  updateEnrollmentStatus
};