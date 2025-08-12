import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Votre configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD-D2qvB1zQ3ta-31LuAvBawR_6KJHb07Y",
  authDomain: "logiciel-de-caisse-7e58e.firebaseapp.com",
  projectId: "logiciel-de-caisse-7e58e",
  storageBucket: "logiciel-de-caisse-7e58e.firebasestorage.app",
  messagingSenderId: "845468395395",
  appId: "1:845468395395:web:4c4adddef147c29f0338b6"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Initialiser Firestore
export const db = getFirestore(app);

// Initialiser Auth
export const auth = getAuth(app);

export default app;
