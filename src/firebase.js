import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDLGqyr0LDHAbf8a4Xw_LztAdgk7TsFFNA",
  authDomain: "dispatch2026-3be32.firebaseapp.com",
  projectId: "dispatch2026-3be32",
  storageBucket: "dispatch2026-3be32.firebasestorage.app",
  messagingSenderId: "45015869040",
  appId: "1:45015869040:web:02ad7b8d74b165cea4f6b5"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
