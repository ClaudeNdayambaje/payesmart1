import { initializeDefaultPlans } from './subscriptionPlanService';
import { seedTestClients } from './seedClients';
import { seedSubscriptionsForClients } from './seedSubscriptions';

/**
 * Initialise toutes les données nécessaires pour la démo
 */
export const initializeAllData = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Étape 1: Initialiser les plans d'abonnement
    await initializeDefaultPlans();
    
    // Étape 2: Créer des clients de test
    const clientsResult = await seedTestClients();
    if (!clientsResult.success) {
      return clientsResult;
    }
    
    // Étape 3: Attribuer des abonnements aux clients
    const subscriptionsResult = await seedSubscriptionsForClients();
    
    return {
      success: true,
      message: `Initialisation complète: ${clientsResult.message} ${subscriptionsResult.message}`
    };
  } catch (error) {
    console.error('Erreur lors de l\'initialisation des données:', error);
    return {
      success: false,
      message: `Erreur: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};
