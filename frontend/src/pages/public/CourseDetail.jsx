// File: CourseDetail.jsx
// Path: frontend/src/pages/public/CourseDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  BookOpen,
  Users,
  Clock,
  Star,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  User,
  Calendar,
  AlertCircle,
  PlayCircle,
  FileText,
  Award
} from 'lucide-react';
import { Card, Button } from '../../components/ui';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import courseService from '../../services/courseService';
// StatusBadge not needed for public course detail

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null); // 'pending', 'approved', 'rejected', null

  useEffect(() => {
    fetchCourseDetail();
  }, [id]);

  const fetchCourseDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const courseData = await courseService.getCourseById(id);
      setCourse(courseData);
      
      // Check enrollment status if user is authenticated and is a student
      if (isAuthenticated && user?.role === 'student') {
        checkEnrollmentStatus();
      }
    } catch (err) {
      console.error('Error fetching course:', err);
      setError(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollmentStatus = async () => {
    try {
      const enrollments = await courseService.getMyEnrollments();
      const enrollment = enrollments.find(e => e.courseId === parseInt(id));
      if (enrollment) {
        setEnrollmentStatus(enrollment.status);
      }
    } catch (err) {
      console.error('Error checking enrollment status:', err);
      // Don't show error, just assume not enrolled
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/courses/${id}` } });
      return;
    }

    if (user?.role !== 'student') {
      alert('เฉพาะนักเรียนเท่านั้นที่สามารถลงทะเบียนได้');
      return;
    }

    try {
      setEnrolling(true);
      await courseService.enroll(id);
      setEnrollmentStatus('pending');
      alert('ส่งคำขอลงทะเบียนเรียบร้อย รอการอนุมัติจากครูผู้สอน');
    } catch (err) {
      console.error('Enrollment error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการลงทะเบียน';
      alert(errorMessage);
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              ไม่พบหลักสูตร
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error || 'ไม่พบหลักสูตรที่คุณกำลังมองหา'}
            </p>
            <Button variant="primary" onClick={() => navigate('/courses')}>
              กลับไปหน้ารายการหลักสูตร
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const getEnrollmentButton = () => {
    if (!isAuthenticated || user?.role !== 'student') {
      return (
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => navigate('/login', { state: { from: `/courses/${id}` } })}
        >
          <BookOpen size={20} className="mr-2" />
          เข้าสู่ระบบเพื่อลงทะเบียน
        </Button>
      );
    }

    if (enrollmentStatus === 'pending') {
      return (
        <Button
          variant="outline"
          size="lg"
          className="w-full"
          disabled
        >
          <ClockIcon size={20} className="mr-2" />
          รอการอนุมัติ
        </Button>
      );
    }

    if (enrollmentStatus === 'approved') {
      return (
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => navigate(`/courses/${id}/learn`)}
        >
          <PlayCircle size={20} className="mr-2" />
          เริ่มเรียน
        </Button>
      );
    }

    if (enrollmentStatus === 'rejected') {
      return (
        <div className="space-y-2">
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            disabled
          >
            <XCircle size={20} className="mr-2" />
            การลงทะเบียนถูกปฏิเสธ
          </Button>
          <p className="text-sm text-red-600 dark:text-red-400 text-center">
            กรุณาติดต่อครูผู้สอนเพื่อสอบถามข้อมูลเพิ่มเติม
          </p>
        </div>
      );
    }

    return (
      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={handleEnroll}
        disabled={enrolling || !course.isPublished}
      >
        {enrolling ? (
          <>
            <LoadingSpinner size="sm" className="mr-2" />
            กำลังส่งคำขอ...
          </>
        ) : (
          <>
            <BookOpen size={20} className="mr-2" />
            ลงทะเบียนเรียน
          </>
        )}
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/courses')}
            className="mb-4"
          >
            <ArrowLeft size={18} className="mr-2" />
            กลับไปหน้ารายการหลักสูตร
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Header */}
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {course.category && (
                      <span
                        className="px-3 py-1 rounded-full text-sm font-medium"
                        style={{
                          backgroundColor: `${course.category.color}20`,
                          color: course.category.color
                        }}
                      >
                        {course.category.name}
                      </span>
                    )}
                    {course.level && (
                      <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-sm">
                        {course.level === 'beginner' ? 'ระดับเริ่มต้น' :
                         course.level === 'intermediate' ? 'ระดับกลาง' :
                         course.level === 'advanced' ? 'ระดับสูง' : course.level}
                      </span>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {course.title}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-lg">
                    {course.description}
                  </p>
                </div>
              </div>

              {/* Course Stats */}
              <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                {course.enrollmentCount !== undefined && (
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Users size={18} className="mr-2" />
                    <span>{course.enrollmentCount || 0} คนลงทะเบียน</span>
                  </div>
                )}
                {course.rating && (
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Star size={18} className="mr-2 fill-yellow-400 text-yellow-400" />
                    <span>{course.rating.toFixed(1)}</span>
                  </div>
                )}
                {course.duration && (
                  <div className="flex items-center text-gray-600 dark:text-gray-400">
                    <Clock size={18} className="mr-2" />
                    <span>{course.duration} ชั่วโมง</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Course Content */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                เกี่ยวกับหลักสูตร
              </h2>
              <div
                className="prose dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: course.content || course.description }}
              />
            </Card>

            {/* What You'll Learn */}
            {course.learningObjectives && course.learningObjectives.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  สิ่งที่คุณจะได้เรียนรู้
                </h2>
                <ul className="space-y-2">
                  {course.learningObjectives.map((objective, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle size={20} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{objective}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Course Requirements */}
            {course.requirements && course.requirements.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  ความต้องการเบื้องต้น
                </h2>
                <ul className="space-y-2">
                  {course.requirements.map((requirement, index) => (
                    <li key={index} className="flex items-start">
                      <FileText size={20} className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{requirement}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              {/* Course Image */}
              {course.thumbnail && (
                <div className="mb-6">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Enrollment Button */}
              <div className="mb-6">
                {getEnrollmentButton()}
              </div>

              {/* Course Info */}
              <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
                {course.teacher && (
                  <div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400 mb-2">
                      <User size={18} className="mr-2" />
                      <span className="text-sm font-medium">ครูผู้สอน</span>
                    </div>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {course.teacher.firstName} {course.teacher.lastName}
                    </p>
                  </div>
                )}

                {course.createdAt && (
                  <div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400 mb-2">
                      <Calendar size={18} className="mr-2" />
                      <span className="text-sm font-medium">วันที่สร้าง</span>
                    </div>
                    <p className="text-gray-900 dark:text-white">
                      {new Date(course.createdAt).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}

                {course.maxStudents && (
                  <div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400 mb-2">
                      <Users size={18} className="mr-2" />
                      <span className="text-sm font-medium">จำนวนนักเรียนสูงสุด</span>
                    </div>
                    <p className="text-gray-900 dark:text-white">
                      {course.maxStudents} คน
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;

