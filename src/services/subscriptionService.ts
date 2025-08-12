// Utilitaire pour mettre à jour les références des plans d'abonnement
import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, orderBy } from 'firebase/firestore';

// Fonction de journalisation détaillée
const log = (message: string, data?: any) => {
  if (data) {
    console.log(`[SubscriptionService] ${message}`, data);
  } else {
    console.log(`[SubscriptionService] ${message}`);
  }
};

import { Subscription, SubscriptionPlan, Client } from '../types/saas';
import { findClientByEmail } from './saasClientService';

// Collections Firestore
const SUBSCRIPTIONS_COLLECTION = 'subscriptions';
const PLANS_COLLECTION = 'subscription_plans';

// Données de démonstration pour les abonnements
const DEMO_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'sub1',
    planId: 'plan1',
    clientId: 'client1',
    status: 'active',
    startDate: new Date('2025-01-01').getTime(),
    endDate: new Date('2026-01-01').getTime(),
    createdAt: new Date('2025-01-01').getTime(),
    price: 29.99,
    currency: 'EUR',
    billingCycle: 'monthly',
    autoRenew: true,
    paymentMethod: 'card',
    notes: 'Abonnement standard',
    lastModified: new Date('2025-01-01').getTime()
  },
  {
    id: 'sub2',
    planId: 'plan2',
    clientId: 'client2',
    status: 'active',
    startDate: new Date('2025-02-15').getTime(),
    endDate: new Date('2026-02-15').getTime(),
    createdAt: new Date('2025-02-15').getTime(),
    price: 299.99,
    currency: 'EUR',
    billingCycle: 'yearly',
    autoRenew: true,
    paymentMethod: 'transfer',
    notes: 'Abonnement premium annuel',
    lastModified: new Date('2025-02-15').getTime()
  },
  {
    id: 'sub3',
    planId: 'plan1',
    clientId: 'client3',
    status: 'cancelled',
    startDate: new Date('2024-11-10').getTime(),
    endDate: new Date('2025-05-10').getTime(),
    createdAt: new Date('2024-11-10').getTime(),
    price: 29.99,
    currency: 'EUR',
    billingCycle: 'monthly',
    autoRenew: false,
    paymentMethod: 'card',
    notes: 'Abonnement annulé par le client',
    cancelDate: new Date('2025-03-15').getTime(),
    lastModified: new Date('2025-03-15').getTime()
  },
  {
    id: 'sub4',
    planId: 'plan3',
    clientId: 'client4',
    status: 'expired',
    startDate: new Date('2024-01-01').getTime(),
    endDate: new Date('2025-01-01').getTime(),
    createdAt: new Date('2024-01-01').getTime(),
    price: 149.99,
    currency: 'EUR',
    billingCycle: 'yearly',
    autoRenew: false,
    paymentMethod: 'transfer',
    notes: 'Abonnement expiré',
    lastModified: new Date('2025-01-02').getTime()
  },
  {
    id: 'sub5',
    planId: 'plan2',
    clientId: 'client5',
    status: 'active',
    startDate: new Date('2025-03-20').getTime(),
    endDate: new Date('2026-03-20').getTime(),
    createdAt: new Date('2025-03-20').getTime(),
    price: 299.99,
    currency: 'EUR',
    billingCycle: 'yearly',
    autoRenew: true,
    paymentMethod: 'card',
    notes: 'Abonnement premium',
    lastModified: new Date('2025-03-20').getTime()
  }
];

// Obtenir tous les abonnements
export const getSubscriptions = async (): Promise<Subscription[]> => {
  try {
    console.log('Début de la récupération des abonnements...');
    
    // Essayer d'abord de récupérer depuis Firebase
    try {
      // Vérifier si la collection existe
      const collectionRef = collection(db, SUBSCRIPTIONS_COLLECTION);
      console.log('Collection des abonnements accédée');
      
      // Si la collection n'existe pas ou est vide, nous essaierons de créer des abonnements
      // basés sur les clients qui ont un statut "Abonné"
      const subscriptionsQuery = query(collectionRef);
      const snapshot = await getDocs(subscriptionsQuery);
      
      if (snapshot.empty) {
        console.log('Aucun abonnement trouvé dans Firestore, génération des abonnements depuis les clients...');
        
        // Récupérer les clients qui sont marqués comme abonnés
        const clientsRef = collection(db, 'clients');
        const clientsQuery = query(clientsRef, where('status', '==', 'Abonné'));
        const clientsSnapshot = await getDocs(clientsQuery);
        
        if (!clientsSnapshot.empty) {
          console.log(`${clientsSnapshot.size} clients abonnés trouvés, création d'abonnements...`);
          
          // Créer des abonnements pour chaque client abonné
          const plansRef = collection(db, PLANS_COLLECTION);
          const plansSnapshot = await getDocs(plansRef);
          const plans = plansSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubscriptionPlan));
          
          // Définir un plan par défaut au cas où aucun plan n'est trouvé
          const defaultPlan: SubscriptionPlan = plans.length > 0 ? plans[0] : {
            id: 'default-plan',
            name: 'Plan Standard',
            description: 'Plan standard généré automatiquement',
            price: 29.99,
            currency: 'EUR',
            billingCycle: 'monthly',
            features: [],
            active: true,
            createdAt: Date.now()
          };
          
          // Créer un tableau pour stocker les abonnements générés
          const generatedSubscriptions: Subscription[] = [];
          
          // Créer un abonnement pour chaque client
          for (const clientDoc of clientsSnapshot.docs) {
            const clientData = { id: clientDoc.id, ...clientDoc.data() } as any;
            const businessName = clientData.businessName || 'Client sans nom';
            
            // Log pour le débogage
            console.log(`Génération d'abonnement pour client: ${clientData.id} - ${businessName}`);
            
            // Créer un nouvel abonnement
            const newSubscription: Omit<Subscription, 'id'> = {
              clientId: clientData.id,
              planId: defaultPlan.id,
              startDate: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 jours avant aujourd'hui
              endDate: Date.now() + 335 * 24 * 60 * 60 * 1000, // 335 jours après aujourd'hui
              status: 'active',
              autoRenew: true,
              createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
              price: defaultPlan.price,
              currency: 'EUR',
              billingCycle: 'monthly',
              paymentMethod: 'card',
              notes: `Abonnement généré automatiquement pour ${businessName}`
            };
            
            // Ajouter l'abonnement à Firestore
            const docRef = await addDoc(collection(db, SUBSCRIPTIONS_COLLECTION), newSubscription);
            
            // Ajouter l'abonnement avec son ID au tableau des abonnements générés
            generatedSubscriptions.push({
              id: docRef.id,
              ...newSubscription
            });
          }
          
          console.log(`${generatedSubscriptions.length} abonnements générés et ajoutés à Firestore`);
          return generatedSubscriptions;
        }
      }
      
      // Si des abonnements existent déjà, les retourner
      const firebaseSubscriptions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Subscription));
      
      console.log(`Abonnements récupérés depuis Firestore: ${firebaseSubscriptions.length}`);
      return firebaseSubscriptions;
      
    } catch (firebaseError) {
      console.warn('Erreur Firebase, utilisation des données de démonstration:', firebaseError);
    }
    
    // Si aucune donnée n'est trouvée ou en cas d'erreur, utiliser les données de démonstration
    console.log('Utilisation des données de démonstration pour les abonnements');
    return DEMO_SUBSCRIPTIONS;
  } catch (error) {
    console.error('Erreur lors de la récupération des abonnements:', error);
    // En cas d'erreur générale, retourner quand même les données de démonstration
    return DEMO_SUBSCRIPTIONS;
  }
};

// Obtenir les abonnements d'un client
export const getClientSubscriptions = async (clientId: string): Promise<Subscription[]> => {
  try {
    // On supprime le orderBy pour éviter le besoin d'un index composite
    // et on trie les résultats côté client si nécessaire
    const subscriptionsQuery = query(
      collection(db, SUBSCRIPTIONS_COLLECTION),
      where('clientId', '==', clientId)
      // Pas de orderBy pour éviter l'erreur d'index manquant
    );
    
    const snapshot = await getDocs(subscriptionsQuery);
    const results = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Subscription));
    
    // Tri côté client si nécessaire
    return results.sort((a, b) => {
      const dateA = a.createdAt || 0;
      const dateB = b.createdAt || 0;
      return dateB - dateA; // Tri décroissant
    });
  } catch (error) {
    console.error(`Erreur lors de la récupération des abonnements du client ${clientId}:`, error);
    // En cas d'erreur, renvoyer un tableau vide pour ne pas bloquer la suppression
    return [];
  }
};

/**
 * Vérifie si un client a déjà un abonnement actif
 * @param clientId ID du client à vérifier
 * @returns true si le client a déjà un abonnement actif, false sinon
 */
export const hasActiveSubscription = async (clientId: string): Promise<boolean> => {
  try {
    const subscriptionsQuery = query(
      collection(db, SUBSCRIPTIONS_COLLECTION),
      where('clientId', '==', clientId),
      where('status', '==', 'active')
    );
    
    const snapshot = await getDocs(subscriptionsQuery);
    return !snapshot.empty;
  } catch (error) {
    console.error('Erreur lors de la vérification des abonnements actifs:', error);
    return false;
  }
};

/**
 * Vérifie si un utilisateur a déjà un abonnement actif avec son email
 * @param email Adresse email de l'utilisateur à vérifier
 * @returns true si l'utilisateur a déjà un abonnement actif, false sinon
 */
export const hasActiveSubscriptionByEmail = async (email: string): Promise<{hasSubscription: boolean, client: Client | null}> => {
  try {
    // Trouver le client avec cet email
    const client = await findClientByEmail(email);
    
    if (!client) {
      return { hasSubscription: false, client: null };
    }
    
    // Vérifier si ce client a un abonnement actif
    const hasSubscription = await hasActiveSubscription(client.businessId || client.id);
    return { hasSubscription, client };
  } catch (error) {
    console.error('Erreur lors de la vérification des abonnements par email:', error);
    return { hasSubscription: false, client: null };
  }
};

// Ajouter un nouvel abonnement ou remplacer un existant
export const addSubscription = async (subscriptionData: Omit<Subscription, 'id'>): Promise<Subscription> => {
  try {
    const now = Date.now();
    let existingSubscriptionId: string | null = null;
    
    // Rechercher un abonnement existant pour ce client
    const subscriptionsQuery = query(
      collection(db, SUBSCRIPTIONS_COLLECTION),
      where('clientId', '==', subscriptionData.clientId),
      where('status', 'in', ['active', 'pending'])
    );
    
    const existingSubscriptionsSnapshot = await getDocs(subscriptionsQuery);
    
    // Si un abonnement existe déjà pour ce client, le mettre à jour plutôt que d'en créer un nouveau
    if (!existingSubscriptionsSnapshot.empty) {
      // Récupérer l'ID du premier abonnement actif trouvé
      existingSubscriptionId = existingSubscriptionsSnapshot.docs[0].id;
      
      log(`Abonnement existant trouvé pour le client (ID: ${subscriptionData.clientId}), mise à jour au lieu de créer un nouveau.`);
      
      // Mettre l'ancien abonnement en status 'replaced'
      const oldSubscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, existingSubscriptionId);
      await updateDoc(oldSubscriptionRef, {
        status: 'replaced',
        updatedAt: now,
        notes: (existingSubscriptionsSnapshot.docs[0].data().notes || '') + ' | Remplacé le ' + new Date(now).toLocaleDateString()
      });
    }
    
    // Créer le nouvel abonnement
    const docRef = await addDoc(collection(db, SUBSCRIPTIONS_COLLECTION), {
      ...subscriptionData,
      createdAt: now,
      updatedAt: now,
      notes: (subscriptionData.notes || '') + (existingSubscriptionId ? ' | Remplace un abonnement existant' : '')
    });
    
    log(`Nouvel abonnement créé avec succès (ID: ${docRef.id})`);
    
    return {
      id: docRef.id,
      ...subscriptionData,
      createdAt: now,
      updatedAt: now
    } as Subscription;
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'abonnement:', error);
    throw error;
  }
};

// Mettre à jour un abonnement
export const updateSubscription = async (subscriptionId: string, subscriptionData: Partial<Subscription>): Promise<void> => {
  try {
    const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId);
    await updateDoc(subscriptionRef, {
      ...subscriptionData,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de l'abonnement ${subscriptionId}:`, error);
    throw error;
  }
};

// Annuler un abonnement
export const cancelSubscription = async (subscriptionId: string): Promise<void> => {
  try {
    const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId);
    await updateDoc(subscriptionRef, {
      status: 'cancelled',
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error(`Erreur lors de l'annulation de l'abonnement ${subscriptionId}:`, error);
    throw error;
  }
};

// Supprimer définitivement un abonnement
export const deleteSubscription = async (subscriptionId: string): Promise<void> => {
  try {
    const subscriptionRef = doc(db, SUBSCRIPTIONS_COLLECTION, subscriptionId);
    await deleteDoc(subscriptionRef);
    console.log(`Abonnement ${subscriptionId} supprimé avec succès`);
  } catch (error) {
    console.error(`Erreur lors de la suppression de l'abonnement ${subscriptionId}:`, error);
    throw error;
  }
};

// Obtenir tous les plans d'abonnement
export const getSubscriptionPlans = async (): Promise<SubscriptionPlan[]> => {
  try {
    const plansQuery = query(
      collection(db, PLANS_COLLECTION),
      orderBy('price', 'asc')
    );
    
    const snapshot = await getDocs(plansQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as SubscriptionPlan));
  } catch (error) {
    console.error('Erreur lors de la récupération des plans d\'abonnement:', error);
    throw error;
  }
};

// Ajouter un nouveau plan d'abonnement
export const addSubscriptionPlan = async (planData: Omit<SubscriptionPlan, 'id'>): Promise<SubscriptionPlan> => {
  try {
    const now = Date.now();
    const docRef = await addDoc(collection(db, PLANS_COLLECTION), {
      ...planData,
      createdAt: now,
      updatedAt: now
    });
    
    return {
      id: docRef.id,
      ...planData,
      createdAt: now,
      updatedAt: now
    } as SubscriptionPlan;
  } catch (error) {
    console.error('Erreur lors de l\'ajout du plan d\'abonnement:', error);
    throw error;
  }
};

// Mettre à jour un plan d'abonnement
export const updateSubscriptionPlan = async (planId: string, planData: Partial<SubscriptionPlan>): Promise<void> => {
  try {
    const planRef = doc(db, PLANS_COLLECTION, planId);
    await updateDoc(planRef, {
      ...planData,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du plan d'abonnement ${planId}:`, error);
    throw error;
  }
};
