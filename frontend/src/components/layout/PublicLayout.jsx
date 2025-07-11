
// File: PublicLayout.jsx
// Path: frontend/src/components/layout/PublicLayout.jsx

import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

const PublicLayout = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <a href="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg"></div>
                <span className="text-2xl font-bold text-gray-900">LearnSync</span>
              </a>
            </div>
            
            {/* Navigation Links */}
            <nav className="hidden md:flex space-x-8">
              <a href="/" className="text-gray-700 hover:text-primary-600 font-medium">หน้าหลัก</a>
              <a href="/courses" className="text-gray-700 hover:text-primary-600 font-medium">รายวิชา</a>
              <a href="/about" className="text-gray-700 hover:text-primary-600 font-medium">เกี่ยวกับเรา</a>
            </nav>
            
            {/* Auth Buttons & Theme Toggle */}
            <div className="flex items-center space-x-4">
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
              <a 
                href="/login" 
                className="text-gray-700 hover:text-primary-600 font-medium"
              >
                เข้าสู่ระบบ
              </a>
              <a 
                href="/register" 
                className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:from-primary-600 hover:to-primary-700 transition-all"
              >
                สมัครสมาชิก
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg"></div>
                <span className="text-2xl font-bold">LearnSync</span>
              </div>
              <p className="text-gray-400">
                แพลตฟอร์มการเรียนรู้ออนไลน์ที่ทันสมัย เพื่อการศึกษาที่ไม่มีขีดจำกัด
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">รายวิชา</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">การเขียนโปรแกรม</a></li>
                <li><a href="#" className="hover:text-white">การออกแบบ</a></li>
                <li><a href="#" className="hover:text-white">ธุรกิจ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">บริษัท</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">เกี่ยวกับเรา</a></li>
                <li><a href="#" className="hover:text-white">ติดต่อเรา</a></li>
                <li><a href="#" className="hover:text-white">นโยบายความเป็นส่วนตัว</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">ติดตาม</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">Facebook</a>
                <a href="#" className="text-gray-400 hover:text-white">Twitter</a>
                <a href="#" className="text-gray-400 hover:text-white">Instagram</a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 LearnSync. สงวนลิขสิทธิ์.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;