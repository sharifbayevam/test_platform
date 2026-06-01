import React, { useState, useEffect } from 'react';
import { db } from '../firebase.js';
import { doc, updateDoc, collection, getDocs, onSnapshot } from 'firebase/firestore';

export default function OquvchiPanel({ currentUser, onLogout, darkMode }) {
  const [quizzes, setQuizzes] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // O'quvchining joriy holatini bazadan jonli (realtime) kuzatish
  const [studentStatus, setStudentStatus] = useState(currentUser?.spamStatus || 'active');
  const [spamCount, setSpamCount] = useState(currentUser?.spamCount || 0);

  const [answers, setAnswers] = useState({});
  const [testFinished, setTestFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // 🔄 JONLI STATUS REFRESH (Ustoz blokdan ochsa, o'quvchida avtomat sahifa ochiladi)
  useEffect(() => {
    if (!currentUser?.id) return;
    const unsub = onSnapshot(doc(db, "students", currentUser.id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStudentStatus(data.spamStatus || 'active');
        setSpamCount(data.spamCount || 0);
      }
    });
    return () => unsub();
  }, [currentUser]);

  // Bazadan testlarni yuklab olish
  const loadQuizzes = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "quizzes"));
      const list = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      if (currentUser?.allowedSubject) {
        const filtered = list.filter(q => q.title.toLowerCase() === currentUser.allowedSubject.toLowerCase());
        setQuizzes(filtered);
      } else {
        setQuizzes(list);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  // 🕵️‍♂️ ANTI-CHEAT: Sahifadan chalg'ishni tekshirish
  useEffect(() => {
    if (!activeQuiz || testFinished || studentStatus === 'blocked' || studentStatus === 'pending') return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        const nextSpam = spamCount + 1;
        setSpamCount(nextSpam);

        if (nextSpam >= 3) {
          try {
            const studentRef = doc(db, "students", currentUser.id);
            await updateDoc(studentRef, { spamStatus: 'blocked', spamCount: 3 });
          } catch (e) {
            console.error(e);
          }
        } else {
          alert(`⚠️ Ogohlantirish! Test sahifasidan chiqib ketmang! (${nextSpam}/3)`);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [activeQuiz, testFinished, studentStatus, spamCount]);

  // ⏱️ TAYMER EFFEKTI
  useEffect(() => {
    if (!activeQuiz || testFinished || studentStatus === 'blocked' || studentStatus === 'pending') return;

    if (timeLeft <= 0) {
      handleFinishTest();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, activeQuiz, testFinished, studentStatus]);

  const startQuiz = (quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestions(quiz.questions || []);
    setCurrentIndex(0);
    setAnswers({});
    setTestFinished(false);
    setTimeLeft((quiz.time || 20) * 60);
  };

  const handleSelectAnswer = (option) => {
    setAnswers({ ...answers, [currentIndex]: option });
  };

  const handleFinishTest = async () => {
    setTestFinished(true);
    let score = 0;
    let wrongAnswers = [];

    currentQuestions.forEach((q, idx) => {
      if (answers[idx] === q.javob) score++;
      else {
        wrongAnswers.push({
          savol: q.savol,
          studentJavob: answers[idx] || "Belgilanmagan",
          togriJavob: q.javob
        });
      }
    });

    const percentage = Math.round((score / currentQuestions.length) * 100);

    try {
      const studentRef = doc(db, "students", currentUser.id);
      await updateDoc(studentRef, {
        latestScore: {
          score,
          total: currentQuestions.length,
          percentage,
          subject: activeQuiz.title,
          wrongAnswers,
          date: new Date().toLocaleDateString()
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  // 🔔 USTOZGA BLOKDAN OCHISH UCHUN ARIZA YUBORISH
  const handleSendUnlockRequest = async () => {
    try {
      const studentRef = doc(db, "students", currentUser.id);
      await updateDoc(studentRef, { spamStatus: 'pending' });
      alert("🚀 Arizangiz ustozga yuborildi! Tasdiqlashlarini kuting.");
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // 🛑 TALABA BLOKLANGAN YOKI ARIZA BERGAN HOLATI (SPAM PANEL)
  if (studentStatus === 'blocked' || studentStatus === 'pending') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center font-sans tracking-wide">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-6 ${studentStatus === 'pending' ? 'bg-amber-500/10 text-amber-500 animate-bounce' : 'bg-rose-500/10 text-rose-500 animate-pulse'}`}>
          {studentStatus === 'pending' ? '⏳' : '🛑'}
        </div>
        
        <h2 className={`text-3xl font-black uppercase tracking-wide ${studentStatus === 'pending' ? 'text-amber-500' : 'text-rose-500'}`}>
          {studentStatus === 'pending' ? 'Ariza ko\'rib chiqilmoqda' : 'Tizimdan Bloklandingiz!'}
        </h2>
        
        <p className="mt-4 text-base text-slate-400 max-w-md leading-relaxed">
          {studentStatus === 'pending' 
            ? "Blokdan ochish haqidagi so'rovingiz ustozga yuborildi. Ustoz tasdiqlashi bilan sahifa avtomatik ravishda ochiladi. Kutib turing..."
            : "Test topshirish qoidalarini buzib, sahifadan 3 marta chiqib ketganingiz sababli tizim sizni avtomatik blokladi."}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-8 w-full max-w-sm">
          {studentStatus === 'blocked' && (
            <button 
              onClick={handleSendUnlockRequest} 
              className="flex-1 px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-md transition-all"
            >
              🔓 Ustozga ariza yuborish
            </button>
          )}
          <button onClick={onLogout} className="flex-1 px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider rounded-2xl transition">
            Tizimdan chiqish
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto font-sans tracking-wide p-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
      
      {/* 🔝 TEPALIK PANEL */}
      <div className={`flex justify-between items-center p-5 rounded-3xl border mb-6 transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div>
          <h2 className="text-lg font-black uppercase">👋 {currentUser?.name}</h2>
          <p className="text-xs text-slate-400 font-medium">Talaba paneli • ID: {currentUser?.login}</p>
        </div>
        <button onClick={onLogout} className="px-5 py-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white font-bold text-xs rounded-xl transition-all">
          Chiqish
        </button>
      </div>

      {/* 🗂️ 1-HOLAT: TEST TANLASH RO'YXATI */}
      {!activeQuiz && (
        <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <h3 className="font-black text-xl mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent uppercase">📜 Topshirish mumkin bo'lgan imtihonlar</h3>
          {quizzes.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Hozircha siz uchun faol testlar mavjud emas.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizzes.map(q => (
                <div key={q.id} className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${darkMode ? 'bg-slate-950 border-slate-800/60 hover:border-indigo-500' : 'bg-slate-50 border-slate-200 hover:border-indigo-600'}`}>
                  <div>
                    <h4 className="font-black text-lg mb-1">📖 {q.title}</h4>
                    <div className="flex gap-3 text-xs font-bold text-slate-400 mb-4">
                      <span>❓ {q.questions?.length || 0} ta savol</span>
                      <span className="text-amber-500">⏱️ {q.time || 20} daqiqa</span>
                    </div>
                  </div>
                  <button onClick={() => startQuiz(q)} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md transition-all">
                    Imtihonni boshlash
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ✏️ 2-HOLAT: TEST TOPSHIRISH JARAYONI */}
      {activeQuiz && !testFinished && (
        <div className="space-y-6">
          <div className={`p-5 rounded-3xl border flex flex-col md:flex-row gap-4 justify-between items-center sticky top-2 z-50 shadow-xl transition-all ${darkMode ? 'bg-slate-900/90 border-slate-800 backdrop-blur-md' : 'bg-white/90 border-slate-200 backdrop-blur-md'}`}>
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-xl font-black text-sm">📖 {activeQuiz.title}</span>
              <span className="text-xs font-bold text-slate-400">Savol: {currentIndex + 1}/{currentQuestions.length}</span>
            </div>
            <div className="w-full md:w-44 bg-slate-700 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full transition-all duration-300" style={{ width: `${((currentIndex + 1) / currentQuestions.length) * 100}%` }}></div>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border-2 font-black text-lg ${timeLeft < 300 ? 'border-rose-500 text-rose-500 animate-pulse' : 'border-amber-500 text-amber-500'}`}>
              <span>⏳</span>
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>

          <div className={`p-6 rounded-3xl border transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h3 className="font-bold text-xl leading-relaxed mb-6">
              <span className="text-indigo-500 font-black mr-2">№{currentIndex + 1}.</span>
              {currentQuestions[currentIndex]?.savol}
            </h3>
            {currentQuestions[currentIndex]?.img && (
              <div className="mb-6 rounded-2xl overflow-hidden border border-slate-800 max-h-64 flex justify-center bg-black/20">
                <img src={currentQuestions[currentIndex].img} alt="Savol" className="object-contain h-full max-h-64" />
              </div>
            )}
            <div className="grid grid-cols-1 gap-3.5">
              {['a', 'b', 'c', 'd'].map((variant) => {
                const optionText = currentQuestions[currentIndex]?.[variant];
                const isSelected = answers[currentIndex] === variant.toUpperCase();
                return (
                  <button
                    key={variant}
                    onClick={() => handleSelectAnswer(variant.toUpperCase())}
                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${isSelected ? (darkMode ? 'border-indigo-500 bg-indigo-950/30' : 'border-indigo-600 bg-indigo-50') : (darkMode ? 'border-slate-800 hover:border-slate-700 bg-slate-950/40' : 'border-slate-200 hover:border-slate-300 bg-slate-50/50')}`}
                  >
                    <div className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 text-white' : (darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600')}`}>{variant.toUpperCase()}</div>
                    <span className="text-base font-semibold">{optionText}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button disabled={currentIndex === 0} onClick={() => setCurrentIndex(prev => prev - 1)} className="px-5 py-3 rounded-xl font-bold text-xs uppercase bg-slate-800 hover:bg-slate-700 text-white disabled:opacity-30 disabled:pointer-events-none transition">⬅️ Oldingi</button>
            {currentIndex < currentQuestions.length - 1 ? (
              <button onClick={() => setCurrentIndex(prev => prev + 1)} className="px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white transition">Keyingi ➡️</button>
            ) : (
              <button onClick={handleFinishTest} className="px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg transition animate-bounce">🏁 Testni Yakunlash</button>
            )}
          </div>
        </div>
      )}

      {testFinished && activeQuiz && (
        <div className={`p-8 rounded-3xl border text-center space-y-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-md'}`}>
          <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center text-4xl mx-auto">🏆</div>
          <div>
            <h3 className="font-black text-2xl uppercase tracking-wide">Imtihon muvaffaqiyatli topshirildi!</h3>
            <p className="text-sm text-slate-400 mt-1">Natijalar muvaffaqiyatli saqlandi va tekshirish uchun ustozga yuborildi.</p>
          </div>
          <button onClick={() => { setActiveQuiz(null); setTestFinished(false); loadQuizzes(); }} className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-xs uppercase tracking-widest rounded-xl transition shadow-md">Bosh sahifaga qaytish</button>
        </div>
      )}

    </div>
  );
}