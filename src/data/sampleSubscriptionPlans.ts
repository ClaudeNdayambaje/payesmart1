import { SubscriptionPlan } from '../types/saas';
import { db } from '../firebase';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';

// Plans d'abonnement d'exemple
const samplePlans: SubscriptionPlan[] = [
  {
    id: 'plan-starter',
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
    trialPeriodInDays: 14
  },
  {
    id: 'plan-business',
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
    trialPeriodInDays: 14,
    isPopular: true
  },
  {
    id: 'plan-premium',
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
    trialPeriodInDays: 14
  }
];

// Fonction pour créer ou mettre à jour les plans d'exemple dans Firestore
export const createSamplePlans = async (): Promise<void> => {
  try {
    const subscriptionPlansRef = collection(db, 'subscription_plans');
    const snapshot = await getDocs(subscriptionPlansRef);
    
    // Si aucun plan n'existe, créer les plans d'exemple
    if (snapshot.empty) {
      console.log('Aucun plan trouvé, création des plans d\'exemple...');
      
      for (const plan of samplePlans) {
        await setDoc(doc(db, 'subscription_plans', plan.id), plan);
        console.log(`Plan créé : ${plan.name}`);
      }
      
      console.log('Plans d\'exemple créés avec succès!');
    } else {
      console.log('Des plans existent déjà, aucun plan d\'exemple n\'a été créé.');
    }
  } catch (error) {
    console.error('Erreur lors de la création des plans d\'exemple:', error);
    throw error;
  }
};

export default samplePlans;
