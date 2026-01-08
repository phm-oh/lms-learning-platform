// File: QuizForm.jsx
// Path: frontend/src/pages/teacher/QuizForm.jsx
// Purpose: Create/Edit Quiz Form for Teachers

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Clock,
  RotateCcw,
  CheckCircle,
  Power,
  PowerOff,
  Calendar,
  Settings,
  AlertCircle
} from 'lucide-react';
import { Card, Button, Input, Textarea } from '../../components/ui';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import quizService from '../../services/quizService';
import courseService from '../../services/courseService';

const QuizForm = () => {
  const navigate = useNavigate();
  const { courseId, quizId } = useParams();
  const isEdit = !!quizId;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    quizType: 'practice',
    timeLimit: '',
    maxAttempts: 1,
    passingScore: 70,
    randomizeQuestions: false,
    showCorrectAnswers: true,
    showResultsImmediately: true,
    isActive: true,
    allowRetake: true,
    availableFrom: '',
    availableUntil: '',
    lessonId: '',
    questions: []
  });

  useEffect(() => {
    fetchCourseData();
    if (isEdit) {
      fetchQuiz();
    }
  }, [courseId, quizId]);

  const fetchCourseData = async () => {
    try {
      const courseData = await courseService.getCourseById(courseId);
      setCourse(courseData);
      // TODO: Fetch lessons for this course
      // const lessonsData = await lessonService.getCourseLessons(courseId);
      // setLessons(lessonsData);
    } catch (err) {
      console.error('Error fetching course:', err);
    }
  };

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const quiz = await quizService.getQuizById(quizId, true);
      
      setFormData({
        title: quiz.title || '',
        description: quiz.description || '',
        quizType: quiz.quizType || 'practice',
        timeLimit: quiz.timeLimit || '',
        maxAttempts: quiz.maxAttempts || 1,
        passingScore: quiz.passingScore || 70,
        randomizeQuestions: quiz.randomizeQuestions || false,
        showCorrectAnswers: quiz.showCorrectAnswers !== false,
        showResultsImmediately: quiz.showResultsImmediately !== false,
        isActive: quiz.isActive !== false,
        allowRetake: quiz.allowRetake !== false,
        availableFrom: quiz.availableFrom 
          ? new Date(quiz.availableFrom).toISOString().slice(0, 16) 
          : '',
        availableUntil: quiz.availableUntil 
          ? new Date(quiz.availableUntil).toISOString().slice(0, 16) 
          : '',
        lessonId: quiz.lessonId || '',
        questions: quiz.questions || []
      });
    } catch (err) {
      console.error('Error fetching quiz:', err);
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNumberChange = (name, value) => {
    const numValue = value === '' ? '' : parseInt(value);
    setFormData(prev => ({
      ...prev,
      [name]: numValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);

      const submitData = {
        courseId: parseInt(courseId),
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        quizType: formData.quizType,
        timeLimit: formData.timeLimit ? parseInt(formData.timeLimit) : undefined,
        maxAttempts: parseInt(formData.maxAttempts) || 1,
        passingScore: parseFloat(formData.passingScore) || 70,
        randomizeQuestions: formData.randomizeQuestions || false,
        showCorrectAnswers: formData.showCorrectAnswers !== false,
        showResultsImmediately: formData.showResultsImmediately !== false,
        isActive: formData.isActive !== false,
        allowRetake: formData.allowRetake !== false,
        availableFrom: formData.availableFrom 
          ? new Date(formData.availableFrom).toISOString() 
          : undefined,
        availableUntil: formData.availableUntil 
          ? new Date(formData.availableUntil).toISOString() 
          : undefined,
        lessonId: formData.lessonId ? parseInt(formData.lessonId) : undefined,
        questions: formData.questions.length > 0 ? formData.questions : undefined
      };

      if (isEdit) {
        await quizService.updateQuiz(quizId, submitData);
        alert('อัปเดตแบบทดสอบเรียบร้อย');
      } else {
        await quizService.createQuiz(submitData);
        alert('สร้างแบบทดสอบเรียบร้อย');
      }
      
      navigate(`/teacher/courses/${courseId}/quizzes`);
    } catch (err) {
      console.error('Quiz form error:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          err.message || 
                          'เกิดข้อผิดพลาดในการบันทึก';
      setError(errorMessage);
    } finally {
      setSaving(false);
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
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(`/teacher/courses/${courseId}/quizzes`)}
          >
            <ArrowLeft size={20} className="mr-2" /> กลับ
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {isEdit ? 'แก้ไขแบบทดสอบ' : 'สร้างแบบทดสอบใหม่'}
            </h1>
            {course && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {course.title}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Card className="p-4 mb-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 text-red-800 dark:text-red-300">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            ข้อมูลพื้นฐาน
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ชื่อแบบทดสอบ <span className="text-red-500">*</span>
              </label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="เช่น แบบทดสอบบทที่ 1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                คำอธิบาย
              </label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                placeholder="อธิบายเกี่ยวกับแบบทดสอบนี้..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ประเภทแบบทดสอบ
                </label>
                <select
                  name="quizType"
                  value={formData.quizType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="practice">แบบฝึกหัด</option>
                  <option value="assessment">แบบประเมิน</option>
                  <option value="final_exam">สอบปลายภาค</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  บทเรียน (ถ้าเป็นแบบทดสอบบทเรียน)
                </label>
                <select
                  name="lessonId"
                  value={formData.lessonId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">แบบทดสอบรายวิชา (ไม่ระบุบทเรียน)</option>
                  {/* TODO: Map lessons */}
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Settings size={20} />
            การตั้งค่า
          </h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  จำกัดเวลา (นาที)
                </label>
                <Input
                  type="number"
                  name="timeLimit"
                  value={formData.timeLimit}
                  onChange={(e) => handleNumberChange('timeLimit', e.target.value)}
                  min="1"
                  max="480"
                  placeholder="ไม่จำกัดเวลา"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  เว้นว่างไว้ถ้าไม่จำกัดเวลา
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  จำนวนครั้งที่ทำได้
                </label>
                <Input
                  type="number"
                  name="maxAttempts"
                  value={formData.maxAttempts}
                  onChange={(e) => handleNumberChange('maxAttempts', e.target.value)}
                  min="1"
                  max="10"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  เกณฑ์ผ่าน (%)
                </label>
                <Input
                  type="number"
                  name="passingScore"
                  value={formData.passingScore}
                  onChange={(e) => setFormData(prev => ({ ...prev, passingScore: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  max="100"
                  step="0.1"
                  required
                />
              </div>
            </div>

            {/* New Settings */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                การควบคุมการเข้าถึง
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                      เปิดใช้งานแบบทดสอบ
                    </label>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      ปิดชั่วคราวเพื่อป้องกันไม่ให้นักเรียนทำแบบทดสอบ (แยกจากการเผยแพร่)
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                      อนุญาตให้ทำซ้ำ
                    </label>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      ถ้าปิด นักเรียนจะทำได้เพียงครั้งเดียวแม้จะตั้ง maxAttempts มากกว่า 1
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="allowRetake"
                      checked={formData.allowRetake}
                      onChange={handleInputChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Display Options */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                ตัวเลือกการแสดงผล
              </h3>
              
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    name="randomizeQuestions"
                    checked={formData.randomizeQuestions}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-900 dark:text-white">
                    สุ่มลำดับคำถาม
                  </span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    name="showCorrectAnswers"
                    checked={formData.showCorrectAnswers}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-900 dark:text-white">
                    แสดงคำตอบที่ถูกต้อง
                  </span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    name="showResultsImmediately"
                    checked={formData.showResultsImmediately}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-900 dark:text-white">
                    แสดงผลลัพธ์ทันทีหลังส่ง
                  </span>
                </label>
              </div>
            </div>
          </div>
        </Card>

        {/* Availability */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar size={20} />
            กำหนดเวลาการเข้าถึง
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                เปิดให้ทำตั้งแต่
              </label>
              <Input
                type="datetime-local"
                name="availableFrom"
                value={formData.availableFrom}
                onChange={handleInputChange}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                เว้นว่างไว้ถ้าเปิดให้ทำได้ทันที
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ปิดการทำเมื่อ
              </label>
              <Input
                type="datetime-local"
                name="availableUntil"
                value={formData.availableUntil}
                onChange={handleInputChange}
                min={formData.availableFrom || undefined}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                เว้นว่างไว้ถ้าไม่จำกัดเวลา
              </p>
            </div>
          </div>
        </Card>

        {/* Questions Section - TODO: Implement question management */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            คำถาม (จะเพิ่มในขั้นตอนต่อไป)
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            ระบบจัดการคำถามจะถูกเพิ่มในขั้นตอนต่อไป
          </p>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/teacher/courses/${courseId}/quizzes`)}
          >
            ยกเลิก
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={saving}
          >
            {saving ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Save size={18} className="mr-2" />
                {isEdit ? 'อัปเดต' : 'สร้าง'}แบบทดสอบ
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default QuizForm;


