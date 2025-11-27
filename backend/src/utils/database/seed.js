const bcrypt = require('bcryptjs');
const { 
  User, 
  CourseCategory, 
  Course, 
  Lesson, 
  Quiz, 
  QuizQuestion,
  Enrollment,
  LessonProgress,
  sequelize 
} = require('../../models');

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Check if data already exists
    const userCount = await User.count();
    if (userCount > 0) {
      console.log('⚠️  Database already contains data. Skipping seed.');
      return;
    }
    
    // Start transaction
    const transaction = await sequelize.transaction();
    
    try {
      // 1. Create Course Categories
      console.log('📚 Creating course categories...');
      const categories = await CourseCategory.bulkCreate([
        {
          name: 'Mathematics',
          description: 'Mathematics and related subjects',
          color: '#FF6B6B',
          icon: 'calculator'
        },
        {
          name: 'Science',
          description: 'Physics, Chemistry, Biology',
          color: '#4ECDC4',
          icon: 'microscope'
        },
        {
          name: 'Language',
          description: 'Language learning and literature',
          color: '#45B7D1',
          icon: 'book-open'
        },
        {
          name: 'Technology',
          description: 'Computer Science and IT',
          color: '#96CEB4',
          icon: 'computer'
        },
        {
          name: 'Business',
          description: 'Business and Management',
          color: '#FFEAA7',
          icon: 'briefcase'
        }
      ], { transaction });
      
      // 2. Create Users
      console.log('👥 Creating users...');
      
      // Admin user
      const admin = await User.create({
        email: 'admin@lms-platform.com',
        password: 'admin123',
        firstName: 'System',
        lastName: 'Administrator',
        role: 'admin',
        status: 'active',
        emailVerified: true
      }, { transaction });
      
      // Teacher users
      const teachers = await User.bulkCreate([
        {
          email: 'teacher1@lms-platform.com',
          password: 'teacher123',
          firstName: 'John',
          lastName: 'Smith',
          role: 'teacher',
          status: 'active',
          emailVerified: true,
          bio: 'Mathematics professor with 10+ years experience'
        },
        {
          email: 'teacher2@lms-platform.com',
          password: 'teacher123',
          firstName: 'Sarah',
          lastName: 'Johnson',
          role: 'teacher',
          status: 'active',
          emailVerified: true,
          bio: 'Computer Science lecturer and software developer'
        },
        {
          email: 'teacher3@lms-platform.com',
          password: 'teacher123',
          firstName: 'Mike',
          lastName: 'Brown',
          role: 'teacher',
          status: 'active',
          emailVerified: true,
          bio: 'Physics researcher and educator'
        }
      ], { 
        transaction,
        individualHooks: true // For password hashing
      });
      
      // Student users
      const students = await User.bulkCreate([
        {
          email: 'student1@lms-platform.com',
          password: 'student123',
          firstName: 'Alice',
          lastName: 'Wilson',
          role: 'student',
          status: 'active',
          emailVerified: true
        },
        {
          email: 'student2@lms-platform.com',
          password: 'student123',
          firstName: 'Bob',
          lastName: 'Davis',
          role: 'student',
          status: 'active',
          emailVerified: true
        },
        {
          email: 'student3@lms-platform.com',
          password: 'student123',
          firstName: 'Carol',
          lastName: 'Miller',
          role: 'student',
          status: 'active',
          emailVerified: true
        },
        {
          email: 'student4@lms-platform.com',
          password: 'student123',
          firstName: 'David',
          lastName: 'Garcia',
          role: 'student',
          status: 'active',
          emailVerified: true
        }
      ], { 
        transaction,
        individualHooks: true
      });
      
      // 3. Create Courses
      console.log('📖 Creating courses...');
      const courses = await Course.bulkCreate([
        {
          title: 'Introduction to Calculus',
          description: 'Learn the fundamentals of differential and integral calculus',
          shortDescription: 'Master calculus basics with practical examples',
          categoryId: categories[0].id, // Mathematics
          teacherId: teachers[0].id,
          courseCode: 'MATH101',
          difficultyLevel: 2,
          estimatedDuration: 40,
          maxStudents: 30,
          isPublished: true,
          tags: ['mathematics', 'calculus', 'derivatives', 'integrals'],
          learningObjectives: [
            'Understand limits and continuity',
            'Master differentiation techniques',
            'Apply integration methods',
            'Solve real-world problems using calculus'
          ]
        },
        {
          title: 'Web Development Fundamentals',
          description: 'Complete guide to modern web development using HTML, CSS, and JavaScript',
          shortDescription: 'Build responsive websites from scratch',
          categoryId: categories[3].id, // Technology
          teacherId: teachers[1].id,
          courseCode: 'WEB101',
          difficultyLevel: 1,
          estimatedDuration: 60,
          maxStudents: 25,
          isPublished: true,
          tags: ['web development', 'html', 'css', 'javascript'],
          learningObjectives: [
            'Create semantic HTML structures',
            'Style websites with CSS',
            'Add interactivity with JavaScript',
            'Deploy websites to production'
          ]
        },
        {
          title: 'Physics: Mechanics',
          description: 'Classical mechanics covering motion, forces, and energy',
          shortDescription: 'Understand the physics of motion and forces',
          categoryId: categories[1].id, // Science
          teacherId: teachers[2].id,
          courseCode: 'PHYS101',
          difficultyLevel: 3,
          estimatedDuration: 50,
          maxStudents: 20,
          isPublished: true,
          tags: ['physics', 'mechanics', 'motion', 'forces'],
          learningObjectives: [
            'Analyze motion in 1D and 2D',
            'Apply Newton\'s laws of motion',
            'Understand work and energy',
            'Solve collision problems'
          ]
        }
      ], { transaction });
      
      // 4. Create Lessons for all courses
      console.log('📝 Creating lessons...');
      const allLessons = [];
      
      // Lessons for Calculus course
      const calcLessons = await Lesson.bulkCreate([
        {
          courseId: courses[0].id, // Calculus
          title: 'Introduction to Limits',
          description: 'Understanding the concept of limits',
          content: '<h2>What are Limits?</h2><p>Limits are fundamental to calculus. They describe the behavior of functions as they approach a specific point.</p>',
          lessonType: 'text',
          orderIndex: 1,
          estimatedTime: 45,
          status: 'published',
          isRequired: true
        },
        {
          courseId: courses[0].id,
          title: 'Limit Laws and Techniques',
          description: 'Learn various techniques for evaluating limits',
          content: '<h2>Limit Laws</h2><p>There are several laws that help us evaluate limits more easily...</p>',
          lessonType: 'video',
          videoUrl: 'https://www.youtube.com/watch?v=riXcZT2ICjA',
          videoDuration: 1800, // 30 minutes
          orderIndex: 2,
          estimatedTime: 60,
          status: 'published',
          isRequired: true
        },
        {
          courseId: courses[0].id,
          title: 'Introduction to Derivatives',
          description: 'The derivative as a limit',
          content: '<h2>Derivatives</h2><p>The derivative represents the rate of change of a function...</p>',
          lessonType: 'text',
          orderIndex: 3,
          estimatedTime: 50,
          status: 'published',
          isRequired: true
          // Prerequisites will be set after lessons are created
        },
        {
          courseId: courses[0].id,
          title: 'Derivative Rules',
          description: 'Power rule, product rule, quotient rule, and chain rule',
          content: '<h2>Derivative Rules</h2><p>Learn the essential rules for finding derivatives...</p>',
          lessonType: 'text',
          orderIndex: 4,
          estimatedTime: 60,
          status: 'published',
          isRequired: true
          // Prerequisites will be set after lessons are created
        }
      ], { transaction });
      allLessons.push(...calcLessons);
      
      // Lessons for Web Development course
      const webLessons = await Lesson.bulkCreate([
        {
          courseId: courses[1].id, // Web Development
          title: 'HTML Basics',
          description: 'Introduction to HTML structure and elements',
          content: '<h2>HTML Basics</h2><p>HTML is the foundation of web development...</p>',
          lessonType: 'text',
          orderIndex: 1,
          estimatedTime: 30,
          status: 'published',
          isRequired: true
        },
        {
          courseId: courses[1].id,
          title: 'CSS Styling',
          description: 'Learn how to style your HTML with CSS',
          content: '<h2>CSS Styling</h2><p>CSS allows you to make your websites beautiful...</p>',
          lessonType: 'video',
          videoUrl: 'https://www.youtube.com/watch?v=1Rs2ND1ryYc',
          videoDuration: 2400, // 40 minutes
          orderIndex: 2,
          estimatedTime: 45,
          status: 'published',
          isRequired: true
          // Prerequisites will be set after lessons are created
        },
        {
          courseId: courses[1].id,
          title: 'JavaScript Fundamentals',
          description: 'Introduction to JavaScript programming',
          content: '<h2>JavaScript Fundamentals</h2><p>JavaScript adds interactivity to your websites...</p>',
          lessonType: 'text',
          orderIndex: 3,
          estimatedTime: 60,
          status: 'published',
          isRequired: true
          // Prerequisites will be set after lessons are created
        }
      ], { transaction });
      allLessons.push(...webLessons);
      
      // Lessons for Physics course
      const physLessons = await Lesson.bulkCreate([
        {
          courseId: courses[2].id, // Physics
          title: 'Motion in One Dimension',
          description: 'Understanding linear motion',
          content: '<h2>Motion in One Dimension</h2><p>Learn about position, velocity, and acceleration...</p>',
          lessonType: 'text',
          orderIndex: 1,
          estimatedTime: 50,
          status: 'published',
          isRequired: true
        },
        {
          courseId: courses[2].id,
          title: 'Newton\'s Laws of Motion',
          description: 'The three fundamental laws of motion',
          content: '<h2>Newton\'s Laws</h2><p>Understand the principles that govern motion...</p>',
          lessonType: 'video',
          videoUrl: 'https://www.youtube.com/watch?v=kKKM8Y-u7ds',
          videoDuration: 2700, // 45 minutes
          orderIndex: 2,
          estimatedTime: 60,
          status: 'published',
          isRequired: true
          // Prerequisites will be set after lessons are created
        }
      ], { transaction });
      allLessons.push(...physLessons);
      
      const lessons = allLessons;
      
      // Set prerequisites after lessons are created
      await calcLessons[2].update({ prerequisites: [calcLessons[0].id, calcLessons[1].id] }, { transaction });
      await calcLessons[3].update({ prerequisites: [calcLessons[2].id] }, { transaction });
      await webLessons[1].update({ prerequisites: [webLessons[0].id] }, { transaction });
      await webLessons[2].update({ prerequisites: [webLessons[1].id] }, { transaction });
      await physLessons[1].update({ prerequisites: [physLessons[0].id] }, { transaction });
      
      // 5. Create a Quiz
      console.log('🧠 Creating quizzes...');
      const quiz = await Quiz.create({
        courseId: courses[0].id,
        lessonId: lessons[0].id, // Lesson-level Quiz (ผูกกับ lesson)
        title: 'Limits Quiz',
        description: 'Test your understanding of limits',
        quizType: 'assessment',
        timeLimit: 30, // 30 minutes
        maxAttempts: 2,
        passingScore: 70.00,
        isPublished: true,
        availableFrom: new Date(), // Available now
        availableUntil: null, // No expiry
        orderIndex: 0 // เรียงลำดับใน lesson (0 = แรกสุด)
      }, { transaction });
      
      // 6. Create Quiz Questions
      console.log('❓ Creating quiz questions...');
      await QuizQuestion.bulkCreate([
        {
          quizId: quiz.id,
          questionText: 'What is the limit of f(x) = x² as x approaches 2?',
          questionType: 'multiple_choice',
          points: 2.00,
          orderIndex: 1,
          options: [
            { text: '2', is_correct: false },
            { text: '4', is_correct: true },
            { text: '6', is_correct: false },
            { text: '8', is_correct: false }
          ],
          explanation: 'When x approaches 2, x² approaches 2² = 4'
        },
        {
          quizId: quiz.id,
          questionText: 'True or False: The limit of a function always equals the function value at that point.',
          questionType: 'true_false',
          points: 1.00,
          orderIndex: 2,
          correctAnswer: 'false',
          explanation: 'Limits can exist even when the function is not defined at that point'
        },
        {
          quizId: quiz.id,
          questionText: 'Calculate the limit: lim(x→0) sin(x)/x',
          questionType: 'short_answer',
          points: 3.00,
          orderIndex: 3,
          correctAnswer: '1',
          explanation: 'This is a fundamental limit in calculus: lim(x→0) sin(x)/x = 1'
        }
      ], { transaction });
      
      // 7. Create Enrollments
      console.log('📋 Creating enrollments...');
      const enrollments = await Enrollment.bulkCreate([
        {
          courseId: courses[0].id, // Calculus
          studentId: students[0].id, // Alice
          status: 'approved',
          enrolledAt: new Date(),
          approvedAt: new Date(),
          approvedBy: admin.id,
          completionPercentage: 25.00
        },
        {
          courseId: courses[0].id, // Calculus
          studentId: students[1].id, // Bob
          status: 'approved',
          enrolledAt: new Date(),
          approvedAt: new Date(),
          approvedBy: admin.id,
          completionPercentage: 50.00
        },
        {
          courseId: courses[1].id, // Web Development
          studentId: students[0].id, // Alice
          status: 'approved',
          enrolledAt: new Date(),
          approvedAt: new Date(),
          approvedBy: admin.id,
          completionPercentage: 66.67
        },
        {
          courseId: courses[1].id, // Web Development
          studentId: students[2].id, // Carol
          status: 'approved',
          enrolledAt: new Date(),
          approvedAt: new Date(),
          approvedBy: admin.id,
          completionPercentage: 0.00
        },
        {
          courseId: courses[2].id, // Physics
          studentId: students[1].id, // Bob
          status: 'approved',
          enrolledAt: new Date(),
          approvedAt: new Date(),
          approvedBy: admin.id,
          completionPercentage: 0.00
        }
      ], { transaction });
      
      // 8. Create Lesson Progress
      console.log('📈 Creating lesson progress...');
      await LessonProgress.bulkCreate([
        // Alice's progress in Calculus
        {
          lessonId: calcLessons[0].id,
          studentId: students[0].id,
          status: 'completed',
          completionPercentage: 100.00,
          timeSpent: 2700, // 45 minutes
          completedAt: new Date()
        },
        {
          lessonId: calcLessons[1].id,
          studentId: students[0].id,
          status: 'in_progress',
          completionPercentage: 50.00,
          timeSpent: 1800 // 30 minutes
        },
        // Bob's progress in Calculus
        {
          lessonId: calcLessons[0].id,
          studentId: students[1].id,
          status: 'completed',
          completionPercentage: 100.00,
          timeSpent: 2400,
          completedAt: new Date()
        },
        {
          lessonId: calcLessons[1].id,
          studentId: students[1].id,
          status: 'completed',
          completionPercentage: 100.00,
          timeSpent: 3600,
          completedAt: new Date()
        },
        // Alice's progress in Web Development
        {
          lessonId: webLessons[0].id,
          studentId: students[0].id,
          status: 'completed',
          completionPercentage: 100.00,
          timeSpent: 1800,
          completedAt: new Date()
        },
        {
          lessonId: webLessons[1].id,
          studentId: students[0].id,
          status: 'completed',
          completionPercentage: 100.00,
          timeSpent: 2700,
          completedAt: new Date()
        },
        {
          lessonId: webLessons[2].id,
          studentId: students[0].id,
          status: 'in_progress',
          completionPercentage: 30.00,
          timeSpent: 1080
        }
      ], { transaction });
      
      console.log('✅ Database seeded successfully!');
      console.log('');
      console.log('🔑 Login credentials:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('👨‍💼 Admin:');
      console.log('   Email: admin@lms-platform.com');
      console.log('   Password: admin123');
      console.log('');
      console.log('👨‍🏫 Teachers:');
      console.log('   Teacher 1: teacher1@lms-platform.com / teacher123');
      console.log('   Teacher 2: teacher2@lms-platform.com / teacher123');
      console.log('   Teacher 3: teacher3@lms-platform.com / teacher123');
      console.log('');
      console.log('👨‍🎓 Students:');
      console.log('   Student 1 (Alice): student1@lms-platform.com / student123');
      console.log('   Student 2 (Bob): student2@lms-platform.com / student123');
      console.log('   Student 3 (Carol): student3@lms-platform.com / student123');
      console.log('   Student 4 (David): student4@lms-platform.com / student123');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
      console.log('📊 Data created:');
      console.log(`- ${categories.length} course categories`);
      console.log(`- 1 admin, ${teachers.length} teachers, ${students.length} students`);
      console.log(`- ${courses.length} courses`);
      console.log(`- ${lessons.length} lessons`);
      console.log(`- ${enrollments.length} enrollments`);
      console.log('- 1 quiz with 3 questions');
      console.log('- Multiple lesson progress records');
      console.log('');
      console.log('📚 Course Enrollment Summary:');
      console.log('   Calculus: Alice (25%), Bob (50%)');
      console.log('   Web Development: Alice (67%), Carol (0%)');
      console.log('   Physics: Bob (0%)');
      console.log('');
      console.log('🎯 How to test Course Learning Page:');
      console.log('   1. Login as student1@lms-platform.com / student123');
      console.log('   2. Go to "My Courses" menu');
      console.log('   3. Click "เรียนต่อ" or "เริ่มเรียน" on any enrolled course');
      console.log('   4. You will see the Course Learning Page with lessons and progress');
      
      await transaction.commit();
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };