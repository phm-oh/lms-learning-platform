# ⚠️ หมายเหตุสำคัญ (Important Notes)

## 🔴 ปัญหาที่เกิดขึ้นบ่อย - rejectionReason Field

### ปัญหา
**`column "rejection_reason" does not exist`** - เกิด error นี้บ่อยมาก!

### สาเหตุ
- Sequelize model `Enrollment` มี field `rejectionReason` ที่ map ไปยัง `rejection_reason` ใน database
- แต่ database table `enrollments` **ไม่มี column `rejection_reason`** จริงๆ
- เมื่อ Sequelize query โดยอัตโนมัติจะพยายาม SELECT field นี้และเกิด error

### วิธีแก้ไข
**ต้อง exclude field `rejectionReason` จากทุก query ที่ใช้ Enrollment model:**

```javascript
// ✅ ถูกต้อง - ต้อง exclude เสมอ
const enrollment = await Enrollment.findOne({
  where: { ... },
  attributes: {
    exclude: ['rejectionReason'] // ⚠️ สำคัญมาก!
  }
});

// ❌ ผิด - จะเกิด error
const enrollment = await Enrollment.findOne({
  where: { ... }
  // ไม่มี exclude จะ query rejectionReason และเกิด error
});
```

### ไฟล์ที่ต้องระวัง
เมื่อแก้ไขหรือเพิ่ม code ที่ใช้ `Enrollment` model ต้องระวัง:

1. **`backend/src/middleware/auth.js`**
   - `isEnrolledOrTeacher` middleware
   - ✅ แก้ไขแล้ว

2. **`backend/src/controllers/lesson.js`**
   - `getCourseActions` function
   - ✅ แก้ไขแล้ว

3. **`backend/src/controllers/course.js`**
   - `getMyEnrollments` function
   - ✅ แก้ไขแล้ว

4. **`backend/src/models/lesson/Lesson.js`**
   - `isAccessibleToStudent` method (ใช้ Enrollment.findOne)
   - ⚠️ ต้องตรวจสอบ

5. **ไฟล์อื่นๆ ที่ใช้ Enrollment model**
   - ⚠️ ต้องตรวจสอบทุกครั้ง

### Checklist ก่อน Commit
- [ ] ตรวจสอบว่าใช้ `Enrollment.findOne()` หรือ `Enrollment.findAll()` หรือไม่
- [ ] เพิ่ม `attributes: { exclude: ['rejectionReason'] }` ในทุก query
- [ ] ทดสอบว่าไม่เกิด error `column "rejection_reason" does not exist`

### วิธีแก้ไขถาวร (แนะนำในอนาคต)
1. **Option 1:** เพิ่ม column `rejection_reason` ใน database (ต้องทำ migration)
2. **Option 2:** ลบ field `rejectionReason` ออกจาก Enrollment model (ถ้าไม่ใช้)

### หมายเหตุ
- ปัญหานี้เกิดขึ้นแล้ว **หลายครั้ง** ใน:
  - `getMyEnrollments` controller
  - `isEnrolledOrTeacher` middleware
  - `getCourseActions` controller
  - และอื่นๆ

---

## 📝 วิธีป้องกันในอนาคต

### 1. สร้าง Helper Function
```javascript
// backend/src/utils/enrollmentHelper.js
const getEnrollmentQuery = (whereClause) => ({
  where: whereClause,
  attributes: {
    exclude: ['rejectionReason']
  }
});

// ใช้งาน
const enrollment = await Enrollment.findOne(
  getEnrollmentQuery({
    courseId: 1,
    studentId: 8,
    status: 'approved'
  })
);
```

### 2. เพิ่ม Default Scope ใน Model
```javascript
// backend/src/models/course/Enrollment.js
Enrollment.addScope('defaultScope', {
  attributes: {
    exclude: ['rejectionReason']
  }
});
```

### 3. ใช้ Model Method
```javascript
// สร้าง method ใน Enrollment model
Enrollment.findWithoutRejectionReason = function(whereClause) {
  return this.findOne({
    where: whereClause,
    attributes: {
      exclude: ['rejectionReason']
    }
  });
};
```

---

## 🎯 สรุป

**ทุกครั้งที่ใช้ Enrollment model ต้อง:**
1. ✅ เพิ่ม `attributes: { exclude: ['rejectionReason'] }`
2. ✅ ทดสอบว่าไม่เกิด error
3. ✅ ตรวจสอบไฟล์นี้ก่อน commit

**อย่าลืม!** ปัญหานี้เกิดขึ้นบ่อยมาก ต้องระวังทุกครั้งที่แก้ไข code ที่เกี่ยวข้องกับ Enrollment

---

**อัปเดตล่าสุด:** 2025-01-27  
**จำนวนครั้งที่เกิดปัญหา:** 3+ ครั้ง


