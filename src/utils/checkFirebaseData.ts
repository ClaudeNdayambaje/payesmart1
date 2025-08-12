// Script pour vérifier les données dans Firebase
import { db } from '../firebase';
import { collection, getDocs, query, where, DocumentData } from 'firebase/firestore';

// Types pour les résultats de vérification
export interface CheckResult {
  brokenSubscriptions: any[];
  validSubscriptions: any[];
}

// Collections à vérifier
const SUBSCRIPTIONS_COLLECTION = 'subscriptions';
const PLANS_COLLECTION = 'subscription_plans';
const BUSINESSES_COLLECTION = 'businesses';
const CLIENTS_COLLECTION = 'clients';

// Fonction pour vérifier la collection des abonnements
export const checkSubscriptionsCollection = async () => {
  try {
    console.log('Vérification de la collection des abonnements...');
    const subscriptionsRef = collection(db, SUBSCRIPTIONS_COLLECTION);
    const subscriptionsSnapshot = await getDocs(subscriptionsRef);
    
    if (subscriptionsSnapshot.empty) {
      console.log('Aucun abonnement trouvé dans la collection des abonnements.');
      return [];
    }
    
    const subscriptions = subscriptionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`${subscriptions.length} abonnements trouvés:`, subscriptions);
    return subscriptions;
  } catch (error) {
    console.error('Erreur lors de la vérification des abonnements:', error);
    return null;
  }
};

// Fonction pour vérifier la collection des plans d'abonnement
export const checkPlansCollection = async () => {
  try {
    console.log('Vérification de la collection des plans...');
    const plansRef = collection(db, PLANS_COLLECTION);
    const plansSnapshot = await getDocs(plansRef);
    
    if (plansSnapshot.empty) {
      console.log('Aucun plan trouvé dans la collection des plans.');
      return [];
    }
    
    const plans = plansSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`${plans.length} plans trouvés:`, plans);
    return plans;
  } catch (error) {
    console.error('Erreur lors de la vérification des plans:', error);
    return null;
  }
};

// Fonction pour vérifier si les plans référencés dans les abonnements existent
export const checkSubscriptionPlanReferences = async () => {
  try {
    const subscriptions = await checkSubscriptionsCollection();
    const plans = await checkPlansCollection();
    
    if (!subscriptions || !plans) {
      console.log('Impossible de vérifier les références.');
      return;
    }
    
    // Créer un ensemble des IDs de plans
    const planIds = new Set(plans.map(plan => plan.id));
    
    // Vérifier chaque abonnement
    const brokenSubscriptions = subscriptions.filter(subscription => {
      const planExists = planIds.has(subscription.planId);
      if (!planExists) {
        console.log(`L'abonnement ${subscription.id} fait référence à un plan inexistant: ${subscription.planId}`);
      }
      return !planExists;
    });
    
    if (brokenSubscriptions.length === 0) {
      console.log('Tous les abonnements font référence à des plans valides.');
    } else {
      console.log(`${brokenSubscriptions.length} abonnements font référence à des plans inexistants:`, brokenSubscriptions);
    }
    
    return {
      brokenSubscriptions,
      validSubscriptions: subscriptions.filter(subscription => planIds.has(subscription.planId))
    };
  } catch (error) {
    console.error('Erreur lors de la vérification des références:', error);
    return null;
  }
};

// Fonction principale pour exécuter toutes les vérifications
export const runAllChecks = async () => {
  console.log('=== DÉBUT DE LA VÉRIFICATION DES DONNÉES FIREBASE ===');
  
  await checkSubscriptionsCollection();
  await checkPlansCollection();
  const referenceCheck = await checkSubscriptionPlanReferences();
  
  console.log('=== FIN DE LA VÉRIFICATION DES DONNÉES FIREBASE ===');
  
  return referenceCheck;
};
