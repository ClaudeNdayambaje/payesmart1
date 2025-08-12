import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Business } from '../types';
import { getCurrentBusinessId as getBusinessIdUtil } from '../utils/authUtils';

const BUSINESSES_COLLECTION = 'businesses';

/**
 * Récupère le business_id de l'utilisateur connecté
 * Cette fonction a été améliorée pour éviter les problèmes de cache entre sessions
 */
export const getCurrentBusinessId = async (): Promise<string> => {
  try {
    // Détecter si nous sommes dans une nouvelle session
    // et nettoyer les données potentiellement obsolètes
    if (typeof window !== 'undefined' && window.localStorage) {
      const lastSessionTimestamp = localStorage.getItem('lastSessionTimestamp');
      const currentTime = Date.now().toString();
      
      // Si c'est une nouvelle session ou si la session a plus de 30 minutes
      if (!lastSessionTimestamp || (parseInt(currentTime) - parseInt(lastSessionTimestamp)) > 30 * 60 * 1000) {
        console.log('Nouvelle session détectée ou session expirée, nettoyage des données temporaires');
        // Ne pas supprimer businessId ici, on va le vérifier d'abord
      }
      
      // Mettre à jour le timestamp de la session
      localStorage.setItem('lastSessionTimestamp', currentTime);
    }
    
    // Priorité 1: Récupérer le businessId depuis Firebase Auth (source la plus fiable)
    try {
      const user = await getBusinessIdUtil();
      if (user) {
        console.log('BusinessId récupéré de Firebase Auth (source fiable):', user);
        // Mettre à jour le localStorage avec cette valeur fiable
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('businessId', user);
          // Marquer cette valeur comme vérifiée
          localStorage.setItem('businessIdVerified', 'true');
        }
        return user;
      }
    } catch (e) {
      console.warn('Erreur lors de la récupération du businessId depuis Firebase Auth:', e);
    }
    
    // Priorité 2: Utiliser le businessId du localStorage uniquement s'il a été vérifié
    if (typeof window !== 'undefined' && window.localStorage) {
      const storedBusinessId = localStorage.getItem('businessId');
      const isVerified = localStorage.getItem('businessIdVerified') === 'true';
      
      if (storedBusinessId && isVerified) {
        console.log('BusinessId vérifié récupéré du localStorage:', storedBusinessId);
        return storedBusinessId;
      } else if (storedBusinessId) {
        console.warn('BusinessId non vérifié trouvé dans localStorage, tentative de validation...');
      }
    }
    
    // Forcer un rafraîchissement de la page si nous ne pouvons pas obtenir l'ID de l'entreprise
    // mais seulement si nous sommes dans un navigateur et pas en mode développement
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'development') {
      console.error('Impossible de déterminer l\'ID de l\'entreprise, tentative de récupération après rafraîchissement');
      
      // Vérifier si nous avons déjà essayé de rafraîchir la page
      const hasTriedRefresh = sessionStorage.getItem('triedBusinessIdRefresh') === 'true';
      
      if (!hasTriedRefresh) {
        // Marquer que nous avons essayé de rafraîchir
        sessionStorage.setItem('triedBusinessIdRefresh', 'true');
        
        // Nettoyer toutes les données potentiellement obsolètes
        localStorage.removeItem('lastStoreName');
        localStorage.removeItem('cachedSettings');
        localStorage.removeItem('currentStoreName');
        localStorage.removeItem('businessId');
        localStorage.removeItem('businessIdVerified');
        
        // Forcer un rafraîchissement complet de la page avec paramètre
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('refresh', Date.now().toString());
        window.location.href = currentUrl.toString();
      }
    }
    
    // Fallback: en mode développement, utiliser 'business1'
    if (process.env.NODE_ENV === 'development') {
      // console.log('Mode développement: utilisation de l\'ID par défaut: business1');
      return 'business1';
    }
    
    console.error('Aucun businessId trouvé - impossible de déterminer l\'entreprise');
    throw new Error('Aucun businessId disponible');
  } catch (error) {
    console.error('Erreur lors de la récupération du business ID:', error);
    
    // Fallback de sécurité en mode développement
    if (process.env.NODE_ENV === 'development') {
      return 'business1';
    }
    
    throw error;
  }
};

/**
 * Récupère les informations de l'entreprise actuelle
 */
export const getCurrentBusiness = async (): Promise<Business | null> => {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      console.error('Aucun utilisateur connecté');
      return null;
    }
    
    const businessRef = doc(db, BUSINESSES_COLLECTION, businessId);
    const businessSnap = await getDoc(businessRef);
    
    if (!businessSnap.exists()) {
      return null;
    }
    
    const data = businessSnap.data();
    return {
      id: businessSnap.id,
      businessName: data.businessName,
      ownerFirstName: data.ownerFirstName,
      ownerLastName: data.ownerLastName,
      email: data.email,
      phone: data.phone || '',
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      plan: data.plan,
      active: data.active,
      logo: data.logo || null,
      address: data.address || null,
      settings: data.settings || {}
    } as Business;
  } catch (error) {
    console.error('Erreur lors de la récupération des informations de l\'entreprise:', error);
    return null;
  }
};

/**
 * Met à jour les informations de l'entreprise
 */
export const updateBusiness = async (businessData: Partial<Business>): Promise<boolean> => {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      console.error('Aucun utilisateur connecté');
      return false;
    }
    
    const businessRef = doc(db, BUSINESSES_COLLECTION, businessId);
    await updateDoc(businessRef, {
      ...businessData,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la mise à jour des informations de l\'entreprise:', error);
    return false;
  }
};

/**
 * Crée une nouvelle entreprise
 */
export const createBusiness = async (businessData: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      console.error('Aucun utilisateur connecté');
      return null;
    }
    
    const businessRef = doc(db, BUSINESSES_COLLECTION, businessId);
    await setDoc(businessRef, {
      ...businessData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return businessId;
  } catch (error) {
    console.error('Erreur lors de la création de l\'entreprise:', error);
    return null;
  }
};

/**
 * Vérifie si une entreprise existe
 */
export const businessExists = async (businessId: string): Promise<boolean> => {
  try {
    const businessRef = doc(db, BUSINESSES_COLLECTION, businessId);
    const businessSnap = await getDoc(businessRef);
    return businessSnap.exists();
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'existence de l\'entreprise:', error);
    return false;
  }
};

/**
 * Récupère une entreprise par son ID
 */
export const getBusinessById = async (businessId: string): Promise<Business | null> => {
  try {
    const businessRef = doc(db, BUSINESSES_COLLECTION, businessId);
    const businessSnap = await getDoc(businessRef);
    
    if (!businessSnap.exists()) {
      return null;
    }
    
    const data = businessSnap.data();
    return {
      id: businessSnap.id,
      businessName: data.businessName,
      ownerFirstName: data.ownerFirstName,
      ownerLastName: data.ownerLastName,
      email: data.email,
      phone: data.phone || '',
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      plan: data.plan,
      active: data.active,
      logo: data.logo || null,
      address: data.address || null,
      settings: data.settings || {}
    } as Business;
  } catch (error) {
    console.error('Erreur lors de la récupération des informations de l\'entreprise:', error);
    return null;
  }
};
