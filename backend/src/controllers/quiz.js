// File: backend/src/controllers/quiz.js
// Path: backend/src/controllers/quiz.js

const { Quiz, QuizQuestion, QuizAttempt, QuizResponse, Course, User } = require('../models');
const { AppError, catchAsync } = require('../middleware/errorHandler');
const { emailService } = require('../utils/emailService');
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

    // Students can only see published and active quizzes
    if (req.user.role === 'student') {
      whereClause.isPublished = true;
      whereClause.isActive = true;
      // Check availableFrom: if null, quiz is always available; otherwise must be <= now
      whereClause[Op.and] = [
        {
          [Op.or]: [
            { availableFrom: null },
            { availableFrom: { [Op.lte]: new Date() } }
          ]
        },
        {
          [Op.or]: [
            { availableUntil: null },
            { availableUntil: { [Op.gte]: new Date() } }
          ]
        }
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
      order: [
        ['lessonId', 'ASC NULLS LAST'], // Course-level (null) มาก่อน, แล้วตามด้วย Lesson-level
        ['orderIndex', 'ASC'],           // เรียงตาม orderIndex
        ['created_at', 'ASC']            // ถ้า orderIndex เท่ากัน เรียงตามวันที่สร้าง
      ]
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
      // Only count completed attempts for maxAttempts check
      const completedAttempts = attempts.filter(a => a.isCompleted === true);
      const incompleteAttempt = attempts.find(a => a.isCompleted === false);
      
      return {
        ...quiz.toJSON(),
        userAttempts: completedAttempts.length, // Only count completed attempts
        totalAttempts: attempts.length, // Total attempts (including incomplete)
        lastAttempt: attempts[0] || null,
        incompleteAttempt: incompleteAttempt || null, // Incomplete attempt if exists
        canAttempt: completedAttempts.length < quiz.maxAttempts || !!incompleteAttempt, // Can attempt if not maxed out OR has incomplete attempt
        attemptsLeft: Math.max(0, quiz.maxAttempts - completedAttempts.length),
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
    orderIndex,
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

    // Auto-calculate orderIndex if not provided
    let finalOrderIndex = orderIndex;
    if (finalOrderIndex === undefined || finalOrderIndex === null) {
      // Get max orderIndex for the same scope (course + lesson combination)
      const maxOrder = await Quiz.max('orderIndex', {
        where: {
          courseId,
          lessonId: lessonId || null // Match null explicitly
        }
      });
      finalOrderIndex = (maxOrder || -1) + 1;
    }

    // Create quiz
    const quiz = await Quiz.create({
      courseId,
      lessonId: lessonId || null, // Explicitly set null if not provided
      title,
      description,
      quizType: quizType || 'practice',
      timeLimit,
      maxAttempts: maxAttempts || 1,
      passingScore: passingScore || 70,
      randomizeQuestions: randomizeQuestions || false,
      showCorrectAnswers: showCorrectAnswers !== false,
      showResultsImmediately: showResultsImmediately !== false,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      allowRetake: req.body.allowRetake !== undefined ? req.body.allowRetake : true,
      availableFrom: availableFrom || new Date(),
      availableUntil,
      orderIndex: finalOrderIndex,
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
    if (emailService && process.env.EMAIL_USER) {
      try {
        const emailTemplate = {
          subject: '📝 แบบทดสอบใหม่ถูกสร้างแล้ว!',
          html: `
            <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
              <h2 style="color: #333;">แบบทดสอบใหม่ถูกสร้างแล้ว!</h2>
              <p>สวัสดี ${req.user.firstName} ${req.user.lastName}</p>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333;">ข้อมูลแบบทดสอบ</h3>
                <p><strong>ชื่อแบบทดสอบ:</strong> ${title}</p>
                <p><strong>รายวิชา:</strong> ${course.title}</p>
                <p><strong>ประเภท:</strong> ${quizType || 'practice'}</p>
                <p><strong>จำนวนคำถาม:</strong> ${questions ? questions.length : 0}</p>
                <p><strong>เวลาจำกัด:</strong> ${timeLimit ? `${timeLimit} นาที` : 'ไม่จำกัดเวลา'}</p>
                <p><strong>จำนวนครั้งที่ทำได้:</strong> ${maxAttempts || 1}</p>
                <p><strong>เกณฑ์ผ่าน:</strong> ${passingScore || 70}%</p>
              </div>
            </div>
          `
        };
        await emailService.sendEmail(req.user.email, emailTemplate);
        console.log(`✅ Quiz creation email sent to teacher: ${req.user.email}`);
      } catch (emailError) {
        console.error('❌ Failed to send quiz creation email:', emailError.message);
      }
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

    // Check if quiz is active
    if (!quiz.isActive) {
      return next(new AppError('Quiz is currently disabled', 400));
    }

    // Check availability
    const now = new Date();
    if (quiz.availableFrom && now < quiz.availableFrom) {
      return next(new AppError('Quiz is not yet available', 400));
    }

    if (quiz.availableUntil && now > quiz.availableUntil) {
      return next(new AppError('Quiz is no longer available', 400));
    }

    // Check all previous attempts
    const allAttempts = await QuizAttempt.findAll({
      where: { 
        quizId: id, 
        studentId: req.user.id
      },
      order: [['attemptNumber', 'DESC']]
    });

    // Only count completed attempts for maxAttempts check
    const completedAttempts = allAttempts.filter(a => a.isCompleted === true);
    
    if (completedAttempts.length >= quiz.maxAttempts) {
      return next(new AppError('Maximum attempts reached', 400));
    }

    // Check allowRetake - if false and has any completed attempt, cannot retake
    if (!quiz.allowRetake && completedAttempts.length > 0) {
      return next(new AppError('Retake is not allowed for this quiz', 400));
    }

    // Check for incomplete attempt (can resume)
    const incompleteAttempt = allAttempts.find(a => a.isCompleted === false);
    if (incompleteAttempt) {
      // Get questions for the quiz
      let questions = quiz.questions || [];
      if (quiz.randomizeQuestions && questions.length > 0) {
        questions = [...questions].sort(() => Math.random() - 0.5);
      }

      const formattedQuestions = questions.map(q => ({
        id: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.options || [],
        points: q.points || 0,
        orderIndex: q.orderIndex || 0
      }));

      return res.status(200).json({
        success: true,
        message: 'Resuming existing attempt',
        data: {
          attempt: {
            id: incompleteAttempt.id,
            attemptNumber: incompleteAttempt.attemptNumber,
            startedAt: incompleteAttempt.startedAt,
            answers: incompleteAttempt.answers || {}
          },
          quiz: {
            id: quiz.id,
            title: quiz.title,
            description: quiz.description || '',
            timeLimit: quiz.timeLimit,
            questions: formattedQuestions
          },
          timeRemaining: quiz.timeLimit ?
            Math.max(0, quiz.timeLimit * 60 - Math.floor((now - incompleteAttempt.startedAt) / 1000)) : null
        }
      });
    }

    // Create new attempt
    const attemptNumber = allAttempts.length > 0 
      ? Math.max(...allAttempts.map(a => a.attemptNumber)) + 1 
      : 1;
    const attempt = await QuizAttempt.create({
      quizId: id,
      studentId: req.user.id,
      attemptNumber,
      startedAt: now,
      answers: {},
      isCompleted: false
    });

    // Check if quiz has questions
    if (!quiz.questions || quiz.questions.length === 0) {
      return next(new AppError('Quiz has no questions', 400));
    }

    // Randomize questions if enabled
    let questions = quiz.questions || [];
    if (quiz.randomizeQuestions && questions.length > 0) {
      questions = [...questions].sort(() => Math.random() - 0.5);
    }

    // Ensure questions array is properly formatted
    const formattedQuestions = questions.map(q => ({
      id: q.id,
      questionText: q.questionText,
      questionType: q.questionType,
      options: q.options || [],
      points: q.points || 0,
      orderIndex: q.orderIndex || 0
    }));

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
          description: quiz.description || '',
          timeLimit: quiz.timeLimit,
          questions: formattedQuestions
        },
        timeRemaining: quiz.timeLimit ? quiz.timeLimit * 60 : null
      }
    });

  } catch (error) {
    console.error('❌ Error in startQuizAttempt:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      quizId: id,
      studentId: req.user?.id
    });
    return next(new AppError(`Error starting quiz attempt: ${error.message}`, 500));
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
    if (!quiz) {
      return next(new AppError('Quiz not found', 404));
    }
    
    if (quiz.timeLimit) {
      const timeElapsed = Math.floor((new Date() - attempt.startedAt) / 1000);
      if (timeElapsed > quiz.timeLimit * 60) {
        // Auto-submit if time exceeded
        try {
          attempt.autoSubmitted = true;
          await completeQuizAttempt(attempt);
          const completedAttempt = await QuizAttempt.findByPk(attempt.id);
          
          return res.status(200).json({
            success: true,
            message: 'Quiz auto-submitted due to time limit',
            data: {
              attempt: {
                id: completedAttempt.id,
                score: completedAttempt.score,
                percentage: completedAttempt.percentage,
                autoSubmitted: true
              }
            }
          });
        } catch (autoSubmitError) {
          console.error('❌ Error auto-submitting quiz:', autoSubmitError);
          return next(new AppError('Error auto-submitting quiz', 500));
        }
      }
    }

    // Get question details
    const question = await QuizQuestion.findByPk(questionId);
    if (!question) {
      console.error('❌ Question not found:', questionId);
      return next(new AppError(`Question not found: ${questionId}`, 404));
    }
    if (question.quizId !== parseInt(id)) {
      console.error('❌ Question does not belong to quiz:', { questionId, quizId: id, questionQuizId: question.quizId });
      return next(new AppError('Question does not belong to this quiz', 400));
    }

    // Save/update answer
    const answers = attempt.answers || {};
    // Convert questionId to string for JSONB key consistency
    const questionIdStr = questionId.toString();
    answers[questionIdStr] = {
      answer,
      timeSpent: timeSpent || 0,
      answeredAt: new Date().toISOString() // Convert Date to ISO string for JSONB
    };

    attempt.answers = answers;
    try {
      await attempt.save();
    } catch (saveError) {
      console.error('❌ Error saving attempt:', saveError);
      console.error('Attempt data:', {
        id: attempt.id,
        answers: JSON.stringify(answers),
        answersType: typeof answers
      });
      throw saveError;
    }

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
    console.error('❌ Error in submitQuizAnswer:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      quizId: id,
      questionId,
      studentId: req.user?.id,
      answer: answer,
      timeSpent: timeSpent
    });
    return next(new AppError(`Error saving answer: ${error.message}`, 500));
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

      // Only send email if emailService is available and email config is set
      if (emailService && process.env.EMAIL_USER) {
        const emailTemplate = {
          subject: isPassed ? '🎉 ยินดีด้วย! คุณสอบผ่านแล้ว' : '📊 ผลการสอบของคุณ',
          html: `
            <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
              <h2 style="color: #333;">${isPassed ? '🎉 ยินดีด้วย! คุณสอบผ่านแล้ว' : '📊 ผลการสอบของคุณ'}</h2>
              <p>สวัสดี ${req.user.firstName} ${req.user.lastName}</p>
              <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333;">ผลการสอบ: ${quiz.title}</h3>
                <p><strong>รายวิชา:</strong> ${quiz.course.title}</p>
                <p><strong>คะแนน:</strong> ${completedAttempt.score}/${completedAttempt.maxScore} (${completedAttempt.percentage}%)</p>
                <p><strong>เกรด:</strong> ${grade}</p>
                <p><strong>สถานะ:</strong> ${isPassed ? '✅ ผ่าน' : '❌ ไม่ผ่าน'}</p>
                <p><strong>ครั้งที่:</strong> ${completedAttempt.attemptNumber}/${quiz.maxAttempts}</p>
              </div>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/courses/${quiz.courseId}/quizzes/${quiz.id}/results/${completedAttempt.id}" 
                 style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                ดูผลรายละเอียด
              </a>
            </div>
          `
        };
        await emailService.sendEmail(req.user.email, emailTemplate);
        console.log(`✅ Quiz results email sent to: ${req.user.email} (${isPassed ? 'PASSED' : 'FAILED'})`);
      } else {
        console.log('⚠️ Email service not configured, skipping quiz results email');
      }

      // 📧 NOTIFY TEACHER ABOUT QUIZ COMPLETION (if significant)
      if ((isPassed || completedAttempt.attemptNumber >= quiz.maxAttempts) && emailService && process.env.EMAIL_USER) {
        try {
          const teacherEmailTemplate = {
            subject: `📋 นักเรียน${isPassed ? 'สอบผ่าน' : 'ทำแบบทดสอบครบจำนวนครั้งแล้ว'}: ${quiz.title}`,
            html: `
              <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                <h2 style="color: #333;">${isPassed ? 'นักเรียนสอบผ่าน' : 'นักเรียนทำแบบทดสอบครบจำนวนครั้งแล้ว'}</h2>
                <p>สวัสดี ${quiz.course.teacher.firstName} ${quiz.course.teacher.lastName}</p>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #333;">ข้อมูลการสอบ</h3>
                  <p><strong>นักเรียน:</strong> ${req.user.firstName} ${req.user.lastName} (${req.user.email})</p>
                  <p><strong>แบบทดสอบ:</strong> ${quiz.title}</p>
                  <p><strong>รายวิชา:</strong> ${quiz.course.title}</p>
                  <p><strong>คะแนน:</strong> ${completedAttempt.score}/${completedAttempt.maxScore} (${completedAttempt.percentage}%)</p>
                  <p><strong>เกรด:</strong> ${grade}</p>
                  <p><strong>สถานะ:</strong> ${isPassed ? '✅ ผ่าน' : '❌ ไม่ผ่าน'}</p>
                  <p><strong>ครั้งที่:</strong> ${completedAttempt.attemptNumber}/${quiz.maxAttempts}</p>
                </div>
              </div>
            `
          };
          await emailService.sendEmail(quiz.course.teacher.email, teacherEmailTemplate);
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
    console.error('❌ Error in submitQuiz:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      quizId: id,
      studentId: req.user?.id
    });
    return next(new AppError(`Error submitting quiz: ${error.message}`, 500));
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

    if (!quiz) {
      throw new Error('Quiz not found');
    }

    if (!quiz.questions || quiz.questions.length === 0) {
      console.warn('⚠️ Quiz has no questions:', quiz.id);
      // Set default values if no questions
      attempt.score = 0;
      attempt.maxScore = 0;
      attempt.percentage = 0;
      attempt.isCompleted = true;
      attempt.submittedAt = new Date();
      attempt.timeSpent = Math.floor((new Date() - attempt.startedAt) / 1000);
      await attempt.save();
      return attempt;
    }

    let totalScore = 0;
    let maxScore = 0;
    const answers = attempt.answers || {};

    // Calculate score
    for (const question of quiz.questions) {
      const questionPoints = parseFloat(question.points) || 0;
      maxScore += questionPoints;

      // Try both integer and string key (for JSONB consistency)
      const userAnswer = answers[question.id] || answers[question.id.toString()];
      if (userAnswer && userAnswer.answer !== undefined && userAnswer.answer !== null) {
        const isCorrect = checkAnswer(question, userAnswer.answer);
        // Essay questions return null (not auto-graded) - don't add to score
        if (isCorrect === true) {
          totalScore += questionPoints;
        } else if (isCorrect === null) {
          // Essay question - needs manual grading, don't add to score yet
          // Score will be 0 until teacher grades it
        }
        // If isCorrect === false, score remains 0
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
    console.error('❌ Error in completeQuizAttempt:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      attemptId: attempt?.id,
      quizId: attempt?.quizId
    });
    throw new Error(`Error completing quiz attempt: ${error.message}`);
  }
};

const checkAnswer = (question, userAnswer) => {
  if (!userAnswer) return false;

  switch (question.questionType) {
    case 'multiple_choice':
    case 'true_false':
      // For multiple choice, check if selected option is correct
      if (question.options && Array.isArray(question.options)) {
        // Find the option that matches user's answer
        const selectedOption = question.options.find(opt => 
          opt.text === userAnswer || 
          opt.id === userAnswer ||
          (typeof userAnswer === 'string' && opt.text?.toString() === userAnswer.toString())
        );
        return selectedOption ? selectedOption.is_correct === true : false;
      }
      // Fallback: check against correctAnswer if options not available
      if (question.correctAnswer) {
        return userAnswer.toString() === question.correctAnswer.toString();
      }
      return false;
    case 'short_answer':
    case 'fill_blank':
      if (!question.correctAnswer) return false;
      const userAnswerNormalized = userAnswer.toString().toLowerCase().trim();
      const correctAnswerNormalized = question.correctAnswer.toString().toLowerCase().trim();
      if (question.questionType === 'fill_blank') {
        return userAnswerNormalized.includes(correctAnswerNormalized) || 
               correctAnswerNormalized.includes(userAnswerNormalized);
      }
      return userAnswerNormalized === correctAnswerNormalized;
    case 'essay':
      // Essays are not auto-graded
      return null;
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
    orderIndex,
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
      courseId, lessonId: lessonId !== undefined ? (lessonId || null) : undefined,
      title, description, quizType, timeLimit, maxAttempts, passingScore,
      randomizeQuestions, showCorrectAnswers, showResultsImmediately,
      isActive: req.body.isActive !== undefined ? req.body.isActive : undefined,
      allowRetake: req.body.allowRetake !== undefined ? req.body.allowRetake : undefined,
      availableFrom, availableUntil, orderIndex
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

// @desc    Get quiz results for a specific attempt
// @route   GET /api/quizzes/:id/results
// @access  Student (own attempts)/Teacher/Admin
const getQuizResults = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { attemptId } = req.query;

  try {
    // Get quiz with questions
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
              attributes: ['firstName', 'lastName', 'email']
            }
          ]
        },
        {
          model: QuizQuestion,
          as: 'questions',
          order: [['orderIndex', 'ASC']],
          attributes: ['id', 'questionText', 'questionType', 'points', 'orderIndex', 'options', 'correctAnswer', 'explanation']
        }
      ]
    });

    if (!quiz) {
      return next(new AppError('Quiz not found', 404));
    }

    // Check access
    if (req.user.role === 'student') {
      // Students can only view their own attempts
      if (!attemptId) {
        return next(new AppError('Attempt ID is required for students', 400));
      }
    } else if (req.user.role === 'teacher') {
      // Teachers can only view attempts for their own courses
      if (quiz.course.teacherId !== req.user.id && req.user.role !== 'admin') {
        return next(new AppError('You can only view results for your own courses', 403));
      }
    }

    // Get attempt(s)
    let attempts;
    if (attemptId) {
      // Get specific attempt
      const attempt = await QuizAttempt.findByPk(attemptId, {
        include: [
          {
            model: User,
            as: 'student',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ]
      });

      if (!attempt) {
        return next(new AppError('Attempt not found', 404));
      }

      // Check if student owns this attempt
      if (req.user.role === 'student' && attempt.studentId !== req.user.id) {
        return next(new AppError('You can only view your own attempts', 403));
      }

      // Check if attempt belongs to this quiz
      if (attempt.quizId !== parseInt(id)) {
        return next(new AppError('Attempt does not belong to this quiz', 400));
      }

      attempts = [attempt];
    } else {
      // Get all attempts for this quiz (teachers/admin only)
      if (req.user.role === 'student') {
        return next(new AppError('Students must specify an attempt ID', 400));
      }

      attempts = await QuizAttempt.findAll({
        where: {
          quizId: id,
          isCompleted: true
        },
        include: [
          {
            model: User,
            as: 'student',
            attributes: ['id', 'firstName', 'lastName', 'email']
          }
        ],
        order: [['submittedAt', 'DESC']]
      });
    }

    // Process results with question details
    const results = attempts.map(attempt => {
      const answers = attempt.answers || {};
      const questionResults = quiz.questions.map(question => {
        const answerData = answers[question.id] || {};
        const studentAnswer = answerData.answer;
        let isCorrect = false;
        let pointsEarned = 0;

        // Check if answer is correct
        if (studentAnswer !== undefined && studentAnswer !== null) {
          switch (question.questionType) {
            case 'multiple_choice':
            case 'true_false':
              // Check if selected option is correct
              if (question.options && Array.isArray(question.options)) {
                const selectedOption = question.options.find(opt => 
                  opt.text === studentAnswer || opt.id === studentAnswer
                );
                isCorrect = selectedOption ? selectedOption.is_correct : false;
              }
              break;
            case 'short_answer':
            case 'fill_blank':
              // Compare with correct answer (case-insensitive, trimmed)
              const correctAnswer = (question.correctAnswer || '').toString().trim().toLowerCase();
              const studentAnswerNormalized = studentAnswer.toString().trim().toLowerCase();
              isCorrect = correctAnswer === studentAnswerNormalized;
              break;
            case 'essay':
              // Essays are not auto-graded
              isCorrect = null;
              break;
          }

          // Calculate points
          if (isCorrect === true) {
            pointsEarned = question.points || 0;
          } else if (isCorrect === null) {
            // Essay - needs manual grading
            pointsEarned = 0;
          }
        }

        return {
          questionId: question.id,
          questionText: question.questionText,
          questionType: question.questionType,
          points: question.points,
          pointsEarned,
          isCorrect,
          studentAnswer,
          correctAnswer: quiz.showCorrectAnswers ? question.correctAnswer : undefined,
          options: question.options,
          explanation: quiz.showCorrectAnswers ? question.explanation : undefined,
          timeSpent: answerData.timeSpent || 0,
          answeredAt: answerData.answeredAt
        };
      });

      const totalPointsEarned = questionResults.reduce((sum, q) => sum + q.pointsEarned, 0);
      const totalMaxPoints = questionResults.reduce((sum, q) => sum + (q.points || 0), 0);
      const calculatedPercentage = totalMaxPoints > 0 
        ? (totalPointsEarned / totalMaxPoints) * 100 
        : 0;

      return {
        attemptId: attempt.id,
        attemptNumber: attempt.attemptNumber,
        student: req.user.role === 'student' ? undefined : attempt.student,
        score: attempt.score || totalPointsEarned,
        maxScore: attempt.maxScore || totalMaxPoints,
        percentage: attempt.percentage || calculatedPercentage,
        grade: getGradeFromPercentage(attempt.percentage || calculatedPercentage),
        isPassed: (attempt.percentage || calculatedPercentage) >= quiz.passingScore,
        timeSpent: attempt.timeSpent || 0,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        isCompleted: attempt.isCompleted,
        autoSubmitted: attempt.autoSubmitted,
        questions: questionResults,
        canRetake: attempt.attemptNumber < quiz.maxAttempts
      };
    });

    res.status(200).json({
      success: true,
      data: {
        quiz: {
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          passingScore: quiz.passingScore,
          maxAttempts: quiz.maxAttempts,
          showCorrectAnswers: quiz.showCorrectAnswers,
          showResultsImmediately: quiz.showResultsImmediately
        },
        results: results.length === 1 ? results[0] : results,
        course: {
          id: quiz.course.id,
          title: quiz.course.title,
          teacher: quiz.course.teacher
        }
      }
    });

  } catch (error) {
    console.error('Error fetching quiz results:', error);
    return next(new AppError('Error fetching quiz results', 500));
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
  submitQuiz,
  getQuizResults
};