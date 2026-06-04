import React from 'react';
// 🟢 Firebase Firestore funksiyalari ulanmoqda
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { LockIcon, BellDot } from 'lucide-react';
import { BlockReason } from 'firebase/ai';

export default function Arizalar({ myStudents = [], darkMode, fetchTeacherData }) {
  
  // 🟢 ARIZANI TASDIQLASH (A'zolikka qabul qilish)
  const handleApproveSpam = async (id) => {
    try {
      const studentRef = doc(db, "students", id);
      await updateDoc(studentRef, {
        spamStatus: "active" // Holatni faolga o'tkazamiz
      });
      alert("✅ O'quvchi arizasi tasdiqlandi va faollashtirildi!");
      if (fetchTeacherData) fetchTeacherData();
    } catch (err) {
      console.error("Tasdiqlashda xatolik:", err);
      alert("❌ Arizani tasdiqlashda xato yuz berdi!");
    }
  };

  // ❌ ARIZANI RAD ETISH (BLOKLASH)
  const handleRejectSpam = async (id) => {
    try {
      const studentRef = doc(db, "students", id);
      await updateDoc(studentRef, {
        spamStatus: "blocked" // Holatni bloklangan muddatga o'tkazish
      });
      alert("🚫 Ariza rad etildi va foydalanuvchi bloklandi!");
      if (fetchTeacherData) fetchTeacherData();
    } catch (err) {
      console.error("Bloklashda xatolik:", err);
      alert("❌ Arizani rad etishda xato yuz berdi!");
    }
  };

  // 🔍 XAVFSIZ FILTRLASH (Bazada katta-kichik harf farq qilsa ham yoki maydon bo'lmasa ham xato bermaydi)
  const pendingStudents = myStudents.filter(s => 
    s.spamStatus && s.spamStatus.toLowerCase() === 'pending'
  );
  
  const blockedStudents = myStudents.filter(s => 
    s.spamStatus && s.spamStatus.toLowerCase() === 'blocked'
  );

  return (
    <div className="w-full space-y-8 text-sm">
      
      {/* 📬 1-QISM: KUTILAYOTGAN ARIZALAR */}
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <h3 className="text-sm font-black uppercase tracking-wider mb-4 text-amber-500">
       <BellDot/>  Kutilayotgan Arizalar ({pendingStudents.length} ta)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className={`text-[11px] font-bold uppercase border-b ${darkMode ? 'text-slate-400 border-slate-800/40' : 'text-slate-500 border-slate-200'}`}>
                <th className="py-2.5">O'quvchi Logini</th>
                <th className="py-2.5">So'ralgan Fan</th>
                <th className="py-2.5 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-slate-800/30' : 'divide-slate-200'}`}>
              {pendingStudents.map(student => (
                <tr key={student.id} className={darkMode ? 'hover:bg-slate-950/20' : 'hover:bg-slate-50'}>
                  <td className="py-3 font-bold text-indigo-400">{student.login}</td>
                  <td className="py-3">{student.allowedSubject || "Tanlanmagan"}</td>
                  <td className="py-3 text-right space-x-2">
                    <button 
                      onClick={() => handleApproveSpam(student.id)} 
                      className="bg-emerald-500 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg hover:bg-emerald-600 transition"
                    >
                      Tasdiqlash ✓
                    </button>
                    <button 
                      onClick={() => handleRejectSpam(student.id)} 
                      className="bg-rose-500/10 text-rose-400 font-bold text-[11px] px-3 py-1.5 rounded-lg hover:bg-rose-500 hover:text-white transition"
                    >
                      Rad etish ✗
                    </button>
                  </td>
                </tr>
              ))}
              {pendingStudents.length === 0 && (
                <tr>
                  <td colSpan="3" className="text-center py-6 text-slate-500 text-xs">
                    Yangi arizalar mavjud emas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🚫 2-QISM: BLOKLANGANLAR RO'YXATI */}
      <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <h3 className="text-sm font-black uppercase tracking-wider mb-4 text-rose-500">
           <LockIcon/>  Bloklangan Akkauntlar ({blockedStudents.length} ta)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className={`text-[11px] font-bold uppercase border-b ${darkMode ? 'text-slate-400 border-slate-800/40' : 'text-slate-500 border-slate-200'}`}>
                <th className="py-2.5">Foydalanuvchi</th>
                <th className="py-2.5">Holati</th>
                <th className="py-2.5 text-right">Amal</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-slate-800/30' : 'divide-slate-200'}`}>
              {blockedStudents.map(student => (
                <tr key={student.id} className={darkMode ? 'hover:bg-slate-950/20' : 'hover:bg-slate-50'}>
                  <td className={`py-3 font-bold ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>{student.login}</td>
                  <td className="py-3 text-rose-500 font-medium">Bloklangan</td>
                  <td className="py-3 text-right">
                    <button 
                      onClick={() => handleApproveSpam(student.id)} 
                      className="bg-indigo-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition"
                    >
                      Blokdan yechish
                    </button>
                  </td>
                </tr>
              ))}
              {blockedStudents.length === 0 && (
                <tr>
                  <td colSpan="3" className="text-center py-6 text-slate-500 text-xs">
                    Bloklangan foydalanuvchilar mavjud emas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}