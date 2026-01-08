# รายการ API Endpoints ที่ยังขาดสำหรับ Frontend

ไฟล์นี้รวบรวม API endpoints ที่ Frontend ต้องการแต่ยังไม่มีใน Backend หรือต้องปรับปรุง

## 📋 สารบัญ
1. [Course Management](#course-management)
2. [Enrollment System](#enrollment-system)
3. [Student Dashboard](#student-dashboard)
4. [Course Browsing](#course-browsing)
5. [Notification System](#notification-system)
6. [Settings & Preferences](#settings--preferences)

---

## 🎓 Course Management

### 1. GET `/api/courses` - ดูรายการวิชาทั้งหมด (สำหรับ Student)
**Status:** ✅ มีอยู่แล้ว  
**Note:** ต้องแน่ใจว่าแสดงเฉพาะ published courses และมีข้อมูล enrollment status

**Response ที่ต้องการ:**
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": 1,
        "title": "JavaScript Fundamentals",
        "description": "...",
        "thumbnail": "...",
        "enrollmentStatus": null, // หรือ "pending", "approved", "rejected"
        "enrollmentCount": 125,
        "teacher": { ... }
      }
    ],
    "pagination": { ... }
  }
}
```

### 2. GET `/api/courses/my` - ดูรายการวิชาที่ลงทะเบียนแล้ว
**Status:** ❌ ยังไม่มี  
**Priority:** สูง

**Description:** สำหรับ Student ดูรายการวิชาที่ตัวเองลงทะเบียนแล้ว (approved)

**Response ที่ต้องการ:**
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": 1,
        "title": "JavaScript Fundamentals",
        "progress": 45.5,
        "enrollment": {
          "status": "approved",
          "enrolledAt": "2025-01-10T09:00:00.000Z"
        },
        "lastAccessed": "2025-01-15T08:30:00.000Z",
        "completedLessons": 9,
        "totalLessons": 20
      }
    ]
  }
}
```

---

## 📝 Enrollment System

### 3. GET `/api/enrollments/my` - ดูสถานะการลงทะเบียนของตัวเอง
**Status:** ❌ ยังไม่มี  
**Priority:** สูง

**Description:** สำหรับ Student ดูรายการการลงทะเบียนทั้งหมด (pending, approved, rejected)

**Response ที่ต้องการ:**
```json
{
  "success": true,
  "data": {
    "enrollments": [
      {
        "id": 15,
        "courseId": 1,
        "course": {
          "title": "JavaScript Fundamentals",
          "thumbnail": "..."
        },
        "status": "pending",
        "requestedAt": "2025-01-15T14:30:00.000Z",
        "approvedAt": null,
        "rejectedAt": null,
        "reason": null
      }
    ]
  }
}
```

### 4. DELETE `/api/courses/:id/enroll` - ยกเลิกการลงทะเบียน
**Status:** ❌ ยังไม่มี  
**Priority:** ปานกลาง

**Description:** สำหรับ Student ยกเลิกการลงทะเบียนที่ยัง pending หรือ withdraw จาก course

---

## 📊 Student Dashboard

### 5. GET `/api/students/dashboard` - ข้อมูล Dashboard สำหรับ Student
**Status:** ❌ ยังไม่มี  
**Priority:** สูงมาก

**Description:** รวมข้อมูลทั้งหมดที่ต้องการแสดงใน Dashboard

**Response ที่ต้องการ:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalCourses": 5,
      "activeCourses": 3,
      "completedCourses": 2,
      "totalLessonsCompleted": 45,
      "totalQuizzesTaken": 28,
      "averageScore": 78.5,
      "totalStudyTime": 2340 // minutes
    },
    "recentCourses": [
      {
        "id": 1,
        "title": "JavaScript Fundamentals",
        "progress": 85.5,
        "lastAccessed": "2025-01-15T08:30:00.000Z",
        "nextLesson": {
          "id": 10,
          "title": "Async/Await"
        }
      }
    ],
    "upcomingQuizzes": [
      {
        "id": 5,
        "title": "JavaScript Basics Quiz",
        "course": "JavaScript Fundamentals",
        "dueDate": "2025-01-20T23:59:59.000Z",
        "timeLimit": 30
      }
    ],
    "recentActivity": [
      {
        "type": "lesson_completed",
        "message": "เสร็จสิ้นบทเรียน: Introduction to JavaScript",
        "timestamp": "2025-01-15T10:30:00.000Z"
      }
    ],
    "monthlyProgress": [
      { "month": "Jan", "value": 20 },
      { "month": "Feb", "value": 45 }
    ]
  }
}
```

---

## 🔍 Course Browsing

### 6. GET `/api/courses/browse` - ดูรายการวิชาสำหรับลงทะเบียน
**Status:** ⚠️ มีแต่ต้องปรับ  
**Priority:** สูง

**Description:** ดูรายการวิชาที่ยังไม่ได้ลงทะเบียน หรือสามารถลงทะเบียนได้

**Query Parameters:**
- `category` - หมวดหมู่
- `search` - ค้นหา
- `level` - ระดับ (beginner, intermediate, advanced)
- `page`, `limit` - pagination

**Response ที่ต้องการ:**
```json
{
  "success": true,
  "data": {
    "courses": [
      {
        "id": 1,
        "title": "JavaScript Fundamentals",
        "description": "...",
        "thumbnail": "...",
        "level": "beginner",
        "enrollmentCount": 125,
        "rating": 4.8,
        "teacher": { ... },
        "category": { ... },
        "canEnroll": true, // ยังไม่ได้ลงทะเบียน
        "enrollmentStatus": null
      }
    ],
    "pagination": { ... },
    "filters": { ... }
  }
}
```

---

## 🔔 Notification System

### 7. GET `/api/notifications` - ดูการแจ้งเตือน
**Status:** ❌ ยังไม่มี  
**Priority:** สูง

**Description:** ดูการแจ้งเตือนทั้งหมดของ user

**Query Parameters:**
- `page`, `limit` - pagination
- `unread` - เฉพาะที่ยังไม่อ่าน (true/false)

**Response ที่ต้องการ:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": 1,
        "type": "enrollment_approved",
        "title": "การลงทะเบียนได้รับการอนุมัติ",
        "message": "คุณได้รับการอนุมัติให้เรียนวิชา JavaScript Fundamentals",
        "read": false,
        "createdAt": "2025-01-15T10:30:00.000Z",
        "link": "/my-courses/1"
      }
    ],
    "unreadCount": 5,
    "pagination": { ... }
  }
}
```

### 8. PATCH `/api/notifications/:id/read` - ทำเครื่องหมายว่าอ่านแล้ว
**Status:** ❌ ยังไม่มี  
**Priority:** ปานกลาง

### 9. PATCH `/api/notifications/read-all` - ทำเครื่องหมายว่าอ่านทั้งหมดแล้ว
**Status:** ❌ ยังไม่มี  
**Priority:** ปานกลาง

---

## ⚙️ Settings & Preferences

### 10. GET `/api/settings` - ดูการตั้งค่า
**Status:** ❌ ยังไม่มี  
**Priority:** ต่ำ

**Description:** ดูการตั้งค่าต่างๆ ของ user (preferences, notifications, etc.)

### 11. PATCH `/api/settings` - อัปเดตการตั้งค่า
**Status:** ❌ ยังไม่มี  
**Priority:** ต่ำ

---

## 📚 Assignment System

### 12. GET `/api/assignments/my` - ดู Assignment ของตัวเอง
**Status:** ❌ ยังไม่มี  
**Priority:** ปานกลาง

**Description:** สำหรับ Student ดู Assignment ที่ได้รับมอบหมาย

**Response ที่ต้องการ:**
```json
{
  "success": true,
  "data": {
    "assignments": [
      {
        "id": 1,
        "title": "สร้าง Todo App ด้วย React",
        "course": "React for Beginners",
        "description": "...",
        "dueDate": "2025-01-25T23:59:59.000Z",
        "status": "pending", // pending, submitted, graded
        "submittedAt": null,
        "grade": null
      }
    ]
  }
}
```

---

## 📝 Quiz System (เพิ่มเติม)

### 13. GET `/api/quizzes/my` - ดู Quiz ที่ต้องทำ
**Status:** ⚠️ มีแต่ต้องปรับ  
**Priority:** สูง

**Description:** สำหรับ Student ดู Quiz ที่ต้องทำ (ยังไม่ได้ทำ, กำลังทำ, เสร็จแล้ว)

**Response ที่ต้องการ:**
```json
{
  "success": true,
  "data": {
    "quizzes": [
      {
        "id": 1,
        "title": "JavaScript Basics Quiz",
        "course": "JavaScript Fundamentals",
        "timeLimit": 30,
        "maxAttempts": 3,
        "attempts": [
          {
            "attemptNumber": 1,
            "score": 85,
            "submittedAt": "2025-01-12T10:30:00.000Z"
          }
        ],
        "canRetake": true,
        "nextAttemptAvailable": true
      }
    ]
  }
}
```

---

## 📖 Lesson System (เพิ่มเติม)

### 14. GET `/api/lessons/my` - ดูบทเรียนที่ต้องเรียน
**Status:** ❌ ยังไม่มี  
**Priority:** ปานกลาง

**Description:** สำหรับ Student ดูบทเรียนทั้งหมดที่ต้องเรียน (จาก courses ที่ลงทะเบียนแล้ว)

---

## 🎯 Summary

### Priority สูงมาก (ต้องมีก่อน)
1. ✅ GET `/api/students/dashboard` - Dashboard data
2. ✅ GET `/api/courses/my` - My enrolled courses
3. ✅ GET `/api/enrollments/my` - My enrollment status

### Priority สูง (ควรมี)
4. ✅ GET `/api/notifications` - Notifications
5. ✅ GET `/api/courses/browse` - Browse courses (ปรับปรุง)
6. ✅ GET `/api/quizzes/my` - My quizzes (ปรับปรุง)

### Priority ปานกลาง
7. ✅ DELETE `/api/courses/:id/enroll` - Cancel enrollment
8. ✅ GET `/api/assignments/my` - My assignments
9. ✅ PATCH `/api/notifications/:id/read` - Mark notification as read

### Priority ต่ำ
10. ✅ GET/PATCH `/api/settings` - User settings
11. ✅ GET `/api/lessons/my` - My lessons

---

## 📝 Notes

- API endpoints ที่มีอยู่แล้วแต่ต้องปรับปรุง: ระบุด้วย ⚠️
- API endpoints ที่ยังไม่มี: ระบุด้วย ❌
- API endpoints ที่มีอยู่แล้ว: ระบุด้วย ✅

**การใช้งาน:**
1. Backend team ใช้ไฟล์นี้เป็น reference สำหรับการพัฒนา API
2. Frontend team ใช้ไฟล์นี้เพื่อทราบว่า API ไหนพร้อมใช้งานแล้ว
3. Update status เมื่อ API พร้อมใช้งานแล้ว

