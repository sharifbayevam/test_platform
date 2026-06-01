import React, { useState, useEffect } from 'react';
import { db } from './firebase.js';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';

import OquvchiPanel from './components/OquvchiPanel';
import AdminDashboard from './components/AdminDashboard.jsx'; // 👈 Yangi keng panel boshqaruvchisi

export default function App() {
  const [role, setRole] = useState(() => localStorage.getItem('userRole') || 'home');
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });
  
  // 💡 LIGHT MODE / DARK MODE STATE
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode ? savedMode === 'dark' : true; 
  });
  
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  
  // LocalStorage bilan sinxronizatsiya
  useEffect(() => {
    localStorage.setItem('userRole', role);
    localStorage.setItem('themeMode', darkMode ? 'dark' : 'light');
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [role, currentUser, darkMode]);
  
  // LOGIN LOGIKASI
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    
    if (!loginInput.trim() || !passwordInput.trim()) {
      alert("Iltimos, login va parolni kiriting!");
      return;
    }
    
    // 👨‍🏫 O'qituvchi (Admin) kirishi
    if (loginInput.toLowerCase() === 'admin' && passwordInput === 'admin') {
      setRole('oqtuvchi');
      return;
    }
    
    // 👥 O'quvchi kirishi (Firebase ro'yxatidan izlash)
    try {
      const snap = await getDocs(collection(db, "students"));
      const studentsList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Bazada login maydoni 'login' yoki 'username' deb saqlangan bo'lishi mumkin, ikkalasini ham tekshiramiz
      const foundStudent = studentsList.find(
        s => (s.login?.trim() === loginInput.trim() || s.username?.trim() === loginInput.trim()) && 
             s.password?.trim() === passwordInput.trim()
      );
      
      if (foundStudent) {
        // Blok holatini tekshirish
        if (foundStudent.spamStatus === 'blocked') {
          alert("❌ Siz tizim qoidalarini buzganingiz uchun bloklangansiz! Qayta faollashtirish arizasini yuboring.");
          return;
        }
        setCurrentUser(foundStudent);
        setRole('oquvchi-panel');
      } else {
        alert("❌ Bunday loginli o'quvchi topilmadi yoki parol xato!");
      }
    } catch (err) {
      console.error(err);
      alert("Bazaga ulanishda xato yuz berdi!");
    }
  };
  
  const handleLogout = () => {
    setRole('home');
    setCurrentUser(null);
    setLoginInput('');
    setPasswordInput('');
    localStorage.removeItem('userRole');
    localStorage.removeItem('currentUser');
  };
  
  // 1️⃣ TIZIMGA KIRISH (HOME / LOGIN SAHIFA)
  if (role === 'home') {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'}`}>
        
        {/* Rejimni o'zgartirish */}
        <div className="absolute top-4 right-4">
          <button onClick={() => setDarkMode(!darkMode)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${darkMode ? 'bg-slate-900 border-slate-800 text-amber-400' : 'bg-white border-slate-300 text-slate-700'}`}>
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>

        <div className={`w-full max-w-md p-8 rounded-2xl shadow-2xl space-y-6 text-center border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <h1 className="text-2xl font-black bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent tracking-wider">EDU TEST PLATFORM</h1>
          <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Tizimga kirish uchun login va parolingizni yozing</p>
          
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
            <div>
              <label className={`text-[11px] font-bold uppercase tracking-wide block mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Foydalanuvchi logini</label>
              <input 
                type="text" 
                value={loginInput}
                onChange={(e) => setLoginInput(e.target.value)}
                placeholder="Login (admin yoki talaba logini)..." 
                className={`w-full rounded-xl px-4 py-3 text-xs focus:outline-none border ${darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'}`}
              />
            </div>
            <div>
              <label className={`text-[11px] font-bold uppercase tracking-wide block mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Parol</label>
              <input 
                type="password" 
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Parol kiriting..." 
                className={`w-full rounded-xl px-4 py-3 text-xs focus:outline-none border ${darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-500'}`}
              />
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-xs tracking-wider transition active:scale-95">
              KIRISH
            </button>
          </form>
        </div>
      </div>
    );
  }
  
  // 2️⃣ O'QUVCHI SIFATIDA TIZIMGA KIRGANDA (STUDENT PANEL)
  if (role === 'oquvchi-panel') {
    return (
      <OquvchiPanel 
        currentUser={currentUser} 
        onLogout={handleLogout} 
        darkMode={darkMode} 
        setDarkMode={setDarkMode} 
      />
    );
  }

  // 3️⃣ O'QITUVCHI SIFATIDA TIZIMGA KIRGANDA (KENGAYTIRILGAN ADMIN PANEL)
  return (
    <AdminDashboard 
      onLogout={handleLogout} 
      darkMode={darkMode} 
      setDarkMode={setDarkMode} 
    />
  );
}