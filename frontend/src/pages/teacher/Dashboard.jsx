// File: Dashboard.jsx
// Path: frontend/src/pages/teacher/Dashboard.jsx
// Purpose: Teacher Dashboard

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Users,
  Award,
  FileText,
  TrendingUp,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Card, Button } from '../../components/ui';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import api from '../../services/api';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalLessons: 0,
    totalQuizzes: 0
  });
  const [recentCourses, setRecentCourses] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get all courses and filter by teacherId on frontend
      const coursesResponse = await api.get('/courses', {
        params: { limit: 1000 }
      });
      
      const allCourses = coursesResponse?.data?.courses || coursesResponse?.data?.data?.courses || [];
      
      // Get current user to filter courses
      const userResponse = await api.get('/auth/profile');
      const currentUser = userResponse?.data?.user || userResponse?.data;
      
      // Filter courses where teacherId matches current user
      const courses = allCourses.filter(course => 
        course.teacherId === currentUser?.id || 
        course.teacher?.id === currentUser?.id
      );
      setRecentCourses(courses.slice(0, 5));
      
      // Calculate stats
      const totalStudents = courses.reduce((sum, course) => sum + (course.enrollmentCount || 0), 0);
      const totalLessons = courses.reduce((sum, course) => sum + (course.lessonCount || 0), 0);
      const totalQuizzes = courses.reduce((sum, course) => sum + (course.quizCount || 0), 0);
      
      setStats({
        totalCourses: courses.length,
        totalStudents,
        totalLessons,
        totalQuizzes
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            แดชบอร์ดครูผู้สอน
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            ภาพรวมหลักสูตรและการเรียนการสอนของคุณ
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate('/teacher/courses/create')}
          className="flex items-center gap-2"
        >
          <Plus size={18} />
          สร้างหลักสูตรใหม่
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">หลักสูตรทั้งหมด</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalCourses}</p>
            </div>
            <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <BookOpen className="text-primary-600 dark:text-primary-400" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">นักเรียนทั้งหมด</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalStudents}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">บทเรียนทั้งหมด</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalLessons}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <FileText className="text-green-600 dark:text-green-400" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">แบบทดสอบทั้งหมด</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalQuizzes}</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Award className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Courses */}
      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            หลักสูตรล่าสุด
          </h2>
          <Button
            variant="ghost"
            onClick={() => navigate('/teacher/courses')}
            className="flex items-center gap-1"
          >
            ดูทั้งหมด
            <ArrowRight size={16} />
          </Button>
        </div>

        {recentCourses.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              ยังไม่มีหลักสูตร
            </p>
            <Button
              variant="primary"
              onClick={() => navigate('/teacher/courses/create')}
              className="flex items-center gap-2 mx-auto"
            >
              <Plus size={18} />
              สร้างหลักสูตรใหม่
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentCourses.map((course) => (
              <div
                key={course.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                onClick={() => navigate(`/teacher/courses/${course.id}/quizzes`)}
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {course.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Users size={14} />
                      {course.enrollmentCount || 0} นักเรียน
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText size={14} />
                      {course.lessonCount || 0} บทเรียน
                    </span>
                    <span className="flex items-center gap-1">
                      <Award size={14} />
                      {course.quizCount || 0} แบบทดสอบ
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    course.isPublished 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {course.isPublished ? 'เผยแพร่แล้ว' : 'ร่าง'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/teacher/courses/${course.id}/quizzes`);
                    }}
                  >
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          การดำเนินการด่วน
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => navigate('/teacher/courses/create')}
          >
            <Plus size={18} className="mr-2" />
            สร้างหลักสูตรใหม่
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => navigate('/teacher/courses')}
          >
            <BookOpen size={18} className="mr-2" />
            จัดการหลักสูตร
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => navigate('/teacher/analytics')}
          >
            <TrendingUp size={18} className="mr-2" />
            ดูรายงาน
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default TeacherDashboard;

