# 🔧 แก้ไขปัญหา: My Courses และ Enrollments ว่างเปล่า

## ปัญหา
เมื่อ login เป็น `student1@lms-platform.com` แล้วเข้าไปที่ `/my-courses` และ `/enrollments` แต่ยังว่างเปล่า

## สาเหตุ
Seed data อาจจะยังไม่ได้รัน หรือรันแล้วแต่ enrollments ยังไม่ถูกสร้าง

## วิธีแก้ไข

### วิธีที่ 1: รัน Seed Enrollments (แนะนำ)
รัน script เพื่อเพิ่ม enrollments ให้กับ users ที่มีอยู่แล้ว:

```bash
cd backend
npm run db:seed-enrollments
```

หรือ

```bash
cd backend
node src/utils/database/seedEnrollments.js
```

### วิธีที่ 2: Reset Database ทั้งหมด
ถ้าต้องการเริ่มใหม่ทั้งหมด:

```bash
cd backend
npm run db:reset
```

หรือ

```bash
cd backend
node src/utils/database/reset.js
```

### วิธีที่ 3: รัน Full Seed
ถ้ายังไม่มีข้อมูลเลย:

```bash
cd backend
npm run db:seed
```

หรือ

```bash
cd backend
node src/utils/database/seed.js
```

---

## หลังจากรัน Seed Enrollments

### ข้อมูลที่จะถูกสร้าง:
- **5 enrollments:**
  - Alice (student1) → Calculus (25% progress)
  - Bob (student2) → Calculus (50% progress)
  - Alice (student1) → Web Development (67% progress)
  - Carol (student3) → Web Development (0% progress)
  - Bob (student2) → Physics (0% progress)

- **Lesson Progress:**
  - Alice's progress ใน Calculus และ Web Development
  - Bob's progress ใน Calculus

---

## ทดสอบอีกครั้ง

1. **Login** เป็น `student1@lms-platform.com` / `student123`
2. ไปที่ **My Courses** - ควรเห็น 2 หลักสูตร:
   - Introduction to Calculus (25%)
   - Web Development Fundamentals (67%)
3. ไปที่ **My Enrollments** - ควรเห็น 2 enrollments:
   - Introduction to Calculus (อนุมัติแล้ว)
   - Web Development Fundamentals (อนุมัติแล้ว)
4. คลิก **"เรียนต่อ"** หรือ **"เริ่มเรียน"** เพื่อเข้า Course Learning Page

---

## หมายเหตุ

- Script `seedEnrollments.js` จะลบ enrollments และ lesson progress เก่าทั้งหมดก่อนสร้างใหม่
- ต้องมี users และ courses อยู่แล้วใน database
- ถ้ายังไม่มี users/courses ให้รัน `npm run db:seed` ก่อน


