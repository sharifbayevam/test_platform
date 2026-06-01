import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Play, CheckCircle, User, Award, Clock, LogOut, BookOpen, Lock, Edit2, FileText, Users, Key, AlertCircle, ArrowRight, Download, UserPlus, LogIn, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

export default function App() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  
  // 🔄 REFRESH MUAMMOSINI HAL ETISH: Auth holatlarini LocalStorage'ga ulash
  const [role, setRole] = useState(() => localStorage.getItem('edu_role') || null);
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('edu_isLoggedIn') === 'true');
  const [currentTeacher, setCurrentTeacher] = useState(() => JSON.parse(localStorage.getItem('edu_currentTeacher')) || null);
  const [currentStudent, setCurrentStudent] = useState(() => JSON.parse(localStorage.getItem('edu_currentStudent')) || null);

  const [authMode, setAuthMode] = useState('login');
  const [activeTab, setActiveTab] = useState('umumiy');

  // Auth States
  const [regName, setRegName] = useState('');
  const [inputLogin, setInputLogin] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Mahalliy Server xotirasi (LocalStorage)
  const [teachers, setTeachers] = useState(() => JSON.parse(localStorage.getItem('edu_teachers')) || []);
  const [quizzes, setQuizzes] = useState(() => JSON.parse(localStorage.getItem('edu_quizzes')) || []);
  const [allowedStudents, setAllowedStudents] = useState(() => JSON.parse(localStorage.getItem('edu_students')) || []);
  const [results, setResults] = useState(() => JSON.parse(localStorage.getItem('edu_results')) || []);
  
  // 🔐 BLOKLANGAN VA SO'ROV YUBORGAN O'QUVCHILAR BAZASI
  const [blockedStatuses, setBlockedStatuses] = useState(() => JSON.parse(localStorage.getItem('edu_blocked_statuses')) || {});

  // Quiz Engine States
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [quizState, setQuizState] = useState('list');
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [cheatCount, setCheatCount] = useState(0);
  const [latestScore, setLatestScore] = useState({ score: 0, total: 0, percent: 0, timeSpent: '' });

  // Konstruktor formasi
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDuration, setNewDuration] = useState(15);
  const [newQuestions, setNewQuestions] = useState([{ text: '', options: ['', '', '', ''], correctAnswer: 0, image: null }]);

  const [studName, setStudName] = useState('');
  const [studUsername, setStudUsername] = useState('');
  const [studPassword, setStudPassword] = useState('');

  const optionLetters = ['A', 'B', 'C', 'D'];

  // Dark Mode va Auth xotirasini yangilab borish
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) { root.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    else { root.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('edu_role', role || '');
    localStorage.setItem('edu_isLoggedIn', isLoggedIn);
    localStorage.setItem('edu_currentTeacher', JSON.stringify(currentTeacher));
    localStorage.setItem('edu_currentStudent', JSON.stringify(currentStudent));
  }, [role, isLoggedIn, currentTeacher, currentStudent]);

  useEffect(() => { localStorage.setItem('edu_teachers', JSON.stringify(teachers)); }, [teachers]);
  useEffect(() => { localStorage.setItem('edu_quizzes', JSON.stringify(quizzes)); }, [quizzes]);
  useEffect(() => { localStorage.setItem('edu_students', JSON.stringify(allowedStudents)); }, [allowedStudents]);
  useEffect(() => { localStorage.setItem('edu_results', JSON.stringify(results)); }, [results]);
  useEffect(() => { localStorage.setItem('edu_blocked_statuses', JSON.stringify(blockedStatuses)); }, [blockedStatuses]);

  // JONLI TAYMER
  useEffect(() => {
    if (quizState !== 'playing' || timeLeft <= 0) {
      if (timeLeft === 0 && quizState === 'playing') {
        handleFinishQuiz();
      }
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, quizState]);

  // 🚨 CHITERNIKKA QARSHI NAZORAT (3 MARTADA AVTOMATIK CHIQARISH)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && quizState === 'playing' && currentStudent && currentQuiz) {
        const nextCheat = cheatCount + 1;
        setCheatCount(nextCheat);

        if (nextCheat >= 3) {
          alert("🚨 QOIDABUZARLIK! 3 marta sahifadan chiqib ketganingiz uchun test avtomatik ravishda to'xtatildi va siz BLOKLANDINGIZ!");
          
          // O'quvchini ushbu fan bo'yicha bloklash holatiga tushirish
          const key = `${currentStudent.username}_${currentQuiz.id}`;
          setBlockedStatuses(prev => ({
            ...prev,
            [key]: 'blocked' // statuslar: 'blocked', 'requested', 'approved'
          }));
          
          // Testni yakunlash funksiyasini chaqirish (0 ball bilan yoki joriy holatda)
          handleFinishQuiz(nextCheat);
        } else {
          alert(`⚠️ OGOHLANTIRISH! Boshqa oynaga o'tish taqiqlanadi! Kuningiz: ${nextCheat}/3 martagacha ruxsat bor.`);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [quizState, cheatCount, currentStudent, currentQuiz]);

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    setAuthError('');
    const log = inputLogin.trim();
    const pass = inputPassword.trim();

    if (role === 'teacher') {
      if (authMode === 'register') {
        if (teachers.some(t => t.username === log)) {
          setAuthError('Bu login band! Boshqasini tanlang.');
          return;
        }
        const newTech = { id: 't_' + Date.now(), name: regName, username: log, password: pass };
        setTeachers([...teachers, newTech]);
        setCurrentTeacher(newTech);
        setIsLoggedIn(true);
        setRegName(''); setInputLogin(''); setInputPassword('');
      } else {
        const teacher = teachers.find(t => t.username === log && t.password === pass);
        if (teacher) {
          setCurrentTeacher(teacher);
          setIsLoggedIn(true);
          setInputLogin(''); setInputPassword('');
        } else {
          setAuthError('O‘qituvchi logini yoki paroli xato!');
        }
      }
    } else {
      const student = allowedStudents.find(s => s.username === log && s.password === pass);
      if (student) {
        setCurrentStudent(student);
        setIsLoggedIn(true);
        setInputLogin(''); setInputPassword('');
      } else {
        setAuthError('Bunday logindagi o\'quvchi tizimda yo\'q!');
      }
    }
  };

  const myQuizzes = quizzes.filter(q => q.teacherId === currentTeacher?.id);
  const myStudents = allowedStudents.filter(s => s.teacherId === currentTeacher?.id);
  const myResults = results.filter(r => r.teacherId === currentTeacher?.id);

  // O'quvchilardan kelgan faol so'rovlar (requested) sonini hisoblash
const activeRequestsCount = allowedStudents.reduce((count, student) => {
  // O'qituvchiga tegishli testlar bo'yicha so'rovlarni tekshiramiz
  const studentRequests = myQuizzes.filter(qz => blockedStatuses[`${student.username}_${qz.id}`] === 'requested');
  return count + studentRequests.length;
}, 0);

  const handleAddStudent = (e) => {
    e.preventDefault();
    if (!studName.trim() || !studUsername.trim() || !studPassword.trim()) {
      alert("Iltimos, barcha maydonlarni to'ldiring!");
      return;
    }
    const newStudent = {
      id: 's_' + Date.now(),
      teacherId: currentTeacher.id,
      name: studName,
      username: studUsername,
      password: studPassword
    };
    setAllowedStudents([...allowedStudents, newStudent]);
    setStudName(''); setStudUsername(''); setStudPassword('');
    alert("O'quvchi muvaffaqiyatli qo'shildi!");
  };

  const handleDeleteStudent = (id) => {
    setAllowedStudents(prev => prev.filter(s => (s.id || s._id || s.username) !== id));
  };

  const handleCreateOrUpdateQuiz = (e) => {
    e.preventDefault();
    if (!newTitle || !newDesc) return;

    if (editingQuiz) {
      setQuizzes(quizzes.map(q => q.id === editingQuiz.id ? { ...q, title: newTitle, description: newDesc, duration: parseInt(newDuration), questions: newQuestions } : q));
      setEditingQuiz(null);
    } else {
      setQuizzes([...quizzes, {
        id: 'q_' + Date.now(), teacherId: currentTeacher.id, title: newTitle, description: newDesc, duration: parseInt(newDuration), questions: newQuestions
      }]);
    }
    setNewTitle(''); setNewDesc(''); setNewDuration(15);
    setNewQuestions([{ text: '', options: ['', '', '', ''], correctAnswer: 0, image: null }]);
    setActiveTab('savollar');
  };

  const handleFinishQuiz = (forcedCheatCount = null) => {
    const finalCheats = forcedCheatCount !== null ? forcedCheatCount : cheatCount;
    let rightAnswers = 0;
    currentQuiz.questions.forEach((q, idx) => { if (answers[idx] === q.correctAnswer) rightAnswers++; });
    const diffMs = Date.now() - quizStartTime;
    const timeSpentStr = `${Math.floor(diffMs / 60000)} daqiqa, ${Math.floor((diffMs % 60000) / 1000)} soniya`;
    const percent = Math.round((rightAnswers / currentQuiz.questions.length) * 100);

    setLatestScore({ score: rightAnswers, total: currentQuiz.questions.length, percent, timeSpent: timeSpentStr });

    setResults([{
      id: 'res_' + Date.now(),
      quizId: currentQuiz.id,
      teacherId: currentQuiz.teacherId,
      studentName: currentStudent.name,
      studentUsername: currentStudent.username,
      quizTitle: currentQuiz.title,
      score: rightAnswers,
      totalQuestions: currentQuiz.questions.length,
      percent,
      timeSpent: timeSpentStr,
      cheats: finalCheats,
      date: new Date().toLocaleString()
    }, ...results]);
    setQuizState('result');
  };

  const exportResultsToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(myResults.map(r => ({
      'O\'quvchi Ismi': r.studentName,
      'Imtihon Fani': r.quizTitle,
      'Sarflangan Vaqt': r.timeSpent,
      'To\'g\'ri Javoblar': `${r.score}/${r.totalQuestions}`,
      'Foiz %': `${r.percent}%`,
      'Oynadan chiqishlar': r.cheats,
      'Sana': r.date
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Natijalar");
    XLSX.writeFile(workbook, `${currentTeacher.name}_Natijalar.xlsx`);
  };

  const startEditQuiz = (quiz) => {
    setEditingQuiz(quiz);
    setNewTitle(quiz.title);
    setNewDesc(quiz.description);
    setNewDuration(quiz.duration);
    setNewQuestions(quiz.questions);
    setActiveTab('yaratish');
  };

  // 📨 O'quvchi tomonidan ruxsat so'rash tugmasi bosilganda
  const handleRequestAccess = (quizId) => {
    const key = `${currentStudent.username}_${quizId}`;
    setBlockedStatuses(prev => ({
      ...prev,
      [key]: 'requested'
    }));
    alert("Ustozga qayta kirish so'rovi muvaffaqiyatli yuborildi! Tasdiqlashlarini kuting.");
  };

  const styles = {
    bg: darkMode ? 'linear-gradient(135deg, rgb(6, 14, 44) 0%, #03082c 100%)' : 'linear-gradient(135deg, #8aa7ff 0%, #f1f5f9 100%)',
    card: darkMode ? ' bg-slate-900/90 border border-slate-800/80 shadow-2xl backdrop-blur-md' : 'bg-white border border-slate-200 shadow-lg backdrop-blur-md',
    text: darkMode ? 'text-slate-100' : 'text-slate-900',
    muted: darkMode ? 'text-slate-400' : 'text-slate-600',
    input: darkMode
      ? 'bg-zinc-900/60 border-zinc-800 text-white placeholder-zinc-600 focus:border-indigo-500 focus:bg-black/70'
      : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:shadow-[0_0_15px_rgba(99,102,241,0.15)]'
  };

  return (
    <div style={{ background: styles.bg }} className="w-full min-h-screen font-sans transition-all duration-300 pb-12 text-xs">

      {/* HEADER */}
      <header className="sticky top-0 z-50 w-full bg-slate-900/70 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => { if (isLoggedIn) setQuizState('list'); }}>
          <div className="p-2 bg-indigo-500 rounded-xl text-white"><BookOpen size={20} /></div>
          <div>
            <h1 className="text-lg font-black tracking-wider">EDU_Test PLATFORM</h1>
            {isLoggedIn && <span className="text-[10px] text-emerald-400 font-bold">● {role === 'teacher' ? `Ustoz: ${currentTeacher?.name}` : `O'quvchi: ${currentStudent?.name}`}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setDarkMode(!darkMode)} className="px-3 py-2 bg-white/10 rounded-lg font-bold hover:bg-white/20 transition-all cursor-pointer">
            {darkMode ? '☀️ ' : '🌙 '}
          </button>
          {isLoggedIn && (
            <button onClick={() => { 
              setRole(null); setIsLoggedIn(false); setQuizState('list'); setCurrentTeacher(null); setCurrentStudent(null); setAuthMode('login');
              localStorage.removeItem('edu_role'); localStorage.removeItem('edu_isLoggedIn'); localStorage.removeItem('edu_currentTeacher'); localStorage.removeItem('edu_currentStudent');
            }} className="px-3 py-2 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition-all cursor-pointer">
              Chiqish
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-6">
        <AnimatePresence mode="wait">

          {/* ROL TANLASH */}
          {!role && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl mx-auto text-center py-16 space-y-6">
              <h2 className={`text-3xl font-black ${styles.text}`}>Imtihon Boshqaruv Tizimi</h2>
              <p className={styles.muted}>Xavfsiz va shaxsiy login parollarga asoslangan o'quv platformasi.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div onClick={() => { setRole('teacher'); setAuthMode('login'); }} className={`p-6 rounded-2xl cursor-pointer text-left ${styles.card} hover:border-indigo-700 transition-all shadow-indigo-700/40 hover:scale-105 active:scale-95 border mt-8 space-y-4 flex flex-col items-start scale-[1.03]`}>
                  <div className="w-10 h-10 bg-indigo-900 rounded-lg flex items-center justify-center text-white mb-4 "><Users size={20} /></div>
                  <h3 className={`font-bold text-sm mb-1 ${styles.text}`}>O‘qituvchi Kabineti</h3>
                  <p className={`${styles.muted}`}>O'z parolingizni qo'yib kirish, testlar va o'quvchilar qo'shish.</p>
                </div>
                <div onClick={() => setRole('student')} className={`p-6 rounded-2xl shadow-indigo-700/50 cursor-pointer text-left ${styles.card} hover:border-emerald-700 transition-all hover:scale-105 active:scale-95 border mt-8 space-y-4 flex flex-col items-start scale-[1.03]`}>
                  <div className="w-10 h-10 bg-emerald-800 rounded-lg flex items-center justify-center text-white mb-4"><Award size={20} /></div>
                  <h3 className={`font-bold text-sm mb-1 ${styles.text}`}>O‘quvchi Maydoni</h3>
                  <p className={styles.muted}>Ustoz bergan maxsus login orqali kirib vaqtli testlarni topshirish.</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* DYNAMIC AUTH */}
          {role && !isLoggedIn && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`max-w-sm mx-auto p-6 rounded-2xl mt-12 ${styles.card}`}>
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <h3 className={`text-lg font-bold text-center ${styles.text}`}>
                  {role === 'teacher' ? (authMode === 'login' ? 'O‘qituvchi Avtorizatsiyasi' : 'O‘qituvchi Ro‘yxatdan o‘tishi') : 'O\'quvchi Tizimga Kirishi'}
                </h3>

                {authError && <p className="text-rose-500 font-bold bg-rose-500/10 p-2 rounded-lg">{authError}</p>}

                {role === 'teacher' && authMode === 'register' && (
                  <div>
                    <label className={`block mb-1 font-bold ${styles.text}`}>F.I.O (Ism Familiya)</label>
                    <input type="text" required placeholder="" value={regName} onChange={e => setRegName(e.target.value)} className={`w-full p-2.5 rounded-xl border focus:outline-none ${styles.input}`} />
                  </div>
                )}

                <div>
                  <label className={`block mb-1 font-bold ${styles.text}`}>Foydalanuvchi logini</label>
                  <input type="text" required placeholder="Login..." value={inputLogin} onChange={e => setInputLogin(e.target.value)} className="w-full p-3.5 text-base rounded-xl transition-all duration-300 focus:outline-none border backdrop-blur-md bg-white/70 border-white/40 text-slate-900 placeholder-slate-400 dark:bg-black/40 dark:border-white/10 dark:text-white" />
                </div>
                <div>
                  <label className={`block mb-1 font-bold ${styles.text}`}>Parol</label>
                  <input type="password" required placeholder="Parol..." value={inputPassword} onChange={e => setInputPassword(e.target.value)} className="w-full p-3.5 text-base rounded-xl transition-all duration-300 focus:outline-none border backdrop-blur-md bg-white/70 border-white/40 text-slate-900 placeholder-slate-400 dark:bg-black/40 dark:border-white/10 dark:text-white" />
                </div>

                <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl cursor-pointer hover:bg-indigo-700 transition-all">
                  {authMode === 'login' ? 'Kirish' : 'Ro‘yxatdan o‘tish'}
                </button>

                {role === 'teacher' && (
                  <div className="text-center mt-2">
                    <button type="button" onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="text-indigo-500 font-bold underline">
                      {authMode === 'login' ? "Yangi akkaunt yaratish" : "Menda akkaunt bor (Kirish)"}
                    </button>
                  </div>
                )}

                <button type="button" onClick={() => setRole(null)} className={`w-full text-center text-[11px] underline ${styles.muted}`}>Orqaga</button>
              </form>
            </motion.div>
          )}

          {/* O'QITUVCHI INTERFEYSI */}
          {role === 'teacher' && isLoggedIn && quizState === 'list' && (
            <div className="space-y-6">
              <div className="flex items-center gap-1.5 p-1 bg-slate-800/10 rounded-xl w-fit">
               {['umumiy', 'yaratish', 'savollar', 'oquvchilar', 'natijalar'].map(t => (
  <button 
    key={t} 
    onClick={() => setActiveTab(t)} 
    className={`px-4 py-2 rounded-lg font-bold uppercase tracking-wider transition-all cursor-pointer relative flex items-center gap-2 ${
      activeTab === t ? 'bg-indigo-600 text-white shadow' : `${styles.muted} hover:bg-black/5`
    }`}
  >
    {/* Menyu nomlari */}
    {t === 'umumiy' ? '📊 Tahlil' : 
     t === 'yaratish' ? '📝 Test Tuzish' : 
     t === 'savollar' ? '📚 Imtihonlar' : 
     t === 'oquvchilar' ? '🔑 O\'quvchilar' : '📈 Natijalar'}

    {/* 👇 QIZIL BILDIRISHNOMA (BADGE) TUGMA ICHIGA QO'SHILDI */}
    {t === 'oquvchilar' && activeRequestsCount > 0 && (
      <span className="relative flex h-4 w-4">
        {/* Lipillab turuvchi effekt (Pulse ping) */}
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
        {/* Asosiy dumaloq qizil fon va raqam */}
        <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 text-[9px] text-white font-black items-center justify-center shadow-md">
          {activeRequestsCount}
        </span>
      </span>
    )}
  </button>
))}
              </div>

           {activeTab === 'umumiy' && (
  <div className="space-y-6">
    {/* Yuqoridagi 3 ta statistika kartochkalari (Mavjud kodlaringiz) */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 4 ta fandan, 2 nafar, 4 marta kartochkalari shu yerda qoladi */}
    </div>

    {/* 👇 O'ZINGIZ QO'SHADIGAN TAHLIL JADVALI */}
    <div className={`p-5 rounded-xl ${styles.card || 'bg-slate-800'}`}>
      <h3 className="text-base font-bold text-indigo-400 mb-4">
        📊 O'quvchilar Natijalari Batafsil Tahlili
      </h3>

      <div className="overflow-x-auto space-y-4">
        {myStudents && myStudents.map((student) => {
          // O'quvchining foizini hisoblaymiz (masalan: 80%)
          const totalQuestions = student.latestScore?.total || 10;
          const correctAnswers = student.latestScore?.score || 0;
          const percentage = Math.round((correctAnswers / totalQuestions) * 100);

          return (
            <div 
              key={student.id || student.username} 
              className="p-4 rounded-xl border border-slate-700/50 bg-slate-900/40 space-y-3"
            >
              {/* O'quvchi ismi va umumiy foizi */}
              <div className="flex justify-between items-center border-b border-slate-700/40 pb-2">
                <div>
                  <h4 className="font-bold text-white text-sm">{student.name || 'Ismsiz O\'quvchi'}</h4>
                  <p className="text-[11px] text-slate-400">Login: <span className="text-amber-400 font-mono">{student.username}</span></p>
                </div>
                {/* 🎯 FOIZ KO'RSATKICHI */}
                <div className="text-right">
                  <span className={`text-sm font-black px-2 py-1 rounded-lg ${
                    percentage >= 70 ? 'bg-emerald-500/10 text-emerald-400' : 
                    percentage >= 40 ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400'
                  }`}>
                    {percentage}% Natija
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">{correctAnswers} / {totalQuestions} to'g'ri</p>
                </div>
              </div>

              {/* ❌ NOTO'G'RI ISHLANGAN SAVOLLAR RO'YXATI */}
              <div>
                <h5 className="text-xs font-semibold text-rose-400 mb-1.5 flex items-center gap-1">
                  ⚠️ Noto'g'ri bajarilgan topshiriqlar:
                </h5>
                
                {/* Agar o'quvchi xato qilgan bo'lsa, ularni sikl (map) orqali chiqaramiz */}
                {student.latestScore?.wrongAnswers && student.latestScore.wrongAnswers.length > 0 ? (
                  <div className="space-y-1.5 pl-2 border-l-2 border-rose-500/30">
                    {student.latestScore.wrongAnswers.map((wrong, idx) => (
                      <div key={idx} className="text-xs text-slate-300">
                        <p className="font-medium text-slate-200">
                          <span className="text-rose-500 font-bold">{idx + 1}.</span> {wrong.questionTitle}
                        </p>
                        <p className="text-[11px] text-slate-400 pl-3">
                          O'quvchi tanlagan: <span className="text-rose-400 font-bold">{wrong.selectedOption}</span> | 
                          To'g'ri javob: <span className="text-emerald-400 font-bold">{wrong.correctOption}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-emerald-400 italic pl-2">
                    🎉 Barcha savollarga to'g'ri javob berilgan yoki test hali topshirilmagan.
                  </p>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  </div>
)}

              {/* TAB: YARATISH (YANGI SAVOL RASMI PASGA TUSHIRILDI) */}
              {activeTab === 'yaratish' && (
                <div className={`p-5 rounded-xl ${styles.card}`}>
                  <h3 className={`font-bold mb-4 ${styles.text}`}>{editingQuiz ? 'Testni Tahrirlash' : 'Yangi Test Yaratish'}</h3>
                  <form onSubmit={handleCreateOrUpdateQuiz} className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      <input type="text" required placeholder="Fan/Imtihon nomi" value={newTitle} onChange={e => setNewTitle(e.target.value)} className={`col-span-2 p-2.5 rounded-xl border ${styles.input}`} />
                      <input type="number" required placeholder="Vaqt (daqiqa)" value={newDuration} onChange={e => setNewDuration(e.target.value)} className={`p-2.5 rounded-xl border ${styles.input}`} />
                    </div>
                    <textarea placeholder="Imtihon qoidalari yoki tavsif..." value={newDesc} onChange={e => setNewDesc(e.target.value)} className={`w-full p-2.5 rounded-xl border ${styles.input}`}></textarea>

                    <div className="space-y-4">
                      <div className="flex justify-between font-bold">
                        <span className={styles.text}>Savollar ro'yxati ({newQuestions.length})</span>
                        <button type="button" onClick={() => setNewQuestions([...newQuestions, { text: '', options: ['', '', '', ''], correctAnswer: 0, image: null }])} className="text-indigo-500 font-black">+ Yangi Savol Qo'shish</button>
                      </div>
                      
                      {newQuestions.map((q, idx) => (
                        <div key={idx} className="p-4 bg-black/5 dark:bg-white/5 rounded-xl space-y-3 border border-slate-700/10">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-indigo-400 text-[11px]">Savol - {idx + 1}</span>
                            {newQuestions.length > 1 && (
                              <button type="button" onClick={() => setNewQuestions(newQuestions.filter((_, i) => i !== idx))} className="text-rose-500 hover:text-rose-400 text-[11px] font-bold">O'chirish</button>
                            )}
                          </div>

                          <input type="text" placeholder={`Savol matni ${idx + 1}`} value={q.text} onChange={e => { const u = [...newQuestions]; u[idx].text = e.target.value; setNewQuestions(u); }} className={`w-full p-2 rounded-lg ${styles.input}`} />
                          
                          <div className="grid grid-cols-2 gap-2">
                            {q.options.map((opt, oIdx) => (
                              <div key={oIdx} className="flex items-center gap-2">
                                <span className={`font-bold ${styles.text}`}>{optionLetters[oIdx]})</span>
                                <input type="text" placeholder={`Variant ${optionLetters[oIdx]}`} value={opt} onChange={e => { const u = [...newQuestions]; u[idx].options[oIdx] = e.target.value; setNewQuestions(u); }} className={`w-full p-2 rounded-lg ${styles.input}`} />
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center gap-2 pt-2">
                            <span className={styles.muted}>To'g'ri javob kaliti:</span>
                            <select value={q.correctAnswer} onChange={e => { const u = [...newQuestions]; u[idx].correctAnswer = parseInt(e.target.value); setNewQuestions(u); }} className={`p-2 rounded-lg ${styles.input}`}>
                              <option value={0}>A variant</option>
                              <option value={1}>B variant</option>
                              <option value={2}>C variant</option>
                              <option value={3}>D variant</option>
                            </select>
                          </div>

                          {/* 👇 RASM QO'SHISH PASGA TUSHIRILDI */}
                          <div className="flex items-center gap-3 bg-slate-500/5 p-2.5 rounded-xl border border-dashed border-slate-700/50 mt-2">
                            <input
                              type="file"
                              accept="image/*"
                              id={`file-input-${idx}`}
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    const u = [...newQuestions];
                                    u[idx].image = reader.result;
                                    setNewQuestions(u);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                            <label htmlFor={`file-input-${idx}`} className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-indigo-600 text-white cursor-pointer hover:bg-indigo-500 transition-all shadow-sm">
                              📷 Rasm biriktirish
                            </label>

                            {q.image ? (
                              <div className="flex items-center gap-2 bg-zinc-900/80 p-1 rounded-lg border border-zinc-700">
                                <img src={q.image} className="h-7 w-12 object-cover rounded" alt="Preview" />
                                <span className="text-[10px] text-emerald-400">Rasm yuklandi</span>
                                <button type="button" onClick={() => { const u = [...newQuestions]; u[idx].image = null; setNewQuestions(u); }} className="text-rose-500 text-xs font-bold px-1">✕</button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400">Rasm ixtiyoriy (variantlar tagida ko'rinadi)</span>
                            )}
                          </div>

                        </div>
                      ))}
                    </div>
                    <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-xl cursor-pointer">Imtihon testini saqlash</button>
                  </form>
                </div>
              )}

              {/* TAB: SAVOLLAR */}
              {activeTab === 'savollar' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {myQuizzes.map(q => (
                    <div key={q.id} className={`p-4 rounded-xl flex flex-col justify-between ${styles.card}`}>
                      <div>
                        <h4 className={`font-black text-sm ${styles.text}`}>{q.title}</h4>
                        <p className={`my-2 ${styles.muted}`}>{q.description}</p>
                        <div className="flex items-center gap-1.5 text-indigo-500 font-bold bg-indigo-500/10 w-fit px-2 py-1 rounded-md">
                          <Clock size={12} /> <span>{q.duration} daqiqa</span>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-slate-700/10">
                        <button onClick={() => startEditQuiz(q)} className="text-indigo-500 p-1 hover:bg-indigo-500/5 rounded"><Edit2 size={14} /></button>
                        <button onClick={() => setQuizzes(quizzes.filter(qz => qz.id !== q.id))} className="text-rose-500 p-1 hover:bg-rose-500/5 rounded"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB: O'QUVCHILAR PANELI (BLOKLARNI TEKShIRISh VA OChISh SHU YERDA) */}
              {activeTab === 'oquvchilar' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <form onSubmit={handleAddStudent} className={`p-4 rounded-xl space-y-3 ${styles.card}`}>
                    <h4 className={`font-bold ${styles.text}`}>O'quvchiga Login/Parol Yaratish</h4>
                    <input type="text" required placeholder="Ism, Familiya" value={studName} onChange={e => setStudName(e.target.value)} className={`w-full p-3 text-base font-medium rounded-xl border focus:outline-none ${styles.input}`} />
                    <input type="text" required placeholder="Login..." value={studUsername} onChange={e => setStudUsername(e.target.value)} className={`w-full p-3 text-base font-medium rounded-xl border focus:outline-none ${styles.input}`} />
                    <input type="password" required placeholder="Parol..." value={studPassword} onChange={e => setStudPassword(e.target.value)} className={`w-full p-3 text-base font-medium rounded-xl border focus:outline-none mt-3 ${styles.input}`} />
                    <button type="submit" className="w-full mt-4 p-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl cursor-pointer shadow-md">
                      Bazaga Qo'shish
                    </button>
                  </form>
                  <div className={`lg:col-span-2 p-4 rounded-xl ${styles.card}`}>
                    <h4 className="font-bold text-sm text-indigo-400 mb-3">Tizimdagi O'quvchilar va Kirish So'rovlari</h4>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        
                        <tr className="border-b border-slate-600/20 text-indigo-400 text-sm">
                          <th className=" py-2.5 font-medium  pb-2">F.I.O</th>
                          <th className="pb-2">Login / Parol</th>
                          <th className="pb-2">Imtihon So'rovlari / Statuslar</th>
                          <th className="pb-2 text-right">Harakat</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myStudents && myStudents.map((s) => (
                          <tr key={s.id || s._id} className="border-b border-slate-600/10 last:border-0 text-sm">
                            <td className="py-2.5 font-mono text-amber-700">{s.name}</td>
                            <td className="py-2.5">
                              <span className="text-amber-500 font-bold">{s.username}</span> / <span className="text-slate-400 dark:text-slate-500">{s.password}</span>
                            </td>
                            <td className="py-2.5 dark:text-slate-900">
                              {/* Har bir imtihon bo'yicha so'rovlar yoki bloklarni tekshirish */}
                              <div className="space-y-1">
                                {myQuizzes.map(qz => {
                                  const key = `${s.username}_${qz.id}`;
                                  const status = blockedStatuses[key];
                                  if (status === 'blocked') return <p key={qz.id} className="text-rose-500 font-bold text-[10px]">🚫 {qz.title} (Bloklangan)</p>;
                                  if (status === 'requested') {
                                    return (
                                      <div key={qz.id} className="flex items-center gap-1.5 bg-amber-500/10 p-1 rounded border border-amber-500/30 w-fit">
                                        <span className="text-amber-500 text-[10px] font-bold">📩 Qayta ruxsat so'ramoqda ({qz.title})</span>
                                        <button type="button" onClick={() => {
                                          setBlockedStatuses(prev => ({ ...prev, [key]: 'approved' }));
                                          alert(`${s.name}ga ${qz.title} fani uchun qayta kirishga ruxsat berildi!`);
                                        }} className="bg-emerald-900 text-white font-bold px-1.5 py-0.5 rounded text-[9px] hover:bg-emerald-500">
                                          Tasdiqlash
                                        </button>
                                      </div>
                                    );
                                  }
                                  if (status === 'approved') return <p key={qz.id} className="text-emerald-500 font-bold text-[10px]">✅ {qz.title} (Qayta ochildi)</p>;
                                  return null;
                                })}
                                {!myQuizzes.some(qz => blockedStatuses[`${s.username}_${qz.id}`]) && <span className="text-slate-500 text-[15px]">Muammo yo'q</span>}
                              </div>
                            </td>
                            <td className="py-2.5 text-right">
                              <button type="button" onClick={() => handleDeleteStudent(s.id)} className="px-3 py-1 text-xs font-semibold bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 rounded-lg cursor-pointer">
                                O'chirish
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB: NATIJALAR */}
              {activeTab === 'natijalar' && (
                <div className={`p-5 rounded-xl ${styles.card} space-y-4`}>
                  <div className="flex justify-between items-center">
                    <h3 className={`font-bold ${styles.text}`}>Imtihon hisobotlari jadvali</h3>
                    <button onClick={exportResultsToExcel} className="bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer">
                      <Download size={14} /> Excelga Yuklash
                    </button>
                  </div>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-600/20 text-indigo-500 font-bold">
                        <th>O'quvchi</th>
                        <th>Fan nomi</th>
                        <th>To'g'ri javob</th>
                        <th>Foiz score</th>
                        <th className="text-rose-500">Shpargalka (Cheat)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myResults.map(r => (
                        <tr key={r.id} className="border-b border-slate-600/10">
                          <td className={`py-2 font-bold ${styles.text}`}>{r.studentName}</td>
                          <td className={styles.text}>{r.quizTitle}</td>
                          <td className={styles.text}>{r.score}/{r.totalQuestions}</td>
                          <td className="text-emerald-500 font-bold">{r.percent}%</td>
                          <td className="text-rose-500 font-mono font-bold">{r.cheats || 0} marta (Qoidabuzarlik)</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* O'QUVCHI INTERFEYSI */}
          {role === 'student' && isLoggedIn && (
            <div className="w-full">
              {quizState === 'list' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {quizzes.filter(q => q.teacherId === currentStudent.teacherId).map(q => {
                    const blockKey = `${currentStudent.username}_${q.id}`;
                    const blockStatus = blockedStatuses[blockKey];

                    return (
                      <div key={q.id} className={`p-5 rounded-xl flex flex-col justify-between ${styles.card}`}>
                        <div>
                          <h3 className={`font-black text-sm my-2 ${styles.text}`}>{q.title}</h3>
                          <p className={styles.muted}>{q.description}</p>
                          <div className="flex items-center gap-1 text-emerald-500 font-bold mt-2">
                            <Clock size={12} /> Berilgan vaqt: {q.duration} daqiqa
                          </div>
                        </div>

                        {/* RUXSATLAR VA BLOKLAR NAZORATI INTERFEYSI */}
                        {blockStatus === 'blocked' ? (
                          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-2 text-center">
                            <p className="text-rose-500 font-bold text-[10px]">🚫 Qoidabuzarlik tufayli ushbu testdan haydalgansiz!</p>
                            <button type="button" onClick={() => handleRequestAccess(q.id)} className="w-full bg-amber-600 text-white font-bold py-2 rounded-lg hover:bg-amber-500 transition-all">
                              Ustozga qayta kirish so'rovini yuborish
                            </button>
                          </div>
                        ) : blockStatus === 'requested' ? (
                          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
                            <p className="text-amber-500 font-bold text-[11px]">⏳ So'rov yuborildi. Ustoz tasdiqlashlarini kuting...</p>
                          </div>
                        ) : (
                          <button onClick={() => { setCurrentQuiz(q); setTimeLeft(q.duration * 60); setQuizStartTime(Date.now()); setAnswers({}); setCheatCount(0); setQuizState('playing'); }} className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-xl mt-4 cursor-pointer hover:bg-indigo-500">
                            Imtihonni Boshlash {blockStatus === 'approved' && '(Qayta ruxsat berildi)'}
                          </button>
                        )}

                      </div>
                    );
                  })}
                </div>
              )}

              {/* JONLI IMTIHON TOPShIRISh VA TAYMER KO'RINISHI */}
              {quizState === 'playing' && currentQuiz && (
                <div className="max-w-2xl mx-auto space-y-4">
                  
                  {/* TEPADAGI STICKY VAQT TAYMERI */}
                  <div className={`p-4 rounded-xl flex justify-between items-center sticky top-20 z-40 ${styles.card}`}>
                    <div>
                      <h4 className={`font-black text-sm ${styles.text}`}>{currentQuiz.title}</h4>
                      <p className="text-rose-500 font-bold text-[10px]">⚠️ DIQQAT! 3 marta boshqa oynaga o'tsangiz, avtomatik haydalasiz!</p>
                      <p className="text-amber-500 font-mono font-bold text-[9px]">Chiqishlar soni: {cheatCount} / 3</p>
                    </div>
                    <div className="flex items-center gap-2 bg-rose-500 text-white px-3 py-1.5 rounded-lg font-black font-mono text-sm shadow-md">
                      <Clock size={14} />
                      <span>{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</span>
                    </div>
                  </div>

                  {/* SAVOLLARNI JONLI CHIQARISH (GLAVNIY EKRAN) */}
                  <div className="space-y-4">
                    {currentQuiz.questions.map((q, index) => (
                      <div key={index} className={`p-5 rounded-2xl ${styles.card} space-y-4 shadow-xl`}>
                        <h3 className={`text-sm md:text-base font-bold ${styles.text}`}>
                          {index + 1}. {q.text}
                        </h3>

                        {/* 📸 SAVOL MATNI OSTIDAGI RASM */}
                        {q.image && (
                          <div className="my-3 rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-white/40 dark:bg-black/20 p-1.5 max-w-lg mx-auto">
                            <img src={q.image} alt={`Savol ${index + 1} tasviri`} className="max-h-60 w-full object-contain rounded-lg" />
                          </div>
                        )}

                        <div className="grid grid-cols-1 gap-2 pt-2">
                          {q.options.map((opt, oIdx) => (
                            <button
                              key={oIdx}
                              type="button"
                              onClick={() => setAnswers({ ...answers, [index]: oIdx })}
                              className={`w-full p-3 text-left rounded-xl border text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                                answers[index] === oIdx
                                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20 scale-[1.01]'
                                  : `${darkMode ? 'bg-zinc-900/40 border-zinc-800 text-zinc-300 hover:bg-zinc-800/60' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'}`
                              }`}
                            >
                              <span className={`w-5 h-5 rounded-md flex items-center justify-center font-black text-[10px] ${answers[index] === oIdx ? 'bg-white text-indigo-600' : 'bg-black/10 dark:bg-white/10'}`}>
                                {optionLetters[oIdx]}
                              </span>
                              <span>{opt}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => handleFinishQuiz()} className="w-full bg-emerald-600 text-white font-black py-3 rounded-xl text-sm shadow-lg hover:bg-emerald-500 transition-all cursor-pointer">
                    Imtihonni Yakunlash & Natijani Ko'rish
                  </button>
                </div>
              )}

              {/* NATIJA SAKRANI */}
              {quizState === 'result' && (
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`max-w-md mx-auto p-6 rounded-2xl text-center space-y-4 ${styles.card}`}>
                  <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner"><CheckCircle size={36} /></div>
                  <h2 className={`text-xl font-black ${styles.text}`}>Imtihon Yakunlandi!</h2>
                  <p className={styles.muted}>Natijalar ustoz panellariga yuborildi.</p>
                  
                  <div className="bg-black/5 dark:bg-white/5 p-4 rounded-xl grid grid-cols-2 gap-2 text-left font-semibold">
                    <span className={styles.muted}>To'g'ri javoblar:</span>
                    <span className={`text-right ${styles.text}`}>{latestScore.score} / {latestScore.total}</span>
                    <span className={styles.muted}>Umumiy foiz:</span>
                    <span className="text-right text-emerald-500 font-bold">{latestScore.percent}%</span>
                    <span className={styles.muted}>Sarflangan vaqt:</span>
                    <span className={`text-right text-[11px] ${styles.text}`}>{latestScore.timeSpent}</span>
                    <span className="text-rose-500">Qoidabuzarliklar soni:</span>
                    <span className="text-right text-rose-500 font-mono">{cheatCount} marta</span>
                  </div>

                  <button onClick={() => setQuizState('list')} className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-xl cursor-pointer">
                    Bosh ekranga qaytish
                  </button>
                </motion.div>
              )}

            </div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}