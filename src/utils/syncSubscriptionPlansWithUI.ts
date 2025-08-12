import { db } from '../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, query, where } from 'firebase/firestore';
import { SubscriptionPlan } from '../types/saas';

// Collection Firestore
const PLANS_COLLECTION = 'subscription_plans';

// Plans d'abonnement correspondant à l'interface utilisateur
const uiSubscriptionPlans: SubscriptionPlan[] = [
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

/**
 * Synchronise les plans d'abonnement dans Firestore avec ceux définis dans l'interface utilisateur
 */
export const syncSubscriptionPlansWithUI = async (): Promise<void> => {
  try {
    console.log('Début de la synchronisation des plans d\'abonnement...');
    
    // Récupérer tous les plans existants
    const plansSnapshot = await getDocs(collection(db, PLANS_COLLECTION));
    const existingPlans = plansSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as SubscriptionPlan));
    
    console.log(`${existingPlans.length} plans existants trouvés.`);
    
    // Créer un ensemble des IDs des plans existants pour une recherche rapide
    const existingPlanIds = new Set(existingPlans.map(plan => plan.id));
    
    // Traiter chaque plan de l'interface utilisateur
    for (const uiPlan of uiSubscriptionPlans) {
      console.log(`Traitement du plan ${uiPlan.name} (${uiPlan.id})...`);
      
      // Si le plan existe déjà, le mettre à jour
      if (existingPlanIds.has(uiPlan.id)) {
        console.log(`Mise à jour du plan existant: ${uiPlan.id}`);
        
        // Préserver la date de création originale si elle existe
        const existingPlan = existingPlans.find(p => p.id === uiPlan.id);
        if (existingPlan && existingPlan.createdAt) {
          uiPlan.createdAt = existingPlan.createdAt;
        }
        
        // Mettre à jour le plan
        await setDoc(doc(db, PLANS_COLLECTION, uiPlan.id), uiPlan);
      } 
      // Sinon, créer un nouveau plan
      else {
        console.log(`Création d'un nouveau plan: ${uiPlan.id}`);
        await setDoc(doc(db, PLANS_COLLECTION, uiPlan.id), uiPlan);
      }
    }
    
    // Option pour désactiver les plans qui ne sont pas dans l'interface utilisateur
    // au lieu de les supprimer complètement
    const disableOldPlans = false;
    
    // Créer un ensemble des IDs des plans de l'interface utilisateur
    const uiPlanIds = new Set(uiSubscriptionPlans.map(plan => plan.id));
    
    // Traiter les plans qui existent dans la base de données mais pas dans l'interface utilisateur
    for (const existingPlan of existingPlans) {
      if (!uiPlanIds.has(existingPlan.id)) {
        if (disableOldPlans) {
          // Option 1: Désactiver les anciens plans au lieu de les supprimer
          console.log(`Désactivation du plan obsolète: ${existingPlan.id}`);
          await setDoc(doc(db, PLANS_COLLECTION, existingPlan.id), 
            { ...existingPlan, active: false }, 
            { merge: true }
          );
        } else {
          // Option 2: Supprimer les anciens plans
          // Vérifier si le plan est utilisé dans des abonnements actifs avant de le supprimer
          const subscriptionsQuery = query(
            collection(db, 'subscriptions'),
            where('planId', '==', existingPlan.id),
            where('status', '==', 'active')
          );
          
          const subscriptionsSnapshot = await getDocs(subscriptionsQuery);
          
          if (subscriptionsSnapshot.empty) {
            console.log(`Suppression du plan obsolète non utilisé: ${existingPlan.id}`);
            await deleteDoc(doc(db, PLANS_COLLECTION, existingPlan.id));
          } else {
            console.log(`Le plan ${existingPlan.id} est toujours utilisé par ${subscriptionsSnapshot.size} abonnement(s), désactivation seulement.`);
            await setDoc(doc(db, PLANS_COLLECTION, existingPlan.id), 
              { ...existingPlan, active: false }, 
              { merge: true }
            );
          }
        }
      }
    }
    
    console.log('Synchronisation des plans d\'abonnement terminée avec succès.');
  } catch (error) {
    console.error('Erreur lors de la synchronisation des plans d\'abonnement:', error);
    throw error;
  }
};

export default syncSubscriptionPlansWithUI;
