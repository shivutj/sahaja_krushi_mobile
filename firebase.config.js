import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your Firebase config - from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyDIkvkiTxgBykkuPmhFxBz19DLsipLcfkQ",
  authDomain: "sahaja-krushi.firebaseapp.com",
  projectId: "sahaja-krushi",
  storageBucket: "sahaja-krushi.firebasestorage.app",
  messagingSenderId: "501978245659",
  appId: "1:501978245659:web:a543af85d2d02aa72766be",
  measurementId: "G-M02Q97Y1QC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;
