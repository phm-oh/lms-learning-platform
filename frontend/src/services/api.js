// File: api.js
// Path: frontend/src/services/api.js

import axios from 'axios';

// Base API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - เพิ่ม token อัตโนมัติ
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - จัดการ error อัตโนมัติ
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // ถ้า token หมดอายุ ให้ logout อัตโนมัติ
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    // สร้าง error message ที่เข้าใจง่าย
    const errorMessage = error.response?.data?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
    return Promise.reject(new Error(errorMessage));
  }
);

export default api;