import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:5000/api'; // غيّره للرابط على Render لاحقاً

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login');
  const [students, setStudents] = useState([]);
  const [lessons, setLessons] = useState([]);

  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [studentForm, setStudentForm] = useState({ name: '', age: '', guardian_name: '', grade: '' });
  const [lessonForm, setLessonForm] = useState({ student_id: '', lesson_date: '', surah_name: '', verses_covered: '', file: null });

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_URL}/login`, loginForm);
      if (res.data.success) {
        setUser(res.data.user);
        setView('dashboard');
        fetchData();
      }
    } catch (error) {
      alert('بيانات الدخول غير صحيحة');
    }
  };

  const fetchData = async () => {
    try {
      const [studentsRes, lessonsRes] = await Promise.all([
        axios.get(`${API_URL}/students`),
        axios.get(`${API_URL}/lessons`)
      ]);
      setStudents(studentsRes.data);
      setLessons(lessonsRes.data);
    } catch (error) {
      console.error('خطأ في جلب البيانات', error);
    }
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/students`, studentForm);
      alert('تم إضافة الطالب بنجاح');
      setStudentForm({ name: '', age: '', guardian_name: '', grade: '' });
      fetchData();
    } catch (error) {
      alert('حدث خطأ أثناء الإضافة');
    }
  };

  const handleAddLesson = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('student_id', lessonForm.student_id);
    formData.append('lesson_date', lessonForm.lesson_date);
    formData.append('surah_name', lessonForm.surah_name);
    formData.append('verses_covered', lessonForm.verses_covered);
    if (lessonForm.file) formData.append('file', lessonForm.file);

    try {
      await axios.post(`${API_URL}/lessons`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('تم حفظ الدرس ورفع الملف بنجاح');
      setLessonForm({ student_id: '', lesson_date: '', surah_name: '', verses_covered: '', file: null });
      fetchData();
    } catch (error) {
      alert('حدث خطأ أثناء حفظ الدرس');
    }
  };

  if (view === 'login') {
    return (
      <div className="login-container">
        <div className="login-box">
          <h2>تسجيل دخول المعلم</h2>
          <form onSubmit={handleLogin}>
            <input type="text" placeholder="اسم المستخدم" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} required />
            <input type="password" placeholder="كلمة المرور" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required />
            <button type="submit">دخول</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header>
        <h1>لوحة تحكم مدرسة القرآن الكريم</h1>
        <button onClick={() => { setUser(null); setView('login'); }}>تسجيل خروج</button>
      </header>

      <div className="content">
        <section className="card">
          <h3>إضافة طالب جديد</h3>
          <form onSubmit={handleAddStudent}>
            <input placeholder="اسم الطالب" value={studentForm.name} onChange={e => setStudentForm({...studentForm, name: e.target.value})} required />
            <input type="number" placeholder="العمر" value={studentForm.age} onChange={e => setStudentForm({...studentForm, age: e.target.value})} />
            <input placeholder="اسم ولي الأمر" value={studentForm.guardian_name} onChange={e => setStudentForm({...studentForm, guardian_name: e.target.value})} required />
            <input placeholder="الصف" value={studentForm.grade} onChange={e => setStudentForm({...studentForm, grade: e.target.value})} />
            <button type="submit">حفظ الطالب</button>
          </form>
        </section>

        <section className="card">
          <h3>تسجيل درس جديد</h3>
          <form onSubmit={handleAddLesson}>
            <select value={lessonForm.student_id} onChange={e => setLessonForm({...lessonForm, student_id: e.target.value})} required>
              <option value="">اختر الطالب</option>
              {students.map(student => <option key={student.id} value={student.id}>{student.name}</option>)}
            </select>
            <input type="date" value={lessonForm.lesson_date} onChange={e => setLessonForm({...lessonForm, lesson_date: e.target.value})} required />
            <input placeholder="اسم السورة" value={lessonForm.surah_name} onChange={e => setLessonForm({...lessonForm, surah_name: e.target.value})} required />
            <textarea placeholder="الآيات التي تم حفظها" value={lessonForm.verses_covered} onChange={e => setLessonForm({...lessonForm, verses_covered: e.target.value})} required></textarea>
            <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={e => setLessonForm({...lessonForm, file: e.target.files[0]})} required />
            <button type="submit">حفظ الدرس</button>
          </form>
        </section>

        <section className="card">
          <h3>قائمة الطلاب</h3>
          <ul>{students.map(s => <li key={s.id}>{s.name} - الصف: {s.grade} - ولي الأمر: {s.guardian_name}</li>)}</ul>
        </section>

        <section className="card">
          <h3>الدروس المسجلة</h3>
          <ul>{lessons.map(l => <li key={l.id}>الطالب: {l.student_name} - السورة: {l.surah_name} - التاريخ: {l.lesson_date} - <a href={l.file_link} target="_blank" rel="noopener noreferrer">رابط الملف</a></li>)}</ul>
        </section>
      </div>
    </div>
  );
}

export default App;
