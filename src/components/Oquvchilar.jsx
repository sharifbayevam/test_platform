import React, { useState } from 'react';
// 🟢 Firebase Firestore funksiyalari ulanmoqda
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase'; 
// 💎 Premium Alertlar uchun kutubxona
import Swal from 'sweetalert2';
import { LucideGuitar, BookOpen, LucidePiano, LucideListCheck, LucidePilcrow, LucidePillBottle, LucideImagePlus, LucideSaveAll, LucideSchool2, LucideLineStyle, LucidePlane, LucidePlusCircle } from 'lucide-react';

export default function Oquvchilar({ myStudents = [], quizzes = [], darkMode, fetchTeacherData }) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [allowedSubject, setAllowedSubject] = useState('');

  // 🎯 YARATILGAN TESTLARDAN FAN NOMLARINI AVTOMATIK SUG'URIB OLISH (TAKRORLANMAS QILIB)
  const dynamicSubjects = quizzes && quizzes.length > 0 
    ? [...new Set(quizzes.map(q => q.title || q.subject).filter(Boolean))]
    : [];

  // ✨ PREMIUM CUSTOM ALERT STILI (Dark/Light Mode moslashuvchan)
  const showToast = (title, icon = 'success') => {
    Swal.fire({
      title: title,
      icon: icon,
      background: darkMode ? '#0f172a' : '#ffffff', // slate-900 yoki white
      color: darkMode ? '#f8fafc' : '#0f172a',
      confirmButtonColor: '#4f46e5', // indigo-600
      timer: 3000,
      timerProgressBar: true,
      showClass: { popup: 'animate__animated animate__fadeInUp animate__faster' },
      hideClass: { popup: 'animate__animated animate__fadeOutDown animate__faster' }
    });
  };

  // ➕ YANGI O'QUVCHI QO'SHISH (FIREBASE)
  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!login.trim() || !password.trim() || !allowedSubject) {
      showToast("Iltimos, barcha maydonlarni to'ldiring!", "warning");
      return;
    }

    // O'quvchi logini takrorlanmasligini tekshirish
    const exists = myStudents.some(s => s.login && s.login.toLowerCase() === login.trim().toLowerCase());
    if (exists) {
      showToast("Bu loginli o'quvchi allaqachon mavjud!", "error");
      return;
    }

    try {
      // Yangi talabani Firestore'ga yozish
      await addDoc(collection(db, "students"), {
        login: login.trim(),
        password: password.trim(),
        allowedSubject: allowedSubject,
        spamStatus: "active", // active, pending, blocked
        createdAt: new Date().toISOString()
      });

      showToast("O'quvchi muvaffaqiyatli qo'shildi! 🚀", "success");
      setLogin('');
      setPassword('');
      setAllowedSubject('');
      
      if (fetchTeacherData) fetchTeacherData();

    } catch (err) {
      console.error("O'quvchi qo'shishda xato:", err);
      showToast("O'quvchini saqlashda xatolik yuz berdi!", "error");
    }
  };

  // 🗑️ PREMIUM O'QUVCHINI O'CHIRISH (MODAL OYNA)
  const handleDeleteStudent = async (id) => {
    Swal.fire({
      title: "Ishonchingiz komilmi?",
      text: "Ushbu o'quvchi tizimdan butunlay o'chiriladi!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ha, o'chirilsin!",
      cancelButtonText: "Yo'q, qolsin",
      background: darkMode ? '#0f172a' : '#ffffff',
      color: darkMode ? '#f8fafc' : '#0f172a',
      confirmButtonColor: '#e11d48', // rose-600
      cancelButtonColor: '#64748b', // slate-500
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteDoc(doc(db, "students", id));
          showToast("O'quvchi tizimdan o'chirildi! 🗑️", "success");
          if (fetchTeacherData) fetchTeacherData();
        } catch (err) {
          console.error("O'chirishda xato:", err);
          showToast("O'quvchini o'chirish imkoni bo'lmadi!", "error");
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* 🔴 1-QISM: O'QUVCHI QO'SHISH FORMASI */}
      <div className={`p-6 rounded-2xl border transition-all duration-300 ${darkMode ? 'bg-slate-900 border-slate-800 shadow-2xl' : 'bg-white border-slate-200 shadow-sm'}`}>
        <h3 className="text-sm font-black uppercase tracking-wider"><BookOpen size={22} /> Yangi O'quvchi Qo'shish</h3>
        <form onSubmit={handleAddStudent} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">LOGIN</label>
            <input 
              type="text" value={login} onChange={(e) => setLogin(e.target.value)} placeholder="Login kiriting"
              className={`w-full p-2.5 text-xs rounded-xl border focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'}`}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">PAROL</label>
            <input 
              type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Parol kiriting"
              className={`w-full p-2.5 text-xs rounded-xl border focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'}`}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">RUXSAT ETILGAN FAN</label>
            <select 
              value={allowedSubject} onChange={(e) => setAllowedSubject(e.target.value)}
              className={`w-full p-2.5 text-xs rounded-xl border focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'}`}
            >
              <option value=""> +Fanni tanlang... </option>
              {dynamicSubjects.map((subjectName, idx) => (
                <option key={idx} value={subjectName}>
                  {subjectName}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-3 px-4 rounded-xl transition active:scale-95 align-self-start flex items-center gap-1 justify-center">
            O'QUVCHINI QO'SHISH <LucidePlusCircle size={16} />
          </button>
        </form>
      </div>

      {/* 🔵 2-QISM: O'QUVCHILAR RO'YXATI JADVALI */}
      <div className={`p-6 rounded-2xl border transition-all duration-300 ${darkMode ? 'bg-slate-900 border-slate-800 shadow-2xl' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-black uppercase tracking-wider"><LucideListCheck size={22} /> O'quvchilar Ro'yxati</h3>
          <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
            Jami: {myStudents.length} ta o'quvchi
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-[11px] font-black uppercase text-slate-400 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Login</th>
                <th className="py-3 px-4">Parol</th>
                <th className="py-3 px-4">Ruxsat etilgan Fan</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="text-xs divide-y divide-slate-200/20 dark:divide-slate-800/40">
              {myStudents.map((student, index) => (
                <tr key={student.id} className={darkMode ? 'hover:bg-slate-950/40 text-slate-300' : 'hover:bg-slate-50 text-slate-700'}>
                  <td className="py-3 px-4 text-slate-500">{index + 1}</td>
                  <td className="py-3 px-4 font-bold text-indigo-400">{student.login}</td>
                  <td className="py-3 px-4 font-mono">{student.password}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase font-semibold text-[10px]">
                      {student.allowedSubject}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${student.spamStatus === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-rose-500/10 text-rose-400'}`}>
                      {student.spamStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => handleDeleteStudent(student.id)} className="bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white px-2 py-1 rounded-lg text-[10px] font-bold transition">
                      O'chirish
                    </button>
                  </td>
                </tr>
              ))}
              {myStudents.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-slate-500">Hozircha o'quvchilar mavjud emas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}