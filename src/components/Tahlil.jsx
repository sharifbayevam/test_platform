import React from 'react';
import * as XLSX from 'xlsx';

export default function Tahlil({ myStudents = [], darkMode }) {
  
  // 📈 STATISTIKANI HISOBLASH BO'LIMI
  const totalAttempts = myStudents.length;
  
  // 1. Umumiy o'rtacha o'zlashtirish foizi
  const averagePercent = totalAttempts > 0 
    ? Math.round(myStudents.reduce((acc, curr) => acc + (curr.scorePercentage ?? 0), 0) / totalAttempts)
    : 0;

  // 2. Fanlar bo'yicha guruhlash va har bir fanning o'rtacha foizini hisoblash
  const subjectStats = myStudents.reduce((acc, curr) => {
    const subject = curr.quizTitle || "NOMA'LUM FAN";
    if (!acc[subject]) {
      acc[subject] = { totalScore: 0, count: 0 };
    }
    acc[subject].totalScore += (curr.scorePercentage ?? 0);
    acc[subject].count += 1;
    return acc;
  }, {});

  // 📥 EXCELGA YUKLASH FUNKSIYASI
  const exportResultsToExcel = () => {
    if (!myStudents || myStudents.length === 0) {
      alert("❌ Eksport qilish uchun natijalar hali mavjud emas!");
      return;
    }

    const dataToExport = myStudents.map((s, index) => ({
      "№": index + 1,
      "O'quvchi Logini": s.studentName || "Ismsiz",
      "Imtihon fani": s.quizTitle || "NOMA'LUM FAN",
      "Natija (Foizda)": s.scorePercentage !== undefined ? `${s.scorePercentage}%` : "-",
      "To'g'ri javoblar": s.correctAnswers ?? 0,
      "Jami savollar": s.totalQuestions ?? 0,
      "Sana": s.createdAt ? s.createdAt.substring(0, 10) : "-"
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Imtihon Natijalari");
    XLSX.writeFile(workbook, `Imtihon_Natijalari_${new Date().toLocaleDateString()}.xlsx`);
  };

  return (
    <div className="space-y-8 text-xl font-sans tracking-wide">
      
      {/* 📊 ASOSIY JADVAL BLOKI */}
      <div className={`p-6 rounded-3xl border transition-all duration-300 ${darkMode ? 'bg-slate-900 border-slate-800 shadow-2xl' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-black text-lg bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent uppercase">
              📊 Imtihon Natijalari Analitikasi
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">O'quvchilar topshirgan testlar tarixi</p>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
            Jami urinishlar: {totalAttempts} ta
          </span>
        </div>
        
        <div className="mb-4">
          <button onClick={exportResultsToExcel} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase rounded-xl shadow-md">
            📥 Excelga yuklash (.xlsx)
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800/10 dark:border-slate-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`text-xs font-black uppercase tracking-wider border-b ${darkMode ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                <th className="p-4">O'quvchi (Login)</th>
                <th className="p-4">Oxirgi Fan</th>
                <th className="p-4 text-center">Ball / Foiz</th>
                <th className="p-4">Sana</th>
                <th className="p-4 text-center">To'g'ri javoblar</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              {myStudents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-xs text-slate-400 font-medium">Hozircha yakunlangan test natijalari mavjud emas.</td>
                </tr>
              ) : (
                myStudents.map((s) => {
                  const currentPercent = s.scorePercentage !== undefined ? s.scorePercentage : null;
                  const currentSubject = s.quizTitle || null;
                  const currentDate = s.createdAt ? s.createdAt.substring(0, 10) : "-";
                  const studentLoginName = s.studentName || "Ismsiz";

                  return (
                    <tr key={s.id} className={`transition-all hover:bg-slate-500/5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      <td className="p-4">
                        <p className={`font-bold text-base ${darkMode ? 'text-white' : 'text-slate-900'}`}>{studentLoginName}</p>
                      </td>
                      
                      <td className="p-4 font-semibold text-xs uppercase tracking-wide text-indigo-500">
                        {currentSubject ? `📖 ${currentSubject}` : "NOMA'LUM FAN"}
                      </td>
                      
                      <td className="p-4 text-center">
                        {currentPercent !== null ? (
                          <span className={`px-3 py-1 rounded-md text-sm font-black border ${Number(currentPercent) >= 70 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                            {currentPercent}%
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">-</span>
                        )}
                      </td>
                      
                      <td className="p-4 text-xs font-medium text-slate-400">{currentDate}</td>
                      
                      <td className="p-4 text-center font-bold text-sm text-emerald-500">
                        {s.correctAnswers ?? 0} / {s.totalQuestions ?? 0}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 👨‍🏫 O'QITUVCHI UCHUN FANLAR BO'YICHA O'ZLASHTIRISH PANELI */}
      <div className={`p-6 rounded-3xl border transition-all duration-300 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <h3 className="font-black text-lg bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent uppercase mb-6">
          📈 Fanlar bo'yicha O'rtacha O'zlashtirish Ko'rsatkichi
        </h3>

        {/* 1. Umumiy Sinf Ko'rsatkichi */}
        <div className={`mb-6 p-4 rounded-2xl flex items-center justify-between border ${darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
          <div>
            <h4 className={`text-sm font-black uppercase ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Umumiy Sinf O'zlashtirishi</h4>
            <p className="text-xs text-slate-400 mt-1">Barcha fanlar va urinishlarning o'rtacha qiymati</p>
          </div>
          <div className="text-right">
            <span className={`text-3xl font-black ${averagePercent >= 70 ? 'text-emerald-500' : 'text-amber-500'}`}>
              {averagePercent}%
            </span>
          </div>
        </div>

        {/* 2. Har bir fan uchun alohida progress-bar ko'rinishi */}
        <div className="space-y-5">
          {Object.keys(subjectStats).length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">Statistikani hisoblash uchun ma'lumot yetarli emas.</p>
          ) : (
            Object.keys(subjectStats).map((subj) => {
              const count = subjectStats[subj].count;
              const avg = Math.round(subjectStats[subj].totalScore / count);

              return (
                <div key={subj} className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wide">
                    <span className={`${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>📖 {subj} <span className="text-slate-400 font-normal lowercase">({count} ta urinish)</span></span>
                    <span className={avg >= 70 ? 'text-emerald-500' : 'text-amber-500'}>{avg}%</span>
                  </div>
                  
                  {/* Progress Bar Liniyasi */}
                  <div className={`w-full h-3 rounded-full overflow-hidden ${darkMode ? 'bg-slate-850' : 'bg-slate-100'}`}>
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${avg >= 70 ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`}
                      style={{ width: `${avg}%` }}
                    ></div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}