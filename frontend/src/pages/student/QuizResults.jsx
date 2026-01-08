// File: QuizResults.jsx
// Path: frontend/src/pages/student/QuizResults.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  Clock,
  Award,
  ArrowLeft,
  BookOpen,
  TrendingUp,
  AlertCircle,
  CheckSquare,
  FileText
} from 'lucide-react';
import { Card, Button } from '../../components/ui';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import quizService from '../../services/quizService';

const QuizResults = () => {
  const { courseId, quizId, attemptId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [course, setCourse] = useState(null);

  useEffect(() => {
    fetchResults();
  }, [quizId, attemptId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await quizService.getQuizResults(quizId, attemptId);
      
      if (data?.results) {
        setResults(data.results);
        setQuiz(data.quiz);
        setCourse(data.course);
      } else {
        setError('ไม่พบข้อมูลผลการสอบ');
      }
    } catch (err) {
      console.error('Error fetching quiz results:', err);
      setError('เกิดข้อผิดพลาดในการโหลดผลการสอบ');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0 นาที';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (minutes === 0) return `${secs} วินาที`;
    if (secs === 0) return `${minutes} นาที`;
    return `${minutes} นาที ${secs} วินาที`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getQuestionTypeLabel = (type) => {
    const labels = {
      multiple_choice: 'เลือกตอบ',
      true_false: 'ถูก/ผิด',
      short_answer: 'ตอบสั้น',
      essay: 'เรียงความ',
      fill_blank: 'เติมคำ'
    };
    return labels[type] || type;
  };

  const renderAnswer = (question) => {
    if (question.questionType === 'multiple_choice' || question.questionType === 'true_false') {
      const options = question.options || [];
      const selectedOption = options.find(opt => 
        opt.text === question.studentAnswer || 
        opt.id === question.studentAnswer ||
        (typeof question.studentAnswer === 'string' && opt.text?.includes(question.studentAnswer))
      );
      
      return (
        <div className="space-y-2">
          {options.map((option, idx) => {
            const isSelected = selectedOption && (
              option.text === selectedOption.text || 
              option.id === selectedOption.id
            );
            const isCorrect = option.is_correct;
            
            return (
              <div
                key={idx}
                className={`p-3 rounded-lg border-2 ${
                  isSelected
                    ? isCorrect
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : isCorrect
                    ? 'border-green-300 bg-green-50/50 dark:bg-green-900/10'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isSelected && (
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      คำตอบของคุณ
                    </span>
                  )}
                  {isCorrect && (
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  )}
                  <span className={isSelected ? 'font-semibold' : ''}>
                    {option.text}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      );
    } else {
      return (
        <div className="space-y-2">
          <div className="p-3 rounded-lg border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              คำตอบของคุณ:
            </div>
            <div className="text-gray-900 dark:text-white">
              {question.studentAnswer || '(ไม่ได้ตอบ)'}
            </div>
          </div>
          {quiz?.showCorrectAnswers && question.correctAnswer && (
            <div className="p-3 rounded-lg border-2 border-green-500 bg-green-50 dark:bg-green-900/20">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                คำตอบที่ถูกต้อง:
              </div>
              <div className="text-gray-900 dark:text-white">
                {question.correctAnswer}
              </div>
            </div>
          )}
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-6 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {error || 'ไม่พบข้อมูลผลการสอบ'}
          </h2>
          <Button
            variant="primary"
            onClick={() => navigate(`/courses/${courseId}/learn`)}
          >
            กลับไปยังรายวิชา
          </Button>
        </Card>
      </div>
    );
  }

  const isPassed = results.isPassed;
  // Ensure score and maxScore are numbers
  const score = typeof results.score === 'number' ? results.score : parseFloat(results.score) || 0;
  const maxScore = typeof results.maxScore === 'number' ? results.maxScore : parseFloat(results.maxScore) || 0;
  const percentage = typeof results.percentage === 'number' ? results.percentage : parseFloat(results.percentage) || 0;
  const correctCount = results.questions?.filter(q => q.isCorrect === true).length || 0;
  const totalQuestions = results.questions?.length || 0;
  const pendingGradingCount = results.questions?.filter(q => q.isCorrect === null).length || 0;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/courses/${courseId}/learn`)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          กลับไปยังรายวิชา
        </Button>
      </div>

      {/* Results Summary Card */}
      <Card className="p-8 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20">
        <div className="text-center">
          <div className="mb-4">
            {isPassed ? (
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500 mb-4">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
            ) : (
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500 mb-4">
                <XCircle className="w-12 h-12 text-white" />
              </div>
            )}
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {isPassed ? '🎉 ยินดีด้วย! คุณสอบผ่านแล้ว' : '📊 ผลการสอบของคุณ'}
          </h1>
          
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
            {quiz?.title}
          </p>

          {/* Score Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">คะแนนที่ได้</div>
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {score.toFixed(1)} / {maxScore.toFixed(1)}
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">เปอร์เซ็นต์</div>
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {percentage.toFixed(1)}%
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">เกรด</div>
              <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {results.grade || '-'}
              </div>
            </div>
          </div>

          {/* Passing Score */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-gray-800 shadow-sm">
              <Award className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                เกณฑ์ผ่าน: {quiz?.passingScore || 70}%
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              <span>ตอบถูก {correctCount} / {totalQuestions} ข้อ</span>
            </div>
            {pendingGradingCount > 0 && (
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-yellow-600 dark:text-yellow-400">
                  รอการตรวจ {pendingGradingCount} ข้อ
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>ใช้เวลา {formatTime(results.timeSpent)}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>ครั้งที่ {results.attemptNumber} / {quiz?.maxAttempts || 1}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Question Review */}
      {results.questions && results.questions.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            รายละเอียดคำตอบ
          </h2>
          
          <div className="space-y-6">
            {results.questions.map((question, index) => (
              <div
                key={question.questionId}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                {/* Question Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                    question.isCorrect === true
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : question.isCorrect === false
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {getQuestionTypeLabel(question.questionType)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({question.points} คะแนน)
                      </span>
                      {question.isCorrect === true && (
                        <span className="text-xs text-green-600 dark:text-green-400 font-semibold">
                          +{question.pointsEarned} คะแนน
                        </span>
                      )}
                      {question.isCorrect === false && (
                        <span className="text-xs text-red-600 dark:text-red-400">
                          0 คะแนน
                        </span>
                      )}
                      {question.isCorrect === null && (
                        <span className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold">
                          ⏳ รอการตรวจ
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {question.questionText}
                    </h3>
                  </div>
                </div>

                {/* Answer Display */}
                <div className="ml-12 mb-4">
                  {renderAnswer(question)}
                  {question.isCorrect === null && question.questionType === 'essay' && (
                    <div className="mt-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-300">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-semibold">
                          ⏳ ข้อคำถามนี้รอการตรวจจากครู
                        </span>
                      </div>
                      <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                        คะแนนจะถูกอัปเดตเมื่อครูตรวจเสร็จ
                      </p>
                    </div>
                  )}
                </div>

                {/* Explanation */}
                {quiz?.showCorrectAnswers && question.explanation && (
                  <div className="ml-12 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <div className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                      คำอธิบาย:
                    </div>
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      {question.explanation}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Actions */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            ส่งเมื่อ: {formatDate(results.submittedAt)}
          </div>
          <div className="flex gap-3">
            {results.canRetake && (
              <Button
                variant="primary"
                onClick={() => navigate(`/courses/${courseId}/quizzes/${quizId}`)}
              >
                ทำใหม่
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => navigate(`/courses/${courseId}/learn`)}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              กลับไปยังรายวิชา
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default QuizResults;

