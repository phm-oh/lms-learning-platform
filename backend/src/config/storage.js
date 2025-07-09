// File: backend/src/config/storage.js
// Path: backend/src/config/storage.js

const path = require('path');
const fs = require('fs');

// ========================================
// STORAGE TYPES
// ========================================

const STORAGE_TYPES = {
  LOCAL: 'local',
  AWS_S3: 'aws_s3',
  GOOGLE_CLOUD: 'google_cloud',
  CLOUDINARY: 'cloudinary',
  DIGITALOCEAN_SPACES: 'digitalocean_spaces'
};

// ========================================
// DEFAULT STORAGE CONFIGURATION
// ========================================

const defaultStorageConfig = {
  // Primary storage type
  type: process.env.STORAGE_TYPE || STORAGE_TYPES.LOCAL,
  
  // Fallback storage (if primary fails)
  fallback: process.env.STORAGE_FALLBACK || STORAGE_TYPES.LOCAL,
  
  // Enable/disable storage features
  features: {
    imageProcessing: process.env.ENABLE_IMAGE_PROCESSING !== 'false',
    videoTranscoding: process.env.ENABLE_VIDEO_TRANSCODING === 'true',
    thumbnailGeneration: process.env.ENABLE_THUMBNAIL_GENERATION !== 'false',
    fileCompression: process.env.ENABLE_FILE_COMPRESSION === 'true',
    virusScanning: process.env.ENABLE_VIRUS_SCANNING === 'true'
  },
  
  // Global file size limits (in bytes)
  limits: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024, // 100MB
    maxTotalSize: parseInt(process.env.MAX_TOTAL_SIZE) || 1024 * 1024 * 1024, // 1GB per user
    maxFilesPerUpload: parseInt(process.env.MAX_FILES_PER_UPLOAD) || 10
  },
  
  // File retention policies
  retention: {
    tempFiles: parseInt(process.env.TEMP_FILE_RETENTION_HOURS) || 24, // hours
    userFiles: parseInt(process.env.USER_FILE_RETENTION_DAYS) || 365, // days
    logFiles: parseInt(process.env.LOG_FILE_RETENTION_DAYS) || 30 // days
  }
};

// ========================================
// LOCAL STORAGE CONFIGURATION
// ========================================

const localStorageConfig = {
  type: STORAGE_TYPES.LOCAL,
  
  // Base upload directory
  baseDir: process.env.UPLOAD_PATH || './uploads',
  
  // Directory structure
  directories: {
    profiles: 'profiles',
    courses: 'courses',
    lessons: {
      videos: 'lessons/videos',
      documents: 'lessons/documents',
      attachments: 'lessons/attachments'
    },
    quizzes: 'quizzes',
    assignments: 'assignments',
    temp: 'temp',
    thumbnails: 'thumbnails',
    processed: 'processed'
  },
  
  // Static file serving
  staticPath: '/uploads',
  staticOptions: {
    maxAge: '1y',
    etag: true,
    lastModified: true
  },
  
  // File permissions
  permissions: {
    files: 0o644,
    directories: 0o755
  },
  
  // Auto-create directories
  autoCreateDirs: true,
  
  // Cleanup settings
  cleanup: {
    enabled: true,
    schedule: '0 2 * * *', // Daily at 2 AM
    tempFileMaxAge: 24 * 60 * 60 * 1000, // 24 hours
    orphanedFileMaxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
};

// ========================================
// AWS S3 CONFIGURATION
// ========================================

const awsS3Config = {
  type: STORAGE_TYPES.AWS_S3,
  
  // AWS credentials
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'ap-southeast-1',
  
  // S3 bucket settings
  bucket: process.env.AWS_S3_BUCKET,
  
  // URL settings
  cloudFrontUrl: process.env.AWS_CLOUDFRONT_URL,
  useCloudFront: process.env.USE_CLOUDFRONT === 'true',
  
  // Object settings
  acl: process.env.AWS_S3_ACL || 'public-read',
  serverSideEncryption: process.env.AWS_S3_ENCRYPTION || 'AES256',
  
  // Multipart upload settings
  multipartUpload: {
    partSize: 10 * 1024 * 1024, // 10MB
    queueSize: 1
  },
  
  // File organization
  keyPrefix: process.env.AWS_S3_KEY_PREFIX || 'lms-files/',
  
  // Storage classes
  storageClass: process.env.AWS_S3_STORAGE_CLASS || 'STANDARD',
  
  // Lifecycle rules
  lifecycle: {
    enabled: true,
    tempFileExpiration: 1, // days
    oldVersionExpiration: 30 // days
  }
};

// ========================================
// GOOGLE CLOUD STORAGE CONFIGURATION
// ========================================

const googleCloudConfig = {
  type: STORAGE_TYPES.GOOGLE_CLOUD,
  
  // Authentication
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
  
  // Bucket settings
  bucket: process.env.GOOGLE_CLOUD_BUCKET,
  
  // File settings
  public: process.env.GOOGLE_CLOUD_PUBLIC === 'true',
  
  // CDN settings
  cdnUrl: process.env.GOOGLE_CLOUD_CDN_URL,
  useCdn: process.env.USE_GOOGLE_CDN === 'true',
  
  // Resumable upload settings
  resumable: {
    enabled: true,
    chunkSize: 5 * 1024 * 1024 // 5MB
  }
};

// ========================================
// CLOUDINARY CONFIGURATION
// ========================================

const cloudinaryConfig = {
  type: STORAGE_TYPES.CLOUDINARY,
  
  // Authentication
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
  
  // Upload settings
  secure: true,
  
  // Transformation settings
  transformations: {
    profile: {
      width: 400,
      height: 400,
      crop: 'fill',
      quality: 'auto:good',
      format: 'auto'
    },
    courseThumbnail: {
      width: 800,
      height: 450,
      crop: 'fill',
      quality: 'auto:best',
      format: 'auto'
    },
    thumbnail: {
      width: 300,
      height: 300,
      crop: 'fill',
      quality: 'auto:good',
      format: 'auto'
    }
  },
  
  // Video settings
  video: {
    quality: 'auto:good',
    format: 'auto'
  },
  
  // Folder organization
  folders: {
    profiles: 'lms/profiles',
    courses: 'lms/courses',
    lessons: 'lms/lessons',
    temp: 'lms/temp'
  }
};

// ========================================
// DIGITALOCEAN SPACES CONFIGURATION
// ========================================

const digitalOceanConfig = {
  type: STORAGE_TYPES.DIGITALOCEAN_SPACES,
  
  // Authentication
  accessKeyId: process.env.DO_SPACES_ACCESS_KEY,
  secretAccessKey: process.env.DO_SPACES_SECRET_KEY,
  
  // Spaces settings
  endpoint: process.env.DO_SPACES_ENDPOINT,
  bucket: process.env.DO_SPACES_BUCKET,
  region: process.env.DO_SPACES_REGION || 'sgp1',
  
  // CDN settings
  cdnUrl: process.env.DO_SPACES_CDN_URL,
  useCdn: process.env.USE_DO_CDN === 'true',
  
  // File settings
  acl: 'public-read'
};

// ========================================
// STORAGE MANAGER
// ========================================

class StorageManager {
  constructor() {
    this.config = defaultStorageConfig;
    this.activeStorage = null;
    this.fallbackStorage = null;
    
    this.initializeStorage();
  }
  
  initializeStorage() {
    try {
      // Initialize primary storage
      this.activeStorage = this.createStorageInstance(this.config.type);
      
      // Initialize fallback storage
      if (this.config.fallback && this.config.fallback !== this.config.type) {
        this.fallbackStorage = this.createStorageInstance(this.config.fallback);
      }
      
      console.log(`📦 Storage initialized: ${this.config.type}`);
      
      if (this.fallbackStorage) {
        console.log(`📦 Fallback storage ready: ${this.config.fallback}`);
      }
      
    } catch (error) {
      console.error('❌ Storage initialization failed:', error.message);
      
      // Fall back to local storage
      if (this.config.type !== STORAGE_TYPES.LOCAL) {
        console.log('🔄 Falling back to local storage...');
        this.activeStorage = this.createStorageInstance(STORAGE_TYPES.LOCAL);
      }
    }
  }
  
  createStorageInstance(type) {
    switch (type) {
      case STORAGE_TYPES.LOCAL:
        return this.initializeLocalStorage();
      case STORAGE_TYPES.AWS_S3:
        return this.initializeAwsS3();
      case STORAGE_TYPES.GOOGLE_CLOUD:
        return this.initializeGoogleCloud();
      case STORAGE_TYPES.CLOUDINARY:
        return this.initializeCloudinary();
      case STORAGE_TYPES.DIGITALOCEAN_SPACES:
        return this.initializeDigitalOcean();
      default:
        throw new Error(`Unsupported storage type: ${type}`);
    }
  }
  
  initializeLocalStorage() {
    const config = localStorageConfig;
    
    // Create directories if auto-create is enabled
    if (config.autoCreateDirs) {
      this.createLocalDirectories();
    }
    
    return {
      type: STORAGE_TYPES.LOCAL,
      config: config,
      upload: this.uploadToLocal.bind(this),
      delete: this.deleteFromLocal.bind(this),
      getUrl: this.getLocalUrl.bind(this)
    };
  }
  
  initializeAwsS3() {
    // AWS S3 implementation would go here
    // Return S3 instance with upload/delete/getUrl methods
    return {
      type: STORAGE_TYPES.AWS_S3,
      config: awsS3Config,
      upload: this.uploadToS3.bind(this),
      delete: this.deleteFromS3.bind(this),
      getUrl: this.getS3Url.bind(this)
    };
  }
  
  initializeGoogleCloud() {
    // Google Cloud implementation would go here
    return {
      type: STORAGE_TYPES.GOOGLE_CLOUD,
      config: googleCloudConfig
    };
  }
  
  initializeCloudinary() {
    // Cloudinary implementation would go here
    return {
      type: STORAGE_TYPES.CLOUDINARY,
      config: cloudinaryConfig
    };
  }
  
  initializeDigitalOcean() {
    // DigitalOcean Spaces implementation would go here
    return {
      type: STORAGE_TYPES.DIGITALOCEAN_SPACES,
      config: digitalOceanConfig
    };
  }
  
  createLocalDirectories() {
    const baseDir = localStorageConfig.baseDir;
    const dirs = localStorageConfig.directories;
    
    // Create base directory
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
    
    // Create subdirectories
    const createDir = (dirPath) => {
      const fullPath = path.join(baseDir, dirPath);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`📁 Created directory: ${fullPath}`);
      }
    };
    
    Object.values(dirs).forEach(dir => {
      if (typeof dir === 'string') {
        createDir(dir);
      } else if (typeof dir === 'object') {
        Object.values(dir).forEach(subDir => createDir(subDir));
      }
    });
  }
  
  // Storage method implementations
  async uploadToLocal(file, options = {}) {
    // Local upload implementation
    return { success: true, url: 'local://file-url' };
  }
  
  async deleteFromLocal(filePath) {
    // Local delete implementation
    return { success: true };
  }
  
  getLocalUrl(filePath) {
    // Local URL generation
    return `${process.env.API_URL || 'http://localhost:5000'}/${filePath}`;
  }
  
  async uploadToS3(file, options = {}) {
    // S3 upload implementation
    return { success: true, url: 's3://file-url' };
  }
  
  async deleteFromS3(key) {
    // S3 delete implementation
    return { success: true };
  }
  
  getS3Url(key) {
    // S3 URL generation
    const config = awsS3Config;
    if (config.useCloudFront && config.cloudFrontUrl) {
      return `${config.cloudFrontUrl}/${key}`;
    }
    return `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;
  }
  
  // Public methods
  async upload(file, options = {}) {
    try {
      return await this.activeStorage.upload(file, options);
    } catch (error) {
      console.error('Primary storage upload failed:', error.message);
      
      if (this.fallbackStorage) {
        console.log('🔄 Trying fallback storage...');
        return await this.fallbackStorage.upload(file, options);
      }
      
      throw error;
    }
  }
  
  async delete(filePath) {
    try {
      return await this.activeStorage.delete(filePath);
    } catch (error) {
      console.error('Storage delete failed:', error.message);
      throw error;
    }
  }
  
  getUrl(filePath) {
    return this.activeStorage.getUrl(filePath);
  }
  
  getConfig() {
    return {
      default: this.config,
      active: this.activeStorage?.config,
      fallback: this.fallbackStorage?.config
    };
  }
}

// ========================================
// EXPORTS
// ========================================

// Create singleton instance
const storageManager = new StorageManager();

module.exports = {
  // Storage types
  STORAGE_TYPES,
  
  // Configurations
  defaultStorageConfig,
  localStorageConfig,
  awsS3Config,
  googleCloudConfig,
  cloudinaryConfig,
  digitalOceanConfig,
  
  // Storage manager instance
  storageManager,
  StorageManager,
  
  // Utility functions
  getStorageConfig: () => storageManager.getConfig(),
  
  // Quick access methods
  uploadFile: (file, options) => storageManager.upload(file, options),
  deleteFile: (filePath) => storageManager.delete(filePath),
  getFileUrl: (filePath) => storageManager.getUrl(filePath)
};