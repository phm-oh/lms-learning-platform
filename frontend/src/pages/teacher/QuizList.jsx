// File: QuizList.jsx
// Path: frontend/src/pages/teacher/QuizList.jsx
// Purpose: Quiz Management Page for Teachers

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Award,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Power,
  PowerOff,
  RotateCcw,
  XCircle,
  CheckCircle,
  Clock,
  Users,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { Card, Button } from '../../components/ui';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import quizService from '../../services/quizService';
import courseService from '../../services/courseService';

const QuizList = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const [quizzes, setQuizzes] = useState([]);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchData();
  }, [courseId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch course details
      const courseData = await courseService.getCourseById(courseId);
      setCourse(courseData);
      
      // Fetch quizzes
      const quizzesData = await quizService.getCourseQuizzesForTeacher(courseId);
      setQuizzes(quizzesData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (quizId, currentStatus) => {
    try {
      setActionLoading({ ...actionLoading, [`publish-${quizId}`]: true });
      await quizService.togglePublishQuiz(quizId, !currentStatus);
      await fetchData();
    } catch (err) {
      console.error('Error toggling publish:', err);
      alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปเดต');
    } finally {
      setActionLoading({ ...actionLoading, [`publish-${quizId}`]: false });
    }
  };

  const handleToggleActive = async (quizId, currentStatus) => {
    try {
      setActionLoading({ ...actionLoading, [`active-${quizId}`]: true });
      await quizService.updateQuiz(quizId, { isActive: !currentStatus });
      await fetchData();
    } catch (err) {
      console.error('Error toggling active:', err);
      alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการอัปเดต');
    } finally {
      setActionLoading({ ...actionLoading, [`active-${quizId}`]: false });
    }
  };

  const handleDelete = async (quizId, quizTitle) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบแบบทดสอบ "${quizTitle}"?`)) {
      return;
    }

    try {
      setActionLoading({ ...actionLoading, [`delete-${quizId}`]: true });
      await quizService.deleteQuiz(quizId);
      await fetchData();
    } catch (err) {
      console.error('Error deleting quiz:', err);
      alert(err.response?.data?.message || 'เกิดข้อผิดพลาดในการลบ');
    } finally {
      setActionLoading({ ...actionLoading, [`delete-${quizId}`]: false });
    }
  };

  const getStatusBadge = (quiz) => {
    if (!quiz.isPublished) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
          ยังไม่เผยแพร่
        </span>
      );
    }
    
    if (!quiz.isActive) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
          ปิดชั่วคราว
        </span>
      );
    }

    const now = new Date();
    const availableFrom = quiz.availableFrom ? new Date(quiz.availableFrom) : null;
    const availableUntil = quiz.availableUntil ? new Date(quiz.availableUntil) : null;

    if (availableFrom && now < availableFrom) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          ยังไม่เปิดให้ทำ
        </span>
      );
    }

    if (availableUntil && now > availableUntil) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          หมดอายุแล้ว
        </span>
      );
    }

    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
        เปิดใช้งาน
      </span>
    );
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
            <Button variant="primary" onClick={() => navigate('/teacher/courses')}>
              กลับไปยังรายการหลักสูตร
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
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/teacher/courses')}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            กลับ
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              จัดการแบบทดสอบ
            </h1>
            {course && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {course.title}
              </p>
            )}
          </div>
        </div>
        <Button
          variant="primary"
          onClick={() => navigate(`/teacher/courses/${courseId}/quizzes/create`)}
          className="flex items-center gap-2"
        >
          <Plus size={18} />
          สร้างแบบทดสอบใหม่
        </Button>
      </div>

      {/* Quiz List */}
      {quizzes.length === 0 ? (
        <Card className="p-12 text-center">
          <Award className="mx-auto text-gray-400 mb-4" size={64} />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            ยังไม่มีแบบทดสอบ
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            เริ่มต้นด้วยการสร้างแบบทดสอบใหม่
          </p>
          <Button
            variant="primary"
            onClick={() => navigate(`/teacher/courses/${courseId}/quizzes/create`)}
            className="flex items-center gap-2 mx-auto"
          >
            <Plus size={18} />
            สร้างแบบทดสอบใหม่
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {quiz.title}
                    </h3>
                    {getStatusBadge(quiz)}
                  </div>
                  
                  {quiz.description && (
                    <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                      {quiz.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock size={16} />
                      <span>
                        {quiz.timeLimit ? `${quiz.timeLimit} นาที` : 'ไม่จำกัดเวลา'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <RotateCcw size={16} />
                      <span>
                        {quiz.allowRetake ? `ทำซ้ำได้ ${quiz.maxAttempts} ครั้ง` : 'ทำได้เพียงครั้งเดียว'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle size={16} />
                      <span>ผ่าน {quiz.passingScore}%</span>
                    </div>
                    {quiz.lessonId && (
                      <div className="flex items-center gap-1">
                        <Award size={16} />
                        <span>แบบทดสอบบทเรียน</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/teacher/courses/${courseId}/quizzes/${quiz.id}/edit`)}
                    className="flex items-center gap-1"
                  >
                    <Edit size={16} />
                    แก้ไข
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTogglePublish(quiz.id, quiz.isPublished)}
                    disabled={actionLoading[`publish-${quiz.id}`]}
                    className="flex items-center gap-1"
                  >
                    {quiz.isPublished ? (
                      <>
                        <EyeOff size={16} />
                        ซ่อน
                      </>
                    ) : (
                      <>
                        <Eye size={16} />
                        เผยแพร่
                      </>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(quiz.id, quiz.isActive)}
                    disabled={actionLoading[`active-${quiz.id}`]}
                    className="flex items-center gap-1"
                  >
                    {quiz.isActive ? (
                      <>
                        <PowerOff size={16} />
                        ปิด
                      </>
                    ) : (
                      <>
                        <Power size={16} />
                        เปิด
                      </>
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(quiz.id, quiz.title)}
                    disabled={actionLoading[`delete-${quiz.id}`]}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    <Trash2 size={16} />
                    ลบ
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizList;

