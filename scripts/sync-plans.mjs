/**
 * Script de synchronisation des plans d'abonnement avec Firebase
 * 
 * Pour exécuter ce script:
 * 1. Assurez-vous d'avoir les variables d'environnement Firebase configurées
 *    export FIREBASE_API_KEY="votre-api-key"
 *    export FIREBASE_MESSAGING_SENDER_ID="votre-sender-id"
 *    export FIREBASE_APP_ID="votre-app-id"
 * 
 * 2. Exécutez avec Node.js
 *    node sync-plans.mjs
 * 
 * Ce script va synchroniser les plans d'abonnement dans Firestore pour qu'ils
 * correspondent exactement aux plans affichés sur la page marketing:
 * - Pay & Go (id: pay-and-go)
 * - Print & Go (id: print-and-go)
 * - All-In (id: all-in)
 */

// Importation des modules nécessaires pour Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';

// Configuration Firebase (à remplacer par votre configuration réelle)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: "payesmart.firebaseapp.com",
  projectId: "payesmart",
  storageBucket: "payesmart.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Collection Firestore
const PLANS_COLLECTION = 'subscription_plans';

// Plans d'abonnement à synchroniser
const subscriptionPlans = [
  {
    id: 'pay-and-go',
    name: 'Pay & Go',
    description: 'Idéal pour les petites entreprises',
    price: 29.00,
    billingCycle: 'monthly',
    currency: 'EUR',
    features: [
      'Gestion des employés',
      'Multi-magasins',
      'Gestion des produits',
      'Gestion des promotions',
      'Programme de fidélité',
      'Analyses avancées',
      'Tableau de bord basique',
      'Support prioritaire',
      'API personnalisable',
      'Gestion des ventes'
    ],
    active: true,
    createdAt: Date.now()
  },
  {
    id: 'print-and-go',
    name: 'Print & Go',
    description: 'Plan avec imprimante thermique',
    price: 79.00,
    billingCycle: 'monthly',
    currency: 'EUR',
    features: [
      'Gestion des employés',
      'Multi-magasins',
      'Gestion des produits',
      'Gestion des promotions',
      'Programme de fidélité',
      'Analyses avancées',
      'Tableau de bord basique',
      'Support prioritaire',
      'API personnalisable',
      'Gestion des ventes'
    ],
    active: true,
    createdAt: Date.now(),
    isPopular: true
  },
  {
    id: 'all-in',
    name: 'All-In',
    description: 'Plan All-In',
    price: 149.00,
    billingCycle: 'quarterly',
    currency: 'EUR',
    features: [
      'Gestion des employés',
      'Multi-magasins',
      'Gestion des produits',
      'Gestion des promotions',
      'Programme de fidélité',
      'Analyses avancées',
      'Tableau de bord basique',
      'Support prioritaire',
      'API personnalisable',
      'Gestion des ventes'
    ],
    active: true,
    createdAt: Date.now()
  }
];

// Fonction pour synchroniser les plans
async function syncPlans() {
  try {
    console.log('Début de la synchronisation des plans d\'abonnement...');
    
    // Parcourir chaque plan et le sauvegarder dans Firestore
    for (const plan of subscriptionPlans) {
      console.log(`Mise à jour du plan: ${plan.name} (${plan.id})`);
      await setDoc(doc(db, PLANS_COLLECTION, plan.id), plan);
    }
    
    console.log('Synchronisation terminée avec succès !');
    return true;
  } catch (error) {
    console.error('Erreur lors de la synchronisation:', error);
    return false;
  }
}

// Exécution de la synchronisation
syncPlans()
  .then((success) => {
    if (success) {
      console.log('Tous les plans ont été synchronisés avec Firestore.');
      process.exit(0);
    } else {
      console.error('Échec de la synchronisation des plans.');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('Erreur non gérée:', error);
    process.exit(1);
  });
