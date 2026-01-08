# 🔧 แก้ไขปัญหา Login ไม่ได้

## วิธีแก้ไขทันที

### วิธีที่ 1: Restart Backend Server (แนะนำ)
Rate limit เก็บข้อมูลใน memory ดังนั้น restart server จะ clear cache:

```bash
# หยุด backend server (Ctrl+C)
# แล้วรันใหม่
cd backend
npm run dev
```

### วิธีที่ 2: ตรวจสอบ Error Message
ดู error message ใน:
- Browser Console (F12)
- Backend Terminal

---

## สาเหตุที่เป็นไปได้

### 1. Rate Limiting (429 Too Many Requests)
- **แก้ไข:** Restart backend server
- **ป้องกัน:** Rate limit มี skip สำหรับ localhost ใน development แล้ว

### 2. Password ไม่ถูกต้อง
- ตรวจสอบว่าใช้ password ที่ถูกต้อง
- Student: `student123`
- Admin: `admin123`
- Teacher: `teacher123`

### 3. User Status ไม่ใช่ 'active'
- ตรวจสอบว่า user status เป็น 'active'
- ถ้าเป็น 'pending' จะ login ไม่ได้

### 4. Database Connection Error
- ตรวจสอบว่า database ทำงานอยู่
- ตรวจสอบ connection string ใน `.env`

---

## วิธีตรวจสอบ

1. **ดู Browser Console (F12)**
   - ดู error message
   - ดู status code (401, 403, 429, 500)

2. **ดู Backend Terminal**
   - ดู error logs
   - ดู SQL queries

3. **ทดสอบ API โดยตรง**
   ```bash
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"student1@lms-platform.com","password":"student123"}'
   ```

---

## User Credentials สำหรับทดสอบ

- **Student 1:** `student1@lms-platform.com` / `student123`
- **Student 2:** `student2@lms-platform.com` / `student123`
- **Admin:** `admin@lms-platform.com` / `admin123`
- **Teacher 1:** `teacher1@lms-platform.com` / `teacher123`

---

ลอง restart backend แล้วทดสอบอีกครั้งครับ


