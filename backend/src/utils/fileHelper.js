// File: backend/src/utils/fileHelper.js
// Path: backend/src/utils/fileHelper.js

const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

// ========================================
// FILE VALIDATION FUNCTIONS
// ========================================

/**
 * Validate file type by MIME type and extension
 */
const validateFileType = (file, allowedTypes, allowedExtensions = []) => {
  const mimeType = file.mimetype;
  const extension = path.extname(file.originalname).toLowerCase();
  
  const isMimeTypeAllowed = allowedTypes.includes(mimeType);
  const isExtensionAllowed = allowedExtensions.length === 0 || allowedExtensions.includes(extension);
  
  return {
    isValid: isMimeTypeAllowed && isExtensionAllowed,
    mimeType,
    extension,
    error: !isMimeTypeAllowed ? 'Invalid file type' : !isExtensionAllowed ? 'Invalid file extension' : null
  };
};

/**
 * Validate file size
 */
const validateFileSize = (file, maxSizeInBytes) => {
  const fileSize = file.size || (file.buffer ? file.buffer.length : 0);
  const isValid = fileSize <= maxSizeInBytes;
  
  return {
    isValid,
    fileSize,
    maxSize: maxSizeInBytes,
    error: !isValid ? `File size (${formatFileSize(fileSize)}) exceeds maximum allowed size (${formatFileSize(maxSizeInBytes)})` : null
  };
};

/**
 * Comprehensive file validation
 */
const validateFile = (file, options = {}) => {
  const {
    allowedTypes = [],
    allowedExtensions = [],
    maxSize = 10 * 1024 * 1024, // 10MB default
    minSize = 0
  } = options;
  
  const errors = [];
  
  // Check if file exists
  if (!file) {
    return { isValid: false, errors: ['No file provided'] };
  }
  
  // Type validation
  if (allowedTypes.length > 0) {
    const typeValidation = validateFileType(file, allowedTypes, allowedExtensions);
    if (!typeValidation.isValid) {
      errors.push(typeValidation.error);
    }
  }
  
  // Size validation
  const sizeValidation = validateFileSize(file, maxSize);
  if (!sizeValidation.isValid) {
    errors.push(sizeValidation.error);
  }
  
  const fileSize = file.size || (file.buffer ? file.buffer.length : 0);
  if (fileSize < minSize) {
    errors.push(`File size is too small. Minimum size: ${formatFileSize(minSize)}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    fileInfo: {
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: fileSize,
      extension: path.extname(file.originalname).toLowerCase()
    }
  };
};

// ========================================
// FILE PROCESSING FUNCTIONS
// ========================================

/**
 * Process and resize image using Sharp
 */
const processImage = async (inputBuffer, options = {}) => {
  const {
    width = null,
    height = null,
    quality = 85,
    format = 'jpeg',
    fit = 'cover',
    generateThumbnail = false,
    thumbnailSize = 300
  } = options;
  
  try {
    let sharpInstance = sharp(inputBuffer);
    
    // Get image metadata
    const metadata = await sharpInstance.metadata();
    
    // Resize if dimensions specified
    if (width || height) {
      sharpInstance = sharpInstance.resize(width, height, { fit });
    }
    
    // Convert format and set quality
    if (format === 'jpeg') {
      sharpInstance = sharpInstance.jpeg({ quality });
    } else if (format === 'png') {
      sharpInstance = sharpInstance.png({ quality });
    } else if (format === 'webp') {
      sharpInstance = sharpInstance.webp({ quality });
    }
    
    const processedBuffer = await sharpInstance.toBuffer();
    
    let thumbnail = null;
    if (generateThumbnail) {
      thumbnail = await sharp(inputBuffer)
        .resize(thumbnailSize, thumbnailSize, { fit: 'cover' })
        .jpeg({ quality: 70 })
        .toBuffer();
    }
    
    return {
      success: true,
      processedBuffer,
      thumbnail,
      originalMetadata: metadata,
      processedSize: processedBuffer.length
    };
    
  } catch (error) {
    console.error('Image processing error:', error);
    return {
      success: false,
      error: error.message,
      originalBuffer: inputBuffer
    };
  }
};

/**
 * Generate unique filename
 */
const generateUniqueFileName = (originalName, prefix = '') => {
  const extension = path.extname(originalName).toLowerCase();
  const baseName = path.basename(originalName, extension);
  const timestamp = Date.now();
  const uuid = uuidv4().substring(0, 8);
  
  const cleanBaseName = baseName
    .replace(/[^a-zA-Z0-9\-_]/g, '_')
    .substring(0, 50);
  
  return `${prefix}${prefix ? '_' : ''}${cleanBaseName}_${timestamp}_${uuid}${extension}`;
};

/**
 * Get file category based on MIME type
 */
const getFileCategory = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'spreadsheet';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return 'archive';
  if (mimeType.includes('text')) return 'text';
  return 'other';
};

/**
 * Format file size to human readable format
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get file icon based on file type
 */
const getFileIcon = (mimeType) => {
  const category = getFileCategory(mimeType);
  
  const icons = {
    image: '🖼️',
    video: '🎥',
    audio: '🎵',
    pdf: '📄',
    document: '📝',
    spreadsheet: '📊',
    presentation: '📋',
    archive: '📦',
    text: '📃',
    other: '📎'
  };
  
  return icons[category] || '📎';
};

// ========================================
// FILE SYSTEM HELPERS
// ========================================

/**
 * Ensure directory exists
 */
const ensureDirectoryExists = async (dirPath) => {
  try {
    await fs.access(dirPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(dirPath, { recursive: true });
      console.log(`📁 Created directory: ${dirPath}`);
    } else {
      throw error;
    }
  }
};

/**
 * Save file to local storage
 */
const saveFileLocally = async (buffer, fileName, subDirectory = '') => {
  try {
    const uploadDir = path.join('./uploads', subDirectory);
    await ensureDirectoryExists(uploadDir);
    
    const filePath = path.join(uploadDir, fileName);
    await fs.writeFile(filePath, buffer);
    
    return {
      success: true,
      filePath,
      relativePath: path.join('uploads', subDirectory, fileName).replace(/\\/g, '/'),
      fullUrl: `${process.env.API_URL || 'http://localhost:5000'}/${path.join('uploads', subDirectory, fileName).replace(/\\/g, '/')}`
    };
  } catch (error) {
    console.error('Error saving file locally:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete file from local storage
 */
const deleteFileLocally = async (filePath) => {
  try {
    await fs.unlink(filePath);
    console.log(`🗑️ Deleted file: ${filePath}`);
    return { success: true };
  } catch (error) {
    console.error('Error deleting file:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get file info from path
 */
const getFileInfo = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);
    const extension = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath);
    
    return {
      exists: true,
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      extension,
      fileName,
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile()
    };
  } catch (error) {
    return {
      exists: false,
      error: error.message
    };
  }
};

// ========================================
// FILE CLEANUP FUNCTIONS
// ========================================

/**
 * Clean up old temporary files
 */
const cleanupTempFiles = async (tempDir = './uploads/temp', maxAgeHours = 24) => {
  try {
    const files = await fs.readdir(tempDir);
    const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds
    const now = Date.now();
    
    let deletedCount = 0;
    
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      const fileInfo = await getFileInfo(filePath);
      
      if (fileInfo.exists && fileInfo.isFile) {
        const fileAge = now - fileInfo.modifiedAt.getTime();
        
        if (fileAge > maxAge) {
          await deleteFileLocally(filePath);
          deletedCount++;
        }
      }
    }
    
    console.log(`🧹 Cleaned up ${deletedCount} temporary files`);
    return { success: true, deletedCount };
    
  } catch (error) {
    console.error('Error cleaning up temp files:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get directory size
 */
const getDirectorySize = async (dirPath) => {
  try {
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    let totalSize = 0;
    let fileCount = 0;
    
    for (const file of files) {
      const filePath = path.join(dirPath, file.name);
      
      if (file.isDirectory()) {
        const subDirSize = await getDirectorySize(filePath);
        totalSize += subDirSize.size;
        fileCount += subDirSize.fileCount;
      } else {
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
        fileCount++;
      }
    }
    
    return {
      size: totalSize,
      fileCount,
      formattedSize: formatFileSize(totalSize)
    };
  } catch (error) {
    return {
      size: 0,
      fileCount: 0,
      formattedSize: '0 Bytes',
      error: error.message
    };
  }
};

// ========================================
// FILE TYPE CONFIGURATIONS
// ========================================

const FILE_TYPE_CONFIGS = {
  profile: {
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
    processImage: true,
    dimensions: { width: 400, height: 400 },
    generateThumbnail: true
  },
  
  courseThumbnail: {
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    maxSize: 10 * 1024 * 1024, // 10MB
    processImage: true,
    dimensions: { width: 800, height: 450 },
    generateThumbnail: true
  },
  
  lessonVideo: {
    allowedTypes: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
    maxSize: 500 * 1024 * 1024, // 500MB
    processImage: false
  },
  
  document: {
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ],
    maxSize: 50 * 1024 * 1024, // 50MB
    processImage: false
  },
  
  csv: {
    allowedTypes: ['text/csv', 'application/vnd.ms-excel'],
    allowedExtensions: ['.csv'],
    maxSize: 10 * 1024 * 1024, // 10MB
    processImage: false
  }
};

// ========================================
// EXPORTS
// ========================================

module.exports = {
  // Validation functions
  validateFileType,
  validateFileSize,
  validateFile,
  
  // Processing functions
  processImage,
  generateUniqueFileName,
  getFileCategory,
  getFileIcon,
  formatFileSize,
  
  // File system helpers
  ensureDirectoryExists,
  saveFileLocally,
  deleteFileLocally,
  getFileInfo,
  
  // Cleanup functions
  cleanupTempFiles,
  getDirectorySize,
  
  // Configuration
  FILE_TYPE_CONFIGS
};