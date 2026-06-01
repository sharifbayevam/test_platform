import React from 'react';
import { db } from '../firebase.js';
import { doc, updateDoc } from 'firebase/firestore';

export default function Arizalar({ myStudents = [], fetchTeacherData, darkMode }) {
  
  // 👍 BLOKDAN CHIQARISH ARIZASINI TASDIQLASH
  const handleApproveSpam = async (id) => {
    try {
      const studentRef = doc(db, "students", id);
      await updateDoc(studentRef, {
        spamCount: 0,
        spamStatus: "active"
      });
      alert("✅ O'quvchi arizasi qabul qilindi va muvaffaqiyatli faollashtirildi!");
      if (fetchTeacherData) fetchTeacherData();
    } catch (err) {
      console.error("Xatolik:", err);
    }
  };

  // ❌ ARIZANI RAD ETISH (BLOKDA QOLDIRISH)
  const handleRejectSpam = async (id) => {
    try {
      const studentRef = doc(db, "students", id);
      await updateDoc(studentRef, {
        spamStatus: "blocked" 
      });
      alert("❌ Ariza rad etildi. O'quvchi blok holatida qoldi.");
      if (fetchTeacherData) fetchTeacherData();
    } catch (err) {
      console.error(err);
    }
  };

  // Guruhlash
  const pendingStudents = myStudents.filter(s => s.spamStatus === 'pending');
  const blockedStudents = myStudents.filter(s => s.spamStatus === 'blocked');

  return (
    <div className="w-full space-y-8 text-xl font-sans tracking-wide animate-fadeIn">
      
      {/* 🔔 1-SECTION: FAOL KELIB TUSHGAN ARIZALAR */}
      <div className={`p-6 rounded-3xl border transition-all ${
        pendingStudents.length > 0 
          ? (darkMode ? 'bg-amber-950/20 border-amber-500/40 shadow-[0_0_40px_rgba(245,158,11,0.15)]' : 'bg-amber-50 border-amber-300 shadow-md')
          : (darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200')
      }`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="font-black text-lg uppercase flex items-center gap-2 tracking-wider text-amber-500">
              <span className={pendingStudents.length > 0 ? 'animate-bounce' : ''}>📩</span> 
              Kelib tushgan faol arizalar
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Imtihon jarayonida bloklangan va qayta kirishga ruxsat so'rayotgan talabalar
            </p>
          </div>
          <span className={`px-4 py-1.5 rounded-xl text-xs font-black ${
            pendingStudents.length > 0 ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-700 text-slate-400'
          }`}>
            Kutilmoqda: {pendingStudents.length} ta
          </span>
        </div>

        {pendingStudents.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-700/30 rounded-2xl bg-slate-950/20">
            <span className="text-3xl block mb-2">🎉</span>
            <p className="text-sm text-slate-400 font-bold">Hozircha blokdan ochish bo'yicha arizalar yo'q.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pendingStudents.map((st) => (
              <div 
                key={st.id} 
                className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ${
                  darkMode ? 'bg-slate-950 border-amber-500/20 hover:border-amber-500/40' : 'white border-amber-200 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center gap-3">
                    <p className={`font-black text-base ${darkMode ? 'text-white' : 'text-slate-900'}`}>{st.name}</p>
                    <span className="bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-md tracking-widest animate-pulse">
                      ARIZA YUBORDI
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-semibold mt-1.5">
                    🔑 Tizim logini: <b className="text-slate-300">{st.login}</b> 
                    <span className="mx-2">•</span> 
                    📖 Ruxsat fani: <b className="text-indigo-400">{st.allowedSubject || "Barcha fanlar"}</b>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                  <button 
                    onClick={() => handleApproveSpam(st.id)} 
                    className="flex-1 md:flex-initial px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black uppercase text-[11px] tracking-wider rounded-xl shadow-md transition-all active:scale-95"
                  >
                    Ruxsat berish 👍
                  </button>
                  <button 
                    onClick={() => handleRejectSpam(st.id)} 
                    className="flex-1 md:flex-initial px-5 py-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white font-black uppercase text-[11px] tracking-wider rounded-xl transition-all active:scale-95"
                  >
                    Rad etish ❌
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🛑 2-SECTION: ARIZA YUBORMAGAN, SHUNCHAKI BLOKDAGILAR RO'YXATI */}
      <div className={`p-6 rounded-3xl border transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="mb-4">
          <h3 className="font-black text-sm text-rose-500 uppercase tracking-wider flex items-center gap-2">
            <span>⛔</span> Umumiy bloklangan talabalar ro'yxati
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">Testdan chalg'igan, lekin hali qayta tiklash arizasini yubormaganlar</p>
        </div>

        {blockedStudents.length === 0 ? (
          <p className="text-xs text-slate-500 font-medium py-4">Hozircha bloklangan talabalar mavjud emas.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {blockedStudents.map((st) => (
              <div key={st.id} className={`p-4 rounded-2xl border flex items-center justify-between text-xs ${darkMode ? 'bg-slate-950 border-rose-950' : 'bg-slate-50 border-rose-100 shadow-sm'}`}>
                <div>
                  <p className={`font-black text-sm ${darkMode ? 'text-slate-300' : 'text-slate-800'}`}>{st.name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Log: {st.login} • Urinish: 3/3</p>
                </div>
                <button 
                  onClick={() => handleApproveSpam(st.id)} 
                  className="px-3 py-2 bg-slate-800 hover:bg-emerald-600 text-slate-400 hover:text-white font-black text-[10px] uppercase rounded-xl transition-all"
                >
                  Admin ochishi 🔓
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}