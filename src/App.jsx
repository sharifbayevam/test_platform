import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Play, CheckCircle, User, Award, Clock, LogOut, BookOpen, Lock, Edit2, FileText, Users, Key, AlertCircle, ArrowRight, Download, UserPlus, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Tetris from '../Tetris';
import * as XLSX from 'xlsx';

export default function App() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [role, setRole] = useState(null); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState('login'); 
  const [activeTab, setActiveTab] = useState('umumiy'); 
  
  // Auth States
  const [regName, setRegName] = useState('');
  const [inputLogin, setInputLogin] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  // Sessiyalar
  const [currentTeacher, setCurrentTeacher] = useState(null);
  const [currentStudent, setCurrentStudent] = useState(null);

  // Mahalliy Server xotirasi (LocalStorage)
  const [teachers, setTeachers] = useState(() => JSON.parse(localStorage.getItem('edu_teachers')) || []);
  const [quizzes, setQuizzes] = useState(() => JSON.parse(localStorage.getItem('edu_quizzes')) || []);
  const [allowedStudents, setAllowedStudents] = useState(() => JSON.parse(localStorage.getItem('edu_students')) || []);
  const [results, setResults] = useState(() => JSON.parse(localStorage.getItem('edu_results')) || []);

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
  const [newQuestions, setNewQuestions] = useState([{ text: '', options: ['', '', '', ''], correctAnswer: 0 }]);

  const [studName, setStudName] = useState('');
  const [studUsername, setStudUsername] = useState('');
  const [studPassword, setStudPassword] = useState('');

  // Variantlar harflari massivi
  const optionLetters = ['A', 'B', 'C', 'D'];

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) { root.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    else { root.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [darkMode]);

  useEffect(() => { localStorage.setItem('edu_teachers', JSON.stringify(teachers)); }, [teachers]);
  useEffect(() => { localStorage.setItem('edu_quizzes', JSON.stringify(quizzes)); }, [quizzes]);
  useEffect(() => { localStorage.setItem('edu_students', JSON.stringify(allowedStudents)); }, [allowedStudents]);
  useEffect(() => { localStorage.setItem('edu_results', JSON.stringify(results)); }, [results]);

  // JONLI TAYMER (TIMER) KOD QISMI
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

  // Anti-cheat o'g'rilikka qarshi nazorat
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && quizState === 'playing') {
        setCheatCount(prev => prev + 1);
        alert("Ogohlantirish! Boshqa oynaga o'tish taqiqlanadi. Natijalarda bu qayd etiladi!");
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [quizState]);

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

  const handleAddStudent = (e) => {
    e.preventDefault();
    if (!studName || !studUsername || !studPassword) return;
    if (allowedStudents.some(s => s.username === studUsername.trim())) {
      alert("Bu o'quvchi logini bazada mavjud!");
      return;
    }
    setAllowedStudents([...allowedStudents, { 
      id: 's_' + Date.now(), teacherId: currentTeacher.id, name: studName, username: studUsername.trim(), password: studPassword.trim() 
    }]);
    setStudName(''); setStudUsername(''); setStudPassword('');
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
    setNewQuestions([{ text: '', options: ['', '', '', ''], correctAnswer: 0 }]);
    setActiveTab('savollar');
  };

  const handleFinishQuiz = () => {
    let rightAnswers = 0;
    currentQuiz.questions.forEach((q, idx) => { if (answers[idx] === q.correctAnswer) rightAnswers++; });
    const diffMs = Date.now() - quizStartTime;
    const timeSpentStr = `${Math.floor(diffMs / 60000)} daqiqa, ${Math.floor((diffMs % 60000) / 1000)} soniya`;
    const percent = Math.round((rightAnswers / currentQuiz.questions.length) * 100);
    
    setLatestScore({ score: rightAnswers, total: currentQuiz.questions.length, percent, timeSpent: timeSpentStr });

    setResults([{
      id: 'res_' + Date.now(),
      teacherId: currentQuiz.teacherId,
      studentName: currentStudent.name,
      quizTitle: currentQuiz.title,
      score: rightAnswers,
      totalQuestions: currentQuiz.questions.length,
      percent,
      timeSpent: timeSpentStr,
      cheats: cheatCount,
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

  const styles = {
    bg: darkMode ? 'linear-gradient(135deg, #090d16 0%, #111827 100%)' : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
    card: darkMode ? 'bg-slate-900/90 border border-slate-800/80 shadow-2xl backdrop-blur-md' : 'bg-white border border-slate-200 shadow-lg backdrop-blur-md',
    text: darkMode ? 'text-slate-100' : 'text-slate-900',
    muted: darkMode ? 'text-slate-400' : 'text-slate-600',
    input: darkMode ? 'bg-slate-850 border-slate-700 text-white focus:ring-2 focus:ring-indigo-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-600',
  };

  return (
    <div style={{ background: styles.bg }} className="w-full min-h-screen font-sans transition-all duration-300 pb-12 text-xs">
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 w-full bg-slate-900/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => { if(isLoggedIn) setQuizState('list'); }}>
          <div className="p-2 bg-indigo-600 rounded-xl text-white"><BookOpen size={20} /></div>
          <div>
            <h1 className="text-lg font-black tracking-wider">EDU-CRM PLATFORM</h1>
            {isLoggedIn && <span className="text-[10px] text-emerald-400 font-bold">● {role === 'teacher' ? `Ustoz: ${currentTeacher?.name}` : `O'quvchi: ${currentStudent?.name}`}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setDarkMode(!darkMode)} className="px-3 py-2 bg-white/10 rounded-lg font-bold hover:bg-white/20 transition-all cursor-pointer">
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
          {isLoggedIn && (
            <button onClick={() => { setRole(null); setIsLoggedIn(false); setQuizState('list'); setCurrentTeacher(null); setCurrentStudent(null); setAuthMode('login'); }} className="px-3 py-2 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition-all cursor-pointer">
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
              <h2 className={`text-3xl font-black ${styles.text}`}>LMS & Imtihon Boshqaruv Tizimi</h2>
              <p className={styles.muted}>Xavfsiz va shaxsiy login parollarga asoslangan o'quv platformasi.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div onClick={() => { setRole('teacher'); setAuthMode('login'); }} className={`p-6 rounded-2xl cursor-pointer text-left ${styles.card} hover:border-indigo-500 transition-all`}>
                  <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white mb-4"><Users size={20}/></div>
                  <h3 className={`font-bold text-sm mb-1 ${styles.text}`}>O‘qituvchi Kabineti</h3>
                  <p className={styles.muted}>O'z parolingizni qo'yib kirish, testlar va o'quvchilar qo'shish.</p>
                </div>
                <div onClick={() => setRole('student')} className={`p-6 rounded-2xl cursor-pointer text-left ${styles.card} hover:border-emerald-500 transition-all`}>
                  <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white mb-4"><Award size={20}/></div>
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
                    <input type="text" required placeholder="Masalan: Sharifbayeva Hosiyat" value={regName} onChange={e => setRegName(e.target.value)} className={`w-full p-2.5 rounded-xl border focus:outline-none ${styles.input}`} />
                  </div>
                )}

                <div>
                  <label className={`block mb-1 font-bold ${styles.text}`}>Foydalanuvchi logini</label>
                  <input type="text" required placeholder="Login..." value={inputLogin} onChange={e => setInputLogin(e.target.value)} className={`w-full p-2.5 rounded-xl border focus:outline-none ${styles.input}`} />
                </div>
                <div>
                  <label className={`block mb-1 font-bold ${styles.text}`}>Parol</label>
                  <input type="password" required placeholder="Parol..." value={inputPassword} onChange={e => setInputPassword(e.target.value)} className={`w-full p-2.5 rounded-xl border focus:outline-none ${styles.input}`} />
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
                  <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 rounded-lg font-bold uppercase tracking-wider transition-all cursor-pointer ${activeTab === t ? 'bg-indigo-600 text-white shadow' : `${styles.muted} hover:bg-black/5`}`}>
                    {t === 'umumiy' ? '📊 Tahlil' : t === 'yaratish' ? '📝 Test Tuzish' : t === 'savollar' ? '📚 Imtihonlar' : t === 'oquvchilar' ? '🔑 O\'quvchilar' : '📈 Natijalar'}
                  </button>
                ))}
              </div>

              {/* TAB: UMUMIY */}
              {activeTab === 'umumiy' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`p-5 rounded-xl ${styles.card}`}>
                    <p className={styles.muted}>Yaratilgan testlar fani</p>
                    <h2 className={`text-2xl font-black ${styles.text}`}>{myQuizzes.length} ta fandan</h2>
                  </div>
                  <div className={`p-5 rounded-xl ${styles.card}`}>
                    <p className={styles.muted}>Ruxsat berilgan joriy o'quvchilar</p>
                    <h2 className={`text-2xl font-black ${styles.text}`}>{myStudents.length} nafar</h2>
                  </div>
                  <div className={`p-5 rounded-xl ${styles.card}`}>
                    <p className={styles.muted}>Jami topshirilgan urinishlar</p>
                    <h2 className={`text-2xl font-black ${styles.text}`}>{myResults.length} marta</h2>
                  </div>
                </div>
              )}

              {/* TAB: YARATISH */}
              {activeTab === 'yaratish' && (
                <div className={`p-5 rounded-xl ${styles.card}`}>
                  <h3 className={`font-bold mb-4 ${styles.text}`}>{editingQuiz ? 'Testni Tahrirlash' : 'Yangi Test Yaratish'}</h3>
                  <form onSubmit={handleCreateOrUpdateQuiz} className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      <input type="text" required placeholder="Fan/Imtihon nomi" value={newTitle} onChange={e => setNewTitle(e.target.value)} className={`col-span-2 p-2.5 rounded-xl border ${styles.input}`} />
                      <input type="number" required placeholder="Vaqt (daqiqa)" value={newDuration} onChange={e => setNewDuration(e.target.value)} className={`p-2.5 rounded-xl border ${styles.input}`} />
                    </div>
                    <textarea placeholder="Imtihon qoidalari yoki tavsif..." value={newDesc} onChange={e => setNewDesc(e.target.value)} className={`w-full p-2.5 rounded-xl border ${styles.input}`}></textarea>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between font-bold">
                        <span className={styles.text}>Savollar ro'yxati ({newQuestions.length})</span>
                        <button type="button" onClick={() => setNewQuestions([...newQuestions, {text:'', options:['','','',''], correctAnswer:0}])} className="text-indigo-500 font-black">+ Yangi Savol Qo'shish</button>
                      </div>
                      {newQuestions.map((q, idx) => (
                        <div key={idx} className="p-4 bg-black/5 dark:bg-white/5 rounded-xl space-y-2 border border-slate-700/10">
                          <input type="text" placeholder={`Savol matni ${idx+1}`} value={q.text} onChange={e => { const u = [...newQuestions]; u[idx].text = e.target.value; setNewQuestions(u); }} className={`w-full p-2 rounded-lg ${styles.input}`} />
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
                          <Clock size={12}/> <span>{q.duration} daqiqa</span>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-slate-700/10">
                        <button onClick={() => startEditQuiz(q)} className="text-indigo-500 p-1 hover:bg-indigo-500/5 rounded"><Edit2 size={14}/></button>
                        <button onClick={() => setQuizzes(quizzes.filter(qz => qz.id !== q.id))} className="text-rose-500 p-1 hover:bg-rose-500/5 rounded"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB: O'QUVCHILAR */}
              {activeTab === 'oquvchilar' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <form onSubmit={handleAddStudent} className={`p-4 rounded-xl space-y-3 ${styles.card}`}>
                    <h4 className={`font-bold ${styles.text}`}>O'quvchiga Login/Parol Yaratish</h4>
                    <input type="text" required placeholder="F.I.O" value={studName} onChange={e => setStudName(e.target.value)} className={`w-full p-2 rounded-lg ${styles.input}`} />
                    <input type="text" required placeholder="Kirish logini" value={studUsername} onChange={e => setStudUsername(e.target.value)} className={`w-full p-2 rounded-lg ${styles.input}`} />
                    <input type="text" required placeholder="Parol" value={studPassword} onChange={e => setStudPassword(e.target.value)} className={`w-full p-2 rounded-lg ${styles.input}`} />
                    <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-2 rounded-lg cursor-pointer">Bazaga Qo'shish</button>
                  </form>
                  <div className={`lg:col-span-2 p-4 rounded-xl ${styles.card}`}>
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-600/20 text-indigo-500 font-bold">
                          <th className="pb-2">F.I.O</th>
                          <th className="pb-2">Login</th>
                          <th className="pb-2">Parol</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myStudents.map(s => (
                          <tr key={s.id} className="border-b border-slate-600/10">
                            <td className={`py-2 font-bold ${styles.text}`}>{s.name}</td>
                            <td className="py-2 text-amber-500 font-mono">{s.username}</td>
                            <td className={`py-2 font-mono ${styles.muted}`}>{s.password}</td>
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
                      <Download size={14}/> Excelga Yuklash
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
                          <td className="text-rose-500 font-mono font-bold">{r.cheats || 0} marta tab almashgan</td>
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
                  {quizzes.filter(q => q.teacherId === currentStudent.teacherId).map(q => (
                    <div key={q.id} className={`p-5 rounded-xl flex flex-col justify-between ${styles.card}`}>
                      <div>
                        <h3 className={`font-black text-sm my-2 ${styles.text}`}>{q.title}</h3>
                        <p className={styles.muted}>{q.description}</p>
                        <div className="flex items-center gap-1 text-emerald-500 font-bold mt-2">
                          <Clock size={12}/> Berilgan vaqt: {q.duration} daqiqa
                        </div>
                      </div>
                      <button onClick={() => { setCurrentQuiz(q); setTimeLeft(q.duration * 60); setQuizStartTime(Date.now()); setAnswers({}); setCheatCount(0); setQuizState('playing'); }} className="w-full bg-indigo-600 text-white font-bold py-2.5 rounded-xl mt-4 cursor-pointer">
                        Imtihonni Boshlash
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* JONLI IMTIHON TOPShIRISh VA TAYMER KO'RINISHI */}
              {quizState === 'playing' && currentQuiz && (
                <div className="max-w-2xl mx-auto space-y-4">
                  
                  {/* TEPADAGI STICKY VAQT TAYMERI */}
                  <div className={`p-4 rounded-xl flex justify-between items-center sticky top-20 z-40 ${styles.card}`}>
                    <div>
                      <h4 className={`font-black text-sm ${styles.text}`}>{currentQuiz.title}</h4>
                      <p className="text-[10px] text-amber-500 font-bold">Ogohlantirish: Boshqa oynaga o'tsangiz qayd etiladi!</p>
                    </div>
                    {/* VAQT TAYMERI */}
                    <div className="bg-rose-500 text-white font-mono font-black text-sm px-4 py-2 rounded-xl shadow animate-pulse flex items-center gap-2">
                      <Clock size={14}/>
                      <span>
                        Qoldi: {Math.floor(timeLeft / 60)}:{timeLeft % 60 < 10 ? '0' : ''}{timeLeft % 60}
                      </span>
                    </div>
                  </div>
                  {/* TETRIS SAHIFASI ALOHIDA FAYLDAN CHAQIRILDI */}
{isLoggedIn && quizState === 'game' && (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    <Tetris darkMode={darkMode} /> {/* <--- O'yin shu yerda ochiladi */}
  </motion.div>
)}

                  {/* SAVOLLAR RO'YXATI VA ABC VARIANTLAR */}
                  {currentQuiz.questions.map((q, qIdx) => (
                    <div key={qIdx} className={`p-5 rounded-xl space-y-3 ${styles.card}`}>
                      <p className={`font-bold text-sm ${styles.text}`}>{qIdx + 1}. {q.text}</p>
                      <div className="grid grid-cols-1 gap-2">
                        {q.options.map((opt, oIdx) => (
                          <button type="button" key={oIdx} onClick={() => setAnswers({ ...answers, [qIdx]: oIdx })} className={`text-left p-3.5 rounded-xl border font-bold flex items-center gap-3 transition-all ${answers[qIdx] === oIdx ? 'bg-indigo-600 text-white border-indigo-500 shadow-md' : `${styles.input} hover:bg-black/5`}`}>
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center border font-mono ${answers[qIdx] === oIdx ? 'bg-white text-indigo-600 border-white' : 'bg-black/5 border-slate-400'}`}>
                              {optionLetters[oIdx]}
                            </span>
                            <span>{opt}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button onClick={handleFinishQuiz} className="w-full bg-emerald-600 text-white font-black py-3.5 rounded-xl cursor-pointer shadow-xl text-sm uppercase tracking-wider">Imtihonni Yakunlash</button>
                </div>
              )}

              {quizState === 'result' && (
                <div className={`max-w-sm mx-auto p-6 rounded-2xl text-center space-y-4 mt-8 ${styles.card}`}>
                  <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto"><CheckCircle size={24}/></div>
                  <h3 className={`text-xl font-black ${styles.text}`}>Imtihon Yakunlandi</h3>
                  <p className={styles.muted}>Natijalaringiz muvaffaqiyatli server omboriga saqlandi.</p>
                  <div className="p-4 bg-indigo-500/5 rounded-xl font-mono border border-indigo-500/10">
                    <h1 className="text-4xl font-black text-indigo-500">{latestScore.percent}%</h1>
                    <p className={`text-xs mt-2 ${styles.text}`}>To'g'ri javoblar: {latestScore.score} / {latestScore.total}</p>
                    <p className="text-amber-500 mt-1">Sarflangan umumiy vaqt: {latestScore.timeSpent}</p>
                  </div>
                  <button onClick={() => setQuizState('list')} className="w-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold py-2.5 rounded-xl cursor-pointer">Bosh oynaga qaytish</button>
                </div>
              )}
            </div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}