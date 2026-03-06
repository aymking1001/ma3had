/**
 * خادم تطبيق مدرسة القرآن الكريم
 * اللغة: العربية
 */

require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const multer = require('multer');
const { google } = require('googleapis');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// إعداد قاعدة البيانات
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

app.use(cors());
app.use(express.json());

// إعداد Google Drive API
const drive = google.drive({
  version: 'v3',
  auth: new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  }),
});

// إعداد Multer لرفع الملفات
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// --- Middleware للتحقق من المستخدم (محاكاة) ---
const authenticateUser = (req, res, next) => {
  next();
};

// --- API Endpoints ---
// تسجيل الدخول
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'حسام' && password === '123456') {
    res.json({ success: true, message: 'تم تسجيل الدخول بنجاح', user: 'حسام' });
  } else {
    res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
  }
});

// إضافة طالب
app.post('/api/students', authenticateUser, async (req, res) => {
  const { name, age, guardian_name, grade } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO students (name, age, guardian_name, grade) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, age, guardian_name, grade]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('خطأ في إضافة الطالب:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء إضافة الطالب' });
  }
});

// جلب الطلاب
app.get('/api/students', authenticateUser, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM students ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('خطأ في جلب الطلاب:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب البيانات' });
  }
});

// رفع الدرس
app.post('/api/lessons', authenticateUser, upload.single('file'), async (req, res) => {
  const { student_id, lesson_date, surah_name, verses_covered } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: 'يجب رفع ملف الدرس' });
  }

  try {
    const fileMetadata = {
      name: `${surah_name}_${student_id}_${Date.now()}.pdf`,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
    };

    const media = {
      mimeType: req.file.mimetype,
      body: req.file.buffer,
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    });

    const fileLink = response.data.webViewLink;

    const lessonResult = await pool.query(
      'INSERT INTO lessons (student_id, lesson_date, surah_name, verses_covered, file_link) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [student_id, lesson_date, surah_name, verses_covered, fileLink]
    );

    res.status(201).json({
      message: 'تم حفظ الدرس ورفع الملف بنجاح',
      lesson: lessonResult.rows[0],
      fileLink: fileLink
    });

  } catch (error) {
    console.error('خطأ في رفع الملف وحفظ الدرس:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء معالجة الملف' });
  }
});

// جلب الدروس
app.get('/api/lessons', authenticateUser, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.*, s.name as student_name 
      FROM lessons l 
      JOIN students s ON l.student_id = s.id 
      ORDER BY l.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('خطأ في جلب الدروس:', error);
    res.status(500).json({ error: 'حدث خطأ' });
  }
});

app.listen(PORT, () => {
  console.log(`الخادم يعمل على المنفذ ${PORT}`);
});
