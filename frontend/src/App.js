// frontend/src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Layout, { PublicLayout } from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import HomePage from "./pages/public/HomePage";
import AboutUs from "./pages/public/AboutUs";
import Courses from "./pages/public/Courses";
import CourseDetail from "./pages/public/CourseDetail";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminCourses from "./pages/admin/Courses";
import AdminNews from "./pages/admin/News";
import AdminNewsForm from "./pages/admin/NewsForm";
import AdminSettings from "./pages/admin/Settings";
import MyEnrollments from "./pages/student/MyEnrollments";
import MyCourses from "./pages/student/MyCourses";
import CourseLearning from "./pages/student/CourseLearning";
import LessonDetail from "./pages/student/LessonDetail";
import QuizTaking from "./pages/student/QuizTaking";
import QuizResults from "./pages/student/QuizResults";
import QuizList from "./pages/teacher/QuizList";
import QuizForm from "./pages/teacher/QuizForm";
import TeacherDashboard from "./pages/teacher/Dashboard";
import TeacherCourses from "./pages/teacher/Courses";
import CourseForm from "./pages/teacher/CourseForm";

// Placeholder pages for navigation
const PlaceholderPage = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-center">
    <div className="text-6xl mb-4">🚧</div>
    <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
    <p className="text-gray-500">This page is under construction.</p>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Main App Routes
const AppRoutes = () => {
  const { user } = useAuth();
  const userRole = user?.role || 'student';

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={
        <PublicLayout>
          <HomePage />
        </PublicLayout>
      } />
      
      <Route path="/login" element={
        <PublicLayout>
          <Login />
        </PublicLayout>
      } />
      
      <Route path="/register" element={
        <PublicLayout>
          <Register />
        </PublicLayout>
      } />

      <Route path="/about" element={
        <PublicLayout>
          <AboutUs />
        </PublicLayout>
      } />

      <Route path="/courses" element={
        <PublicLayout>
          <Courses />
        </PublicLayout>
      } />

      <Route path="/courses/:id" element={
        <PublicLayout>
          <CourseDetail />
        </PublicLayout>
      } />

      {/* Protected Routes - Student */}
      <Route path="/dashboard" element={
        <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
          <Layout userRole={userRole} user={user}>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/my-courses" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Layout userRole={userRole} user={user}>
            <MyCourses />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/enrollments" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Layout userRole={userRole} user={user}>
            <MyEnrollments />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/courses/:id/learn" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Layout userRole={userRole} user={user}>
            <CourseLearning />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/courses/:courseId/lessons/:lessonId" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Layout userRole={userRole} user={user}>
            <LessonDetail />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/courses/:courseId/quizzes/:quizId" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Layout userRole={userRole} user={user}>
            <QuizTaking />
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/courses/:courseId/quizzes/:quizId/results/:attemptId" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Layout userRole={userRole} user={user}>
            <QuizResults />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/assignments" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Layout userRole={userRole} user={user}>
            <PlaceholderPage title="Assignments" />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/quizzes" element={
        <ProtectedRoute allowedRoles={['student']}>
          <Layout userRole={userRole} user={user}>
            <PlaceholderPage title="Skill Tests & Quizzes" />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute>
          <Layout userRole={userRole} user={user}>
            <PlaceholderPage title="My Profile" />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute>
          <Layout userRole={userRole} user={user}>
            <PlaceholderPage title="Settings" />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Teacher Routes */}
      <Route path="/teacher/dashboard" element={
        <ProtectedRoute allowedRoles={['teacher', 'admin']}>
          <Layout userRole={userRole} user={user}>
            <TeacherDashboard />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/teacher/courses" element={
        <ProtectedRoute allowedRoles={['teacher', 'admin']}>
          <Layout userRole={userRole} user={user}>
            <TeacherCourses />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/teacher/courses/:courseId/quizzes" element={
        <ProtectedRoute allowedRoles={['teacher', 'admin']}>
          <Layout userRole={userRole} user={user}>
            <QuizList />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/teacher/courses/:courseId/quizzes/create" element={
        <ProtectedRoute allowedRoles={['teacher', 'admin']}>
          <Layout userRole={userRole} user={user}>
            <QuizForm />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/teacher/courses/:courseId/quizzes/:quizId/edit" element={
        <ProtectedRoute allowedRoles={['teacher', 'admin']}>
          <Layout userRole={userRole} user={user}>
            <QuizForm />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/teacher/courses/create" element={
        <ProtectedRoute allowedRoles={['teacher', 'admin']}>
          <Layout userRole={userRole} user={user}>
            <CourseForm />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/teacher/courses/:id/edit" element={
        <ProtectedRoute allowedRoles={['teacher', 'admin']}>
          <Layout userRole={userRole} user={user}>
            <CourseForm />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/teacher/students" element={
        <ProtectedRoute allowedRoles={['teacher', 'admin']}>
          <Layout userRole={userRole} user={user}>
            <PlaceholderPage title="Students" />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/teacher/analytics" element={
        <ProtectedRoute allowedRoles={['teacher', 'admin']}>
          <Layout userRole={userRole} user={user}>
            <PlaceholderPage title="Analytics" />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Layout userRole={userRole} user={user}>
            <AdminDashboard />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/admin/users" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Layout userRole={userRole} user={user}>
            <AdminUsers />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/admin/courses" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Layout userRole={userRole} user={user}>
            <AdminCourses />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/admin/news" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Layout userRole={userRole} user={user}>
            <AdminNews />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/admin/news/create" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Layout userRole={userRole} user={user}>
            <AdminNewsForm />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/admin/news/:id/edit" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Layout userRole={userRole} user={user}>
            <AdminNewsForm />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/admin/settings" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <Layout userRole={userRole} user={user}>
            <AdminSettings />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
