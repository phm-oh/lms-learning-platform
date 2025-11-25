// frontend/src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";

// Placeholder pages for navigation
const PlaceholderPage = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-center">
    <div className="text-6xl mb-4">🚧</div>
    <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
    <p className="text-gray-500">This page is under construction.</p>
  </div>
);

function App() {
  return (
    <Router>
      <Layout userRole="student">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />

          {/* Student Routes */}
          <Route path="/my-courses" element={<PlaceholderPage title="My Courses" />} />
          <Route path="/assignments" element={<PlaceholderPage title="Assignments" />} />
          <Route path="/quizzes" element={<PlaceholderPage title="Skill Tests & Quizzes" />} />
          <Route path="/orders" element={<PlaceholderPage title="Order History" />} />
          <Route path="/profile" element={<PlaceholderPage title="My Profile" />} />
          <Route path="/settings" element={<PlaceholderPage title="Settings" />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
