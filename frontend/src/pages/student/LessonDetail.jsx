// File: LessonDetail.jsx
// Path: frontend/src/pages/student/LessonDetail.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  PlayCircle,
  CheckCircle,
  Clock,
  ArrowLeft,
  ArrowRight,
  FileText,
  Video,
  File,
  Download,
  Lock,
  AlertCircle,
  Award
} from 'lucide-react';
import { Card, Button } from '../../components/ui';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import lessonService from '../../services/lessonService';
import courseService from '../../services/courseService';

const LessonDetail = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [videoTime, setVideoTime] = useState(0);

  useEffect(() => {
    fetchLessonData();
  }, [courseId, lessonId]);

  useEffect(() => {
    // Track time spent on lesson
    if (lesson && lesson.progress?.status !== 'completed') {
      const startTime = Date.now();
      let lastUpdateTime = 0;
      
      const interval = setInterval(async () => {
        const timeSpent = Math.floor((Date.now() - startTime) / 1000);
        setVideoTime(timeSpent);
        
        // Update progress every 30 seconds
        if (timeSpent - lastUpdateTime >= 30) {
          lastUpdateTime = timeSpent;
          try {
            const currentTimeSpent = timeSpent || (lesson.progress?.timeSpent || 0);
            await lessonService.updateLessonProgress(lessonId, {
              timeSpent: currentTimeSpent,
              completionPercentage: lesson.lessonType === 'video' && lesson.videoDuration
                ? Math.min(100, Math.round((currentTimeSpent / lesson.videoDuration) * 100))
                : lesson.progress?.completionPercentage || 50,
              status: 'in_progress'
            });
          } catch (err) {
            console.error('Error updating progress:', err);
          }
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [lesson, lessonId]);

  const fetchLessonData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch lesson details
      const lessonData = await lessonService.getLessonById(lessonId);
      setLesson(lessonData);

      // Fetch course details
      if (lessonData?.course?.id) {
        const courseData = await courseService.getCourseById(lessonData.course.id);
        setCourse(courseData);
      }

      // Fetch all lessons for navigation
      const allLessons = await lessonService.getCourseLessonsForNavigation(courseId);
      setLessons(allLessons);
    } catch (err) {
      console.error('Error fetching lesson data:', err);
      setError(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async () => {
    if (!lesson || lesson.progress?.status === 'completed') return;

    try {
      const timeSpent = videoTime || (lesson.progress?.timeSpent || 0);
      await lessonService.updateLessonProgress(lessonId, {
        timeSpent: timeSpent,
        completionPercentage: lesson.lessonType === 'video' && lesson.videoDuration
          ? Math.min(100, Math.round((timeSpent / lesson.videoDuration) * 100))
          : lesson.progress?.completionPercentage || 50,
        status: 'in_progress'
      });
    } catch (err) {
      console.error('Error updating progress:', err);
    }
  };

  const handleComplete = async () => {
    try {
      setCompleting(true);
      const timeSpent = videoTime || (lesson.progress?.timeSpent || 0) || (lesson.estimatedTime || 0) * 60;
      await lessonService.completeLesson(lessonId, timeSpent);
      
      // Refresh lesson data
      await fetchLessonData();
      
      // Show success message
      alert('🎉 เรียนจบบทเรียนแล้ว!');
    } catch (err) {
      console.error('Error completing lesson:', err);
      alert('เกิดข้อผิดพลาดในการบันทึกความคืบหน้า');
    } finally {
      setCompleting(false);
    }
  };

  const getCurrentLessonIndex = () => {
    return lessons.findIndex(l => l.id === parseInt(lessonId));
  };

  const getPreviousLesson = () => {
    const currentIndex = getCurrentLessonIndex();
    if (currentIndex > 0) {
      return lessons[currentIndex - 1];
    }
    return null;
  };

  const getNextLesson = () => {
    const currentIndex = getCurrentLessonIndex();
    if (currentIndex < lessons.length - 1) {
      return lessons[currentIndex + 1];
    }
    return null;
  };


  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getLessonIcon = (lessonType) => {
    const icons = {
      video: Video,
      text: FileText,
      document: File,
      quiz: FileText,
      assignment: FileText,
      discussion: FileText
    };
    return icons[lessonType] || FileText;
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
            <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              เกิดข้อผิดพลาด
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <Button variant="primary" onClick={() => navigate(`/courses/${courseId}/learn`)}>
              กลับไปยังหลักสูตร
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              ไม่พบบทเรียน
            </h2>
            <Button variant="primary" onClick={() => navigate(`/courses/${courseId}/learn`)}>
              กลับไปยังหลักสูตร
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const currentIndex = getCurrentLessonIndex();
  const previousLesson = getPreviousLesson();
  const nextLesson = getNextLesson();
  const isCompleted = lesson.progress?.status === 'completed';
  const Icon = getLessonIcon(lesson.lessonType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate(`/courses/${courseId}/learn`)}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          กลับ
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Icon size={20} className="text-primary-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              บทที่ {currentIndex + 1} จาก {lessons.length}
            </span>
            {isCompleted && (
              <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-medium flex items-center gap-1">
                <CheckCircle size={12} />
                เรียนเสร็จแล้ว
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {lesson.title}
          </h1>
          {lesson.description && (
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {lesson.description}
            </p>
          )}
        </div>
      </div>

      {/* Lesson Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Player */}
          {lesson.lessonType === 'video' && lesson.videoUrl && (
            <Card className="p-6">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <iframe
                  src={lesson.videoUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              {lesson.videoDuration && (
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock size={16} />
                  <span>ความยาว: {formatTime(lesson.videoDuration)}</span>
                </div>
              )}
            </Card>
          )}

          {/* Text Content */}
          {lesson.content && (
            <Card className="p-6">
              <div 
                className="prose prose-lg dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: lesson.content }}
              />
            </Card>
          )}

          {/* File Attachments */}
          {lesson.fileAttachments && lesson.fileAttachments.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                ไฟล์แนบ
              </h3>
              <div className="space-y-2">
                {lesson.fileAttachments.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <File size={20} className="text-gray-500" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {file.name || `ไฟล์ ${index + 1}`}
                        </p>
                        {file.size && (
                          <p className="text-sm text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        )}
                      </div>
                    </div>
                    {file.url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(file.url, '_blank')}
                        className="flex items-center gap-2"
                      >
                        <Download size={16} />
                        ดาวน์โหลด
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Mark as Complete */}
          {!isCompleted && (
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    เสร็จสิ้นบทเรียนนี้
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    คลิกปุ่มด้านล่างเมื่อคุณเรียนจบแล้ว
                  </p>
                </div>
                <Button
                  variant="primary"
                  onClick={handleComplete}
                  disabled={completing}
                  className="flex items-center gap-2"
                >
                  {completing ? (
                    <>
                      <LoadingSpinner size="sm" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      ทำเครื่องหมายว่าเรียนเสร็จแล้ว
                    </>
                  )}
                </Button>
              </div>
            </Card>
          )}

          {/* Completion Message */}
          {isCompleted && (
            <Card className="p-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <Award className="text-green-600 dark:text-green-400" size={32} />
                <div>
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                    🎉 เรียนจบแล้ว!
                  </h3>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    คุณได้เรียนจบบทเรียนนี้แล้วเมื่อ {lesson.progress?.completedAt 
                      ? new Date(lesson.progress.completedAt).toLocaleDateString('th-TH')
                      : 'เมื่อเร็วๆ นี้'}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Lesson Info */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              ข้อมูลบทเรียน
            </h3>
            <div className="space-y-3">
              {lesson.estimatedTime && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock size={16} className="text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    เวลาโดยประมาณ: {lesson.estimatedTime} นาที
                  </span>
                </div>
              )}
              {lesson.progress?.timeSpent > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <PlayCircle size={16} className="text-gray-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    เวลาที่ใช้: {formatTime(lesson.progress.timeSpent)}
                  </span>
                </div>
              )}
              {lesson.isRequired && (
                <div className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-full text-xs font-medium inline-block">
                  บทเรียนจำเป็น
                </div>
              )}
            </div>
          </Card>

          {/* Progress */}
          {lesson.progress && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                ความคืบหน้า
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">ความคืบหน้า</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {Math.round(lesson.progress.completionPercentage || 0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all"
                    style={{ width: `${lesson.progress.completionPercentage || 0}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  สถานะ: {
                    lesson.progress.status === 'completed' ? 'เรียนเสร็จแล้ว' :
                    lesson.progress.status === 'in_progress' ? 'กำลังเรียน' :
                    'ยังไม่เริ่มเรียน'
                  }
                </div>
              </div>
            </Card>
          )}

          {/* Navigation */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              นavigation
            </h3>
            <div className="space-y-2">
              {previousLesson ? (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/courses/${courseId}/lessons/${previousLesson.id}`)}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <ArrowLeft size={16} />
                    <span>บทเรียนก่อนหน้า</span>
                  </div>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  disabled
                  className="w-full flex items-center justify-between opacity-50"
                >
                  <div className="flex items-center gap-2">
                    <ArrowLeft size={16} />
                    <span>บทเรียนก่อนหน้า</span>
                  </div>
                </Button>
              )}

              {nextLesson ? (
                <Button
                  variant="primary"
                  onClick={() => navigate(`/courses/${courseId}/lessons/${nextLesson.id}`)}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span>บทเรียนถัดไป</span>
                    <ArrowRight size={16} />
                  </div>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/courses/${courseId}/learn`)}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span>กลับไปยังหลักสูตร</span>
                    <ArrowRight size={16} />
                  </div>
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LessonDetail;

