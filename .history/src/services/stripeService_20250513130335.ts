import { loadStripe } from '@stripe/stripe-js';
import { SubscriptionPlan } from '../types/saas';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, getDoc, setDoc } from 'firebase/firestore';

// Remplace ceci par ta clé publique Stripe (commence par pk_test_ en environnement de test)
const stripePromise = loadStripe('pk_test_VOTRE_CLE_PUBLIQUE');

// Collections Firestore
const CUSTOMERS_COLLECTION = 'stripe_customers';
const SUBSCRIPTIONS_COLLECTION = 'subscriptions';
const STRIPE_PRODUCTS_COLLECTION = 'stripe_products';
const STRIPE_PRICES_COLLECTION = 'stripe_prices';

/**
 * Crée un client Stripe pour un utilisateur
 */
export const createStripeCustomer = async (userId: string, email: string, name?: string) => {
  try {
    // Cette fonction devrait être appelée par une Cloud Function
    // Pour l'instant, on simule l'enregistrement local
    const customerData = {
      userId,
      email,
      name,
      stripeCustomerId: `cus_${Math.random().toString(36).substring(2, 15)}`, // Simulation
      createdAt: Date.now()
    };
    
    await setDoc(doc(db, CUSTOMERS_COLLECTION, userId), customerData);
    return customerData;
  } catch (error) {
    console.error('Erreur lors de la création du client Stripe:', error);
    throw error;
  }
};

/**
 * Obtient ou crée un client Stripe pour un utilisateur
 */
export const getOrCreateStripeCustomer = async (userId: string, email: string, name?: string) => {
  try {
    const customerDoc = await getDoc(doc(db, CUSTOMERS_COLLECTION, userId));
    
    if (customerDoc.exists()) {
      return customerDoc.data();
    } else {
      return createStripeCustomer(userId, email, name);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération/création du client Stripe:', error);
    throw error;
  }
};

/**
 * Crée une session de paiement pour un abonnement
 */
export const createSubscriptionCheckoutSession = async (
  userId: string, 
  planId: string,
  successUrl: string,
  cancelUrl: string
) => {
  try {
    // Cette fonction devrait être appelée par une Cloud Function
    // Dans une vraie implémentation, nous appellerions Stripe directement
    
    // Pour l'instant, nous allons simuler la création d'une session
    const checkoutSessionData = {
      userId,
      planId,
      mode: 'subscription',
      successUrl,
      cancelUrl,
      sessionId: `cs_${Math.random().toString(36).substring(2, 15)}`, // Simulation
      url: `https://checkout.stripe.com/pay/cs_test_${Math.random().toString(36).substring(2, 15)}`, // Simulation
      createdAt: Date.now()
    };
    
    const sessionRef = await addDoc(collection(db, 'stripe_checkout_sessions'), checkoutSessionData);
    
    return { 
      sessionId: checkoutSessionData.sessionId,
      url: checkoutSessionData.url,
      id: sessionRef.id
    };
  } catch (error) {
    console.error('Erreur lors de la création de la session de paiement:', error);
    throw error;
  }
};

/**
 * Obtient le lien de réabonnement pour un abonnement désactivé
 */
export const getPortalSession = async (userId: string, returnUrl: string) => {
  try {
    // Cette fonction devrait être appelée par une Cloud Function
    // Dans une vraie implémentation, nous appellerions Stripe directement
    
    // Pour l'instant, nous allons simuler la création d'une session de portail
    return {
      url: `https://billing.stripe.com/p/session/${Math.random().toString(36).substring(2, 15)}` // Simulation
    };
  } catch (error) {
    console.error('Erreur lors de la création de la session de portail:', error);
    throw error;
  }
};

/**
 * Synchronise les plans d'abonnement avec Stripe
 */
export const syncSubscriptionPlansWithStripe = async (plans: SubscriptionPlan[]) => {
  try {
    // Cette fonction devrait être appelée par une Cloud Function ou un script d'administration
    // Pour l'instant, nous allons simplement simuler l'enregistrement local
    
    for (const plan of plans) {
      // Créer un produit Stripe
      const productData = {
        planId: plan.id,
        name: plan.name,
        description: plan.description,
        active: plan.active,
        stripeProductId: `prod_${Math.random().toString(36).substring(2, 15)}`, // Simulation
        createdAt: Date.now()
      };
      
      await setDoc(doc(db, STRIPE_PRODUCTS_COLLECTION, plan.id), productData);
      
      // Créer un prix Stripe
      const priceData = {
        productId: plan.id,
        currency: plan.currency,
        unitAmount: plan.price * 100, // Stripe utilise les centimes
        billingCycle: plan.billingCycle,
        stripePriceId: `price_${Math.random().toString(36).substring(2, 15)}`, // Simulation
        createdAt: Date.now()
      };
      
      await setDoc(doc(db, STRIPE_PRICES_COLLECTION, plan.id), priceData);
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la synchronisation des plans avec Stripe:', error);
    throw error;
  }
};

export default stripePromise;
