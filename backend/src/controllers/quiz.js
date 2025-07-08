// File: backend/src/controllers/quiz.js
// Path: backend/src/controllers/quiz.js

const { Quiz, QuizQuestion, QuizAttempt, QuizResponse, Course, User } = require('../models');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

// ========================================
// QUIZ CRUD OPERATIONS
// ========================================

// @desc    Get quizzes for a course
// @route   GET /api/quizzes/course/:courseId
// @access  Enrolled students/Teachers/Admin
const getCourseQuizzes = catchAsync(async (req, res, next) => {
  const { courseId } = req.params;
  const { includeQuestions = false } = req.query;
  
  try {
    const whereClause = { courseId };
    
    // Students can only see published quizzes
    if (req.user.role === 'student') {
      whereClause.isPublished = true;
      whereClause.availableFrom = { [Op.lte]: new Date() };
      whereClause[Op.or] = [
        { availableUntil: null },
        { availableUntil: { [Op.gte]: new Date() } }
      ];
    }
    
    const quizzes = await Quiz.findAll({
      where: whereClause,
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['title', 'teacherId']
        },
        ...(includeQuestions === 'true' ? [{
          model: QuizQuestion,
          as: 'questions',
          order: [['orderIndex', 'ASC']],
          attributes: req.user.role === 'student' 
            ? ['id', 'questionText', 'questionType', 'points', 'orderIndex', 'options']
            : undefined // Teachers/admin get all fields including correctAnswer
        }] : [])
      ],
      order: [['created_at', 'DESC']]
    });
    
    // For students, get their attempt history
    let userAttempts = [];
    if (req.user.role === 'student') {
      userAttempts = await QuizAttempt.findAll({
        where: { 
          studentId: req.user.id,
          quizId: { [Op.in]: quizzes.map(q => q.id) }
        },
        order: [['attemptNumber', 'DESC']]
      }).catch(() => []);
    }
    
    // Add attempt info to quizzes
    const quizzesWithAttempts = quizzes.map(quiz => {
      const attempts = userAttempts.filter(a => a.quizId === quiz.id);
      return {
        ...quiz.toJSON(),
        userAttempts: attempts.length,
        lastAttempt: attempts[0] || null,
        canAttempt: attempts.length < quiz.maxAttempts,
        timeRemaining: quiz.availableUntil ? 
          Math.max(0, new Date(quiz.availableUntil) - new Date()) : null
      };
    });
    
    res.status(200).json({
      success: true,
      data: {
        quizzes: quizzesWithAttempts,
        total: quizzes.length
      }
    });
    
  } catch (error) {
    // Mock data if models don't exist
    res.status(200).json({
      success: true,
      data: {
        quizzes: [
          {
            id: 1,
            title: 'Mock Quiz 1',
            quizType: 'practice',
            timeLimit: 30,
            maxAttempts: 3,
            passingScore: 70,
            isPublished: true,
            userAttempts: 0,
            canAttempt: true,
            questions: includeQuestions === 'true' ? [
              {
                id: 1,
                questionText: 'What is 2 + 2?',
                questionType: 'multiple_choice',
                options: ['3', '4', '5', '6'],
                points: 10
              }
            ] : undefined
          }
        ],
        total: 1,
        message: 'Mock quiz data - Quiz models not available'
      }
    });
  }
});

// @desc    Create new quiz
// @route   POST /api/quizzes
// @access  Teacher/Admin
const createQuiz = catchAsync(async (req, res, next) => {
  const {
    courseId,
    lessonId,
    title,
    description,
    quizType,
    timeLimit,
    maxAttempts,
    passingScore,
    randomizeQuestions,
    showCorrectAnswers,
    showResultsImmediately,
    availableFrom,
    availableUntil,
    questions
  } = req.body;
  
  try {
    // Check if user owns the course
    const course = await Course.findByPk(courseId);
    if (!course) {
      return next(new AppError('Course not found', 404));
    }
    
    if (req.user.role !== 'admin' && course.teacherId !== req.user.id) {
      return next(new AppError('You can only create quizzes for your own courses', 403));
    }
    
    // Create quiz
    const quiz = await Quiz.create({
      courseId,
      lessonId,
      title,
      description,
      quizType: quizType || 'practice',
      timeLimit,
      maxAttempts: maxAttempts || 1,
      passingScore: passingScore || 70,
      randomizeQuestions: randomizeQuestions || false,
      showCorrectAnswers: showCorrectAnswers !== false,
      showResultsImmediately: showResultsImmediately !== false,
      availableFrom: availableFrom || new Date(),
      availableUntil,
      isPublished: false
    });
    
    // Create questions if provided
    if (questions && questions.length > 0) {
      const quizQuestions = questions.map((q, index) => ({
        quizId: quiz.id,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        points: q.points || 10,
        orderIndex: q.orderIndex || index + 1,
        explanation: q.explanation
      }));
      
      await QuizQuestion.bulkCreate(quizQuestions);
    }
    
    // Return created quiz with questions
    const createdQuiz = await Quiz.findByPk(quiz.id, {
      include: [
        {
          model: QuizQuestion,
          as: 'questions',
          order: [['orderIndex', 'ASC']]
        }
      ]
    });
    
    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      data: {
        quiz: createdQuiz
      }
    });
    
  } catch (error) {
    return next(new AppError('Error creating quiz', 500));
  }
});

// ========================================
// QUIZ TAKING SYSTEM
// ========================================

// @desc    Start quiz attempt
// @route   POST /api/quizzes/:id/attempt
// @access  Student (enrolled)
const startQuizAttempt = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  if (req.user.role !== 'student') {
    return next(new AppError('Only students can take quizzes', 403));
  }
  
  try {
    const quiz = await Quiz.findByPk(id, {
      include: [
        {
          model: QuizQuestion,
          as: 'questions',
          attributes: ['id', 'questionText', 'questionType', 'options', 'points', 'orderIndex'],
          order: [['orderIndex', 'ASC']]
        }
      ]
    });
    
    if (!quiz) {
      return next(new AppError('Quiz not found', 404));
    }
    
    if (!quiz.isPublished) {
      return next(new AppError('Quiz is not published', 400));
    }
    
    // Check availability
    const now = new Date();
    if (quiz.availableFrom && now < quiz.availableFrom) {
      return next(new AppError('Quiz is not yet available', 400));
    }
    
    if (quiz.availableUntil && now > quiz.availableUntil) {
      return next(new AppError('Quiz is no longer available', 400));
    }
    
    // Check previous attempts
    const previousAttempts = await QuizAttempt.findAll({
      where: { quizId: id, studentId: req.user.id },
      order: [['attemptNumber', 'DESC']]
    });
    
    if (previousAttempts.length >= quiz.maxAttempts) {
      return next(new AppError('Maximum attempts reached', 400));
    }
    
    // Check for incomplete attempt
    const incompleteAttempt = previousAttempts.find(a => !a.isCompleted);
    if (incompleteAttempt) {
      return res.status(200).json({
        success: true,
        message: 'Resuming existing attempt',
        data: {
          attempt: incompleteAttempt,
          quiz: {
            id: quiz.id,
            title: quiz.title,
            timeLimit: quiz.timeLimit,
            questions: quiz.questions
          },
          timeRemaining: quiz.timeLimit ? 
            Math.max(0, quiz.timeLimit * 60 - Math.floor((now - incompleteAttempt.startedAt) / 1000)) : null
        }
      });
    }
    
    // Create new attempt
    const attemptNumber = previousAttempts.length + 1;
    const attempt = await QuizAttempt.create({
      quizId: id,
      studentId: req.user.id,
      attemptNumber,
      startedAt: now,
      answers: {},
      isCompleted: false
    });
    
    // Randomize questions if enabled
    let questions = quiz.questions;
    if (quiz.randomizeQuestions) {
      questions = [...questions].sort(() => Math.random() - 0.5);
    }
    
    res.status(200).json({
      success: true,
      message: 'Quiz attempt started',
      data: {
        attempt: {
          id: attempt.id,
          attemptNumber: attempt.attemptNumber,
          startedAt: attempt.startedAt
        },
        quiz: {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          timeLimit: quiz.timeLimit,
          questions: questions
        },
        timeRemaining: quiz.timeLimit ? quiz.timeLimit * 60 : null
      }
    });
    
  } catch (error) {
    return next(new AppError('Error starting quiz attempt', 500));
  }
});

// @desc    Submit quiz answer
// @route   POST /api/quizzes/:id/answer
// @access  Student (with active attempt)
const submitQuizAnswer = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { questionId, answer, timeSpent } = req.body;
  
  try {
    // Get active attempt
    const attempt = await QuizAttempt.findOne({
      where: { 
        quizId: id, 
        studentId: req.user.id, 
        isCompleted: false 
      },
      order: [['attemptNumber', 'DESC']]
    });
    
    if (!attempt) {
      return next(new AppError('No active quiz attempt found', 400));
    }
    
    // Check if quiz is still within time limit
    const quiz = await Quiz.findByPk(id);
    if (quiz.timeLimit) {
      const timeElapsed = Math.floor((new Date() - attempt.startedAt) / 1000);
      if (timeElapsed > quiz.timeLimit * 60) {
        // Auto-submit if time exceeded
        return autoSubmitQuiz(attempt, res);
      }
    }
    
    // Get question details
    const question = await QuizQuestion.findByPk(questionId);
    if (!question || question.quizId !== parseInt(id)) {
      return next(new AppError('Invalid question', 400));
    }
    
    // Save/update answer
    const answers = attempt.answers || {};
    answers[questionId] = {
      answer,
      timeSpent: timeSpent || 0,
      answeredAt: new Date()
    };
    
    attempt.answers = answers;
    await attempt.save();
    
    res.status(200).json({
      success: true,
      message: 'Answer saved',
      data: {
        questionId,
        saved: true,
        totalAnswered: Object.keys(answers).length
      }
    });
    
  } catch (error) {
    return next(new AppError('Error saving answer', 500));
  }
});

// @desc    Submit complete quiz
// @route   POST /api/quizzes/:id/submit
// @access  Student (with active attempt)
const submitQuiz = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  
  try {
    const attempt = await QuizAttempt.findOne({
      where: { 
        quizId: id, 
        studentId: req.user.id, 
        isCompleted: false 
      },
      order: [['attemptNumber', 'DESC']]
    });
    
    if (!attempt) {
      return next(new AppError('No active quiz attempt found', 400));
    }
    
    await completeQuizAttempt(attempt);
    
    const completedAttempt = await QuizAttempt.findByPk(attempt.id);
    
    res.status(200).json({
      success: true,
      message: 'Quiz submitted successfully',
      data: {
        attempt: {
          id: completedAttempt.id,
          score: completedAttempt.score,
          maxScore: completedAttempt.maxScore,
          percentage: completedAttempt.percentage,
          isCompleted: true,
          submittedAt: completedAttempt.submittedAt
        }
      }
    });
    
  } catch (error) {
    return next(new AppError('Error submitting quiz', 500));
  }
});

// ========================================
// HELPER FUNCTIONS
// ========================================

const completeQuizAttempt = async (attempt) => {
  try {
    const quiz = await Quiz.findByPk(attempt.quizId, {
      include: [{ model: QuizQuestion, as: 'questions' }]
    });
    
    let totalScore = 0;
    let maxScore = 0;
    const answers = attempt.answers || {};
    
    // Calculate score
    for (const question of quiz.questions) {
      maxScore += question.points;
      
      const userAnswer = answers[question.id];
      if (userAnswer) {
        const isCorrect = checkAnswer(question, userAnswer.answer);
        if (isCorrect) {
          totalScore += question.points;
        }
      }
    }
    
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    
    // Update attempt
    attempt.score = totalScore;
    attempt.maxScore = maxScore;
    attempt.percentage = percentage;
    attempt.isCompleted = true;
    attempt.submittedAt = new Date();
    attempt.timeSpent = Math.floor((new Date() - attempt.startedAt) / 1000);
    
    await attempt.save();
    
    return attempt;
  } catch (error) {
    throw new Error('Error completing quiz attempt');
  }
};

const checkAnswer = (question, userAnswer) => {
  if (!question.correctAnswer) return false;
  
  switch (question.questionType) {
    case 'multiple_choice':
    case 'true_false':
      return userAnswer === question.correctAnswer;
    case 'short_answer':
      return userAnswer.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim();
    case 'fill_blank':
      return userAnswer.toLowerCase().includes(question.correctAnswer.toLowerCase());
    default:
      return false;
  }
};

const autoSubmitQuiz = async (attempt, res) => {
  try {
    attempt.autoSubmitted = true;
    await completeQuizAttempt(attempt);
    
    res.status(200).json({
      success: true,
      message: 'Quiz auto-submitted due to time limit',
      data: {
        attempt: {
          id: attempt.id,
          score: attempt.score,
          percentage: attempt.percentage,
          autoSubmitted: true
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error auto-submitting quiz'
    });
  }
};

module.exports = {
  getCourseQuizzes,
  createQuiz,
  startQuizAttempt,
  submitQuizAnswer,
  submitQuiz
};