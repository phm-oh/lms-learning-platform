# 📝 Quiz System Design - Hybrid Model

## ⚠️ IMPORTANT: แนวทางการออกแบบ Quiz System

### ✅ Hybrid Model (Course-level + Lesson-level)

**ระบบรองรับการสร้าง Quiz ได้ 2 แบบ:**
1. **Course-level Quiz** - Quiz ระดับรายวิชา (lessonId = null)
2. **Lesson-level Quiz** - Quiz ระดับบทเรียน (lessonId = lesson.id)

**UI ของครูต้องรองรับ:**
- ✅ เลือกได้ว่า Quiz จะอยู่ที่ Course หรือ Lesson
- ✅ มีการเรียงลำดับ (orderIndex) สำหรับทั้ง Course-level และ Lesson-level

ระบบรองรับการสร้าง Quiz ได้ 2 แบบ:

#### 1. Course-level Quiz
- **ตำแหน่ง:** อยู่ในระดับ Course (ไม่ผูกกับ Lesson)
- **ใช้สำหรับ:**
  - Final Exam (สอบปลายภาค)
  - Midterm Exam (สอบกลางภาค)
  - Review Quiz (ทบทวนก่อนสอบ)
  - Comprehensive Assessment (ประเมินรวม)
- **Database:**
  ```javascript
  {
    courseId: 1,
    lessonId: null,  // ไม่ผูกกับ lesson
    orderIndex: 1,   // เรียงลำดับใน course
    quizType: 'final_exam'
  }
  ```
- **แสดงผล:** Course Learning Page

#### 2. Lesson-level Quiz
- **ตำแหน่ง:** อยู่ในระดับ Lesson (ผูกกับ Lesson)
- **ใช้สำหรับ:**
  - Lesson Quiz (ทดสอบหลังเรียนบทเรียน)
  - Practice Quiz (ฝึกทำ)
  - Lesson Assessment (ประเมินบทเรียน)
- **Database:**
  ```javascript
  {
    courseId: 1,
    lessonId: 5,     // ผูกกับ lesson
    orderIndex: 1,   // เรียงลำดับใน lesson
    quizType: 'practice'
  }
  ```
- **แสดงผล:** Lesson Detail Page

---

## 🔧 Technical Implementation

### Database Schema
```sql
quizzes (
  id INTEGER PRIMARY KEY,
  course_id INTEGER NOT NULL,
  lesson_id INTEGER NULL,        -- NULL = Course-level, NOT NULL = Lesson-level
  order_index INTEGER DEFAULT 0,  -- เรียงลำดับ
  title VARCHAR(255),
  quiz_type ENUM('practice', 'assessment', 'final_exam'),
  ...
)
```

### Model Fields
- `courseId` (required) - รายวิชา
- `lessonId` (optional) - บทเรียน (null = Course-level)
- `orderIndex` (required) - เรียงลำดับ (0, 1, 2, ...)
- `quizType` - ประเภท quiz

### API Endpoints
- `GET /api/quizzes/course/:courseId` - ดึง Course-level quizzes
- `GET /api/quizzes/lesson/:lessonId` - ดึง Lesson-level quizzes
- `POST /api/quizzes` - สร้าง quiz (ระบุ courseId และ lessonId)
- `PUT /api/quizzes/:id` - แก้ไข quiz (รวม orderIndex)

---

## 🎨 UI Requirements

### Teacher Quiz Management

#### 1. Quiz Creation Form
- **Course Selection:** เลือกรายวิชา (required)
- **Lesson Selection:** เลือกบทเรียน (optional)
  - ถ้าเลือก = Lesson-level Quiz
  - ถ้าไม่เลือก = Course-level Quiz
- **Order Index:** เรียงลำดับ (0, 1, 2, ...)
- **Quiz Type:** practice, assessment, final_exam
- **Other Fields:** title, description, timeLimit, maxAttempts, etc.

#### 2. Quiz List View
- **แยกแสดง:**
  - Course-level Quizzes (lessonId = null)
  - Lesson-level Quizzes (grouped by lesson)
- **Drag & Drop:** จัดเรียงลำดับ (orderIndex)
- **Filter:** กรองตาม quizType, lesson

#### 3. Quiz Edit Form
- แก้ไขได้ทุก field รวมถึง:
  - เปลี่ยนจาก Course-level เป็น Lesson-level (หรือกลับกัน)
  - เปลี่ยน orderIndex

---

## 📋 Business Rules

### 1. Order Index
- **Course-level:** เรียงลำดับใน Course (0, 1, 2, ...)
- **Lesson-level:** เรียงลำดับใน Lesson (0, 1, 2, ...)
- **Auto-increment:** ถ้าไม่ระบุ ให้ใช้ค่าสูงสุด + 1

### 2. Display Rules
- **Course Learning Page:**
  - แสดงเฉพาะ Course-level Quizzes (lessonId = null)
  - เรียงตาม orderIndex
- **Lesson Detail Page:**
  - แสดงเฉพาะ Lesson-level Quizzes (lessonId = lesson.id)
  - เรียงตาม orderIndex

### 3. Access Control
- **Course-level Quiz:** ต้อง enroll course แล้ว
- **Lesson-level Quiz:** ต้องเรียน lesson นั้นเสร็จแล้ว (หรือตาม prerequisites)

---

## 🎯 Best Practices

### 1. Naming Convention
- **Course-level:** "Final Exam", "Midterm Exam", "Review Quiz"
- **Lesson-level:** "Quiz - [Lesson Title]", "Practice - [Lesson Title]"

### 2. Order Index Guidelines
- **Course-level:**
  - 0-9: Practice/Review Quizzes
  - 10-19: Midterm Exams
  - 20+: Final Exams
- **Lesson-level:**
  - 0: Main Quiz
  - 1+: Additional Practice Quizzes

### 3. Quiz Type Usage
- **practice:** ฝึกทำ (ไม่นับคะแนน)
- **assessment:** ประเมิน (นับคะแนน)
- **final_exam:** สอบปลายภาค (สำคัญ)

---

## 📝 Notes

### ⚠️ Important
- Quiz สามารถอยู่ใน Course หรือ Lesson ได้
- ต้องระบุ orderIndex เพื่อเรียงลำดับ
- UI ของครูต้องรองรับการเลือกตำแหน่ง (Course/Lesson)
- UI ของครูต้องรองรับการเรียงลำดับ (orderIndex)

### ✅ Current Status

#### Backend (เสร็จแล้ว)
- ✅ Database schema รองรับแล้ว (courseId, lessonId, orderIndex)
- ✅ Quiz Model มี orderIndex field
- ✅ API endpoints รองรับแล้ว:
  - `POST /api/quizzes` - สร้าง quiz (รองรับ courseId, lessonId, orderIndex)
  - `PUT /api/quizzes/:id` - แก้ไข quiz (รองรับ courseId, lessonId, orderIndex)
  - `GET /api/quizzes/course/:courseId` - ดึง quizzes (เรียงตาม orderIndex)
- ✅ Auto-calculate orderIndex ถ้าไม่ระบุ
- ✅ เรียงลำดับ: Course-level (null) มาก่อน, แล้วตามด้วย Lesson-level

#### Frontend (ยังต้องทำ)
- ⏳ Teacher Quiz Management UI
- ⏳ Quiz Creation Form (เลือก Course/Lesson, orderIndex)
- ⏳ Quiz Edit Form (แก้ไข courseId, lessonId, orderIndex)
- ⏳ Quiz List View (แยกแสดง Course-level และ Lesson-level)
- ⏳ Order Index Management (Drag & Drop หรือ manual input)

---

**อัปเดตล่าสุด:** 2025-01-27

