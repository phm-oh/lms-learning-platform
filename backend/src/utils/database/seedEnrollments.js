// File: seedEnrollments.js
// Path: backend/src/utils/database/seedEnrollments.js
// Script to add enrollments for existing users

const { 
  User, 
  Course, 
  Enrollment,
  LessonProgress,
  Lesson,
  sequelize 
} = require('../../models');

async function seedEnrollments() {
  try {
    console.log('🌱 Starting enrollment seeding...');
    
    // Start transaction
    const transaction = await sequelize.transaction();
    
    try {
      // Get users
      const admin = await User.findOne({ where: { email: 'admin@lms-platform.com' }, transaction });
      const student1 = await User.findOne({ where: { email: 'student1@lms-platform.com' }, transaction });
      const student2 = await User.findOne({ where: { email: 'student2@lms-platform.com' }, transaction });
      const student3 = await User.findOne({ where: { email: 'student3@lms-platform.com' }, transaction });
      
      if (!admin || !student1) {
        console.log('❌ Required users not found. Please run full seed first.');
        await transaction.rollback();
        return;
      }
      
      // Get courses
      const courses = await Course.findAll({ transaction });
      if (courses.length === 0) {
        console.log('❌ No courses found. Please run full seed first.');
        await transaction.rollback();
        return;
      }
      
      const calcCourse = courses.find(c => c.courseCode === 'MATH101');
      const webCourse = courses.find(c => c.courseCode === 'WEB101');
      const physCourse = courses.find(c => c.courseCode === 'PHYS101');
      
      // Check existing enrollments (exclude rejectionReason field that doesn't exist in DB)
      const existingEnrollments = await Enrollment.findAll({ 
        attributes: { exclude: ['rejectionReason'] },
        transaction 
      });
      if (existingEnrollments.length > 0) {
        console.log(`⚠️  Found ${existingEnrollments.length} existing enrollments. Deleting them...`);
        await Enrollment.destroy({ where: {}, transaction });
        await LessonProgress.destroy({ where: {}, transaction });
      }
      
      // Create enrollments using raw query to avoid rejection_reason field issue
      console.log('📋 Creating enrollments...');
      const enrollmentData = [
        {
          courseId: calcCourse.id,
          studentId: student1.id,
          status: 'approved',
          enrolledAt: new Date(),
          approvedAt: new Date(),
          approvedBy: admin.id,
          completionPercentage: 25.00
        },
        {
          courseId: calcCourse.id,
          studentId: student2.id,
          status: 'approved',
          enrolledAt: new Date(),
          approvedAt: new Date(),
          approvedBy: admin.id,
          completionPercentage: 50.00
        },
        {
          courseId: webCourse.id,
          studentId: student1.id,
          status: 'approved',
          enrolledAt: new Date(),
          approvedAt: new Date(),
          approvedBy: admin.id,
          completionPercentage: 66.67
        },
        {
          courseId: webCourse.id,
          studentId: student3.id,
          status: 'approved',
          enrolledAt: new Date(),
          approvedAt: new Date(),
          approvedBy: admin.id,
          completionPercentage: 0.00
        },
        {
          courseId: physCourse.id,
          studentId: student2.id,
          status: 'approved',
          enrolledAt: new Date(),
          approvedAt: new Date(),
          approvedBy: admin.id,
          completionPercentage: 0.00
        }
      ];
      
      // Use raw query to insert enrollments
      const enrollments = [];
      for (const data of enrollmentData) {
        const [result] = await sequelize.query(
          `INSERT INTO enrollments (course_id, student_id, status, enrolled_at, approved_at, approved_by, completion_percentage, certificate_issued, is_active)
           VALUES (:courseId, :studentId, :status, :enrolledAt, :approvedAt, :approvedBy, :completionPercentage, false, true)
           RETURNING id, course_id, student_id, status, enrolled_at, approved_at, approved_by, completion_percentage, final_grade, certificate_issued, is_active`,
          {
            replacements: {
              courseId: data.courseId,
              studentId: data.studentId,
              status: data.status,
              enrolledAt: data.enrolledAt,
              approvedAt: data.approvedAt,
              approvedBy: data.approvedBy,
              completionPercentage: data.completionPercentage
            },
            type: sequelize.QueryTypes.SELECT,
            transaction
          }
        );
        enrollments.push(result);
      }
      
      // Get lessons for progress (optional - only create progress if lessons exist)
      const calcLessons = await Lesson.findAll({ 
        where: { courseId: calcCourse.id },
        order: [['orderIndex', 'ASC']],
        attributes: ['id'],
        transaction 
      });
      const webLessons = await Lesson.findAll({ 
        where: { courseId: webCourse.id },
        order: [['orderIndex', 'ASC']],
        attributes: ['id'],
        transaction 
      });
      
      // Create lesson progress only if lessons exist
      if (calcLessons.length > 0 || webLessons.length > 0) {
        console.log('📈 Creating lesson progress...');
        const progressData = [];
        
        if (calcLessons.length >= 2) {
          // Alice's progress in Calculus
          progressData.push(
            {
              lessonId: calcLessons[0].id,
              studentId: student1.id,
              status: 'completed',
              completionPercentage: 100.00,
              timeSpent: 2700,
              completedAt: new Date()
            },
            {
              lessonId: calcLessons[1].id,
              studentId: student1.id,
              status: 'in_progress',
              completionPercentage: 50.00,
              timeSpent: 1800
            },
            // Bob's progress in Calculus
            {
              lessonId: calcLessons[0].id,
              studentId: student2.id,
              status: 'completed',
              completionPercentage: 100.00,
              timeSpent: 2400,
              completedAt: new Date()
            },
            {
              lessonId: calcLessons[1].id,
              studentId: student2.id,
              status: 'completed',
              completionPercentage: 100.00,
              timeSpent: 3600,
              completedAt: new Date()
            }
          );
        }
        
        if (webLessons.length >= 3) {
          // Alice's progress in Web Development
          progressData.push(
            {
              lessonId: webLessons[0].id,
              studentId: student1.id,
              status: 'completed',
              completionPercentage: 100.00,
              timeSpent: 1800,
              completedAt: new Date()
            },
            {
              lessonId: webLessons[1].id,
              studentId: student1.id,
              status: 'completed',
              completionPercentage: 100.00,
              timeSpent: 2700,
              completedAt: new Date()
            },
            {
              lessonId: webLessons[2].id,
              studentId: student1.id,
              status: 'in_progress',
              completionPercentage: 30.00,
              timeSpent: 1080
            }
          );
        }
        
        if (progressData.length > 0) {
          await LessonProgress.bulkCreate(progressData, { transaction });
          console.log(`   Created ${progressData.length} lesson progress records`);
        } else {
          console.log('   No lessons found - skipping lesson progress creation');
        }
      } else {
        console.log('⚠️  No lessons found - enrollments created but lesson progress skipped');
        console.log('   Run full seed to create lessons and progress');
      }
      
      await transaction.commit();
      
      console.log('✅ Enrollment seeding completed successfully!');
      console.log('');
      console.log('📊 Created:');
      console.log(`- ${enrollments.length} enrollments`);
      console.log('- Multiple lesson progress records');
      console.log('');
      console.log('📚 Enrollment Summary:');
      console.log('   Calculus: Alice (25%), Bob (50%)');
      console.log('   Web Development: Alice (67%), Carol (0%)');
      console.log('   Physics: Bob (0%)');
      
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
    
  } catch (error) {
    console.error('❌ Enrollment seeding failed:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run if called directly
if (require.main === module) {
  seedEnrollments();
}

module.exports = { seedEnrollments };

