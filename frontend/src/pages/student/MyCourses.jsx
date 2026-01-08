// File: MyCourses.jsx
// Path: frontend/src/pages/student/MyCourses.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  PlayCircle,
  Clock,
  CheckCircle,
  TrendingUp,
  Award,
  Search,
  ArrowRight,
  BarChart3
} from 'lucide-react';
import { Card, Button, Input } from '../../components/ui';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import courseService from '../../services/courseService';

const MyCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const fetchMyCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get enrollments and filter only approved ones
      const enrollmentsData = await courseService.getMyEnrollments();
      // Handle both array and object with enrollments property
      const enrollments = Array.isArray(enrollmentsData) ? enrollmentsData : (enrollmentsData?.enrollments || []);
      const approvedEnrollments = enrollments.filter(e => e.status === 'approved');
      
      // Extract courses from enrollments
      const coursesData = approvedEnrollments
        .filter(enrollment => enrollment.course) // Only include enrollments with course data
        .map(enrollment => ({
          ...enrollment.course,
          enrollment: {
            id: enrollment.id,
            enrolledAt: enrollment.enrolledAt || enrollment.requestedAt,
            approvedAt: enrollment.approvedAt,
            progress: enrollment.completionPercentage || 0
          }
        }));
      
      setCourses(coursesData);
    } catch (err) {
      console.error('Error fetching my courses:', err);
      // Only show error if it's a real server error (500+)
      if (err.response?.status >= 500) {
        setError(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
      } else {
        // For other errors (like 404, 403), just set empty array
        setCourses([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      course.title?.toLowerCase().includes(searchLower) ||
      course.description?.toLowerCase().includes(searchLower) ||
      course.teacher?.firstName?.toLowerCase().includes(searchLower) ||
      course.teacher?.lastName?.toLowerCase().includes(searchLower)
    );
  });

  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-gray-300';
  };

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
            <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              เกิดข้อผิดพลาด
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <Button variant="primary" onClick={fetchMyCourses}>
              ลองอีกครั้ง
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            หลักสูตรของฉัน
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            หลักสูตรที่คุณลงทะเบียนแล้วและกำลังเรียนอยู่
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/courses')}>
          <BookOpen size={18} className="mr-2" />
          ดูหลักสูตรทั้งหมด
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            type="text"
            placeholder="ค้นหาหลักสูตร..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Stats Summary */}
      {courses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">หลักสูตรทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{courses.length}</p>
              </div>
              <BookOpen className="text-primary-500" size={32} />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">ความคืบหน้าเฉลี่ย</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(
                    courses.reduce((sum, course) => sum + (course.enrollment?.progress || 0), 0) / courses.length
                  )}%
                </p>
              </div>
              <TrendingUp className="text-green-500" size={32} />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">หลักสูตรที่เสร็จแล้ว</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {courses.filter(course => (course.enrollment?.progress || 0) >= 100).length}
                </p>
              </div>
              <Award className="text-yellow-500" size={32} />
            </div>
          </Card>
        </div>
      )}

      {/* Courses List */}
      {filteredCourses.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {courses.length === 0 ? 'ยังไม่มีหลักสูตร' : 'ไม่พบผลการค้นหา'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {courses.length === 0 
              ? 'เริ่มต้นการเรียนโดยการลงทะเบียนหลักสูตรที่คุณสนใจ'
              : 'ลองเปลี่ยนคำค้นหา'}
          </p>
          {courses.length === 0 && (
            <Button variant="primary" onClick={() => navigate('/courses')}>
              ดูหลักสูตรทั้งหมด
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredCourses.map((course) => {
            const progress = course.enrollment?.progress || 0;
            const isCompleted = progress >= 100;
            
            return (
              <Card key={course.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Course Image */}
                  {course.thumbnail && (
                    <div className="lg:w-48 flex-shrink-0">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-32 lg:h-full object-cover rounded-lg"
                      />
                    </div>
                  )}

                  {/* Course Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {course.category && (
                            <span
                              className="px-3 py-1 rounded-full text-xs font-medium"
                              style={{
                                backgroundColor: `${course.category.color}20`,
                                color: course.category.color
                              }}
                            >
                              {course.category.name}
                            </span>
                          )}
                          {isCompleted && (
                            <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-medium flex items-center gap-1">
                              <Award size={14} />
                              เสร็จสมบูรณ์
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                          {course.title}
                        </h3>
                        {course.description && (
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                            {course.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          ความคืบหน้า
                        </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {Math.round(progress)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-300 ${getProgressColor(progress)}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Course Stats */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                      {course.teacher && (
                        <div className="flex items-center gap-1">
                          <span>ผู้สอน: {course.teacher.firstName} {course.teacher.lastName}</span>
                        </div>
                      )}
                      {course.enrollment?.enrolledAt && (
                        <div className="flex items-center gap-1">
                          <Clock size={16} />
                          <span>
                            ลงทะเบียนเมื่อ: {new Date(course.enrollment.enrolledAt).toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Button
                        variant="primary"
                        onClick={() => navigate(`/courses/${course.id}/learn`)}
                        className="flex-1"
                      >
                        <PlayCircle size={18} className="mr-2" />
                        {isCompleted ? 'ทบทวนเนื้อหา' : 'เรียนต่อ'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/courses/${course.id}`)}
                      >
                        ดูรายละเอียด
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyCourses;

