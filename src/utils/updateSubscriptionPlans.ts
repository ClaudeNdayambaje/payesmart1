// Utilitaire pour mettre à jour les références des plans d'abonnement
import { db } from '../firebase';
import { collection, getDocs, query, doc, updateDoc, where, orderBy, getDoc } from 'firebase/firestore';
import { SubscriptionPlan } from '../types/saas';

// Activer le débogage
const DEBUG = true;

// Fonction de journalisation avancée
const log = (message: string, data?: any) => {
  if (DEBUG) {
    if (data) {
      console.log(`[UpdatePlans] ${message}`, data);
    } else {
      console.log(`[UpdatePlans] ${message}`);
    }
  }
};

// Collections Firestore
const PLANS_COLLECTION = 'subscription_plans';
const SUBSCRIPTIONS_COLLECTION = 'subscriptions';

/**
 * Récupère les plans d'abonnement créés au cours des 30 derniers jours
 */
export const getRecentPlans = async (): Promise<SubscriptionPlan[]> => {
  try {
    console.log('Récupération des plans d\'abonnement récents...');
    
    // Date il y a 30 jours
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    // Rechercher les plans créés au cours des 30 derniers jours
    const plansQuery = query(
      collection(db, PLANS_COLLECTION),
      where('createdAt', '>=', thirtyDaysAgo),
      orderBy('createdAt', 'desc')
    );
    
    const plansSnapshot = await getDocs(plansQuery);
    
    if (plansSnapshot.empty) {
      console.log('Aucun plan récent trouvé.');
      return [];
    }
    
    const plans = plansSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as SubscriptionPlan));
    
    console.log(`${plans.length} plans récents trouvés.`);
    return plans;
  } catch (error) {
    console.error('Erreur lors de la récupération des plans récents:', error);
    return [];
  }
};

/**
 * Récupère tous les plans d'abonnement disponibles (même les plus anciens)
 */
export const getAllAvailablePlans = async (): Promise<SubscriptionPlan[]> => {
  try {
    const plansQuery = query(
      collection(db, PLANS_COLLECTION),
      where('active', '==', true)
    );
    
    const plansSnapshot = await getDocs(plansQuery);
    
    if (plansSnapshot.empty) {
      console.log('Aucun plan actif trouvé.');
      return [];
    }
    
    const plans = plansSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as SubscriptionPlan));
    
    console.log(`${plans.length} plans actifs trouvés.`);
    return plans;
  } catch (error) {
    console.error('Erreur lors de la récupération des plans actifs:', error);
    return [];
  }
};

/**
 * Trouve le plan le plus adapté pour remplacer un ancien plan
 * Stratégie : correspond par prix ou par type (basic, premium, etc.)
 */
export const findBestMatchingPlan = (
  _oldPlanId: string, 
  price: number | undefined,
  plansList: SubscriptionPlan[]
): SubscriptionPlan | null => {
  if (plansList.length === 0) {
    return null;
  }
  
  // Si un prix est fourni, essayer de trouver un plan avec un prix similaire
  if (price !== undefined) {
    // Essayer de trouver un plan avec le même prix
    const exactPriceMatch = plansList.find(plan => plan.price === price);
    if (exactPriceMatch) {
      return exactPriceMatch;
    }
    
    // Si aucun plan avec le prix exact n'est trouvé, trouver le plus proche
    const sortedByPriceDistance = [...plansList].sort((a, b) => {
      return Math.abs(a.price - price) - Math.abs(b.price - price);
    });
    
    return sortedByPriceDistance[0]; // Plan le plus proche en termes de prix
  }
  
  // Si aucun prix n'est fourni, retourner simplement le premier plan actif
  return plansList[0];
};

/**
 * Corrige les abonnements en mettant à jour les références de plans
 */
export const updateSubscriptionPlanReferences = async (): Promise<{success: boolean, updatedCount: number}> => {
  try {
    console.log('Début de la mise à jour des références de plans d\'abonnement...');
    
    // Récupérer tous les abonnements existants
    const subscriptionsQuery = query(collection(db, SUBSCRIPTIONS_COLLECTION));
    const subscriptionsSnapshot = await getDocs(subscriptionsQuery);
    
    if (subscriptionsSnapshot.empty) {
      console.log('Aucun abonnement trouvé.');
      return { success: true, updatedCount: 0 };
    }
    
    // Récupérer tous les plans disponibles
    const allPlans = await getAllAvailablePlans();
    
    if (allPlans.length === 0) {
      console.log('Aucun plan disponible pour mettre à jour les références.');
      return { success: false, updatedCount: 0 };
    }
    
    // Stocker les plans par ID pour une recherche plus rapide
    const plansMap = new Map<string, SubscriptionPlan>();
    allPlans.forEach(plan => plansMap.set(plan.id, plan));
    
    let updatedCount = 0;
    
    // Parcourir tous les abonnements
    for (const docSnap of subscriptionsSnapshot.docs) {
      const subscription = { id: docSnap.id, ...docSnap.data() } as any;
      const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, docSnap.id);
      
      // Vérifier si le plan référencé existe toujours
      if (!plansMap.has(subscription.planId)) {
        console.log(`Abonnement ${subscription.id} fait référence à un plan inexistant: ${subscription.planId}`);
        
        // Trouver un plan de remplacement approprié
        const replacementPlan = findBestMatchingPlan(
          subscription.planId,
          subscription.price,
          allPlans
        );
        
        if (replacementPlan) {
          console.log(`Mise à jour de l'abonnement ${subscription.id} pour utiliser le plan ${replacementPlan.id} (${replacementPlan.name})`);
          
          // Mettre à jour la référence du plan et le prix
          await updateDoc(subscriptionRef, {
            planId: replacementPlan.id,
            price: replacementPlan.price,
            currency: replacementPlan.currency,
            updatedAt: Date.now()
          });
          
          updatedCount++;
        } else {
          console.log(`Aucun plan de remplacement trouvé pour l'abonnement ${subscription.id}`);
        }
      }
    }
    
    console.log(`Mise à jour terminée. ${updatedCount} abonnements ont été mis à jour.`);
    return { success: true, updatedCount };
  } catch (error) {
    console.error('Erreur lors de la mise à jour des références de plans:', error);
    return { success: false, updatedCount: 0 };
  }
};
