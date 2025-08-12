// Ce script génère un fichier JSON avec les plans d'abonnement
// À utiliser comme point d'API commun entre le site marketing et l'application

// Plans par défaut au cas où la récupération échoue
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

// Initialiser avec les plans par défaut
document.addEventListener('DOMContentLoaded', function() {
  const plansContainer = document.getElementById('plans-data');
  if (plansContainer) {
    // Afficher les plans par défaut dès le départ
    plansContainer.textContent = JSON.stringify(defaultPlans);
  }
});

// Récupérer les plans depuis l'application principale  
async function fetchPlans() {
  const plansContainer = document.getElementById('plans-data');
  
  try {
    // 1. Essayer de récupérer les plans depuis Firestore (marketing collection)
    try {
      const response = await fetch('/api/marketing/plans');
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.plans && data.plans.length > 0) {
          plansContainer.textContent = JSON.stringify(data, null, 2);
          return data;
        }
      }
    } catch (firestoreError) {
      console.warn('Erreur lors de la récupération depuis Firestore:', firestoreError);
    }
    
    // 2. Essayer de récupérer depuis le localStorage
    try {
      const localData = localStorage.getItem('subscription_plans');
      if (localData) {
        const parsedData = JSON.parse(localData);
        if (parsedData && parsedData.plans && parsedData.plans.length > 0) {
          plansContainer.textContent = JSON.stringify(parsedData, null, 2);
          return parsedData;
        }
      }
    } catch (localStorageError) {
      console.warn('Erreur lors de la récupération depuis localStorage:', localStorageError);
    }
    
    // Filtrer pour ne garder que les plans actifs et éliminer les doublons
    // en gardant uniquement la première occurrence de chaque nom de plan
    const uniquePlanNames = new Set();
    const filteredPlans = (rawData.plans || []).filter(plan => {
      // Ne garder que les plans actifs
      if (!plan.active) return false;
      
      // Éliminer les doublons par nom
      if (uniquePlanNames.has(plan.name)) return false;
      uniquePlanNames.add(plan.name);
      
      return true;
    });
    
    // Créer le nouvel objet de données filtrées
    const filteredData = {
      plans: filteredPlans
    };
    
    // Afficher les plans filtrés dans le conteneur
    if (plansContainer) {
      plansContainer.textContent = JSON.stringify(filteredData, null, 2);
    }
    
    return filteredData;
  } catch (error) {
    console.error('Erreur lors de la récupération des plans:', error);
    
    // En cas d'erreur, utiliser les plans par défaut
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
    
    // Afficher les plans par défaut dans le conteneur
    if (plansContainer) {
      plansContainer.textContent = JSON.stringify(defaultPlans);
    }
    
    return defaultPlans;
  }
}

// Charger les plans au chargement de la page
document.addEventListener('DOMContentLoaded', fetchPlans);

// Rafraîchir les plans toutes les 15 secondes
setInterval(fetchPlans, 5000);
