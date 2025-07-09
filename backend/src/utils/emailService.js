// File: backend/src/utils/emailService.js
// Path: backend/src/utils/emailService.js

const nodemailer = require('nodemailer');
require('dotenv').config();

// ========================================
// EMAIL TRANSPORTER CONFIGURATION
// ========================================

const createTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    // Production email configuration
    return nodemailer.createTransporter({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // App password
      }
    });
  } else {
    // Development - use Ethereal Email for testing
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'verysecret'
      }
    });
  }
};

// ========================================
// EMAIL TEMPLATES
// ========================================

const emailTemplates = {
  // ✅ User Registration Welcome Email
  welcomeStudent: (user) => ({
    subject: '🎉 ยินดีต้อนรับสู่ LMS Platform!',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #4CAF50;">ยินดีต้อนรับ ${user.firstName} ${user.lastName}!</h2>
        <p>บัญชีนักเรียนของคุณได้รับการอนุมัติเรียบร้อยแล้ว</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
          <h3>ข้อมูลบัญชี:</h3>
          <p><strong>อีเมล:</strong> ${user.email}</p>
          <p><strong>สถานะ:</strong> Active</p>
        </div>
        <p>🚀 เริ่มต้นการเรียนรู้ได้เลย!</p>
        <a href="${process.env.FRONTEND_URL}/login" 
           style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
          เข้าสู่ระบบ
        </a>
      </div>
    `
  }),

  // ✅ Teacher Registration (Pending Approval)
  teacherPendingApproval: (user) => ({
    subject: '⏳ การสมัครครูผู้สอน - รอการอนุมัติ',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #FF9800;">สวัสดี ${user.firstName} ${user.lastName}</h2>
        <p>ขอบคุณที่สมัครเป็นครูผู้สอนกับเรา!</p>
        <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #FF9800;">
          <h3>🔍 สถานะ: รอการอนุมัติจากผู้ดูแลระบบ</h3>
          <p>เราจะตรวจสอบข้อมูลและอนุมัติบัญชีภายใน 24-48 ชั่วโมง</p>
        </div>
        <p>📧 คุณจะได้รับอีเมลแจ้งเตือนเมื่อบัญชีได้รับการอนุมัติ</p>
      </div>
    `
  }),

  // ✅ Teacher Approval Notification
  teacherApproved: (user) => ({
    subject: '🎉 บัญชีครูผู้สอนได้รับการอนุมัติแล้ว!',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #4CAF50;">ยินดีด้วย ${user.firstName}!</h2>
        <p>บัญชีครูผู้สอนของคุณได้รับการอนุมัติเรียบร้อยแล้ว! 🎊</p>
        <div style="background: #d4edda; padding: 20px; border-radius: 8px;">
          <h3>✅ คุณสามารถทำสิ่งต่อไปนี้ได้แล้ว:</h3>
          <ul>
            <li>📚 สร้างรายวิชาใหม่</li>
            <li>📖 เพิ่มบทเรียนและเนื้อหา</li>
            <li>🎯 สร้างแบบทดสอบ</li>
            <li>👥 อนุมัติการสมัครเรียนของนักเรียน</li>
          </ul>
        </div>
        <a href="${process.env.FRONTEND_URL}/teacher/dashboard" 
           style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
          เข้าสู่แดชบอร์ดครู
        </a>
      </div>
    `
  }),

  // ✅ Enrollment Request (to Teacher)
  enrollmentRequest: (enrollment, student, course) => ({
    subject: `📝 มีนักเรียนขอเข้าเรียน: ${course.title}`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #2196F3;">มีนักเรียนใหม่ขอเข้าเรียน!</h2>
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px;">
          <h3>👤 ข้อมูลนักเรียน:</h3>
          <p><strong>ชื่อ:</strong> ${student.firstName} ${student.lastName}</p>
          <p><strong>อีเมล:</strong> ${student.email}</p>
          <p><strong>วันที่สมัคร:</strong> ${new Date(enrollment.enrolledAt).toLocaleString('th-TH')}</p>
        </div>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-top: 15px;">
          <h3>📚 รายวิชา:</h3>
          <p><strong>${course.title}</strong></p>
          <p>${course.description}</p>
        </div>
        <p>👨‍🏫 กรุณาเข้าสู่ระบบเพื่ออนุมัติการเข้าเรียน</p>
        <a href="${process.env.FRONTEND_URL}/teacher/courses/${course.id}/students" 
           style="background: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
          จัดการนักเรียน
        </a>
      </div>
    `
  }),

  // ✅ Enrollment Approved (to Student)
  enrollmentApproved: (enrollment, course, teacher) => ({
    subject: `✅ คุณได้รับอนุมัติเข้าเรียน: ${course.title}`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #4CAF50;">ยินดีด้วย! 🎉</h2>
        <p>คุณได้รับอนุมัติให้เข้าเรียนแล้ว!</p>
        <div style="background: #d4edda; padding: 20px; border-radius: 8px;">
          <h3>📚 รายวิชา: ${course.title}</h3>
          <p>${course.description}</p>
          <p><strong>👨‍🏫 ครูผู้สอน:</strong> ${teacher.firstName} ${teacher.lastName}</p>
          <p><strong>✅ วันที่อนุมัติ:</strong> ${new Date().toLocaleString('th-TH')}</p>
        </div>
        <p>🚀 เริ่มเรียนได้เลย!</p>
        <a href="${process.env.FRONTEND_URL}/courses/${course.id}" 
           style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
          เข้าสู่บทเรียน
        </a>
      </div>
    `
  }),

  // ✅ New Lesson Published (to Students)
  newLessonPublished: (lesson, course) => ({
    subject: `📖 บทเรียนใหม่: ${lesson.title}`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #9C27B0;">มีบทเรียนใหม่แล้ว! 📚</h2>
        <div style="background: #f3e5f5; padding: 20px; border-radius: 8px;">
          <h3>📖 ${lesson.title}</h3>
          <p><strong>รายวิชา:</strong> ${course.title}</p>
          <p><strong>ประเภท:</strong> ${lesson.lessonType}</p>
          <p><strong>ระยะเวลาโดยประมาณ:</strong> ${lesson.estimatedTime} นาที</p>
          ${lesson.description ? `<p>${lesson.description}</p>` : ''}
        </div>
        <p>🎯 เริ่มเรียนเลย!</p>
        <a href="${process.env.FRONTEND_URL}/lessons/${lesson.id}" 
           style="background: #9C27B0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
          เริ่มบทเรียน
        </a>
      </div>
    `
  }),

  // ✅ Quiz Results (to Student)
  quizResults: (quiz, attempt, student) => ({
    subject: `📊 ผลการทำแบบทดสอบ: ${quiz.title}`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h2 style="color: #FF5722;">ผลการทำแบบทดสอบ 📊</h2>
        <div style="background: #fff3e0; padding: 20px; border-radius: 8px;">
          <h3>🎯 ${quiz.title}</h3>
          <div style="font-size: 24px; text-align: center; margin: 20px 0;">
            <span style="color: ${attempt.percentage >= quiz.passingScore ? '#4CAF50' : '#F44336'}; font-weight: bold;">
              ${attempt.percentage}%
            </span>
          </div>
          <p><strong>คะแนน:</strong> ${attempt.score}/${attempt.maxScore}</p>
          <p><strong>เวลาที่ใช้:</strong> ${Math.floor(attempt.timeSpent / 60)} นาที</p>
          <p><strong>สถานะ:</strong> 
            <span style="color: ${attempt.percentage >= quiz.passingScore ? '#4CAF50' : '#F44336'};">
              ${attempt.percentage >= quiz.passingScore ? '✅ ผ่าน' : '❌ ไม่ผ่าน'}
            </span>
          </p>
        </div>
        ${attempt.percentage < quiz.passingScore && attempt.attemptNumber < quiz.maxAttempts ? 
          `<p>💪 คุณสามารถทำแบบทดสอบใหม่ได้!</p>
           <a href="${process.env.FRONTEND_URL}/quizzes/${quiz.id}" 
              style="background: #FF5722; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
             ทำใหม่
           </a>` : ''
        }
      </div>
    `
  })
};

// ========================================
// EMAIL SENDING FUNCTIONS
// ========================================

class EmailService {
  constructor() {
    this.transporter = createTransporter();
  }

  async sendEmail(to, template) {
    try {
      const mailOptions = {
        from: `"LMS Platform" <${process.env.EMAIL_USER || 'noreply@lms.com'}>`,
        to,
        subject: template.subject,
        html: template.html
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`📧 Email sent to ${to}: ${template.subject}`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`📧 Preview URL: ${nodemailer.getTestMessageUrl(result)}`);
      }
      
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error(`❌ Email sending failed:`, error.message);
      return { success: false, error: error.message };
    }
  }

  // ========================================
  // NOTIFICATION TRIGGER FUNCTIONS
  // ========================================

  async sendWelcomeEmail(user) {
    const template = user.role === 'student' 
      ? emailTemplates.welcomeStudent(user)
      : emailTemplates.teacherPendingApproval(user);
    
    return this.sendEmail(user.email, template);
  }

  async sendTeacherApprovalEmail(user) {
    const template = emailTemplates.teacherApproved(user);
    return this.sendEmail(user.email, template);
  }

  async sendEnrollmentRequestEmail(teacher, enrollment, student, course) {
    const template = emailTemplates.enrollmentRequest(enrollment, student, course);
    return this.sendEmail(teacher.email, template);
  }

  async sendEnrollmentApprovedEmail(student, enrollment, course, teacher) {
    const template = emailTemplates.enrollmentApproved(enrollment, course, teacher);
    return this.sendEmail(student.email, template);
  }

  async sendNewLessonEmail(students, lesson, course) {
    const template = emailTemplates.newLessonPublished(lesson, course);
    
    const results = await Promise.allSettled(
      students.map(student => this.sendEmail(student.email, template))
    );
    
    return {
      sent: results.filter(r => r.status === 'fulfilled' && r.value.success).length,
      failed: results.filter(r => r.status === 'rejected' || !r.value.success).length,
      total: students.length
    };
  }

  async sendQuizResultsEmail(student, quiz, attempt) {
    const template = emailTemplates.quizResults(quiz, attempt, student);
    return this.sendEmail(student.email, template);
  }
}

// ========================================
// EXPORT & HELPER FUNCTIONS
// ========================================

const emailService = new EmailService();

// Helper function to integrate with Socket.IO notifications
const sendNotificationWithEmail = async (userId, notificationType, data) => {
  try {
    // Send real-time notification via Socket.IO
    const io = require('../app').get('io');
    if (io) {
      io.to(`user-${userId}`).emit('notification', {
        type: notificationType,
        data,
        timestamp: new Date()
      });
    }

    // Send email notification based on type
    switch (notificationType) {
      case 'enrollment_request':
        return emailService.sendEnrollmentRequestEmail(
          data.teacher, data.enrollment, data.student, data.course
        );
      case 'enrollment_approved':
        return emailService.sendEnrollmentApprovedEmail(
          data.student, data.enrollment, data.course, data.teacher
        );
      case 'new_lesson':
        return emailService.sendNewLessonEmail(
          data.students, data.lesson, data.course
        );
      case 'quiz_results':
        return emailService.sendQuizResultsEmail(
          data.student, data.quiz, data.attempt
        );
      default:
        console.log(`📧 No email template for notification type: ${notificationType}`);
        return { success: true, message: 'No email template' };
    }
  } catch (error) {
    console.error('❌ Notification sending failed:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  emailService,
  emailTemplates,
  sendNotificationWithEmail
};