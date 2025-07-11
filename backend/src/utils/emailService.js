// File: backend/src/utils/emailService.js
// Path: backend/src/utils/emailService.js

const nodemailer = require('nodemailer');
require('dotenv').config();

// ========================================
// EMAIL TRANSPORTER CONFIGURATION
// ========================================

const createTransporter = () => {
  try {
    if (process.env.NODE_ENV === 'production') {
      // Production email configuration
      return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    } else {
      // Development - use Gmail for testing
      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
    }
  } catch (error) {
    console.error('❌ Email transporter creation failed:', error.message);
    return null;
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
        <div style="background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">ยินดีต้อนรับ! 🎉</h1>
        </div>
        <div style="padding: 20px; background: white; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333;">สวัสดี ${user.firstName} ${user.lastName}!</h2>
          <p style="color: #666; line-height: 1.6;">บัญชีนักเรียนของคุณได้รับการสร้างเรียบร้อยแล้ว</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">ข้อมูลบัญชี:</h3>
            <p style="margin: 5px 0;"><strong>อีเมล:</strong> ${user.email}</p>
            <p style="margin: 5px 0;"><strong>สถานะ:</strong> <span style="color: #4CAF50;">Active</span></p>
            <p style="margin: 5px 0;"><strong>วันที่สมัคร:</strong> ${new Date().toLocaleDateString('th-TH')}</p>
          </div>
          <p style="color: #666;">🚀 พร้อมเริ่มต้นการเรียนรู้แล้ว!</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
               style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              เข้าสู่ระบบ
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 14px; text-align: center;">
            ขอบคุณที่เลือกใช้ LMS Platform<br>
            หากมีคำถามสามารถติดต่อทีมสนับสนุนได้ที่ ${process.env.SUPPORT_EMAIL || 'support@lms.com'}
          </p>
        </div>
      </div>
    `
  }),

  // ✅ Teacher Registration (Pending Approval)
  teacherPendingApproval: (user) => ({
    subject: '⏳ การสมัครครูผู้สอน - รอการอนุมัติ',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: #FF9800; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">รอการอนุมัติ ⏳</h1>
        </div>
        <div style="padding: 20px; background: white; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333;">สวัสดี ${user.firstName} ${user.lastName}</h2>
          <p style="color: #666; line-height: 1.6;">ขอบคุณที่สมัครเป็นครูผู้สอนกับเรา!</p>
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #FF9800; margin: 20px 0;">
            <h3 style="color: #856404; margin-top: 0;">🔍 สถานะ: รอการอนุมัติจากผู้ดูแลระบบ</h3>
            <p style="color: #856404; margin: 5px 0;">เราจะตรวจสอบข้อมูลและอนุมัติบัญชีภายใน 24-48 ชั่วโมง</p>
          </div>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">ข้อมูลการสมัคร:</h3>
            <p style="margin: 5px 0;"><strong>อีเมล:</strong> ${user.email}</p>
            <p style="margin: 5px 0;"><strong>ชื่อ-นามสกุล:</strong> ${user.firstName} ${user.lastName}</p>
            <p style="margin: 5px 0;"><strong>วันที่สมัคร:</strong> ${new Date().toLocaleDateString('th-TH')}</p>
          </div>
          <p style="color: #666;">📧 คุณจะได้รับอีเมลแจ้งเตือนเมื่อบัญชีได้รับการอนุมัติ</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 14px; text-align: center;">
            ขอบคุณที่เลือกใช้ LMS Platform<br>
            หากมีคำถามสามารถติดต่อทีมสนับสนุนได้ที่ ${process.env.SUPPORT_EMAIL || 'support@lms.com'}
          </p>
        </div>
      </div>
    `
  }),

  // ✅ Password Reset Email
  passwordReset: (user, resetToken) => ({
    subject: '🔒 รีเซ็ตรหัสผ่าน - LMS Platform',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: #2196F3; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">รีเซ็ตรหัสผ่าน 🔒</h1>
        </div>
        <div style="padding: 20px; background: white; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333;">สวัสดี ${user.firstName} ${user.lastName}</h2>
          <p style="color: #666; line-height: 1.6;">เราได้รับคำขอรีเซ็ตรหัสผ่านสำหรับบัญชีของคุณ</p>
          <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196F3; margin: 20px 0;">
            <h3 style="color: #1976d2; margin-top: 0;">⏰ ลิงก์นี้จะหมดอายุใน 10 นาที</h3>
            <p style="color: #1976d2; margin: 5px 0;">หากคุณไม่ได้เป็นผู้ขอรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยต่ออีเมลนี้</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}" 
               style="background: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              รีเซ็ตรหัสผ่าน
            </a>
          </div>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #666; margin: 0; font-size: 14px;">
              <strong>หากปุ่มด้านบนไม่ทำงาน</strong> คัดลอกลิงก์นี้และวางในเบราว์เซอร์:<br>
              <code style="background: #eee; padding: 2px 6px; border-radius: 3px; font-size: 12px;">
                ${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}
              </code>
            </p>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 14px; text-align: center;">
            ขอบคุณที่เลือกใช้ LMS Platform<br>
            หากมีคำถามสามารถติดต่อทีมสนับสนุนได้ที่ ${process.env.SUPPORT_EMAIL || 'support@lms.com'}
          </p>
        </div>
      </div>
    `
  }),

  // ✅ Teacher Approval Notification
  teacherApproved: (user) => ({
    subject: '🎉 บัญชีครูผู้สอนได้รับการอนุมัติแล้ว!',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">ยินดีด้วย! 🎉</h1>
        </div>
        <div style="padding: 20px; background: white; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333;">สวัสดี ${user.firstName} ${user.lastName}</h2>
          <p style="color: #666; line-height: 1.6;">บัญชีครูผู้สอนของคุณได้รับการอนุมัติเรียบร้อยแล้ว!</p>
          <div style="background: #d4edda; padding: 20px; border-radius: 8px; border-left: 4px solid #4CAF50; margin: 20px 0;">
            <h3 style="color: #155724; margin-top: 0;">✅ สถานะ: อนุมัติแล้ว</h3>
            <p style="color: #155724; margin: 5px 0;">คุณสามารถเข้าสู่ระบบและเริ่มสอนได้ทันที</p>
          </div>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">สิทธิ์ที่คุณได้รับ:</h3>
            <ul style="color: #666; margin: 0; padding-left: 20px;">
              <li>สร้างและจัดการรายวิชา</li>
              <li>สร้างบทเรียนและแบบทดสอบ</li>
              <li>อนุมัตินักเรียนเข้าเรียน</li>
              <li>ดูและวิเคราะห์ผลการเรียน</li>
              <li>ติดต่อกับนักเรียน</li>
            </ul>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
               style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              เข้าสู่ระบบ
            </a>
          </div>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 14px; text-align: center;">
            ขอบคุณที่เลือกใช้ LMS Platform<br>
            หากมีคำถามสามารถติดต่อทีมสนับสนุนได้ที่ ${process.env.SUPPORT_EMAIL || 'support@lms.com'}
          </p>
        </div>
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
      // Check if transporter is available
      if (!this.transporter) {
        console.warn('⚠️ Email transporter not available - skipping email send');
        return { success: false, error: 'Email transporter not available' };
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || `"LMS Platform" <${process.env.EMAIL_USER || 'noreply@lms.com'}>`,
        to,
        subject: template.subject,
        html: template.html
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ Email sent successfully to ${to}: ${template.subject}`);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`📧 Email preview URL: ${nodemailer.getTestMessageUrl(result)}`);
      }
      
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error(`❌ Email sending failed to ${to}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  // ========================================
  // NOTIFICATION TRIGGER FUNCTIONS
  // ========================================

  async sendWelcomeEmail(user) {
    try {
      const template = user.role === 'student' 
        ? emailTemplates.welcomeStudent(user)
        : emailTemplates.teacherPendingApproval(user);
      
      return await this.sendEmail(user.email, template);
    } catch (error) {
      console.error('❌ Welcome email failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async sendTeacherApprovalEmail(user) {
    try {
      const template = emailTemplates.teacherApproved(user);
      return await this.sendEmail(user.email, template);
    } catch (error) {
      console.error('❌ Teacher approval email failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async sendPasswordResetEmail(user, resetToken) {
    try {
      const template = emailTemplates.passwordReset(user, resetToken);
      return await this.sendEmail(user.email, template);
    } catch (error) {
      console.error('❌ Password reset email failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async sendEnrollmentRequestEmail(teacher, enrollment, student, course) {
    try {
      const template = {
        subject: `🎓 มีนักเรียนใหม่ขอเข้าเรียน: ${course.title}`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <h2 style="color: #333;">มีนักเรียนขอเข้าเรียน</h2>
            <p>นักเรียน: ${student.firstName} ${student.lastName}</p>
            <p>รายวิชา: ${course.title}</p>
            <p>วันที่สมัคร: ${new Date(enrollment.createdAt).toLocaleDateString('th-TH')}</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/teacher/enrollments" 
               style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              ตรวจสอบและอนุมัติ
            </a>
          </div>
        `
      };
      
      return await this.sendEmail(teacher.email, template);
    } catch (error) {
      console.error('❌ Enrollment request email failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async sendEnrollmentApprovedEmail(student, enrollment, course, teacher) {
    try {
      const template = {
        subject: `✅ คุณได้รับการอนุมัติเข้าเรียน: ${course.title}`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <h2 style="color: #4CAF50;">การลงทะเบียนเรียนได้รับการอนุมัติ!</h2>
            <p>รายวิชา: ${course.title}</p>
            <p>ครูผู้สอน: ${teacher.firstName} ${teacher.lastName}</p>
            <p>วันที่อนุมัติ: ${new Date().toLocaleDateString('th-TH')}</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/courses/${course.id}" 
               style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              เข้าเรียน
            </a>
          </div>
        `
      };
      
      return await this.sendEmail(student.email, template);
    } catch (error) {
      console.error('❌ Enrollment approved email failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async sendNewLessonEmail(students, lesson, course) {
    try {
      const template = {
        subject: `📚 บทเรียนใหม่: ${lesson.title}`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <h2 style="color: #333;">บทเรียนใหม่พร้อมแล้ว!</h2>
            <p>รายวิชา: ${course.title}</p>
            <p>บทเรียน: ${lesson.title}</p>
            <p>เวลาโดยประมาณ: ${lesson.estimatedTime} นาที</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/lessons/${lesson.id}" 
               style="background: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              เริ่มเรียน
            </a>
          </div>
        `
      };
      
      const results = await Promise.allSettled(
        students.map(student => this.sendEmail(student.email, template))
      );
      
      return {
        sent: results.filter(r => r.status === 'fulfilled' && r.value.success).length,
        failed: results.filter(r => r.status === 'rejected' || !r.value.success).length,
        total: students.length
      };
    } catch (error) {
      console.error('❌ New lesson email failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async sendQuizResultsEmail(student, quiz, attempt) {
    try {
      const template = {
        subject: `📊 ผลแบบทดสอบ: ${quiz.title}`,
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <h2 style="color: #333;">ผลแบบทดสอบ</h2>
            <p>แบบทดสอบ: ${quiz.title}</p>
            <p>คะแนน: ${attempt.score}/${quiz.maxScore} (${attempt.percentage}%)</p>
            <p>สถานะ: ${attempt.percentage >= quiz.passingScore ? '✅ ผ่าน' : '❌ ไม่ผ่าน'}</p>
            <p>วันที่ทำ: ${new Date(attempt.submittedAt).toLocaleDateString('th-TH')}</p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/quiz-results/${attempt.id}" 
               style="background: #FF9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              ดูผลรายละเอียด
            </a>
          </div>
        `
      };
      
      return await this.sendEmail(student.email, template);
    } catch (error) {
      console.error('❌ Quiz results email failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // ========================================
  // UTILITY FUNCTIONS
  // ========================================

  async testEmailConnection() {
    try {
      if (!this.transporter) {
        return { success: false, error: 'Email transporter not available' };
      }

      await this.transporter.verify();
      console.log('✅ Email connection test successful');
      return { success: true, message: 'Email connection successful' };
    } catch (error) {
      console.error('❌ Email connection test failed:', error.message);
      return { success: false, error: error.message };
    }
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
        return await emailService.sendEnrollmentRequestEmail(
          data.teacher, data.enrollment, data.student, data.course
        );
      case 'enrollment_approved':
        return await emailService.sendEnrollmentApprovedEmail(
          data.student, data.enrollment, data.course, data.teacher
        );
      case 'new_lesson':
        return await emailService.sendNewLessonEmail(
          data.students, data.lesson, data.course
        );
      case 'quiz_results':
        return await emailService.sendQuizResultsEmail(
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