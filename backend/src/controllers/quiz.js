// File: backend/src/controllers/quiz.js
// Path: backend/src/controllers/quiz.js

const { Quiz, QuizQuestion, QuizAttempt, QuizResponse, Course, User } = require('../models');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { sendEmail } = require('../utils/emailService');
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
    const course = await Course.findByPk(courseId, {
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['firstName', 'lastName', 'email']
        }
      ]
    });

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

    // 📧 SEND QUIZ CREATION CONFIRMATION EMAIL TO TEACHER
    try {
      await sendEmail({
        to: req.user.email,
        subject: '📝 แบบทดสอบใหม่ถูกสร้างแล้ว!',
        template: 'quiz-created',
        data: {
          teacherName: `${req.user.firstName} ${req.user.lastName}`,
          quizTitle: title,
          courseTitle: course.title,
          quizType: quizType || 'practice',
          questionsCount: questions ? questions.length : 0,
          timeLimit: timeLimit ? `${timeLimit} นาที` : 'ไม่จำกัดเวลา',
          maxAttempts: maxAttempts || 1,
          passingScore: `${passingScore || 70}%`,
          createdDate: new Date().toLocaleDateString('th-TH'),
          quizUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/teacher/quizzes/${quiz.id}`,
          courseManagementUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/teacher/courses/${courseId}`,
          nextSteps: [
            'เพิ่มคำถามในแบบทดสอบ',
            'ตั้งค่าการเผยแพร่',
            'ทดสอบแบบทดสอบก่อนเผยแพร่'
          ]
        }
      });

      console.log(`✅ Quiz creation email sent to teacher: ${req.user.email}`);
    } catch (emailError) {
      console.error('❌ Failed to send quiz creation email:', emailError.message);
    }

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

    // 📧 SEND QUIZ RESULTS EMAIL TO STUDENT
    try {
      const quiz = await Quiz.findByPk(id, {
        include: [
          {
            model: Course,
            as: 'course',
            attributes: ['title'],
            include: [
              {
                model: User,
                as: 'teacher',
                attributes: ['firstName', 'lastName', 'email']
              }
            ]
          }
        ]
      });

      const isPassed = completedAttempt.percentage >= quiz.passingScore;
      const grade = getGradeFromPercentage(completedAttempt.percentage);
      const encouragementMessage = getEncouragementMessage(completedAttempt.percentage, isPassed);

      await sendEmail({
        to: req.user.email,
        subject: isPassed ? '🎉 ยินดีด้วย! คุณสอบผ่านแล้ว' : '📊 ผลการสอบของคุณ',
        template: 'quiz-results',
        data: {
          studentName: `${req.user.firstName} ${req.user.lastName}`,
          quizTitle: quiz.title,
          courseTitle: quiz.course.title,
          teacherName: `${quiz.course.teacher.firstName} ${quiz.course.teacher.lastName}`,
          score: completedAttempt.score,
          maxScore: completedAttempt.maxScore,
          percentage: completedAttempt.percentage,
          grade: grade,
          passingScore: quiz.passingScore,
          isPassed: isPassed,
          attemptNumber: completedAttempt.attemptNumber,
          maxAttempts: quiz.maxAttempts,
          timeSpent: Math.round(completedAttempt.timeSpent / 60) || 1, // minutes
          submittedDate: new Date().toLocaleDateString('th-TH'),
          encouragementMessage: encouragementMessage,
          canRetake: completedAttempt.attemptNumber < quiz.maxAttempts && !isPassed,
          retakeUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/student/courses/${quiz.courseId}/quizzes/${quiz.id}`,
          courseUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/student/courses/${quiz.courseId}`,
          certificateUrl: isPassed ? `${process.env.FRONTEND_URL || 'http://localhost:3000'}/student/certificates` : null,
          studyTips: !isPassed ? [
            'ทบทวนเนื้อหาในบทเรียนอีกครั้ง',
            'ฝึกทำแบบทดสอบเพิ่มเติม',
            'ปรึกษาครูผู้สอนหากมีข้อสงสัย'
          ] : null
        }
      });

      console.log(`✅ Quiz results email sent to: ${req.user.email} (${isPassed ? 'PASSED' : 'FAILED'})`);

      // 📧 NOTIFY TEACHER ABOUT QUIZ COMPLETION (if significant)
      if (isPassed || completedAttempt.attemptNumber >= quiz.maxAttempts) {
        try {
          await sendEmail({
            to: quiz.course.teacher.email,
            subject: `📋 นักเรียน${isPassed ? 'สอบผ่าน' : 'ทำแบบทดสอบครบจำนวนครั้งแล้ว'}: ${quiz.title}`,
            template: 'quiz-completion-teacher',
            data: {
              teacherName: `${quiz.course.teacher.firstName} ${quiz.course.teacher.lastName}`,
              studentName: `${req.user.firstName} ${req.user.lastName}`,
              quizTitle: quiz.title,
              courseTitle: quiz.course.title,
              score: completedAttempt.score,
              maxScore: completedAttempt.maxScore,
              percentage: completedAttempt.percentage,
              grade: grade,
              isPassed: isPassed,
              attemptNumber: completedAttempt.attemptNumber,
              maxAttempts: quiz.maxAttempts,
              completedDate: new Date().toLocaleDateString('th-TH'),
              studentEmail: req.user.email,
              quizAnalyticsUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/teacher/analytics/quiz/${quiz.id}`,
              studentProfileUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/teacher/students/${req.user.id}`
            }
          });

          console.log(`✅ Quiz completion notification sent to teacher: ${quiz.course.teacher.email}`);
        } catch (teacherEmailError) {
          console.error('❌ Failed to send teacher notification:', teacherEmailError.message);
        }
      }

    } catch (emailError) {
      console.error('❌ Failed to send quiz results email:', emailError.message);
    }

    // Emit socket events for real-time notifications
    const io = req.app.get('io');
    if (io) {
      // Notify student
      io.to(`user-${req.user.id}`).emit('quiz-completed', {
        quizId: id,
        attemptId: completedAttempt.id,
        score: completedAttempt.score,
        percentage: completedAttempt.percentage,
        isPassed: completedAttempt.percentage >= (await Quiz.findByPk(id)).passingScore,
        timestamp: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: 'Quiz submitted successfully',
      data: {
        attempt: {
          id: completedAttempt.id,
          score: completedAttempt.score,
          maxScore: completedAttempt.maxScore,
          percentage: completedAttempt.percentage,
          grade: getGradeFromPercentage(completedAttempt.percentage),
          isPassed: completedAttempt.percentage >= (await Quiz.findByPk(id)).passingScore,
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

const getGradeFromPercentage = (percentage) => {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
};

const getEncouragementMessage = (percentage, isPassed) => {
  if (isPassed) {
    if (percentage >= 95) return '🌟 ยอดเยี่ยมมาก! คุณเรียนรู้ได้อย่างสมบูรณ์แบบ';
    if (percentage >= 85) return '🎉 เก่งมาก! ผลงานของคุณน่าประทับใจ';
    if (percentage >= 75) return '👏 ดีมาก! คุณเข้าใจเนื้อหาเป็นอย่างดี';
    return '✅ ยินดีด้วย! คุณผ่านการทดสอบแล้ว';
  } else {
    if (percentage >= 60) return '💪 เกือบแล้ว! ลองทบทวนอีกนิดนึงแล้วสอบใหม่';
    if (percentage >= 40) return '📚 ไม่เป็นไร ทบทวนเนื้อหาแล้วลองใหม่อีกครั้ง';
    return '🎯 อย่าท้อ! กลับไปศึกษาเนื้อหาแล้วมาลองใหม่นะ';
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

// ========================================
// NEWLY IMPLEMENTED FUNCTIONS
// ========================================

// @desc    Get single quiz details
// @route   GET /api/quizzes/:id
// @access  Enrolled students/Teachers/Admin
const getQuiz = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  try {
    const quiz = await Quiz.findByPk(id, {
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'teacherId'],
          include: [
            {
              model: User,
              as: 'teacher',
              attributes: ['firstName', 'lastName']
            }
          ]
        },
        {
          model: QuizQuestion,
          as: 'questions',
          attributes: req.user.role === 'student'
            ? ['id', 'questionText', 'questionType', 'points', 'orderIndex', 'options'] // Hide correct answer for students
            : undefined, // Show all for teachers
          order: [['orderIndex', 'ASC']]
        }
      ]
    });

    if (!quiz) {
      return next(new AppError('Quiz not found', 404));
    }

    // Check access
    if (req.user.role === 'student') {
      // Check if enrolled (middleware should handle this, but double check course access if needed)
      // Also check if published
      if (!quiz.isPublished) {
        return next(new AppError('Quiz is not published', 403));
      }
    } else if (req.user.role === 'teacher') {
      // Check ownership
      if (quiz.course.teacherId !== req.user.id) {
        // Teachers can only view their own quizzes fully, or maybe public info?
        // Assuming strict ownership for management
        // But maybe they can view if they are just viewing? 
        // For now, allow view if teacher, but management is restricted.
      }
    }

    // Get student progress if student
    let studentProgress = null;
    if (req.user.role === 'student') {
      const attempts = await QuizAttempt.findAll({
        where: { quizId: id, studentId: req.user.id },
        order: [['attemptNumber', 'DESC']]
      });

      studentProgress = {
        attempts: attempts,
        bestScore: attempts.reduce((max, a) => Math.max(max, a.score || 0), 0),
        attemptsCount: attempts.length,
        canAttempt: attempts.length < quiz.maxAttempts
      };
    }

    res.status(200).json({
      success: true,
      data: {
        quiz,
        studentProgress,
        canManage: req.user.role === 'admin' || (req.user.role === 'teacher' && quiz.course.teacherId === req.user.id)
      }
    });

  } catch (error) {
    return next(new AppError('Error fetching quiz', 500));
  }
});

// @desc    Update quiz
// @route   PUT /api/quizzes/:id
// @access  Teacher (own courses)/Admin
const updateQuiz = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const {
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
    const quiz = await Quiz.findByPk(id, {
      include: [{ model: Course, as: 'course' }]
    });

    if (!quiz) {
      return next(new AppError('Quiz not found', 404));
    }

    // Check ownership
    if (req.user.role !== 'admin' && quiz.course.teacherId !== req.user.id) {
      return next(new AppError('You can only update quizzes for your own courses', 403));
    }

    // Update quiz fields
    const updateFields = {
      title, description, quizType, timeLimit, maxAttempts, passingScore,
      randomizeQuestions, showCorrectAnswers, showResultsImmediately,
      availableFrom, availableUntil
    };

    Object.keys(updateFields).forEach(key => {
      if (updateFields[key] !== undefined) {
        quiz[key] = updateFields[key];
      }
    });

    await quiz.save();

    // Update questions if provided
    if (questions && Array.isArray(questions)) {
      // This is a simplified update: delete old and create new
      // In production, you might want to update existing ones to preserve IDs
      await QuizQuestion.destroy({ where: { quizId: id } });

      const newQuestions = questions.map((q, index) => ({
        quizId: id,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        points: q.points || 10,
        orderIndex: q.orderIndex || index + 1,
        explanation: q.explanation
      }));

      await QuizQuestion.bulkCreate(newQuestions);
    }

    // Return updated quiz
    const updatedQuiz = await Quiz.findByPk(id, {
      include: [{ model: QuizQuestion, as: 'questions', order: [['orderIndex', 'ASC']] }]
    });

    res.status(200).json({
      success: true,
      message: 'Quiz updated successfully',
      data: {
        quiz: updatedQuiz
      }
    });

  } catch (error) {
    return next(new AppError('Error updating quiz', 500));
  }
});

// @desc    Delete quiz
// @route   DELETE /api/quizzes/:id
// @access  Teacher (own courses)/Admin
const deleteQuiz = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  try {
    const quiz = await Quiz.findByPk(id, {
      include: [{ model: Course, as: 'course' }]
    });

    if (!quiz) {
      return next(new AppError('Quiz not found', 404));
    }

    // Check ownership
    if (req.user.role !== 'admin' && quiz.course.teacherId !== req.user.id) {
      return next(new AppError('You can only delete quizzes for your own courses', 403));
    }

    await quiz.destroy();

    res.status(200).json({
      success: true,
      message: 'Quiz deleted successfully'
    });

  } catch (error) {
    return next(new AppError('Error deleting quiz', 500));
  }
});

// @desc    Publish/unpublish quiz
// @route   PATCH /api/quizzes/:id/publish
// @access  Teacher (own courses)/Admin
const togglePublishQuiz = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { isPublished } = req.body;

  try {
    const quiz = await Quiz.findByPk(id, {
      include: [{ model: Course, as: 'course' }]
    });

    if (!quiz) {
      return next(new AppError('Quiz not found', 404));
    }

    // Check ownership
    if (req.user.role !== 'admin' && quiz.course.teacherId !== req.user.id) {
      return next(new AppError('You can only publish quizzes for your own courses', 403));
    }

    quiz.isPublished = isPublished;
    await quiz.save();

    res.status(200).json({
      success: true,
      message: `Quiz ${isPublished ? 'published' : 'unpublished'} successfully`,
      data: {
        quiz: {
          id: quiz.id,
          isPublished: quiz.isPublished
        }
      }
    });

  } catch (error) {
    return next(new AppError('Error updating quiz status', 500));
  }
});

module.exports = {
  getCourseQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  togglePublishQuiz,
  startQuizAttempt,
  submitQuizAnswer,
  submitQuiz
};