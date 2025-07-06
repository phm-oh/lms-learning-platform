
// File: backend/src/models/notification/Notification.js
// Path: backend/src/models/notification/Notification.js

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  recipientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'recipient_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  senderId: {
    type: DataTypes.INTEGER,
    field: 'sender_id',
    references: {
      model: 'users',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM(
      'enrollment_request', 'enrollment_approved', 'enrollment_rejected',
      'new_content', 'quiz_assigned', 'quiz_graded', 'course_update',
      'system_announcement', 'reminder', 'achievement'
    ),
    allowNull: false
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  data: {
    type: DataTypes.JSONB, // Additional data for the notification
    defaultValue: {}
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_read'
  },
  isEmailSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_email_sent'
  },
  readAt: {
    type: DataTypes.DATE,
    field: 'read_at'
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// Instance methods
Notification.prototype.markAsRead = async function() {
  this.isRead = true;
  this.readAt = new Date();
  return await this.save();
};

// Class methods
Notification.findUnreadByUser = function(userId) {
  return this.findAll({
    where: {
      recipientId: userId,
      isRead: false
    },
    order: [['created_at', 'DESC']]
  });
};

Notification.createNotification = async function(data) {
  return await this.create(data);
};

module.exports = Notification;
