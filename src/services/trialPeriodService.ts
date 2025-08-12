import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getCurrentBusinessId } from './businessService';

// Collection Firestore pour les configurations de périodes d'essai
const TRIAL_CONFIG_COLLECTION = 'trial_configs'; // Uniformisation avec trialConfigService.ts

// Valeur par défaut uniforme pour la durée d'essai (en jours)
export const DEFAULT_TRIAL_DURATION_DAYS = 30; // Modifié de 14 à 30 jours pour assurer que la période de 30 jours est utilisée par défaut

// Interface pour une période d'essai
export interface TrialPeriod {
  id: string;
  name: string;
  days: number;
  minutes: number;
  isActive: boolean;
  createdAt: Date;
  lastModified?: Date;
  description?: string;
}

// Interface pour la configuration des périodes d'essai
export interface TrialPeriodsConfig {
  enableTrials: boolean;
  activeTrialId: string;
  trialPeriods: TrialPeriod[];
}

/**
 * Récupère la configuration des périodes d'essai depuis Firestore
 * @returns Configuration des périodes d'essai
 */
export const getTrialPeriodsConfigFromFirestore = async (): Promise<TrialPeriodsConfig | null> => {
  try {
    // Utiliser d'abord l'ID de l'entreprise actuelle
    let businessId;
    try {
      businessId = await getCurrentBusinessId();
    } catch (error) {
      console.log('[trialPeriodService] Impossible de récupérer l\'ID de l\'entreprise actuelle, utilisation de l\'ID admin');
      businessId = 'admin';
    }
    
    // Essayer d'abord avec l'ID de l'entreprise
    let configRef = doc(db, TRIAL_CONFIG_COLLECTION, businessId);
    let configSnapshot = await getDoc(configRef);
    
    // Si aucune configuration n'existe pour cette entreprise, utiliser la configuration globale (admin)
    if (!configSnapshot.exists() && businessId !== 'admin') {
      console.log('[trialPeriodService] Aucune configuration trouvée pour cette entreprise, utilisation de la configuration globale');
      configRef = doc(db, TRIAL_CONFIG_COLLECTION, 'admin');
      configSnapshot = await getDoc(configRef);
    }
    
    if (configSnapshot.exists()) {
      const rawData = configSnapshot.data();
      
      // Convertir les Timestamps Firestore en objets Date JavaScript
      const trialPeriods = Array.isArray(rawData.trialPeriods) ? rawData.trialPeriods.map(period => ({
        ...period,
        // Convertir les timestamps en dates JavaScript si nécessaire
        createdAt: period.createdAt?.toDate ? period.createdAt.toDate() : new Date(),
        lastModified: period.lastModified?.toDate ? period.lastModified.toDate() : new Date()
      })) : [];
      
      const configData: TrialPeriodsConfig = {
        enableTrials: Boolean(rawData.enableTrials),
        activeTrialId: rawData.activeTrialId || '1',
        trialPeriods
      };
      
      console.log('[trialPeriodService] Configuration récupérée depuis Firestore:', configData);
      return configData;
    }
    
    // Si aucune configuration n'existe, retourner null
    // Nous ne créons plus de configuration par défaut
    console.log('[trialPeriodService] Aucune configuration trouvée, aucune période d\'essai ne sera appliquée');
    return null;
  } catch (error) {
    console.error('[trialPeriodService] Erreur lors de la récupération de la configuration des périodes d\'essai:', error);
    return null;
  }
};

/**
 * Récupère la période d'essai active
 * @returns Période d'essai active ou null si aucune n'est trouvée
 */
export const getActiveTrialPeriod = async (): Promise<TrialPeriod | null> => {
  try {
    console.log('[trialPeriodService] Récupération de la période d\'essai active...');
    const config = await getTrialPeriodsConfigFromFirestore();
    
    if (!config || !config.enableTrials) {
      console.log('[trialPeriodService] Les essais ne sont pas activés ou aucune configuration trouvée');
      return null;
    }
    
    // D'abord, essayer de trouver une période marquée comme isActive: true (priorité 1)
    const activeByFlag = config.trialPeriods.find(period => period.isActive === true);
    if (activeByFlag) {
      console.log(`[trialPeriodService] Période d'essai active trouvée par flag isActive: ${activeByFlag.name} (${activeByFlag.days} jours et ${activeByFlag.minutes} minutes)`);
      return activeByFlag;
    }
    
    // Ensuite, essayer de trouver une période par activeTrialId (priorité 2)
    const activePeriod = config.trialPeriods.find(period => period.id === config.activeTrialId);
    if (activePeriod) {
      console.log(`[trialPeriodService] Période d'essai active trouvée via activeTrialId: ${activePeriod.name} (${activePeriod.days} jours et ${activePeriod.minutes} minutes)`);
      return activePeriod;
    }
    
    // Si aucune période active n'est trouvée, prendre la première période disponible (priorité 3)
    if (config.trialPeriods.length > 0) {
      const firstPeriod = config.trialPeriods[0];
      console.log(`[trialPeriodService] Aucune période active spécifique trouvée, utilisation de la première période disponible: ${firstPeriod.name}`);
      return firstPeriod;
    }
    
    console.log('[trialPeriodService] Aucune période d\'essai active trouvée');
    return null;
  } catch (error) {
    console.error('[trialPeriodService] Erreur lors de la récupération de la période d\'essai active:', error);
    return null;
  }
};

/**
 * Récupère les paramètres de durée d'essai (jours et minutes)
 * Utilise la période active si disponible, sinon utilise les valeurs par défaut
 * @returns Objet contenant les jours et minutes de la période d'essai
 */
export const getTrialDurationParameters = async (): Promise<{ days: number, minutes: number }> => {
  try {
    const activePeriod = await getActiveTrialPeriod();
    
    if (activePeriod) {
      console.log(`[trialPeriodService] Utilisation de la période active: ${activePeriod.name} (${activePeriod.days} jours et ${activePeriod.minutes} minutes)`);
      return {
        days: activePeriod.days,
        minutes: activePeriod.minutes
      };
    }
    
    // Valeurs par défaut si aucune période active n'est trouvée
    console.log(`[trialPeriodService] Utilisation des valeurs par défaut: ${DEFAULT_TRIAL_DURATION_DAYS} jours et 0 minutes`);
    return {
      days: DEFAULT_TRIAL_DURATION_DAYS,
      minutes: 0
    };
  } catch (error) {
    console.error('[trialPeriodService] Erreur lors de la récupération des paramètres de durée d\'essai:', error);
    return {
      days: DEFAULT_TRIAL_DURATION_DAYS,
      minutes: 0
    };
  }
};

/**
 * Met à jour les périodes d'essai des clients existants en fonction de la période active
 * @returns Nombre de clients mis à jour
 */
export const updateExistingClientsTrialPeriods = async (): Promise<number> => {
  try {
    const db = (await import('../firebase')).db;
    const { collection, query, getDocs, doc, updateDoc, Timestamp } = await import('firebase/firestore');
    const SAAS_CLIENTS_COLLECTION = 'saas_clients';
    
    // Récupérer la période d'essai active
    const activePeriod = await getActiveTrialPeriod();
    
    if (!activePeriod) {
      console.error('[trialPeriodService] Aucune période d\'essai active trouvée');
      return 0;
    }
    
    console.log(`[trialPeriodService] Mise à jour des clients existants avec la période: ${activePeriod.name} (${activePeriod.days} jours et ${activePeriod.minutes} minutes)`);
    
    // Récupérer tous les clients en période d'essai
    const clientsQuery = query(collection(db, SAAS_CLIENTS_COLLECTION));
    const clientsSnapshot = await getDocs(clientsQuery);
    
    if (clientsSnapshot.empty) {
      console.log('[trialPeriodService] Aucun client trouvé');
      return 0;
    }
    
    let updatedCount = 0;
    
    // Mettre à jour chaque client
    for (const clientDoc of clientsSnapshot.docs) {
      const clientData = clientDoc.data();
      
      // Vérifier si le client est en période d'essai
      if (clientData.isInTrial) {
        const now = Date.now();
        const trialStartDate = clientData.trialStartDate || now;
        const daysInMs = activePeriod.days * 24 * 60 * 60 * 1000;
        const minutesInMs = activePeriod.minutes * 60 * 1000;
        const trialEndDate = trialStartDate + daysInMs + minutesInMs;
        
        // Mettre à jour le client
        const clientRef = doc(db, SAAS_CLIENTS_COLLECTION, clientDoc.id);
        await updateDoc(clientRef, {
          trialEndDate: trialEndDate,
          trialPeriodId: activePeriod.id,
          trialPeriodName: activePeriod.name,
          lastModified: Timestamp.fromDate(new Date())
        });
        
        updatedCount++;
        console.log(`[trialPeriodService] Client ${clientData.businessName || clientDoc.id} mis à jour avec la période d'essai ${activePeriod.name}`);
      }
    }
    
    console.log(`[trialPeriodService] ${updatedCount} clients mis à jour avec la période d'essai ${activePeriod.name}`);
    return updatedCount;
  } catch (error) {
    console.error('[trialPeriodService] Erreur lors de la mise à jour des périodes d\'essai des clients existants:', error);
    return 0;
  }
};
