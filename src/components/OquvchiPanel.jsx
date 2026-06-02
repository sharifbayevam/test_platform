import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function OquvchiPanel({ currentUser, onLogout, darkMode }) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentStatus, setStudentStatus] = useState(currentUser?.spamStatus || 'active');
  const [spamCount, setSpamCount] = useState(currentUser?.spamCount || 0);

  // 💾 SAHIFA YANGILANGANDA HOLATLARNI LOCALSTORAGE'DAN QAYTA TIKLASH
  const [activeQuiz, setActiveQuiz] = useState(() => {
    const saved = localStorage.getItem("activeQuiz");
    return saved ? JSON.parse(saved) : null;
  });

  const [currentQuestions, setCurrentQuestions] = useState(() => {
    const saved = localStorage.getItem("currentQuestions");
    return saved ? JSON.parse(saved) : [];
  });

  const [currentIndex, setCurrentIndex] = useState(() => {
    const saved = localStorage.getItem("currentIndex");
    return saved ? parseInt(saved, 10) : 0;
  });

  const [answers, setAnswers] = useState(() => {
    const saved = localStorage.getItem("studentAnswers");
    return saved ? JSON.parse(saved) : {};
  });

  const [testFinished, setTestFinished] = useState(() => {
    return localStorage.getItem("testFinished") === "true";
  });

  const [timeLeft, setTimeLeft] = useState(() => {
    const saved = localStorage.getItem("timeLeft");
    return saved ? parseInt(saved, 10) : 0;
  });

  const [quizResultSummary, setQuizResultSummary] = useState(() => {
    const saved = localStorage.getItem("quizResultSummary");
    return saved ? JSON.parse(saved) : null;
  });

  // 🔄 JONLI STATUS REFRESH
  useEffect(() => {
    if (!currentUser?._id) return;
    const checkStatus = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/quizzes/students/all');
        const me = res.data.find(s => s._id === currentUser._id);
        if (me) {
          setStudentStatus(me.spamStatus || 'active');
          setSpamCount(me.spamCount || 0);
        }
      } catch (err) {
        console.error("Status yuklashda xatolik:", err);
      }
    };
    const interval = setInterval(checkStatus, 4000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // 📜 TESTLARNI BACKEND'DAN YUKLASH
  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/quizzes/all');
      if (currentUser?.allowedSubject) {
        const filtered = res.data.filter(q => 
          q.title.toLowerCase().trim() === currentUser.allowedSubject.toLowerCase().trim()
        );
        setQuizzes(filtered);
      } else {
        setQuizzes(res.data);
      }
    } catch (err) {
      console.error("Testlarni yuklashda xatolik:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, [currentUser]);

  // 💾 JORIY HOLATLAR O'ZGARSA, LOCALSTORAGE'GA SAQLASH
  useEffect(() => {
    if (activeQuiz) {
      localStorage.setItem("activeQuiz", JSON.stringify(activeQuiz));
      localStorage.setItem("currentQuestions", JSON.stringify(currentQuestions));
      localStorage.setItem("currentIndex", currentIndex.toString());
      localStorage.setItem("studentAnswers", JSON.stringify(answers));
      localStorage.setItem("testFinished", testFinished.toString());
      localStorage.setItem("timeLeft", timeLeft.toString());
      if (quizResultSummary) {
        localStorage.setItem("quizResultSummary", JSON.stringify(quizResultSummary));
      }
    }
  }, [activeQuiz, currentQuestions, currentIndex, answers, testFinished, timeLeft, quizResultSummary]);

  // 🕵️‍♂️ ANTI-CHEAT EFFEKTI
  useEffect(() => {
    if (!activeQuiz || testFinished || studentStatus === 'blocked' || studentStatus === 'pending') return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        const nextSpam = spamCount + 1;
        setSpamCount(nextSpam);

        if (nextSpam >= 3) {
          try {
            await axios.post(`http://localhost:5000/api/quizzes/students/update-spam/${currentUser._id}`, {
              spamStatus: 'blocked',
              spamCount: 3
            });
            setStudentStatus('blocked');
          } catch (e) {
            console.error(e);
          }
        } else {
          try {
            await axios.post(`http://localhost:5000/api/quizzes/students/update-spam/${currentUser._id}`, {
              spamStatus: 'active',
              spamCount: nextSpam
            });
            alert(`⚠️ Ogohlantirish! Test sahifasidan chiqib ketmang! (${nextSpam}/3)`);
          } catch (e) {
            console.error(e);
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [activeQuiz, testFinished, studentStatus, spamCount, currentUser]);

  // ⏱️ TAYMER
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
    setQuizResultSummary(null);
    setTimeLeft((quiz.time || 20) * 60);
  };

  const handleSelectAnswer = (option) => {
    setAnswers({ ...answers, [currentIndex]: option });
  };

  // 🏁 TESTNI YAKUNLASH
  const handleFinishTest = async () => {
    let score = 0;
    let wrongAnswersList = [];

    currentQuestions.forEach((q, idx) => {
      const studentAns = answers[idx] || "Belgilanmagan";
      const correctAns = q.javob ? q.javob.toUpperCase() : "";

      if (studentAns === correctAns) {
        score++;
      } else {
        wrongAnswersList.push({
          savol: q.savol,
          img: q.img || null,
          studentJavob: studentAns,
          togriJavob: correctAns,
          variants: { a: q.a, b: q.b, c: q.c, d: q.d }
        });
      }
    });

    const percentage = Math.round((score / currentQuestions.length) * 100);
    const spentTimeMinutes = activeQuiz.time - Math.ceil(timeLeft / 60);

    const summary = {
      score,
      total: currentQuestions.length,
      percentage,
      spentTime: spentTimeMinutes > 0 ? spentTimeMinutes : 1,
      wrongAnswers: wrongAnswersList
    };

    setQuizResultSummary(summary);
    setTestFinished(true);

    // LocalStorage'ga yakuniy natijani srazi yozish
    localStorage.setItem("testFinished", "true");
    localStorage.setItem("quizResultSummary", JSON.stringify(summary));

    try {
      await axios.post('http://localhost:5000/api/quizzes/save-result', {
        studentId: currentUser._id,
        quizId: activeQuiz._id,
        quizTitle: activeQuiz.title,
        totalQuestions: currentQuestions.length,
        correctAnswers: score,
        wrongAnswers: currentQuestions.length - score,
        scorePercentage: percentage,
        spentTime: spentTimeMinutes > 0 ? spentTimeMinutes : 1
      });
    } catch (err) {
      console.error("Natijani saqlashda xatolik:", err);
    }
  };

  // 🔄 BOSH SAHIFAGA QAYTISH (XOTIRANI TOZALASH)
  const handleGoBack = () => {
    localStorage.removeItem("activeQuiz");
    localStorage.removeItem("currentQuestions");
    localStorage.removeItem("currentIndex");
    localStorage.removeItem("studentAnswers");
    localStorage.removeItem("testFinished");
    localStorage.removeItem("timeLeft");
    localStorage.removeItem("quizResultSummary");

    setActiveQuiz(null);
    setTestFinished(false);
    setQuizResultSummary(null);
    loadQuizzes();
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (studentStatus === 'blocked' || studentStatus === 'pending') {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[70vh] p-6 text-center font-sans tracking-wide transition-colors ${darkMode ? 'text-white' : 'text-slate-900'}`}>
        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-6 shadow-lg ${studentStatus === 'pending' ? 'bg-amber-500/10 text-amber-500 animate-bounce' : 'bg-rose-500/10 text-rose-500 animate-pulse'}`}>
          {studentStatus === 'pending' ? '⏳' : '🛑'}
        </div>
        <h2 className={`text-3xl font-black uppercase tracking-wide ${studentStatus === 'pending' ? 'text-amber-500' : 'text-rose-500'}`}>
          {studentStatus === 'pending' ? 'Ariza ko\'rib chiqilmoqda' : 'Tizimdan Bloklandingiz!'}
        </h2>
        <p className="mt-4 text-base text-slate-400 max-w-md leading-relaxed">
          {studentStatus === 'pending' ? "Blokdan ochish so'rovingiz yuborildi. Ustoz tasdiqlashi bilan ochiladi." : "Sahifadan 3 marta chiqqaningiz uchun bloklandingiz."}
        </p>
        <div className="flex gap-4 mt-8 w-full max-w-sm">
          {studentStatus === 'blocked' && (
            <button onClick={async () => {
              try {
                await axios.post(`http://localhost:5000/api/quizzes/students/update-spam/${currentUser._id}`, { spamStatus: 'pending', spamCount });
                setStudentStatus('pending');
                alert("🚀 Arizangiz ustozga yuborildi!");
              } catch (e) { console.error(e); }
            }} className="flex-1 px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition-all">
              🔓 Ustozga ariza yuborish
            </button>
          )}
          <button onClick={onLogout} className={`flex-1 px-6 py-4 font-bold text-xs uppercase rounded-2xl transition shadow-md ${darkMode ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'}`}>Chiqish</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto font-sans tracking-wide p-4 transition-colors ${darkMode ? 'text-white' : 'text-slate-900'}`}>
      
      {/* 🔝 TEPALIK PANEL */}
      <div className={`flex justify-between items-center p-5 rounded-3xl border mb-6 transition-all ${darkMode ? 'bg-slate-900 border-slate-800 shadow-[0_10px_30px_rgba(0,0,0,0.5)]' : 'bg-white border-slate-200 shadow-[0_10px_30px_rgba(0,0,0,0.04)]'}`}>
        <div>
          <h2 className="text-lg font-black uppercase">👋 {currentUser?.name || "O'quvchi"}</h2>
          <p className="text-xs text-slate-400 font-medium">Talaba paneli • ID: {currentUser?.login}</p>
        </div>
        <button onClick={() => { handleGoBack(); onLogout(); }} className="px-5 py-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white font-bold text-xs rounded-xl transition-all shadow-sm">
          Chiqish
        </button>
      </div>

      {/* 🗂️ 1-HOLAT: TEST RO'YXATI */}
      {!activeQuiz && (
        <div className={`p-6 rounded-3xl border transition-all ${darkMode ? 'bg-slate-900 border-slate-800 shadow-[0_15px_35px_rgba(0,0,0,0.4)]' : 'bg-white border-slate-200 shadow-[0_15px_35px_rgba(0,0,0,0.03)]'}`}>
          <h3 className="font-black text-xl mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent uppercase">📜 Topshirish mumkin bo'lgan imtihonlar</h3>
          {loading ? (
            <p className="text-sm text-slate-400 text-center py-8">Imtihonlar yuklanmoqda...</p>
          ) : quizzes.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Hozircha siz uchun faol testlar mavjud emas.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizzes.map(q => (
                <div key={q._id} className={`p-5 rounded-2xl border flex flex-col justify-between transition-all ${darkMode ? 'bg-slate-950 border-slate-800/60 hover:border-indigo-500 shadow-md' : 'bg-slate-50 border-slate-200 hover:border-indigo-600 shadow-sm'}`}>
                  <div>
                    <h4 className="font-black text-lg mb-1">📖 {q.title}</h4>
                    <div className="flex gap-3 text-xs font-bold text-slate-400 mb-4">
                      <span>❓ {q.questions?.length || 0} ta savol</span>
                      <span className="text-amber-500">⏱️ {q.time || 20} daqiqa</span>
                    </div>
                  </div>
                  <button onClick={() => startQuiz(q)} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md transition-all active:scale-95">
                    Imtihonni boshlash
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ✏️ 2-HOLAT: TEST JARAYONI */}
      {activeQuiz && !testFinished && (
        <div className="space-y-6">
          <div className={`p-5 rounded-3xl border flex flex-col md:flex-row gap-4 justify-between items-center sticky top-2 z-50 transition-all ${darkMode ? 'bg-slate-900/90 border-slate-800 backdrop-blur-md shadow-[0_15px_30px_rgba(0,0,0,0.5)]' : 'bg-white/90 border-slate-200 backdrop-blur-md shadow-[0_15px_30px_rgba(0,0,0,0.06)]'}`}>
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-xl font-black text-sm">📖 {activeQuiz.title}</span>
              <span className="text-xs font-bold text-slate-400">Savol: {currentIndex + 1}/{currentQuestions.length}</span>
            </div>
            <div className="w-full md:w-44 bg-slate-700 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full transition-all duration-300" style={{ width: `${((currentIndex + 1) / currentQuestions.length) * 100}%` }}></div>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border-2 font-black text-lg shadow-sm ${timeLeft < 300 ? 'border-rose-500 text-rose-500 animate-pulse' : 'border-amber-500 text-amber-500'}`}>
              <span>⏳</span>
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>

          <div className={`p-6 rounded-3xl border transition-all ${darkMode ? 'bg-slate-900 border-slate-800 shadow-[0_20px_40px_rgba(0,0,0,0.4)]' : 'bg-white border-slate-200 shadow-[0_20px_40px_rgba(0,0,0,0.03)]'}`}>
            <h3 className="font-bold text-xl leading-relaxed mb-6">
              <span className="text-indigo-500 font-black mr-2">№{currentIndex + 1}.</span>
              {currentQuestions[currentIndex]?.savol}
            </h3>
            {currentQuestions[currentIndex]?.img && (
              <div className="mb-6 rounded-2xl overflow-hidden border border-slate-800 max-h-64 flex justify-center bg-black/20 shadow-inner">
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
                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${isSelected ? (darkMode ? 'border-indigo-500 bg-indigo-950/40 shadow-md' : 'border-indigo-600 bg-indigo-50 shadow-md') : (darkMode ? 'border-slate-800 hover:border-slate-700 bg-slate-950/40 shadow-sm' : 'border-slate-100 hover:border-slate-200 bg-slate-50/50 shadow-sm')}`}
                  >
                    <div className={`w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 text-white shadow-md' : (darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600')}`}>{variant.toUpperCase()}</div>
                    <span className="text-base font-semibold">{optionText}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <button disabled={currentIndex === 0} onClick={() => setCurrentIndex(prev => prev - 1)} className={`px-5 py-3 rounded-xl font-bold text-xs uppercase shadow-sm disabled:opacity-30 ${darkMode ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-700'}`}>⬅️ Oldingi</button>
            {currentIndex < currentQuestions.length - 1 ? (
              <button onClick={() => setCurrentIndex(prev => prev + 1)} className="px-6 py-3 rounded-xl font-black text-xs uppercase bg-indigo-600 text-white shadow-md">Keyingi ➡️</button>
            ) : (
              <button onClick={handleFinishTest} className="px-8 py-3 rounded-xl font-black text-xs uppercase bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xl animate-bounce">🏁 Testni Yakunlash</button>
            )}
          </div>
        </div>
      )}

      {/* 🏆 3-HOLAT: TEST YAKUNLANGANDA TAHLIL EKRANI */}
      {testFinished && activeQuiz && quizResultSummary && (
        <div className="space-y-6">
          <div className={`p-8 rounded-3xl border text-center space-y-6 transition-all ${darkMode ? 'bg-slate-900 border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)]' : 'bg-white border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.04)]'}`}>
            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center text-4xl mx-auto shadow-md">🏆</div>
            <div>
              <h3 className="font-black text-2xl uppercase tracking-wide">Imtihon topshirildi!</h3>
              <p className="text-sm text-slate-400 mt-1">Sizning natijalaringiz quyidagicha shakllandi:</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto text-center">
              <div className={`p-4 rounded-2xl border transition-all ${darkMode ? 'bg-slate-950 border-slate-800/80 shadow-md' : 'bg-white border-slate-100 shadow-[0_4px_15px_rgba(0,0,0,0.02)]'}`}>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">To'g'ri</p>
                <p className="text-2xl font-black text-emerald-500 mt-1">{quizResultSummary.score} / {quizResultSummary.total}</p>
              </div>
              <div className={`p-4 rounded-2xl border transition-all ${darkMode ? 'bg-slate-950 border-slate-800/80 shadow-md' : 'bg-white border-slate-100 shadow-[0_4px_15px_rgba(0,0,0,0.02)]'}`}>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Xato</p>
                <p className="text-2xl font-black text-rose-500 mt-1">{quizResultSummary.total - quizResultSummary.score}</p>
              </div>
              <div className={`p-4 rounded-2xl border transition-all ${darkMode ? 'bg-slate-950 border-slate-800/80 shadow-md' : 'bg-white border-slate-100 shadow-[0_4px_15px_rgba(0,0,0,0.02)]'}`}>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Foiz</p>
                <p className="text-2xl font-black text-indigo-500 mt-1">{quizResultSummary.percentage}%</p>
              </div>
              <div className={`p-4 rounded-2xl border transition-all ${darkMode ? 'bg-slate-950 border-slate-800/80 shadow-md' : 'bg-white border-slate-100 shadow-[0_4px_15px_rgba(0,0,0,0.02)]'}`}>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Vaqt</p>
                <p className="text-2xl font-black text-amber-500 mt-1">{quizResultSummary.spentTime} daq</p>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-3xl border transition-all ${darkMode ? 'bg-slate-900 border-slate-800 shadow-[0_20px_40px_rgba(0,0,0,0.4)]' : 'bg-white border-slate-200 shadow-[0_20px_40px_rgba(0,0,0,0.03)]'}`}>
            <h3 className="font-black text-lg uppercase mb-5 text-rose-500 flex items-center gap-2">
              ❌ Natijalar tahlili ({quizResultSummary.wrongAnswers.length} ta xato)
            </h3>
            
            {quizResultSummary.wrongAnswers.length === 0 ? (
              <p className="text-sm text-emerald-500 text-center py-6 font-bold bg-emerald-500/5 rounded-2xl border border-emerald-500/20">Tabriklaymiz! Birorta ham xato qilmadingiz! 💯</p>
            ) : (
              <div className="space-y-5">
                {quizResultSummary.wrongAnswers.map((item, index) => (
                  <div key={index} className={`p-5 rounded-2xl border-2 transition-all ${darkMode ? 'bg-slate-950 border-slate-800/80 shadow-sm' : 'bg-slate-50 border-slate-200 shadow-sm'}`}>
                    <p className="font-bold text-base mb-3">
                      <span className="text-rose-500 font-black mr-1">#{index + 1}</span> {item.savol}
                    </p>
                    {item.img && (
                      <div className="mb-4 max-w-xs rounded-xl overflow-hidden border shadow-sm">
                        <img src={item.img} alt="Xato savol" className="object-contain max-h-32" />
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-sm">
                      <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 text-rose-500 font-semibold shadow-sm">
                        ❌ Sizning javobingiz: <span className="font-black uppercase">{item.studentJavob}</span> 
                        <p className={`text-xs mt-1 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          ({item.variants[item.studentJavob.toLowerCase()] || "Belgilanmagan"})
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-500 font-semibold shadow-sm">
                        ✅ To'g'ri javob: <span className="font-black uppercase">{item.togriJavob}</span>
                        <p className={`text-xs mt-1 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          ({item.variants[item.togriJavob.toLowerCase()] || ""})
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="text-center pt-8">
              <button onClick={handleGoBack} className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-95">
                🔄 Bosh sahifaga qaytish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}