// File: backend/src/models/news/news-model.js
// Path: backend/src/models/news/news-model.js
// Note: Using kebab-case filename to completely avoid case sensitivity issues

const { DataTypes, Op } = require('sequelize');
const sequelize = require('../../config/database');
const slugify = require('slugify');

const News = sequelize.define('News', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 255]
    }
  },
  slug: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isLowercase: true,
      is: /^[a-z0-9-]+$/
    }
  },
  summary: {
    type: DataTypes.TEXT,
    validate: {
      len: [0, 500]
    }
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [10, 50000]
    }
  },
  featuredImage: {
    type: DataTypes.STRING(255),
    field: 'featured_image',
    validate: {
      isUrl: true
    }
  },
  featuredImageAlt: {
    type: DataTypes.STRING(255),
    field: 'featured_image_alt'
  },
  
  // Category & Classification
  categoryId: {
    type: DataTypes.INTEGER,
    field: 'category_id',
    references: {
      model: 'news_categories',
      key: 'id'
    }
  },
  newsType: {
    type: DataTypes.ENUM('announcement', 'technology', 'course_update', 'system', 'event', 'general'),
    defaultValue: 'general',
    field: 'news_type'
  },
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
    defaultValue: 'normal'
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  
  // Publishing Info
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'author_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'archived', 'scheduled'),
    defaultValue: 'draft'
  },
  publishedAt: {
    type: DataTypes.DATE,
    field: 'published_at'
  },
  scheduledAt: {
    type: DataTypes.DATE,
    field: 'scheduled_at'
  },
  expiresAt: {
    type: DataTypes.DATE,
    field: 'expires_at'
  },
  
  // SEO & Meta
  metaTitle: {
    type: DataTypes.STRING(255),
    field: 'meta_title'
  },
  metaDescription: {
    type: DataTypes.STRING(500),
    field: 'meta_description'
  },
  metaKeywords: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
    field: 'meta_keywords'
  },
  
  // Engagement Stats
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'view_count'
  },
  likeCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'like_count'
  },
  shareCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'share_count'
  },
  
  // Settings
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_featured'
  },
  isPinned: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_pinned'
  },
  allowComments: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'allow_comments'
  },
  isExternalLink: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_external_link'
  },
  externalUrl: {
    type: DataTypes.STRING(500),
    field: 'external_url',
    validate: {
      isUrl: true
    }
  }
}, {
  tableName: 'news',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  
  // Hooks
  hooks: {
    beforeValidate: (news, options) => {
      // Auto-generate slug from title if not provided
      if (!news.slug && news.title) {
        news.slug = slugify(news.title, {
          lower: true,
          strict: true,
          remove: /[*+~.()'"!:@]/g
        });
      }
      
      // Auto-generate meta title if not provided
      if (!news.metaTitle && news.title) {
        news.metaTitle = news.title.length > 60 
          ? news.title.substring(0, 57) + '...' 
          : news.title;
      }
      
      // Auto-generate meta description from summary or content
      if (!news.metaDescription) {
        const source = news.summary || news.content;
        if (source) {
          news.metaDescription = source.length > 160 
            ? source.substring(0, 157) + '...' 
            : source;
        }
      }
    },
    
    beforeCreate: async (news, options) => {
      // Ensure unique slug
      await news.ensureUniqueSlug();
      
      // Set published_at if status is published
      if (news.status === 'published' && !news.publishedAt) {
        news.publishedAt = new Date();
      }
    },
    
    beforeUpdate: (news, options) => {
      // Update published_at when status changes to published
      if (news.changed('status') && news.status === 'published' && !news.publishedAt) {
        news.publishedAt = new Date();
      }
      
      // Clear published_at when status changes from published
      if (news.changed('status') && news.status !== 'published' && news.status !== 'scheduled') {
        news.publishedAt = null;
      }
    }
  }
});

// ========================================
// INSTANCE METHODS
// ========================================

News.prototype.ensureUniqueSlug = async function() {
  const baseSlug = this.slug;
  let counter = 1;
  let uniqueSlug = baseSlug;
  
  while (await News.findOne({ where: { slug: uniqueSlug, id: { [Op.ne]: this.id || 0 } } })) {
    uniqueSlug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  this.slug = uniqueSlug;
};

News.prototype.publish = async function() {
  this.status = 'published';
  this.publishedAt = new Date();
  return await this.save();
};

News.prototype.unpublish = async function() {
  this.status = 'draft';
  this.publishedAt = null;
  return await this.save();
};

News.prototype.archive = async function() {
  this.status = 'archived';
  return await this.save();
};

News.prototype.schedule = async function(scheduledDate) {
  this.status = 'scheduled';
  this.scheduledAt = scheduledDate;
  this.publishedAt = null;
  return await this.save();
};

News.prototype.incrementViewCount = async function() {
  await this.increment('viewCount');
  return this.reload();
};

News.prototype.incrementLikeCount = async function() {
  await this.increment('likeCount');
  return this.reload();
};

News.prototype.incrementShareCount = async function() {
  await this.increment('shareCount');
  return this.reload();
};

News.prototype.getReadablePublishDate = function() {
  if (!this.publishedAt) return null;
  return this.publishedAt.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

News.prototype.getExcerpt = function(length = 150) {
  const source = this.summary || this.content;
  if (!source) return '';
  
  // Remove HTML tags if content contains them
  const plainText = source.replace(/<[^>]*>/g, '');
  
  return plainText.length > length 
    ? plainText.substring(0, length - 3) + '...' 
    : plainText;
};

News.prototype.isPublished = function() {
  return this.status === 'published' && 
         this.publishedAt && 
         this.publishedAt <= new Date() &&
         (!this.expiresAt || this.expiresAt > new Date());
};

News.prototype.isScheduled = function() {
  return this.status === 'scheduled' && 
         this.scheduledAt && 
         this.scheduledAt > new Date();
};

News.prototype.isExpired = function() {
  return this.expiresAt && this.expiresAt <= new Date();
};

// ========================================
// CLASS METHODS (Static)
// ========================================

News.getPublished = function(options = {}) {
  const { limit = 10, offset = 0, categoryId, newsType, tags, search } = options;
  
  const where = {
    status: 'published',
    publishedAt: { [Op.lte]: new Date() },
    [Op.or]: [
      { expiresAt: null },
      { expiresAt: { [Op.gt]: new Date() } }
    ]
  };
  
  if (categoryId) where.categoryId = categoryId;
  if (newsType) where.newsType = newsType;
  if (tags && tags.length > 0) where.tags = { [Op.overlap]: tags };
  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { summary: { [Op.iLike]: `%${search}%` } },
      { content: { [Op.iLike]: `%${search}%` } }
    ];
  }
  
  return this.findAndCountAll({
    where,
    limit,
    offset,
    order: [
      ['isPinned', 'DESC'],
      ['publishedAt', 'DESC']
    ],
    include: [
      { association: 'category' },
      { association: 'author', attributes: ['id', 'firstName', 'lastName', 'profileImage'] }
    ]
  });
};

News.getFeatured = function(limit = 5) {
  return this.findAll({
    where: {
      status: 'published',
      isFeatured: true,
      publishedAt: { [Op.lte]: new Date() },
      [Op.or]: [
        { expiresAt: null },
        { expiresAt: { [Op.gt]: new Date() } }
      ]
    },
    limit,
    order: [['publishedAt', 'DESC']],
    include: [
      { association: 'category' },
      { association: 'author', attributes: ['id', 'firstName', 'lastName', 'profileImage'] }
    ]
  });
};

News.getPopular = function(limit = 5, days = 7) {
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - days);
  
  return this.findAll({
    where: {
      status: 'published',
      publishedAt: { 
        [Op.lte]: new Date(),
        [Op.gte]: dateFrom
      }
    },
    limit,
    order: [['viewCount', 'DESC'], ['likeCount', 'DESC']],
    include: [
      { association: 'category' },
      { association: 'author', attributes: ['id', 'firstName', 'lastName'] }
    ]
  });
};

News.getRecent = function(limit = 5) {
  return this.findAll({
    where: {
      status: 'published',
      publishedAt: { [Op.lte]: new Date() }
    },
    limit,
    order: [['publishedAt', 'DESC']],
    include: [
      { association: 'category' },
      { association: 'author', attributes: ['id', 'firstName', 'lastName'] }
    ]
  });
};

News.publishScheduled = async function() {
  const scheduledNews = await this.findAll({
    where: {
      status: 'scheduled',
      scheduledAt: { [Op.lte]: new Date() }
    }
  });
  
  const results = [];
  for (const news of scheduledNews) {
    await news.publish();
    results.push(news);
  }
  
  return results;
};

module.exports = News;