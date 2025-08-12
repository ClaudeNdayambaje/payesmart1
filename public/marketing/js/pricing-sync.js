// Script pour afficher les plans d'abonnement sur le site marketing
document.addEventListener('DOMContentLoaded', async function() {
    // Charger les plans d'abonnement
    await loadSubscriptionPlans();
    
    // Configurer le toggle mensuel/annuel
    const pricingToggle = document.getElementById('pricing-toggle');
    if (pricingToggle) {
        pricingToggle.addEventListener('change', loadSubscriptionPlans);
    }
});

// Plans d'abonnement statiques pour le site marketing
// Ces plans doivent correspondre exactement à ceux que vous voulez afficher dans le marketing
const marketingPlans = {
    plans: [
        {
            id: "pay-and-go-ik",
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

// Fonction pour charger les plans d'abonnement
async function loadSubscriptionPlans() {
    try {
        // Utiliser directement les plans définis dans ce fichier
        const data = marketingPlans;
        console.log('Plans chargés depuis la définition statique');
        
        // Chercher soit l'ancien conteneur soit le nouveau
        const pricingContainer = document.querySelector('.pricing-grid') || document.querySelector('.pricing-cards-container');
        
        if (!pricingContainer) {
            console.log('Note: Container de tarification non trouvé - probablement nouveau design sans chargement dynamique');
            return;
        }
        
        // Vider le conteneur
        pricingContainer.innerHTML = '';
        
        // Vérifier si le mode annuel est activé
        const isAnnualBilling = document.getElementById('pricing-toggle')?.checked || false;
        
        // Parcourir les plans et créer les cartes
        data.plans.forEach((plan, index) => {
            // Calculer le prix en fonction du mode de facturation
            let displayPrice = plan.price;
            let cycle = plan.billingCycle;
            
            if (isAnnualBilling && plan.billingCycle === 'monthly') {
                displayPrice = (plan.price * 12 * 0.8).toFixed(0); // 20% de réduction, arrondi
                cycle = 'yearly';
            }
            
            // Formater le cycle de facturation
            let cycleDisplay = '';
            switch (cycle) {
                case 'monthly':
                    cycleDisplay = '/mois';
                    break;
                case 'yearly':
                    cycleDisplay = '/an';
                    break;
                case 'quarterly':
                    cycleDisplay = '/trimestre';
                    break;
                default:
                    cycleDisplay = '';
            }
            
            // Déterminer les classes et badges spéciaux
            let cardClass = 'pricing-card';
            let badge = '';
            
            if (plan.isPopular) {
                cardClass += ' pricing-pro popular';
                badge = '<div class="popular-badge">Le plus choisi</div>';
            } else if (index === 2) { // Le troisième plan est souvent "Enterprise"
                cardClass += ' pricing-enterprise';
            }
            
            // Créer le HTML de la carte
            const cardHTML = `
                <div class="${cardClass}">
                    ${badge}
                    <div class="pricing-header">
                        <h3>${plan.name}</h3>
                        <div class="price">
                            <span class="currency">€</span>
                            <span class="amount">${displayPrice}</span>
                            <span class="period">${cycleDisplay}</span>
                        </div>
                        <p>${plan.description}</p>
                    </div>
                    <div class="pricing-features">
                        <ul>
                            ${plan.features.map(feature => `<li>${feature}</li>`).join('')}
                        </ul>
                    </div>
                    <div class="pricing-cta">
                        <a href="../../../#/plans" class="btn btn-primary btn-block">Choisir ce plan</a>
                    </div>
                </div>
            `;
            
            // Ajouter la carte au conteneur
            pricingContainer.innerHTML += cardHTML;
        });
        
    } catch (error) {
        console.error('Erreur lors du chargement des plans:', error);
        const pricingContainer = document.querySelector('.pricing-grid');
        if (pricingContainer) {
            pricingContainer.innerHTML = `
                <div class="error-message">
                    <p>Erreur lors du chargement des plans d'abonnement.</p>
                </div>
            `;
        }
    }
}
