# 📊 สรุปสถานะโครงการ LMS Learning Platform (kruOh-IT)

**อัปเดตล่าสุด:** 2025-01-27  
**เวอร์ชัน:** 1.0.1

---

## 📋 สารบัญ

1. [Admin Panel Features](#admin-panel-features)
2. [Public Pages](#public-pages)
3. [Student Features](#student-features)
4. [Teacher Features](#teacher-features)
5. [Backend API Endpoints](#backend-api-endpoints)
6. [System Features](#system-features)
7. [Missing Features](#missing-features)

---

## 🎯 Admin Panel Features

### ✅ Phase 1: Admin Dashboard
- [x] **Admin Dashboard Page** (`/admin/dashboard`)
  - [x] แสดงสถิติระบบ (users, courses, enrollments, quizzes)
  - [x] Charts และ graphs (user roles, course status)
  - [x] Recent activities
  - [x] Quick actions (อนุมัติ teacher, จัดการผู้ใช้)
  - [x] API: `GET /api/admin/dashboard`

### ✅ Phase 2: User Management
- [x] **Admin Users Management Page** (`/admin/users`)
  - [x] ตารางแสดงผู้ใช้ทั้งหมด (search, filter, pagination)
  - [x] Filter by role (student, teacher, admin)
  - [x] Filter by status (active, pending, suspended, banned)
  - [x] Actions: อนุมัติ teacher, เปลี่ยน status, แก้ไขข้อมูล, ลบ
  - [x] Modal สำหรับ approve/reject teacher
  - [x] Modal สำหรับแก้ไขข้อมูลผู้ใช้ (ชื่อ, email, phone, etc.)
  - [x] API: `GET /api/admin/users`, `PUT /api/admin/users/:id`, `PUT /api/admin/users/:id/approve`, `PUT /api/admin/users/:id/status`, `DELETE /api/admin/users/:id`

### ✅ Phase 3: Course Management
- [x] **Admin Courses Management Page** (`/admin/courses`)
  - [x] ตารางแสดงหลักสูตรทั้งหมด
  - [x] Filter by status (published, draft)
  - [x] Search และ pagination
  - [x] Actions: ดูรายละเอียด, publish/unpublish, แก้ไข, ลบ
  - [x] แสดงสถิติการลงทะเบียน
  - [x] API: `GET /api/admin/courses`, `PUT /api/admin/courses/:id/status`

### ✅ Phase 4: News Management
- [x] **Admin News Management Page** (`/admin/news`)
  - [x] ตารางแสดงข่าวทั้งหมด (search, filter, pagination)
  - [x] Filter by status (published, draft, scheduled, archived)
  - [x] Actions: ดู, publish/unpublish/archive, แก้ไข, ลบ
  - [x] สรุปสถิติ (total, published, draft, scheduled, views)
  - [x] API: `GET /api/news/admin/all`, `POST /api/news`, `PUT /api/news/:id`, `DELETE /api/news/:id`, `PATCH /api/news/:id/publish`

- [x] **Admin News Form Page** (`/admin/news/create`, `/admin/news/:id/edit`)
  - [x] Form สำหรับสร้าง/แก้ไขข่าว
  - [x] Rich text editor สำหรับเนื้อหา
  - [x] จัดการ tags และ keywords
  - [x] Upload featured image
  - [x] Publishing settings (scheduled, expires)
  - [x] SEO settings (meta title, meta description)
  - [x] Validation และ error handling

### ✅ Phase 5: Settings
- [x] **Admin Settings Page** (`/admin/settings`)
  - [x] **System Health Tab**
    - [x] แสดงสถานะระบบ (database, memory)
    - [x] Performance metrics
    - [x] Refresh button
    - [x] API: `GET /api/admin/health`
  
  - [x] **Maintenance Mode Tab**
    - [x] แสดงสถานะ maintenance mode
    - [x] Form สำหรับตั้งค่า message และ duration
    - [x] Enable/Disable buttons
    - [x] API: `POST /api/admin/maintenance`
  
  - [x] **Backup Tab**
    - [x] เลือกประเภท backup (full, database, files)
    - [x] สร้าง backup
    - [x] แสดง backup history
    - [x] แสดงตำแหน่ง backup files
    - [x] API: `POST /api/admin/backup`
  
  - [x] **System Logs Tab**
    - [x] ตารางแสดง system logs
    - [x] Filter by level (info, warning, error)
    - [x] Pagination
    - [x] API: `GET /api/admin/logs`

### ❌ Phase 6: Analytics (ยังไม่ทำ)
- [ ] **Admin Analytics Page** (`/admin/analytics`)
  - [ ] Dashboard analytics
  - [ ] User growth charts (daily, weekly, monthly)
  - [ ] Course enrollment statistics
  - [ ] News views/engagement analytics
  - [ ] Revenue/activity reports
  - [ ] Export reports (PDF/Excel)
  - [ ] API: `GET /api/admin/analytics` (ยังไม่มี)

---

## 🌐 Public Pages

### ✅ Homepage
- [x] **Home Page** (`/`)
  - [x] Hero section พร้อม branding "kruOh-IT"
  - [x] Navigation logic:
    - [x] "เริ่มเรียนฟรี" → `/login` (ถ้าไม่ login) หรือ `/dashboard` (ถ้า login แล้ว)
    - [x] "เรียนรู้เพิ่มเติม" → `/about`
    - [x] "ดูหลักสูตรทั้งหมด" → `/courses`
  - [x] แสดงหลักสูตรที่มีในปัจจุบัน
  - [x] Features section
  - [x] ไม่ต้อง login เพื่อเข้าดู

### ✅ About Us
- [x] **About Us Page** (`/about`)
  - [x] ข้อมูลเกี่ยวกับครูภาณุเมศ ชุมภูนท์
  - [x] วัตถุประสงค์ของเว็บไซต์
  - [x] ข้อมูลเกี่ยวกับวิทยาลัยอาชีวศึกษาอุดรธานี
  - [x] ไม่ต้อง login เพื่อเข้าดู

### ✅ Courses Listing
- [x] **Courses Page** (`/courses`)
  - [x] แสดงรายการหลักสูตรทั้งหมด
  - [x] Search และ filter
  - [x] Pagination
  - [x] ไม่ต้อง login เพื่อเข้าดู

### ✅ Authentication
- [x] **Login Page** (`/login`)
  - [x] Form validation
  - [x] Error handling (แสดง error messages จาก backend)
  - [x] Redirect ตาม role หลัง login
  - [x] API: `POST /api/auth/login`

- [x] **Register Page** (`/register`)
  - [x] Form validation (client-side และ backend)
  - [x] Role selection (student, teacher)
  - [x] Password confirmation validation
  - [x] Success message สำหรับ pending teacher accounts
  - [x] API: `POST /api/auth/register`

---

## 👨‍🎓 Student Features

### ✅ Dashboard
- [x] **Student Dashboard** (`/dashboard`)
  - [x] Welcome message พร้อมชื่อผู้ใช้
  - [x] สถิติ (courses enrolled, lessons completed, quizzes taken)
  - [x] My Courses section
  - [x] Monthly Progress chart
  - [x] Today's Activity
  - [x] Upcoming Quizzes
  - [x] API: ใช้ mock data (ยังไม่มี backend endpoint)

### ✅ Course Enrollment (เสร็จแล้ว)
- [x] **Course Enrollment System**
  - [x] หน้า Course Detail (`/courses/:id`)
  - [x] ปุ่ม "ลงทะเบียน" สำหรับ student
  - [x] แสดงสถานะการลงทะเบียน (pending, approved, rejected)
  - [x] API: `POST /api/courses/:id/enroll`

- [x] **My Enrollments Page** (`/enrollments`)
  - [x] แสดงรายการการลงทะเบียนทั้งหมด
  - [x] Filter by status
  - [x] API: `GET /api/enrollments/my`

- [x] **My Courses Page** (`/my-courses`)
  - [x] แสดงรายการหลักสูตรที่ลงทะเบียนแล้ว (approved)
  - [x] แสดง progress ของแต่ละหลักสูตร
  - [x] API: `GET /api/enrollments/my`

### ✅ Course Learning (เสร็จแล้ว)
- [x] **Course Learning Page** (`/courses/:id/learn`)
  - [x] แสดงรายการ lessons
  - [x] Video player สำหรับ video lessons
  - [x] แสดงเอกสารประกอบ
  - [x] Progress tracking
  - [x] Navigation ระหว่าง lessons
  - [x] แสดง quizzes ของหลักสูตร
  - [x] API: `GET /api/lessons/course/:courseId`, `POST /api/lessons/:id/progress`, `POST /api/lessons/:id/complete`

- [x] **Lesson Detail Page** (`/courses/:courseId/lessons/:lessonId`)
  - [x] แสดงเนื้อหา lesson
  - [x] Video player
  - [x] Attachments
  - [x] Mark as complete button
  - [x] Navigation (Previous/Next lesson)
  - [x] API: `GET /api/lessons/:id`

### ✅ Quiz System (เสร็จแล้ว)
- [x] **Quiz Taking Page** (`/courses/:courseId/quizzes/:quizId`)
  - [x] แสดงคำถาม
  - [x] Multiple choice, true/false, essay
  - [x] Timer (ถ้ามี)
  - [x] Auto-save answers
  - [x] Submit quiz
  - [x] API: `POST /api/quizzes/:id/attempt`, `POST /api/quizzes/:id/answer`, `POST /api/quizzes/:id/submit`

- [x] **Quiz Results Page** (`/courses/:courseId/quizzes/:quizId/results/:attemptId`)
  - [x] แสดงคะแนน
  - [x] แสดงคำตอบที่ถูกต้อง/ผิด
  - [x] Review answers
  - [x] แสดงสถานะ "รอการตรวจ" สำหรับ essay questions
  - [x] API: `GET /api/quizzes/:id/attempt/:attemptId`

### ❌ Student Progress (ยังไม่ทำ)
- [ ] **Progress Tracking**
  - [ ] แสดง progress ของแต่ละหลักสูตร
  - [ ] แสดง lessons ที่ complete แล้ว
  - [ ] แสดงคะแนน quiz
  - [ ] API: `GET /api/analytics/student/:id` (มี backend แล้ว แต่ยังไม่มี frontend)

---

## 👨‍🏫 Teacher Features

### ✅ Teacher Dashboard (เสร็จแล้ว)
- [x] **Teacher Dashboard** (`/teacher/dashboard`)
  - [x] สถิติหลักสูตรที่สอน
  - [x] จำนวนนักเรียน
  - [x] จำนวน lessons และ quizzes
  - [x] Recent courses
  - [x] API: `GET /api/courses/my-teaching`

### ✅ Course Management (เสร็จแล้ว)
- [x] **Create Course Page** (`/teacher/courses/create`)
  - [x] Form สำหรับสร้างหลักสูตร
  - [x] ฟิลด์: title, description, category, difficulty, duration, tags, prerequisites, learning objectives
  - [x] Validation (client-side และ backend)
  - [x] API: `POST /api/courses`

- [x] **Edit Course Page** (`/teacher/courses/:id/edit`)
  - [x] Form สำหรับแก้ไขหลักสูตร
  - [x] Publish/Unpublish
  - [x] API: `PUT /api/courses/:id`, `PATCH /api/courses/:id/publish`

- [x] **My Courses Page** (`/teacher/courses`)
  - [x] แสดงรายการหลักสูตรที่สอน (ทั้ง published และ draft)
  - [x] Filter by status
  - [x] Actions: แก้ไข, ลบ, publish/unpublish, จัดการ quizzes
  - [x] แสดงสถิติ (lessons, quizzes, enrollments)
  - [x] API: `GET /api/courses/my-teaching`

### ❌ Lesson Management (ยังไม่ทำ)
- [ ] **Create Lesson Page** (`/teacher/courses/:id/lessons/create`)
  - [ ] Form สำหรับสร้าง lesson
  - [ ] Upload video
  - [ ] Upload attachments
  - [ ] API: `POST /api/lessons` (มี backend แล้ว แต่ยังไม่มี frontend)

- [ ] **Edit Lesson Page** (`/teacher/courses/:id/lessons/:lessonId/edit`)
  - [ ] Form สำหรับแก้ไข lesson
  - [ ] Publish/Unpublish
  - [ ] API: `PUT /api/lessons/:id`, `PATCH /api/lessons/:id/publish`

### ✅ Quiz Management (เสร็จแล้วบางส่วน)
- [x] **Quiz List Page** (`/teacher/courses/:courseId/quizzes`)
  - [x] แสดงรายการ quizzes ของหลักสูตร
  - [x] แสดงสถานะ (published, active, draft)
  - [x] Actions: แก้ไข, ลบ, publish/unpublish, activate/deactivate
  - [x] API: `GET /api/quizzes/course/:courseId/teacher`

- [x] **Create Quiz Page** (`/teacher/courses/:courseId/quizzes/create`)
  - [x] Form สำหรับสร้าง quiz
  - [x] ตั้งค่าพื้นฐาน (title, description, time limit, max attempts, passing score)
  - [x] Quiz settings (isActive, allowRetake, availableFrom, availableUntil)
  - [x] Course-level หรือ Lesson-level selection
  - [x] Order index
  - [x] API: `POST /api/quizzes`

- [x] **Edit Quiz Page** (`/teacher/courses/:courseId/quizzes/:quizId/edit`)
  - [x] Form สำหรับแก้ไข quiz
  - [x] แก้ไข settings
  - [ ] แก้ไขคำถาม (ยังไม่ทำ - ต้องเพิ่ม question management)
  - [x] API: `PUT /api/quizzes/:id`

- [ ] **Quiz Results Page (Teacher View)** (`/teacher/courses/:id/quizzes/:quizId/results`)
  - [ ] แสดงผลลัพธ์ของนักเรียนทั้งหมด
  - [ ] Statistics (average score, pass rate)
  - [ ] API: `GET /api/quizzes/:id/results` (ยังไม่มี)

### ❌ Student Management (ยังไม่ทำ)
- [ ] **Course Students Page** (`/teacher/courses/:id/students`)
  - [ ] แสดงรายการนักเรียนที่ลงทะเบียน
  - [ ] Approve/Reject enrollments
  - [ ] ดู progress ของนักเรียน
  - [ ] API: `GET /api/courses/:id/students`, `PUT /api/courses/:id/students/:studentId`

---

## 🔧 Backend API Endpoints

### ✅ Authentication (เสร็จแล้ว)
- [x] `POST /api/auth/register` - สมัครสมาชิก
- [x] `POST /api/auth/login` - เข้าสู่ระบบ
- [x] `GET /api/auth/profile` - ดูข้อมูลโปรไฟล์
- [x] `PATCH /api/auth/profile` - แก้ไขข้อมูลโปรไฟล์
- [x] `PATCH /api/auth/change-password` - เปลี่ยนรหัสผ่าน
- [x] `POST /api/auth/forgot-password` - ลืมรหัสผ่าน
- [x] `PATCH /api/auth/reset-password/:token` - รีเซ็ตรหัสผ่าน

### ✅ Admin APIs (เสร็จแล้ว)
- [x] `GET /api/admin/dashboard` - Dashboard overview
- [x] `GET /api/admin/users` - จัดการผู้ใช้
- [x] `GET /api/admin/users/:id` - ดูข้อมูลผู้ใช้
- [x] `PUT /api/admin/users/:id` - แก้ไขข้อมูลผู้ใช้
- [x] `PUT /api/admin/users/:id/approve` - อนุมัติ/ปฏิเสธ teacher
- [x] `PUT /api/admin/users/:id/status` - เปลี่ยน status
- [x] `DELETE /api/admin/users/:id` - ลบผู้ใช้
- [x] `GET /api/admin/courses` - ดูหลักสูตรทั้งหมด
- [x] `PUT /api/admin/courses/:id/status` - เปลี่ยนสถานะหลักสูตร
- [x] `GET /api/admin/health` - System health
- [x] `GET /api/admin/logs` - System logs
- [x] `POST /api/admin/backup` - สร้าง backup
- [x] `POST /api/admin/maintenance` - Toggle maintenance mode
- [x] `POST /api/admin/export` - Export data

### ✅ News APIs (เสร็จแล้ว)
- [x] `GET /api/news` - ดูข่าวทั้งหมด (public)
- [x] `GET /api/news/:slug` - ดูข่าวรายละเอียด (public)
- [x] `GET /api/news/featured` - ดูข่าวเด่น (public)
- [x] `GET /api/news/popular` - ดูข่าวยอดนิยม (public)
- [x] `GET /api/news/categories` - ดูหมวดหมู่ข่าว (public)
- [x] `GET /api/news/admin/all` - ดูข่าวทั้งหมด (admin)
- [x] `POST /api/news` - สร้างข่าว (admin/teacher)
- [x] `PUT /api/news/:id` - แก้ไขข่าว (admin/author)
- [x] `DELETE /api/news/:id` - ลบข่าว (admin/author)
- [x] `PATCH /api/news/:id/publish` - Publish/unpublish (admin/author)
- [x] `POST /api/news/categories` - สร้างหมวดหมู่ (admin)
- [x] `PUT /api/news/categories/:id` - แก้ไขหมวดหมู่ (admin)
- [x] `DELETE /api/news/categories/:id` - ลบหมวดหมู่ (admin)
- [x] `GET /api/news/analytics` - Analytics (admin)

### ✅ Course APIs (เสร็จแล้ว)
- [x] `GET /api/courses` - ดูรายการหลักสูตร
- [x] `GET /api/courses/:id` - ดูรายละเอียดหลักสูตร
- [x] `POST /api/courses` - สร้างหลักสูตร (teacher)
- [x] `PUT /api/courses/:id` - แก้ไขหลักสูตร (teacher)
- [x] `DELETE /api/courses/:id` - ลบหลักสูตร (teacher)
- [x] `PATCH /api/courses/:id/publish` - Publish/unpublish
- [x] `POST /api/courses/:id/enroll` - ลงทะเบียนหลักสูตร (student)
- [x] `GET /api/courses/:id/students` - ดูนักเรียน (teacher)
- [x] `PUT /api/courses/:id/students/:studentId` - อนุมัติ/ปฏิเสธ (teacher)
- [x] `GET /api/courses/my-teaching` - ดูหลักสูตรที่สอน (teacher) 🆕
- [x] `GET /api/courses/categories` - ดูหมวดหมู่หลักสูตร 🆕
- [x] `GET /api/enrollments/my` - ดูการลงทะเบียนของตัวเอง (student) 🆕

### ✅ Lesson APIs (มี backend แล้ว แต่ยังไม่มี frontend)
- [x] `GET /api/lessons/course/:courseId` - ดู lessons ของหลักสูตร
- [x] `GET /api/lessons/:id` - ดูรายละเอียด lesson
- [x] `POST /api/lessons` - สร้าง lesson (teacher)
- [x] `PUT /api/lessons/:id` - แก้ไข lesson (teacher)
- [x] `DELETE /api/lessons/:id` - ลบ lesson (teacher)
- [x] `PATCH /api/lessons/:id/publish` - Publish/unpublish
- [x] `POST /api/lessons/:id/progress` - บันทึก progress (student)
- [x] `POST /api/lessons/:id/complete` - Mark as complete (student)

### ✅ Quiz APIs (เสร็จแล้ว)
- [x] `GET /api/quizzes/course/:courseId` - ดู quizzes ของหลักสูตร (student)
- [x] `GET /api/quizzes/course/:courseId/teacher` - ดู quizzes ของหลักสูตร (teacher) 🆕
- [x] `POST /api/quizzes` - สร้าง quiz (teacher)
- [x] `PUT /api/quizzes/:id` - แก้ไข quiz (teacher) 🆕
- [x] `DELETE /api/quizzes/:id` - ลบ quiz (teacher) 🆕
- [x] `PATCH /api/quizzes/:id/publish` - Publish/unpublish quiz (teacher) 🆕
- [x] `PATCH /api/quizzes/:id/active` - Activate/deactivate quiz (teacher) 🆕
- [x] `POST /api/quizzes/:id/attempt` - เริ่มทำ quiz (student)
- [x] `POST /api/quizzes/:id/answer` - ตอบคำถาม (student)
- [x] `POST /api/quizzes/:id/submit` - ส่ง quiz (student)

### ✅ Upload APIs (มี backend แล้ว แต่ยังไม่มี frontend)
- [x] `POST /api/upload/profile` - Upload profile photo
- [x] `POST /api/upload/course/:courseId/thumbnail` - Upload course thumbnail
- [x] `POST /api/upload/lesson/:lessonId/video` - Upload lesson video
- [x] `POST /api/upload/lesson/:lessonId/documents` - Upload lesson documents
- [x] `POST /api/upload/files` - Upload general files

### ❌ Missing APIs (ยังไม่มี)
- [ ] `GET /api/courses/my` - ดูหลักสูตรของตัวเอง (student/teacher)
- [ ] `GET /api/enrollments/my` - ดูการลงทะเบียนของตัวเอง (student)
- [ ] `GET /api/quizzes/:id/results` - ดูผลลัพธ์ quiz (teacher)
- [ ] `PUT /api/quizzes/:id` - แก้ไข quiz (teacher)
- [ ] `GET /api/quizzes/:id/attempt/:attemptId` - ดูผลลัพธ์การทำ quiz (student)

---

## 🛠️ System Features

### ✅ Authentication & Authorization
- [x] JWT authentication
- [x] Role-based access control (student, teacher, admin)
- [x] Protected routes
- [x] Token refresh
- [x] Password hashing (bcrypt)

### ✅ Database
- [x] PostgreSQL database
- [x] Sequelize ORM
- [x] Migrations
- [x] Models (User, Course, Lesson, Quiz, Enrollment, News, etc.)

### ✅ Validation
- [x] Joi validation (backend)
- [x] Client-side validation (frontend)
- [x] Error messages (Thai language)

### ✅ File Upload
- [x] Multer middleware
- [x] Image processing (Sharp)
- [x] File validation
- [x] Static file serving

### ✅ Error Handling
- [x] Global error handler
- [x] Custom error classes
- [x] Error logging
- [x] User-friendly error messages

### ✅ Security
- [x] Rate limiting
- [x] CORS configuration
- [x] Helmet.js (security headers)
- [x] Input sanitization

### ✅ UI/UX
- [x] Dark mode support
- [x] Responsive design
- [x] Loading states
- [x] Error states
- [x] Toast notifications (ยังไม่มี library)

---

## 📝 Missing Features (สรุป)

### High Priority
1. **Student Course Enrollment**
   - Course detail page
   - Enrollment flow
   - My enrollments page
   - My courses page

2. **Course Learning System**
   - Course learning page
   - Lesson detail page
   - Progress tracking
   - Video player

3. **Quiz System**
   - Quiz taking page
   - Quiz results page
   - Quiz management (teacher)

4. **Teacher Dashboard & Course Management**
   - Teacher dashboard
   - Create/Edit course pages
   - Lesson management
   - Quiz management
   - Student management

### Medium Priority
5. **Admin Analytics**
   - Analytics dashboard
   - Charts และ graphs
   - Export reports

6. **Notification System**
   - In-app notifications
   - Email notifications
   - Push notifications (optional)

7. **Search Functionality**
   - Global search
   - Course search
   - News search

### Low Priority
8. **User Profile**
   - Profile page
   - Edit profile
   - Change password
   - Upload profile photo

9. **Settings & Preferences**
   - User settings
   - Notification preferences
   - Language preferences

10. **Public News Detail Page**
    - News detail page
    - Comments (optional)
    - Share functionality

---

## 📊 สรุปความคืบหน้า

### ✅ เสร็จแล้ว (Completed)
- **Admin Panel:** 5/6 phases (83%)
- **Public Pages:** 100%
- **Authentication:** 100%
- **Backend APIs:** ~80%

### 🚧 กำลังทำ (In Progress)
- ไม่มี

### ❌ ยังไม่ทำ (Not Started)
- **Student Features:** 0%
- **Teacher Features:** 0%
- **Admin Analytics:** 0%
- **Notification System:** 0%

---

## 🎯 Next Steps (แนะนำ)

### Phase 1: Student Course Enrollment (Priority: High)
1. สร้าง Course Detail Page (`/courses/:id`)
2. สร้าง Enrollment flow
3. สร้าง My Enrollments Page (`/enrollments`)
4. สร้าง My Courses Page (`/courses/my`)

### Phase 2: Course Learning System (Priority: High)
1. สร้าง Course Learning Page (`/courses/:id/learn`)
2. สร้าง Lesson Detail Page
3. Implement progress tracking
4. Integrate video player

### Phase 3: Quiz System (Priority: High)
1. สร้าง Quiz Taking Page
2. สร้าง Quiz Results Page
3. สร้าง Quiz Management (teacher)

### Phase 4: Teacher Features (Priority: Medium)
1. สร้าง Teacher Dashboard
2. สร้าง Course Management (create/edit)
3. สร้าง Lesson Management
4. สร้าง Student Management

### Phase 5: Admin Analytics (Priority: Low)
1. สร้าง Analytics Dashboard
2. Implement charts
3. Export functionality

---

**หมายเหตุ:** ไฟล์นี้จะอัปเดตเมื่อมีการเปลี่ยนแปลงในโครงการ

