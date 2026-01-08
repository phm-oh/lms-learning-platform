// File: quizService.js
// Path: frontend/src/services/quizService.js

import api from './api';

const quizService = {
  // Get quizzes for a course
  getCourseQuizzes: async (courseId) => {
    try {
      const response = await api.get(`/quizzes/course/${courseId}`);
      console.log('Quiz API response:', response);
      return response?.data?.quizzes || [];
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      return [];
    }
  },

  // Get single quiz details
  getQuizById: async (quizId, includeQuestions = false) => {
    const response = await api.get(`/quizzes/${quizId}`, {
      params: { includeQuestions: includeQuestions.toString() }
    });
    return response?.data?.quiz;
  },

  // Start quiz attempt
  startQuizAttempt: async (quizId) => {
    const response = await api.post(`/quizzes/${quizId}/attempt`);
    return response?.data; // Returns { attempt, quiz, timeRemaining }
  },

  // Submit answer for a question
  submitAnswer: async (quizId, questionId, answer) => {
    const response = await api.post(`/quizzes/${quizId}/answer`, {
      questionId,
      answer
    });
    return response?.data;
  },

  // Submit complete quiz
  submitQuiz: async (quizId, attemptId) => {
    const response = await api.post(`/quizzes/${quizId}/submit`, {
      attemptId
    });
    return response?.data; // Returns { attempt: { id, score, maxScore, percentage, ... } }
  },

  // Get quiz results
  getQuizResults: async (quizId, attemptId) => {
    const response = await api.get(`/quizzes/${quizId}/results`, {
      params: { attemptId }
    });
    return response?.data;
  },

  // ========================================
  // TEACHER QUIZ MANAGEMENT
  // ========================================

  // Create new quiz
  createQuiz: async (quizData) => {
    const response = await api.post('/quizzes', quizData);
    return response?.data?.quiz;
  },

  // Update quiz
  updateQuiz: async (quizId, quizData) => {
    const response = await api.put(`/quizzes/${quizId}`, quizData);
    return response?.data?.quiz;
  },

  // Delete quiz
  deleteQuiz: async (quizId) => {
    const response = await api.delete(`/quizzes/${quizId}`);
    return response?.data;
  },

  // Toggle publish/unpublish quiz
  togglePublishQuiz: async (quizId, isPublished) => {
    const response = await api.patch(`/quizzes/${quizId}/publish`, { isPublished });
    return response?.data?.quiz;
  },

  // Get quizzes for a course (teacher view - includes unpublished)
  getCourseQuizzesForTeacher: async (courseId) => {
    const response = await api.get(`/quizzes/course/${courseId}`);
    return response?.data?.quizzes || [];
  }
};

export default quizService;

