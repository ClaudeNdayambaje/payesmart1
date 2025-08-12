// Utilitaire pour recréer les plans d'abonnement manquants
import { db } from '../firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { SubscriptionPlan } from '../types/saas';

// Collection Firestore
const PLANS_COLLECTION = 'subscription_plans';

// Plans d'abonnement à recréer (basés sur les IDs manquants)
const missingPlans: Record<string, Omit<SubscriptionPlan, 'id'>> = {
  // Plan Basic (29€/mois)
  "5dVUdOBJcMWeZgMYzExB": {
    name: "Plan Basic",
    description: "Plan d'abonnement basique pour petites entreprises",
    price: 29,
    currency: "EUR",
    billingCycle: "monthly",
    features: [
      "Gestion des stocks",
      "Gestion des ventes",
      "Support par email"
    ],
    active: true,
    createdAt: Date.now()
  },
  
  // Plan Premium (149€/mois)
  "ADi3aekLyaLmDLrf69up": {
    name: "Plan Premium",
    description: "Plan d'abonnement premium avec fonctionnalités avancées",
    price: 149,
    currency: "EUR",
    billingCycle: "monthly",
    features: [
      "Toutes les fonctionnalités du plan Basic",
      "Rapports avancés",
      "Support prioritaire 24/7",
      "Personnalisation avancée"
    ],
    active: true,
    createdAt: Date.now()
  },
  
  // Plan Standard (79€/mois)
  "9bFBqjcXAfz8FvzGsamt": {
    name: "Plan Standard",
    description: "Plan d'abonnement standard pour entreprises moyennes",
    price: 79,
    currency: "EUR",
    billingCycle: "monthly",
    features: [
      "Toutes les fonctionnalités du plan Basic",
      "Rapports personnalisés",
      "Support téléphonique"
    ],
    active: true,
    createdAt: Date.now()
  },
  
  // Plan Entreprise (299€/mois)
  "dxkZbgK9cwUCfDzhJRI3": {
    name: "Plan Entreprise",
    description: "Plan d'abonnement complet pour grandes entreprises",
    price: 299,
    currency: "EUR",
    billingCycle: "monthly",
    features: [
      "Toutes les fonctionnalités du plan Premium",
      "API dédiée",
      "Gestionnaire de compte dédié",
      "Formation personnalisée"
    ],
    active: true,
    createdAt: Date.now()
  },
  
  // Plan Annuel (249€/an)
  "OqdGD6qP6eNMsUzEFelm": {
    name: "Plan Annuel",
    description: "Plan d'abonnement annuel économique",
    price: 249,
    currency: "EUR",
    billingCycle: "yearly",
    features: [
      "Toutes les fonctionnalités du plan Standard",
      "Économisez en payant annuellement"
    ],
    active: true,
    createdAt: Date.now()
  },
  
  // Plan Personnalisé
  "kTHNZUPIZh7ifID7Pore": {
    name: "Plan Personnalisé",
    description: "Plan d'abonnement sur mesure",
    price: 499,
    currency: "EUR",
    billingCycle: "monthly",
    features: [
      "Solution entièrement personnalisée",
      "Support VIP",
      "Fonctionnalités sur mesure"
    ],
    active: true,
    createdAt: Date.now()
  }
};

/**
 * Fonction pour recréer tous les plans d'abonnement manquants
 */
export const recoverMissingPlans = async (): Promise<void> => {
  try {
    console.log('Début de la récupération des plans d\'abonnement manquants...');
    
    // Créer chaque plan manquant
    for (const [planId, planData] of Object.entries(missingPlans)) {
      console.log(`Recréation du plan: ${planId} - ${planData.name}`);
      
      // Créer ou mettre à jour le document avec l'ID spécifique
      const planRef = doc(db, PLANS_COLLECTION, planId);
      await setDoc(planRef, planData);
      
      console.log(`Plan ${planData.name} (${planId}) recréé avec succès!`);
    }
    
    console.log('Récupération des plans terminée!');
  } catch (error) {
    console.error('Erreur lors de la récupération des plans:', error);
    throw error;
  }
};

/**
 * Fonction pour recréer un plan spécifique par son ID
 */
export const recoverPlanById = async (planId: string): Promise<boolean> => {
  try {
    if (!missingPlans[planId]) {
      console.error(`Plan avec l'ID ${planId} non trouvé dans la liste de récupération.`);
      return false;
    }
    
    const planData = missingPlans[planId];
    const planRef = doc(db, PLANS_COLLECTION, planId);
    await setDoc(planRef, planData);
    
    console.log(`Plan ${planData.name} (${planId}) recréé avec succès!`);
    return true;
  } catch (error) {
    console.error(`Erreur lors de la récupération du plan ${planId}:`, error);
    return false;
  }
};
