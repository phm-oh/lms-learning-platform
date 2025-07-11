// File: backend/src/middleware/newsValidation.js
// Path: backend/src/middleware/newsValidation.js

const Joi = require('joi');

// ========================================
// NEWS VALIDATION SCHEMAS
// ========================================

const newsSchemas = {
  create: Joi.object({
    title: Joi.string()
      .min(3)
      .max(255)
      .required()
      .messages({
        'string.min': 'Title must be at least 3 characters long',
        'string.max': 'Title cannot exceed 255 characters',
        'any.required': 'Title is required'
      }),
    
    slug: Joi.string()
      .pattern(/^[a-z0-9-]+$/)
      .min(3)
      .max(255)
      .optional()
      .messages({
        'string.pattern.base': 'Slug can only contain lowercase letters, numbers, and hyphens',
        'string.min': 'Slug must be at least 3 characters long',
        'string.max': 'Slug cannot exceed 255 characters'
      }),
    
    summary: Joi.string()
      .min(10)
      .max(500)
      .required()
      .messages({
        'string.min': 'Summary must be at least 10 characters long',
        'string.max': 'Summary cannot exceed 500 characters',
        'any.required': 'Summary is required'
      }),
    
    content: Joi.string()
      .min(10)
      .max(50000)
      .required()
      .messages({
        'string.min': 'Content must be at least 10 characters long',
        'string.max': 'Content cannot exceed 50,000 characters',
        'any.required': 'Content is required'
      }),
    
    featuredImage: Joi.string()
      .uri()
      .optional()
      .allow('')
      .messages({
        'string.uri': 'Featured image must be a valid URL'
      }),
    
    featuredImageAlt: Joi.string()
      .max(255)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Featured image alt text cannot exceed 255 characters'
      }),
    
    categoryId: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Category ID must be a number',
        'number.positive': 'Category ID must be positive',
        'any.required': 'Category is required'
      }),
    
    newsType: Joi.string()
      .valid('announcement', 'technology', 'course_update', 'system', 'event', 'general')
      .default('general')
      .messages({
        'any.only': 'News type must be one of: announcement, technology, course_update, system, event, general'
      }),
    
    priority: Joi.string()
      .valid('low', 'normal', 'high', 'urgent')
      .default('normal')
      .messages({
        'any.only': 'Priority must be one of: low, normal, high, urgent'
      }),
    
    tags: Joi.array()
      .items(Joi.string().min(1).max(50))
      .max(10)
      .optional()
      .messages({
        'array.max': 'Maximum 10 tags allowed',
        'string.min': 'Each tag must be at least 1 character long',
        'string.max': 'Each tag cannot exceed 50 characters'
      }),
    
    status: Joi.string()
      .valid('draft', 'published', 'scheduled', 'archived')
      .default('draft')
      .messages({
        'any.only': 'Status must be one of: draft, published, scheduled, archived'
      }),
    
    scheduledAt: Joi.date()
      .greater('now')
      .optional()
      .when('status', {
        is: 'scheduled',
        then: Joi.required(),
        otherwise: Joi.optional()
      })
      .messages({
        'date.greater': 'Scheduled date must be in the future',
        'any.required': 'Scheduled date is required when status is scheduled'
      }),
    
    expiresAt: Joi.date()
      .greater('now')
      .optional()
      .messages({
        'date.greater': 'Expiration date must be in the future'
      }),
    
    metaTitle: Joi.string()
      .max(255)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Meta title cannot exceed 255 characters'
      }),
    
    metaDescription: Joi.string()
      .max(500)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Meta description cannot exceed 500 characters'
      }),
    
    metaKeywords: Joi.array()
      .items(Joi.string().min(1).max(50))
      .max(15)
      .optional()
      .messages({
        'array.max': 'Maximum 15 meta keywords allowed'
      }),
    
    isFeatured: Joi.boolean()
      .default(false),
    
    isPinned: Joi.boolean()
      .default(false),
    
    allowComments: Joi.boolean()
      .default(true),
    
    isExternalLink: Joi.boolean()
      .default(false),
    
    externalUrl: Joi.string()
      .uri()
      .optional()
      .when('isExternalLink', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional()
      })
      .messages({
        'string.uri': 'External URL must be a valid URL',
        'any.required': 'External URL is required when isExternalLink is true'
      })
  }),

  update: Joi.object({
    title: Joi.string()
      .min(3)
      .max(255)
      .optional(),
    
    slug: Joi.string()
      .pattern(/^[a-z0-9-]+$/)
      .min(3)
      .max(255)
      .optional(),
    
    summary: Joi.string()
      .min(10)
      .max(500)
      .optional(),
    
    content: Joi.string()
      .min(10)
      .max(50000)
      .optional(),
    
    featuredImage: Joi.string()
      .uri()
      .optional()
      .allow(''),
    
    featuredImageAlt: Joi.string()
      .max(255)
      .optional()
      .allow(''),
    
    categoryId: Joi.number()
      .integer()
      .positive()
      .optional(),
    
    newsType: Joi.string()
      .valid('announcement', 'technology', 'course_update', 'system', 'event', 'general')
      .optional(),
    
    priority: Joi.string()
      .valid('low', 'normal', 'high', 'urgent')
      .optional(),
    
    tags: Joi.array()
      .items(Joi.string().min(1).max(50))
      .max(10)
      .optional(),
    
    status: Joi.string()
      .valid('draft', 'published', 'scheduled', 'archived')
      .optional(),
    
    scheduledAt: Joi.date()
      .greater('now')
      .optional(),
    
    expiresAt: Joi.date()
      .greater('now')
      .optional(),
    
    metaTitle: Joi.string()
      .max(255)
      .optional()
      .allow(''),
    
    metaDescription: Joi.string()
      .max(500)
      .optional()
      .allow(''),
    
    metaKeywords: Joi.array()
      .items(Joi.string().min(1).max(50))
      .max(15)
      .optional(),
    
    isFeatured: Joi.boolean()
      .optional(),
    
    isPinned: Joi.boolean()
      .optional(),
    
    allowComments: Joi.boolean()
      .optional(),
    
    isExternalLink: Joi.boolean()
      .optional(),
    
    externalUrl: Joi.string()
      .uri()
      .optional()
      .allow('')
  }),

  publishAction: Joi.object({
    action: Joi.string()
      .valid('publish', 'unpublish', 'schedule', 'archive')
      .required()
      .messages({
        'any.only': 'Action must be one of: publish, unpublish, schedule, archive',
        'any.required': 'Action is required'
      }),
    
    scheduledAt: Joi.date()
      .greater('now')
      .when('action', {
        is: 'schedule',
        then: Joi.required(),
        otherwise: Joi.optional()
      })
      .messages({
        'date.greater': 'Scheduled date must be in the future',
        'any.required': 'Scheduled date is required for schedule action'
      })
  }),

  shareAction: Joi.object({
    platform: Joi.string()
      .valid('facebook', 'twitter', 'line', 'linkedin', 'email', 'copy', 'other')
      .required()
      .messages({
        'any.only': 'Platform must be one of: facebook, twitter, line, linkedin, email, copy, other',
        'any.required': 'Platform is required'
      }),
    
    url: Joi.string()
      .uri()
      .optional()
      .messages({
        'string.uri': 'URL must be valid'
      })
  }),

  createComment: Joi.object({
    content: Joi.string()
      .min(5)
      .max(1000)
      .required()
      .messages({
        'string.min': 'Comment must be at least 5 characters long',
        'string.max': 'Comment cannot exceed 1000 characters',
        'any.required': 'Comment content is required'
      }),
    
    parentId: Joi.number()
      .integer()
      .positive()
      .optional()
      .messages({
        'number.base': 'Parent ID must be a number',
        'number.positive': 'Parent ID must be positive'
      })
  }),

  bulkPublish: Joi.object({
    newsIds: Joi.array()
      .items(Joi.number().integer().positive())
      .min(1)
      .max(50)
      .required()
      .messages({
        'array.min': 'At least one news ID is required',
        'array.max': 'Cannot bulk publish more than 50 news at once',
        'any.required': 'News IDs are required'
      }),
    
    action: Joi.string()
      .valid('publish', 'unpublish', 'archive')
      .required()
      .messages({
        'any.only': 'Action must be one of: publish, unpublish, archive',
        'any.required': 'Action is required'
      })
  }),

  bulkDelete: Joi.object({
    newsIds: Joi.array()
      .items(Joi.number().integer().positive())
      .min(1)
      .max(20)
      .required()
      .messages({
        'array.min': 'At least one news ID is required',
        'array.max': 'Cannot bulk delete more than 20 news at once',
        'any.required': 'News IDs are required'
      }),
    
    confirmDelete: Joi.boolean()
      .valid(true)
      .required()
      .messages({
        'any.only': 'Delete confirmation is required',
        'any.required': 'Delete confirmation is required'
      })
  })
};

// ========================================
// NEWS CATEGORY VALIDATION SCHEMAS
// ========================================

const newsCategorySchemas = {
  create: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'Category name must be at least 2 characters long',
        'string.max': 'Category name cannot exceed 100 characters',
        'any.required': 'Category name is required'
      }),
    
    slug: Joi.string()
      .pattern(/^[a-z0-9-]+$/)
      .min(2)
      .max(100)
      .optional()
      .messages({
        'string.pattern.base': 'Slug can only contain lowercase letters, numbers, and hyphens'
      }),
    
    description: Joi.string()
      .max(1000)
      .optional()
      .allow('')
      .messages({
        'string.max': 'Description cannot exceed 1000 characters'
      }),
    
    color: Joi.string()
      .pattern(/^#[0-9A-Fa-f]{6}$/)
      .default('#007bff')
      .messages({
        'string.pattern.base': 'Color must be a valid hex color code (e.g., #007bff)'
      }),
    
    icon: Joi.string()
      .min(1)
      .max(50)
      .default('newspaper')
      .messages({
        'string.min': 'Icon is required',
        'string.max': 'Icon name cannot exceed 50 characters'
      }),
    
    isActive: Joi.boolean()
      .default(true),
    
    orderIndex: Joi.number()
      .integer()
      .min(0)
      .max(9999)
      .optional()
      .messages({
        'number.min': 'Order index must be at least 0',
        'number.max': 'Order index cannot exceed 9999'
      })
  }),

  update: Joi.object({
    name: Joi.string()
      .min(2)
      .max(100)
      .optional(),
    
    slug: Joi.string()
      .pattern(/^[a-z0-9-]+$/)
      .min(2)
      .max(100)
      .optional(),
    
    description: Joi.string()
      .max(1000)
      .optional()
      .allow(''),
    
    color: Joi.string()
      .pattern(/^#[0-9A-Fa-f]{6}$/)
      .optional(),
    
    icon: Joi.string()
      .min(1)
      .max(50)
      .optional(),
    
    isActive: Joi.boolean()
      .optional(),
    
    orderIndex: Joi.number()
      .integer()
      .min(0)
      .max(9999)
      .optional()
  })
};

// ========================================
// PARAMETER VALIDATION SCHEMAS
// ========================================

const paramSchemas = {
  newsId: Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'News ID must be a number',
        'number.positive': 'News ID must be positive',
        'any.required': 'News ID is required'
      })
  }),

  newsSlug: Joi.object({
    slug: Joi.string()
      .pattern(/^[a-z0-9-]+$/)
      .min(3)
      .max(255)
      .required()
      .messages({
        'string.pattern.base': 'Slug can only contain lowercase letters, numbers, and hyphens',
        'any.required': 'News slug is required'
      })
  }),

  categoryId: Joi.object({
    id: Joi.number()
      .integer()
      .positive()
      .required()
      .messages({
        'number.base': 'Category ID must be a number',
        'number.positive': 'Category ID must be positive',
        'any.required': 'Category ID is required'
      })
  })
};

// ========================================
// QUERY VALIDATION SCHEMAS
// ========================================

const querySchemas = {
  newsList: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.min': 'Page must be at least 1'
      }),
    
    limit: Joi.number()
      .integer()
      .min(1)
      .max(50)
      .default(12)
      .messages({
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 50'
      }),
    
    category: Joi.string()
      .pattern(/^[a-z0-9-]+$/)
      .optional()
      .messages({
        'string.pattern.base': 'Category slug can only contain lowercase letters, numbers, and hyphens'
      }),
    
    type: Joi.string()
      .valid('announcement', 'technology', 'course_update', 'system', 'event', 'general')
      .optional(),
    
    search: Joi.string()
      .min(2)
      .max(100)
      .optional()
      .messages({
        'string.min': 'Search term must be at least 2 characters long',
        'string.max': 'Search term cannot exceed 100 characters'
      }),
    
    tags: Joi.alternatives()
      .try(
        Joi.string(),
        Joi.array().items(Joi.string())
      )
      .optional(),
    
    sort: Joi.string()
      .valid('latest', 'oldest', 'popular', 'title')
      .default('latest'),
    
    featured: Joi.string()
      .valid('true', 'false')
      .optional()
  }),

  newsDetail: Joi.object({
    increment_view: Joi.string()
      .valid('true', 'false')
      .default('true')
  }),

  newsLimit: Joi.object({
    limit: Joi.number()
      .integer()
      .min(1)
      .max(20)
      .default(5)
  }),

  popularNews: Joi.object({
    limit: Joi.number()
      .integer()
      .min(1)
      .max(20)
      .default(5),
    
    days: Joi.number()
      .integer()
      .min(1)
      .max(365)
      .default(7)
      .messages({
        'number.min': 'Days must be at least 1',
        'number.max': 'Days cannot exceed 365'
      })
  }),

  categoriesList: Joi.object({
    include_count: Joi.string()
      .valid('true', 'false')
      .default('false')
  }),

  analytics: Joi.object({
    period: Joi.number()
      .integer()
      .min(1)
      .max(365)
      .default(30)
      .messages({
        'number.min': 'Period must be at least 1 day',
        'number.max': 'Period cannot exceed 365 days'
      })
  }),

  comments: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1),
    
    limit: Joi.number()
      .integer()
      .min(1)
      .max(50)
      .default(10),
    
    sort: Joi.string()
      .valid('latest', 'oldest', 'popular')
      .default('latest')
  }),

  myNews: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1),
    
    limit: Joi.number()
      .integer()
      .min(1)
      .max(50)
      .default(10),
    
    status: Joi.string()
      .valid('all', 'draft', 'published', 'scheduled', 'archived')
      .default('all')
  })
};

module.exports = {
  newsSchemas,
  newsCategorySchemas,
  paramSchemas,
  querySchemas
};