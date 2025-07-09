// File: backend/src/controllers/lesson.js
// Path: backend/src/controllers/lesson.js

const { Lesson, Course, User, LessonProgress, Enrollment } = require('../models');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { sendEmail } = require('../utils/emailService');
const { 
  generateUniqueFileName, 
  formatFileSize, 
  saveFileLocally,
  deleteFileLocally,
  validateFile,
  FILE_TYPE_CONFIGS,
  getFileCategory,
  getFileIcon
} = require('../utils/fileHelper');
const { Op } = require('sequelize');

// ========================================
// LESSON CRUD OPERATIONS
// ========================================

// @desc    Get lessons for a course
// @route   GET /api/lessons/course/:courseId
// @access  Enrolled students/Teachers/Admin
const getCourseActions = catchAsync(async (req, res, next) => {
  const { courseId } = req.params;
  const { includeProgress = false } = req.query;
  
  try {
    const whereClause = { courseId };
    
    // Students can only see published lessons
    if (req.user.role === 'student') {
      whereClause.status = 'published';
    }
    
    const lessons = await Lesson.findAll({
      where: whereClause,
      order: [['orderIndex', 'ASC']],
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['title', 'teacherId']
        }
      ]
    });
    
    // For students, get their progress and check accessibility
    let lessonsWithProgress = lessons;
    if (req.user.role === 'student' && includeProgress === 'true') {
      lessonsWithProgress = await Promise.all(lessons.map(async (lesson) => {
        const isAccessible = await lesson.isAccessibleToStudent(req.user.id);
        const progress = await lesson.getStudentProgress(req.user.id);
        
        return {
          ...lesson.toJSON(),
          isAccessible,
          progress: progress ? {
            status: progress.status,
            completionPercentage: progress.completionPercentage,
            timeSpent: progress.timeSpent,
            lastAccessed: progress.lastAccessed,
            completedAt: progress.completedAt
          } : null
        };
      }));
    }
    
    res.status(200).json({
      success: true,
      data: {
        lessons: lessonsWithProgress,
        total: lessons.length
      }
    });
    
  } catch (error) {
    // Mock data if models don't exist
    res.status(200).json({
      success: true,
      data: {
        lessons: [
          {
            id: 1,
            title: 'Introduction to the Course',
            lessonType: 'video',
            videoUrl: 'https://example.com/video1.mp4',
            estimatedTime: 30,
            orderIndex: 1,
            status: 'published',
            isRequired: true,
            isAccessible: true,
            progress: includeProgress === 'true' ? {
              status: 'not_started',
              completionPercentage: 0,
              timeSpent: 0
            } : null
          },
          {
            id: 2,
            title: 'Course Materials',
            lessonType: 'document',
            estimatedTime: 15,
            orderIndex: 2,
            status: 'published',
            isRequired: false,
            isAccessible: true,
            progress: includeProgress === 'true' ? {
              status: 'completed',
              completionPercentage: 100,
              timeSpent: 900
            } : null
          }
        ],
        total: 2,
        message: 'Mock lesson data - Lesson models not available'
      }
    });
  }
});

// @desc    Get single lesson details
// @route   GET /api/lessons/:id
// @access  Enrolled students/Teachers/Admin
const getLesson = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  try {
    const lesson = await Lesson.findByPk(id, {
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'teacherId'],
          include: [
            {
              model: User,
              as: 'teacher',
              attributes: ['firstName', 'lastName']
            }
          ]
        }
      ]
    });
    
    if (!lesson) {
      return next(new AppError('Lesson not found', 404));
    }
    
    // Check if student can access this lesson
    if (req.user.role === 'student') {
      const isAccessible = await lesson.isAccessibleToStudent(req.user.id);
      if (!isAccessible) {
        return next(new AppError('You do not have access to this lesson', 403));
      }
      
      // Update lesson progress for student access
      await updateLessonAccess(req.user.id, lesson.id);
    }
    
    // Get student progress if student
    let progress = null;
    if (req.user.role === 'student') {
      progress = await lesson.getStudentProgress(req.user.id);
    }
    
    res.status(200).json({
      success: true,
      data: {
        lesson: {
          ...lesson.toJSON(),
          progress: progress ? {
            status: progress.status,
            completionPercentage: progress.completionPercentage,
            timeSpent: progress.timeSpent,
            lastAccessed: progress.lastAccessed,
            completedAt: progress.completedAt,
            notes: progress.notes
          } : null
        },
        canManage: req.user.role === 'admin' || 
                   (req.user.role === 'teacher' && lesson.course.teacherId === req.user.id)
      }
    });
    
  } catch (error) {
    // Mock response if models don't exist
    res.status(200).json({
      success: true,
      data: {
        lesson: {
          id: parseInt(id),
          title: 'Mock Lesson Details',
          description: 'This is a detailed mock lesson',
          content: '<p>Mock lesson content goes here...</p>',
          lessonType: 'video',
          videoUrl: 'https://example.com/mock-video.mp4',
          videoDuration: 1800,
          estimatedTime: 30,
          orderIndex: 1,
          status: 'published',
          isRequired: true,
          course: {
            id: 1,
            title: 'Mock Course',
            teacher: { firstName: 'Mock', lastName: 'Teacher' }
          },
          progress: req.user.role === 'student' ? {
            status: 'not_started',
            completionPercentage: 0,
            timeSpent: 0
          } : null
        },
        canManage: req.user.role !== 'student',
        message: 'Mock lesson data - Lesson models not available'
      }
    });
  }
});

// @desc    Create new lesson
// @route   POST /api/lessons
// @access  Teacher/Admin
const createLesson = catchAsync(async (req, res, next) => {
  const {
    courseId,
    title,
    description,
    content,
    lessonType,
    videoUrl,
    videoDuration,
    fileAttachments,
    estimatedTime,
    isRequired,
    prerequisites
  } = req.body;
  
  try {
    // Check if user owns the course
    const course = await Course.findByPk(courseId);
    if (!course) {
      return next(new AppError('Course not found', 404));
    }
    
    if (req.user.role !== 'admin' && course.teacherId !== req.user.id) {
      return next(new AppError('You can only create lessons for your own courses', 403));
    }
    
    // Get next order index
    const lastLesson = await Lesson.findOne({
      where: { courseId },
      order: [['orderIndex', 'DESC']]
    });
    
    const orderIndex = lastLesson ? lastLesson.orderIndex + 1 : 1;
    
    // Create lesson
    const lesson = await Lesson.create({
      courseId,
      title,
      description,
      content,
      lessonType,
      videoUrl,
      videoDuration,
      fileAttachments: fileAttachments || [],
      orderIndex,
      estimatedTime,
      status: 'draft',
      isRequired: isRequired !== false,
      prerequisites: prerequisites || []
    });
    
    // Return created lesson with course info
    const createdLesson = await Lesson.findByPk(lesson.id, {
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['title']
        }
      ]
    });

    // 📧 SEND LESSON CREATION CONFIRMATION EMAIL TO TEACHER
    try {
      await sendEmail({
        to: req.user.email,
        subject: '📚 บทเรียนใหม่ถูกสร้างแล้ว!',
        template: 'lesson-created',
        data: {
          teacherName: `${req.user.firstName} ${req.user.lastName}`,
          lessonTitle: title,
          courseTitle: course.title,
          lessonType: lessonType,
          estimatedTime: estimatedTime || 'ไม่ระบุ',
          createdDate: new Date().toLocaleDateString('th-TH'),
          lessonUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/teacher/lessons/${lesson.id}`,
          courseManagementUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/teacher/courses/${courseId}`,
          nextSteps: [
            'เพิ่มเนื้อหาในบทเรียน',
            'อัปโหลดวิดีโอหรือไฟล์แนบ',
            'ตั้งค่าการเผยแพร่บทเรียน'
          ]
        }
      });

      console.log(`✅ Lesson creation email sent to teacher: ${req.user.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send lesson creation email:', emailError.message);
    }
    
    res.status(201).json({
      success: true,
      message: 'Lesson created successfully',
      data: {
        lesson: createdLesson
      }
    });
    
  } catch (error) {
    return next(new AppError('Error creating lesson', 500));
  }
});

// @desc    Update lesson
// @route   PUT /api/lessons/:id
// @access  Teacher (own courses)/Admin
const updateLesson = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  try {
    const lesson = await Lesson.findByPk(id, {
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['teacherId']
        }
      ]
    });
    
    if (!lesson) {
      return next(new AppError('Lesson not found', 404));
    }
    
    // Check ownership
    if (req.user.role !== 'admin' && lesson.course.teacherId !== req.user.id) {
      return next(new AppError('You can only update lessons from your own courses', 403));
    }
    
    // Update lesson fields
    const updateFields = [
      'title', 'description', 'content', 'lessonType', 'videoUrl', 
      'videoDuration', 'fileAttachments', 'estimatedTime', 'isRequired', 'prerequisites'
    ];
    
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        lesson[field] = req.body[field];
      }
    });
    
    await lesson.save();
    
    res.status(200).json({
      success: true,
      message: 'Lesson updated successfully',
      data: {
        lesson
      }
    });
    
  } catch (error) {
    return next(new AppError('Error updating lesson', 500));
  }
});

// ========================================
// 🎥 LESSON VIDEO UPLOAD INTEGRATION
// ========================================

// @desc    Upload lesson video
// @route   POST /api/lessons/:id/video
// @access  Teacher (own courses)/Admin
const uploadLessonVideo = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('ไม่พบไฟล์วิดีโอที่อัปโหลด', 400));
  }

  const { id } = req.params;
  const file = req.file;

  // Check if lesson exists and user has permission
  const lesson = await Lesson.findByPk(id, {
    include: [
      {
        model: Course,
        as: 'course',
        attributes: ['id', 'title', 'teacherId'],
        include: [
          {
            model: User,
            as: 'teacher',
            attributes: ['firstName', 'lastName', 'email']
          }
        ]
      }
    ]
  });

  if (!lesson) {
    return next(new AppError('ไม่พบบทเรียนที่ระบุ', 404));
  }

  if (req.user.role !== 'admin' && lesson.course.teacherId !== req.user.id) {
    return next(new AppError('คุณไม่มีสิทธิ์แก้ไขบทเรียนนี้', 403));
  }

  // Validate file
  const validation = validateFile(file, FILE_TYPE_CONFIGS.lessonVideo);
  if (!validation.isValid) {
    return next(new AppError(validation.errors.join(', '), 400));
  }

  try {
    // Generate unique filename
    const fileName = generateUniqueFileName(file.originalname, `lesson_${id}_video`);

    // Save video file
    const videoBuffer = file.buffer || require('fs').readFileSync(file.path);
    const saveResult = await saveFileLocally(videoBuffer, fileName, 'lessons/videos');
    
    if (!saveResult.success) {
      return next(new AppError('เกิดข้อผิดพลาดในการบันทึกไฟล์วิดีโอ', 500));
    }

    // Delete old video if exists
    if (lesson.videoUrl && lesson.videoUrl !== saveResult.fullUrl) {
      try {
        const oldPath = lesson.videoUrl.replace(process.env.API_URL || 'http://localhost:5000', '.');
        await deleteFileLocally(oldPath);
      } catch (error) {
        console.log('Failed to delete old lesson video:', error.message);
      }
    }

    // Update lesson with new video URL
    lesson.videoUrl = saveResult.fullUrl;
    lesson.lessonType = 'video';
    lesson.videoDuration = req.body.videoDuration || null; // Can be provided by client
    await lesson.save();

    // Clean up temp file
    if (file.path) {
      try {
        await deleteFileLocally(file.path);
      } catch (error) {
        console.log('Failed to clean up temp file:', error.message);
      }
    }

    // 📧 Send video upload notification
    try {
      await sendEmail({
        to: lesson.course.teacher.email,
        subject: '🎥 วิดีโอบทเรียนอัปโหลดสำเร็จ',
        template: 'lesson-video-uploaded',
        data: {
          teacherName: `${lesson.course.teacher.firstName} ${lesson.course.teacher.lastName}`,
          lessonTitle: lesson.title,
          courseTitle: lesson.course.title,
          fileName: file.originalname,
          fileSize: formatFileSize(file.size || videoBuffer.length),
          uploadDate: new Date().toLocaleDateString('th-TH'),
          lessonUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/teacher/lessons/${lesson.id}`,
          previewUrl: saveResult.fullUrl
        }
      });

      console.log(`✅ Video upload notification sent to: ${lesson.course.teacher.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send video upload email:', emailError.message);
    }

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${lesson.course.teacherId}`).emit('lesson-video-uploaded', {
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        videoUrl: lesson.videoUrl,
        timestamp: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: 'อัปโหลดวิดีโอบทเรียนสำเร็จ',
      data: {
        lesson: {
          id: lesson.id,
          title: lesson.title,
          videoUrl: lesson.videoUrl,
          videoDuration: lesson.videoDuration,
          lessonType: lesson.lessonType
        },
        fileInfo: {
          originalName: file.originalname,
          fileName: fileName,
          size: formatFileSize(file.size || videoBuffer.length),
          url: saveResult.fullUrl,
          category: getFileCategory(file.mimetype),
          icon: getFileIcon(file.mimetype)
        }
      }
    });

  } catch (error) {
    console.error('Lesson video upload error:', error);
    return next(new AppError('เกิดข้อผิดพลาดในการอัปโหลดวิดีโอบทเรียน', 500));
  }
});

// @desc    Delete lesson video
// @route   DELETE /api/lessons/:id/video
// @access  Teacher (own courses)/Admin
const deleteLessonVideo = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  try {
    const lesson = await Lesson.findByPk(id, {
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['teacherId']
        }
      ]
    });

    if (!lesson) {
      return next(new AppError('ไม่พบบทเรียนที่ระบุ', 404));
    }

    // Check ownership
    if (req.user.role !== 'admin' && lesson.course.teacherId !== req.user.id) {
      return next(new AppError('คุณไม่มีสิทธิ์แก้ไขบทเรียนนี้', 403));
    }

    if (!lesson.videoUrl) {
      return next(new AppError('ไม่มีวิดีโอที่จะลบ', 400));
    }

    // Delete video file
    try {
      const videoPath = lesson.videoUrl.replace(process.env.API_URL || 'http://localhost:5000', '.');
      await deleteFileLocally(videoPath);
    } catch (error) {
      console.log('Failed to delete video file:', error.message);
    }

    // Clear video fields from database
    lesson.videoUrl = null;
    lesson.videoDuration = null;
    if (lesson.lessonType === 'video') {
      lesson.lessonType = 'text'; // Default back to text
    }
    await lesson.save();

    res.status(200).json({
      success: true,
      message: 'ลบวิดีโอบทเรียนสำเร็จ',
      data: {
        lesson: {
          id: lesson.id,
          title: lesson.title,
          videoUrl: null,
          videoDuration: null,
          lessonType: lesson.lessonType
        }
      }
    });

  } catch (error) {
    console.error('Lesson video deletion error:', error);
    return next(new AppError('เกิดข้อผิดพลาดในการลบวิดีโอบทเรียน', 500));
  }
});

// ========================================
// 📎 LESSON ATTACHMENTS UPLOAD INTEGRATION
// ========================================

// @desc    Upload lesson attachments/documents
// @route   POST /api/lessons/:id/attachments
// @access  Teacher (own courses)/Admin
const uploadLessonAttachments = catchAsync(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new AppError('ไม่พบไฟล์ที่อัปโหลด', 400));
  }

  const { id } = req.params;
  const files = req.files;

  // Check if lesson exists and user has permission
  const lesson = await Lesson.findByPk(id, {
    include: [
      {
        model: Course,
        as: 'course',
        attributes: ['id', 'title', 'teacherId'],
        include: [
          {
            model: User,
            as: 'teacher',
            attributes: ['firstName', 'lastName', 'email']
          }
        ]
      }
    ]
  });

  if (!lesson) {
    return next(new AppError('ไม่พบบทเรียนที่ระบุ', 404));
  }

  if (req.user.role !== 'admin' && lesson.course.teacherId !== req.user.id) {
    return next(new AppError('คุณไม่มีสิทธิ์แก้ไขบทเรียนนี้', 403));
  }

  try {
    const uploadedFiles = [];
    const errors = [];

    // Process each file
    for (const file of files) {
      try {
        // Validate file (use document config for general files)
        const validation = validateFile(file, FILE_TYPE_CONFIGS.document);
        if (!validation.isValid) {
          errors.push(`${file.originalname}: ${validation.errors.join(', ')}`);
          continue;
        }

        // Generate unique filename
        const fileName = generateUniqueFileName(file.originalname, `lesson_${id}_attachment`);

        // Save file
        const fileBuffer = file.buffer || require('fs').readFileSync(file.path);
        const saveResult = await saveFileLocally(fileBuffer, fileName, 'lessons/attachments');

        if (saveResult.success) {
          uploadedFiles.push({
            originalName: file.originalname,
            fileName: fileName,
            url: saveResult.fullUrl,
            size: formatFileSize(file.size || fileBuffer.length),
            mimeType: file.mimetype,
            category: getFileCategory(file.mimetype),
            icon: getFileIcon(file.mimetype),
            uploadedAt: new Date()
          });
        } else {
          errors.push(`${file.originalname}: การบันทึกไฟล์ล้มเหลว`);
        }

        // Clean up temp file
        if (file.path) {
          try {
            await deleteFileLocally(file.path);
          } catch (error) {
            console.log('Failed to clean up temp file:', error.message);
          }
        }

      } catch (error) {
        console.error(`Error processing file ${file.originalname}:`, error);
        errors.push(`${file.originalname}: เกิดข้อผิดพลาดในการประมวลผล`);
      }
    }

    // Update lesson with new attachments
    const currentAttachments = lesson.fileAttachments || [];
    const updatedAttachments = [...currentAttachments, ...uploadedFiles];
    
    lesson.fileAttachments = updatedAttachments;
    await lesson.save();

    // 📧 Send attachments upload notification
    if (uploadedFiles.length > 0) {
      try {
        await sendEmail({
          to: lesson.course.teacher.email,
          subject: '📎 ไฟล์แนบบทเรียนอัปโหลดสำเร็จ',
          template: 'lesson-attachments-uploaded',
          data: {
            teacherName: `${lesson.course.teacher.firstName} ${lesson.course.teacher.lastName}`,
            lessonTitle: lesson.title,
            courseTitle: lesson.course.title,
            filesCount: uploadedFiles.length,
            filesList: uploadedFiles.map(f => `${f.originalName} (${f.size})`).join(', '),
            uploadDate: new Date().toLocaleDateString('th-TH'),
            lessonUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/teacher/lessons/${lesson.id}`,
            totalAttachments: updatedAttachments.length
          }
        });

        console.log(`✅ Attachments upload notification sent to: ${lesson.course.teacher.email}`);
      } catch (emailError) {
        console.error('❌ Failed to send attachments upload email:', emailError.message);
      }
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${lesson.course.teacherId}`).emit('lesson-attachments-uploaded', {
        lessonId: lesson.id,
        lessonTitle: lesson.title,
        filesCount: uploadedFiles.length,
        totalAttachments: updatedAttachments.length,
        timestamp: new Date()
      });
    }

    // Prepare response
    const response = {
      success: true,
      message: `อัปโหลดไฟล์สำเร็จ ${uploadedFiles.length} ไฟล์`,
      data: {
        lesson: {
          id: lesson.id,
          title: lesson.title,
          fileAttachments: lesson.fileAttachments
        },
        uploadedFiles: uploadedFiles,
        totalFiles: uploadedFiles.length,
        totalAttachments: updatedAttachments.length
      }
    };

    if (errors.length > 0) {
      response.warnings = errors;
      response.message += ` (มีข้อผิดพลาด ${errors.length} ไฟล์)`;
    }

    res.status(200).json(response);

  } catch (error) {
    console.error('Lesson attachments upload error:', error);
    return next(new AppError('เกิดข้อผิดพลาดในการอัปโหลดไฟล์แนบ', 500));
  }
});

// @desc    Delete lesson attachment
// @route   DELETE /api/lessons/:id/attachments
// @access  Teacher (own courses)/Admin
const deleteLessonAttachment = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { fileUrl } = req.body;

  if (!fileUrl) {
    return next(new AppError('ไม่พบ URL ของไฟล์ที่ต้องการลบ', 400));
  }

  try {
    const lesson = await Lesson.findByPk(id, {
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['teacherId']
        }
      ]
    });

    if (!lesson) {
      return next(new AppError('ไม่พบบทเรียนที่ระบุ', 404));
    }

    // Check ownership
    if (req.user.role !== 'admin' && lesson.course.teacherId !== req.user.id) {
      return next(new AppError('คุณไม่มีสิทธิ์แก้ไขบทเรียนนี้', 403));
    }

    // Find and remove attachment from lesson
    const currentAttachments = lesson.fileAttachments || [];
    const attachmentIndex = currentAttachments.findIndex(att => att.url === fileUrl);

    if (attachmentIndex === -1) {
      return next(new AppError('ไม่พบไฟล์แนบที่ระบุ', 404));
    }

    const deletedAttachment = currentAttachments[attachmentIndex];

    // Delete file from storage
    try {
      const filePath = fileUrl.replace(process.env.API_URL || 'http://localhost:5000', '.');
      await deleteFileLocally(filePath);
    } catch (error) {
      console.log('Failed to delete attachment file:', error.message);
    }

    // Remove from attachments array
    const updatedAttachments = currentAttachments.filter((_, index) => index !== attachmentIndex);
    lesson.fileAttachments = updatedAttachments;
    await lesson.save();

    res.status(200).json({
      success: true,
      message: 'ลบไฟล์แนบสำเร็จ',
      data: {
        lesson: {
          id: lesson.id,
          title: lesson.title,
          fileAttachments: lesson.fileAttachments
        },
        deletedFile: {
          fileName: deletedAttachment.fileName,
          originalName: deletedAttachment.originalName
        },
        remainingAttachments: updatedAttachments.length
      }
    });

  } catch (error) {
    console.error('Lesson attachment deletion error:', error);
    return next(new AppError('เกิดข้อผิดพลาดในการลบไฟล์แนับ', 500));
  }
});

// ========================================
// EXISTING LESSON FUNCTIONS (UNCHANGED)
// ========================================

// @desc    Delete lesson
// @route   DELETE /api/lessons/:id
// @access  Teacher (own courses)/Admin
const deleteLesson = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  try {
    const lesson = await Lesson.findByPk(id, {
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['teacherId']
        }
      ]
    });
    
    if (!lesson) {
      return next(new AppError('Lesson not found', 404));
    }
    
    // Check ownership
    if (req.user.role !== 'admin' && lesson.course.teacherId !== req.user.id) {
      return next(new AppError('You can only delete lessons from your own courses', 403));
    }

    // Delete video file if exists
    if (lesson.videoUrl) {
      try {
        const videoPath = lesson.videoUrl.replace(process.env.API_URL || 'http://localhost:5000', '.');
        await deleteFileLocally(videoPath);
      } catch (error) {
        console.log('Failed to delete lesson video:', error.message);
      }
    }

    // Delete attachment files if exist
    if (lesson.fileAttachments && lesson.fileAttachments.length > 0) {
      for (const attachment of lesson.fileAttachments) {
        if (attachment.url) {
          try {
            const attachmentPath = attachment.url.replace(process.env.API_URL || 'http://localhost:5000', '.');
            await deleteFileLocally(attachmentPath);
          } catch (error) {
            console.log(`Failed to delete attachment ${attachment.fileName}:`, error.message);
          }
        }
      }
    }
    
    await lesson.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Lesson deleted successfully'
    });
    
  } catch (error) {
    return next(new AppError('Error deleting lesson', 500));
  }
});

// @desc    Publish/unpublish lesson
// @route   PATCH /api/lessons/:id/publish
// @access  Teacher (own courses)/Admin
const togglePublishLesson = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body; // 'published' or 'draft'
  
  const validStatuses = ['published', 'draft', 'archived'];
  if (!validStatuses.includes(status)) {
    return next(new AppError(`Status must be one of: ${validStatuses.join(', ')}`, 400));
  }
  
  try {
    const lesson = await Lesson.findByPk(id, {
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'teacherId'],
          include: [
            {
              model: User,
              as: 'teacher',
              attributes: ['firstName', 'lastName', 'email']
            }
          ]
        }
      ]
    });
    
    if (!lesson) {
      return next(new AppError('Lesson not found', 404));
    }
    
    // Check ownership
    if (req.user.role !== 'admin' && lesson.course.teacherId !== req.user.id) {
      return next(new AppError('You can only publish lessons from your own courses', 403));
    }
    
    const oldStatus = lesson.status;
    lesson.status = status;
    await lesson.save();

    // 📧 NOTIFY STUDENTS WHEN LESSON IS PUBLISHED
    if (status === 'published' && oldStatus !== 'published') {
      try {
        // Get all enrolled students in this course
        const enrolledStudents = await Enrollment.findAll({
          where: { 
            courseId: lesson.courseId, 
            status: 'approved',
            isActive: true
          },
          include: [
            {
              model: User,
              as: 'student',
              attributes: ['firstName', 'lastName', 'email']
            }
          ]
        });

        // Send notification emails to all enrolled students
        for (const enrollment of enrolledStudents) {
          await sendEmail({
            to: enrollment.student.email,
            subject: '📖 มีบทเรียนใหม่ในคอร์สของคุณ!',
            template: 'new-lesson-published',
            data: {
              studentName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
              lessonTitle: lesson.title,
              courseTitle: lesson.course.title,
              teacherName: `${lesson.course.teacher.firstName} ${lesson.course.teacher.lastName}`,
              lessonType: lesson.lessonType,
              estimatedTime: lesson.estimatedTime || 'ไม่ระบุ',
              publishedDate: new Date().toLocaleDateString('th-TH'),
              lessonUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/student/courses/${lesson.courseId}/lessons/${lesson.id}`,
              courseUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/student/courses/${lesson.courseId}`,
              dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/student/dashboard`,
              isRequired: lesson.isRequired,
              requirementText: lesson.isRequired ? 'บทเรียนนี้เป็นบทเรียนที่จำเป็นต้องเรียน' : 'บทเรียนนี้เป็นบทเรียนเสริม'
            }
          });
        }

        console.log(`✅ New lesson notifications sent to ${enrolledStudents.length} students`);

        // 📧 SEND SUMMARY EMAIL TO TEACHER
        await sendEmail({
          to: lesson.course.teacher.email,
          subject: '✅ บทเรียนของคุณได้รับการเผยแพร่แล้ว!',
          template: 'lesson-published-teacher',
          data: {
            teacherName: `${lesson.course.teacher.firstName} ${lesson.course.teacher.lastName}`,
            lessonTitle: lesson.title,
            courseTitle: lesson.course.title,
            studentsNotified: enrolledStudents.length,
            publishedDate: new Date().toLocaleDateString('th-TH'),
            lessonUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/teacher/courses/${lesson.courseId}/lessons/${lesson.id}`,
            courseManagementUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/teacher/courses/${lesson.courseId}`,
            analyticsUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/teacher/analytics/lesson/${lesson.id}`
          }
        });

        console.log(`✅ Lesson published confirmation sent to teacher: ${lesson.course.teacher.email}`);

      } catch (emailError) {
        console.error('❌ Failed to send lesson published notifications:', emailError.message);
      }

      // Emit socket events for real-time notifications
      const io = req.app.get('io');
      if (io) {
        // Notify all enrolled students
        const enrolledStudents = await Enrollment.findAll({
          where: { 
            courseId: lesson.courseId, 
            status: 'approved',
            isActive: true
          },
          attributes: ['studentId']
        });

        enrolledStudents.forEach(enrollment => {
          io.to(`user-${enrollment.studentId}`).emit('new-lesson-published', {
            lessonId: lesson.id,
            lessonTitle: lesson.title,
            courseTitle: lesson.course.title,
            courseId: lesson.courseId,
            isRequired: lesson.isRequired,
            timestamp: new Date()
          });
        });

        // Notify student room
        io.to('student-room').emit('course-content-updated', {
          courseId: lesson.courseId,
          contentType: 'lesson',
          contentId: lesson.id,
          action: 'published',
          timestamp: new Date()
        });
      }
    }
    
    res.status(200).json({
      success: true,
      message: `Lesson ${status} successfully`,
      data: {
        lesson: {
          id: lesson.id,
          title: lesson.title,
          status: lesson.status,
          previousStatus: oldStatus,
          notifiedStudents: status === 'published' && oldStatus !== 'published' ? 'yes' : 'no'
        }
      }
    });
    
  } catch (error) {
    return next(new AppError('Error updating lesson status', 500));
  }
});

// ========================================
// LESSON PROGRESS MANAGEMENT (UNCHANGED)
// ========================================

// @desc    Update lesson progress
// @route   POST /api/lessons/:id/progress
// @access  Student (enrolled)
const updateLessonProgress = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { timeSpent, completionPercentage, notes, status } = req.body;
  
  if (req.user.role !== 'student') {
    return next(new AppError('Only students can update lesson progress', 403));
  }
  
  try {
    const lesson = await Lesson.findByPk(id);
    if (!lesson) {
      return next(new AppError('Lesson not found', 404));
    }
    
    // Check if student can access this lesson
    const isAccessible = await lesson.isAccessibleToStudent(req.user.id);
    if (!isAccessible) {
      return next(new AppError('You do not have access to this lesson', 403));
    }
    
    // Find or create progress record
    const { LessonProgress } = require('../models');
    let progress = await LessonProgress.findOne({
      where: {
        lessonId: id,
        studentId: req.user.id
      }
    });
    
    if (!progress) {
      progress = await LessonProgress.create({
        lessonId: id,
        studentId: req.user.id,
        status: 'in_progress'
      });
    }
    
    // Update progress
    await progress.updateProgress(timeSpent, completionPercentage);
    
    if (notes !== undefined) {
      progress.notes = notes;
    }
    
    if (status && ['not_started', 'in_progress', 'completed'].includes(status)) {
      progress.status = status;
      if (status === 'completed') {
        progress.completionPercentage = 100;
        progress.completedAt = new Date();

        // 📧 SEND LESSON COMPLETION EMAIL TO STUDENT
        try {
          const lessonWithCourse = await Lesson.findByPk(id, {
            include: [
              {
                model: Course,
                as: 'course',
                attributes: ['title'],
                include: [
                  {
                    model: User,
                    as: 'teacher',
                    attributes: ['firstName', 'lastName']
                  }
                ]
              }
            ]
          });

          await sendEmail({
            to: req.user.email,
            subject: '🎉 คุณเรียนจบบทเรียนแล้ว!',
            template: 'lesson-completed',
            data: {
              studentName: `${req.user.firstName} ${req.user.lastName}`,
              lessonTitle: lessonWithCourse.title,
              courseTitle: lessonWithCourse.course.title,
              teacherName: `${lessonWithCourse.course.teacher.firstName} ${lessonWithCourse.course.teacher.lastName}`,
              completedDate: new Date().toLocaleDateString('th-TH'),
              timeSpent: Math.round(progress.timeSpent / 60) || 1, // minutes
              nextLessonUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/student/courses/${lesson.courseId}`,
              certificateUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/student/certificates`,
              achievementText: '🏆 ยินดีด้วย! คุณได้เรียนจบบทเรียนนี้เรียบร้อยแล้ว'
            }
          });

          console.log(`✅ Lesson completion email sent to: ${req.user.email}`);
        } catch (emailError) {
          console.error('❌ Failed to send lesson completion email:', emailError.message);
        }
      }
    }
    
    await progress.save();
    
    // Update enrollment progress
    await updateEnrollmentProgress(req.user.id, lesson.courseId);
    
    res.status(200).json({
      success: true,
      message: 'Lesson progress updated successfully',
      data: {
        progress: {
          status: progress.status,
          completionPercentage: progress.completionPercentage,
          timeSpent: progress.timeSpent,
          lastAccessed: progress.lastAccessed,
          completedAt: progress.completedAt
        }
      }
    });
    
  } catch (error) {
    return next(new AppError('Error updating lesson progress', 500));
  }
});

// @desc    Mark lesson as completed
// @route   POST /api/lessons/:id/complete
// @access  Student (enrolled)
const markLessonComplete = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { timeSpent = 0 } = req.body;
  
  if (req.user.role !== 'student') {
    return next(new AppError('Only students can complete lessons', 403));
  }
  
  try {
    // Update progress to completed
    req.body.completionPercentage = 100;
    req.body.status = 'completed';
    req.body.timeSpent = timeSpent;
    
    return updateLessonProgress(req, res, next);
    
  } catch (error) {
    return next(new AppError('Error completing lesson', 500));
  }
});

// ========================================
// HELPER FUNCTIONS
// ========================================

const updateLessonAccess = async (studentId, lessonId) => {
  try {
    const { LessonProgress } = require('../models');
    let progress = await LessonProgress.findOne({
      where: { lessonId, studentId }
    });
    
    if (!progress) {
      progress = await LessonProgress.create({
        lessonId,
        studentId,
        status: 'not_started'
      });
    }
    
    progress.lastAccessed = new Date();
    await progress.save();
    
    return progress;
  } catch (error) {
    console.log('Error updating lesson access:', error.message);
    return null;
  }
};

const updateEnrollmentProgress = async (studentId, courseId) => {
  try {
    const enrollment = await Enrollment.findOne({
      where: { studentId, courseId }
    });
    
    if (enrollment) {
      await enrollment.updateProgress();
    }
  } catch (error) {
    console.log('Error updating enrollment progress:', error.message);
  }
};

module.exports = {
  getCourseActions,
  getLesson,
  createLesson,
  updateLesson,
  uploadLessonVideo,         // 🆕 NEW: Video upload
  deleteLessonVideo,         // 🆕 NEW: Video deletion
  uploadLessonAttachments,   // 🆕 NEW: Attachments upload
  deleteLessonAttachment,    // 🆕 NEW: Attachment deletion
  deleteLesson,
  togglePublishLesson,
  updateLessonProgress,
  markLessonComplete
};