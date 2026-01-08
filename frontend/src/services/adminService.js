// File: adminService.js
// Path: frontend/src/services/adminService.js

import api from './api';

const adminService = {
  // ========================================
  // DASHBOARD
  // ========================================

  // Get admin dashboard overview
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  // Get system statistics
  getStatistics: async (params = {}) => {
    const response = await api.get('/admin/statistics', { params });
    return response.data;
  },

  // ========================================
  // USER MANAGEMENT
  // ========================================

  // Get all users with filtering and pagination
  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  // Get user details
  getUserDetails: async (userId) => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data.user;
  },

  // Update user details (admin only)
  updateUser: async (userId, userData) => {
    const response = await api.put(`/admin/users/${userId}`, userData);
    return response.data;
  },

  // Approve/reject teacher account
  approveUser: async (userId, action, data = {}) => {
    // Backend expects 'status' field: 'active' for approve, 'rejected' for reject
    const status = action === 'approve' ? 'active' : 'rejected';
    const response = await api.put(`/admin/users/${userId}/approve`, {
      status,
      ...data
    });
    return response.data;
  },

  // Update user status (suspend/ban/activate)
  updateUserStatus: async (userId, status, data = {}) => {
    const response = await api.put(`/admin/users/${userId}/status`, {
      status, // 'active', 'suspended', 'banned'
      ...data
    });
    return response.data;
  },

  // Delete user (soft delete)
  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  // ========================================
  // COURSE MANAGEMENT
  // ========================================

  // Get all courses for admin
  getCourses: async (params = {}) => {
    const response = await api.get('/admin/courses', { params });
    return response.data;
  },

  // Update course status
  updateCourseStatus: async (courseId, isPublished) => {
    const response = await api.put(`/admin/courses/${courseId}/status`, { isPublished });
    return response.data;
  },

  // ========================================
  // SYSTEM MANAGEMENT
  // ========================================

  // Get system health
  getSystemHealth: async () => {
    const response = await api.get('/admin/health');
    return response.data;
  },

  // Get system logs
  getSystemLogs: async (params = {}) => {
    const response = await api.get('/admin/logs', { params });
    return response.data;
  },

  // Create system backup
  createBackup: async (data = {}) => {
    const response = await api.post('/admin/backup', data);
    return response.data;
  },

  // Export data
  exportData: async (params = {}) => {
    const response = await api.post('/admin/export', params);
    return response.data;
  },

  // Toggle maintenance mode
  toggleMaintenance: async (data) => {
    const response = await api.post('/admin/maintenance', data);
    return response.data;
  }
};

export default adminService;

