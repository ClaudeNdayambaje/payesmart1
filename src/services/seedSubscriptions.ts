import { addSubscription } from './subscriptionService';
import { getSubscriptionPlans } from './subscriptionPlanService';
import { getAllBusinesses } from './getAllBusinesses';

/**
 * Attribue automatiquement des plans d'abonnement aux clients existants
 * Cette fonction est utilisée pour initialiser des données de test
 */
export const seedSubscriptionsForClients = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Récupérer toutes les entreprises (vrais clients PayeSmart)
    const businesses = await getAllBusinesses();
    
    // Récupérer tous les plans d'abonnement
    const plans = await getSubscriptionPlans();
    
    if (plans.length === 0) {
      return { 
        success: false, 
        message: 'Aucun plan d\'abonnement disponible. Veuillez créer des plans d\'abonnement d\'abord.' 
      };
    }
    
    if (businesses.length === 0) {
      return { 
        success: false, 
        message: 'Aucune entreprise disponible.' 
      };
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    // Pour chaque entreprise, attribuer un plan d'abonnement aléatoire
    for (const business of businesses) {
      try {
        // Sélectionner un plan aléatoire
        const randomPlanIndex = Math.floor(Math.random() * plans.length);
        const selectedPlan = plans[randomPlanIndex];
        
        // Déterminer la durée de l'abonnement en fonction du cycle de facturation
        let durationInDays = 30; // Par défaut 30 jours (mensuel)
        
        switch (selectedPlan.billingCycle) {
          case 'monthly':
            durationInDays = 30;
            break;
          case 'quarterly':
            durationInDays = 90;
            break;
          case 'biannually':
            durationInDays = 180;
            break;
          case 'annually':
            durationInDays = 365;
            break;
        }
        
        const now = Date.now();
        const endDate = now + durationInDays * 24 * 60 * 60 * 1000;
        
        // Créer l'abonnement
        await addSubscription({
          clientId: business.id,
          planId: selectedPlan.id,
          startDate: now,
          endDate: endDate,
          status: 'active',
          autoRenew: Math.random() > 0.3, // 70% de chance d'avoir le renouvellement automatique
          createdAt: now,
          updatedAt: now
        });
        
        successCount++;
      } catch (error) {
        console.error(`Erreur lors de la création de l'abonnement pour l'entreprise ${business.id}:`, error);
        errorCount++;
      }
    }
    
    return { 
      success: true, 
      message: `${successCount} abonnements créés avec succès. ${errorCount} erreurs.` 
    };
  } catch (error) {
    console.error('Erreur lors de l\'attribution des plans d\'abonnement:', error);
    return { 
      success: false, 
      message: `Erreur: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
};

/**
 * Attribue un plan spécifique à un client
 */
export const assignPlanToClient = async (
  clientId: string, 
  planId: string,
  startDate: number = Date.now(),
  autoRenew: boolean = true
): Promise<{ success: boolean; message: string }> => {
  try {
    // Récupérer le plan d'abonnement
    const plans = await getSubscriptionPlans();
    const selectedPlan = plans.find(plan => plan.id === planId);
    
    if (!selectedPlan) {
      return { 
        success: false, 
        message: 'Plan d\'abonnement non trouvé.' 
      };
    }
    
    // Déterminer la durée de l'abonnement en fonction du cycle de facturation
    let durationInDays = 30; // Par défaut 30 jours (mensuel)
    
    switch (selectedPlan.billingCycle) {
      case 'monthly':
        durationInDays = 30;
        break;
      case 'quarterly':
        durationInDays = 90;
        break;
      case 'biannually':
        durationInDays = 180;
        break;
      case 'annually':
        durationInDays = 365;
        break;
    }
    
    const endDate = startDate + durationInDays * 24 * 60 * 60 * 1000;
    
    // Créer l'abonnement
    await addSubscription({
      clientId,
      planId,
      startDate,
      endDate,
      status: 'active',
      autoRenew,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    
    return { 
      success: true, 
      message: `Abonnement créé avec succès pour le client ${clientId}.` 
    };
  } catch (error) {
    console.error(`Erreur lors de la création de l'abonnement pour le client ${clientId}:`, error);
    return { 
      success: false, 
      message: `Erreur: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
};
