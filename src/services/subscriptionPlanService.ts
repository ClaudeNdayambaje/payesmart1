import { db } from '../firebase';
import { collection, getDocs, query, doc, updateDoc, deleteDoc, getDoc, orderBy, setDoc, limit } from 'firebase/firestore';
import { SubscriptionPlan } from '../types/saas';
import { syncMarketingPlans } from './marketingService';

// Export de la collection pour les autres modules
export const SUBSCRIPTION_PLANS_COLLECTION = 'subscription_plans';

// Données de démonstration pour les plans d'abonnement
const DEMO_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan1',
    name: 'Essentiel',
    description: 'Plan de base pour les petites entreprises',
    price: 29.99,
    currency: 'EUR',
    billingCycle: 'monthly',
    features: [
      'Accès à toutes les fonctionnalités de base',
      'Support par email',
      'Jusquà 3 utilisateurs',
      'Stockage limité à 5 Go'
    ],
    active: true,
    createdAt: new Date('2024-01-01').getTime()
  },
  {
    id: 'plan2',
    name: 'Premium',
    description: 'Plan avancé pour les entreprises en croissance',
    price: 299.99,
    currency: 'EUR',
    billingCycle: 'yearly',
    features: [
      'Toutes les fonctionnalités du plan Essentiel',
      'Support prioritaire',
      'Jusquà 10 utilisateurs',
      'Stockage illimité',
      'Rapports avancés',
      'Intégrations personnalisées'
    ],
    active: true,
    createdAt: new Date('2024-01-15').getTime()
  },
  {
    id: 'plan3',
    name: 'Pro',
    description: 'Solution complète pour les entreprises établies',
    price: 149.99,
    currency: 'EUR',
    billingCycle: 'yearly',
    features: [
      'Toutes les fonctionnalités du plan Premium',
      'Support dédié 24/7',
      'Utilisateurs illimités',
      'Stockage illimité',
      'API avancée',
      'Formations personnalisées'
    ],
    active: true,
    createdAt: new Date('2024-02-01').getTime()
  }
];

// Obtenir tous les plans d'abonnement
export const getSubscriptionPlanById = async (planId: string): Promise<SubscriptionPlan | null> => {
  try {
    const planRef = doc(db, SUBSCRIPTION_PLANS_COLLECTION, planId);
    const planDoc = await getDoc(planRef);
    
    if (!planDoc.exists()) {
      console.log(`Plan d'abonnement ${planId} non trouvé`);
      return null;
    }
    
    return { ...planDoc.data(), id: planId } as SubscriptionPlan;
  } catch (error) {
    console.error(`Erreur lors de la récupération du plan d'abonnement ${planId}:`, error);
    throw error;
  }
};

export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  try {
    // Essayer d'abord de récupérer depuis Firebase
    try {
      const plansQuery = query(
        collection(db, SUBSCRIPTION_PLANS_COLLECTION),
        orderBy('price', 'asc')
      );
      
      const snapshot = await getDocs(plansQuery);
      const firebasePlans = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SubscriptionPlan));
      
      // Si des données sont trouvées, les retourner
      if (firebasePlans.length > 0) {
        console.log('Plans d\'abonnement récupérés depuis Firebase:', firebasePlans.length);
        return firebasePlans;
      }
    } catch (firebaseError) {
      console.warn('Erreur Firebase, utilisation des données de démonstration pour les plans:', firebaseError);
    }
    
    // Si aucune donnée n'est trouvée ou en cas d'erreur, utiliser les données de démonstration
    console.log('Utilisation des données de démonstration pour les plans d\'abonnement');
    return DEMO_SUBSCRIPTION_PLANS;
  } catch (error) {
    console.error('Erreur lors de la récupération des plans d\'abonnement:', error);
    // En cas d'erreur générale, retourner quand même les données de démonstration
    return DEMO_SUBSCRIPTION_PLANS;
  }
};

/**
 * Nettoie l'objet plan des propriétés internes qui ne doivent pas être stockées
 */
const removeInternalFields = (plan: Partial<SubscriptionPlan>): Partial<SubscriptionPlan> => {
  // Créer une copie de l'objet
  const cleanPlan = { ...plan };
  
  // Supprimer les propriétés internes qui ne doivent pas être stockées
  const fieldsToRemove = ['_id', '__v', 'createdAt', 'updatedAt', 'id'];
  fieldsToRemove.forEach(field => {
    if (field in cleanPlan) {
      delete cleanPlan[field as keyof Partial<SubscriptionPlan>];
    }
  });
  
  return cleanPlan;
};

// Ajouter un nouveau plan d'abonnement
export const addSubscriptionPlan = async (planData: Omit<SubscriptionPlan, 'id'>): Promise<SubscriptionPlan> => {
  try {
    // Générer un ID unique basé sur le nom du plan (slug)
    const planId = planData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Vérifier si le plan existe déjà
    const planRef = doc(db, SUBSCRIPTION_PLANS_COLLECTION, planId);
    const planSnapshot = await getDoc(planRef);
    
    if (planSnapshot.exists()) {
      throw new Error(`Un plan avec l'identifiant "${planId}" existe déjà.`);
    }
    
    // Créer le nouveau plan
    const newPlan: SubscriptionPlan = {
      id: planId,
      ...planData,
      createdAt: Date.now()
    };
    
    await setDoc(planRef, newPlan);
    
    // Synchroniser avec le site marketing après création
    await syncMarketingPlans();
    
    return newPlan;
  } catch (error) {
    console.error('Erreur lors de l\'ajout du plan:', error);
    throw error;
  }
};

// Mettre à jour un plan d'abonnement
export const updateSubscriptionPlan = async (id: string, plan: Partial<SubscriptionPlan>): Promise<void> => {
  try {
    const cleanPlan = removeInternalFields(plan);
    const planRef = doc(db, SUBSCRIPTION_PLANS_COLLECTION, id);
    await updateDoc(planRef, {
      ...cleanPlan,
      updatedAt: Date.now()
    });
    
    // Synchroniser avec le site marketing après mise à jour
    await syncMarketingPlans();
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du plan d'abonnement ${id}:`, error);
    throw error;
  }
};

// Supprimer un plan d'abonnement
export const deleteSubscriptionPlan = async (planId: string): Promise<void> => {
  try {
    const planRef = doc(db, SUBSCRIPTION_PLANS_COLLECTION, planId);
    await deleteDoc(planRef);
    
    // Synchroniser avec le site marketing après suppression
    await syncMarketingPlans();
  } catch (error) {
    console.error('Erreur lors de la suppression du plan:', error);
    throw error;
  }
};

// Activer un plan d'abonnement
export const activateSubscriptionPlan = async (planId: string): Promise<void> => {
  try {
    const planRef = doc(db, SUBSCRIPTION_PLANS_COLLECTION, planId);
    await updateDoc(planRef, {
      active: true,
      updatedAt: Date.now()
    });
    
    // Synchroniser avec le site marketing après activation
    await syncMarketingPlans();
  } catch (error) {
    console.error(`Erreur lors de l'activation du plan d'abonnement ${planId}:`, error);
    throw error;
  }
};

// Désactiver un plan d'abonnement
export const deactivateSubscriptionPlan = async (planId: string): Promise<void> => {
  try {
    const planRef = doc(db, SUBSCRIPTION_PLANS_COLLECTION, planId);
    await updateDoc(planRef, {
      active: false,
      updatedAt: Date.now()
    });
    
    // Synchroniser avec le site marketing après désactivation
    await syncMarketingPlans();
  } catch (error) {
    console.error(`Erreur lors de la désactivation du plan d'abonnement ${planId}:`, error);
    throw error;
  }
};

// Initialiser les plans d'abonnement par défaut s'ils n'existent pas
export const initializeDefaultPlans = async (): Promise<void> => {
  try {
    // Vérifier si des plans existent déjà
    const plansQuery = query(collection(db, SUBSCRIPTION_PLANS_COLLECTION), limit(1));
    const snapshot = await getDocs(plansQuery);
    
    // Si aucun plan n'existe, créer les plans par défaut
    if (snapshot.empty) {
      // Créer les plans par défaut
      const defaultPlans: Omit<SubscriptionPlan, 'id'>[] = [
        {
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
          name: 'Print & Go',
          description: 'Plan avec imprimante thermique',
          price: 79.00,
          billingCycle: 'monthly',
          currency: 'EUR',
          features: [
            'Toutes les fonctionnalités de Pay & Go',
            'Imprimante thermique incluse',
            'Installation sur site',
            'Formation personnalisée',
            'Assistance prioritaire',
            'Mises à jour premium'
          ],
          active: true,
          createdAt: Date.now(),
          isPopular: true
        },
        {
          name: 'All-In',
          description: 'Solution complète pour les entreprises établies',
          price: 149.00,
          billingCycle: 'quarterly',
          currency: 'EUR',
          features: [
            'Toutes les fonctionnalités de Print & Go',
            'Multi-point de vente',
            'Intégration comptable',
            'API avancée',
            'Support dédié 24/7',
            'Formations illimitées',
            'Personnalisation sur mesure'
          ],
          active: true,
          createdAt: Date.now()
        }
      ];
      
      // Créer chaque plan
      for (const plan of defaultPlans) {
        await addSubscriptionPlan(plan);
      }
      
      console.log('Plans d\'abonnement par défaut initialisés');
    } else {
      console.log('Des plans d\'abonnement existent déjà, pas d\'initialisation nécessaire');
    }
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des plans d\'abonnement par défaut:', error);
    throw error;
  }
};

/**
 * Fonction de synchronisation obsolète - à supprimer dans le futur
 */
export const syncSubscriptionPlansToJSON = async (): Promise<void> => {
  // Cette fonction est maintenant remplacée par syncMarketingPlans
  console.log('Utilisation de la nouvelle méthode de synchronisation...');
  await syncMarketingPlans();
};
