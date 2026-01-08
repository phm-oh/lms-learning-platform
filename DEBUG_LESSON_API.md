# 🐛 Debug Lesson API Error 500

## ปัญหา
API `/api/lessons/course/:courseId` return 500 Internal Server Error

## วิธี Debug

### 1. ตรวจสอบ Backend Terminal Logs
ดู error message ที่แท้จริงใน terminal ที่รัน backend:
```bash
cd backend
npm run dev
```

### 2. ตรวจสอบ Error Logs
ควรเห็น log messages:
- `🔍 Fetching lessons for course: 1`
- `✅ Found lessons: X`
- `📊 Getting progress for student...`
- `❌ Error fetching course lessons:` (ถ้ามี error)

### 3. ส่ง Error Message มา
กรุณาส่ง error message จาก backend terminal มาเพื่อช่วยแก้ไข

---

## สิ่งที่แก้ไขแล้ว

1. ✅ เพิ่ม error handling ใน controller
2. ✅ เพิ่ม error handling ใน Lesson model methods
3. ✅ เพิ่ม logging เพื่อ debug
4. ✅ เพิ่ม fallback สำหรับ methods ที่ไม่มี

---

## วิธีแก้ไขชั่วคราว

ถ้ายังมีปัญหา ให้ลอง:
1. Restart backend server
2. ตรวจสอบว่า database มี lessons หรือไม่
3. ตรวจสอบว่า student enroll แล้วหรือไม่


