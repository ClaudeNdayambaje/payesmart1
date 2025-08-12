import { createSamplePlans } from '../data/sampleSubscriptionPlans';
import { syncSubscriptionPlansWithUI } from './syncSubscriptionPlansWithUI';

/**
 * Initialise les données de l'application
 * Crée des données d'exemple si nécessaire
 */
export const initializeApplicationData = async (): Promise<void> => {
  try {
    console.log('Initialisation des données de l\'application...');
    
    // Création des plans d'abonnement d'exemple
    await createSamplePlans();
    
    // Synchronisation des plans d'abonnement avec l'interface utilisateur
    await syncSubscriptionPlansWithUI();
    
    console.log('Initialisation des données terminée avec succès.');
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des données:', error);
  }
};

export default initializeApplicationData;
