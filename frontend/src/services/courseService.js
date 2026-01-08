// File: courseService.js
// Path: frontend/src/services/courseService.js

import api from './api';

const courseService = {
  // Get all courses (for browsing)
  getAllCourses: async (params = {}) => {
    const response = await api.get('/courses', { params });
    return response.data;
  },

  // Get course by ID
  getCourseById: async (id) => {
    const response = await api.get(`/courses/${id}`);
    return response.data.course;
  },

  // Get my enrolled courses
  getMyCourses: async () => {
    const response = await api.get('/courses/my');
    return response.data.courses;
  },

  // Enroll in a course
  enroll: async (courseId) => {
    const response = await api.post(`/courses/${courseId}/enroll`);
    return response.data;
  },

  // Get my enrollments
  getMyEnrollments: async () => {
    const response = await api.get('/enrollments/my');
    // api interceptor returns response.data, so response structure is: { success: true, data: { enrollments: [...] } }
    return response?.data?.enrollments || [];
  },

  // Cancel enrollment
  cancelEnrollment: async (courseId) => {
    const response = await api.delete(`/courses/${courseId}/enroll`);
    return response.data;
  },

  // Delete course (admin/teacher only)
  deleteCourse: async (courseId) => {
    const response = await api.delete(`/courses/${courseId}`);
    return response.data;
  },

  // Get course categories
  getCourseCategories: async () => {
    const response = await api.get('/courses/categories');
    return response?.data?.categories || response?.data?.data?.categories || [];
  },

  // Create course (teacher/admin only)
  createCourse: async (courseData) => {
    const response = await api.post('/courses', courseData);
    return response?.data?.course || response?.data?.data?.course;
  },

  // Update course (teacher/admin only)
  updateCourse: async (courseId, courseData) => {
    const response = await api.put(`/courses/${courseId}`, courseData);
    return response?.data?.course || response?.data?.data?.course;
  },

  // Toggle publish course
  togglePublishCourse: async (courseId, isPublished) => {
    const response = await api.patch(`/courses/${courseId}/publish`, { isPublished });
    return response?.data?.course || response?.data?.data?.course;
  }
};

export default courseService;

