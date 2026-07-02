import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Web App Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBbIXhchMAEHaiZG8I29KucFLWdG5aVS4Y",
  authDomain: "quickcart-3cd3e.firebaseapp.com",
  projectId: "quickcart-3cd3e",
  storageBucket: "quickcart-3cd3e.firebasestorage.app",
  messagingSenderId: "735462211451",
  appId: "1:735462211451:web:2d6060d70a82c93046c7de",
  measurementId: "G-SLPS04P5PH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Firestore Database reference
export const db = getFirestore(app);
