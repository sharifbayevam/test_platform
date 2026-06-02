import React, { useState, useEffect } from 'react';
import axios from 'axios'; // 🚀 Node.js backendga so'rov yuborish uchun

import OquvchiPanel from './components/OquvchiPanel';
import AdminDashboard from './components/AdminDashboard.jsx';

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
  
  // 🔐 LOGIN LOGIKASI (NODE.JS + MONGODB BACKENDGA ULANGAN)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    
    if (!loginInput.trim() || !passwordInput.trim()) {
      alert("Iltimos, login va parolni kiriting!");
      return;
    }
    
    // 👨‍🏫 O'qituvchi (Admin) kirishi (O'zgarishsiz qoldi)
    if (loginInput.toLowerCase() === 'admin' && passwordInput === 'admin') {
      setRole('oqtuvchi');
      return;
    }
    
    // 👥 O'quvchi kirishi (Biz yaratgan Express Backend API'ga ulanadi)
    try {
      const res = await axios.post('http://localhost:5000/api/quizzes/students/login', {
        login: loginInput.trim(),
        password: passwordInput.trim()
      });

      if (res.data.success) {
        // Blok holatini tekshirish (agar student modelida spamStatus bo'lsa)
        if (res.data.student.spamStatus === 'blocked') {
          alert("❌ Siz tizim qoidalarini buzganingiz uchun bloklangansiz!");
          return;
        }
        
        // Muvaffaqiyatli kirganda ma'lumotlarni saqlash
        setCurrentUser(res.data.student);
        setRole('oquvchi-panel');
      }
    } catch (err) {
      console.error(err);
      // Backenddan kelgan aniq xatolik matnini ko'rsatish (Masalan: "Parol noto'g'ri!")
      alert("❌ Xatolik: " + (err.response?.data?.error || "Serverga ulanishda xato yuz berdi!"));
    }
  };
  
  const handleLogout = async () => {
    // 💡 Chiqib ketayotganda o'quvchi statusini OFFLINE qilish (Ixtiyoriy chiroyli funksiya)
    if (role === 'oquvchi-panel' && currentUser?._id) {
      try {
        await axios.post(`http://localhost:5000/api/quizzes/students/logout/${currentUser._id}`);
      } catch (e) {
        console.error("Logout status xatosi:", e);
      }
    }

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
            {darkMode ? '☀️' : '🌙'}
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
                placeholder="Talaba logini (masalan: farrux8)..." 
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