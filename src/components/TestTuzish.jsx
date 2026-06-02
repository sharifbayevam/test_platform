import React, { useState } from 'react';
import axios from 'axios';

// Backend API manzili (Siz ochgan 5000-port)
const API_URL = 'http://localhost:5000/api/quizzes';

export default function TestTuzish({ myQuizzes = [], fetchTeacherData, darkMode }) {
  const [quizTitle, setQuizTitle] = useState("");
  const [quizTime, setQuizTime] = useState(20); // Standart holatda 20 daqiqa
  const [questions, setQuestions] = useState([]);

  // Savol formasi uchun holatlar
  const [savol, setSavol] = useState("");
  const [imgBase64, setImgBase64] = useState(""); 
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [c, setC] = useState("");
  const [d, setD] = useState("");
  const [javob, setJavob] = useState("A");

  // 📝 TAHRIRLASH REJIMI UCHUN STATE'LAR (MongoDB ID-lari uchun)
  const [editingQuizId, setEditingQuizId] = useState(null); 
  const [editingQuestionIdx, setEditingQuestionIdx] = useState(null); 

  // 📦 AVTOMATIK TOʻLDIRISH UCHUN TAYYOR 4 TA FAN TESTLARI
  const tayyorTestlarPaketlari = [
    {
      title: "Ona tili va Adabiyot",
      time: 20,
      questions: [
        { savol: "Oʻzbek tiliga davlat tili maqomi qachon berilgan?", a: "1989-yil 21-oktabr", b: "1991-yil 31-avgust", c: "1992-yil 8-dekabr", d: "1993-yil 2-sentabr", javob: "A", img: null },
        { savol: "'Oʻtkan kunlar' ilk oʻzbek romani muallifi kim?", a: "Choʻlpon", b: "Abdulla Qodiriy", c: "Gʻafur Gʻulom", d: "Oybek", javob: "B", img: null },
        { savol: "Quyidagi soʻzlardan qaysi biri imlo jihatdan TOʻGʻRI yozilgan?", a: "Mashxur", b: "Mashhur", c: "Mashh`ur", d: "Masxur", javob: "B", img: null },
        { savol: "Ergashgan gapli qoʻshma gapni toping.", a: "Yomgʻir yogʻdi va yerlar yumshadi.", b: "Kim koʻp oʻqisa, u koʻp biladi.", c: "Quyosh chiqdi, havo isidi.", d: "U keldi, lekin men koʻrmadim.", javob: "B", img: null },
        { savol: "Tilshunoslikning tovushlarni oʻrganadigan boʻlimi nima deyiladi?", a: "Leksikologiya", b: "Fonetika", c: "Morfologiya", d: "Sintaksis", javob: "B", img: null }
      ]
    },
    {
      title: "Matematika",
      time: 25,
      questions: [
        { savol: "2 + 2 * 2 amalini bajaring.", a: "8", b: "6", c: "4", d: "2", javob: "B", img: null },
        { savol: "Tub sonni aniqlang.", a: "1", b: "9", c: "15", d: "17", javob: "D", img: null },
        { savol: "Tenglamani yeching: 3x - 7 = 11", a: "x = 4", b: "x = 6", c: "x = 5", d: "x = 3", javob: "B", img: null },
        { savol: "Uchburchakning ichki burchaklari yigʻindisi necha gradusga teng?", a: "90°", b: "180°", c: "360°", d: "270°", javob: "B", img: null },
        { savol: "25 sonining kvadrati nechaga teng?", a: "125", b: "525", c: "625", d: "225", javob: "C", img: null }
      ]
    },
    {
      title: "Oʻzbekistan Tarixi",
      time: 20,
      questions: [
        { savol: "Amir Temur qachon va qayerda tugʻilgan?", a: "1336-yil, Xoʻja Ilgʻor qishlogʻida", b: "1405-yil, Oʻtrorda", c: "1483-yil, Andijonda", d: "1220-yil, Samarqandda", javob: "A", img: null },
        { savol: "Buyuk Ipak yoʻli qaysi davrlarda xalqaro savdo yoʻliga aylangan?", a: "Miloddan avvalgi II asr", b: "Milodiy V asr", c: "Milodiy X asr", d: "Miloddan avvalgi V asr", javob: "A", img: null },
        { savol: "'Al-Qonun fit-tibb' (Tibbiyot qonunlari) asari muallifi kim?", a: "Abu Rayhon Beruniy", b: "Abu Ali ibn Sino", c: "Al-Xorazmiy", d: "Mirzo Ulugʻbek", javob: "B", img: null },
        { savol: "Oʻzbekistan Respublikasining Konstitutsiyasi qachon qabul qilingan?", a: "1991-yil 31-avgust", b: "1992-yil 8-dekabr", c: "1993-yil 1-sentabr", d: "1990-yil 20-iyun", javob: "B", img: null },
        { savol: "Quyidagilardan qaysi biri dunyodagi eng qadimgi shaharlardan biri hisoblanadi?", a: "Toshkent", b: "Samarqand", c: "Fargʻona", d: "Navoiy", javob: "B", img: null }
      ]
    },
    {
      title: "Ingliz tili (English)",
      time: 15,
      questions: [
        { savol: "Choose the correct form: 'She ___ to school every day.'", a: "go", b: "goes", c: "going", d: "gone", javob: "B", img: null },
        { savol: "What is the past tense of the verb 'BUY'?", a: "Buyed", b: "Bought", c: "Buying", d: "Buys", javob: "B", img: null },
        { savol: "Find the synonym of the word 'BEAUTIFUL'.", a: "Ugly", b: "Pretty", c: "Sad", d: "Angry", javob: "B", img: null },
        { savol: "Fill in the blank: 'There is ___ apple on the table.'", a: "a", b: "an", c: "the", d: "some", javob: "B", img: null },
        { savol: "Which one is an antonym for 'HOT'?", a: "Warm", b: "Cold", c: "Fire", d: "High", javob: "B", img: null }
      ]
    }
  ];

  // ⚙️ FAST AUTO-UPLOAD FUNKSIYASI (MongoDB uchun)
  const handleAutoUploadTestlar = async () => {
    if(!confirm("Tizimga tayyor 4 ta fanning (20 ta savol) testlarini avtomatik yuklashni xohlaysizmi?")) return;
    try {
      for (const paket of tayyorTestlarPaketlari) {
        // 1. Avval fanni ochamiz (root yaratish)
        const rootRes = await axios.post(`${API_URL}/save-root`, {
          title: paket.title,
          time: Number(paket.time)
        });
        const createdQuizId = rootRes.data.quiz._id;

        // 2. Savollarni bittalab MongoDB ichiga push qilamiz
        for (const q of paket.questions) {
          await axios.post(`${API_URL}/add-question`, {
            quizId: createdQuizId,
            questionIdx: null,
            questionData: q
          });
        }

        // 3. Test paketini faollashtiramiz
        await axios.post(`${API_URL}/finalize-quiz`, { quizId: createdQuizId });
      }
      alert("🚀 4 ta fan testlari MongoDB bazasiga muvaffaqiyatli yuklandi!");
      if (fetchTeacherData) fetchTeacherData();
    } catch (err) {
      console.error(err);
      alert("Avto-yuklashda xatolik yuz berdi!");
    }
  };

  // 🖼️ Rasm yuklash funksiyasi
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) { 
        alert("Rasm hajmi juda katta! (Maksimal 1.5MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setImgBase64(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // SAVOL QO'SHISH YOKI RO'YXATDAGINI TAHRIRLASH (MongoDB API bilan)
  const handleAddOrUpdateQuestion = async () => {
    if (!quizTitle.trim()) {
      alert("Avval fan nomini kiriting!");
      return;
    }
    if (!savol.trim()) {
      alert("Iltimos, avval savol matnini yozing!");
      return;
    }
    if (!a.trim() || !b.trim() || !c.trim() || !d.trim()) {
      alert("Iltimos, barcha A, B, C, D variantlarni to'ldiring!");
      return;
    }

    const targetQuestion = { 
      savol: savol.trim(), 
      img: imgBase64 || null, 
      a: a.trim(), 
      b: b.trim(), 
      c: c.trim(), 
      d: d.trim(), 
      javob: javob.toUpperCase() 
    };

    try {
      let currentQuizId = editingQuizId;

      // Agar yangi fan bo'lsa va hali bazada ochilmagan bo'lsa, avval uni yaratamiz
      if (!currentQuizId) {
        const rootRes = await axios.post(`${API_URL}/save-root`, {
          title: quizTitle.trim(),
          time: Number(quizTime)
        });
        currentQuizId = rootRes.data.quiz._id;
        setEditingQuizId(currentQuizId);
      }

      // Savolni MongoDB-ga to'g'ridan-to'g'ri qo'shish yoki tahrirlash
      const res = await axios.post(`${API_URL}/add-question`, {
        quizId: currentQuizId,
        questionIdx: editingQuestionIdx,
        questionData: targetQuestion
      });

      if (res.data.success) {
        setQuestions(res.data.quiz.questions);
        alert(editingQuestionIdx !== null ? "Savol tahrirlandi!" : "Savol muvaffaqiyatli bazaga qo'shildi!");
        
        // Formani tozalash
        setSavol(""); setImgBase64(""); setA(""); setB(""); setC(""); setD(""); setJavob("A");
        setEditingQuestionIdx(null);
        if (fetchTeacherData) fetchTeacherData();
      }
    } catch (e) {
      console.error(e);
      alert("Savolni saqlashda xatolik yuz berdi!");
    }
  };

  // 💾 BARCHA SAVOLLARNI YAKUNLASH VA HOZIRGI OYNANI TOZALASH
  const handleSaveQuiz = async () => {
    if (!quizTitle.trim() || questions.length === 0) {
      alert("Fan nomini yozing va kamida bitta savol qo'shing!");
      return;
    }
    try {
      // Test holatini 'active' ga o'tkazish
      await axios.post(`${API_URL}/finalize-quiz`, { quizId: editingQuizId });
      alert("🚀 Test to'liq yakunlandi va tizimda faollashtirildi!");

      // Maydonlarni tozalash
      setQuizTitle("");
      setQuizTime(20);
      setQuestions([]);
      setEditingQuizId(null);
      setEditingQuestionIdx(null);
      
      if (fetchTeacherData) fetchTeacherData();
    } catch (e) { 
      console.error(e); 
      alert("Xatolik yuz berdi!");
    }
  };

  // Bazadagi testni tahrirlash uchun formaga yuklash
  const startEditQuiz = (quiz) => {
    setEditingQuizId(quiz._id); // MongoDB-da ID '_id' ko'rinishida bo'ladi
    setQuizTitle(quiz.title);
    setQuizTime(quiz.time || 20); 
    setQuestions(quiz.questions || []);
    setSavol(""); setImgBase64(""); setA(""); setB(""); setC(""); setD(""); setJavob("A");
    setEditingQuestionIdx(null);
  };

  // Savolni tahrirlash uchun formaga yuklash
  const loadQuestionToForm = (idx) => {
    const q = questions[idx];
    setSavol(q.savol);
    setImgBase64(q.img || "");
    setA(q.a); setB(q.b); setC(q.c); setD(q.d); setJavob(q.javob);
    setEditingQuestionIdx(idx);
  };

  // Savolni MongoDB bazasidagi massivdan o'chirish
  const deleteQuestionFromList = async (idx) => {
    if (!confirm("Ushbu savolni o'chirmoqchimisiz?")) return;
    try {
      const res = await axios.post(`${API_URL}/delete-question`, {
        quizId: editingQuizId,
        questionIdx: idx
      });
      setQuestions(res.data.quiz.questions);
      if (editingQuestionIdx === idx) setEditingQuestionIdx(null);
      if (fetchTeacherData) fetchTeacherData();
    } catch (err) {
      console.error(err);
      alert("Savolni o'chirishda xatolik!");
    }
  };

  // Butun test paketini o'chirish
  const handleDeleteQuiz = async (quizId) => {
    if(!confirm("Ushbu test paketini butunlay o'chirib tashlamoqchimisiz?")) return;
    try {
      await axios.delete(`${API_URL}/${quizId}`);
      alert("Test muvaffaqiyatli o'chirildi!");
      if (editingQuizId === quizId) {
        setQuizTitle(""); setQuizTime(20); setQuestions([]); setEditingQuizId(null);
      }
      if (fetchTeacherData) fetchTeacherData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-xl font-sans tracking-wide">
      
      {/* 🛠️ TEST YARATISH VA TAHRIRLASH FORMASI */}
      <div className={`lg:col-span-7 p-8 rounded-3xl border transition-all duration-300 ${darkMode ? 'bg-slate-900 border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.3)]' : 'bg-white border-slate-200 shadow-[0_20px_40px_rgba(15,23,42,0.06)]'}`}>
        
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-black text-2xl bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent uppercase">
            {editingQuizId ? "✏️ Testni Tahrirlash" : "📝 Yangi Test Kreator"}
          </h3>
          
          {/* ✨ TELEPORT TUGMASI (AVTO YUKLASH) */}
          {!editingQuizId && (
            <button 
              type="button"
              onClick={handleAutoUploadTestlar}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all active:scale-95 animate-pulse"
            >
              🚀 4 TA FANNI AVTO QO'SHISH
            </button>
          )}
        </div>
        
        {/* ⏱️ FAN NOMI VA CHEKKADA IXCHAM VAQT */}
        <div className="mb-6">
          <label className={`block text-xs font-black uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Fan nomi va imtihon vaqti:</label>
          <div className="flex gap-3">
            <div className="flex-1">
              <input 
                type="text" 
                value={quizTitle} 
                onChange={e => setQuizTitle(e.target.value)} 
                disabled={editingQuizId !== null}
                placeholder="Masalan: Ona tili, Matematika..." 
                className={`w-full rounded-2xl p-4 text-base font-bold border-2 transition-all focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-600'}`}
              />
            </div>
            
            <div className="w-32 relative flex items-center">
              <input 
                type="number" 
                value={quizTime} 
                min="1"
                onChange={e => setQuizTime(e.target.value)} 
                disabled={editingQuizId !== null}
                placeholder="20" 
                className={`w-full rounded-2xl p-4 pr-10 text-base font-black border-2 text-center transition-all focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-amber-500 focus:border-indigo-500' : 'bg-slate-50 border-slate-300 text-indigo-600 focus:border-indigo-600'}`}
              />
              <span className="absolute right-3.5 text-xs font-bold text-slate-400 pointer-events-none">m</span>
            </div>
          </div>
        </div>
        
        {/* Savol tuzish bloki */}
        <div className={`p-6 rounded-2xl border-2 transition-all ${darkMode ? 'bg-slate-950/40 border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
          
          <div className="relative mb-5">
            <div className="flex justify-between items-center mb-2">
              <label className={`block text-xs font-black uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {editingQuestionIdx !== null ? `Savol matnini to'g'rilash (№ ${editingQuestionIdx + 1}):` : 'Savol Matni:'}
              </label>
              {editingQuestionIdx !== null && (
                <button onClick={() => { setEditingQuestionIdx(null); setSavol(""); setImgBase64(""); setA(""); setB(""); setC(""); setD(""); }} className="text-xs text-amber-500 font-bold underline">Tahrirdan chiqish</button>
              )}
            </div>
            
            <div className="relative flex items-center">
              <textarea 
                value={savol} 
                onChange={e => setSavol(e.target.value)} 
                placeholder="Savol matnini bu yerga yozing..." 
                className={`w-full rounded-2xl p-4 pr-14 text-lg font-medium border-2 h-24 resize-none focus:outline-none ${darkMode ? 'bg-slate-900 border-slate-800 text-white focus:border-indigo-500' : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-600'}`}
              />
              <label className="absolute right-3 bottom-3 flex items-center justify-center p-2.5 rounded-xl cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 002-2H4a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            </div>

            {imgBase64 && (
              <div className="mt-3 flex items-center gap-3 p-2 rounded-xl bg-indigo-500/5 border border-indigo-500/20 w-fit">
                <img src={imgBase64} alt="Mini preview" className="h-12 w-12 object-cover rounded-lg border" />
                <button type="button" onClick={() => setImgBase64("")} className="text-xs text-rose-500 font-bold hover:underline">O'chirish</button>
              </div>
            )}
          </div>

          {/* Variantlar */}
          <div className="space-y-3.5">
            {['A', 'B', 'C', 'D'].map((v) => {
              const val = v === 'A' ? a : v === 'B' ? b : v === 'C' ? c : d;
              const setVal = v === 'A' ? setA : v === 'B' ? setB : v === 'C' ? setC : setD;
              const isChecked = javob === v;

              return (
                <div key={v} className={`flex items-center gap-3 p-1.5 px-3 rounded-2xl border-2 transition-all ${isChecked ? (darkMode ? 'border-indigo-500 bg-indigo-950/20' : 'border-indigo-600 bg-indigo-50/40') : (darkMode ? 'border-slate-800 bg-slate-900/40' : 'border-slate-200 bg-white')}`}>
                  <label className="flex items-center justify-center cursor-pointer select-none">
                    <input type="radio" name="correct_answer_group" checked={isChecked} onChange={() => setJavob(v)} className="hidden" />
                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center font-black text-sm transition-all ${isChecked ? 'bg-indigo-600 border-indigo-600 text-white scale-110' : darkMode ? 'border-slate-700 text-slate-500 bg-slate-800' : 'border-slate-400 text-slate-500 bg-slate-100'}`}>
                      {isChecked ? '✓' : v}
                    </div>
                  </label>
                  <input type="text" value={val} onChange={e => setVal(e.target.value)} placeholder={`${v} varianti javobi...`} className={`w-full bg-transparent p-3 text-base font-semibold focus:outline-none ${darkMode ? 'text-white' : 'text-slate-800'}`} />
                  {isChecked && <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest px-2">To'g'ri</span>}
                </div>
              );
            })}
          </div>

          <button type="button" onClick={handleAddOrUpdateQuestion} className={`w-full py-4 rounded-2xl font-bold text-base transition mt-6 text-white shadow-md ${editingQuestionIdx !== null ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700' : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'}`}>
            {editingQuestionIdx !== null ? "🔄 JORIY SAVOL O'ZGARISHINI SAQLASH" : `➕ SHU SAVOLNI RO'YXATGA QO'SHISH (${questions.length} ta bo'ldi)`}
          </button>
        </div>

        {/* Saqlash tugmalari */}
        <div className="flex gap-4 mt-6">
          {editingQuizId && (
            <button onClick={() => { setEditingQuizId(null); setQuizTitle(""); setQuizTime(20); setQuestions([]); setEditingQuestionIdx(null); }} className="w-1/3 bg-slate-500 text-white py-5 rounded-2xl font-bold text-sm shadow-md">
              Bekor Qilish
            </button>
          )}
          <button onClick={handleSaveQuiz} className={`bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-5 rounded-2xl font-black text-lg tracking-widest transition shadow-lg ${editingQuizId ? 'w-2/3' : 'w-full'}`}>
            {editingQuizId ? "💾 O'ZGARISHLARNI BAZADA YANGILASH" : "💾 BARCHA SAVOLLARNI BAZAGA SAQLASH"}
          </button>
        </div>
      </div>

      {/* 📦 JORIY SAVOLLAR VA BAZADAGI TESTLAR */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Paket ichidagi savollar */}
        <div className={`p-6 rounded-3xl border transition-all duration-300 ${darkMode ? 'bg-slate-900 border-slate-800 shadow-md' : 'bg-white border-slate-200 shadow-sm'}`}>
          <h3 className="font-black text-sm text-indigo-500 uppercase tracking-wider mb-4">
            📋 Ushbu Paket ichidagi savollar ({questions.length} ta)
          </h3>
          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {questions.map((q, idx) => (
              <div key={idx} className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${editingQuestionIdx === idx ? 'border-amber-500 bg-amber-500/5' : darkMode ? 'bg-slate-950 border-slate-800/80' : 'bg-slate-50 border-slate-200'}`}>
                <div className="cursor-pointer flex-1 mr-2" onClick={() => loadQuestionToForm(idx)}>
                  <p className={`font-bold line-clamp-1 text-sm ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{idx + 1}. {q.savol}</p>
                  <p className="text-[10px] text-indigo-500 font-bold mt-0.5">Javob: {q.javob}</p>
                </div>
                <button onClick={() => deleteQuestionFromList(idx)} className="text-rose-500 font-bold hover:underline px-1">O'chirish</button>
              </div>
            ))}
          </div>
        </div>

        {/* Bazadagi barcha testlar */}
        <div className={`p-6 rounded-3xl border transition-all duration-300 ${darkMode ? 'bg-slate-900 border-slate-800 shadow-md' : 'bg-white border-slate-200 shadow-sm'}`}>
          <h3 className="font-black text-sm text-slate-400 uppercase tracking-wider mb-4">📦 Bazadagi barcha testlar</h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {myQuizzes && myQuizzes.length > 0 ? (
              myQuizzes.map(q => (
                <div key={q._id} className={`p-4 rounded-2xl flex justify-between items-center border shadow-sm ${editingQuizId === q._id ? 'border-indigo-500 bg-indigo-500/5' : darkMode ? 'bg-slate-950 border-slate-800/60' : 'bg-slate-50 border-slate-200'}`}>
                  <div>
                    <p className={`font-black text-base ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>📖 {q.title}</p>
                    <div className="flex gap-3 mt-1">
                      <span className="text-xs text-indigo-500 font-bold">{q.questions?.length || 0} ta savol</span>
                      <span className="text-xs text-amber-500 font-bold">⏱️ {q.time || 20} daqiqa</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEditQuiz(q)} className="text-indigo-500 font-black text-xs p-2 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl">✏️ Edit</button>
                    <button onClick={() => handleDeleteQuiz(q._id)} className="text-rose-500 font-black text-xs p-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl">O'chirish</button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">Hozircha bazada testlar mavjud emas.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}