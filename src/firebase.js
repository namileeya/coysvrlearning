// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDT5Bd5VL3KKQDMKwy_7fuCRK32q_E5hZ8",
    authDomain: "coysvrlearning.firebaseapp.com",
    projectId: "coysvrlearning",
    storageBucket: "coysvrlearning.firebasestorage.app",
    messagingSenderId: "545093582546",
    appId: "1:545093582546:web:b3d550cef9adeb0f4a370b",
    measurementId: "G-999EKBNKES"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

export { db, analytics };