// File: backend/src/controllers/upload.js
// Path: backend/src/controllers/upload.js

const { User, Course, Lesson } = require('../models');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { sendEmail } = require('../utils/emailService');
const { 
  processImage, 
  generateUniqueFileName, 
  formatFileSize, 
  getFileCategory,
  getFileIcon,
  saveFileLocally,
  deleteFileLocally,
  validateFile,
  FILE_TYPE_CONFIGS
} = require('../utils/fileHelper');
const { uploadFile, deleteFile, getFileUrl } = require('../config/storage');
const Papa = require('papaparse');

// ========================================
// PROFILE PHOTO UPLOAD
// ========================================

// @desc    Upload user profile photo
// @route   POST /api/upload/profile
// @access  Private
const uploadProfilePhoto = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('ไม่พบไฟล์รูปภาพที่อัปโหลด', 400));
  }

  const userId = req.user.id;
  const file = req.file;

  // Validate file
  const validation = validateFile(file, FILE_TYPE_CONFIGS.profile);
  if (!validation.isValid) {
    return next(new AppError(validation.errors.join(', '), 400));
  }

  try {
    // Process image
    const imageBuffer = file.buffer || require('fs').readFileSync(file.path);
    const processResult = await processImage(imageBuffer, {
      width: 400,
      height: 400,
      quality: 85,
      format: 'jpeg',
      generateThumbnail: true,
      thumbnailSize: 150
    });

    if (!processResult.success) {
      return next(new AppError('เกิดข้อผิดพลาดในการประมวลผลรูปภาพ', 500));
    }

    // Generate unique filename
    const fileName = generateUniqueFileName(file.originalname, 'profile');
    const thumbnailName = generateUniqueFileName(file.originalname, 'profile_thumb');

    // Save processed image
    const saveResult = await saveFileLocally(processResult.processedBuffer, fileName, 'profiles');
    if (!saveResult.success) {
      return next(new AppError('เกิดข้อผิดพลาดในการบันทึกรูปภาพ', 500));
    }

    // Save thumbnail
    let thumbnailUrl = null;
    if (processResult.thumbnail) {
      const thumbnailResult = await saveFileLocally(processResult.thumbnail, thumbnailName, 'profiles/thumbnails');
      if (thumbnailResult.success) {
        thumbnailUrl = thumbnailResult.fullUrl;
      }
    }

    // Update user profile
    const user = await User.findByPk(userId);
    if (!user) {
      return next(new AppError('ไม่พบผู้ใช้', 404));
    }

    // Delete old profile photo if exists
    if (user.profilePhoto && user.profilePhoto !== saveResult.fullUrl) {
      try {
        const oldPath = user.profilePhoto.replace(process.env.API_URL || 'http://localhost:5000', '.');
        await deleteFileLocally(oldPath);
      } catch (error) {
        console.log('Failed to delete old profile photo:', error.message);
      }
    }

    // Update user with new photo URL
    user.profilePhoto = saveResult.fullUrl;
    user.profileThumbnail = thumbnailUrl;
    await user.save();

    // Clean up temp file if using local storage
    if (file.path) {
      try {
        await deleteFileLocally(file.path);
      } catch (error) {
        console.log('Failed to clean up temp file:', error.message);
      }
    }

    // 📧 Send profile update notification
    try {
      await sendEmail({
        to: user.email,
        subject: '📸 รูปโปรไฟล์ของคุณอัปเดตแล้ว',
        template: 'profile-photo-updated',
        data: {
          firstName: user.firstName,
          lastName: user.lastName,
          updateDate: new Date().toLocaleDateString('th-TH'),
          profileUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile`,
          photoUrl: saveResult.fullUrl
        }
      });

      console.log(`✅ Profile photo update email sent to: ${user.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send profile update email:', emailError.message);
    }

    res.status(200).json({
      success: true,
      message: 'อัปโหลดรูปโปรไฟล์สำเร็จ',
      data: {
        user: {
          id: user.id,
          profilePhoto: user.profilePhoto,
          profileThumbnail: user.profileThumbnail
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
    console.error('Profile photo upload error:', error);
    return next(new AppError('เกิดข้อผิดพลาดในการอัปโหลดรูปโปรไฟล์', 500));
  }
});

// ========================================
// COURSE THUMBNAIL UPLOAD
// ========================================

// @desc    Upload course thumbnail
// @route   POST /api/upload/course/:courseId/thumbnail
// @access  Teacher/Admin
const uploadCourseThumbnail = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('ไม่พบไฟล์รูปภาพที่อัปโหลด', 400));
  }

  const { courseId } = req.params;
  const file = req.file;

  // Check if course exists and user has permission
  const course = await Course.findByPk(courseId);
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
    const fileName = generateUniqueFileName(file.originalname, `course_${courseId}`);
    const thumbnailName = generateUniqueFileName(file.originalname, `course_${courseId}_thumb`);

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

// ========================================
// LESSON VIDEO UPLOAD
// ========================================

// @desc    Upload lesson video
// @route   POST /api/upload/lesson/:lessonId/video
// @access  Teacher/Admin
const uploadLessonVideo = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('ไม่พบไฟล์วิดีโอที่อัปโหลด', 400));
  }

  const { lessonId } = req.params;
  const file = req.file;

  // Check if lesson exists and user has permission
  const lesson = await Lesson.findByPk(lessonId, {
    include: [
      {
        model: Course,
        as: 'course',
        attributes: ['id', 'title', 'teacherId']
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
    const fileName = generateUniqueFileName(file.originalname, `lesson_${lessonId}_video`);

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

// ========================================
// LESSON ATTACHMENTS UPLOAD
// ========================================

// @desc    Upload lesson attachments/documents
// @route   POST /api/upload/lesson/:lessonId/attachments
// @access  Teacher/Admin
const uploadLessonAttachments = catchAsync(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new AppError('ไม่พบไฟล์ที่อัปโหลด', 400));
  }

  const { lessonId } = req.params;
  const files = req.files;

  // Check if lesson exists and user has permission
  const lesson = await Lesson.findByPk(lessonId, {
    include: [
      {
        model: Course,
        as: 'course',
        attributes: ['id', 'title', 'teacherId']
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
        // Validate file
        const validation = validateFile(file, FILE_TYPE_CONFIGS.document);
        if (!validation.isValid) {
          errors.push(`${file.originalname}: ${validation.errors.join(', ')}`);
          continue;
        }

        // Generate unique filename
        const fileName = generateUniqueFileName(file.originalname, `lesson_${lessonId}_doc`);

        // Save file
        const fileBuffer = file.buffer || require('fs').readFileSync(file.path);
        const saveResult = await saveFileLocally(fileBuffer, fileName, 'lessons/documents');

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
        totalFiles: uploadedFiles.length
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

// ========================================
// QUIZ CSV IMPORT
// ========================================

// @desc    Import quiz questions from CSV
// @route   POST /api/upload/quiz/:quizId/import
// @access  Teacher/Admin
const importQuizCSV = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new AppError('ไม่พบไฟล์ CSV ที่อัปโหลด', 400));
  }

  const { quizId } = req.params;
  const file = req.file;

  // Check if quiz exists and user has permission
  const { Quiz } = require('../models');
  const quiz = await Quiz.findByPk(quizId, {
    include: [
      {
        model: Course,
        as: 'course',
        attributes: ['id', 'title', 'teacherId']
      }
    ]
  });

  if (!quiz) {
    return next(new AppError('ไม่พบแบบทดสอบที่ระบุ', 404));
  }

  if (req.user.role !== 'admin' && quiz.course.teacherId !== req.user.id) {
    return next(new AppError('คุณไม่มีสิทธิ์แก้ไขแบบทดสอบนี้', 403));
  }

  try {
    // Read CSV file
    const csvContent = file.buffer ? file.buffer.toString('utf8') : require('fs').readFileSync(file.path, 'utf8');
    
    // Parse CSV
    const parseResult = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      transformHeader: (header) => header.trim().toLowerCase()
    });

    if (parseResult.errors.length > 0) {
      return next(new AppError('ไฟล์ CSV มีรูปแบบไม่ถูกต้อง', 400));
    }

    const csvData = parseResult.data;
    if (csvData.length === 0) {
      return next(new AppError('ไม่พบข้อมูลในไฟล์ CSV', 400));
    }

    // Validate CSV headers
    const requiredHeaders = ['question', 'type', 'correct_answer', 'points'];
    const csvHeaders = Object.keys(csvData[0]);
    const missingHeaders = requiredHeaders.filter(header => !csvHeaders.includes(header));
    
    if (missingHeaders.length > 0) {
      return next(new AppError(`ไฟล์ CSV ขาด headers: ${missingHeaders.join(', ')}`, 400));
    }

    // Process questions
    const questions = [];
    const errors = [];

    csvData.forEach((row, index) => {
      try {
        const lineNumber = index + 2; // +2 because index starts at 0 and we have headers

        // Validate required fields
        if (!row.question || !row.type || !row.correct_answer) {
          errors.push(`บรรทัดที่ ${lineNumber}: ข้อมูลไม่ครบถ้วน`);
          return;
        }

        // Parse options (if exists)
        let options = [];
        if (row.options) {
          try {
            options = typeof row.options === 'string' 
              ? row.options.split('|').map(opt => opt.trim())
              : [];
          } catch (error) {
            options = [];
          }
        }

        questions.push({
          quizId: parseInt(quizId),
          questionText: row.question.trim(),
          questionType: row.type.trim().toLowerCase(),
          options: options,
          correctAnswer: row.correct_answer.toString().trim(),
          points: parseInt(row.points) || 10,
          explanation: row.explanation ? row.explanation.trim() : null,
          orderIndex: index + 1
        });

      } catch (error) {
        errors.push(`บรรทัดที่ ${index + 2}: เกิดข้อผิดพลาดในการประมวลผล`);
      }
    });

    if (errors.length > 0 && questions.length === 0) {
      return next(new AppError(`ไม่สามารถประมวลผลคำถามได้: ${errors.join(', ')}`, 400));
    }

    // Save questions to database
    const { QuizQuestion } = require('../models');
    
    // Clear existing questions if requested
    if (req.body.replaceExisting === 'true') {
      await QuizQuestion.destroy({ where: { quizId } });
    }

    // Create new questions
    const createdQuestions = await QuizQuestion.bulkCreate(questions);

    // Clean up temp file
    if (file.path) {
      try {
        await deleteFileLocally(file.path);
      } catch (error) {
        console.log('Failed to clean up temp file:', error.message);
      }
    }

    // 📧 Send import success notification to teacher
    try {
      await sendEmail({
        to: req.user.email,
        subject: '📊 การนำเข้าข้อสอบสำเร็จ',
        template: 'quiz-import-success',
        data: {
          teacherName: `${req.user.firstName} ${req.user.lastName}`,
          quizTitle: quiz.title,
          courseTitle: quiz.course.title,
          questionsImported: createdQuestions.length,
          totalQuestions: await QuizQuestion.count({ where: { quizId } }),
          errorsCount: errors.length,
          importDate: new Date().toLocaleDateString('th-TH'),
          quizUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/teacher/quizzes/${quizId}`,
          fileName: file.originalname
        }
      });

      console.log(`✅ Quiz import notification sent to: ${req.user.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send quiz import email:', emailError.message);
    }

    const response = {
      success: true,
      message: `นำเข้าคำถามสำเร็จ ${createdQuestions.length} ข้อ`,
      data: {
        quiz: {
          id: quiz.id,
          title: quiz.title
        },
        import: {
          totalRows: csvData.length,
          successfulQuestions: createdQuestions.length,
          errors: errors.length,
          fileName: file.originalname,
          fileSize: formatFileSize(file.size || csvContent.length)
        },
        questions: createdQuestions
      }
    };

    if (errors.length > 0) {
      response.warnings = errors;
    }

    res.status(200).json(response);

  } catch (error) {
    console.error('Quiz CSV import error:', error);
    return next(new AppError('เกิดข้อผิดพลาดในการนำเข้าไฟล์ CSV', 500));
  }
});

// ========================================
// FILE DELETION
// ========================================

// @desc    Delete uploaded file
// @route   DELETE /api/upload/file
// @access  Private
const deleteUploadedFile = catchAsync(async (req, res, next) => {
  const { fileUrl, fileType } = req.body;

  if (!fileUrl) {
    return next(new AppError('ไม่พบ URL ของไฟล์ที่ต้องการลบ', 400));
  }

  try {
    // Convert URL to local file path
    const filePath = fileUrl.replace(process.env.API_URL || 'http://localhost:5000', '.');
    
    // Delete file
    const deleteResult = await deleteFileLocally(filePath);
    
    if (!deleteResult.success) {
      return next(new AppError('ไม่สามารถลบไฟล์ได้', 500));
    }

    res.status(200).json({
      success: true,
      message: 'ลบไฟล์สำเร็จ',
      data: {
        deletedFile: fileUrl,
        fileType: fileType || 'unknown'
      }
    });

  } catch (error) {
    console.error('File deletion error:', error);
    return next(new AppError('เกิดข้อผิดพลาดในการลบไฟล์', 500));
  }
});

// ========================================
// FILE INFO
// ========================================

// @desc    Get file information
// @route   GET /api/upload/info
// @access  Private
const getFileInfo = catchAsync(async (req, res, next) => {
  const { fileUrl } = req.query;

  if (!fileUrl) {
    return next(new AppError('ไม่พบ URL ของไฟล์', 400));
  }

  try {
    const { getFileInfo: getFileInfoUtil } = require('../utils/fileHelper');
    const filePath = fileUrl.replace(process.env.API_URL || 'http://localhost:5000', '.');
    
    const fileInfo = await getFileInfoUtil(filePath);
    
    if (!fileInfo.exists) {
      return next(new AppError('ไม่พบไฟล์ที่ระบุ', 404));
    }

    res.status(200).json({
      success: true,
      data: {
        url: fileUrl,
        ...fileInfo,
        formattedSize: formatFileSize(fileInfo.size)
      }
    });

  } catch (error) {
    console.error('File info error:', error);
    return next(new AppError('เกิดข้อผิดพลาดในการดึงข้อมูลไฟล์', 500));
  }
});

// ========================================
// EXPORTS
// ========================================

module.exports = {
  uploadProfilePhoto,
  uploadCourseThumbnail,
  uploadLessonVideo,
  uploadLessonAttachments,
  importQuizCSV,
  deleteUploadedFile,
  getFileInfo
};