// Endpoint pour servir les plans d'abonnement marketing depuis Firestore
// Ce script sera exécuté dans le navigateur pour lire la collection marketing et servir les plans

// Importer Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getFirestore, doc, getDoc, collection } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// Configuration de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDi07deAu9BnRVpBeFRdY8XXdXQIR1QB38",
  authDomain: "payesmart-e11d9.firebaseapp.com",
  projectId: "payesmart-e11d9",
  storageBucket: "payesmart-e11d9.appspot.com",
  messagingSenderId: "789311271061",
  appId: "1:789311271061:web:bd29d25f4d0b8ebdddd8d0"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Plans par défaut
const defaultPlans = {
  plans: [
    {
      id: "pay-and-go",
      name: "Pay & Go",
      description: "Idéal pour les petites entreprises",
      price: 29.00,
      billingCycle: "monthly",
      currency: "EUR",
      features: [
        "Gestion des employés",
        "Multi-magasins",
        "Gestion des produits",
        "Gestion des promotions",
        "Programme de fidélité",
        "Analyses avancées",
        "Tableau de bord basique",
        "Support prioritaire",
        "API personnalisable",
        "Gestion des ventes"
      ],
      active: true
    },
    {
      id: "print-and-go",
      name: "Print & Go",
      description: "Plan avec imprimante thermique",
      price: 79.00,
      billingCycle: "monthly",
      currency: "EUR",
      features: [
        "Gestion des employés",
        "Multi-magasins",
        "Gestion des produits",
        "Gestion des promotions",
        "Programme de fidélité",
        "Analyses avancées",
        "Tableau de bord basique",
        "Support prioritaire",
        "API personnalisable",
        "Gestion des ventes"
      ],
      active: true,
      isPopular: true
    },
    {
      id: "all-in",
      name: "All-In",
      description: "Plan All-In",
      price: 149.00,
      billingCycle: "quarterly",
      currency: "EUR",
      features: [
        "Gestion des employés",
        "Multi-magasins",
        "Gestion des produits",
        "Gestion des promotions",
        "Programme de fidélité",
        "Analyses avancées",
        "Tableau de bord basique",
        "Support prioritaire",
        "API personnalisable",
        "Gestion des ventes"
      ],
      active: true
    }
  ]
};

// Récupérer les plans d'abonnement depuis Firestore
async function getMarketingPlans() {
  try {
    // Essayer de récupérer depuis la collection marketing
    const marketingRef = doc(db, 'marketing', 'subscription_plans');
    const docSnap = await getDoc(marketingRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data && data.plans && data.plans.length > 0) {
        return data;
      }
    }
    
    // Si aucun plan marketing n'est trouvé, chercher les plans actifs dans la collection principale
    const plansDoc = await fetch('/api/subscription-plans-active');
    if (plansDoc.ok) {
      return await plansDoc.json();
    }
    
    // En dernier recours, utiliser les plans par défaut
    return defaultPlans;
  } catch (error) {
    console.error('Erreur lors de la récupération des plans marketing:', error);
    return defaultPlans;
  }
}

// Afficher les plans dans la page
document.addEventListener('DOMContentLoaded', async () => {
  const plansContainer = document.getElementById('marketing-plans-data');
  
  if (plansContainer) {
    try {
      const plansData = await getMarketingPlans();
      plansContainer.textContent = JSON.stringify(plansData, null, 2);
    } catch (error) {
      console.error('Erreur lors de l\'affichage des plans:', error);
      plansContainer.textContent = JSON.stringify(defaultPlans, null, 2);
    }
  }
});
