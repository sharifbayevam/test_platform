import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyALzlTbmPsjHqrbaYa1550sA7j4k3DpqMA",
  authDomain: "testplatform-5943a.firebaseapp.com",
  projectId: "testplatform-5943a",
  storageBucket: "testplatform-5943a.firebasestorage.app",
  messagingSenderId: "70608224350",
  appId: "1:706082243450:web:78e5291f60ff3c5dc4b4cf",
  measurementId: "G-9CKJ7GKR8H"
};

// Firebase-ni ishga tushirish
const app = initializeApp(firebaseConfig);

// Firestore ma'lumotlar bazasini export qilish
export const db = getFirestore(app);

/**
 * Firestore-ga istalgan kolleksiyaga ma'lumot yozish funksiyasi
 */
export const addDataToFolder = async (folderName, data) => {
  try {
    const docRef = await addDoc(collection(db, folderName), {
      ...data,
      createdAt: new Date().toISOString()
    });
    console.log("Ma'lumot muvaffaqiyatli yozildi! ID:", docRef.id);
    return docRef;
  } catch (error) {
    console.error("Firebase-ga yozishda xatolik:", error);
    throw error;
  }
};