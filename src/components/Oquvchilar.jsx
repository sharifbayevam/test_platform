import React, { useState } from 'react';
import { db } from '../firebase.js';
import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';

export default function Oquvchilar({ myStudents = [], quizzes = [], fetchTeacherData, darkMode }) {
  const [name, setName] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [allowedSubject, setAllowedSubject] = useState("");

  // ➕ YANGI O'QUVCHI QO'SHISH
  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!name.trim() || !login.trim() || !password.trim()) {
      alert("Iltimos, Ism, Login va Parol maydonlarini to'ldiring!");
      return;
    }

    try {
      await addDoc(collection(db, "students"), {
        name: name.trim(),
        login: login.trim().toLowerCase(),
        password: password.trim(),
        allowedSubject: allowedSubject, 
        spamCount: 0,
        spamStatus: "active",
        latestScore: null
      });

      alert("🎉 Yangi o'quvchi muvaffaqiyatli qo'shildi!");
      setName("");
      setLogin("");
      setPassword("");
      setAllowedSubject("");
      
      if (fetchTeacherData) fetchTeacherData();
    } catch (err) {
      console.error("O'quvchi qo'shishda xatolik:", err);
      alert("Xatolik yuz berdi!");
    }
  };

  // 🗑️ O'QUVCHINI TIZIMDAN O'CHIRISH
  const handleDeleteStudent = async (id) => {
    if (confirm("Ushbu o'quvchini ro'yxatdan butunlay o'chirmoqchimisiz?")) {
      try {
        await deleteDoc(doc(db, "students", id));
        if (fetchTeacherData) fetchTeacherData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-xl font-sans tracking-wide">
      
      {/* 📥 1-KONTENT: YANGI O'QUVCHI QO'SHISH FORMASI */}
      <div className={`lg:col-span-5 p-6 rounded-3xl border transition-all duration-300 ${darkMode ? 'bg-slate-900 border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.3)]' : 'bg-white border-slate-200 shadow-[0_20px_40px_rgba(15,23,42,0.06)]'}`}>
        <div className="mb-6">
          <h3 className="font-black text-lg bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent uppercase flex items-center gap-2">
            <span>➕</span> Yangi O'quvchi Qo'shish
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Tizimga kirishi uchun profil yaratish</p>
        </div>

        <form onSubmit={handleAddStudent} className="space-y-4">
          {/* Ism Familiya */}
          <div>
            <label className={`block text-xs font-black uppercase tracking-wider mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Ism Familiya:</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)}
              placeholder="Ism va familiyani kiriting..." 
              className={`w-full rounded-2xl p-3.5 text-base font-semibold border-2 transition-all focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-600'}`}
            />
          </div>

          {/* Login */}
          <div>
            <label className={`block text-xs font-black uppercase tracking-wider mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Login:</label>
            <input 
              type="text" 
              value={login} 
              onChange={e => setLogin(e.target.value)}
              placeholder="Tizimga kirish logini..." 
              className={`w-full rounded-2xl p-3.5 text-base font-semibold border-2 transition-all focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-600'}`}
            />
          </div>

          {/* Parol */}
          <div>
            <label className={`block text-xs font-black uppercase tracking-wider mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Parol:</label>
            <input 
              type="text" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              placeholder="Profil paroli..." 
              className={`w-full rounded-2xl p-3.5 text-base font-semibold border-2 transition-all focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-600'}`}
            />
          </div>

          {/* 🎯 RUXSAT ETILGAN FAN (PREMIUM SELECT VARIANT BILAN BELGI) */}
          <div>
            <label className={`block text-xs font-black uppercase tracking-wider mb-1.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Ruxsat etilgan fan:</label>
            <div className="relative flex items-center">
              <select
                value={allowedSubject}
                onChange={e => setAllowedSubject(e.target.value)}
                className={`w-full rounded-2xl p-3.5 pr-12 text-base font-bold border-2 transition-all focus:outline-none appearance-none cursor-pointer ${
                  darkMode 
                    ? 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500' 
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-600'
                }`}
              >
                <option value="">🌍 Hamma fanlarni ko'rishga ruxsat</option>
                {quizzes && quizzes.map((q) => (
                  <option key={q.id} value={q.title}>
                    📖 {q.title}
                  </option>
                ))}
              </select>
              
              {/* 👁️ KO'ZGA TASHLANADIGAN CHIQYLI STRILKA (CHEVRON) */}
              <div className="absolute right-4 pointer-events-none flex items-center justify-center">
                <svg 
                  className={`h-5 w-5 transition-transform duration-300 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`} 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-md transition-all pt-4"
          >
            O'quvchini Bazaga Qo'shish 🚀
          </button>
        </form>
      </div>

      {/* 📋 2-KONTENT: O'QUVCHILAR RO'YXATI */}
      <div className={`lg:col-span-7 p-6 rounded-3xl border transition-all duration-300 ${darkMode ? 'bg-slate-900 border-slate-800 shadow-md' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h3 className="font-black text-lg text-slate-400 uppercase tracking-wider">👥 O'quvchilar Ro'yxati</h3>
            <p className="text-xs text-slate-500 mt-0.5">Tizimdagi faol va bloklangan talabalar</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-black ${darkMode ? 'bg-slate-800 text-indigo-400' : 'bg-slate-100 text-indigo-600'}`}>
            Jami: {myStudents.length} ta
          </span>
        </div>

        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
          {myStudents.length === 0 ? (
            <p className="text-xs text-slate-400 font-medium text-center py-12">Hozircha o'quvchilar mapsud emas.</p>
          ) : (
            myStudents.map((student) => {
              const isBlocked = student.spamStatus === 'blocked';
              
              return (
                <div 
                  key={student.id} 
                  className={`p-4 rounded-2xl border flex justify-between items-center transition-all ${
                    isBlocked 
                      ? (darkMode ? 'border-rose-950 bg-rose-950/10' : 'border-rose-200 bg-rose-50/50')
                      : (darkMode ? 'border-slate-800/80 bg-slate-950/40 hover:border-slate-700' : 'border-slate-200 bg-slate-50/50 hover:border-slate-300')
                  }`}
                >
                  <div className="flex-1 mr-4">
                    <div className="flex items-center gap-2">
                      <p className={`font-black text-base ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                        {student.name}
                      </p>
                      {isBlocked && (
                        <span className="bg-rose-500 text-white font-black text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-md animate-pulse">
                          Bloklangan
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-slate-400 font-semibold">
                      <span>🔑 Login: <b className={darkMode ? 'text-slate-300' : 'text-slate-700'}>{student.login}</b></span>
                      <span>🔒 Parol: <b className={darkMode ? 'text-slate-300' : 'text-slate-700'}>{student.password}</b></span>
                      {student.allowedSubject ? (
                        <span className="text-indigo-500 font-bold">📖 Fan: {student.allowedSubject}</span>
                      ) : (
                        <span className="text-emerald-500 font-bold">🌍 Barcha fanlar</span>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => handleDeleteStudent(student.id)} 
                    className="text-rose-500 hover:text-white font-black text-xs p-2.5 hover:bg-rose-500 rounded-xl transition-all"
                    title="O'quvchini butunlay o'chirish"
                  >
                    O'chirish 🗑️
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}