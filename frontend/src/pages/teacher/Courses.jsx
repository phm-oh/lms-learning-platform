// File: Courses.jsx
// Path: frontend/src/pages/teacher/Courses.jsx
// Purpose: Teacher Courses Management Page

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Users,
  Award,
  FileText,
  Clock,
  Search,
  Filter,
  AlertCircle
} from 'lucide-react';
import { Card, Button, Input } from '../../components/ui';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import courseService from '../../services/courseService';
import api from '../../services/api';

const TeacherCourses = () => {
  const navigate = useNavigate();
  
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchCourses();
  }, [statusFilter]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use dedicated endpoint for teacher's courses
      const response = await api.get('/courses/my-teaching', {
        params: {
          limit: 1000,
          status: statusFilter || undefined
        }
      });
      
      const data = response?.data || response;
      const coursesData = data.courses || data.data?.courses || [];
      
      setCourses(coursesData);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (courseId, currentStatus) => {
    if (!window.confirm(`คุณต้องการ${currentStatus ? 'ยกเลิกการเผยแพร่' : 'เผยแพร่'}หลักสูตรนี้ใช่หรือไม่?`)) {
      return;
    }

    try {
      await courseService.togglePublishCourse(courseId, !currentStatus);
      await fetchCourses();
    } catch (err) {
      console.error('Error toggling publish:', err);
      alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปเดต');
    }
  };

  const handleDelete = async (courseId, courseTitle) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบหลักสูตร "${courseTitle}"? การกระทำนี้ไม่สามารถยกเลิกได้`)) {
      return;
    }

    try {
      await courseService.deleteCourse(courseId);
      await fetchCourses();
    } catch (err) {
      console.error('Error deleting course:', err);
      alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการลบ');
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = !searchTerm || 
      course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || 
      (statusFilter === 'published' && course.isPublished) ||
      (statusFilter === 'draft' && !course.isPublished);
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              เกิดข้อผิดพลาด
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <Button variant="primary" onClick={fetchCourses}>
              ลองอีกครั้ง
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            หลักสูตรของฉัน
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            จัดการหลักสูตรที่คุณสอน
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

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="ค้นหาหลักสูตร..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">ทุกสถานะ</option>
              <option value="published">เผยแพร่แล้ว</option>
              <option value="draft">ร่าง</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Courses List */}
      {filteredCourses.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="mx-auto text-gray-400 mb-4" size={64} />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {courses.length === 0 ? 'ยังไม่มีหลักสูตร' : 'ไม่พบหลักสูตรที่ค้นหา'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {courses.length === 0 
              ? 'เริ่มต้นด้วยการสร้างหลักสูตรใหม่' 
              : 'ลองเปลี่ยนคำค้นหาหรือตัวกรอง'}
          </p>
          {courses.length === 0 && (
            <Button
              variant="primary"
              onClick={() => navigate('/teacher/courses/create')}
              className="flex items-center gap-2 mx-auto"
            >
              <Plus size={18} />
              สร้างหลักสูตรใหม่
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {course.title}
                  </h3>
                  {course.category && (
                    <span 
                      className="inline-block px-2 py-1 rounded text-xs font-medium mb-2"
                      style={{ 
                        backgroundColor: `${course.category.color}20`,
                        color: course.category.color 
                      }}
                    >
                      {course.category.name}
                    </span>
                  )}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  course.isPublished 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                }`}>
                  {course.isPublished ? 'เผยแพร่แล้ว' : 'ร่าง'}
                </span>
              </div>

              {course.description && (
                <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 text-sm">
                  {course.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <div className="flex items-center gap-1">
                  <Users size={16} />
                  <span>{course.enrollmentCount || 0} นักเรียน</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileText size={16} />
                  <span>{course.lessonCount || 0} บทเรียน</span>
                </div>
                <div className="flex items-center gap-1">
                  <Award size={16} />
                  <span>{course.quizCount || 0} แบบทดสอบ</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/teacher/courses/${course.id}/quizzes`)}
                  className="flex-1"
                >
                  <Award size={16} className="mr-1" />
                  แบบทดสอบ
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTogglePublish(course.id, course.isPublished)}
                  className="flex-1"
                >
                  {course.isPublished ? (
                    <>
                      <EyeOff size={16} className="mr-1" />
                      ซ่อน
                    </>
                  ) : (
                    <>
                      <Eye size={16} className="mr-1" />
                      เผยแพร่
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/teacher/courses/${course.id}/edit`)}
                >
                  <Edit size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(course.id, course.title)}
                  className="text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherCourses;

