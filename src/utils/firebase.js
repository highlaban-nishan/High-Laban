import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, updateDoc, doc, setDoc } from "firebase/firestore";

// TODO: REPLACE WITH YOUR FIREBASE CONFIGURATION
// 1. Go to console.firebase.google.com
// 2. Click "Project Settings" -> "General" -> "Your apps"
// 3. Copy the config object and paste it below
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBqpMyF6O3M865M97_TKNgGWeOYH65Doy8",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "highlaban-833fc.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "highlaban-833fc",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "highlaban-833fc.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "662034537087",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:662034537087:web:8270d976ed012a8050bd4a",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-R2WJ30698P"
};

// Validate Config
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error("Firebase Configuration Error: Missing Environment Variables.");
    if (typeof window !== 'undefined') {
        // Delay alert slightly to ensure it doesn't block initial rendering
        setTimeout(() => {
            console.warn("Missing Firebase Keys. If you are on Vercel, please add them in Project Settings.");
        }, 1000);
    }
}

export const isConfigured = () => {
    return firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY_HERE";
};

import { getStorage } from "firebase/storage";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Collection References
export const COLLECTIONS = {
    PRODUCTS: 'products',
    ORDERS: 'orders',
    CUSTOMERS: 'customers'
};
