// File: backend/src/middleware/upload.js
// Path: backend/src/middleware/upload.js

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { validateFileType, validateFileSize } = require('../utils/fileHelper');
const { AppError } = require('./errorHandler');

// ========================================
// STORAGE CONFIGURATIONS
// ========================================

// Local Storage Configuration
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;
    
    switch (file.fieldname) {
      case 'profilePhoto':
        uploadPath = './uploads/profiles';
        break;
      case 'courseThumbnail':
        uploadPath = './uploads/courses';
        break;
      case 'lessonVideo':
        uploadPath = './uploads/lessons/videos';
        break;
      case 'lessonDocument':
        uploadPath = './uploads/lessons/documents';
        break;
      case 'lessonAttachment':
        uploadPath = './uploads/lessons/attachments';
        break;
      case 'quizImport':
        uploadPath = './uploads/quiz/imports';
        break;
      case 'assignmentSubmission':
        uploadPath = './uploads/assignments';
        break;
      default:
        uploadPath = './uploads/misc';
    }
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  
  filename: (req, file, cb) => {
    // Generate unique filename: uuid + timestamp + original extension
    const uniqueSuffix = uuidv4();
    const timestamp = Date.now();
    const extension = path.extname(file.originalname).toLowerCase();
    const fileName = `${uniqueSuffix}_${timestamp}${extension}`;
    
    // Store original filename for reference
    req.originalFileName = file.originalname;
    req.generatedFileName = fileName;
    
    cb(null, fileName);
  }
});

// Memory Storage (for processing before cloud upload)
const memoryStorage = multer.memoryStorage();

// ========================================
// FILE FILTERS
// ========================================

// Profile Photo Filter
const profilePhotoFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new AppError('รองรับเฉพาะไฟล์รูปภาพ (JPEG, PNG, WebP)', 400), false);
  }
  
  cb(null, true);
};

// Course Thumbnail Filter
const courseThumbnailFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new AppError('รองรับเฉพาะไฟล์รูปภาพ (JPEG, PNG, WebP)', 400), false);
  }
  
  cb(null, true);
};

// Video Filter
const videoFilter = (req, file, cb) => {
  const allowedTypes = [
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo',
    'video/webm', 'video/ogg'
  ];
  
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new AppError('รองรับเฉพาะไฟล์วิดีโอ (MP4, AVI, MOV, WebM)', 400), false);
  }
  
  cb(null, true);
};

// Document Filter
const documentFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];
  
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new AppError('รองรับเฉพาะไฟล์เอกสาร (PDF, Word, PowerPoint, Excel, Text)', 400), false);
  }
  
  cb(null, true);
};

// CSV Filter
const csvFilter = (req, file, cb) => {
  const allowedTypes = ['text/csv', 'application/vnd.ms-excel'];
  
  if (!allowedTypes.includes(file.mimetype) && !file.originalname.endsWith('.csv')) {
    return cb(new AppError('รองรับเฉพาะไฟล์ CSV', 400), false);
  }
  
  cb(null, true);
};

// General File Filter
const generalFileFilter = (req, file, cb) => {
  // Block dangerous file types
  const blockedExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (blockedExtensions.includes(fileExtension)) {
    return cb(new AppError('ประเภทไฟล์นี้ไม่ได้รับอนุญาต', 400), false);
  }
  
  cb(null, true);
};

// ========================================
// MULTER CONFIGURATIONS
// ========================================

// Profile Photo Upload
const uploadProfilePhoto = multer({
  storage: process.env.NODE_ENV === 'production' ? memoryStorage : localStorage,
  fileFilter: profilePhotoFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  }
}).single('profilePhoto');

// Course Thumbnail Upload
const uploadCourseThumbnail = multer({
  storage: process.env.NODE_ENV === 'production' ? memoryStorage : localStorage,
  fileFilter: courseThumbnailFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  }
}).single('courseThumbnail');

// Lesson Video Upload
const uploadLessonVideo = multer({
  storage: process.env.NODE_ENV === 'production' ? memoryStorage : localStorage,
  fileFilter: videoFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB
    files: 1
  }
}).single('lessonVideo');

// Lesson Documents Upload (multiple files)
const uploadLessonDocuments = multer({
  storage: process.env.NODE_ENV === 'production' ? memoryStorage : localStorage,
  fileFilter: documentFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file
    files: 10 // Max 10 files
  }
}).array('lessonDocuments', 10);

// Lesson Attachments Upload (mixed file types)
const uploadLessonAttachments = multer({
  storage: process.env.NODE_ENV === 'production' ? memoryStorage : localStorage,
  fileFilter: generalFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB per file
    files: 5 // Max 5 files
  }
}).array('lessonAttachments', 5);

// Quiz CSV Import
const uploadQuizCSV = multer({
  storage: process.env.NODE_ENV === 'production' ? memoryStorage : localStorage,
  fileFilter: csvFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 1
  }
}).single('quizImport');

// Assignment Submission Upload
const uploadAssignmentSubmission = multer({
  storage: process.env.NODE_ENV === 'production' ? memoryStorage : localStorage,
  fileFilter: generalFileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB per file
    files: 5 // Max 5 files
  }
}).array('assignmentFiles', 5);

// General Multiple Files Upload
const uploadMultipleFiles = multer({
  storage: process.env.NODE_ENV === 'production' ? memoryStorage : localStorage,
  fileFilter: generalFileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file
    files: 10 // Max 10 files
  }
}).array('files', 10);

// ========================================
// UPLOAD MIDDLEWARE WRAPPERS
// ========================================

const handleUploadError = (uploadFunction) => {
  return (req, res, next) => {
    uploadFunction(req, res, (err) => {
      if (err) {
        console.error('Upload error:', err);
        
        if (err instanceof multer.MulterError) {
          switch (err.code) {
            case 'LIMIT_FILE_SIZE':
              return next(new AppError('ไฟล์มีขนาดใหญ่เกินไป', 400));
            case 'LIMIT_FILE_COUNT':
              return next(new AppError('จำนวนไฟล์เกินที่อนุญาต', 400));
            case 'LIMIT_UNEXPECTED_FILE':
              return next(new AppError('ไฟล์ที่อัปโหลดไม่ถูกต้อง', 400));
            default:
              return next(new AppError('เกิดข้อผิดพลาดในการอัปโหลดไฟล์', 500));
          }
        }
        
        return next(err);
      }
      
      next();
    });
  };
};

// ========================================
// EXPORTED MIDDLEWARE
// ========================================

module.exports = {
  // Individual upload middleware
  uploadProfilePhoto: handleUploadError(uploadProfilePhoto),
  uploadCourseThumbnail: handleUploadError(uploadCourseThumbnail),
  uploadLessonVideo: handleUploadError(uploadLessonVideo),
  uploadLessonDocuments: handleUploadError(uploadLessonDocuments),
  uploadLessonAttachments: handleUploadError(uploadLessonAttachments),
  uploadQuizCSV: handleUploadError(uploadQuizCSV),
  uploadAssignmentSubmission: handleUploadError(uploadAssignmentSubmission),
  uploadMultipleFiles: handleUploadError(uploadMultipleFiles),
  
  // Storage configurations
  localStorage,
  memoryStorage,
  
  // File filters
  profilePhotoFilter,
  courseThumbnailFilter,
  videoFilter,
  documentFilter,
  csvFilter,
  generalFileFilter,
  
  // Error handler
  handleUploadError
};

// ========================================
// USAGE EXAMPLES:
// ========================================
/*
// Profile photo upload
app.post('/api/upload/profile', uploadProfilePhoto, uploadController.profilePhoto);

// Course thumbnail upload  
app.post('/api/upload/course/thumbnail', uploadCourseThumbnail, uploadController.courseThumbnail);

// Lesson video upload
app.post('/api/upload/lesson/video', uploadLessonVideo, uploadController.lessonVideo);

// Multiple documents upload
app.post('/api/upload/lesson/documents', uploadLessonDocuments, uploadController.lessonDocuments);

// Quiz CSV import
app.post('/api/upload/quiz/import', uploadQuizCSV, uploadController.quizImport);
*/