// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC7Ge7lDNj1o4rDROXp0TbwTahhN849my8",
  authDomain: "learning-hub-roadmaps.firebaseapp.com",
  projectId: "learning-hub-roadmaps",
  storageBucket: "learning-hub-roadmaps.firebasestorage.app",
  messagingSenderId: "375083608487",
  appId: "1:375083608487:web:159934024e225565682e82",
  measurementId: "G-2V3S25YF6V",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
