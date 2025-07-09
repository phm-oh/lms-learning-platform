// File: backend/src/utils/cloudStorage.js
// Path: backend/src/utils/cloudStorage.js

const { generateUniqueFileName, formatFileSize } = require('./fileHelper');

// ========================================
// AWS S3 IMPLEMENTATION
// ========================================

class AWSS3Storage {
  constructor(config) {
    this.config = config;
    this.s3 = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      const AWS = require('aws-sdk');
      
      // Configure AWS
      AWS.config.update({
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
        region: this.config.region
      });

      this.s3 = new AWS.S3();
      
      // Test connection
      await this.s3.headBucket({ Bucket: this.config.bucket }).promise();
      
      this.initialized = true;
      console.log(`✅ AWS S3 initialized: ${this.config.bucket}`);
      
    } catch (error) {
      console.error('❌ AWS S3 initialization failed:', error.message);
      throw new Error(`AWS S3 initialization failed: ${error.message}`);
    }
  }

  async upload(file, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const {
        folder = '',
        fileName = null,
        acl = this.config.acl || 'public-read',
        contentType = file.mimetype,
        metadata = {}
      } = options;

      // Generate unique filename if not provided
      const finalFileName = fileName || generateUniqueFileName(file.originalname);
      const key = folder ? `${this.config.keyPrefix}${folder}/${finalFileName}` : `${this.config.keyPrefix}${finalFileName}`;

      // Prepare upload parameters
      const uploadParams = {
        Bucket: this.config.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: contentType,
        ACL: acl,
        Metadata: {
          originalName: file.originalname,
          uploadedBy: metadata.userId || 'unknown',
          uploadedAt: new Date().toISOString(),
          ...metadata
        }
      };

      // Add server-side encryption if configured
      if (this.config.serverSideEncryption) {
        uploadParams.ServerSideEncryption = this.config.serverSideEncryption;
      }

      // Add storage class if configured
      if (this.config.storageClass) {
        uploadParams.StorageClass = this.config.storageClass;
      }

      // Upload to S3
      const result = await this.s3.upload(uploadParams).promise();

      // Generate URL
      const url = this.config.useCloudFront && this.config.cloudFrontUrl
        ? `${this.config.cloudFrontUrl}/${key.replace(this.config.keyPrefix, '')}`
        : result.Location;

      return {
        success: true,
        url: url,
        key: key,
        bucket: this.config.bucket,
        etag: result.ETag,
        size: file.buffer.length,
        contentType: contentType,
        metadata: uploadParams.Metadata
      };

    } catch (error) {
      console.error('AWS S3 upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async delete(key) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const deleteParams = {
        Bucket: this.config.bucket,
        Key: key.startsWith(this.config.keyPrefix) ? key : `${this.config.keyPrefix}${key}`
      };

      await this.s3.deleteObject(deleteParams).promise();

      return {
        success: true,
        deletedKey: deleteParams.Key
      };

    } catch (error) {
      console.error('AWS S3 delete error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getSignedUrl(key, expiresIn = 3600) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const url = await this.s3.getSignedUrlPromise('getObject', {
        Bucket: this.config.bucket,
        Key: key.startsWith(this.config.keyPrefix) ? key : `${this.config.keyPrefix}${key}`,
        Expires: expiresIn
      });

      return {
        success: true,
        url: url,
        expiresIn: expiresIn
      };

    } catch (error) {
      console.error('AWS S3 signed URL error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async listFiles(prefix = '', maxKeys = 1000) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const params = {
        Bucket: this.config.bucket,
        Prefix: `${this.config.keyPrefix}${prefix}`,
        MaxKeys: maxKeys
      };

      const result = await this.s3.listObjectsV2(params).promise();

      const files = result.Contents.map(item => ({
        key: item.Key,
        size: item.Size,
        lastModified: item.LastModified,
        etag: item.ETag,
        url: this.config.useCloudFront && this.config.cloudFrontUrl
          ? `${this.config.cloudFrontUrl}/${item.Key.replace(this.config.keyPrefix, '')}`
          : `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${item.Key}`
      }));

      return {
        success: true,
        files: files,
        count: files.length,
        isTruncated: result.IsTruncated
      };

    } catch (error) {
      console.error('AWS S3 list files error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// ========================================
// GOOGLE CLOUD STORAGE IMPLEMENTATION
// ========================================

class GoogleCloudStorage {
  constructor(config) {
    this.config = config;
    this.storage = null;
    this.bucket = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      const { Storage } = require('@google-cloud/storage');

      // Initialize Google Cloud Storage
      const storageOptions = {
        projectId: this.config.projectId
      };

      if (this.config.keyFilename) {
        storageOptions.keyFilename = this.config.keyFilename;
      }

      this.storage = new Storage(storageOptions);
      this.bucket = this.storage.bucket(this.config.bucket);

      // Test bucket access
      const [exists] = await this.bucket.exists();
      if (!exists) {
        throw new Error(`Bucket ${this.config.bucket} does not exist`);
      }

      this.initialized = true;
      console.log(`✅ Google Cloud Storage initialized: ${this.config.bucket}`);

    } catch (error) {
      console.error('❌ Google Cloud Storage initialization failed:', error.message);
      throw new Error(`Google Cloud Storage initialization failed: ${error.message}`);
    }
  }

  async upload(file, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const {
        folder = '',
        fileName = null,
        public = this.config.public,
        metadata = {}
      } = options;

      // Generate unique filename if not provided
      const finalFileName = fileName || generateUniqueFileName(file.originalname);
      const fileName_path = folder ? `${folder}/${finalFileName}` : finalFileName;

      // Create file reference
      const fileRef = this.bucket.file(fileName_path);

      // Upload options
      const uploadOptions = {
        metadata: {
          contentType: file.mimetype,
          metadata: {
            originalName: file.originalname,
            uploadedBy: metadata.userId || 'unknown',
            uploadedAt: new Date().toISOString(),
            ...metadata
          }
        }
      };

      // Enable resumable upload for large files
      if (this.config.resumable?.enabled && file.buffer.length > (this.config.resumable.chunkSize || 5 * 1024 * 1024)) {
        uploadOptions.resumable = true;
        uploadOptions.chunkSize = this.config.resumable.chunkSize;
      }

      // Upload file
      await fileRef.save(file.buffer, uploadOptions);

      // Make file public if configured
      if (public) {
        await fileRef.makePublic();
      }

      // Generate URL
      const url = this.config.useCdn && this.config.cdnUrl
        ? `${this.config.cdnUrl}/${fileName_path}`
        : `https://storage.googleapis.com/${this.config.bucket}/${fileName_path}`;

      return {
        success: true,
        url: url,
        fileName: fileName_path,
        bucket: this.config.bucket,
        size: file.buffer.length,
        contentType: file.mimetype,
        public: public
      };

    } catch (error) {
      console.error('Google Cloud Storage upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async delete(fileName) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const fileRef = this.bucket.file(fileName);
      await fileRef.delete();

      return {
        success: true,
        deletedFile: fileName
      };

    } catch (error) {
      console.error('Google Cloud Storage delete error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getSignedUrl(fileName, expiresIn = 3600) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const fileRef = this.bucket.file(fileName);
      const [url] = await fileRef.getSignedUrl({
        action: 'read',
        expires: Date.now() + (expiresIn * 1000)
      });

      return {
        success: true,
        url: url,
        expiresIn: expiresIn
      };

    } catch (error) {
      console.error('Google Cloud Storage signed URL error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// ========================================
// CLOUDINARY IMPLEMENTATION
// ========================================

class CloudinaryStorage {
  constructor(config) {
    this.config = config;
    this.cloudinary = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      const cloudinary = require('cloudinary').v2;

      // Configure Cloudinary
      cloudinary.config({
        cloud_name: this.config.cloudName,
        api_key: this.config.apiKey,
        api_secret: this.config.apiSecret,
        secure: this.config.secure
      });

      this.cloudinary = cloudinary;

      // Test connection
      await this.cloudinary.api.ping();

      this.initialized = true;
      console.log(`✅ Cloudinary initialized: ${this.config.cloudName}`);

    } catch (error) {
      console.error('❌ Cloudinary initialization failed:', error.message);
      throw new Error(`Cloudinary initialization failed: ${error.message}`);
    }
  }

  async upload(file, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const {
        folder = 'lms',
        transformation = null,
        resourceType = 'auto',
        publicId = null,
        tags = [],
        context = {}
      } = options;

      // Determine upload options based on file type
      let uploadOptions = {
        folder: `${folder}/${this.getFolderByType(file.mimetype)}`,
        resource_type: resourceType,
        tags: ['lms', ...tags],
        context: {
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
          ...context
        }
      };

      if (publicId) {
        uploadOptions.public_id = publicId;
      }

      // Apply transformations for images
      if (file.mimetype.startsWith('image/') && transformation) {
        const presetTransformation = this.config.transformations[transformation];
        if (presetTransformation) {
          uploadOptions.transformation = presetTransformation;
        }
      }

      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        this.cloudinary.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(file.buffer);
      });

      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        version: result.version,
        format: result.format,
        resourceType: result.resource_type,
        size: result.bytes,
        width: result.width,
        height: result.height,
        cloudinaryResult: result
      };

    } catch (error) {
      console.error('Cloudinary upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async delete(publicId) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const result = await this.cloudinary.uploader.destroy(publicId);

      return {
        success: result.result === 'ok',
        deletedPublicId: publicId,
        result: result.result
      };

    } catch (error) {
      console.error('Cloudinary delete error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  getFolderByType(mimeType) {
    if (mimeType.startsWith('image/')) return 'images';
    if (mimeType.startsWith('video/')) return 'videos';
    if (mimeType.startsWith('audio/')) return 'audio';
    return 'documents';
  }

  generateTransformationUrl(publicId, transformation) {
    if (!this.initialized) {
      throw new Error('Cloudinary not initialized');
    }

    return this.cloudinary.url(publicId, transformation);
  }
}

// ========================================
// DIGITALOCEAN SPACES IMPLEMENTATION
// ========================================

class DigitalOceanSpaces {
  constructor(config) {
    this.config = config;
    this.s3 = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      const AWS = require('aws-sdk');

      // Configure DigitalOcean Spaces (S3-compatible)
      const spacesEndpoint = new AWS.Endpoint(this.config.endpoint);
      this.s3 = new AWS.S3({
        endpoint: spacesEndpoint,
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
        region: this.config.region
      });

      // Test connection
      await this.s3.headBucket({ Bucket: this.config.bucket }).promise();

      this.initialized = true;
      console.log(`✅ DigitalOcean Spaces initialized: ${this.config.bucket}`);

    } catch (error) {
      console.error('❌ DigitalOcean Spaces initialization failed:', error.message);
      throw new Error(`DigitalOcean Spaces initialization failed: ${error.message}`);
    }
  }

  async upload(file, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const {
        folder = '',
        fileName = null,
        acl = this.config.acl || 'public-read',
        contentType = file.mimetype
      } = options;

      // Generate unique filename if not provided
      const finalFileName = fileName || generateUniqueFileName(file.originalname);
      const key = folder ? `${folder}/${finalFileName}` : finalFileName;

      // Upload parameters
      const uploadParams = {
        Bucket: this.config.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: contentType,
        ACL: acl
      };

      // Upload to Spaces
      const result = await this.s3.upload(uploadParams).promise();

      // Generate URL
      const url = this.config.useCdn && this.config.cdnUrl
        ? `${this.config.cdnUrl}/${key}`
        : result.Location;

      return {
        success: true,
        url: url,
        key: key,
        bucket: this.config.bucket,
        etag: result.ETag,
        size: file.buffer.length,
        contentType: contentType
      };

    } catch (error) {
      console.error('DigitalOcean Spaces upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async delete(key) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      await this.s3.deleteObject({
        Bucket: this.config.bucket,
        Key: key
      }).promise();

      return {
        success: true,
        deletedKey: key
      };

    } catch (error) {
      console.error('DigitalOcean Spaces delete error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// ========================================
// STORAGE FACTORY
// ========================================

class CloudStorageFactory {
  static create(type, config) {
    switch (type) {
      case 'aws_s3':
        return new AWSS3Storage(config);
      case 'google_cloud':
        return new GoogleCloudStorage(config);
      case 'cloudinary':
        return new CloudinaryStorage(config);
      case 'digitalocean_spaces':
        return new DigitalOceanSpaces(config);
      default:
        throw new Error(`Unsupported cloud storage type: ${type}`);
    }
  }

  static getSupportedTypes() {
    return ['aws_s3', 'google_cloud', 'cloudinary', 'digitalocean_spaces'];
  }
}

// ========================================
// UNIFIED CLOUD STORAGE MANAGER
// ========================================

class CloudStorageManager {
  constructor() {
    this.providers = new Map();
    this.activeProvider = null;
    this.fallbackProvider = null;
  }

  async addProvider(name, type, config, options = {}) {
    try {
      const provider = CloudStorageFactory.create(type, config);
      
      if (options.initialize !== false) {
        await provider.initialize();
      }
      
      this.providers.set(name, provider);
      
      if (options.setAsActive) {
        this.activeProvider = name;
      }
      
      if (options.setAsFallback) {
        this.fallbackProvider = name;
      }
      
      console.log(`✅ Cloud storage provider added: ${name} (${type})`);
      return { success: true, provider: name };
      
    } catch (error) {
      console.error(`❌ Failed to add provider ${name}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  async upload(file, options = {}) {
    const providerName = options.provider || this.activeProvider;
    if (!providerName) {
      throw new Error('No active cloud storage provider');
    }

    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }

    try {
      return await provider.upload(file, options);
    } catch (error) {
      console.error(`Upload failed with provider ${providerName}:`, error.message);
      
      // Try fallback provider if available
      if (this.fallbackProvider && this.fallbackProvider !== providerName) {
        console.log(`🔄 Trying fallback provider: ${this.fallbackProvider}`);
        const fallbackProvider = this.providers.get(this.fallbackProvider);
        if (fallbackProvider) {
          return await fallbackProvider.upload(file, options);
        }
      }
      
      throw error;
    }
  }

  async delete(identifier, options = {}) {
    const providerName = options.provider || this.activeProvider;
    if (!providerName) {
      throw new Error('No active cloud storage provider');
    }

    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }

    return await provider.delete(identifier);
  }

  getProvider(name) {
    return this.providers.get(name);
  }

  listProviders() {
    return Array.from(this.providers.keys());
  }

  setActiveProvider(name) {
    if (!this.providers.has(name)) {
      throw new Error(`Provider ${name} not found`);
    }
    this.activeProvider = name;
  }

  setFallbackProvider(name) {
    if (!this.providers.has(name)) {
      throw new Error(`Provider ${name} not found`);
    }
    this.fallbackProvider = name;
  }
}

// ========================================
// EXPORTS
// ========================================

module.exports = {
  // Storage classes
  AWSS3Storage,
  GoogleCloudStorage,
  CloudinaryStorage,
  DigitalOceanSpaces,
  
  // Factory and manager
  CloudStorageFactory,
  CloudStorageManager,
  
  // Utility functions
  createCloudStorage: (type, config) => CloudStorageFactory.create(type, config),
  getSupportedStorageTypes: () => CloudStorageFactory.getSupportedTypes(),
  
  // Singleton manager instance
  cloudStorageManager: new CloudStorageManager()
};

// ========================================
// USAGE EXAMPLES
// ========================================

/*
// Initialize AWS S3
const s3Config = {
  accessKeyId: 'your-access-key',
  secretAccessKey: 'your-secret-key',
  region: 'ap-southeast-1',
  bucket: 'your-bucket',
  keyPrefix: 'lms-files/'
};

const s3Storage = new AWSS3Storage(s3Config);
await s3Storage.initialize();

// Upload file
const uploadResult = await s3Storage.upload(file, {
  folder: 'profiles',
  acl: 'public-read'
});

// Initialize Cloudinary
const cloudinaryConfig = {
  cloudName: 'your-cloud-name',
  apiKey: 'your-api-key',
  apiSecret: 'your-api-secret'
};

const cloudinaryStorage = new CloudinaryStorage(cloudinaryConfig);
await cloudinaryStorage.initialize();

// Upload with transformation
const result = await cloudinaryStorage.upload(file, {
  transformation: 'profile',
  folder: 'profiles'
});

// Using the manager
const manager = new CloudStorageManager();
await manager.addProvider('s3', 'aws_s3', s3Config, { setAsActive: true });
await manager.addProvider('cloudinary', 'cloudinary', cloudinaryConfig, { setAsFallback: true });

// Upload using active provider
const uploadResult = await manager.upload(file, { folder: 'courses' });
*/