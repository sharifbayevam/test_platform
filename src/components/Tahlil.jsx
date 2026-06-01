import React from 'react';
import { db } from '../firebase.js';
import { doc, updateDoc } from 'firebase/firestore';

export default function Tahlil({ myStudents = [], fetchTeacherData, darkMode }) {
  
  // 👍 ARIZANI TASDIQLASH (BLOKDAN CHIQARISH)
  const handleApproveSpam = async (id) => {
    try {
      const studentRef = doc(db, "students", id);
      await updateDoc(studentRef, {
        spamCount: 0,
        spamStatus: "active"
      });
      alert("✅ O'quvchi cheklovdan muvaffaqiyatli chiqarildi!");
      if (fetchTeacherData) fetchTeacherData();
    } catch (err) {
      console.error("Xatolik yuz berdi:", err);
    }
  };

  // ❌ ARIZANI RAD ETISH (BLOKDA QOLDIRISH VA ARIZANI BEKOR QILISH)
  const handleRejectSpam = async (id) => {
    try {
      const studentRef = doc(db, "students", id);
      await updateDoc(studentRef, {
        spamStatus: "blocked" // Arizani o'chirib, yana qizil blok holatiga qaytaradi
      });
      alert("❌ Ariza rad etildi. O'quvchi blokda qoldi.");
      if (fetchTeacherData) fetchTeacherData();
    } catch (err) {
      console.error(err);
    }
  };

  // Arizasi kutilayotgan talabalar (pending)
  const pendingStudents = myStudents.filter(s => s.spamStatus === 'pending');
  // Shunchaki bloklangan, hali ariza bermagan talabalar (blocked)
  const blockedStudents = myStudents.filter(s => s.spamStatus === 'blocked');

  return (
    <div className="space-y-8 text-xl font-sans tracking-wide">
      
      {/* 🔔 1-KONTENT: PREMIUM ARIZALAR VA BILDIRISHNOMALAR PANELI */}
      {pendingStudents.length > 0 && (
        <div className={`p-6 rounded-3xl border transition-all ${darkMode ? 'bg-amber-950/20 border-amber-900/50' : 'bg-amber-50 border-amber-200'}`}>
          <h3 className="font-black text-sm text-amber-500 uppercase tracking-wider mb-4 flex items-center gap-2 animate-pulse">
            🔔 BLOKDAN OCHISH BO'YICHA ARIZALAR ({pendingStudents.length} ta):
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingStudents.map((st) => (
              <div key={st.id} className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs ${darkMode ? 'bg-slate-900/90 border-amber-900/40' : 'white border-amber-200 shadow-md'}`}>
                <div>
                  <p className={`font-black text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>{st.name}</p>
                  <p className="text-slate-400 font-medium mt-0.5">Login: {st.login} • Status: <b className="text-amber-500 animate-pulse">Kutilmoqda...</b></p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button 
                    onClick={() => handleApproveSpam(st.id)} 
                    className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[10px] tracking-wider rounded-xl transition-all"
                  >
                    Tasdiqlash 👍
                  </button>
                  <button 
                    onClick={() => handleRejectSpam(st.id)} 
                    className="px-3.5 py-2 bg-rose-500 hover:bg-rose-600 text-white font-black uppercase text-[10px] tracking-wider rounded-xl transition-all"
                  >
                    Bekor qilish ❌
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🛑 2-KONTENT: ARIZA BERMAGAN SHUNCHAKI BLOKDAGILAR */}
      {blockedStudents.length > 0 && (
        <div className={`p-6 rounded-3xl border transition-all ${darkMode ? 'bg-rose-950/10 border-rose-900/30' : 'bg-rose-50/50 border-rose-200'}`}>
          <h3 className="font-black text-sm text-rose-500 uppercase tracking-wider mb-4">
            🛑 BLOKLANGANLAR (HALI ARIZA YUBORMAGANLAR):
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {blockedStudents.map((st) => (
              <div key={st.id} className={`p-4 rounded-2xl border flex items-center justify-between text-xs ${darkMode ? 'bg-slate-900/50 border-rose-900/20' : 'bg-white border-rose-200 shadow-sm'}`}>
                <div>
                  <p className={`font-black text-sm ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>{st.name}</p>
                  <p className="text-slate-400 font-medium mt-0.5">Login: {st.login} • Urinishlar tugagan</p>
                </div>
                <button 
                  onClick={() => handleApproveSpam(st.id)} 
                  className="px-3 py-1.5 bg-slate-700 hover:bg-emerald-600 text-slate-300 hover:text-white font-bold text-[10px] rounded-lg transition-all"
                >
                  Majburiy ochish
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 📊 3-KONTENT: TAHLIL JADVALI */}
      <div className={`p-6 rounded-3xl border transition-all duration-300 ${darkMode ? 'bg-slate-900 border-slate-800 shadow-2xl' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-black text-lg bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent uppercase">
              📊 Imtihon Natijalari Analitikasi
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">O'quvchilarning oxirgi yechgan testlari tahlili</p>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
            Jami: {myStudents.length} ta o'quvchi
          </span>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800/10 dark:border-slate-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`text-xs font-black uppercase tracking-wider border-b ${darkMode ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                <th className="p-4">O'quvchi</th>
                <th className="p-4">Oxirgi Fan</th>
                <th className="p-4 text-center">Ball / Foiz</th>
                <th className="p-4">Sana</th>
                <th className="p-4 max-w-xs">Xatolar tahlili</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {myStudents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-xs text-slate-400 font-medium">Hozircha o'quvchilar mavjud emas.</td>
                </tr>
              ) : (
                myStudents.map((s) => {
                  const hasScore = s.latestScore;
                  return (
                    <tr key={s.id} className={`transition-all hover:bg-slate-500/5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      <td className="p-4">
                        <p className={`font-bold text-base ${darkMode ? 'text-white' : 'text-slate-900'}`}>{s.name}</p>
                        <p className="text-xs text-slate-400">log: {s.login}</p>
                      </td>
                      <td className="p-4 font-semibold text-xs uppercase tracking-wide">
                        {hasScore ? `📖 ${s.latestScore.subject}` : <span className="text-slate-500 font-normal">Test topshirmagan</span>}
                      </td>
                      <td className="p-4 text-center">
                        {hasScore ? (
                          <div className="space-y-1">
                            <span className="font-black text-amber-500 text-base">{s.latestScore.score} / {s.latestScore.total}</span>
                            <div className="flex items-center justify-center">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${s.latestScore.percentage >= 70 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>{s.latestScore.percentage}%</span>
                            </div>
                          </div>
                        ) : "-"}
                      </td>
                      <td className="p-4 text-xs font-medium text-slate-400">{hasScore ? s.latestScore.date : "-"}</td>
                      <td className="p-4 max-w-xs">
                        {hasScore && s.latestScore.wrongAnswers && s.latestScore.wrongAnswers.length > 0 ? (
                          <div className="space-y-2 max-h-24 overflow-y-auto pr-1">
                            {s.latestScore.wrongAnswers.map((w, idx) => (
                              <div key={idx} className={`p-2 rounded-xl border text-[11px] leading-tight ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                <p className={`font-bold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>❓ {w.savol}</p>
                                <div className="flex gap-3 font-bold mt-1 text-[10px]">
                                  <span className="text-rose-500">Sizniki: {w.studentJavob}</span>
                                  <span className="text-emerald-500">To'g'ri: {w.togriJavob}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : hasScore ? (
                          <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-lg">💯 Xatosiz!</span>
                        ) : "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}