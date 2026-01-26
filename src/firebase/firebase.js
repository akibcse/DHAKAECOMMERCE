import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyDHl27DYGqiZsEiK2oBx1apZrAq37oDGEg",
    authDomain: "dhakaecommerce-86c3c.firebaseapp.com",
    projectId: "dhakaecommerce-86c3c",
    storageBucket: "dhakaecommerce-86c3c.firebasestorage.app",
    messagingSenderId: "483517679529",
    appId: "1:483517679529:web:554fe8b78ca66701e826b8",
    measurementId: "G-TEDN1EGC58"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);
