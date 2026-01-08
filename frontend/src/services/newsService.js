// File: newsService.js
// Path: frontend/src/services/newsService.js

import api from './api';

const newsService = {
  // Get all news (public - published only)
  getAllNews: async (params = {}) => {
    const response = await api.get('/news', { params });
    return response.data;
  },

  // Get news by slug
  getNewsBySlug: async (slug) => {
    const response = await api.get(`/news/${slug}`);
    return response.data;
  },

  // Get news by ID (for admin)
  getNewsById: async (id) => {
    const response = await api.get(`/news/admin/${id}`);
    return response.data;
  },

  // Get featured news
  getFeaturedNews: async (limit = 5) => {
    const response = await api.get('/news/featured', { params: { limit } });
    return response.data;
  },

  // Get popular news
  getPopularNews: async (limit = 5, days = 7) => {
    const response = await api.get('/news/popular', { params: { limit, days } });
    return response.data;
  },

  // Get news categories
  getNewsCategories: async (includeCount = false) => {
    const response = await api.get('/news/categories', { 
      params: { include_count: includeCount } 
    });
    return response.data;
  },

  // ========================================
  // ADMIN/AUTHOR ROUTES
  // ========================================

  // Get all news for admin (includes draft, scheduled)
  getAdminNews: async (params = {}) => {
    const response = await api.get('/news/admin/all', { params });
    return response.data;
  },

  // Create news
  createNews: async (newsData) => {
    const response = await api.post('/news', newsData);
    return response.data;
  },

  // Update news
  updateNews: async (id, newsData) => {
    const response = await api.put(`/news/${id}`, newsData);
    return response.data;
  },

  // Delete news
  deleteNews: async (id) => {
    const response = await api.delete(`/news/${id}`);
    return response.data;
  },

  // Publish/unpublish news
  togglePublishNews: async (id, action, data = {}) => {
    const response = await api.patch(`/news/${id}/publish`, { action, ...data });
    return response.data;
  },

  // Get my news (for teachers)
  getMyNews: async () => {
    const response = await api.get('/news/my');
    return response.data;
  },

  // ========================================
  // CATEGORY MANAGEMENT (Admin only)
  // ========================================

  // Create category
  createCategory: async (categoryData) => {
    const response = await api.post('/news/categories', categoryData);
    return response.data;
  },

  // Update category
  updateCategory: async (id, categoryData) => {
    const response = await api.put(`/news/categories/${id}`, categoryData);
    return response.data;
  },

  // Delete category
  deleteCategory: async (id) => {
    const response = await api.delete(`/news/categories/${id}`);
    return response.data;
  },

  // ========================================
  // ANALYTICS
  // ========================================

  // Get news analytics
  getNewsAnalytics: async (period = 30) => {
    const response = await api.get('/news/analytics', { params: { period } });
    return response.data;
  }
};

export default newsService;

