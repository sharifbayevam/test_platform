import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { GraduationCap } from 'lucide-react';
import { db } from "./components/firebase.js"; 

import OquvchiPanel from './components/OquvchiPanel';
import AdminDashboard from './components/AdminDashboard.jsx'; 
import { Award, Stamp, StepBack, StepForwardIcon, StickyNoteX, Unplug } from 'lucide-react';

export default function App() {
  const [role, setRole] = useState(() => localStorage.getItem('userRole') || 'home');
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });
  
  // 🌓 DARK / LIGHT MODE STATE
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode ? savedMode === 'dark' : true;
  });

  const [viewState, setViewState] = useState('home'); 
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  
  // Real-time rejimda ogohlantirish hisoblagichi (Tepada qizil bo'lib ko'rinishi uchun)
  const [liveCheats, setLiveCheats] = useState(0);

  // Mavzuni saqlash va yangilash EFFECT'i
  useEffect(() => {
    localStorage.setItem('themeMode', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // 🛡️ ANTI-CHEAT KUZATUVCHISI (Hech qanday alert oynalarisiz, faqat jonli hisoblash)
  useEffect(() => {
    if (role !== 'oquvchi-panel' || !currentUser?.login) return;

    // Firestore'dan o'quvchining cheaterlik holatini real-time kuzatish
    const studentsRef = collection(db, "students");
    const q = query(studentsRef, where("login", "==", currentUser.login));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.forEach((d) => {
        const data = d.data();
        setLiveCheats(data.cheats || 0);
        
        // Agar boshqa joyda yoki shu yerda bloklangan bo'lsa, to'g'ridan-to'g'ri ekranga otish
        if (data.spamStatus === 'blocked') {
          setRole('home');
          setViewState('student-blocked-screen');
          localStorage.clear();
        }
      });
    });

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        try {
          const snap = await getDocs(q);
          if (!snap.empty) {
            let docId = "";
            let currentCheats = 0;
            snap.forEach(d => { 
              docId = d.id; 
              currentCheats = d.data().cheats || 0; 
            });

            const newCheats = currentCheats + 1;

            if (newCheats >= 3) {
              // 3-marta chiqib ketganda avtomatik bloklash
              await updateDoc(doc(db, "students", docId), {
                cheats: newCheats,
                spamStatus: 'blocked'
              });
              setRole('home');
              setViewState('student-blocked-screen');
              localStorage.clear();
            } else {
              // Hech qanday alert'siz bazani jimgina oshirish, tepada qizil matn o'zi o'zgaradi
              await updateDoc(doc(db, "students", docId), { cheats: newCheats });
            }
          }
        } catch (err) {
          console.error("Anti-cheat yangilash xatosi:", err);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      unsubscribe();
    };
  }, [role, currentUser]);


  // 🔐 TIZIMGA KIRISH LOGIKASI
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    const inputLogin = loginInput.trim();
    const inputPassword = passwordInput.trim();

    if (viewState === 'oqituvchi-login') {
      if (inputLogin === 'admin' && inputPassword === 'admin') {
        const adminUser = { role: 'admin', login: 'admin' };
        setCurrentUser(adminUser);
        setRole('admin');
        localStorage.setItem('userRole', 'admin');
        localStorage.setItem('currentUser', JSON.stringify(adminUser));
        return;
      } else {
        alert("❌ O'qituvchi logini yoki paroli xato!");
        return;
      }
    }

    if (viewState === 'oquvchi-login') {
      try {
        const studentsRef = collection(db, "students");
        const q = query(studentsRef, where("login", "==", inputLogin));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          let studentData = null;
          let docId = "";
          querySnapshot.forEach((doc) => {
            studentData = doc.data();
            docId = doc.id;
          });

          if (studentData.password === inputPassword) {
            if (studentData.spamStatus === 'blocked') {
              setViewState('student-blocked-screen');
              return;
            }
            if (studentData.spamStatus === 'pending') {
              alert("⏳ So'rovingiz yuborilgan. Ustoz tasdiqlashini kuting!");
              return;
            }

            const finalUser = { id: docId, ...studentData };
            setCurrentUser(finalUser);
            setRole('oquvchi-panel');
            localStorage.setItem('userRole', 'oquvchi-panel');
            localStorage.setItem('currentUser', JSON.stringify(finalUser));
          } else {
            alert("❌ Parol noto'g'ri!");
          }
        } else {
          alert("❌ Bunday foydalanuvchi topilmadi!");
        }
      } catch (err) {
        alert("❌ Xatolik yuz berdi!");
      }
    }
  };

  // 📩 O'QITUVCHIGA BLOKDAN OCHISH SO'ROVINI YUBORISH
  const handleSendAppealOnly = async () => {
    const loginToSend = loginInput.trim() || currentUser?.login;
    if (!loginToSend) {
      alert("Iltimos, loginingizni kiriting!");
      return;
    }
    try {
      const q = query(collection(db, "students"), where("login", "==", loginToSend));
      const snap = await getDocs(q);
      if (!snap.empty) {
        let id = "";
        snap.forEach(d => id = d.id);
        
        await updateDoc(doc(db, "students", id), { 
          spamStatus: 'pending' 
        });
        
        alert("📩 Blokdan ochish so'rovi o'qituvchiga muvaffaqiyatli yuborildi!");
        setViewState('home');
        setLoginInput('');
        setPasswordInput('');
      }
    } catch (err) {
      alert("❌ So'rov yuborishda xato!");
    }
  };

  const handleLogout = () => {
    setRole('home');
    setViewState('home');
    setCurrentUser(null);
    setLoginInput('');
    setPasswordInput('');
    localStorage.removeItem('userRole');
    localStorage.removeItem('currentUser');
  };

  // Jonli ogohlantirish panelini komponentlarga uzatish
  if (role === 'oquvchi-panel') {
    return (
      <div className="w-full min-h-screen flex flex-col relative">
        {/* Tepada qizil rangli kichkina ogohlantirish paneli */}
        {liveCheats > 0 && (
          <div className="w-full bg-rose-600 text-white text-center py-1.5 text-xs font-bold tracking-wide animate-pulse">
            ⚠️ DIQQAT! Imtihon qoidasini buzyapsiz! Oynadan chiqishlar soni: {liveCheats} / 3. (3-sida tizim avtomat yopiladi)
          </div>
        )}
        <OquvchiPanel currentUser={currentUser} onLogout={handleLogout} darkMode={darkMode} setDarkMode={setDarkMode} />
      </div>
    );
  }
  
  if (role === 'admin') return <AdminDashboard onLogout={handleLogout} darkMode={darkMode} setDarkMode={setDarkMode} />;

  // 🎨 DYNAMIC PREMIUM STYLES (DARK / LIGHT MANTIQLI)
  const styles = {
    bg: darkMode ? 'linear-gradient(135deg, #131c31 0%, #030e25 100%)' : 'linear-gradient(135deg, #17406055 0%, #6cabf7 100%)',
    textMain: darkMode ? 'text-white' : 'text-slate-900',
    textSub: darkMode ? 'text-slate-400' : 'text-slate-600',
    card: darkMode 
      ? 'bg-slate-900/90 border border-slate-800/80 shadow-2xl rounded-2xl p-6 cursor-pointer hover:scale-[1.02] transition-all duration-200' 
      : 'bg-white border border-slate-200 shadow-xl rounded-2xl p-6 cursor-pointer hover:scale-[1.02] transition-all duration-200',
    formBg: darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200',
    inputBg: darkMode ? 'bg-slate-950 border border-slate-800 text-white' : 'bg-slate-50 border border-slate-300 text-slate-900'
  };

  return (
    <div style={{ background: styles.bg }} className={`w-full min-h-screen font-sans ${styles.textMain} flex flex-col items-center justify-center p-6 relative transition-colors duration-300`}>
      
      {/* 🌓 INTEGRATION: DARK/LIGHT MODE TOGGLE BUTTON */}
      <button 
        onClick={() => setDarkMode(!darkMode)} 
        className={`absolute top-6 right-6 p-3 rounded-xl border transition-all duration-200 shadow-md ${darkMode ? 'bg-slate-900/80 border-slate-800 text-amber-400 hover:bg-slate-800' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'}`}
      >
        {darkMode ? '☀️ ' : '🌙'}
      </button>

      {/* 🏡 1. ASOSIY IKKI KARTALI OYNA */}
      {viewState === 'home' && (
        <div className="w-full max-w-xl text-center space-y-12">
          <div className="space-y-3">
            <h1 className="text-4xl font-black tracking-tight">Imtihon Boshqaruv Tizimi</h1>
            <p className={`text-sm ${styles.textSub}`}>Xavfsiz va shaxsiy login parollarga asoslangan o'quv platformasi.</p>
          </div>

          <div className="space-y-6 text-left    ">
            {/* O'qituvchi Kabineti */}
            <div onClick={() => setViewState('oqituvchi-login')} className= {styles.card}>
              <div className="flex items-start gap-5">
                <div className="p-3 bg-indigo-600 rounded-xl text-white text-sm "> <Award></Award></div>
                <div className="space-y-12" >
                  <h3 className="text-lg font-bold">O'qituvchi Kabineti</h3>
                  <p className={`text-xs ${styles.textSub}`}>O'z parolingizni qo'yib kirish, testlar va o'quvchilar qo'shish.</p>
                </div>
              </div>
            </div>

            {/* O'quvchi Maydoni */}
            <div onClick={() => setViewState('oquvchi-login')} className={styles.card}>
              <div className="flex items-start gap-6">
                <div className="p-3 bg-blue-600 rounded-xl text-white text-sm"><GraduationCap size={22}/></div>
                <div className="space-y-12">
                  <h3 className="text-lg font-bold ">O'quvchi Maydoni</h3>
                  <p className={`text-xs ${styles.textSub}`}>Ustoz bergan maxsus login orqali kirib vaqtli testlarni topshirish.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔐 2. STANDART LOGIN FORMASI */}
      {(viewState === 'oqituvchi-login' || viewState === 'oquvchi-login') && (
        <div className={`w-full max-w-md p-8 rounded-2xl shadow-2xl relative ${styles.formBg}`}>
          <button onClick={() => { setViewState('home'); setLoginInput(''); setPasswordInput(''); }} className={`absolute top-4 left-4 text-xs transition ${styles.textSub} hover:text-indigo-500`}>
            ⬅️ Orqaga
          </button>
          
          <h2 className="text-xl font-black text-center text-indigo-500 uppercase tracking-wider mt-4 mb-6">
            {viewState === 'oqituvchi-login' ? "O'qituvchi Kirishi" : "O'quvchi Kirishi"}
          </h2>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className={`text-[11px] font-bold uppercase tracking-wide block mb-1 ${styles.textSub}`}>Foydalanuvchi logini</label>
              <input type="text" value={loginInput} onChange={(e) => setLoginInput(e.target.value)} required placeholder="Login..." className={`w-full rounded-xl px-4 py-3 text-xs focus:outline-none ${styles.inputBg}`} />
            </div>
            <div>
              <label className={`text-[11px] font-bold uppercase tracking-wide block mb-1 ${styles.textSub}`}>Parol</label>
              <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} required placeholder="Parol..." className={`w-full rounded-xl px-4 py-3 text-xs focus:outline-none ${styles.inputBg}`} />
            </div>
            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-xs tracking-wider transition">
              KIRISH 🚀
            </button>
          </form>
        </div>
      )}

      {/* 🚨 3. FAQAT 3 MARTA CHIQIB KETGANDA CHIQADIGAN MAXSUS EKRAN */}
      {viewState === 'student-blocked-screen' && (
        <div className={`w-full max-w-md p-8 rounded-2xl border border-rose-500/40 shadow-2xl text-center space-y-6 ${styles.formBg}`}>
          <div className="text-4xl animate-pulse">⚠️</div>
          <h2 className="text-xl font-black text-rose-500 uppercase tracking-wider">Siz bloklandingiz!</h2>
          <p className={`text-xs leading-relaxed px-2 ${styles.textSub}`}>
            Imtihon qoidalarini buzib, test paytida sahifadan 3 marta chiqib ketganingiz sababli tizim sizni blokladi.
          </p>
          
          <div className="pt-2">
            <button 
              type="button" 
              onClick={handleSendAppealOnly}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl font-black text-xs tracking-wider transition shadow-lg shadow-amber-600/20"
            >
              📩 O'QITUVCHIGA SO'ROV YUBORISH
            </button>
          </div>

          <button onClick={() => { setViewState('home'); setLoginInput(''); }} className={`text-xs block mx-auto pt-2 ${styles.textSub}`}>
            Bosh sahifaga qaytish
          </button>
        </div>
      )}

    </div>
  );
}