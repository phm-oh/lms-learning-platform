
// File: authService.js
// Path: frontend/src/services/authService.js

import api from './api';

const authService = {
  // Login
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Register
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Get current user profile
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data.user;
  },

  // Update profile
  updateProfile: async (profileData) => {
    const response = await api.patch('/auth/profile', profileData);
    return response.data.user;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.patch('/auth/change-password', passwordData);
    return response.data;
  },

  // Forgot password
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (token, passwordData) => {
    const response = await api.patch(`/auth/reset-password/${token}`, passwordData);
    return response.data;
  },

  // Upload profile photo
  uploadPhoto: async (photoFile) => {
    const formData = new FormData();
    formData.append('photo', photoFile);
    
    const response = await api.post('/auth/profile/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete profile photo
  deletePhoto: async () => {
    const response = await api.delete('/auth/profile/photo');
    return response.data;
  }
};

export default authService;