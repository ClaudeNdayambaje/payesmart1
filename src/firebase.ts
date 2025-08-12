import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence, disableNetwork, enableNetwork } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Votre configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD-D2qvB1zQ3ta-31LuAvBawR_6KJHb07Y",
  authDomain: "logiciel-de-caisse-7e58e.firebaseapp.com",
  projectId: "logiciel-de-caisse-7e58e",
  storageBucket: "logiciel-de-caisse-7e58e.appspot.com",
  messagingSenderId: "845468395395",
  appId: "1:845468395395:web:4c4adddef147c29f0338b6"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Initialiser Firestore avec des options pour la persistance offline
let persistenceEnabled = false;

// Créer une fonction pour initialiser Firestore avec persistance
const initializeFirestore = async () => {
  if (persistenceEnabled) {
    return getFirestore(app);
  }
  
  const firestoreInstance = getFirestore(app);
  
  try {
    // Essayer d'activer la persistance uniquement si ce n'est pas déjà fait
    await enableIndexedDbPersistence(firestoreInstance);
    console.log('Firebase persistence activée avec succès!');
    persistenceEnabled = true;
  } catch (err: any) {
    if (err.code === 'failed-precondition') {
      // Plusieurs onglets ouverts, la persistance ne peut être activée que dans un seul onglet
      console.error('La persistance ne peut pas être activée car plusieurs onglets sont ouverts');
    } else if (err.code === 'unimplemented') {
      // Le navigateur actuel ne prend pas en charge toutes les fonctionnalités nécessaires
      console.error('Le navigateur actuel ne prend pas en charge la persistance hors ligne');
    } else {
      console.error('Erreur lors de l\'activation de la persistance:', err);
    }
  }
  
  return firestoreInstance;
};

// Exporter l'instance de Firestore
export const db = getFirestore(app);

// Essayer d'activer la persistance sans bloquer l'initialisation de l'application
(async () => {
  try {
    if (!persistenceEnabled) {
      await enableIndexedDbPersistence(db);
      persistenceEnabled = true;
      console.log('Firebase persistence activée avec succès!');
    }
  } catch (err: any) {
    if (err.code !== 'failed-precondition') {
      console.error('Erreur lors de l\'activation de la persistance:', err);
    }
  }
})();

// Initialiser Auth
export const auth = getAuth(app);

// Initialiser Storage
export const storage = getStorage(app);

// Fonctions pour gérer l'état de la connexion réseau
export const goOffline = () => disableNetwork(db);
export const goOnline = () => enableNetwork(db);

// Détecter l'état de la connexion Internet
export const setupNetworkDetection = () => {
  window.addEventListener('online', () => {
    console.log('Connexion Internet détectée');
    goOnline();
  });

  window.addEventListener('offline', () => {
    console.log('Connexion Internet perdue');
    goOffline();
  });
};

export default app;
