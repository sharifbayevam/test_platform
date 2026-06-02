import React, { useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const API_URL = 'http://localhost:5000/api/quizzes/students/create';

export default function Oquvchilar({ myStudents = [], quizzes = [], darkMode, fetchTeacherData }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [allowedSubject, setAllowedSubject] = useState("");

  const handleAddStudent = async (e) => {
    e.preventDefault();

    if (!login.trim() || !password.trim() || !allowedSubject) {
      alert("Iltimos, login, parol va ruxsat etilgan fanni tanlang!");
      return;
    }

    try {
      const studentData = {
        login: login,
        password: password,
        allowedSubject: allowedSubject
      };

      const res = await axios.post(API_URL, studentData);

      if (res.data.success) {
        setLogin("");
        setPassword("");
        setAllowedSubject("");
        fetchTeacherData();
      }
    } catch (err) {
      console.error(err);
      alert("Xatolik: " + (err.response?.data?.error || err.message));
    }
  };
  const exportStudentsToExcel = () => {
  if (!myStudents || myStudents.length === 0) {
    alert("❌ Eksport qilish uchun o'quvchilar mavjud emas!");
    return;
  }

  // Excel uchun ma'lumotlar strukturasini tayyorlash
  const dataToExport = myStudents.map((student, index) => ({
    "№": index + 1,
    "Ism Familiya": student.name,
    "Login (ID)": student.login,
    "Parol": student.password || "******", // xavfsizlik uchun yoki ochiq parol
    "Ruxsat etilgan fan": student.allowedSubject || "Tanlanmagan",
    "Status": student.spamStatus === 'blocked' ? "Bloklangan" : student.spamStatus === 'pending' ? "Ariza yuborgan" : "Aktiv",
    "Ogohlantirishlar soni": student.spamCount || 0
  }));

  // Excel faylini yaratish
  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "O'quvchilar");

  // Ustunlar kengligini chiroyli qilish
  worksheet['!cols'] = [
    { wch: 5 },  { wch: 25 }, { wch: 15 }, { wch: 15 }, 
    { wch: 20 }, { wch: 15 }, { wch: 22 }
  ];

  // Faylni yuklab olish
  XLSX.writeFile(workbook, `Oquvchilar_Royxati_${new Date().toLocaleDateString()}.xlsx`);

};

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 👤 CHAP QISM: INPUT PANEL */}
      <div className={`p-6 rounded-2xl border h-fit ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <h3 className="text-base font-bold mb-4 flex items-center gap-2">
          <span>👤 Yangi O'quvchi</span>
        </h3>
        
        <form onSubmit={handleAddStudent} className="space-y-4">
          <div>
            <label className="text-xs font-bold block mb-1 uppercase tracking-wider text-slate-400">Login:</label>
            <input 
              type="text" 
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="Login kiriting"
              className={`w-full p-3 rounded-xl border text-sm font-semibold transition-all outline-none focus:border-indigo-500 ${
                darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>

          <div>
            <label className="text-xs font-bold block mb-1 uppercase tracking-wider text-slate-400">Parol:</label>
            <input 
              type="text" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Parol kiriting"
              className={`w-full p-3 rounded-xl border text-sm font-semibold transition-all outline-none focus:border-indigo-500 ${
                darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>

          <div>
            <label className="text-xs font-bold block mb-1 uppercase tracking-wider text-slate-400">Ruxsat etilgan fan:</label>
            <select 
              value={allowedSubject}
              onChange={(e) => setAllowedSubject(e.target.value)}
              className={`w-full p-3 rounded-xl border text-sm font-semibold outline-none focus:border-indigo-500 ${
                darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              <option value="">-- Fanni tanlang --</option>
              {quizzes && quizzes.length > 0 && quizzes.map((q) => (
                <option key={q._id} value={q.title}>{q.title}</option>
              ))}
           
            </select>
          </div>

          <button 
            type="submit"
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
          >
            O'quvchini qo'shish 🚀
          </button>
        </form>
      </div>

      {/* 👥 O'NG QISM: JADVAL (RO'YXAT) */}
      <div className="lg:col-span-2">
        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-black uppercase tracking-wider">👥 O'quvchilar ro'yxati</h3>
            <span className="px-2.5 py-1 text-xs font-black bg-indigo-600/10 text-indigo-400 rounded-lg">
              Jami: {myStudents.length} ta
            </span>
          </div>
          <div className="flex gap-3 items-center">
  <button 
    onClick={exportStudentsToExcel}
    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase rounded-xl shadow-md transition-all flex items-center gap-1.5"
  >
    📥 Excelga yuklash (.xlsx)
  </button>
  <span className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg text-xs font-black">
    Jami: {myStudents.length} ta
  </span>
</div>

          {myStudents.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">Hozircha tizimda o'quvchilar mavjud emas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800/60 text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 font-bold pl-2">Holati</th>
                    <th className="pb-3 font-bold">Login</th>
                    <th className="pb-3 font-bold">Parol</th>
                    <th className="pb-3 font-bold text-right pr-2">Ruxsat etilgan fani</th>
                  </tr>
                </thead>
                <tbody>
                  {myStudents.map((student) => (
                    <tr 
                      key={student._id} 
                      className={`border-b last:border-0 transition-colors ${
                        student.isOnline 
                          ? (darkMode ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-900') 
                          : (darkMode ? 'border-slate-800/40 hover:bg-slate-800/20' : 'border-slate-100 hover:bg-slate-50')
                      }`}
                    >
                      {/* KIRGANLARNI AJRATIB KO'RSATISH */}
                      <td className="py-3.5 pl-2">
                        {student.isOnline ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white animate-pulse">
                            ● KIRGAN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-400">
                            ○ Kirmagan
                          </span>
                        )}
                      </td>
                      
                      <td className="py-3.5 font-bold text-sm">{student.login}</td>
                      <td className="py-3.5 font-mono text-slate-400">{student.password}</td>
                      
                      <td className="py-3.5 text-right pr-2">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 font-black border border-indigo-500/20">
                          {student.allowedSubject}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}