// File: studentService.js
// Path: frontend/src/services/studentService.js

import api from './api';

const studentService = {
  // Get student dashboard data
  getDashboard: async () => {
    const response = await api.get('/students/dashboard');
    return response.data;
  },

  // Get my quizzes
  getMyQuizzes: async () => {
    const response = await api.get('/quizzes/my');
    return response.data.quizzes;
  },

  // Get my assignments
  getMyAssignments: async () => {
    const response = await api.get('/assignments/my');
    return response.data.assignments;
  }
};

export default studentService;



