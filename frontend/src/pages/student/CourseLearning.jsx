// File: CourseLearning.jsx
// Path: frontend/src/pages/student/CourseLearning.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  PlayCircle,
  CheckCircle,
  Clock,
  Lock,
  ArrowLeft,
  ArrowRight,
  FileText,
  Video,
  File,
  HelpCircle,
  Award,
  TrendingUp,
  Eye
} from 'lucide-react';
import { Card, Button } from '../../components/ui';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import courseService from '../../services/courseService';
import lessonService from '../../services/lessonService';
import quizService from '../../services/quizService';

const CourseLearning = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCourseData();
  }, [id]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch course details
      const courseData = await courseService.getCourseById(id);
      setCourse(courseData);

      // Fetch enrollment to get progress
      const enrollments = await courseService.getMyEnrollments();
      const courseEnrollment = enrollments.find(e => e.courseId === parseInt(id));
      setEnrollment(courseEnrollment);

      // Fetch lessons with progress
      const lessonsData = await lessonService.getCourseLessons(id, true);
      setLessons(lessonsData);

      // Fetch quizzes
      try {
        const quizzesData = await quizService.getCourseQuizzes(id);
        console.log('Fetched quizzes:', quizzesData);
        setQuizzes(Array.isArray(quizzesData) ? quizzesData : []);
      } catch (quizError) {
        console.warn('Error fetching quizzes:', quizError);
        setQuizzes([]); // Set empty array if error
      }
    } catch (err) {
      console.error('Error fetching course data:', err);
      setError(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const getLessonIcon = (lessonType) => {
    const icons = {
      video: Video,
      text: FileText,
      document: File,
      quiz: HelpCircle,
      assignment: FileText,
      discussion: HelpCircle
    };
    return icons[lessonType] || FileText;
  };

  const getLessonStatus = (lesson) => {
    if (!lesson.progress) {
      return { status: 'not_started', label: 'ยังไม่เริ่มเรียน', color: 'gray' };
    }
    
    if (lesson.progress.status === 'completed') {
      return { status: 'completed', label: 'เรียนเสร็จแล้ว', color: 'green' };
    }
    
    if (lesson.progress.status === 'in_progress') {
      return { status: 'in_progress', label: 'กำลังเรียน', color: 'blue' };
    }
    
    return { status: 'not_started', label: 'ยังไม่เริ่มเรียน', color: 'gray' };
  };

  const calculateCourseProgress = () => {
    if (!lessons.length) return 0;
    const completedLessons = lessons.filter(l => l.progress?.status === 'completed').length;
    return Math.round((completedLessons / lessons.length) * 100);
  };

  const getCompletedLessonsCount = () => {
    return lessons.filter(l => l.progress?.status === 'completed').length;
  };

  const handleLessonClick = (lesson) => {
    // Navigate to lesson detail page (to be created)
    navigate(`/courses/${id}/lessons/${lesson.id}`);
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
            <BookOpen className="mx-auto text-red-500 mb-4" size={48} />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              เกิดข้อผิดพลาด
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <Button variant="primary" onClick={fetchCourseData}>
              ลองอีกครั้ง
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              ไม่พบหลักสูตร
            </h2>
            <Button variant="primary" onClick={() => navigate('/my-courses')}>
              กลับไปยังหลักสูตรของฉัน
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const courseProgress = calculateCourseProgress();
  const completedCount = getCompletedLessonsCount();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate('/my-courses')}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          กลับ
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {course.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {course.description || 'ไม่มีคำอธิบาย'}
          </p>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">ความคืบหน้า</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {courseProgress}%
              </p>
            </div>
            <TrendingUp className="text-primary-500" size={32} />
          </div>
          <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${courseProgress}%` }}
            />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">บทเรียนที่เสร็จแล้ว</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {completedCount} / {lessons.length}
              </p>
            </div>
            <CheckCircle className="text-green-500" size={32} />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">บทเรียนทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {lessons.length}
              </p>
            </div>
            <BookOpen className="text-blue-500" size={32} />
          </div>
        </Card>
      </div>

      {/* Lessons List */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          บทเรียนทั้งหมด
        </h2>

        {lessons.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-600 dark:text-gray-400">
              ยังไม่มีบทเรียนในหลักสูตรนี้
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {lessons.map((lesson, index) => {
              const Icon = getLessonIcon(lesson.lessonType);
              const statusInfo = getLessonStatus(lesson);
              const isAccessible = lesson.isAccessible !== false;

              return (
                <div
                  key={lesson.id}
                  className={`p-4 rounded-lg border transition-all ${
                    isAccessible
                      ? 'border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:shadow-md cursor-pointer'
                      : 'border-gray-200 dark:border-gray-700 opacity-60'
                  }`}
                  onClick={() => isAccessible && handleLessonClick(lesson)}
                >
                  <div className="flex items-start gap-4">
                    {/* Lesson Number */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <span className="text-primary-600 dark:text-primary-400 font-semibold">
                        {index + 1}
                      </span>
                    </div>

                    {/* Lesson Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Icon size={18} className="text-gray-500 dark:text-gray-400" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {lesson.title}
                            </h3>
                            {!isAccessible && (
                              <Lock size={16} className="text-gray-400" />
                            )}
                          </div>
                          {lesson.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                              {lesson.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            {lesson.estimatedTime && (
                              <div className="flex items-center gap-1">
                                <Clock size={14} />
                                <span>{lesson.estimatedTime} นาที</span>
                              </div>
                            )}
                            {lesson.isRequired && (
                              <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded text-xs">
                                จำเป็น
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex-shrink-0">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              statusInfo.status === 'completed'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                : statusInfo.status === 'in_progress'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                            }`}
                          >
                            {statusInfo.status === 'completed' && (
                              <CheckCircle size={12} className="inline mr-1" />
                            )}
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      {lesson.progress && lesson.progress.completionPercentage > 0 && (
                        <div className="mt-3">
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <div
                              className="bg-primary-500 h-1.5 rounded-full transition-all"
                              style={{ width: `${lesson.progress.completionPercentage}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Quizzes Section */}
      {quizzes.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            แบบทดสอบ
          </h2>
          <div className="space-y-3">
            {quizzes.map((quiz) => {
              const canAttempt = quiz.canAttempt !== false;
              // Use attemptsLeft from backend if available, otherwise calculate
              const attemptsLeft = quiz.attemptsLeft !== undefined 
                ? quiz.attemptsLeft 
                : Math.max(0, (quiz.maxAttempts || 0) - (quiz.userAttempts || 0));
              
              return (
                <div
                  key={quiz.id}
                  className={`p-4 rounded-lg border transition-all ${
                    canAttempt
                      ? 'border-gray-200 dark:border-gray-700 hover:border-primary-300 hover:shadow-md cursor-pointer'
                      : 'border-gray-200 dark:border-gray-700 opacity-60'
                  }`}
                  onClick={() => canAttempt && navigate(`/courses/${id}/quizzes/${quiz.id}`)}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <HelpCircle size={20} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {quiz.title}
                          </h3>
                          {quiz.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                              {quiz.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            {quiz.timeLimit && (
                              <div className="flex items-center gap-1">
                                <Clock size={14} />
                                <span>{quiz.timeLimit} นาที</span>
                              </div>
                            )}
                            {quiz.maxAttempts && (
                              <div className="flex items-center gap-1">
                                <span>เหลือ {attemptsLeft} ครั้ง</span>
                              </div>
                            )}
                            {quiz.passingScore && (
                              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded text-xs">
                                ผ่าน {quiz.passingScore}%
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0 flex gap-2 items-center">
                          {canAttempt ? (
                            <Button
                              variant="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/courses/${id}/quizzes/${quiz.id}`);
                              }}
                            >
                              {quiz.incompleteAttempt ? 'ทำต่อ' : 'เริ่มทำ'}
                            </Button>
                          ) : (
                            <>
                              {quiz.lastAttempt && quiz.lastAttempt.id && (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/courses/${id}/quizzes/${quiz.id}/results/${quiz.lastAttempt.id}`);
                                  }}
                                  className="flex items-center gap-1"
                                >
                                  <Eye size={16} />
                                  ดูผลลัพธ์
                                </Button>
                              )}
                              <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                                ครบจำนวนครั้งแล้ว
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {quiz.lastAttempt && quiz.lastAttempt.isCompleted && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            คะแนนล่าสุด: {quiz.lastAttempt.percentage || 0}% 
                            {quiz.lastAttempt.percentage >= (quiz.passingScore || 70) && (
                              <span className="ml-2 text-green-600 dark:text-green-400">✓ ผ่าน</span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

export default CourseLearning;

