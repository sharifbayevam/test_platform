import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Play, CheckCircle, User, Award, Clock, LogOut, BookOpen, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

const defaultQuizzes = [
  {
    id: '1',
    title: 'Matematika - Chorak Yakuniy Testi',
    description: 'Kombinatorika va ehtimollar nazariyasi asoslari bo‘yicha chuqurlashtirilgan savollar.',
    duration: 20,
    questions: [
      { id: 'q1', text: '5 ta kitobni javonga necha xil usulda joylashtirish mumkin?', options: ['120', '60', '24', '100'], correctAnswer: 0 },
      { id: 'q2', text: 'Ikkita kubik bir vaqtda tashlanganda, ochkolar yig\'indisi 7 bo\'lish ehtimolini toping.', options: ['1/6', '1/12', '5/36', '1/4'], correctAnswer: 0 }
    ]
  }
];

const shuffleQuiz = (quiz) => {
  if (!quiz) return null;
  const shuffledQuestions = quiz.questions.map((q) => {
    const indexedOptions = q.options.map((opt, idx) => ({ text: opt, isCorrect: idx === q.correctAnswer }));
    const shuffledOptions = [...indexedOptions].sort(() => Math.random() - 0.5);
    return {
      ...q,
      options: shuffledOptions.map(o => o.text),
      correctAnswer: shuffledOptions.findIndex(o => o.isCorrect)
    };
  }).sort(() => Math.random() - 0.5);
  return { ...quiz, questions: shuffledQuestions };
};

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  });
  const [role, setRole] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('umumiy'); // O'qituvchi dashboard tablari uchun state

  const [studentName, setStudentName] = useState('');
  const [teacherLogin, setTeacherLogin] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [savedTeacher, setSavedTeacher] = useState(() => JSON.parse(localStorage.getItem('edu_teacher')) || null);
  const [quizzes, setQuizzes] = useState(() => JSON.parse(localStorage.getItem('edu_quizzes')) || defaultQuizzes);
  const [results, setResults] = useState(() => JSON.parse(localStorage.getItem('edu_results')) || []);

  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [quizState, setQuizState] = useState('list');
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);

  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDuration, setNewDuration] = useState(15);
  const [newQuestions, setNewQuestions] = useState([{ text: '', options: ['', '', '', ''], correctAnswer: 0 }]);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.className = 'dark';
      localStorage.setItem('theme', 'dark');
    } else {
      root.className = '';
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  useEffect(() => { localStorage.setItem('edu_quizzes', JSON.stringify(quizzes)); }, [quizzes]);
  useEffect(() => { localStorage.setItem('edu_results', JSON.stringify(results)); }, [results]);

  useEffect(() => {
    if (quizState !== 'playing' || timeLeft <= 0) {
      if (timeLeft === 0 && quizState === 'playing') handleFinishQuiz();
      return;
    }
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, quizState]);

  const handleTeacherRegister = (e) => {
    e.preventDefault();
    const login = teacherLogin.trim().toLowerCase();
    const password = teacherPassword.trim();
    if (login.length < 3 || password.length < 4) {
      setAuthError('Login kamida 3 ta, parol kamida 4 ta belgidan iborat bo‘lsin!');
      return;
    }
    const newTeacherData = { login, password };
    localStorage.setItem('edu_teacher', JSON.stringify(newTeacherData));
    setSavedTeacher(newTeacherData);
    setIsLoggedIn(true);
    setAuthError('');
  };

  const handleTeacherLogin = (e) => {
    e.preventDefault();
    if (savedTeacher && teacherLogin.trim().toLowerCase() === savedTeacher.login && teacherPassword.trim() === savedTeacher.password) {
      setIsLoggedIn(true);
      setAuthError('');
    } else {
      setAuthError('Login yoki parol xato!');
    }
  };

  const handleStudentLogin = (e) => {
    e.preventDefault();
    if (studentName.trim().length >= 3) {
      setIsLoggedIn(true);
      setAuthError('');
    } else {
      setAuthError('Iltimos, ism va familiyangizni kiriting!');
    }
  };

  const handleStartQuiz = (quiz) => {
    setCurrentQuiz(shuffleQuiz(quiz));
    setTimeLeft(quiz.duration * 60);
    setAnswers({});
    setQuizState('playing');
  };

  const handleFinishQuiz = () => {
    let rightAnswers = 0;
    currentQuiz.questions.forEach((q, index) => {
      if (answers[index] === q.correctAnswer) rightAnswers++;
    });
    setScore(rightAnswers);
    setQuizState('result');

    const newResult = {
      id: Date.now().toString(),
      studentName: studentName,
      quizTitle: currentQuiz.title,
      score: rightAnswers,
      totalQuestions: currentQuiz.questions.length,
      percent: Math.round((rightAnswers / currentQuiz.questions.length) * 100),
      date: new Date().toLocaleTimeString() + ' ' + new Date().toLocaleDateString()
    };
    setResults([newResult, ...results]);
  };

  const handleCreateQuiz = (e) => {
    e.preventDefault();
    if (!newTitle || !newDesc) return;
    const created = {
      id: Date.now().toString(),
      title: newTitle,
      description: newDesc,
      duration: parseInt(newDuration),
      questions: newQuestions.map((q, i) => ({ ...q, id: `nq-${Date.now()}-${i}` }))
    };
    setQuizzes([...quizzes, created]);
    setNewTitle(''); setNewDesc(''); setNewDuration(15);
    setNewQuestions([{ text: '', options: ['', '', '', ''], correctAnswer: 0 }]);
    setActiveTab('savollar'); // Test yaratilgach ro'yxat oynasiga o'tkazish
  };

  const styles = {
    bg: darkMode ? '#0b1329' : '#f8fafc',
    text: darkMode ? '#ffffff' : '#0f172a',
    textMuted: darkMode ? '#94a3b8' : '#475569',
    cardBg: darkMode ? '#1e293b' : '#ffffff',
    cardBorder: darkMode ? '1px solid #334155' : '1px solid #e2e8f0',
    headerBg: darkMode ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.9)',
    inputBg: darkMode ? '#334155' : '#ffffff',
    shadow: darkMode ? '0 4px 20px rgba(0, 0, 0, 0.4)' : '0 10px 30px rgba(148, 163, 184, 0.15)',
  };

  return (
    <div style={{ backgroundColor: styles.bg, color: styles.text, minHeight: '100vh', transition: 'all 0.3s' }} className="w-full relative overflow-hidden">

      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full filter blur-[120px] pointer-events-none opacity-30 bg-indigo-500"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[700px] h-[700px] rounded-full filter blur-[140px] pointer-events-none opacity-20 bg-emerald-500"></div>

      <div className="relative flex flex-col min-h-screen z-10 w-full">

        <header style={{ backgroundColor: styles.headerBg, borderBottom: styles.cardBorder }} className="backdrop-blur-xl sticky top-0 shadow-sm transition-all z-50">
          <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => { if (isLoggedIn && quizState === 'list') setQuizState('list'); }}>
              <div
                style={{
                  backgroundColor: darkMode ? '#f8f5f5' : '#0a3db3',
                  boxShadow: styles.shadow
                }}
                className="p-2.5 rounded-2xl transition-all duration-300 flex items-center justify-center"
              >
                <BookOpen
                  size={22}
                  style={{
                    color: darkMode ? '#110cb5' : '#ffffff'
                  }}
                  className="transition-colors duration-300"
                />
              </div>
              <div>
                <h1
                  style={{
                    color: darkMode ? '#ffffff' : '#0f172a' 
                  }}
                  className="text-lg font-black tracking-tight transition-colors duration-300"
                >
                  Edu Test Platforma
                </h1>
                {isLoggedIn && (
                  <p className="text-[11px] font-bold text-emerald-600">
                    {role === 'student' ? `O‘quvchi: ${studentName}` : `Ustoz: ${savedTeacher?.login}`}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDarkMode(!darkMode)}
                style={{ backgroundColor: darkMode ? '#6c9dde' : '#7a7b7c', color: styles.text, border: styles.cardBorder, cursor:'pointer' }}
                className="p-2.5 rounded-xl font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
              >
                {darkMode ? '☀️Light' : '🌙Dark'}
              </button>

              {role && (
                <button onClick={() => { setRole(null); setIsLoggedIn(false); setQuizState('list'); }} style={{ backgroundColor: darkMode ? '#334155' : '#c9d1dc', color: styles.text }} className="flex items-center gap-1.5 text-xs font-bold px-3 py-2.5 rounded-xl transition-all">
                  <LogOut size={14} /> Chiqish
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 flex flex-col justify-center">
          <AnimatePresence mode="wait">

            {!role && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-xl mx-auto text-center my-6 w-full">
                <h2 style={{ color: styles.text }} className="text-3xl font-black tracking-tight mb-2">Tizimga kirishni tanlang</h2>
                <p style={{ color: styles.textMuted }} className="text-sm mb-8">Davom etish uchun o'zingizga tegishli panelni tanlang.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <motion.button 
                    whileHover={{ scale: 1.02, y: -2 }} 
                    whileTap={{ scale: 0.98 }} 
                    onClick={() => setRole('teacher')} 
                    style={{ 
                      backgroundColor: darkMode ? '#1e293b' : 'rgba(129, 144, 173, 0.8)', 
                      border: darkMode ? '1px solid #334155' : '1px solid #bae6fd',
                      boxShadow: '0 4px 20px rgba(117, 172, 244, 0.5)',cursor:'pointer' 
                    }} 
                    className="p-6 rounded-3xl text-left transition-all group"
                  >
                    <div 
                      style={{
                        backgroundColor: darkMode ? '#ffffff' : '#315a6f',boxShadow: '0 4px 20px rgba(87, 144, 214, 0.97)'
                      }}
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors duration-300 shadow-lg shadow-blue-500/20"
                    >
                      <User 
                        size={24} 
                        style={{ color: darkMode ? '#0f172a' : '#ffffff' }} 
                      />
                    </div>
                    <h3 style={{ color: styles.text }} className="font-extrabold text-lg mb-1">O'qituvchi Paneli</h3>
                    <p style={{ color: styles.textMuted }} className="text-xs leading-relaxed">Testlarni boshqarish, yangi savollar va natijalar reytingi.</p>
                  </motion.button>

                  <motion.button 
                    whileHover={{ scale: 1.02, y: -2 }} 
                    whileTap={{ scale: 0.98 }} 
                    onClick={() => setRole('student')} 
                    style={{ 
                      backgroundColor: darkMode ? '#1e293b' : 'rgba(166, 174, 171, 0.8)', 
                      border: darkMode ? '1px solid #334155' : '1px solid #bbf7d0',
                      boxShadow: '0 4px 20px rgba(130, 180, 247, 0.5)',cursor:'pointer' 
                    }} 
                    className="p-6 rounded-3xl text-left transition-all group"
                  >
                    <div 
                      style={{
                        backgroundColor: darkMode ? '#f3eded' : '#2f7384', 
                        boxShadow: '0 4px 20px rgba(129, 185, 249, 0.59)'
                      }}
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors duration-300 shadow-lg shadow-emerald-500/20"
                    >
                      <Award 
                        size={24} 
                        style={{ color: darkMode ? '#101623' : '#ffffff' }} 
                      />
                    </div>
                    <h3 style={{ color: styles.text }} className="font-extrabold text-lg mb-1">O'quvchi Paneli</h3>
                    <p style={{ color: styles.textMuted }} className="text-xs leading-relaxed">Aralashgan professional testlarni topshirish xonasi.</p>
                  </motion.button>
                </div>
              </motion.div>
            )}

            {role && !isLoggedIn && (
              <motion.div style={{ backgroundColor: styles.cardBg, border: styles.cardBorder, boxShadow: '0 2px 4px rgba(255, 255, 255, 0.4)' }} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-md w-full mx-auto p-8 rounded-2xl shadow-xl">
                <form onSubmit={role === 'teacher' ? (savedTeacher ? handleTeacherLogin : handleTeacherRegister) : handleStudentLogin} className="space-y-4">
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center mx-auto mb-2">
                      {role === 'teacher' ? <Lock size={22} /> : <User size={22} />}
                    </div>
                    <h3 style={{ color: styles.text }} className="text-xl font-black">{role === 'teacher' ? (savedTeacher ? 'O‘qituvchi Kirishi' : 'Ro‘yxatdan o‘tish') : 'Ismingizni kiriting'}</h3>
                  </div>
                  {authError && <p className="text-xs text-red-500 bg-red-50 p-2.5 rounded-lg text-center font-bold">{authError}</p>}

                  {role === 'teacher' ? (
                    <>
                      <input type="text" required placeholder="Login" value={teacherLogin} onChange={e => setTeacherLogin(e.target.value)} style={{ backgroundColor: styles.inputBg, color: styles.text, border: styles.cardBorder }} className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none" />
                      <input type="password" required placeholder="Parol" value={teacherPassword} onChange={e => setTeacherPassword(e.target.value)} style={{ backgroundColor: styles.inputBg, color: styles.text, border: styles.cardBorder }} className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none" />
                    </>
                  ) : (
                    <input type="text" required placeholder="Ism va Familiyangiz" value={studentName} onChange={e => setStudentName(e.target.value)} style={{ backgroundColor: styles.inputBg, color: styles.text, border: styles.cardBorder }} className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none" />
                  )}
                  <button
                    type="submit"
                    style={{
                      backgroundColor: darkMode ? '#ffffff' : '#0f172a',
                      color: darkMode ? '#0f172a' : '#ffffff',
                      boxShadow: '0 2px 4px rgba(150, 172, 238, 0.97)' 
                    }}
                    className="w-full font-bold py-3 rounded-xl hover:opacity-90 active:scale-[0.99] transition-all text-sm"
                  >
                    Tasdiqlash
                  </button>
                </form>
              </motion.div>
            )}

            {/* O'QITUVCHI PROFESSIONALL DASHBOARD (BOSHQARUV MARKAZI) */}
            {role === 'teacher' && isLoggedIn && quizState === 'list' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-8">
                
                {/* DASHBOARD HEADER */}
                <div className="space-y-1">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">O'qituvchi paneli</span>
                  <h2 style={{ color: styles.text }} className="text-3xl font-black tracking-tight">Boshqaruv markazi</h2>
                  <p style={{ color: styles.textMuted }} className="text-sm">Testlar yarating, o'quvchilarga ruxsat bering va natijalarni kuzating.</p>
                </div>

                {/* TAB MENYU */}
                <div style={{ borderBottom: styles.cardBorder }} className="flex items-center gap-6 pb-px overflow-x-auto">
                  {[
                    { id: 'umumiy', label: '📊 Umumiy Statistika' },
                    { id: 'yaratish', label: '✨ Yangi Test Yaratish' },
                    { id: 'savollar', label: '📝 Imtihonlar ro\'yxati' },
                    { id: 'natijalar', label: '📈 Reyting & Natijalar' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      style={{ 
                        color: activeTab === tab.id ? '#4f46e5' : styles.textMuted,
                        borderBottom: activeTab === tab.id ? '2px solid #4f46e5' : '2px solid transparent'
                      }}
                      className="pb-3 text-sm font-bold transition-all whitespace-nowrap px-1 relative -mb-px cursor-pointer"
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* 1. UMUMIY TAB */}
                {activeTab === 'umumiy' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                      <div style={{ backgroundColor: styles.cardBg, border: styles.cardBorder, boxShadow: styles.shadow }} className="p-5 rounded-2xl flex items-center justify-between">
                        <div className="space-y-1">
                          <p style={{ color: styles.textMuted }} className="text-xs font-medium">Umumiy testlar</p>
                          <h3 style={{ color: styles.text }} className="text-3xl font-black">{quizzes.length}</h3>
                          <p className="text-[10px] text-slate-400">Tizimdagi jami fanlar</p>
                        </div>
                        <div className="bg-gradient-to-tr from-indigo-500 to-indigo-100 p-3 rounded-xl text-indigo-600"><BookOpen size={20} /></div>
                      </div>

                      <div style={{ backgroundColor: styles.cardBg, border: styles.cardBorder, boxShadow: styles.shadow }} className="p-5 rounded-2xl flex items-center justify-between">
                        <div className="space-y-1">
                          <p style={{ color: styles.textMuted }} className="text-xs font-medium">Faol talabalar</p>
                          <h3 style={{ color: styles.text }} className="text-3xl font-black">{new Set(results.map(r => r.studentName)).size}</h3>
                          <p className="text-[10px] text-emerald-500 font-semibold">Test topshirganlar</p>
                        </div>
                        <div className="bg-gradient-to-tr from-emerald-500 to-emerald-100 p-3 rounded-xl text-emerald-600"><User size={20} /></div>
                      </div>

                      <div style={{ backgroundColor: styles.cardBg, border: styles.cardBorder, boxShadow: styles.shadow }} className="p-5 rounded-2xl flex items-center justify-between">
                        <div className="space-y-1">
                          <p style={{ color: styles.textMuted }} className="text-xs font-medium">O'rtacha o'zlashtirish</p>
                          <h3 style={{ color: styles.text }} className="text-3xl font-black">
                            {results.length > 0 ? Math.round(results.reduce((acc, c) => acc + c.percent, 0) / results.length) : 0}%
                          </h3>
                          <p className="text-[10px] text-amber-500 font-semibold">Umumiy ko'rsatkich</p>
                        </div>
                        <div className="bg-gradient-to-tr from-amber-500 to-amber-100 p-3 rounded-xl text-amber-600"><Award size={20} /></div>
                      </div>

                      <div style={{ backgroundColor: styles.cardBg, border: styles.cardBorder, boxShadow: styles.shadow }} className="p-5 rounded-2xl flex items-center justify-between">
                        <div className="space-y-1">
                          <p style={{ color: styles.textMuted }} className="text-xs font-medium">Jami urinishlar</p>
                          <h3 style={{ color: styles.text }} className="text-3xl font-black">{results.length} marta</h3>
                          <p className="text-[10px] text-rose-400">Yuborilgan javoblar</p>
                        </div>
                        <div className="bg-gradient-to-tr from-rose-500 to-rose-100 p-3 rounded-xl text-rose-600"><Clock size={20} /></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div style={{ backgroundColor: styles.cardBg, border: styles.cardBorder, boxShadow: styles.shadow }} className="p-5 rounded-2xl lg:col-span-1 space-y-4">
                        <h4 style={{ color: styles.text }} className="font-bold text-sm">Fanlar tahlili</h4>
                        <div className="space-y-4">
                          {quizzes.map(q => {
                            const quizRes = results.filter(r => r.quizTitle === q.title);
                            const avg = quizRes.length > 0 ? Math.round(quizRes.reduce((a,c) => a + c.percent, 0) / quizRes.length) : 0;
                            return (
                              <div key={q.id} className="space-y-1.5">
                                <div className="flex justify-between text-xs font-medium">
                                  <span style={{ color: styles.text }} className="truncate max-w-[150px]">{q.title}</span>
                                  <span style={{ color: styles.textMuted }}>{avg}% ({quizRes.length} urinish)</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                  <div style={{ width: `${avg || 4}%` }} className="bg-indigo-600 h-full rounded-full transition-all duration-500" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div style={{ backgroundColor: styles.cardBg, border: styles.cardBorder, boxShadow: styles.shadow }} className="p-5 rounded-2xl lg:col-span-2 space-y-4">
                        <h4 style={{ color: styles.text }} className="font-bold text-sm">Oxirgi faolliklar</h4>
                        <div className="space-y-3 max-h-[260px] overflow-y-auto">
                          {results.slice(0, 4).map(res => (
                            <div key={res.id} style={{ borderBottom: styles.cardBorder }} className="flex items-center justify-between pb-3 last:border-none last:pb-0">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl flex items-center justify-center font-bold text-xs">{res.studentName[0]}</div>
                                <div>
                                  <h5 style={{ color: styles.text }} className="text-xs font-bold">{res.studentName}</h5>
                                  <p style={{ color: styles.textMuted }} className="text-[10px]">{res.quizTitle}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">{res.percent}%</span>
                                <p style={{ color: styles.textMuted }} className="text-[9px] mt-0.5">{res.date}</p>
                              </div>
                            </div>
                          ))}
                          {results.length === 0 && (
                            <p style={{ color: styles.textMuted }} className="text-xs text-center py-8">Hozircha o'quvchilar tomonidan test topshirilmadi.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 2. TEST YARATISH TABI */}
                {activeTab === 'yaratish' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ backgroundColor: styles.cardBg, border: styles.cardBorder, boxShadow: styles.shadow }} className="p-6 rounded-2xl max-w-2xl mx-auto">
                    <h3 style={{ color: styles.text }} className="font-bold text-base mb-4 flex items-center gap-1.5"><Plus className="text-indigo-500" size={18} /> Yangi imtihon majmuasi yaratish</h3>
                    <form onSubmit={handleCreateQuiz} className="space-y-4">
                      <input type="text" required value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Fan nomi (Masalan: Matematika - 2-Chorak)" style={{ backgroundColor: styles.inputBg, color: styles.text, border: styles.cardBorder }} className="w-full px-4 py-3 rounded-xl text-xs focus:outline-none" />
                      <textarea required value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Test haqida qisqacha izoh yoki ko'rsatmalar..." rows="3" style={{ backgroundColor: styles.inputBg, color: styles.text, border: styles.cardBorder }} className="w-full px-4 py-3 rounded-xl text-xs focus:outline-none"></textarea>
                      <input type="number" value={newDuration} onChange={e => setNewDuration(e.target.value)} placeholder="Ajratilgan vaqt (daqiqa hisobida)" style={{ backgroundColor: styles.inputBg, color: styles.text, border: styles.cardBorder }} className="w-full px-4 py-3 rounded-xl text-xs focus:outline-none" />
                      
                      <div style={{ borderTop: styles.cardBorder }} className="pt-4 space-y-4">
                        <div className="flex items-center justify-between"><label style={{ color: styles.text }} className="text-xs font-bold uppercase tracking-wider">Savollar ro'yxati ({newQuestions.length})</label><button type="button" onClick={() => setNewQuestions([...newQuestions, { text: '', options: ['', '', '', ''], correctAnswer: 0 }])} className="text-xs font-bold text-indigo-600 hover:underline">+ Savol qo'shish</button></div>
                        {newQuestions.map((q, qIdx) => (
                          <div key={qIdx} style={{ backgroundColor: styles.bg, border: styles.cardBorder }} className="p-4 rounded-xl space-y-3">
                            <input type="text" required placeholder={`Savol matnini kiriting`} value={q.text} onChange={e => { const u = [...newQuestions]; u[qIdx].text = e.target.value; setNewQuestions(u); }} style={{ backgroundColor: styles.cardBg, color: styles.text, border: styles.cardBorder }} className="w-full px-3 py-2 rounded-lg text-xs" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {q.options.map((opt, oIdx) => (
                                <div key={oIdx} style={{ backgroundColor: styles.cardBg, border: styles.cardBorder }} className="flex items-center gap-2 px-3 py-1.5 rounded-lg">
                                  <input type="radio" name={`correct-${qIdx}`} checked={q.correctAnswer === oIdx} onChange={() => { const u = [...newQuestions]; u[qIdx].correctAnswer = oIdx; setNewQuestions(u); }} className="accent-indigo-600" />
                                  <input type="text" required placeholder={`Variant ${oIdx+1}`} value={opt} onChange={e => { const u = [...newQuestions]; u[qIdx].options[oIdx] = e.target.value; setNewQuestions(u); }} style={{ color: styles.text }} className="w-full bg-transparent border-none text-xs focus:outline-none" />
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-3 rounded-xl shadow-lg transition-all">Ma'lumotlarni saqlash va e'lon qilish</button>
                    </form>
                  </motion.div>
                )}

                {/* 3. MAVJUD IMTIHONLAR RO'YXATI */}
                {activeTab === 'savollar' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {quizzes.map(quiz => (
                      <div key={quiz.id} style={{ backgroundColor: styles.cardBg, border: styles.cardBorder, boxShadow: styles.shadow }} className="p-5 rounded-2xl flex flex-col justify-between transition-all">
                        <div>
                          <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 mb-2">{quiz.duration} daqiqa</span>
                          <h3 style={{ color: styles.text }} className="font-extrabold text-base mb-1">{quiz.title}</h3>
                          <p style={{ color: styles.textMuted }} className="text-xs line-clamp-2 mb-4">{quiz.description}</p>
                        </div>
                        <div style={{ borderTop: styles.cardBorder }} className="flex items-center justify-between pt-3 mt-4">
                          <span style={{ color: styles.textMuted }} className="text-[11px] font-bold">{quiz.questions.length} ta test savoli</span>
                          <button onClick={() => setQuizzes(quizzes.filter(q => q.id !== quiz.id))} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    ))}
                    {quizzes.length === 0 && (
                      <p style={{ color: styles.textMuted }} className="text-xs text-center py-12 col-span-full">Hozircha hech qanday test mavjud emas.</p>
                    )}
                  </motion.div>
                )}

                {/* 4. REYTING JADVALI */}
                {activeTab === 'natijalar' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ backgroundColor: styles.cardBg, border: styles.cardBorder, boxShadow: styles.shadow }} className="rounded-2xl p-5 overflow-hidden">
                    <h3 style={{ color: styles.text }} className="font-bold text-base mb-4">O'quvchilar reytingi (Barcha natijalar)</h3>
                    {results.length === 0 ? (
                      <p style={{ color: styles.textMuted }} className="text-xs text-center py-8">Tizimda hozircha natijalar qayd etilmagan.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr style={{ borderBottom: styles.cardBorder, color: styles.textMuted }} className="font-bold">
                              <th className="p-3">O'quvchi ismi</th>
                              <th>Topshirgan fani</th>
                              <th>To'g'ri javoblar</th>
                              <th>Ko'rsatkich</th>
                              <th>Topshirilgan vaqt</th>
                            </tr>
                          </thead>
                          <tbody style={{ color: styles.text }}>
                            {results.map(res => (
                              <tr key={res.id} style={{ borderBottom: styles.cardBorder }} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-all">
                                <td className="p-3 font-bold">{res.studentName}</td>
                                <td>{res.quizTitle}</td>
                                <td className="font-semibold">{res.score} / {res.totalQuestions}</td>
                                <td><span className="px-2.5 py-1 rounded-lg font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">{res.percent}%</span></td>
                                <td style={{ color: styles.textMuted }}>{res.date}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* O'QUVCHI UCHUN TESTLAR RO'YXATI */}
            {role === 'student' && isLoggedIn && quizState === 'list' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">O'quvchi xonasi</span>
                  <h2 style={{ color: styles.text }} className="text-2xl font-black flex items-center gap-2"><Award className="text-indigo-500" size={22} /> Sentyabr oyi imtihonlari ({quizzes.length})</h2>
                  <p style={{ color: styles.textMuted }} className="text-xs">Ajratilgan vaqt tugashidan oldin javoblarni belgilab topshirishga ulguring.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {quizzes.map(quiz => (
                    <motion.div key={quiz.id} style={{ backgroundColor: styles.cardBg, border: styles.cardBorder, boxShadow: styles.shadow }} className="p-5 rounded-2xl flex flex-col justify-between transition-all">
                      <div>
                        <span style={{ backgroundColor: styles.bg, color: styles.text }} className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md mb-2"><Clock size={10} /> {quiz.duration} min</span>
                        <h3 style={{ color: styles.text }} className="font-extrabold text-base mb-1">{quiz.title}</h3>
                        <p style={{ color: styles.textMuted }} className="text-xs line-clamp-2 mb-4">{quiz.description}</p>
                      </div>
                      <div style={{ borderTop: styles.cardBorder }} className="flex items-center justify-between pt-3 mt-2">
                        <span style={{ color: styles.textMuted }} className="text-[11px] font-medium">{quiz.questions.length} ta savol</span>
                        <button onClick={() => handleStartQuiz(quiz)} className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"><Play size={10} fill="white" /> Boshlash</button>
                      </div>
                    </motion.div>
                  ))}
                  </div>
              </motion.div>
            )}

            {/* TEST JAYRONI (PLAYING CHESS) */}
            {quizState === 'playing' && currentQuiz && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ backgroundColor: styles.cardBg, border: styles.cardBorder }} className="max-w-2xl w-full mx-auto rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                  <div><h3 className="font-extrabold text-base">{currentQuiz.title}</h3><p className="text-[11px] text-slate-400">Savollar tasodifiy aralashtirilgan</p></div>
                  <div className="bg-slate-800 text-indigo-400 px-3 py-1.5 rounded-xl font-mono text-xs font-bold flex items-center gap-1.5">
                    <Clock size={14} /> {Math.floor(timeLeft / 60)}:{timeLeft % 60 < 10 ? '0' : ''}{timeLeft % 60}
                  </div>
                </div>
                <div className="p-6 space-y-5">
                  {currentQuiz.questions.map((q, qIdx) => (
                    <div key={q.id} className="space-y-2.5">
                      <h4 style={{ color: styles.text }} className="font-bold text-sm">{qIdx + 1}. {q.text}</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {q.options.map((opt, oIdx) => (
                          <button key={oIdx} type="button" onClick={() => setAnswers({ ...answers, [qIdx]: oIdx })} style={{ backgroundColor: answers[qIdx] === oIdx ? 'rgba(79, 70, 229, 0.15)' : styles.bg, color: styles.text, border: answers[qIdx] === oIdx ? '2px solid #4f46e5' : styles.cardBorder, cursor:'pointer' }} className="w-full text-left px-4 py-2.5 rounded-xl text-xs transition-all">{opt}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button onClick={handleFinishQuiz} className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-3 rounded-xl shadow-md flex items-center justify-center gap-1.5 text-xs cursor-pointer"><CheckCircle size={15} /> Yakunlash</button>
                </div>
              </motion.div>
            )}

            {/* TEST TUGAGANDAGI NATIJA (RESULT) */}
            {quizState === 'result' && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ backgroundColor: styles.cardBg, border: styles.cardBorder }} className="max-w-md w-full mx-auto p-8 rounded-2xl shadow-xl text-center">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={36} />
                </div>
                <h3 style={{ color: styles.text }} className="text-2xl font-black mb-1">Imtihon Yakunlandi!</h3>
                <p style={{ color: styles.textMuted }} className="text-sm mb-6">Sizning natijangiz muvaffaqiyatli saqlandi.</p>
                <div style={{ backgroundColor: styles.bg }} className="p-4 rounded-xl mb-6">
                  <span style={{ color: styles.textMuted }} className="text-xs uppercase font-bold tracking-wider">To'g'ri javoblar</span>
                  <h2 style={{ color: styles.text }} className="text-4xl font-black mt-1">{score} / {currentQuiz?.questions.length}</h2>
                </div>
                <button onClick={() => setQuizState('list')} className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-xl shadow-md hover:bg-indigo-700 transition-all text-xs cursor-pointer">Bosh sahifaga qaytish</button>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}