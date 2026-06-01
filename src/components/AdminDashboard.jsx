import React, { useState, useEffect } from 'react';
import { db } from '../firebase.js';
import { collection, onSnapshot } from 'firebase/firestore';

import Tahlil from './Tahlil.jsx';
import TestTuzish from './TestTuzish.jsx';
import Oquvchilar from './Oquvchilar.jsx';
import Arizalar from './Arizalar.jsx'; 

export default function AdminDashboard({ onLogout, darkMode, setDarkMode }) {
  const [activeTab, setActiveTab] = useState("tahlil"); 
  const [students, setStudents] = useState([]);
  const [quizzes, setQuizzes] = useState([]);

  useEffect(() => {
    const unsubStudents = onSnapshot(collection(db, "students"), (snapshot) => {
      const list = [];
      snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      setStudents(list);
    });
    const unsubQuizzes = onSnapshot(collection(db, "quizzes"), (snapshot) => {
      const list = [];
      snapshot.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      setQuizzes(list);
    });
    return () => {
      unsubStudents();
      unsubQuizzes();
    };
  }, []);

  const pendingCount = students.filter(s => s.spamStatus === 'pending').length;

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* 🔝 ENG TEPAGA YOPISHGAN PREMIUM NAVIGATSIYA PANEL */}
      <div className={`w-full border-b sticky top-0 z-50 backdrop-blur-md transition-all ${
        darkMode 
          ? 'bg-slate-900/90 border-slate-800/80 shadow-lg shadow-black/20' 
          : 'bg-white/85 border-slate-200/80 shadow-sm shadow-slate-100'
      }`}>
        <div className="w-full max-w-[1400px] mx-auto px-6 py-3.5 flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* 1. CHAP CHEKKA: LOGO */}
          <div className="flex items-center gap-2 shrink-0">
            <h1 className="text-lg font-black uppercase tracking-wider bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              🎓 EDU TEST PANEL
            </h1>
          </div>
          
          {/* 2. O'RTA QISM: PREMIUM MULTI-TAB BUTTONS */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 rounded-2xl border transition-all duration-300 md:flex-1 md:max-w-xl lg:max-w-2xl bg-opacity-40 shadow-inner">
            <button 
              onClick={() => setActiveTab("tahlil")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'tahlil' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                  : darkMode ? 'text-slate-400 hover:bg-slate-800/50 hover:text-white' : 'text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              📊 TAHLIL
            </button>
            
            <button 
              onClick={() => setActiveTab("test")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'test' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                  : darkMode ? 'text-slate-400 hover:bg-slate-800/50 hover:text-white' : 'text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              📝 TEST TUZISH
            </button>
            
            <button 
              onClick={() => setActiveTab("oquvchilar")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'oquvchilar' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                  : darkMode ? 'text-slate-400 hover:bg-slate-800/50 hover:text-white' : 'text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              👥 O'QUVCHILAR
            </button>

            <button 
              onClick={() => setActiveTab("arizalar")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-200 relative flex items-center gap-1.5 ${
                activeTab === 'arizalar' 
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30' 
                  : darkMode ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'bg-amber-50 text-amber-600 border border-amber-200/60 hover:bg-amber-100/80'
              }`}
            >
              <span>📩 ARIZALAR</span>
              {pendingCount > 0 && (
                <span className="h-5 w-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-black animate-bounce">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>

          {/* 3. O'NG CHEKKA: LIGHT/DARK MOD VA CHIQUV PANEL */}
          <div className="flex items-center gap-2.5 shrink-0 md:ml-auto">
            <button 
              onClick={() => setDarkMode(!darkMode)} 
              className={`p-2 px-3.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all duration-300 flex items-center gap-1 ${
                darkMode 
                  ? 'bg-slate-950 text-amber-400 border-slate-800 hover:bg-slate-900' 
                  : 'bg-white text-slate-700 border-slate-200 shadow-sm hover:bg-slate-50 hover:text-indigo-600'
              }`}
            >
              {darkMode ? '☀️ ' : '🌙 '}
            </button>
            <button 
              onClick={onLogout} 
              className={`px-1 py-2 text-sm font-black uppercase tracking-wider rounded-xl shadow-md transition-all duration-200 active:scale-95 ${
                darkMode 
                  ? 'bg-blue-900 hover:bg-blue-500 shadow-slate-950/40' 
                  : 'bg-slate-500 hover:bg-indigo-600 text-white shadow-rose-500/20'
              }`}
            >
              Chiqish
            </button>
          </div>

        </div>
      </div>

      {/* 🏢 AKTIV KONTENT RENDER QISMI */}
      <div className="max-w-7xl mx-auto p-4 md:p-6 mt-2">
        {activeTab === "tahlil" && <Tahlil myStudents={students} darkMode={darkMode} />}
        {activeTab === "test" && <TestTuzish quizzes={quizzes} darkMode={darkMode} fetchTeacherData={() => {}} />}
        {activeTab === "oquvchilar" && <Oquvchilar myStudents={students} quizzes={quizzes} darkMode={darkMode} fetchTeacherData={() => {}} />}
        {activeTab === "arizalar" && <Arizalar myStudents={students} darkMode={darkMode} fetchTeacherData={() => {}} />}
      </div>

    </div>
  );
}