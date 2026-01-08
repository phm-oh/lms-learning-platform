// File: lessonService.js
// Path: frontend/src/services/lessonService.js

import api from './api';

const lessonService = {
  // Get lessons for a course
  getCourseLessons: async (courseId, includeProgress = true) => {
    const response = await api.get(`/lessons/course/${courseId}`, {
      params: { includeProgress: includeProgress.toString() }
    });
    return response?.data?.lessons || [];
  },

  // Get single lesson details
  getLessonById: async (lessonId) => {
    const response = await api.get(`/lessons/${lessonId}`);
    return response?.data?.lesson;
  },

  // Update lesson progress
  updateLessonProgress: async (lessonId, progressData) => {
    const response = await api.post(`/lessons/${lessonId}/progress`, progressData);
    return response?.data;
  },

  // Mark lesson as completed
  completeLesson: async (lessonId, timeSpent = 0) => {
    const response = await api.post(`/lessons/${lessonId}/complete`, { timeSpent });
    return response?.data;
  },

  // Get all lessons for a course (for navigation)
  getCourseLessonsForNavigation: async (courseId) => {
    const response = await api.get(`/lessons/course/${courseId}`, {
      params: { includeProgress: 'false' }
    });
    return response?.data?.lessons || [];
  }
};

export default lessonService;

