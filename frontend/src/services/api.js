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
  async (error) => {
    const originalRequest = error.config;
    
    // ถ้า token หมดอายุ (401) และยังไม่ได้ retry
    if (error.response?.status === 401 && !originalRequest._retry && !window.location.pathname.includes('/login')) {
      originalRequest._retry = true;
      
      // ลอง refresh token ก่อน (ถ้ามี refresh token mechanism)
      // สำหรับตอนนี้ ให้ logout เฉพาะเมื่อ token จริงๆ หมดอายุ
      // แต่ถ้าเป็น development mode ให้ขยายเวลา token ไว้ก่อน
      
      // ตรวจสอบว่าเป็น token expired หรือไม่
      const errorMessage = error.response?.data?.message || '';
      if (errorMessage.includes('token') || errorMessage.includes('expired') || errorMessage.includes('invalid')) {
        // Token หมดอายุจริงๆ ให้ logout
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      // ถ้าไม่ใช่ token error อาจจะเป็น authentication error อื่น
    }
    
    // สร้าง error message ที่เข้าใจง่าย
    const errorData = error.response?.data;
    let errorMessage = 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
    
    if (errorData) {
      // ถ้ามี message หลัก
      if (errorData.message) {
        errorMessage = errorData.message;
      }
      // ถ้ามี errors array ให้ใช้ error แรก
      else if (errorData.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
        const firstError = errorData.errors[0];
        errorMessage = typeof firstError === 'string' 
          ? firstError 
          : firstError.message || firstError;
      }
    }
    
    // สร้าง error object ที่มี response data ด้วย
    const customError = new Error(errorMessage);
    customError.response = error.response;
    return Promise.reject(customError);
  }
);

export default api;