// Firebase Configuration for HydroFirma
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBNWkMbvDllpOtawOJ1F_vRYWFQ8z6riKY",
    authDomain: "hydrofrima.firebaseapp.com",
    projectId: "hydrofrima",
    storageBucket: "hydrofrima.firebasestorage.app",
    messagingSenderId: "685556759308",
    appId: "1:685556759308:web:11155205f86a00efa1a729",
    measurementId: "G-6N4RJGHLXL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and export it
export const auth = getAuth(app);

// Initialize Firestore database and export it
export const db = getFirestore(app);

export default app;