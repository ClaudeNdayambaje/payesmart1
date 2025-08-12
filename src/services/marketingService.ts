import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy, doc, setDoc, getDoc } from 'firebase/firestore';
import { SubscriptionPlan } from '../types/saas';

// Collection Firestore pour les plans d'abonnement
const SUBSCRIPTION_PLANS_COLLECTION = 'subscription_plans';

/**
 * Service pour synchroniser les plans d'abonnement avec le site marketing
 */

// Identifiant du document pour les plans marketing dans Firestore
const MARKETING_PLANS_DOC_ID = 'subscription_plans';

/**
 * Synchronise les plans d'abonnement actifs avec le site marketing
 */
export const syncMarketingPlans = async (): Promise<void> => {
  try {
    console.log('Synchronisation des plans pour le site marketing...');
    
    // 1. Récupérer tous les plans d'abord pour vérifier s'il y a des plans
    const allPlansQuery = query(
      collection(db, SUBSCRIPTION_PLANS_COLLECTION)
    );
    
    const allSnapshot = await getDocs(allPlansQuery);
    
    if (allSnapshot.empty) {
      console.log('Aucun plan à synchroniser, suppression du document marketing');
      // Si tous les plans ont été supprimés, supprimer également le document marketing
      try {
        const marketingRef = doc(db, 'marketing', 'subscription_plans');
        await setDoc(marketingRef, { plans: [] });
        if (typeof window !== 'undefined') {
          localStorage.removeItem('subscription_plans');
        }
      } catch (clearError) {
        console.error('Erreur lors de la suppression du document marketing:', clearError);
      }
      return;
    }
    
    // 2. Récupérer les plans actifs uniquement
    const plansQuery = query(
      collection(db, SUBSCRIPTION_PLANS_COLLECTION),
      where('active', '==', true),
      orderBy('price', 'asc')
    );
    
    const snapshot = await getDocs(plansQuery);
    
    if (snapshot.empty) {
      console.log('Aucun plan actif à synchroniser.');
      // Mettre à jour avec une liste vide
      const marketingRef = doc(db, 'marketing', 'subscription_plans');
      await setDoc(marketingRef, { plans: [] });
      if (typeof window !== 'undefined') {
        localStorage.setItem('subscription_plans', JSON.stringify({ plans: [] }));
      }
      return;
    }
    
    // 2. Convertir les documents Firestore en objets SubscriptionPlan
    const plans = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as SubscriptionPlan[];
    
    // 3. Filtrer pour éliminer les doublons (garder seulement une occurrence de chaque nom de plan)
    const uniquePlans = removeDuplicatePlans(plans);
    
    // 4. Créer l'objet de données pour le site marketing
    const marketingData = {
      plans: uniquePlans
    };
    
    // 5. Écrire les plans dans un document Firestore spécial pour le marketing
    const marketingRef = doc(db, 'marketing', 'subscription_plans');
    await setDoc(marketingRef, marketingData);
    
    // 6. Écrire les données dans localStorage pour les tests
    if (typeof window !== 'undefined') {
      localStorage.setItem('subscription_plans', JSON.stringify(marketingData));
      console.log('Plans marketing sauvegardés dans localStorage');
    }
    
    console.log(`${uniquePlans.length} plans d'abonnement synchronisés avec le site marketing`);
  } catch (error) {
    console.error('Erreur lors de la synchronisation des plans marketing:', error);
    throw error;
  }
};

/**
 * Élimine les plans en double en se basant sur le nom
 */
const removeDuplicatePlans = (plans: SubscriptionPlan[]): SubscriptionPlan[] => {
  const uniqueNames = new Set<string>();
  return plans.filter(plan => {
    // Si le nom est déjà dans l'ensemble, c'est un doublon
    if (uniqueNames.has(plan.name)) {
      return false;
    }
    
    // Sinon, ajouter le nom à l'ensemble et garder ce plan
    uniqueNames.add(plan.name);
    return true;
  });
};

/**
 * Récupère les plans marketing depuis Firestore
 */
export const getMarketingPlans = async (): Promise<SubscriptionPlan[]> => {
  try {
    const marketingRef = doc(db, 'marketing', MARKETING_PLANS_DOC_ID);
    const marketingDoc = await getDoc(marketingRef);
    
    if (marketingDoc.exists()) {
      const data = marketingDoc.data();
      return data.plans || [];
    }
    
    // Si aucun plan marketing n'existe, synchroniser et récupérer à nouveau
    await syncMarketingPlans();
    return getMarketingPlans();
  } catch (error) {
    console.error('Erreur lors de la récupération des plans marketing:', error);
    
    // En cas d'erreur, retourner les plans par défaut
    return getDefaultMarketingPlans();
  }
};

/**
 * Plans marketing par défaut
 */
export const getDefaultMarketingPlans = (): SubscriptionPlan[] => {
  return [
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
  ] as SubscriptionPlan[];
};
