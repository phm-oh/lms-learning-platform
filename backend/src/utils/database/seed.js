const bcrypt = require('bcryptjs');
const { 
  User, 
  CourseCategory, 
  Course, 
  Lesson, 
  Quiz, 
  QuizQuestion,
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
      
      // 4. Create Lessons for the first course
      console.log('📝 Creating lessons...');
      const lessons = await Lesson.bulkCreate([
        {
          courseId: courses[0].id, // Calculus
          title: 'Introduction to Limits',
          description: 'Understanding the concept of limits',
          content: '<h2>What are Limits?</h2><p>Limits are fundamental to calculus...</p>',
          lessonType: 'text',
          orderIndex: 1,
          estimatedTime: 45,
          status: 'published'
        },
        {
          courseId: courses[0].id,
          title: 'Limit Laws and Techniques',
          description: 'Learn various techniques for evaluating limits',
          content: '<h2>Limit Laws</h2><p>There are several laws that help us evaluate limits...</p>',
          lessonType: 'video',
          videoUrl: 'https://www.youtube.com/watch?v=riXcZT2ICjA',
          videoDuration: 1800, // 30 minutes
          orderIndex: 2,
          estimatedTime: 60,
          status: 'published'
        },
        {
          courseId: courses[0].id,
          title: 'Introduction to Derivatives',
          description: 'The derivative as a limit',
          content: '<h2>Derivatives</h2><p>The derivative represents the rate of change...</p>',
          lessonType: 'text',
          orderIndex: 3,
          estimatedTime: 50,
          status: 'published',
          prerequisites: [1, 2] // Requires lessons 1 and 2
        }
      ], { transaction });
      
      // 5. Create a Quiz
      console.log('🧠 Creating quizzes...');
      const quiz = await Quiz.create({
        courseId: courses[0].id,
        lessonId: lessons[0].id,
        title: 'Limits Quiz',
        description: 'Test your understanding of limits',
        quizType: 'assessment',
        timeLimit: 30, // 30 minutes
        maxAttempts: 2,
        passingScore: 70.00,
        isPublished: true
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
      
      console.log('✅ Database seeded successfully!');
      console.log('');
      console.log('🔑 Login credentials:');
      console.log('Admin: admin@lms-platform.com / admin123');
      console.log('Teacher: teacher1@lms-platform.com / teacher123');
      console.log('Student: student1@lms-platform.com / student123');
      console.log('');
      console.log('📊 Data created:');
      console.log(`- ${categories.length} course categories`);
      console.log(`- 1 admin, ${teachers.length} teachers, ${students.length} students`);
      console.log(`- ${courses.length} courses`);
      console.log(`- ${lessons.length} lessons`);
      console.log('- 1 quiz with 3 questions');
      
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