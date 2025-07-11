// File: backend/src/models/news/news-category.js
// Path: backend/src/models/news/news-category.js
// Note: Using kebab-case filename to completely avoid case sensitivity issues

const { DataTypes, Op } = require('sequelize');
const sequelize = require('../../config/database');
const slugify = require('slugify');

const NewsCategory = sequelize.define('NewsCategory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  slug: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isLowercase: true,
      is: /^[a-z0-9-]+$/
    }
  },
  description: {
    type: DataTypes.TEXT,
    validate: {
      len: [0, 1000]
    }
  },
  color: {
    type: DataTypes.STRING(7),
    defaultValue: '#007bff',
    validate: {
      is: /^#[0-9A-Fa-f]{6}$/
    }
  },
  icon: {
    type: DataTypes.STRING(50),
    defaultValue: 'newspaper',
    validate: {
      len: [1, 50]
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  orderIndex: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'order_index',
    validate: {
      min: 0,
      max: 9999
    }
  }
}, {
  tableName: 'news_categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  
  // Hooks
  hooks: {
    beforeValidate: (category, options) => {
      // Auto-generate slug from name if not provided
      if (!category.slug && category.name) {
        category.slug = slugify(category.name, {
          lower: true,
          strict: true,
          remove: /[*+~.()'"!:@]/g
        });
      }
      
      // Normalize color format
      if (category.color && !category.color.startsWith('#')) {
        category.color = '#' + category.color;
      }
    },
    
    beforeCreate: async (category, options) => {
      // Ensure unique slug
      await category.ensureUniqueSlug();
      
      // Auto-assign order index if not provided
      if (category.orderIndex === 0 || category.orderIndex === null) {
        const maxOrder = await NewsCategory.max('orderIndex') || 0;
        category.orderIndex = maxOrder + 1;
      }
    },
    
    beforeUpdate: async (category, options) => {
      // Ensure unique slug if slug changed
      if (category.changed('slug')) {
        await category.ensureUniqueSlug();
      }
    },
    
    afterDestroy: async (category, options) => {
      // Reorder remaining categories
      await NewsCategory.reorderCategories();
    }
  }
});

// ========================================
// INSTANCE METHODS
// ========================================

NewsCategory.prototype.ensureUniqueSlug = async function() {
  const baseSlug = this.slug;
  let counter = 1;
  let uniqueSlug = baseSlug;
  
  while (await NewsCategory.findOne({ 
    where: { 
      slug: uniqueSlug, 
      id: { [Op.ne]: this.id || 0 } 
    } 
  })) {
    uniqueSlug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  this.slug = uniqueSlug;
};

NewsCategory.prototype.activate = async function() {
  this.isActive = true;
  return await this.save();
};

NewsCategory.prototype.deactivate = async function() {
  this.isActive = false;
  return await this.save();
};

NewsCategory.prototype.moveUp = async function() {
  const currentOrder = this.orderIndex;
  
  // Find the category above this one
  const aboveCategory = await NewsCategory.findOne({
    where: {
      orderIndex: { [Op.lt]: currentOrder },
      isActive: true
    },
    order: [['orderIndex', 'DESC']]
  });
  
  if (aboveCategory) {
    // Swap order indexes
    const tempOrder = aboveCategory.orderIndex;
    aboveCategory.orderIndex = this.orderIndex;
    this.orderIndex = tempOrder;
    
    await aboveCategory.save();
    await this.save();
  }
  
  return this;
};

NewsCategory.prototype.moveDown = async function() {
  const currentOrder = this.orderIndex;
  
  // Find the category below this one
  const belowCategory = await NewsCategory.findOne({
    where: {
      orderIndex: { [Op.gt]: currentOrder },
      isActive: true
    },
    order: [['orderIndex', 'ASC']]
  });
  
  if (belowCategory) {
    // Swap order indexes
    const tempOrder = belowCategory.orderIndex;
    belowCategory.orderIndex = this.orderIndex;
    this.orderIndex = tempOrder;
    
    await belowCategory.save();
    await this.save();
  }
  
  return this;
};

NewsCategory.prototype.getNewsCount = async function(onlyPublished = true) {
  // Use require at runtime to avoid circular dependency
  const News = require('./news-model');  // ← Updated path
  
  const where = { categoryId: this.id };
  if (onlyPublished) {
    where.status = 'published';
    where.publishedAt = { [Op.lte]: new Date() };
  }
  
  return await News.count({ where });
};

NewsCategory.prototype.getLatestNews = async function(limit = 5) {
  // Use require at runtime to avoid circular dependency
  const News = require('./news-model');  // ← Updated path
  
  return await News.findAll({
    where: {
      categoryId: this.id,
      status: 'published',
      publishedAt: { [Op.lte]: new Date() }
    },
    limit,
    order: [['publishedAt', 'DESC']],
    include: [
      { association: 'author', attributes: ['id', 'firstName', 'lastName'] }
    ]
  });
};

NewsCategory.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  
  // Add computed properties
  values.newsCount = this.newsCount || 0;
  values.displayName = this.name;
  values.url = `/news/category/${this.slug}`;
  
  return values;
};

// ========================================
// CLASS METHODS (Static)
// ========================================

NewsCategory.getActive = function(includeNewsCount = false) {
  const options = {
    where: { isActive: true },
    order: [['orderIndex', 'ASC'], ['name', 'ASC']]
  };
  
  return this.findAll(options);
};

NewsCategory.getWithNewsCount = async function() {
  // Use require at runtime to avoid circular dependency
  const News = require('./news-model');  // ← Updated path
  
  const categories = await this.findAll({
    where: { isActive: true },
    order: [['orderIndex', 'ASC']],
    include: [
      {
        model: News,
        as: 'news',
        where: {
          status: 'published',
          publishedAt: { [Op.lte]: new Date() }
        },
        required: false,
        attributes: []
      }
    ],
    attributes: [
      'id', 'name', 'slug', 'description', 'color', 'icon', 'orderIndex',
      [sequelize.fn('COUNT', sequelize.col('news.id')), 'newsCount']
    ],
    group: ['NewsCategory.id']
  });
  
  return categories;
};

NewsCategory.getPopular = async function(limit = 5) {
  // Use require at runtime to avoid circular dependency
  const News = require('./news-model');  // ← Updated path
  
  return await this.findAll({
    where: { isActive: true },
    include: [
      {
        model: News,
        as: 'news',
        where: {
          status: 'published',
          publishedAt: { [Op.lte]: new Date() }
        },
        required: true,
        attributes: []
      }
    ],
    attributes: [
      'id', 'name', 'slug', 'color', 'icon',
      [sequelize.fn('COUNT', sequelize.col('news.id')), 'newsCount'],
      [sequelize.fn('SUM', sequelize.col('news.view_count')), 'totalViews']
    ],
    group: ['NewsCategory.id'],
    order: [[sequelize.literal('totalViews'), 'DESC']],
    limit
  });
};

NewsCategory.reorderCategories = async function() {
  const categories = await this.findAll({
    where: { isActive: true },
    order: [['orderIndex', 'ASC'], ['created_at', 'ASC']]
  });
  
  for (let i = 0; i < categories.length; i++) {
    if (categories[i].orderIndex !== i + 1) {
      categories[i].orderIndex = i + 1;
      await categories[i].save();
    }
  }
  
  return categories;
};

NewsCategory.findBySlug = function(slug) {
  return this.findOne({
    where: { 
      slug: slug,
      isActive: true 
    }
  });
};

NewsCategory.search = function(query, options = {}) {
  const { limit = 10, offset = 0 } = options;
  
  return this.findAndCountAll({
    where: {
      isActive: true,
      [Op.or]: [
        { name: { [Op.iLike]: `%${query}%` } },
        { description: { [Op.iLike]: `%${query}%` } }
      ]
    },
    limit,
    offset,
    order: [['orderIndex', 'ASC'], ['name', 'ASC']]
  });
};

// ========================================
// VALIDATION METHODS
// ========================================

NewsCategory.prototype.validateCreate = function() {
  const errors = [];
  
  if (!this.name || this.name.trim().length < 2) {
    errors.push('Category name must be at least 2 characters long');
  }
  
  if (this.name && this.name.length > 100) {
    errors.push('Category name cannot exceed 100 characters');
  }
  
  if (this.description && this.description.length > 1000) {
    errors.push('Description cannot exceed 1000 characters');
  }
  
  if (this.color && !/^#[0-9A-Fa-f]{6}$/.test(this.color)) {
    errors.push('Color must be a valid hex color code (e.g., #007bff)');
  }
  
  if (!this.icon || this.icon.trim().length === 0) {
    errors.push('Icon is required');
  }
  
  return errors;
};

NewsCategory.prototype.canDelete = async function() {
  const newsCount = await this.getNewsCount(false); // Include all news, not just published
  return newsCount === 0;
};

// ========================================
// HOOKS FOR DEFAULT CATEGORIES
// ========================================

NewsCategory.createDefaultCategories = async function() {
  const defaultCategories = [
    {
      name: 'ประชาสัมพันธ์',
      slug: 'announcements',
      description: 'ข่าวประชาสัมพันธ์และการแจ้งเตือนสำคัญ',
      color: '#007bff',
      icon: 'megaphone',
      orderIndex: 1
    },
    {
      name: 'เทคโนโลยี',
      slug: 'technology',
      description: 'ข่าวเทคโนโลยีและนวัตกรรมล่าสุด',
      color: '#28a745',
      icon: 'cpu',
      orderIndex: 2
    },
    {
      name: 'อัปเดตคอร์ส',
      slug: 'course-updates',
      description: 'ข่าวอัปเดตคอร์สเรียนและหลักสูตรใหม่',
      color: '#ffc107',
      icon: 'book-open',
      orderIndex: 3
    },
    {
      name: 'ระบบ',
      slug: 'system',
      description: 'ข่าวระบบและการบำรุงรักษา',
      color: '#dc3545',
      icon: 'settings',
      orderIndex: 4
    },
    {
      name: 'กิจกรรม',
      slug: 'events',
      description: 'ข่าวกิจกรรมและการแข่งขัน',
      color: '#6f42c1',
      icon: 'calendar',
      orderIndex: 5
    },
    {
      name: 'ทั่วไป',
      slug: 'general',
      description: 'ข่าวสารทั่วไป',
      color: '#6c757d',
      icon: 'newspaper',
      orderIndex: 6
    }
  ];
  
  const existingCategories = await this.count();
  
  if (existingCategories === 0) {
    console.log('📰 Creating default news categories...');
    await this.bulkCreate(defaultCategories);
    console.log('✅ Default news categories created successfully');
  }
};

module.exports = NewsCategory;