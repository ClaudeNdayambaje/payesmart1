import { db } from '../firebase';
import { doc, setDoc, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { getCurrentBusinessId } from './businessService';
import {
  getTrialPeriodsConfigFromFirestore,
  getActiveTrialPeriod as getActiveTrialPeriodFromCentralized,
  getTrialDurationParameters as getTrialDurationParametersFromCentralized,
  TrialPeriod as CentralizedTrialPeriod,
  TrialPeriodsConfig as CentralizedTrialPeriodsConfig
} from './trialPeriodService';

// Réexporter les interfaces pour la compatibilité avec le code existant
export type TrialPeriod = CentralizedTrialPeriod;
export type TrialPeriodsConfig = CentralizedTrialPeriodsConfig;

// Collection Firestore pour les configurations de périodes d'essai
const TRIAL_CONFIG_COLLECTION = 'trial_configs'; // Uniformisation avec trialConfigService.ts
const SAAS_CLIENTS_COLLECTION = 'saas_clients';

/**
 * Sauvegarde la configuration des périodes d'essai
 * @param config Configuration des périodes d'essai
 */
export const saveTrialPeriodsConfig = async (config: TrialPeriodsConfig): Promise<void> => {
  try {
    const businessId = await getCurrentBusinessId();
    const configRef = doc(db, TRIAL_CONFIG_COLLECTION, businessId);
    
    // Convertir les dates en format Firestore et s'assurer qu'il n'y a pas de valeurs undefined
    const sanitizedTrialPeriods = config.trialPeriods.map(period => {
      // Convertir les dates en objets Firestore timestamp
      return {
        id: period.id || '',
        name: period.name || '',
        days: typeof period.days === 'number' ? period.days : 0,
        minutes: typeof period.minutes === 'number' ? period.minutes : 0,
        isActive: Boolean(period.isActive),
        // Utiliser Timestamp.fromDate pour convertir les dates en format Firestore
        createdAt: Timestamp.fromDate(period.createdAt instanceof Date ? period.createdAt : new Date()),
        lastModified: Timestamp.fromDate(period.lastModified instanceof Date ? period.lastModified : new Date()),
        description: period.description || ''
      };
    });
    
    // Créer un objet nettoyé pour Firestore
    const configWithTimestamp = {
      enableTrials: Boolean(config.enableTrials),
      activeTrialId: config.activeTrialId || '',
      trialPeriods: sanitizedTrialPeriods,
      lastModified: Timestamp.fromDate(new Date()),
      businessId
    };
    
    console.log('[trialService] Sauvegarde de la configuration dans Firestore:', JSON.stringify(configWithTimestamp));
    await setDoc(configRef, configWithTimestamp);
    console.log('[trialService] Configuration des périodes d\'essai sauvegardée avec succès');
  } catch (error) {
    console.error('[trialService] Erreur lors de la sauvegarde de la configuration des périodes d\'essai:', error);
    throw error;
  }
};

/**
 * Récupère la configuration des périodes d'essai
 * @returns Configuration des périodes d'essai
 */
export const getTrialPeriodsConfig = async (): Promise<TrialPeriodsConfig | null> => {
  console.log('[trialService] Redirection vers le service centralisé getTrialPeriodsConfigFromFirestore');
  return getTrialPeriodsConfigFromFirestore();
};

/**
 * Récupère la période d'essai active
 * @returns Période d'essai active
 */
export const getActiveTrialPeriod = async (): Promise<TrialPeriod | null> => {
  console.log('[trialService] Redirection vers le service centralisé getActiveTrialPeriod');
  return getActiveTrialPeriodFromCentralized();
};

/**
 * Récupère les paramètres de durée d'essai (jours et minutes)
 * @returns Objet contenant les jours et minutes de la période d'essai
 */
export const getTrialDurationParameters = async (): Promise<{ days: number, minutes: number }> => {
  console.log('[trialService] Redirection vers le service centralisé getTrialDurationParameters');
  return getTrialDurationParametersFromCentralized();
};

/**
 * Applique une période d'essai à un client
 * @param clientId ID du client
 * @param trialPeriodId ID de la période d'essai (optionnel, utilise la période active par défaut)
 */
export const applyTrialPeriodToClient = async (clientId: string, trialPeriodId?: string): Promise<void> => {
  try {
    const config = await getTrialPeriodsConfig();
    
    if (!config || !config.enableTrials) {
      console.error('[trialService] Les périodes d\'essai ne sont pas activées');
      return;
    }
    
    // Trouver la période d'essai à appliquer
    const trialPeriod = trialPeriodId
      ? config.trialPeriods.find(p => p.id === trialPeriodId)
      : config.trialPeriods.find(p => p.id === config.activeTrialId);
    
    if (!trialPeriod) {
      console.error('[trialService] Période d\'essai non trouvée');
      return;
    }
    
    // Calculer la date de fin d'essai
    const now = Date.now();
    const daysInMs = trialPeriod.days * 24 * 60 * 60 * 1000;
    const minutesInMs = trialPeriod.minutes * 60 * 1000;
    const trialEndDate = now + daysInMs + minutesInMs;
    
    // Mettre à jour le client
    const clientsQuery = query(
      collection(db, SAAS_CLIENTS_COLLECTION),
      where('id', '==', clientId)
    );
    
    const clientSnapshot = await getDocs(clientsQuery);
    
    if (clientSnapshot.empty) {
      console.error(`[trialService] Client ${clientId} non trouvé`);
      return;
    }
    
    const clientDoc = clientSnapshot.docs[0];
    const clientRef = doc(db, SAAS_CLIENTS_COLLECTION, clientDoc.id);
    
    await setDoc(clientRef, {
      trialStartDate: now,
      trialEndDate,
      isInTrial: true,
      trialPeriodId: trialPeriod.id,
      trialPeriodName: trialPeriod.name,
      lastModified: now
    }, { merge: true });
    
    console.log(`[trialService] Période d'essai ${trialPeriod.name} appliquée au client ${clientId}`);
  } catch (error) {
    console.error('[trialService] Erreur lors de l\'application de la période d\'essai:', error);
  }
};
