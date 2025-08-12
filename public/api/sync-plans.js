// Script pour synchroniser les plans entre l'interface admin et le site marketing

// Fonction pour synchroniser les plans
function syncPlansToMarketing() {
  // Étape 1: Accéder à l'interface d'administration et récupérer les plans actifs
  try {
    // Simuler une requête à l'interface d'administration (en production, ce serait une vraie API)
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = '/#/admin/saas';
    document.body.appendChild(iframe);
    
    // Attendre le chargement de l'iframe
    iframe.onload = function() {
      // Attendre que les plans soient chargés dans l'interface d'administration
      setTimeout(() => {
        try {
          // Accéder aux plans actifs dans l'iframe
          const planElements = iframe.contentDocument.querySelectorAll('.plan-item.active');
          
          // Transformation des éléments DOM en objets de plan
          const activePlans = Array.from(planElements).map(element => {
            return {
              id: element.dataset.planId,
              name: element.querySelector('.plan-name').textContent,
              description: element.querySelector('.plan-description').textContent,
              price: parseFloat(element.querySelector('.plan-price').textContent),
              billingCycle: element.querySelector('.plan-cycle').textContent === 'Mensuel' ? 'monthly' : 'quarterly',
              currency: 'EUR',
              features: Array.from(element.querySelectorAll('.plan-feature')).map(feature => feature.textContent.trim()),
              active: true,
              isPopular: element.classList.contains('popular')
            };
          });
          
          // Créer l'objet JSON des plans
          const plansData = {
            plans: activePlans.length > 0 ? activePlans : getDefaultPlans()
          };
          
          // Mettre à jour le fichier JSON public
          localStorage.setItem('active_subscription_plans', JSON.stringify(plansData));
          
          // Mettre à jour la page API
          updateApiPage(plansData);
          
          console.log('Plans d\'abonnement synchronisés avec succès');
        } catch (error) {
          console.error('Erreur lors de la synchronisation des plans:', error);
          useDefaultPlans();
        }
        
        // Supprimer l'iframe
        document.body.removeChild(iframe);
      }, 2000);
    };
  } catch (error) {
    console.error('Erreur lors de la synchronisation des plans:', error);
    useDefaultPlans();
  }
}

// Fonction pour mettre à jour la page API avec les plans
function updateApiPage(plansData) {
  const apiWindow = window.open('/api/plans.html', '_blank');
  
  if (apiWindow) {
    apiWindow.onload = function() {
      const plansContainer = apiWindow.document.getElementById('plans-data');
      if (plansContainer) {
        plansContainer.textContent = JSON.stringify(plansData, null, 2);
      }
      apiWindow.close();
    };
  }
}

// Plans par défaut au cas où la synchronisation échoue
function getDefaultPlans() {
  return [
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
  ];
}

// Utiliser les plans par défaut
function useDefaultPlans() {
  const defaultPlansData = {
    plans: getDefaultPlans()
  };
  
  localStorage.setItem('active_subscription_plans', JSON.stringify(defaultPlansData));
  updateApiPage(defaultPlansData);
}

// Synchroniser les plans au chargement de la page
syncPlansToMarketing();

// Synchroniser les plans toutes les 30 secondes
setInterval(syncPlansToMarketing, 30000);
