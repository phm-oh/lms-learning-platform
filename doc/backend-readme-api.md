
Update process
ตอนนี้ได้ API. มาแบบนี้
# LMS Backend API Summary - Part 1: Overview & Authentication
**File: backend-summary-part1-overview-auth.md**  
**Path: /docs/backend-summary-part1-overview-auth.md**

## 📋 Project Overview

**Technology Stack:**
- **Backend Framework:** Express.js 4.18.2
- **Database:** PostgreSQL with Sequelize ORM 6.32.1
- **Authentication:** JWT (jsonwebtoken 9.0.1) + bcryptjs 2.4.3
- **File Upload:** Multer 1.4.5 + Sharp 0.32.6 (image processing)
- **Email:** Nodemailer 6.9.4
- **Real-time:** Socket.io 4.7.2
- **Validation:** Joi 17.9.2 + express-validator 7.0.1
- **Security:** Helmet 7.0.0 + CORS 2.8.5 + Rate Limiting
- **File Processing:** CSV-parser 3.0.0, XLSX 0.18.5, PDF-lib 1.17.1
- **Caching:** Redis 4.6.7
- **Logging:** Winston 3.10.0 + Morgan 1.10.0

**Total API Endpoints:** 80+ endpoints
**Server Port:** 5000 (configurable via ENV)
**Base URL:** `http://localhost:5000/api`

---

## 🏗️ System Architecture

### Database Models (PostgreSQL + Sequelize)
```javascript
// Core Models with Associations
- User (นักเรียน, ครู, admin)
- Course (รายวิชา)
- CourseCategory (หมวดหมู่วิชา)
- Enrollment (การลงทะเบียนเรียน)
- Lesson (บทเรียน)
- LessonProgress (ความคืบหน้าการเรียน)
- Quiz (แบบทดสอบ)
- QuizQuestion (คำถาม)
- QuizAttempt (การทำแบบทดสอบ)
- QuizResponse (คำตอบแต่ละข้อ)
- Notification (การแจ้งเตือน)
- UserActivity (กิจกรรมผู้ใช้)
- LearningAnalytics (การวิเคราะห์การเรียน)
```

### User Roles & Permissions
```javascript
// User Roles
- student: นักเรียน (สมัครเข้ามาใหม่ = active อัตโนมัติ)
- teacher: ครูผู้สอน (สมัครเข้ามาใหม่ = pending รอ admin อนุมัติ)
- admin: ผู้ดูแลระบบ

// Permission Levels
- Public: ดู course list, course details
- Student: ลงทะเบียนเรียน, ทำแบบทดสอบ, ดูผลคะแนน
- Teacher: สร้าง/แก้ไข course, lesson, quiz ของตัวเอง, อนุมัตินักเรียน
- Admin: จัดการทุกอย่างในระบบ
```

---

## 🔐 Authentication System (9 endpoints)

### Base URL: `/api/auth`

### 1. **POST** `/api/auth/register` - สมัครสมาชิก
**Access:** Public  
**Rate Limit:** 5 requests/15 minutes

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "firstName": "ชื่อ",
  "lastName": "นามสกุล", 
  "role": "student", // หรือ "teacher"
  "phone": "0812345678", // optional
  "dateOfBirth": "1995-05-15", // optional
  "profilePhoto": "url" // optional
}
```

**Response Success (201):**
```json
{
  "success": true,
  "message": "ลงทะเบียนสำเร็จ",
  "data": {
    "user": {
      "id": 1,
      "email": "student@example.com",
      "firstName": "ชื่อ",
      "lastName": "นามสกุล",
      "role": "student",
      "status": "active", // student = active, teacher = pending
      "profilePhoto": null,
      "createdAt": "2025-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here"
  }
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "ข้อมูลไม่ถูกต้อง",
  "errors": [
    {
      "field": "email",
      "message": "อีเมลนี้มีผู้ใช้แล้ว"
    }
  ]
}
```

---

### 2. **POST** `/api/auth/login` - เข้าสู่ระบบ
**Access:** Public  
**Rate Limit:** 5 requests/15 minutes

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "password123"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "เข้าสู่ระบบสำเร็จ",
  "data": {
    "user": {
      "id": 1,
      "email": "student@example.com",
      "firstName": "ชื่อ",
      "lastName": "นามสกุล",
      "role": "student",
      "status": "active",
      "profilePhoto": "/uploads/profiles/user_1_photo.jpg",
      "lastLoginAt": "2025-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here",
    "expiresIn": "24h"
  }
}
```

---

### 3. **GET** `/api/auth/profile` - ดูข้อมูลโปรไฟล์
**Access:** Private (ต้อง login)  
**Headers:** `Authorization: Bearer <token>`

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "student@example.com",
      "firstName": "ชื่อ",
      "lastName": "นามสกุล",
      "role": "student",
      "status": "active",
      "profilePhoto": "/uploads/profiles/user_1_photo.jpg",
      "phone": "0812345678",
      "dateOfBirth": "1995-05-15",
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z",
      "stats": {
        "totalCourses": 3,
        "completedCourses": 1,
        "totalQuizzesTaken": 15,
        "averageScore": 78.5
      }
    }
  }
}
```

---

### 4. **PATCH** `/api/auth/profile` - แก้ไขข้อมูลโปรไฟล์
**Access:** Private  
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "firstName": "ชื่อใหม่",
  "lastName": "นามสกุลใหม่",
  "phone": "0898765432",
  "dateOfBirth": "1995-05-15"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "อัปเดตข้อมูลสำเร็จ",
  "data": {
    "user": {
      // updated user data
    }
  }
}
```

---

### 5. **POST** `/api/auth/profile/photo` - อัปโหลดรูปโปรไฟล์
**Access:** Private  
**Headers:** `Authorization: Bearer <token>`  
**Content-Type:** `multipart/form-data`

**Request Body (FormData):**
```javascript
// FormData
photo: File (jpg, png, webp max 5MB)
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "อัปโหลดรูปโปรไฟล์สำเร็จ",
  "data": {
    "profilePhoto": "/uploads/profiles/user_1_photo_400x400.jpg",
    "thumbnail": "/uploads/profiles/thumbnails/user_1_thumb_100x100.jpg",
    "originalSize": "2.3MB",
    "processedSize": "456KB"
  }
}
```

---

### 6. **DELETE** `/api/auth/profile/photo` - ลบรูปโปรไฟล์
**Access:** Private  
**Headers:** `Authorization: Bearer <token>`

**Response Success (200):**
```json
{
  "success": true,
  "message": "ลบรูปโปรไฟล์สำเร็จ",
  "data": {
    "profilePhoto": null
  }
}
```

---

### 7. **PATCH** `/api/auth/change-password` - เปลี่ยนรหัสผ่าน
**Access:** Private  
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456",
  "confirmPassword": "newpassword456"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "เปลี่ยนรหัสผ่านสำเร็จ"
}
```

---

### 8. **POST** `/api/auth/forgot-password` - ขอรีเซ็ตรหัสผ่าน
**Access:** Public  
**Rate Limit:** 3 requests/hour

**Request Body:**
```json
{
  "email": "student@example.com"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลแล้ว"
}
```

---

### 9. **PATCH** `/api/auth/reset-password/:token` - รีเซ็ตรหัสผ่าน
**Access:** Public  
**Rate Limit:** 3 requests/hour

**Request Body:**
```json
{
  "password": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "รีเซ็ตรหัสผ่านสำเร็จ",
  "data": {
    "user": {
      // user data
    },
    "token": "new_jwt_token"
  }
}
```

---

## 🔒 Authorization Middleware

**JWT Token Format:**
```javascript
// Headers
Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

// Token Payload
{
  "id": 1,
  "email": "user@example.com", 
  "role": "student",
  "status": "active",
  "iat": 1642680000,
  "exp": 1642766400
}
```

**Protection Levels:**
- `authenticate`: ต้อง login
- `authorize(['student'])`: ต้องเป็น student
- `authorize(['teacher', 'admin'])`: ต้องเป็น teacher หรือ admin
- `authorize(['admin'])`: ต้องเป็น admin เท่านั้น

---

## 📧 Email Notification System

**Email Events:**
- ✅ User registration (ยืนยันอีเมล)
- ✅ Teacher account pending approval (แจ้ง admin)
- ✅ Teacher account approved/rejected
- ✅ Student enrollment request (แจ้งครู)
- ✅ Enrollment approved/rejected (แจ้งนักเรียน)
- ✅ New lesson published (แจ้งนักเรียนที่ลงทะเบียน)
- ✅ Quiz assigned (แจ้งนักเรียน)
- ✅ Quiz graded (แจ้งนักเรียน)

**Email Templates:**
- HTML templates พร้อม responsive design
- Support Thai language
- Include action buttons และ links

---

## 🛡️ Security Features

**Rate Limiting:**
- Authentication: 5 req/15min
- Password reset: 3 req/hour
- File upload: 20 req/15min
- Heavy uploads: 5 req/hour

**Data Validation:**
- Joi schemas สำหรับ request validation
- Express-validator สำหรับ additional checks
- File type validation
- File size limits

**Security Headers:**
- Helmet.js configuration
- CORS policy
- XSS protection
- SQL injection prevention

# LMS Backend API Summary - Part 2: Course, Lesson & Quiz Management
**File: backend-summary-part2-course-lesson-quiz.md**  
**Path: /docs/backend-summary-part2-course-lesson-quiz.md**

---

## 📚 Course Management System (12 endpoints)

### Base URL: `/api/courses`

### 1. **GET** `/api/courses` - ดูรายการวิชาทั้งหมด
**Access:** Public (แสดงเฉพาะ published courses)

**Query Parameters:**
```javascript
?page=1&limit=10&category=1&search=javascript&teacher=5&level=beginner
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": 1,
        "title": "JavaScript Fundamentals",
        "description": "เรียนรู้ JavaScript เบื้องต้น",
        "thumbnail": "/uploads/courses/course_1_thumb.jpg",
        "level": "beginner",
        "estimatedHours": 40,
        "price": 1500.00,
        "enrollmentCount": 125,
        "rating": 4.8,
        "isPublished": true,
        "createdAt": "2024-12-01T10:00:00.000Z",
        "teacher": {
          "id": 5,
          "firstName": "อาจารย์",
          "lastName": "สมชาย",
          "profilePhoto": "/uploads/profiles/teacher_5.jpg"
        },
        "category": {
          "id": 1,
          "name": "Programming",
          "color": "#007bff",
          "icon": "code"
        },
        "stats": {
          "totalLessons": 20,
          "totalQuizzes": 5,
          "completionRate": 78.5
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCourses": 48,
      "hasNext": true,
      "hasPrev": false
    },
    "filters": {
      "categories": [
        {"id": 1, "name": "Programming", "count": 15},
        {"id": 2, "name": "Design", "count": 12}
      ],
      "levels": [
        {"value": "beginner", "count": 20},
        {"value": "intermediate", "count": 18},
        {"value": "advanced", "count": 10}
      ]
    }
  }
}
```

---

### 2. **GET** `/api/courses/:id` - ดูรายละเอียดวิชา
**Access:** Public

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "course": {
      "id": 1,
      "title": "JavaScript Fundamentals",
      "description": "เรียนรู้ JavaScript เบื้องต้นตั้งแต่พื้นฐานจนถึงขั้นสูง",
      "content": "<p>Rich text content...</p>",
      "thumbnail": "/uploads/courses/course_1_thumb.jpg",
      "level": "beginner",
      "estimatedHours": 40,
      "price": 1500.00,
      "requirements": ["รู้ HTML/CSS เบื้องต้น", "มี computer"],
      "learningOutcomes": ["เข้าใจ JavaScript syntax", "สามารถเขียน basic programs"],
      "enrollmentCount": 125,
      "rating": 4.8,
      "isPublished": true,
      "createdAt": "2024-12-01T10:00:00.000Z",
      "teacher": {
        "id": 5,
        "firstName": "อาจารย์",
        "lastName": "สมชาย",
        "email": "teacher@example.com",
        "profilePhoto": "/uploads/profiles/teacher_5.jpg",
        "bio": "มีประสบการณ์สอน JavaScript 10 ปี",
        "stats": {
          "totalCourses": 8,
          "totalStudents": 1250,
          "averageRating": 4.7
        }
      },
      "category": {
        "id": 1,
        "name": "Programming",
        "color": "#007bff",
        "icon": "code"
      },
      "lessons": [
        {
          "id": 1,
          "title": "Introduction to JavaScript",
          "duration": 15,
          "lessonType": "video",
          "orderIndex": 1,
          "isRequired": true,
          "isPublished": true
        }
      ],
      "quizzes": [
        {
          "id": 1,
          "title": "JavaScript Basics Quiz",
          "questionCount": 10,
          "timeLimit": 30,
          "passingScore": 70
        }
      ],
      "enrollmentStatus": null, // หรือ "pending", "approved", "rejected"
      "progress": null // สำหรับ enrolled students
    }
  }
}
```

---

### 3. **POST** `/api/courses` - สร้างวิชาใหม่
**Access:** Teacher/Admin  
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "React for Beginners",
  "description": "เรียนรู้ React framework เบื้องต้น",
  "content": "<p>Rich text content...</p>",
  "categoryId": 1,
  "level": "beginner", // "beginner", "intermediate", "advanced"
  "estimatedHours": 30,
  "price": 2000.00,
  "requirements": ["รู้ JavaScript เบื้องต้น"],
  "learningOutcomes": ["เข้าใจ React concepts", "สร้าง React app ได้"]
}
```

**Response Success (201):**
```json
{
  "success": true,
  "message": "สร้างรายวิชาสำเร็จ",
  "data": {
    "course": {
      "id": 25,
      "title": "React for Beginners",
      // ... course data
      "isPublished": false,
      "teacherId": 5
    }
  }
}
```

---

### 4. **PUT** `/api/courses/:id` - แก้ไขวิชา
**Access:** Teacher (เฉพาะวิชาของตัวเอง) / Admin  
**Headers:** `Authorization: Bearer <token>`

**Request Body:** เหมือนกับ POST

**Response Success (200):**
```json
{
  "success": true,
  "message": "อัปเดตรายวิชาสำเร็จ",
  "data": {
    "course": {
      // updated course data
    }
  }
}
```

---

### 5. **POST** `/api/courses/:id/thumbnail` - อัปโหลด thumbnail วิชา
**Access:** Teacher (เฉพาะวิชาของตัวเอง) / Admin  
**Headers:** `Authorization: Bearer <token>`  
**Content-Type:** `multipart/form-data`

**Request Body (FormData):**
```javascript
thumbnail: File (jpg, png, webp max 10MB)
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "อัปโหลด thumbnail สำเร็จ",
  "data": {
    "thumbnail": "/uploads/courses/course_1_thumb_800x450.jpg",
    "thumbnailSmall": "/uploads/courses/course_1_thumb_400x225.jpg",
    "originalSize": "5.2MB",
    "processedSize": "890KB"
  }
}
```

---

### 6. **PATCH** `/api/courses/:id/publish` - เผยแพร่/ยกเลิกเผยแพร่วิชา
**Access:** Teacher (เฉพาะวิชาของตัวเอง) / Admin  
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "isPublished": true
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "เผยแพร่รายวิชาสำเร็จ",
  "data": {
    "course": {
      "id": 1,
      "isPublished": true,
      "publishedAt": "2025-01-15T14:30:00.000Z"
    }
  }
}
```

---

### 7. **POST** `/api/courses/:id/enroll` - ลงทะเบียนเรียน
**Access:** Student  
**Headers:** `Authorization: Bearer <token>`

**Response Success (200):**
```json
{
  "success": true,
  "message": "ส่งคำขอลงทะเบียนเรียนสำเร็จ รอการอนุมัติจากครูผู้สอน",
  "data": {
    "enrollment": {
      "id": 15,
      "courseId": 1,
      "studentId": 10,
      "status": "pending", // "pending", "approved", "rejected"
      "requestedAt": "2025-01-15T14:30:00.000Z"
    }
  }
}
```

---

### 8. **GET** `/api/courses/:id/students` - ดูรายชื่อนักเรียน
**Access:** Teacher (เฉพาะวิชาของตัวเอง) / Admin  
**Headers:** `Authorization: Bearer <token>`

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "students": [
      {
        "enrollment": {
          "id": 15,
          "status": "approved",
          "enrolledAt": "2025-01-10T09:00:00.000Z",
          "progress": 45.5,
          "lastAccessed": "2025-01-15T08:30:00.000Z"
        },
        "student": {
          "id": 10,
          "firstName": "นาย",
          "lastName": "สมศักดิ์",
          "email": "student@example.com",
          "profilePhoto": "/uploads/profiles/student_10.jpg"
        },
        "stats": {
          "completedLessons": 9,
          "totalLessons": 20,
          "quizzesTaken": 3,
          "averageQuizScore": 78.5
        }
      }
    ],
    "summary": {
      "totalEnrolled": 125,
      "pendingApproval": 5,
      "activeStudents": 98,
      "completionRate": 67.8
    }
  }
}
```

---

### 9. **PUT** `/api/courses/:id/students/:studentId` - อนุมัติ/ปฏิเสธนักเรียน
**Access:** Teacher (เฉพาะวิชาของตัวเอง) / Admin  
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "approved", // "approved" หรือ "rejected"
  "reason": "เหตุผล (optional สำหรับ rejected)"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "อนุมัตินักเรียนสำเร็จ",
  "data": {
    "enrollment": {
      "id": 15,
      "status": "approved",
      "approvedAt": "2025-01-15T14:30:00.000Z",
      "approvedBy": 5
    }
  }
}
```

---

## 📖 Lesson Management System (14 endpoints)

### Base URL: `/api/lessons`

### 1. **GET** `/api/lessons/course/:courseId` - ดูบทเรียนในวิชา
**Access:** Public (เฉพาะ published lessons) / Enrolled students (ทุก lesson)

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "lessons": [
      {
        "id": 1,
        "title": "Introduction to JavaScript",
        "description": "แนะนำ JavaScript เบื้องต้น",
        "lessonType": "video", // "video", "text", "document", "quiz"
        "videoUrl": "https://youtube.com/watch?v=xxx",
        "videoDuration": 900, // seconds
        "estimatedTime": 15, // minutes
        "orderIndex": 1,
        "isRequired": true,
        "isPublished": true,
        "createdAt": "2024-12-01T10:00:00.000Z",
        "progress": { // เฉพาะ enrolled students
          "status": "completed", // "not_started", "in_progress", "completed"
          "completionPercentage": 100,
          "timeSpent": 850,
          "lastAccessed": "2025-01-15T08:30:00.000Z"
        }
      }
    ],
    "summary": {
      "totalLessons": 20,
      "completedLessons": 8,
      "totalEstimatedTime": 300,
      "progressPercentage": 40.0
    }
  }
}
```

---

### 2. **GET** `/api/lessons/:id` - ดูรายละเอียดบทเรียน
**Access:** Enrolled students / Teacher / Admin

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "lesson": {
      "id": 1,
      "title": "Introduction to JavaScript",
      "description": "แนะนำ JavaScript เบื้องต้น",
      "content": "<p>Rich text content with code examples...</p>",
      "lessonType": "video",
      "videoUrl": "https://youtube.com/watch?v=xxx",
      "videoDuration": 900,
      "videoAttachments": [
        {
          "type": "subtitle",
          "url": "/uploads/lessons/lesson_1_subtitle.vtt",
          "language": "th"
        }
      ],
      "fileAttachments": [
        {
          "id": 1,
          "fileName": "javascript-cheatsheet.pdf",
          "fileUrl": "/uploads/lessons/attachments/lesson_1_cheatsheet.pdf",
          "fileSize": "2.5MB",
          "fileType": "application/pdf",
          "downloadCount": 245
        }
      ],
      "estimatedTime": 15,
      "orderIndex": 1,
      "isRequired": true,
      "prerequisites": [2, 3], // lesson IDs
      "course": {
        "id": 1,
        "title": "JavaScript Fundamentals",
        "teacherId": 5
      },
      "progress": {
        "status": "in_progress",
        "completionPercentage": 65,
        "timeSpent": 540,
        "lastAccessed": "2025-01-15T08:30:00.000Z",
        "notes": "บันทึกของนักเรียน"
      }
    }
  }
}
```

---

### 3. **POST** `/api/lessons` - สร้างบทเรียนใหม่
**Access:** Teacher / Admin  
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "courseId": 1,
  "title": "Variables and Data Types",
  "description": "เรียนรู้เกี่ยวกับตัวแปรและชนิดข้อมูล",
  "content": "<p>Rich text content...</p>",
  "lessonType": "video",
  "videoUrl": "https://youtube.com/watch?v=xxx",
  "videoDuration": 1200,
  "estimatedTime": 20,
  "orderIndex": 2,
  "isRequired": true,
  "prerequisites": [1]
}
```

**Response Success (201):**
```json
{
  "success": true,
  "message": "สร้างบทเรียนสำเร็จ",
  "data": {
    "lesson": {
      "id": 25,
      // ... lesson data
      "isPublished": false
    }
  }
}
```

---

### 4. **POST** `/api/lessons/:id/video` - อัปโหลดวิดีโอบทเรียน
**Access:** Teacher (เฉพาะบทเรียนของตัวเอง) / Admin  
**Content-Type:** `multipart/form-data`

**Request Body (FormData):**
```javascript
video: File (mp4, webm, mov max 500MB)
subtitle: File (vtt, srt optional)
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "อัปโหลดวิดีโอสำเร็จ",
  "data": {
    "videoUrl": "/uploads/lessons/videos/lesson_1_video.mp4",
    "videoDuration": 1205,
    "videoSize": "245MB",
    "subtitleUrl": "/uploads/lessons/subtitles/lesson_1_subtitle.vtt",
    "processingStatus": "completed" // "uploading", "processing", "completed", "failed"
  }
}
```

---

### 5. **POST** `/api/lessons/:id/attachments` - อัปโหลดไฟล์แนบ
**Access:** Teacher (เฉพาะบทเรียนของตัวเอง) / Admin  
**Content-Type:** `multipart/form-data`

**Request Body (FormData):**
```javascript
attachments: Files[] (pdf, doc, ppt, zip max 50MB per file)
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "อัปโหลดไฟล์แนบสำเร็จ",
  "data": {
    "attachments": [
      {
        "id": 15,
        "fileName": "javascript-examples.zip",
        "fileUrl": "/uploads/lessons/attachments/lesson_1_examples.zip",
        "fileSize": "12.5MB",
        "fileType": "application/zip",
        "uploadedAt": "2025-01-15T14:30:00.000Z"
      }
    ],
    "totalFiles": 1
  }
}
```

---

### 6. **POST** `/api/lessons/:id/progress` - บันทึกความคืบหน้า
**Access:** Enrolled students  
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "timeSpent": 300, // seconds ที่เพิ่มขึ้น
  "completionPercentage": 75,
  "notes": "บันทึกของนักเรียน (optional)"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "บันทึกความคืบหน้าสำเร็จ",
  "data": {
    "progress": {
      "status": "in_progress",
      "completionPercentage": 75,
      "timeSpent": 1140,
      "lastAccessed": "2025-01-15T14:30:00.000Z"
    }
  }
}
```

---

### 7. **POST** `/api/lessons/:id/complete` - ทำเครื่องหมายบทเรียนเสร็จ
**Access:** Enrolled students  
**Headers:** `Authorization: Bearer <token>`

**Response Success (200):**
```json
{
  "success": true,
  "message": "ทำบทเรียนเสร็จเรียบร้อย",
  "data": {
    "progress": {
      "status": "completed",
      "completionPercentage": 100,
      "completedAt": "2025-01-15T14:30:00.000Z"
    },
    "courseProgress": {
      "completedLessons": 9,
      "totalLessons": 20,
      "progressPercentage": 45.0
    }
  }
}
```

---

## 📝 Quiz Management System (6 endpoints)

### Base URL: `/api/quizzes`

### 1. **GET** `/api/quizzes/course/:courseId` - ดูแบบทดสอบในวิชา
**Access:** Enrolled students / Teacher / Admin

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "quizzes": [
      {
        "id": 1,
        "title": "JavaScript Basics Quiz",
        "description": "ทดสอบความรู้ JavaScript เบื้องต้น",
        "quizType": "practice", // "practice", "assessment", "final_exam"
        "questionCount": 10,
        "timeLimit": 30, // minutes
        "maxAttempts": 3,
        "passingScore": 70,
        "isPublished": true,
        "availableFrom": "2025-01-10T00:00:00.000Z",
        "availableUntil": "2025-03-10T23:59:59.000Z",
        "attempts": [ // เฉพาะนักเรียน
          {
            "attemptNumber": 1,
            "score": 85,
            "percentage": 85.0,
            "status": "completed",
            "submittedAt": "2025-01-12T10:30:00.000Z"
          }
        ],
        "stats": {
          "totalAttempts": 1,
          "bestScore": 85,
          "averageScore": 85,
          "passed": true
        }
      }
    ]
  }
}
```

---

### 2. **POST** `/api/quizzes` - สร้างแบบทดสอบใหม่
**Access:** Teacher / Admin  
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "courseId": 1,
  "lessonId": 5, // optional
  "title": "React Components Quiz",
  "description": "ทดสอบความรู้เกี่ยวกับ React Components",
  "quizType": "assessment",
  "timeLimit": 45,
  "maxAttempts": 2,
  "passingScore": 75,
  "randomizeQuestions": true,
  "showCorrectAnswers": false,
  "showResultsImmediately": true,
  "availableFrom": "2025-01-20T00:00:00.000Z",
  "availableUntil": "2025-03-20T23:59:59.000Z",
  "questions": [
    {
      "questionText": "React component คืออะไร?",
      "questionType": "multiple_choice", // "multiple_choice", "true_false", "short_answer", "essay"
      "points": 10,
      "orderIndex": 1,
      "explanation": "คำอธิบายคำตอบ",
      "options": [
        {"text": "Function ที่ return JSX", "isCorrect": true},
        {"text": "HTML element", "isCorrect": false},
        {"text": "CSS class", "isCorrect": false},
        {"text": "JavaScript variable", "isCorrect": false}
      ]
    }
  ]
}
```

**Response Success (201):**
```json
{
  "success": true,
  "message": "สร้างแบบทดสอบสำเร็จ",
  "data": {
    "quiz": {
      "id": 15,
      // ... quiz data
      "isPublished": false
    }
  }
}
```

---

### 3. **POST** `/api/quizzes/:id/attempt` - เริ่มทำแบบทดสอบ
**Access:** Enrolled students  
**Headers:** `Authorization: Bearer <token>`

**Response Success (200):**
```json
{
  "success": true,
  "message": "เริ่มทำแบบทดสอบ",
  "data": {
    "attempt": {
      "id": 125,
      "quizId": 1,
      "attemptNumber": 2,
      "startedAt": "2025-01-15T14:30:00.000Z",
      "timeLimit": 30, // minutes
      "expiresAt": "2025-01-15T15:00:00.000Z"
    },
    "questions": [
      {
        "id": 1,
        "questionText": "React component คืออะไร?",
        "questionType": "multiple_choice",
        "points": 10,
        "orderIndex": 1,
        "imageUrl": null,
        "options": [
          {"id": 1, "text": "Function ที่ return JSX"},
          {"id": 2, "text": "HTML element"},
          {"id": 3, "text": "CSS class"},
          {"id": 4, "text": "JavaScript variable"}
        ]
      }
    ],
    "timeRemaining": 1800 // seconds
  }
}
```

---

### 4. **POST** `/api/quizzes/:id/answer` - ตอบคำถาม
**Access:** Enrolled students (ในระหว่างทำข้อสอบ)  
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "attemptId": 125,
  "questionId": 1,
  "answerText": "Function ที่ return JSX", // สำหรับ short_answer, essay
  "selectedOptions": [1], // สำหรับ multiple_choice (array ของ option IDs)
  "timeSpent": 45 // seconds ที่ใช้ตอบข้อนี้
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "บันทึกคำตอบสำเร็จ",
  "data": {
    "questionId": 1,
    "answered": true,
    "timeRemaining": 1755,
    "progress": {
      "answeredQuestions": 3,
      "totalQuestions": 10,
      "percentage": 30.0
    }
  }
}
```

---

### 5. **POST** `/api/quizzes/:id/submit` - ส่งแบบทดสอบ
**Access:** Enrolled students (ในระหว่างทำข้อสอบ)  
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "attemptId": 125,
  "finalAnswers": [
    {
      "questionId": 1,
      "answerText": "Function ที่ return JSX",
      "selectedOptions": [1],
      "timeSpent": 45
    }
  ]
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "ส่งแบบทดสอบสำเร็จ",
  "data": {
    "attempt": {
      "id": 125,
      "score": 85.0,
      "maxScore": 100.0,
      "percentage": 85.0,
      "passed": true,
      "passingScore": 70.0,
      "timeSpent": 1245, // seconds
      "submittedAt": "2025-01-15T14:50:30.000Z",
      "isCompleted": true
    },
    "results": {
      "correctAnswers": 8,
      "incorrectAnswers": 2,
      "totalQuestions": 10,
      "breakdown": [
        {
          "questionId": 1,
          "correct": true,
          "pointsEarned": 10,
          "maxPoints": 10,
          "explanation": "ถูกต้อง! React component คือ function ที่ return JSX"
        }
      ]
    },
    "nextAttempt": {
      "available": true,
      "attemptNumber": 3,
      "remainingAttempts": 1
    }
  }
}
```

---

## ⚡ Real-time Features (Socket.io)

**Socket Events:**
```javascript
// Client -> Server
'join_course' // เข้าร่วม course room
'join_quiz' // เข้าร่วม quiz room
'quiz_progress' // ความคืบหน้าการทำข้อสอบ

// Server -> Client
'new_enrollment' // มีนักเรียนลงทะเบียนใหม่
'enrollment_approved' // การลงทะเบียนได้รับอนุมัติ
'new_lesson' // มีบทเรียนใหม่
'quiz_assigned' // มีแบบทดสอบใหม่
'quiz_time_warning' // เตือนเวลาใกล้หมด (5 นาที, 1 นาที)
'quiz_auto_submit' // ส่งข้อสอบอัตโนมัติเมื่อหมดเวลา
```

---

## 📊 Data Structures Summary

**Course Status Flow:**
```
draft -> published -> archived
```

**Enrollment Status Flow:**
```
pending -> approved/rejected
```

**Lesson Progress Status:**
```
not_started -> in_progress -> completed
```

**Quiz Attempt Status:**
```
started -> in_progress -> completed/auto_submitted
```

# LMS Backend API Summary - Part 3: Upload, Admin & Analytics
**File: backend-summary-part3-upload-admin-analytics.md**  
**Path: /docs/backend-summary-part3-upload-admin-analytics.md**

---

## 📁 File Upload System (12 endpoints)

### Base URL: `/api/upload`

**Supported File Types:**
```javascript
// Images
profilePhotos: ['image/jpeg', 'image/png', 'image/webp'] // max 5MB
courseThumbnails: ['image/jpeg', 'image/png', 'image/webp'] // max 10MB

// Videos  
lessonVideos: ['video/mp4', 'video/webm', 'video/quicktime'] // max 500MB

// Documents
attachments: [
  'application/pdf',
  'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/zip',
  'text/plain'
] // max 50MB per file

// CSV Import
csvFiles: ['text/csv', 'application/vnd.ms-excel'] // max 5MB
```

**Upload Features:**
- ✅ Automatic image resizing & thumbnail generation
- ✅ Video transcoding (future)
- ✅ Virus scanning (configurable)
- ✅ Multiple storage backends (Local, S3, Google Cloud, Cloudinary)
- ✅ Progress tracking for large files
- ✅ File type validation
- ✅ Duplicate detection

---

### 1. **POST** `/api/upload/profile` - อัปโหลดรูปโปรไฟล์
**Access:** Private (All authenticated users)  
**Rate Limit:** 20 uploads/15min  
**Content-Type:** `multipart/form-data`

**Request Body (FormData):**
```javascript
photo: File (jpg, png, webp max 5MB)
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "อัปโหลดรูปโปรไฟล์สำเร็จ",
  "data": {
    "profilePhoto": "/uploads/profiles/user_1_photo_400x400.jpg",
    "thumbnail": "/uploads/profiles/thumbnails/user_1_thumb_100x100.jpg",
    "originalUrl": "/uploads/profiles/original/user_1_original.jpg",
    "fileInfo": {
      "originalName": "my-photo.jpg",
      "originalSize": "2.3MB",
      "processedSize": "456KB",
      "dimensions": {
        "original": {"width": 2048, "height": 1536},
        "processed": {"width": 400, "height": 400},
        "thumbnail": {"width": 100, "height": 100}
      }
    },
    "uploadedAt": "2025-01-15T14:30:00.000Z"
  }
}
```

---

### 2. **POST** `/api/upload/course/:courseId/thumbnail` - อัปโหลด thumbnail วิชา
**Access:** Teacher (เฉพาะวิชาของตัวเอง) / Admin  
**Rate Limit:** 20 uploads/15min

**Request Body (FormData):**
```javascript
thumbnail: File (jpg, png, webp max 10MB)
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "อัปโหลด thumbnail วิชาสำเร็จ",
  "data": {
    "thumbnail": "/uploads/courses/course_1_thumb_800x450.jpg",
    "thumbnailSmall": "/uploads/courses/course_1_thumb_400x225.jpg",
    "thumbnailMedium": "/uploads/courses/course_1_thumb_600x338.jpg",
    "fileInfo": {
      "originalName": "course-cover.jpg",
      "originalSize": "5.2MB",
      "processedSize": "890KB",
      "aspectRatio": "16:9"
    }
  }
}
```

---

### 3. **POST** `/api/upload/lesson/:lessonId/video` - อัปโหลดวิดีโอบทเรียน
**Access:** Teacher (เฉพาะบทเรียนของตัวเอง) / Admin  
**Rate Limit:** 5 heavy uploads/hour  
**Max Size:** 500MB

**Request Body (FormData):**
```javascript
video: File (mp4, webm, mov max 500MB)
subtitle: File (vtt, srt optional)
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "อัปโหลดวิดีโอสำเร็จ กำลังประมวลผล...",
  "data": {
    "videoUrl": "/uploads/lessons/videos/lesson_1_video.mp4",
    "videoInfo": {
      "fileName": "lesson-video.mp4",
      "fileSize": "245MB",
      "duration": 1205, // seconds
      "resolution": "1920x1080",
      "format": "mp4",
      "bitrate": "2500kbps"
    },
    "subtitleUrl": "/uploads/lessons/subtitles/lesson_1_subtitle.vtt",
    "processingStatus": "completed", // "uploading", "processing", "completed", "failed"
    "thumbnails": [
      "/uploads/lessons/thumbnails/lesson_1_thumb_00:30.jpg",
      "/uploads/lessons/thumbnails/lesson_1_thumb_02:00.jpg",
      "/uploads/lessons/thumbnails/lesson_1_thumb_05:00.jpg"
    ],
    "streamingUrls": {
      "hls": "/uploads/lessons/streams/lesson_1_playlist.m3u8",
      "dash": "/uploads/lessons/streams/lesson_1_manifest.mpd"
    }
  }
}
```

---

### 4. **POST** `/api/upload/lesson/:lessonId/attachments` - อัปโหลดไฟล์แนับบทเรียน
**Access:** Teacher (เฉพาะบทเรียนของตัวเอง) / Admin  
**Max Files:** 10 files per request  
**Max Size:** 50MB per file

**Request Body (FormData):**
```javascript
attachments: Files[] (pdf, doc, ppt, zip, txt)
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "อัปโหลดไฟล์แนบสำเร็จ 3 ไฟล์",
  "data": {
    "attachments": [
      {
        "id": 15,
        "fileName": "javascript-cheatsheet.pdf",
        "originalName": "JS Cheat Sheet.pdf",
        "fileUrl": "/uploads/lessons/attachments/lesson_1_cheatsheet.pdf",
        "fileSize": "2.5MB",
        "fileType": "application/pdf",
        "description": "JavaScript Quick Reference",
        "downloadCount": 0,
        "uploadedAt": "2025-01-15T14:30:00.000Z"
      },
      {
        "id": 16,
        "fileName": "code-examples.zip",
        "originalName": "Code Examples.zip", 
        "fileUrl": "/uploads/lessons/attachments/lesson_1_examples.zip",
        "fileSize": "12.8MB",
        "fileType": "application/zip",
        "description": "Example code files",
        "downloadCount": 0,
        "uploadedAt": "2025-01-15T14:30:00.000Z"
      }
    ],
    "totalFiles": 2,
    "totalSize": "15.3MB",
    "warnings": [] // ข้อผิดพลาดของไฟล์ที่อัปโหลดไม่สำเร็จ
  }
}
```

---

### 5. **POST** `/api/upload/quiz/:quizId/import` - นำเข้าข้อสอบจาก CSV
**Access:** Teacher (เฉพาะแบบทดสอบของตัวเอง) / Admin  
**Rate Limit:** 5 imports/30min

**CSV Format:**
```csv
question_text,question_type,points,option_a,option_b,option_c,option_d,correct_answer,explanation
"React คืออะไร?",multiple_choice,10,"Library","Framework","Language","Database","A","React เป็น JavaScript library"
"JSX ย่อมาจากอะไร?",short_answer,5,"","","","","JavaScript XML","JSX ย่อมาจาก JavaScript XML"
```

**Request Body (FormData):**
```javascript
csvFile: File (csv max 5MB)
replaceExisting: boolean (default: false)
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "นำเข้าข้อสอบสำเร็จ 25 ข้อ",
  "data": {
    "importSummary": {
      "totalRows": 27,
      "successfulImports": 25,
      "skippedRows": 2,
      "totalPoints": 250
    },
    "questions": [
      {
        "id": 101,
        "questionText": "React คืออะไร?",
        "questionType": "multiple_choice",
        "points": 10,
        "orderIndex": 1,
        "options": [
          {"text": "Library", "isCorrect": true},
          {"text": "Framework", "isCorrect": false},
          {"text": "Language", "isCorrect": false},
          {"text": "Database", "isCorrect": false}
        ]
      }
    ],
    "errors": [
      {
        "row": 15,
        "error": "Missing correct_answer for multiple_choice question"
      }
    ]
  }
}
```

---

### 6. **GET** `/api/upload/info` - ดูข้อมูลระบบอัปโหลด
**Access:** Public

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "systemInfo": {
      "maxFileSize": "500MB",
      "maxFilesPerUpload": 10,
      "storageType": "local", // "local", "s3", "gcp", "cloudinary"
      "totalStorage": "2TB",
      "usedStorage": "458GB",
      "availableStorage": "1.6TB"
    },
    "supportedTypes": {
      "images": ["jpg", "png", "webp"],
      "videos": ["mp4", "webm", "mov"],
      "documents": ["pdf", "doc", "docx", "ppt", "pptx"],
      "archives": ["zip", "rar"],
      "text": ["txt", "csv"]
    },
    "processingFeatures": {
      "imageResizing": true,
      "thumbnailGeneration": true,
      "videoTranscoding": false,
      "virusScanning": true,
      "duplicateDetection": true
    },
    "endpoints": {
      "profilePhoto": "/api/upload/profile",
      "courseThumbnail": "/api/upload/course/:courseId/thumbnail",
      "lessonVideo": "/api/upload/lesson/:lessonId/video",
      "lessonAttachments": "/api/upload/lesson/:lessonId/attachments",
      "quizImport": "/api/upload/quiz/:quizId/import"
    }
  }
}
```

---

### 7. **DELETE** `/api/upload/file` - ลบไฟล์
**Access:** Teacher (เฉพาะไฟล์ของตัวเอง) / Admin

**Request Body:**
```json
{
  "fileUrl": "/uploads/lessons/attachments/lesson_1_cheatsheet.pdf",
  "fileType": "attachment" // "profile", "course_thumbnail", "lesson_video", "attachment"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "ลบไฟล์สำเร็จ",
  "data": {
    "deletedFile": "/uploads/lessons/attachments/lesson_1_cheatsheet.pdf",
    "freedSpace": "2.5MB"
  }
}
```

---

## 👨‍💼 Admin Panel System (8 endpoints)

### Base URL: `/api/admin`

### 1. **GET** `/api/admin/dashboard` - แดชบอร์ดผู้ดูแล
**Access:** Admin only  
**Headers:** `Authorization: Bearer <token>`

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 1250,
      "totalTeachers": 45,
      "totalStudents": 1200,
      "pendingTeachers": 5,
      "totalCourses": 125,
      "publishedCourses": 98,
      "totalLessons": 2450,
      "totalQuizzes": 380,
      "totalEnrollments": 8750,
      "systemUptime": "15 days, 6 hours"
    },
    "userStats": {
      "newUsersToday": 12,
      "newUsersThisWeek": 87,
      "newUsersThisMonth": 324,
      "activeUsersToday": 456,
      "activeUsersThisWeek": 1890,
      "peakConcurrentUsers": 234
    },
    "courseStats": {
      "newCoursesToday": 2,
      "newCoursesThisWeek": 8,
      "newCoursesThisMonth": 28,
      "mostPopularCourses": [
        {
          "id": 1,
          "title": "JavaScript Fundamentals",
          "enrollments": 456,
          "rating": 4.8
        }
      ]
    },
    "systemHealth": {
      "database": {
        "status": "healthy",
        "connections": 25,
        "maxConnections": 100,
        "queryTime": "15ms"
      },
      "storage": {
        "status": "healthy",
        "usedSpace": "458GB",
        "totalSpace": "2TB",
        "usagePercentage": 22.9
      },
      "email": {
        "status": "healthy",
        "queuedEmails": 45,
        "sentToday": 1250,
        "failedToday": 3
      }
    },
    "recentActivity": [
      {
        "type": "user_registration",
        "message": "นักเรียนใหม่ลงทะเบียน: สมชาย ใจดี",
        "timestamp": "2025-01-15T14:25:00.000Z"
      },
      {
        "type": "course_published",
        "message": "เผยแพร่วิชาใหม่: React Advanced Concepts",
        "timestamp": "2025-01-15T14:20:00.000Z"
      }
    ]
  }
}
```

---

### 2. **GET** `/api/admin/users` - จัดการผู้ใช้
**Access:** Admin only

**Query Parameters:**
```javascript
?page=1&limit=20&role=teacher&status=pending&search=สมชาย
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 15,
        "email": "teacher@example.com",
        "firstName": "อาจารย์",
        "lastName": "สมชาย",
        "role": "teacher",
        "status": "pending", // "active", "pending", "suspended", "banned"
        "profilePhoto": "/uploads/profiles/teacher_15.jpg",
        "createdAt": "2025-01-10T09:00:00.000Z",
        "lastLoginAt": "2025-01-14T16:30:00.000Z",
        "stats": {
          "totalCourses": 3,
          "totalStudents": 125,
          "averageRating": 4.6
        },
        "pendingApproval": {
          "submittedAt": "2025-01-10T09:00:00.000Z",
          "documents": [
            "/uploads/applications/teacher_15_cv.pdf",
            "/uploads/applications/teacher_15_certificate.pdf"
          ]
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 8,
      "totalUsers": 156,
      "hasNext": true,
      "hasPrev": false
    },
    "filters": {
      "roles": [
        {"value": "student", "count": 1200},
        {"value": "teacher", "count": 45},
        {"value": "admin", "count": 5}
      ],
      "statuses": [
        {"value": "active", "count": 1180},
        {"value": "pending", "count": 45},
        {"value": "suspended", "count": 15},
        {"value": "banned", "count": 10}
      ]
    }
  }
}
```

---

### 3. **PUT** `/api/admin/users/:id/approve` - อนุมัติ/ปฏิเสธครู
**Access:** Admin only

**Request Body:**
```json
{
  "action": "approve", // "approve" หรือ "reject" 
  "reason": "เหตุผล (สำหรับ reject)",
  "notes": "หมายเหตุของ admin"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "อนุมัติครูผู้สอนสำเร็จ",
  "data": {
    "user": {
      "id": 15,
      "email": "teacher@example.com",
      "status": "active",
      "approvedAt": "2025-01-15T14:30:00.000Z",
      "approvedBy": 1
    },
    "emailSent": true
  }
}
```

---

### 4. **PUT** `/api/admin/users/:id/status` - เปลี่ยนสถานะผู้ใช้
**Access:** Admin only

**Request Body:**
```json
{
  "status": "suspended", // "active", "suspended", "banned"
  "reason": "ละเมิดเงื่อนไขการใช้งาน",
  "duration": 30 // วัน (สำหรับ suspended)
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "เปลี่ยนสถานะผู้ใช้สำเร็จ",
  "data": {
    "user": {
      "id": 15,
      "status": "suspended",
      "suspendedUntil": "2025-02-14T14:30:00.000Z",
      "reason": "ละเมิดเงื่อนไขการใช้งาน"
    }
  }
}
```

---

### 5. **GET** `/api/admin/statistics` - สถิติระบบโดยรวม
**Access:** Admin only

**Query Parameters:**
```javascript
?period=week&startDate=2025-01-01&endDate=2025-01-15
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "timeRange": {
      "startDate": "2025-01-01T00:00:00.000Z",
      "endDate": "2025-01-15T23:59:59.000Z",
      "period": "week"
    },
    "userGrowth": {
      "totalUsers": 1250,
      "newUsers": 87,
      "growthRate": 7.5, // percentage
      "dailyRegistrations": [
        {"date": "2025-01-08", "count": 12},
        {"date": "2025-01-09", "count": 15},
        {"date": "2025-01-10", "count": 8}
      ]
    },
    "courseMetrics": {
      "totalCourses": 125,
      "newCourses": 8,
      "totalEnrollments": 8750,
      "newEnrollments": 145,
      "averageEnrollmentsPerCourse": 70,
      "topCategories": [
        {"name": "Programming", "courseCount": 45, "enrollments": 3200},
        {"name": "Design", "courseCount": 28, "enrollments": 2100}
      ]
    },
    "engagementMetrics": {
      "dailyActiveUsers": 456,
      "weeklyActiveUsers": 1890,
      "monthlyActiveUsers": 3240,
      "averageSessionDuration": 45, // minutes
      "bounceRate": 12.5, // percentage
      "completionRate": 67.8 // percentage
    },
    "contentMetrics": {
      "totalLessons": 2450,
      "totalVideoDuration": 15600, // minutes
      "totalQuizzes": 380,
      "averageQuizScore": 78.5,
      "mostViewedLessons": [
        {
          "id": 1,
          "title": "Introduction to JavaScript",
          "views": 1250,
          "course": "JavaScript Fundamentals"
        }
      ]
    },
    "revenueMetrics": {
      "totalRevenue": 450000, // บาท
      "monthlyRevenue": 75000,
      "averageRevenuePerUser": 360,
      "topEarningCourses": [
        {
          "id": 1,
          "title": "JavaScript Fundamentals", 
          "revenue": 68400,
          "enrollments": 456
        }
      ]
    }
  }
}
```

---

## 📊 Analytics & ML System (5 endpoints)

### Base URL: `/api/analytics`

### 1. **GET** `/api/analytics/teacher/:id` - วิเคราะห์ข้อมูลครู
**Access:** Teacher (เฉพาะตัวเอง) / Admin

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "teacher": {
      "id": 5,
      "firstName": "อาจารย์",
      "lastName": "สมชาย"
    },
    "overview": {
      "totalCourses": 8,
      "totalStudents": 1250,
      "totalLessons": 180,
      "totalQuizzes": 45,
      "averageRating": 4.7,
      "totalRevenue": 187500
    },
    "coursePerformance": [
      {
        "courseId": 1,
        "title": "JavaScript Fundamentals",
        "enrollments": 456,
        "completionRate": 78.5,
        "averageScore": 82.3,
        "rating": 4.8,
        "revenue": 68400,
        "engagement": {
          "averageTimeSpent": 240, // minutes per student
          "lessonCompletionRate": 85.2,
          "quizCompletionRate": 91.4,
          "activeStudents": 287
        }
      }
    ],
    "studentProgress": {
      "strugglingStudents": [
        {
          "studentId": 123,
          "name": "นาย สมศักดิ์ ใจดี",
          "courseId": 1,
          "progress": 25.5,
          "lastActive": "2025-01-10T08:30:00.000Z",
          "averageScore": 45.2,
          "riskLevel": "high" // "low", "medium", "high"
        }
      ],
      "topPerformers": [
        {
          "studentId": 456,
          "name": "นางสาว สมหญิง เก่งมาก",
          "courseId": 1,
          "progress": 95.0,
          "averageScore": 96.8,
          "timeToComplete": 180 // minutes faster than average
        }
      ]
    },
    "predictions": {
      "model": "random_forest_v2.1",
      "generatedAt": "2025-01-15T14:30:00.000Z",
      "studentOutcomes": [
        {
          "studentId": 123,
          "predictionType": "completion_probability",
          "probability": 0.35,
          "confidence": 0.78,
          "factors": [
            {"factor": "low_engagement", "weight": 0.45},
            {"factor": "low_quiz_scores", "weight": 0.32},
            {"factor": "irregular_login", "weight": 0.23}
          ],
          "recommendations": [
            "ส่งข้อความแจ้งเตือน",
            "แนะนำเนื้อหาเพิ่มเติม",
            "จัดกลุ่มศึกษา"
          ]
        }
      ],
      "courseOptimization": {
        "difficultLessons": [
          {
            "lessonId": 15,
            "title": "Async/Await Concepts",
            "dropoffRate": 35.2,
            "averageTimeSpent": 45, // นาที
            "suggestions": [
              "เพิ่มตัวอย่างมากขึ้น",
              "แบ่งเป็นบทเรียนย่อย",
              "เพิ่มแบบฝึกหัด"
            ]
          }
        ],
        "engagementOptimization": {
          "optimalVideoLength": 12, // นาที
          "bestPostingTime": "09:00-11:00",
          "recommendedQuizFrequency": "ทุก 3 บทเรียน"
        }
      }
    },
    "trends": {
      "enrollmentTrend": [
        {"month": "2024-10", "enrollments": 45},
        {"month": "2024-11", "enrollments": 67},
        {"month": "2024-12", "enrollments": 89},
        {"month": "2025-01", "enrollments": 123}
      ],
      "completionTrend": [
        {"month": "2024-10", "rate": 65.2},
        {"month": "2024-11", "rate": 71.8},
        {"month": "2024-12", "rate": 78.5}
      ]
    }
  }
}
```

---

### 2. **GET** `/api/analytics/student/:id` - วิเคราะห์ข้อมูลนักเรียน
**Access:** Student (เฉพาะตัวเอง) / Teacher (เฉพาะนักเรียนในวิชาของตัวเอง) / Admin

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "student": {
      "id": 123,
      "firstName": "นาย",
      "lastName": "สมศักดิ์"
    },
    "overview": {
      "totalCourses": 5,
      "completedCourses": 2,
      "inProgressCourses": 3,
      "totalLessonsCompleted": 45,
      "totalQuizzesTaken": 28,
      "averageScore": 78.5,
      "totalStudyTime": 2340 // minutes
    },
    "courseProgress": [
      {
        "courseId": 1,
        "title": "JavaScript Fundamentals",
        "progress": 85.5,
        "grade": "A",
        "averageScore": 87.2,
        "timeSpent": 480, // minutes
        "status": "in_progress",
        "completedLessons": 17,
        "totalLessons": 20,
        "lastAccessed": "2025-01-15T08:30:00.000Z",
        "strengths": ["Variables", "Functions", "Arrays"],
        "weaknesses": ["Async Programming", "Error Handling"],
        "nextRecommendations": [
          "Review Promises and Async/Await",
          "Practice error handling exercises"
        ]
      }
    ],
    "learningStyle": {
      "analysis": {
        "primaryStyle": "visual", // "visual", "auditory", "kinesthetic", "reading"
        "confidence": 0.78,
        "characteristics": [
          "Prefers video content over text",
          "High engagement with interactive examples",
          "Better performance on visual quizzes"
        ]
      },
      "recommendations": [
        "เพิ่มเนื้อหาแบบ visual มากขึ้น",
        "ใช้ diagram และ flowchart",
        "ดูวิดีโอก่อนอ่าน text"
      ]
    },
    "predictions": {
      "model": "neural_network_v1.5",
      "generatedAt": "2025-01-15T14:30:00.000Z",
      "courseOutcomes": [
        {
          "courseId": 1,
          "predictionType": "final_grade",
          "predictedGrade": "A-",
          "confidence": 0.85,
          "estimatedCompletionDate": "2025-02-15",
          "riskFactors": [
            {"factor": "difficult_upcoming_topics", "impact": "medium"},
            {"factor": "decreasing_engagement", "impact": "low"}
          ]
        }
      ],
      "careerRecommendations": [
        {
          "field": "Frontend Development",
          "matchScore": 0.89,
          "reasons": [
            "Strong performance in JavaScript",
            "High visual learning preference",
            "Good problem-solving skills"
          ],
          "suggestedCourses": [
            "React for Beginners",
            "CSS Advanced Techniques",
            "UI/UX Design Fundamentals"
          ]
        }
      ]
    },
    "performance": {
      "strengthAreas": [
        {
          "topic": "JavaScript Fundamentals",
          "score": 92.5,
          "rank": "top 10%"
        }
      ],
      "improvementAreas": [
        {
          "topic": "Async Programming", 
          "score": 45.2,
          "suggestions": [
            "ทบทวนเนื้อหา Promises",
            "ทำแบบฝึกหัดเพิ่ม",
            "ดูตัวอย่างเพิ่มเติม"
          ]
        }
      ],
      "studyPattern": {
        "preferredStudyTime": "09:00-11:00",
        "averageSessionLength": 35, // minutes
        "mostProductiveDays": ["Monday", "Wednesday", "Friday"],
        "optimalBreakInterval": 25 // minutes (Pomodoro-style)
      }
    },
    "achievements": [
      {
        "id": 1,
        "title": "JavaScript Master",
        "description": "เสร็จสิ้นวิชา JavaScript Fundamentals ด้วยคะแนนเฉลี่ยเกิน 85%",
        "unlockedAt": "2025-01-10T14:30:00.000Z",
        "badgeUrl": "/images/badges/js-master.png"
      }
    ]
  }
}
```

---

### 3. **GET** `/api/analytics/course/:id` - วิเคราะห์ข้อมูลวิชา
**Access:** Teacher (เฉพาะวิชาของตัวเอง) / Admin

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "course": {
      "id": 1,
      "title": "JavaScript Fundamentals",
      "teacherId": 5
    },
    "overview": {
      "totalEnrollments": 456,
      "activeStudents": 287,
      "completionRate": 78.5,
      "averageScore": 82.3,
      "averageRating": 4.8,
      "totalRevenue": 68400
    },
    "studentAnalytics": {
      "demographics": {
        "ageGroups": [
          {"range": "18-25", "count": 156, "percentage": 34.2},
          {"range": "26-35", "count": 189, "percentage": 41.4},
          {"range": "36-45", "count": 89, "percentage": 19.5},
          {"range": "46+", "count": 22, "percentage": 4.8}
        ],
        "experienceLevels": [
          {"level": "beginner", "count": 234, "percentage": 51.3},
          {"level": "intermediate", "count": 178, "percentage": 39.0},
          {"level": "advanced", "count": 44, "percentage": 9.6}
        ]
      },
      "engagement": {
        "averageTimeSpent": 240, // minutes per student
        "peakActivityHours": ["09:00-10:00", "19:00-21:00"],
        "dropoffPoints": [
          {
            "lessonId": 15,
            "title": "Async/Await",
            "dropoffRate": 35.2,
            "position": "75% through course"
          }
        ],
        "retentionByWeek": [
          {"week": 1, "retention": 95.2},
          {"week": 2, "retention": 87.8},
          {"week": 3, "retention": 82.1},
          {"week": 4, "retention": 78.5}
        ]
      }
    },
    "contentAnalytics": {
      "lessonPerformance": [
        {
          "lessonId": 1,
          "title": "Introduction to JavaScript",
          "viewCount": 456,
          "completionRate": 95.2,
          "averageTimeSpent": 15, // minutes
          "satisfactionScore": 4.8,
          "comments": [
            {"sentiment": "positive", "count": 45},
            {"sentiment": "neutral", "count": 12},
            {"sentiment": "negative", "count": 3}
          ]
        }
      ],
      "quizAnalytics": [
        {
          "quizId": 1,
          "title": "JavaScript Basics Quiz",
          "attemptCount": 412,
          "averageScore": 78.5,
          "passRate": 89.2,
          "difficultQuestions": [
            {
              "questionId": 5,
              "text": "What is closure?",
              "successRate": 45.2,
              "commonMistakes": [
                "Confusing with scope",
                "Incorrect practical examples"
              ]
            }
          ]
        }
      ]
    },
    "predictions": {
      "model": "course_optimization_v1.2",
      "recommendations": {
        "contentOptimization": [
          {
            "type": "lesson_restructure",
            "lesson": "Async/Await Concepts",
            "suggestion": "แบ่งเป็น 2 บทเรียนย่อย",
            "expectedImprovement": "เพิ่ม completion rate 15-20%"
          }
        ],
        "studentSupport": [
          {
            "type": "early_intervention",
            "criteria": "นักเรียนที่ใช้เวลานานกว่าเฉลี่ย 50% ในบทเรียนแรก",
            "action": "ส่งข้อความสนับสนุนและแนะนำแหล่งเรียนรู้เพิ่ม"
          }
        ],
        "pricing": {
          "optimalPrice": 1650, // บาท
          "priceElasticity": -1.2,
          "revenueProjection": "เพิ่มขึ้น 8-12% จากการปรับราคา"
        }
      }
    },
    "comparativeAnalysis": {
      "benchmarks": {
        "industryAverage": {
          "completionRate": 65.2,
          "averageScore": 74.8,
          "satisfactionScore": 4.2
        },
        "platformAverage": {
          "completionRate": 72.1,
          "averageScore": 79.3,
          "satisfactionScore": 4.5
        },
        "categoryAverage": {
          "completionRate": 76.8,
          "averageScore": 81.2,
          "satisfactionScore": 4.6
        }
      },
      "ranking": {
        "overall": 5, // อันดับ 5 จากทั้งหมด
        "category": 2, // อันดับ 2 ในหมวดหมู่
        "teacher": 1 // อันดับ 1 ของครูคนนี้
      }
    }
  }
}
```

---

### 4. **GET** `/api/analytics/platform` - วิเคราะห์ข้อมูลแพลตฟอร์มทั้งระบบ
**Access:** Admin only

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 1250,
      "totalCourses": 125,
      "totalEnrollments": 8750,
      "platformAge": 365, // days
      "currentVersion": "2.1.0"
    },
    "growth": {
      "userGrowth": {
        "daily": 12,
        "weekly": 87,
        "monthly": 324,
        "yearToDate": 1250
      },
      "revenueGrowth": {
        "monthly": 75000,
        "yearToDate": 450000,
        "growthRate": 15.2 // percentage MoM
      }
    },
    "userBehavior": {
      "averageSessionDuration": 45, // minutes
      "pagesPerSession": 12.5,
      "bounceRate": 12.5, // percentage
      "returnUserRate": 68.3, // percentage
      "deviceBreakdown": [
        {"device": "desktop", "percentage": 45.2},
        {"device": "mobile", "percentage": 38.9},
        {"device": "tablet", "percentage": 15.9}
      ]
    },
    "contentMetrics": {
      "averageCourseCompletion": 67.8,
      "averageQuizScore": 78.5,
      "mostPopularCategories": [
        {"name": "Programming", "enrollments": 3200},
        {"name": "Design", "enrollments": 2100}
      ],
      "contentGrowth": {
        "newLessonsThisMonth": 145,
        "newQuizzesThisMonth": 78,
        "totalContentHours": 2600 // hours of video content
      }
    },
    "systemPerformance": {
      "averageResponseTime": 250, // milliseconds
      "uptime": 99.8, // percentage
      "errorRate": 0.02, // percentage
      "peakConcurrentUsers": 234,
      "bandwidthUsage": "2.5TB", // monthly
      "storageUsage": "458GB"
    },
    "mlInsights": {
      "model": "platform_analytics_v2.0",
      "predictions": {
        "userGrowthNext3Months": 486, // new users
        "revenueProjectionNext3Months": 245000, // บาท
        "churnRiskUsers": 89, // users at risk
        "trendingSkills": ["React", "Machine Learning", "UI/UX Design"]
      },
      "recommendations": [
        {
          "category": "user_retention",
          "suggestion": "เพิ่มระบบ gamification",
          "expectedImpact": "เพิ่ม retention 8-12%"
        },
        {
          "category": "content_strategy", 
          "suggestion": "เพิ่มคอร์ส Machine Learning",
          "expectedImpact": "เพิ่มผู้ใช้ใหม่ 15-20%"
        }
      ]
    }
  }
}
```

---

## 🔔 Notification System

**Email Notification Events:**
```javascript
// User Events
'user_registered' // ผู้ใช้ลงทะเบียนใหม่
'teacher_application' // ครูสมัครรออนุมัติ
'teacher_approved' // ครูได้รับอนุมัติ
'teacher_rejected' // ครูถูกปฏิเสธ

// Course Events  
'enrollment_request' // นักเรียนขอลงทะเบียน
'enrollment_approved' // การลงทะเบียนได้รับอนุมัติ
'enrollment_rejected' // การลงทะเบียนถูกปฏิเสธ
'course_published' // วิชาใหม่เผยแพร่
'lesson_published' // บทเรียนใหม่

// Quiz Events
'quiz_assigned' // มีแบบทดสอบใหม่
'quiz_graded' // ผลแบบทดสอบออกแล้ว
'quiz_deadline_reminder' // เตือนใกล้หมดเขต

// System Events
'system_maintenance' // ปิดปรับปรุงระบบ
'security_alert' // การแจ้งเตือนความปลอดภัย
```

**In-App Notifications (Real-time via Socket.io):**
```javascript
// Socket Events
'notification_new' // แจ้งเตือนใหม่
'enrollment_status_change' // สถานะการลงทะเบียนเปลี่ยน
'quiz_time_warning' // เตือนเวลาใกล้หมด
'live_support_message' // ข้อความจาก support
```

---

## 🛡️ System Security & Error Handling

**Error Response Format:**
```json
{
  "success": false,
  "message": "ข้อผิดพลาดหลัก",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "field": "email",
        "message": "รูปแบบอีเมลไม่ถูกต้อง"
      }
    ]
  },
  "timestamp": "2025-01-15T14:30:00.000Z",
  "requestId": "req_123456789"
}
```

**HTTP Status Codes:**
- `200` - สำเร็จ
- `201` - สร้างสำเร็จ
- `400` - ข้อมูลไม่ถูกต้อง
- `401` - ไม่ได้เข้าสู่ระบบ
- `403` - ไม่มีสิทธิ์เข้าถึง
- `404` - ไม่พบข้อมูล
- `429` - ส่งคำขอเกินจำนวนที่อนุญาต
- `500` - ข้อผิดพลาดระบบ

---

## 🚀 Performance & Scalability

**Caching Strategy:**
- Redis สำหรับ session management
- Database query caching  
- Static file caching
- API response caching

**File Storage Options:**
- Local storage (development)
- AWS S3 (production)
- Google Cloud Storage
- Cloudinary (image optimization)

**Database Optimization:**
- Index optimization
- Query optimization
- Connection pooling
- Read replicas (future)

---

## 📋 Development Notes

**Environment Variables Required:**
```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/lms_db

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=24h

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=500MB

# Redis
REDIS_URL=redis://localhost:6379

# External APIs
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Ready for Frontend Integration! 🎉**

ระบบ backend พร้อมใช้งานครบทุกฟีเจอร์ที่ต้องการ:
- ✅ Authentication & Authorization  
- ✅ Course Management
- ✅ Lesson & Video System
- ✅ Quiz & Testing System
- ✅ File Upload & Management
- ✅ Admin Panel
- ✅ Analytics & ML Predictions
- ✅ Email Notifications
- ✅ Real-time Updates
- ✅ Security & Rate Limiting

**Total API Endpoints: 80+**  
**Ready for Production: ✅**

# LMS Backend API Summary - Part 4: News & Communication System
**File: backend-summary-part4-news-communication.md**  
**Path: /docs/backend-summary-part4-news-communication.md**

---

## 📰 News Management System (15 endpoints)

### Base URL: `/api/news`

**System Overview:**
- ✅ Complete CRUD operations for news
- ✅ Category management system
- ✅ Publishing workflow (draft → published → archived)
- ✅ SEO-friendly URLs with auto-generated slugs
- ✅ Featured news system
- ✅ View tracking and analytics
- ✅ Filtering and search capabilities
- ✅ Rich text content support
- ✅ Image attachments and thumbnails
- ✅ Tag system for better organization

---

### **PUBLIC ENDPOINTS (No Authentication)**

### 1. **GET** `/api/news` - ดูข่าวสารทั้งหมด
**Access:** Public  
**Rate Limit:** 100 requests/15min

**Query Parameters:**
```javascript
?page=1&limit=12&category=programming&type=announcement&search=javascript&tags=tutorial,beginner&sort=latest&featured=true
```

**Request Example:**
```bash
GET /api/news?page=1&limit=10&category=technology&sort=latest
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "news": [
      {
        "id": 1,
        "title": "เปิดตัวระบบ LMS ใหม่",
        "slug": "new-lms-system-launch",
        "summary": "ระบบการจัดการเรียนรู้ใหม่พร้อมให้บริการแล้ว",
        "featuredImage": "/uploads/news/news_1_featured.jpg",
        "newsType": "announcement",
        "priority": "high",
        "isFeatured": true,
        "isBreaking": false,
        "tags": ["lms", "announcement", "education"],
        "viewCount": 1250,
        "likeCount": 89,
        "shareCount": 45,
        "publishedAt": "2025-01-15T10:30:00.000Z",
        "createdAt": "2025-01-14T15:20:00.000Z",
        "author": {
          "id": 5,
          "firstName": "อาจารย์",
          "lastName": "สมชาย",
          "profilePhoto": "/uploads/profiles/teacher_5.jpg",
          "bio": "ผู้อำนวยการวิชาการ"
        },
        "category": {
          "id": 1,
          "name": "ประกาศทั่วไป",
          "slug": "general-announcements",
          "color": "#007bff",
          "icon": "megaphone"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 8,
      "totalNews": 95,
      "hasNext": true,
      "hasPrev": false,
      "limit": 12
    },
    "filters": {
      "categories": [
        {"id": 1, "name": "ประกาศทั่วไป", "count": 25, "color": "#007bff"},
        {"id": 2, "name": "เทคโนโลยี", "count": 18, "color": "#28a745"}
      ],
      "types": [
        {"type": "announcement", "count": 30, "label": "ประกาศ"},
        {"type": "technology", "count": 20, "label": "เทคโนโลยี"}
      ],
      "popularTags": [
        {"tag": "lms", "count": 15},
        {"tag": "javascript", "count": 12}
      ]
    }
  }
}
```

---

### 2. **GET** `/api/news/featured` - ดูข่าวเด่น
**Access:** Public  
**Rate Limit:** 100 requests/15min

**Query Parameters:**
```javascript
?limit=5
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "news": [
      {
        "id": 1,
        "title": "ข่าวสำคัญ: อัพเดทระบบใหม่",
        "slug": "important-system-update",
        "summary": "การอัพเดทระบบครั้งใหญ่พร้อมฟีเจอร์ใหม่",
        "featuredImage": "/uploads/news/news_1_featured.jpg",
        "priority": "urgent",
        "isFeatured": true,
        "isBreaking": true,
        "publishedAt": "2025-01-15T08:00:00.000Z",
        "author": {
          "firstName": "Admin",
          "lastName": "System"
        },
        "category": {
          "name": "ระบบ",
          "color": "#dc3545"
        }
      }
    ]
  }
}
```

---

### 3. **GET** `/api/news/popular` - ดูข่าวยอดนิยม
**Access:** Public  
**Rate Limit:** 100 requests/15min

**Query Parameters:**
```javascript
?limit=5&days=7
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "news": [
      {
        "id": 3,
        "title": "JavaScript ES2025: ฟีเจอร์ใหม่ที่น่าสนใจ",
        "slug": "javascript-es2025-new-features",
        "summary": "รวมฟีเจอร์ใหม่ใน JavaScript ES2025",
        "viewCount": 2845,
        "likeCount": 234,
        "shareCount": 89,
        "engagement": 91.5,
        "trendingScore": 8.7,
        "publishedAt": "2025-01-12T14:30:00.000Z",
        "category": {
          "name": "เทคโนโลยี",
          "color": "#28a745"
        }
      }
    ]
  }
}
```

---

### 4. **GET** `/api/news/categories` - ดูหมวดหมู่ข่าว
**Access:** Public  
**Rate Limit:** 100 requests/15min

**Query Parameters:**
```javascript
?include_count=true
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": 1,
        "name": "ประกาศทั่วไป",
        "slug": "general-announcements",
        "description": "ข่าวประกาศและสาระสำคัญทั่วไป",
        "color": "#007bff",
        "icon": "megaphone",
        "isActive": true,
        "orderIndex": 1,
        "newsCount": 25,
        "latestNews": {
          "title": "ประกาศปิดระบบชั่วคราว",
          "publishedAt": "2025-01-15T10:00:00.000Z"
        }
      }
    ]
  }
}
```

---

### 5. **GET** `/api/news/:slug` - ดูข่าวเฉพาะ
**Access:** Public  
**Rate Limit:** 100 requests/15min

**Query Parameters:**
```javascript
?increment_view=true
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "news": {
      "id": 1,
      "title": "เปิดตัวระบบ LMS ใหม่พร้อมฟีเจอร์ครบครัน",
      "slug": "new-lms-system-launch",
      "summary": "ระบบการจัดการเรียนรู้ใหม่พร้อมให้บริการแล้ว",
      "content": "<h2>รายละเอียดข่าว</h2><p>เรามีความยินดีที่จะประกาศเปิดตัวระบบ LMS ใหม่...</p>",
      "featuredImage": "/uploads/news/news_1_featured.jpg",
      "featuredImageAlt": "ระบบ LMS ใหม่",
      "newsType": "announcement",
      "priority": "high",
      "tags": ["lms", "announcement", "education", "technology"],
      "viewCount": 1251,
      "likeCount": 89,
      "shareCount": 45,
      "commentCount": 23,
      "isBreaking": false,
      "isFeatured": true,
      "isPinned": false,
      "allowComments": true,
      "publishedAt": "2025-01-15T10:30:00.000Z",
      "createdAt": "2025-01-14T15:20:00.000Z",
      "updatedAt": "2025-01-15T10:30:00.000Z",
      "expiresAt": null,
      "metaTitle": "เปิดตัวระบบ LMS ใหม่ | LMS Platform",
      "metaDescription": "ระบบการจัดการเรียนรู้ใหม่พร้อมฟีเจอร์ที่ทันสมัย",
      "author": {
        "id": 5,
        "firstName": "อาจารย์",
        "lastName": "สมชาย",
        "email": "teacher@example.com",
        "profilePhoto": "/uploads/profiles/teacher_5.jpg",
        "bio": "ผู้อำนวยการวิชาการที่มีประสบการณ์ 15 ปี",
        "role": "teacher"
      },
      "category": {
        "id": 1,
        "name": "ประกาศทั่วไป",
        "slug": "general-announcements",
        "description": "ข่าวประกาศและสาระสำคัญทั่วไป",
        "color": "#007bff",
        "icon": "megaphone"
      }
    },
    "relatedNews": [
      {
        "id": 2,
        "title": "การใช้งานระบบ LMS เบื้องต้น",
        "slug": "lms-basic-usage-guide",
        "summary": "คู่มือการใช้งานระบบ LMS สำหรับผู้เริ่มต้น",
        "featuredImage": "/uploads/news/news_2_featured.jpg",
        "publishedAt": "2025-01-14T14:00:00.000Z"
      }
    ],
    "previousNext": {
      "previous": {
        "id": 2,
        "title": "ข่าวก่อนหน้า",
        "slug": "previous-news"
      },
      "next": {
        "id": 4,
        "title": "ข่าวถัดไป", 
        "slug": "next-news"
      }
    }
  }
}
```

---

## **AUTHENTICATED ENDPOINTS (Login Required)**

### 6. **POST** `/api/news` - สร้างข่าวใหม่
**Access:** Teacher/Admin  
**Rate Limit:** 10 posts/hour  
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "ข่าวใหม่: เปิดรับสมัครหลักสูตรใหม่",
  "slug": "new-course-enrollment-open", // optional - auto-generated if not provided
  "summary": "เปิดรับสมัครหลักสูตรใหม่ 3 หลักสูตร เริ่มต้นเดือนหน้า",
  "content": "<h2>รายละเอียดการสมัคร</h2><p>เรามีความยินดี...</p>",
  "categoryId": 1,
  "newsType": "announcement",
  "priority": "normal",
  "tags": ["enrollment", "courses", "announcement"],
  "featuredImage": "/uploads/news/temp_featured.jpg",
  "featuredImageAlt": "รูปประกอบการรับสมัคร",
  "isFeatured": false,
  "isPinned": false,
  "status": "draft",
  "scheduledAt": null,
  "expiresAt": "2025-03-15T23:59:59.000Z",
  "metaTitle": "เปิดรับสมัครหลักสูตรใหม่ | LMS Platform",
  "metaDescription": "สมัครหลักสูตรใหม่ 3 หลักสูตร เริ่มเรียนเดือนหน้า",
  "allowComments": true,
  "isBreaking": false
}
```

**Response Success (201):**
```json
{
  "success": true,
  "message": "สร้างข่าวสำเร็จ",
  "data": {
    "news": {
      "id": 25,
      "title": "ข่าวใหม่: เปิดรับสมัครหลักสูตรใหม่",
      "slug": "new-course-enrollment-open",
      "summary": "เปิดรับสมัครหลักสูตรใหม่ 3 หลักสูตร เริ่มต้นเดือนหน้า",
      "content": "<h2>รายละเอียดการสมัคร</h2><p>เรามีความยินดี...</p>",
      "status": "draft",
      "authorId": 5,
      "categoryId": 1,
      "createdAt": "2025-01-15T14:30:00.000Z",
      "isPublished": false
    }
  }
}
```

---

### 7. **PUT** `/api/news/:id` - แก้ไขข่าว
**Access:** Admin/Author only  
**Headers:** `Authorization: Bearer <token>`

**Request Body:** เหมือนกับ POST

**Response Success (200):**
```json
{
  "success": true,
  "message": "อัปเดตข่าวสำเร็จ",
  "data": {
    "news": {
      "id": 25,
      "title": "ข่าวใหม่: เปิดรับสมัครหลักสูตรใหม่ (แก้ไข)",
      "updatedAt": "2025-01-15T15:45:00.000Z"
    }
  }
}
```

---

### 8. **DELETE** `/api/news/:id` - ลบข่าว
**Access:** Admin/Author only  
**Headers:** `Authorization: Bearer <token>`

**Response Success (200):**
```json
{
  "success": true,
  "message": "ลบข่าวสำเร็จ"
}
```

---

### 9. **PATCH** `/api/news/:id/publish` - เผยแพร่/ยกเลิกเผยแพร่ข่าว
**Access:** Admin/Author only  
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "status": "published", // "draft", "published", "scheduled", "archived"
  "scheduledAt": "2025-01-20T08:00:00.000Z", // required if status = "scheduled"
  "reason": "เหตุผล (optional)"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "เผยแพร่ข่าวสำเร็จ",
  "data": {
    "news": {
      "id": 25,
      "status": "published",
      "publishedAt": "2025-01-15T15:00:00.000Z",
      "publishedBy": 5
    }
  }
}
```

---

### 10. **GET** `/api/news/my` - ดูข่าวของตัวเอง
**Access:** Teacher/Admin  
**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
```javascript
?page=1&limit=10&status=all
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "news": [
      {
        "id": 25,
        "title": "ข่าวของฉัน",
        "status": "draft",
        "createdAt": "2025-01-15T14:30:00.000Z",
        "publishedAt": null,
        "viewCount": 0,
        "category": {
          "name": "ประกาศทั่วไป"
        }
      }
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "limit": 10,
      "pages": 1
    },
    "summary": {
      "total": 5,
      "draft": 2,
      "published": 2,
      "scheduled": 1,
      "archived": 0
    }
  }
}
```

---

## **NEWS CATEGORY MANAGEMENT (Admin Only)**

### 11. **POST** `/api/news/categories` - สร้างหมวดหมู่ใหม่
**Access:** Admin only  
**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "หลักสูตรใหม่",
  "slug": "new-courses", // optional
  "description": "ข่าวเกี่ยวกับหลักสูตรใหม่ที่เปิดสอน",
  "color": "#28a745",
  "icon": "book-open",
  "isActive": true,
  "orderIndex": 5
}
```

**Response Success (201):**
```json
{
  "success": true,
  "message": "สร้างหมวดหมู่สำเร็จ",
  "data": {
    "category": {
      "id": 8,
      "name": "หลักสูตรใหม่",
      "slug": "new-courses",
      "color": "#28a745",
      "createdAt": "2025-01-15T16:00:00.000Z"
    }
  }
}
```

---

### 12. **PUT** `/api/news/categories/:id` - แก้ไขหมวดหมู่
**Access:** Admin only  
**Headers:** `Authorization: Bearer <token>`

**Request Body:** เหมือนกับ POST

**Response Success (200):**
```json
{
  "success": true,
  "message": "อัปเดตหมวดหมู่สำเร็จ",
  "data": {
    "category": {
      "id": 8,
      "name": "หลักสูตรใหม่ (แก้ไข)",
      "updatedAt": "2025-01-15T16:30:00.000Z"
    }
  }
}
```

---

### 13. **DELETE** `/api/news/categories/:id` - ลบหมวดหมู่
**Access:** Admin only  
**Headers:** `Authorization: Bearer <token>`

**Response Success (200):**
```json
{
  "success": true,
  "message": "ลบหมวดหมู่สำเร็จ"
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "ไม่สามารถลบหมวดหมู่ที่มีข่าวอยู่ได้"
}
```

---

## **ANALYTICS & REPORTING (Admin Only)**

### 14. **GET** `/api/news/analytics` - ดูสถิติข่าว
**Access:** Admin only  
**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
```javascript
?period=30
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalNews": 125,
      "publishedNews": 98,
      "draftNews": 20,
      "scheduledNews": 5,
      "archivedNews": 2,
      "recentNews": 15
    },
    "popularNews": [
      {
        "id": 1,
        "title": "JavaScript ES2025 Features",
        "slug": "javascript-es2025-features",
        "viewCount": 2845,
        "likeCount": 234,
        "shareCount": 89,
        "engagementRate": 91.5,
        "category": {
          "name": "เทคโนโลยี",
          "color": "#28a745"
        }
      }
    ],
    "categoryStats": [
      {
        "id": 1,
        "name": "ประกาศทั่วไป",
        "color": "#007bff",
        "newsCount": 35,
        "totalViews": 15250,
        "averageEngagement": 78.3
      }
    ],
    "trends": {
      "dailyViews": [
        {"date": "2025-01-10", "views": 1250},
        {"date": "2025-01-11", "views": 1345},
        {"date": "2025-01-12", "views": 1890}
      ],
      "topTags": [
        {"tag": "javascript", "count": 15, "totalViews": 8945},
        {"tag": "announcement", "count": 12, "totalViews": 6750}
      ]
    },
    "authorPerformance": [
      {
        "authorId": 5,
        "authorName": "อาจารย์สมชาย",
        "newsCount": 25,
        "totalViews": 45250,
        "averageEngagement": 89.3,
        "topNews": {
          "title": "ระบบใหม่เปิดตัว",
          "views": 2845
        }
      }
    ],
    "period": 30
  }
}
```

---

### 15. **POST** `/api/news/cron/publish-scheduled` - เผยแพร่ข่าวที่กำหนดเวลา
**Access:** Internal (API Key required)  
**Headers:** `X-API-Key: <internal-key>`

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "publishedCount": 3,
    "publishedNews": [
      {
        "id": 45,
        "title": "ข่าวที่กำหนดเวลา 1",
        "publishedAt": "2025-01-15T18:00:00.000Z"
      }
    ]
  },
  "message": "เผยแพร่ข่าวที่กำหนดเวลาสำเร็จ 3 ข่าว"
}
```

---

## 🔒 **Authentication & Permissions**

### **Access Levels:**
```javascript
// Public Access (ไม่ต้อง login)
- GET /api/news
- GET /api/news/featured
- GET /api/news/popular  
- GET /api/news/categories
- GET /api/news/:slug

// Student Access (login required)
- รอใช้งานในอนาคต (comment, like, share)

// Teacher Access
- POST /api/news (สร้างข่าว)
- PUT /api/news/:id (แก้ไขข่าวตัวเอง)
- DELETE /api/news/:id (ลบข่าวตัวเอง)
- PATCH /api/news/:id/publish (เผยแพร่ข่าวตัวเอง)
- GET /api/news/my (ดูข่าวตัวเอง)

// Admin Access (ทุก endpoint)
- ทุก endpoint + จัดการ categories
- GET /api/news/analytics
- POST /api/news/categories
- PUT /api/news/categories/:id
- DELETE /api/news/categories/:id
```

### **Rate Limiting:**
```javascript
// Public endpoints
generalLimiter: 100 requests/15min

// Content creation
contentCreationLimiter: 10 posts/hour (teachers)

// Role-based limiting
roleBasedLimiter: ตาม role ของผู้ใช้
```

---

## 📊 **Database Schema Reference**

### **News Table:**
```sql
CREATE TABLE news (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    summary TEXT,
    content TEXT NOT NULL,
    featured_image VARCHAR(255),
    featured_image_alt VARCHAR(255),
    
    -- Classification
    category_id INTEGER REFERENCES news_categories(id),
    news_type news_type DEFAULT 'general',
    priority news_priority DEFAULT 'normal',
    tags TEXT[],
    
    -- Publishing
    status news_status DEFAULT 'draft',
    scheduled_at TIMESTAMP,
    published_at TIMESTAMP,
    expires_at TIMESTAMP,
    
    -- SEO
    meta_title VARCHAR(255),
    meta_description VARCHAR(500),
    
    -- Engagement
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    
    -- Flags
    is_featured BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_breaking BOOLEAN DEFAULT FALSE,
    allow_comments BOOLEAN DEFAULT TRUE,
    
    -- External Link
    is_external_link BOOLEAN DEFAULT FALSE,
    external_url VARCHAR(500),
    
    -- Metadata
    author_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **News Categories Table:**
```sql
CREATE TABLE news_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#007bff',
    icon VARCHAR(50) DEFAULT 'newspaper',
    is_active BOOLEAN DEFAULT TRUE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🚀 **Frontend Integration Guide**

### **React Hook Example:**
```javascript
// useNews.js
import { useState, useEffect } from 'react';
import axios from 'axios';

export const useNews = (params = {}) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState(null);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/news', { params });
      setNews(response.data.data.news);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [params]);

  return { news, loading, pagination, refetch: fetchNews };
};
```

### **Vue Composable Example:**
```javascript
// useNews.js
import { ref, reactive, onMounted } from 'vue';
import axios from 'axios';

export function useNews(params = {}) {
  const news = ref([]);
  const loading = ref(false);
  const pagination = reactive({});

  const fetchNews = async () => {
    loading.value = true;
    try {
      const response = await axios.get('/api/news', { params });
      news.value = response.data.data.news;
      Object.assign(pagination, response.data.data.pagination);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      loading.value = false;
    }
  };

  onMounted(fetchNews);

  return { news, loading, pagination, fetchNews };
}
```

---

## 🛠️ **Validation Schemas**

### **News Creation Schema:**
```javascript
const newsCreateSchema = Joi.object({
  title: Joi.string().min(3).max(255).required(),
  slug: Joi.string().pattern(/^[a-z0-9-]+$/).optional(),
  summary: Joi.string().min(10).max(500).required(),
  content: Joi.string().min(10).max(50000).required(),
  categoryId: Joi.number().integer().positive().required(),
  newsType: Joi.string().valid('announcement', 'technology', 'course_update', 'system', 'event', 'general').default('general'),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal'),
  tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
  featuredImage: Joi.string().uri().optional(),
  status: Joi.string().valid('draft', 'published', 'scheduled', 'archived').default('draft'),
  scheduledAt: Joi.date().greater('now').optional(),
  isFeatured: Joi.boolean().default(false)
});
```

---

## 📧 **Email Notifications**

### **Email Events:**
```javascript
// Auto-triggered emails
'news_published' // เมื่อมีข่าวใหม่ถูกเผยแพร่
'breaking_news' // เมื่อมีข่าวด่วน
'weekly_digest' // สรุปข่าวรายสัปดาห์
'category_update' // เมื่อมีข่าวใหม่ในหมวดที่สนใจ

// Admin notifications
'news_submitted' // เมื่อครูส่งข่าวรออนุมัติ
'scheduled_published' // เมื่อข่าวที่กำหนดเวลาถูกเผยแพร่
```

---

## 🔄 **Real-time Features (Socket.io)**

### **Socket Events:**
```javascript
// Client -> Server
'join_news_room' // เข้าร่วม news notifications
'news_view' // track news viewing
'news_engagement' // track likes/shares

// Server -> Client
'breaking_news' // ข่าวด่วนใหม่
'news_published' // ข่าวใหม่ถูกเผยแพร่
'news_updated' // ข่าวถูกอัปเดต
'category_news' // ข่าวใหม่ในหมวดที่สนใจ
```

---

## 🎯 **SEO Features**

### **Auto-generated Elements:**
```javascript
// Meta tags
metaTitle: `${news.title} | LMS Platform`
metaDescription: news.summary.substring(0, 160)
canonical: `${baseUrl}/news/${news.slug}`

// Open Graph
ogTitle: news.title
ogDescription: news.summary
ogImage: news.featuredImage
ogType: 'article'

// JSON-LD Structured Data
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": news.title,
  "author": news.author.name,
  "datePublished": news.publishedAt
}
```

---

## 🔧 **Error Handling**

### **Common Error Codes:**
```javascript
// 400 Bad Request
'VALIDATION_ERROR' // ข้อมูลไม่ถูกต้อง
'INVALID_SLUG' // slug ไม่ถูกต้อง
'CATEGORY_NOT_FOUND' // ไม่พบหมวดหมู่

// 401 Unauthorized
'AUTHENTICATION_REQUIRED' // ต้อง login
'INVALID_TOKEN' // token ไม่ถูกต้อง

// 403 Forbidden
'INSUFFICIENT_PERMISSIONS' // สิทธิ์ไม่เพียงพอ
'AUTHOR_ONLY' // เฉพาะผู้เขียนเท่านั้น

// 404 Not Found
'NEWS_NOT_FOUND' // ไม่พบข่าว
'CATEGORY_NOT_FOUND' // ไม่พบหมวดหมู่

// 409 Conflict
'SLUG_ALREADY_EXISTS' // slug ซ้ำ
'CATEGORY_HAS_NEWS' // หมวดหมู่มีข่าวอยู่

// 429 Too Many Requests
'RATE_LIMIT_EXCEEDED' // เกินขีดจำกัดการใช้งาน
```

---

## ✅ **Ready for Production Features**

### **Implemented:**
- ✅ Complete CRUD operations
- ✅ Category management
- ✅ Publishing workflow
- ✅ SEO optimization
- ✅ View tracking
- ✅ Search and filtering
- ✅ Image handling
- ✅ Admin analytics
- ✅ Rate limiting
- ✅ Input validation
- ✅ Error handling
- ✅ Database optimization

### **Future Enhancements:**
- 🔄 Comment system
- 🔄 Like/reaction system
- 🔄 Share tracking
- 🔄 Email subscriptions
- 🔄 RSS feed
- 🔄 Push notifications
- 🔄 Advanced analytics
- 🔄 Content scheduling
- 🔄 Multi-language support
- 🔄 Content versioning

---

**Total News Endpoints: 15**  
**Production Ready: ✅**  
**Frontend Ready: ✅**

News system พร้อมสำหรับการใช้งานและการพัฒนา frontend แล้ว! 🎉