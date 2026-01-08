// File: QuizTaking.jsx
// Path: frontend/src/pages/student/QuizTaking.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Save,
  Send,
  HelpCircle,
  FileText,
  CheckSquare,
  XCircle
} from 'lucide-react';
import { Card, Button } from '../../components/ui';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import quizService from '../../services/quizService';

const QuizTaking = () => {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const timerIntervalRef = useRef(null);
  const autoSaveIntervalRef = useRef(null);

  useEffect(() => {
    startQuiz();
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (autoSaveIntervalRef.current) clearInterval(autoSaveIntervalRef.current);
    };
  }, [quizId]);

  useEffect(() => {
    // Timer countdown
    if (timeRemaining !== null && timeRemaining > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      };
    }
  }, [timeRemaining]);

  useEffect(() => {
    // Auto-save answers every 30 seconds
    if (attempt && Object.keys(answers).length > 0) {
      autoSaveIntervalRef.current = setInterval(() => {
        autoSaveAnswers();
      }, 30000);

      return () => {
        if (autoSaveIntervalRef.current) clearInterval(autoSaveIntervalRef.current);
      };
    }
  }, [answers, attempt]);

  const startQuiz = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await quizService.startQuizAttempt(quizId);
      setQuiz(data.quiz);
      setAttempt(data.attempt);
      setTimeRemaining(data.timeRemaining);
      
      // Load existing answers if resuming
      if (data.attempt && data.attempt.answers) {
        setAnswers(data.attempt.answers);
      }
    } catch (err) {
      console.error('Error starting quiz:', err);
      setError(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการเริ่มทำแบบทดสอบ');
    } finally {
      setLoading(false);
    }
  };

  const autoSaveAnswers = async () => {
    if (!attempt || !quiz) return;

    const currentQuestion = quiz.questions[currentQuestionIndex];
    if (!currentQuestion) return;

    const currentAnswer = answers[currentQuestion.id];
    if (!currentAnswer) return;

    try {
      await quizService.submitAnswer(quizId, currentQuestion.id, currentAnswer);
    } catch (err) {
      console.error('Error auto-saving answer:', err);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      // Auto-save current answer
      const currentQuestion = quiz.questions[currentQuestionIndex];
      if (answers[currentQuestion.id]) {
        quizService.submitAnswer(quizId, currentQuestion.id, answers[currentQuestion.id]).catch(console.error);
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSaveAnswer = async () => {
    const currentQuestion = quiz.questions[currentQuestionIndex];
    if (!currentQuestion || !answers[currentQuestion.id]) return;

    try {
      await quizService.submitAnswer(quizId, currentQuestion.id, answers[currentQuestion.id]);
      alert('บันทึกคำตอบแล้ว');
    } catch (err) {
      console.error('Error saving answer:', err);
      alert('เกิดข้อผิดพลาดในการบันทึกคำตอบ');
    }
  };

  const handleSubmit = async () => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการส่งคำตอบ? หลังจากส่งแล้วจะไม่สามารถแก้ไขได้')) {
      return;
    }

    try {
      setSubmitting(true);
      const result = await quizService.submitQuiz(quizId, attempt.id);
      
      // Navigate to results page
      navigate(`/courses/${courseId}/quizzes/${quizId}/results/${result.attempt.id}`);
    } catch (err) {
      console.error('Error submitting quiz:', err);
      alert('เกิดข้อผิดพลาดในการส่งคำตอบ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = async () => {
    if (submitting) return;
    
    try {
      setSubmitting(true);
      const result = await quizService.submitQuiz(quizId, attempt.id);
      alert('เวลาหมดแล้ว ระบบจะส่งคำตอบอัตโนมัติ');
      if (result && result.attempt) {
        navigate(`/courses/${courseId}/quizzes/${quizId}/results/${result.attempt.id}`);
      } else {
        navigate(`/courses/${courseId}/learn`);
      }
    } catch (err) {
      console.error('Error auto-submitting quiz:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).filter(key => answers[key] !== null && answers[key] !== '').length;
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

  if (!quiz || !attempt) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 max-w-md">
          <div className="text-center">
            <FileText className="mx-auto text-gray-400 mb-4" size={48} />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              ไม่พบแบบทดสอบ
            </h2>
            <Button variant="primary" onClick={() => navigate(`/courses/${courseId}/learn`)}>
              กลับไปยังหลักสูตร
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
  const answeredCount = getAnsweredCount();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(`/courses/${courseId}/learn`)}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            กลับ
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {quiz.title}
            </h1>
            {quiz.description && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {quiz.description}
              </p>
            )}
          </div>
        </div>

        {/* Timer */}
        {timeRemaining !== null && (
          <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2">
              <Clock className="text-red-600 dark:text-red-400" size={20} />
              <div>
                <p className="text-xs text-red-600 dark:text-red-400">เวลาที่เหลือ</p>
                <p className={`text-lg font-bold ${timeRemaining < 300 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                  {formatTime(timeRemaining)}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Progress Bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            คำถาม {currentQuestionIndex + 1} จาก {totalQuestions}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            ตอบแล้ว {answeredCount} / {totalQuestions}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-primary-500 h-2 rounded-full transition-all"
            style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </Card>

      {/* Question */}
      <Card className="p-6">
        <div className="mb-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <span className="text-primary-600 dark:text-primary-400 font-semibold">
                {currentQuestionIndex + 1}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {currentQuestion.questionText}
              </h2>
              {currentQuestion.points && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  คะแนน: {currentQuestion.points} คะแนน
                </p>
              )}
            </div>
          </div>

          {/* Answer Options */}
          <div className="space-y-3">
            {currentQuestion.questionType === 'multiple_choice' && currentQuestion.options && (
              currentQuestion.options.map((option, index) => (
                <label
                  key={index}
                  className={`
                    flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${answers[currentQuestion.id] === option.text
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option.text}
                    checked={answers[currentQuestion.id] === option.text}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    className="w-5 h-5 text-primary-500"
                  />
                  <span className="flex-1 text-gray-900 dark:text-white">
                    {option.text}
                  </span>
                </label>
              ))
            )}

            {currentQuestion.questionType === 'true_false' && (
              <div className="space-y-3">
                <label
                  className={`
                    flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${answers[currentQuestion.id] === 'true'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value="true"
                    checked={answers[currentQuestion.id] === 'true'}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    className="w-5 h-5 text-primary-500"
                  />
                  <CheckCircle size={20} className="text-green-500" />
                  <span className="flex-1 text-gray-900 dark:text-white font-medium">
                    ถูก
                  </span>
                </label>
                <label
                  className={`
                    flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${answers[currentQuestion.id] === 'false'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                    }
                  `}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value="false"
                    checked={answers[currentQuestion.id] === 'false'}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    className="w-5 h-5 text-primary-500"
                  />
                  <XCircle size={20} className="text-red-500" />
                  <span className="flex-1 text-gray-900 dark:text-white font-medium">
                    ผิด
                  </span>
                </label>
              </div>
            )}

            {currentQuestion.questionType === 'short_answer' && (
              <textarea
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                placeholder="พิมพ์คำตอบของคุณที่นี่..."
                className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-white"
                rows={4}
              />
            )}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={18} />
              ก่อนหน้า
            </Button>
            {currentQuestionIndex < totalQuestions - 1 && (
              <Button
                variant="primary"
                onClick={handleNext}
                className="flex items-center gap-2"
              >
                ถัดไป
                <ArrowRight size={18} />
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleSaveAnswer}
              disabled={!answers[currentQuestion.id]}
              className="flex items-center gap-2"
            >
              <Save size={18} />
              บันทึก
            </Button>
            {currentQuestionIndex === totalQuestions - 1 && (
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={submitting || answeredCount === 0}
                className="flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    กำลังส่ง...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    ส่งคำตอบ
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Question Navigation */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          นำทางคำถาม
        </h3>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {quiz.questions.map((question, index) => {
            const isAnswered = answers[question.id] !== null && answers[question.id] !== '';
            const isCurrent = index === currentQuestionIndex;
            
            return (
              <button
                key={question.id}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`
                  w-10 h-10 rounded-lg font-semibold transition-all
                  ${isCurrent
                    ? 'bg-primary-500 text-white ring-2 ring-primary-300'
                    : isAnswered
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-2 border-green-300 dark:border-green-700'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-300 dark:border-gray-700'
                  }
                  hover:scale-105
                `}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-700"></div>
            <span className="text-gray-600 dark:text-gray-400">ตอบแล้ว</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-primary-500"></div>
            <span className="text-gray-600 dark:text-gray-400">คำถามปัจจุบัน</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700"></div>
            <span className="text-gray-600 dark:text-gray-400">ยังไม่ตอบ</span>
          </div>
        </div>
      </Card>

      {/* Warning */}
      {timeRemaining !== null && timeRemaining < 300 && (
        <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="text-yellow-600 dark:text-yellow-400" size={20} />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ เวลาจะหมดในอีก {formatTime(timeRemaining)} ระบบจะส่งคำตอบอัตโนมัติเมื่อเวลาหมด
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default QuizTaking;

