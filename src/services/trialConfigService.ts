import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { getActiveTrialPeriod, DEFAULT_TRIAL_DURATION_DAYS } from './trialPeriodService';

const TRIAL_CONFIG_COLLECTION = 'trial_configs';

export interface TrialConfig {
  id?: string;
  businessId: string;
  trialDurationDays: number;
  trialDurationMinutes: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * Récupère la configuration d'essai pour un business donné
 */
export const getTrialConfig = async (businessId?: string): Promise<TrialConfig | null> => {
  try {
    console.log('[trialConfigService] Récupération de la configuration d\'essai...');
    
    // Vérifier si un businessId est fourni
    if (!businessId) {
      // Essayer de récupérer du localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedBusinessId = localStorage.getItem('businessId');
        if (storedBusinessId) {
          businessId = storedBusinessId;
        } else {
          console.log('[trialConfigService] Aucun identifiant d\'entreprise disponible pour récupérer la configuration d\'essai');
          return null;
        }
      } else {
        console.log('[trialConfigService] LocalStorage non disponible pour récupérer l\'identifiant d\'entreprise');
        return null;
      }
    }
    
    // D'abord, essayer de récupérer la période d'essai active depuis le service centralisé
    const activePeriod = await getActiveTrialPeriod();
    
    if (activePeriod) {
      console.log(`[trialConfigService] Utilisation de la période d'essai présélectionnée: ${activePeriod.name} (${activePeriod.days} jours et ${activePeriod.minutes} minutes)`);
      
      // Créer une configuration basée sur la période active
      return {
        id: businessId,
        businessId,
        trialDurationDays: activePeriod.days,
        trialDurationMinutes: activePeriod.minutes,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
    }
    
    // Méthode standard de récupération si aucune période active n'est trouvée
    const configRef = doc(db, TRIAL_CONFIG_COLLECTION, businessId);
    const configDoc = await getDoc(configRef);
    
    if (configDoc.exists()) {
      console.log('[trialConfigService] Configuration existante trouvée dans Firestore');
      return { id: configDoc.id, ...configDoc.data() } as TrialConfig;
    } else {
      console.log('[trialConfigService] Aucune configuration trouvée, création d\'une configuration par défaut');
      // Configuration par défaut si aucune n'existe
      const defaultConfig: TrialConfig = {
        businessId,
        trialDurationDays: DEFAULT_TRIAL_DURATION_DAYS,
        trialDurationMinutes: 0,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      
      // Créer la configuration par défaut
      await setDoc(configRef, defaultConfig);
      return { id: businessId, ...defaultConfig };
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de la configuration d\'essai:', error);
    return null;
  }
};

/**
 * Met à jour la configuration d'essai
 */
export const updateTrialConfig = async (config: TrialConfig): Promise<boolean> => {
  try {
    if (!config.businessId) {
      console.error('Impossible de mettre à jour la configuration d\'essai: identifiant d\'entreprise manquant');
      return false;
    }
    
    const { id, ...configData } = config;
    const configRef = doc(db, TRIAL_CONFIG_COLLECTION, id || config.businessId);
    
    await updateDoc(configRef, {
      ...configData,
      updatedAt: Date.now()
    });
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la configuration d\'essai:', error);
    return false;
  }
};

/**
 * Calcule la date de fin d'essai en fonction de la configuration
 */
export const calculateTrialEndDate = async (businessId?: string): Promise<number> => {
  try {
    // Vérifier si un businessId est fourni
    if (!businessId) {
      // Essayer de récupérer du localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedBusinessId = localStorage.getItem('businessId');
        if (storedBusinessId) {
          businessId = storedBusinessId;
        } else {
          console.log('Aucun identifiant d\'entreprise disponible pour calculer la date de fin d\'essai');
          // Utiliser la valeur par défaut de 14 jours
          return Date.now() + (14 * 24 * 60 * 60 * 1000);
        }
      } else {
        console.log('LocalStorage non disponible pour récupérer l\'identifiant d\'entreprise');
        // Utiliser la valeur par défaut de 14 jours
        return Date.now() + (14 * 24 * 60 * 60 * 1000);
      }
    }
    
    const config = await getTrialConfig(businessId);
    
    if (!config) {
      // Utiliser la valeur par défaut de 14 jours si aucune configuration n'est trouvée
      return Date.now() + (14 * 24 * 60 * 60 * 1000);
    }
    
    const { trialDurationDays, trialDurationMinutes } = config;
    const daysInMs = trialDurationDays * 24 * 60 * 60 * 1000;
    const minutesInMs = trialDurationMinutes * 60 * 1000;
    
    return Date.now() + daysInMs + minutesInMs;
  } catch (error) {
    console.error('Erreur lors du calcul de la date de fin d\'essai:', error);
    // Utiliser la valeur par défaut de 14 jours en cas d'erreur
    return Date.now() + (14 * 24 * 60 * 60 * 1000);
  }
};

/**
 * Vérifie si un business est toujours en période d'essai
 */
export const isBusinessInTrial = async (businessId?: string, trialEndDate?: number): Promise<boolean> => {
  try {
    // Vérifier si un businessId est fourni
    if (!businessId) {
      // Essayer de récupérer du localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedBusinessId = localStorage.getItem('businessId');
        if (storedBusinessId) {
          businessId = storedBusinessId;
        } else {
          console.log('Aucun identifiant d\'entreprise disponible pour vérifier la période d\'essai');
          return false;
        }
      } else {
        console.log('LocalStorage non disponible pour récupérer l\'identifiant d\'entreprise');
        return false;
      }
    }
    
    // Si une date de fin d'essai est fournie, l'utiliser
    if (trialEndDate) {
      return Date.now() < trialEndDate;
    }
    
    // Sinon, récupérer la configuration d'essai et vérifier
    const config = await getTrialConfig(businessId);
    if (!config || !config.isActive) {
      return false;
    }
    
    // Récupérer la date de création du business depuis Firestore
    const businessRef = doc(db, 'businesses', businessId);
    const businessDoc = await getDoc(businessRef);
    
    if (!businessDoc.exists()) {
      return false;
    }
    
    const businessData = businessDoc.data();
    const creationDate = businessData.createdAt instanceof Timestamp 
      ? businessData.createdAt.toMillis() 
      : businessData.createdAt || Date.now();
    
    // Calculer la date de fin d'essai
    const { trialDurationDays, trialDurationMinutes } = config;
    const daysInMs = trialDurationDays * 24 * 60 * 60 * 1000;
    const minutesInMs = trialDurationMinutes * 60 * 1000;
    const trialEnd = creationDate + daysInMs + minutesInMs;
    
    return Date.now() < trialEnd;
  } catch (error) {
    console.error('Erreur lors de la vérification de la période d\'essai:', error);
    return false;
  }
};

/**
 * Calcule le temps restant pour la période d'essai
 * @returns Un objet contenant les jours, heures et minutes restants
 */
export const getRemainingTrialTime = async (businessId?: string, trialEndDate?: number): Promise<{ days: number, hours: number, minutes: number } | null> => {
  try {
    // Vérifier si un businessId est fourni
    if (!businessId) {
      // Essayer de récupérer du localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedBusinessId = localStorage.getItem('businessId');
        if (storedBusinessId) {
          businessId = storedBusinessId;
        } else {
          console.log('Aucun identifiant d\'entreprise disponible pour calculer le temps restant');
          return null;
        }
      } else {
        console.log('LocalStorage non disponible pour récupérer l\'identifiant d\'entreprise');
        return null;
      }
    }
    
    let endDate: number;
    
    // Si une date de fin d'essai est fournie, l'utiliser
    if (trialEndDate) {
      endDate = trialEndDate;
    } else {
      // Sinon, récupérer la configuration d'essai et calculer
      const config = await getTrialConfig(businessId);
      if (!config || !config.isActive) {
        return null;
      }
      
      // Récupérer la date de création du business depuis Firestore
      const businessRef = doc(db, 'businesses', businessId);
      const businessDoc = await getDoc(businessRef);
      
      if (!businessDoc.exists()) {
        return null;
      }
      
      const businessData = businessDoc.data();
      const creationDate = businessData.createdAt instanceof Timestamp 
        ? businessData.createdAt.toMillis() 
        : businessData.createdAt || Date.now();
      
      // Calculer la date de fin d'essai
      const { trialDurationDays, trialDurationMinutes } = config;
      const daysInMs = trialDurationDays * 24 * 60 * 60 * 1000;
      const minutesInMs = trialDurationMinutes * 60 * 1000;
      endDate = creationDate + daysInMs + minutesInMs;
    }
    
    // Calculer le temps restant
    const remainingMs = endDate - Date.now();
    
    if (remainingMs <= 0) {
      return { days: 0, hours: 0, minutes: 0 };
    }
    
    const days = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
    const hours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
    
    return { days, hours, minutes };
  } catch (error) {
    console.error('Erreur lors du calcul du temps restant pour la période d\'essai:', error);
    return null;
  }
};
