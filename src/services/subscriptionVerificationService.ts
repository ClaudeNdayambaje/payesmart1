import { db, auth } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, Timestamp, updateDoc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

// Collections Firestore
const SUBSCRIPTIONS_COLLECTION = 'subscriptions';
const BUSINESSES_COLLECTION = 'businesses';

/**
 * Interface pour le statut d'abonnement
 */
export interface SubscriptionStatus {
  hasActiveSubscription: boolean;
  isInTrial: boolean;
  trialDaysRemaining?: number;
  subscriptionEndDate?: Date;
  subscriptionExpired?: boolean;
  trialExpired?: boolean;
  subscriptionCancelled?: boolean;
  message: string;
  statusCode: 'active_subscription' | 'trial_active' | 'trial_expired' | 'subscription_expired' | 'subscription_cancelled' | 'no_subscription';
}



/**
 * Vérifie si un utilisateur a un abonnement actif ou est en période d'essai
 * @param businessId ID de l'entreprise
 * @returns Statut de l'abonnement
 */
export const checkSubscriptionStatus = async (businessId: string): Promise<SubscriptionStatus> => {
  try {
    // 1. Vérifier si l'utilisateur est en période d'essai
    const clientRef = doc(db, BUSINESSES_COLLECTION, businessId);
    const clientDoc = await getDoc(clientRef);
    
    if (clientDoc.exists()) {
      const clientData = clientDoc.data();
      
      // Vérifier si le client est en période d'essai active
      // Log détaillé des données client pour débogage
      console.log('Détails du client vérifié :', {
        businessId,
        isInTrial: clientData.isInTrial,
        trialEndDate: clientData.trialEndDate,
        businessName: clientData.businessName,
        email: clientData.email
      });
      
      if (clientData.isInTrial) {
        const now = Date.now();
        const trialEndDate = clientData.trialEndDate;
        
        console.log('Vérification période d\'essai :', {
          now,
          trialEndDate,
          diff: trialEndDate ? trialEndDate - now : 'Non défini',
          isValid: trialEndDate && trialEndDate > now
        });
        
        if (trialEndDate && trialEndDate > now) {
          // Période d'essai active
          const daysRemaining = Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24));
          console.log(`Période d'essai VALIDE - Jours restants: ${daysRemaining}`);
          
          return {
            // SIMPLIFICATION : Considérer les utilisateurs en période d'essai comme ayant un abonnement actif
            // Cela permet de réutiliser la même logique et simplifier les vérifications
            hasActiveSubscription: true,
            isInTrial: true,
            trialDaysRemaining: daysRemaining,
            subscriptionExpired: false,
            trialExpired: false,
            message: `Vous êtes en période d'essai. Il vous reste ${daysRemaining} jour(s).`,
            statusCode: 'trial_active'
          };
        } else if (trialEndDate && trialEndDate < now) {
          // Période d'essai expirée - on le garde pour plus tard, on vérifie d'abord les abonnements
          console.log('Période d\'essai expirée détectée, vérification des abonnements en cours...');
        }
      }
    } else {
      console.log('Client non trouvé dans la base de données avec ID:', businessId);
    }
    
    // 2. Vérifier si l'utilisateur a un abonnement actif
    const activeSubscriptionsQuery = query(
      collection(db, SUBSCRIPTIONS_COLLECTION),
      where('clientId', '==', businessId),
      where('status', '==', 'active')
    );
    
    const activeSnapshot = await getDocs(activeSubscriptionsQuery);
    console.log(`${businessId} - Abonnements actifs trouvés:`, activeSnapshot.size);
    
    if (activeSnapshot.size > 0) {
      // Vérification des abonnements actifs
      let latestEndDate: Date | null = null;
      const currentDate = new Date();
      let hasValidSubscription = false;
      
      // Vérifier si au moins un abonnement a une date de fin valide (dans le futur)
      for (const docSnapshot of activeSnapshot.docs) {
        const subscription = docSnapshot.data();
        let endDate: Date;
        
        if (subscription.endDate instanceof Timestamp) {
          endDate = subscription.endDate.toDate();
        } else if (typeof subscription.endDate === 'number') {
          endDate = new Date(subscription.endDate);
        } else {
          endDate = new Date(subscription.endDate);
        }
        
        console.log(`${businessId} - Abonnement ${docSnapshot.id} - Date fin:`, endDate, '- Date actuelle:', currentDate);
        
        // L'abonnement est-il valide (date de fin dans le futur) ?
        if (endDate > currentDate) {
          console.log(`${businessId} - Abonnement valide trouvé jusqu'au`, endDate);
          hasValidSubscription = true;
          
          // Garder la date de fin la plus éloignée
          if (!latestEndDate || endDate > latestEndDate) {
            latestEndDate = endDate;
          }
        }
      }
      
      // Si nous avons trouvé au moins un abonnement valide
      if (hasValidSubscription && latestEndDate) {
        console.log(`${businessId} - Client avec abonnement actif valide jusqu'au:`, latestEndDate);
        
        // IMPORTANT: Mettre à jour le statut d'essai dans la collection businesses
        // lorsqu'un client a un abonnement actif, il ne doit plus être marqué comme étant en période d'essai
        try {
          // Vérifier si le client est actuellement marqué comme étant en période d'essai
          if (clientDoc.exists() && clientDoc.data().isInTrial === true) {
            console.log(`${businessId} - Mise à jour du statut d'essai: passage de isInTrial=true à isInTrial=false`);
            // Mettre à jour le document business pour désactiver la période d'essai
            await updateDoc(clientRef, {
              isInTrial: false,
              updatedAt: serverTimestamp()
            });
            console.log(`${businessId} - Statut d'essai mis à jour avec succès dans la collection businesses`);
          }
        } catch (error) {
          console.error(`${businessId} - Erreur lors de la mise à jour du statut d'essai:`, error);
          // Ne pas bloquer le processus en cas d'erreur de mise à jour
        }
        
        return {
          hasActiveSubscription: true,
          isInTrial: false,
          subscriptionEndDate: latestEndDate,
          subscriptionExpired: false,
          trialExpired: false,
          message: 'Vous avez un abonnement actif.',
          statusCode: 'active_subscription'
        };
      }
      
      // Si tous les abonnements actifs sont en réalité expirés
      console.log(`${businessId} - Tous les abonnements 'actifs' sont en réalité expirés`);      
      let latestExpiredDate: Date | null = null;
      
      for (const docSnapshot of activeSnapshot.docs) {
        const subscription = docSnapshot.data();
        let endDate: Date;
        
        if (subscription.endDate instanceof Timestamp) {
          endDate = subscription.endDate.toDate();
        } else if (typeof subscription.endDate === 'number') {
          endDate = new Date(subscription.endDate);
        } else {
          endDate = new Date(subscription.endDate);
        }
        
        // Garder la date d'expiration la plus récente
        if (!latestExpiredDate || endDate > latestExpiredDate) {
          latestExpiredDate = endDate;
        }
      }
      
      if (latestExpiredDate) {
        const formattedDate = latestExpiredDate.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        
        return {
          hasActiveSubscription: false,
          isInTrial: false,
          subscriptionExpired: true,
          trialExpired: false,
          subscriptionEndDate: latestExpiredDate,
          message: `Votre abonnement a expiré depuis le ${formattedDate}.`,
          statusCode: 'subscription_expired'
        };
      }
    }
    
    // 3. Vérifier si le client a une période d'essai expirée
    if (clientDoc && clientDoc.exists()) {
      const clientData = clientDoc.data();
      if (clientData.isInTrial && clientData.trialEndDate && clientData.trialEndDate < Date.now()) {
        console.log(`${businessId} - Période d'essai expirée détectée`);        
        return {
          hasActiveSubscription: false,
          isInTrial: false,
          trialExpired: true,
          subscriptionExpired: false,
          message: 'Votre période d\'essai a pris fin.',
          statusCode: 'trial_expired'
        };
      }
    }
    
    // 4. Vérifier les abonnements expirés et annulés
    const expiredSubscriptionsQuery = query(
      collection(db, SUBSCRIPTIONS_COLLECTION),
      where('clientId', '==', businessId),
      where('status', '==', 'expired')
    );
    
    const expiredSnapshot = await getDocs(expiredSubscriptionsQuery);
    console.log(`${businessId} - Abonnements expirés trouvés:`, expiredSnapshot.size);
    
    // Vérifier si l'utilisateur a un abonnement annulé
    const cancelledSubscriptionsQuery = query(
      collection(db, SUBSCRIPTIONS_COLLECTION),
      where('clientId', '==', businessId),
      where('status', '==', 'cancelled')
    );
    
    const cancelledSnapshot = await getDocs(cancelledSubscriptionsQuery);
    console.log('Abonnements avec statut cancelled trouvés:', cancelledSnapshot.size);
    
    // Vérifier d'abord si l'utilisateur a un abonnement annulé
    if (!cancelledSnapshot.empty) {
      console.log('Abonnement annulé détecté dans la base de données');
      
      // Trouver l'abonnement annulé le plus récent
      let latestCancelledDate: Date | null = null;
      
      cancelledSnapshot.docs.forEach(doc => {
        const subscription = doc.data();
        const cancelDate = subscription.cancelDate instanceof Timestamp 
          ? subscription.cancelDate.toDate() 
          : subscription.endDate instanceof Timestamp 
            ? subscription.endDate.toDate()
            : new Date(subscription.endDate || subscription.cancelDate);
        
        if (!latestCancelledDate || cancelDate > latestCancelledDate) {
          latestCancelledDate = cancelDate;
        }
      });
      
      return {
        hasActiveSubscription: false,
        isInTrial: false,
        subscriptionExpired: false,
        trialExpired: false,
        subscriptionCancelled: true,
        subscriptionEndDate: latestCancelledDate || undefined,
        message: 'Votre abonnement a été annulé. Veuillez contacter notre support technique pour plus d\'informations.',
        statusCode: 'subscription_cancelled'
      };
    }
    
    // Ensuite, vérifier si l'utilisateur a un abonnement expiré
    if (!expiredSnapshot.empty) {
      console.log('Abonnement expiré détecté dans la base de données');
      
      // Trouver l'abonnement expiré le plus récent
      let latestExpiredDate: Date | null = null;
      
      expiredSnapshot.docs.forEach(doc => {
        const subscription = doc.data();
        const endDate = subscription.endDate instanceof Timestamp 
          ? subscription.endDate.toDate() 
          : new Date(subscription.endDate);
        
        if (!latestExpiredDate || endDate > latestExpiredDate) {
          latestExpiredDate = endDate;
        }
      });
      
      if (latestExpiredDate) {
        const formattedDate = (latestExpiredDate as Date).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        
        return {
          hasActiveSubscription: false,
          isInTrial: false,
          subscriptionExpired: true,
          trialExpired: false,
          subscriptionEndDate: latestExpiredDate,
          message: `Votre abonnement a expiré depuis le ${formattedDate}. Veuillez le renouveler pour continuer à utiliser l'application.`,
          statusCode: 'subscription_expired'
        };
      }
    }
    
    // Deuxième méthode : chercher tous les abonnements et vérifier si la date de fin est passée
    const allSubscriptionsQuery = query(
      collection(db, SUBSCRIPTIONS_COLLECTION),
      where('clientId', '==', businessId)
    );
    
    const allSubscriptionsSnapshot = await getDocs(allSubscriptionsQuery);
    console.log('Total des abonnements trouvés:', allSubscriptionsSnapshot.size);
    
    // Filtrer pour trouver les abonnements expirés basés sur la date de fin
    const manuallyExpiredSubscriptions = allSubscriptionsSnapshot.docs.filter(doc => {
      const subscription = doc.data();
      const endDate = subscription.endDate instanceof Timestamp 
        ? subscription.endDate.toDate() 
        : new Date(subscription.endDate);
      
      return endDate < new Date() && subscription.status !== 'active';
    });
    
    console.log('Abonnements expirés basés sur la date:', manuallyExpiredSubscriptions.length);
    
    // Combiner les deux ensembles d'abonnements expirés
    const combinedExpiredDocs = [...expiredSnapshot.docs, ...manuallyExpiredSubscriptions];
    
    if (combinedExpiredDocs.length > 0) {
      console.log('Détails des abonnements expirés combinés:', combinedExpiredDocs.map(doc => doc.data()));
      // Trouver l'abonnement expiré le plus récent
      let latestExpiredDate: Date | null = null;
      
      combinedExpiredDocs.forEach(doc => {
        const subscription = doc.data();
        const endDate = subscription.endDate instanceof Timestamp 
          ? subscription.endDate.toDate() 
          : new Date(subscription.endDate);
        
        if (!latestExpiredDate || endDate > latestExpiredDate) {
          latestExpiredDate = endDate;
        }
      });
      
      if (latestExpiredDate) {
        const formattedDate = new Date(latestExpiredDate).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
        
        return {
          hasActiveSubscription: false,
          isInTrial: false,
          subscriptionExpired: true,
          trialExpired: false,
          subscriptionEndDate: latestExpiredDate,
          message: `Votre abonnement a expiré depuis le ${formattedDate}. Veuillez le renouveler pour continuer à utiliser l'application.`,
          statusCode: 'subscription_expired'
        };
      }
    }
    
    // Vérifier à nouveau s'il y a une période d'essai (pour s'assurer qu'elle n'est pas ignorée)
    if (clientDoc && clientDoc.exists()) {
      const clientData = clientDoc.data();
      
      console.log('Vérification finale de période d\'essai avant de conclure "pas d\'abonnement":', {
        businessId,
        isInTrial: clientData.isInTrial,
        trialEndDate: clientData.trialEndDate
      });
      
      // Seconde vérification de la période d'essai (s'assurer qu'elle n'est pas ignorée)
      if (clientData.isInTrial === true) {
        const now = Date.now();
        const trialEndDate = clientData.trialEndDate;
        
        // Si trialEndDate n'est pas défini ou est dans le futur, considérer comme un essai actif
        if (!trialEndDate || trialEndDate > now) {
          const daysRemaining = trialEndDate ? Math.ceil((trialEndDate - now) / (1000 * 60 * 60 * 24)) : 30; // 30 jours par défaut
          
          console.log(`Double vérification: Période d'essai VALIDE - Jours restants: ${daysRemaining}`);
          
          return {
            hasActiveSubscription: true,
            isInTrial: true,
            trialDaysRemaining: daysRemaining,
            subscriptionExpired: false,
            trialExpired: false,
            message: `Vous êtes en période d'essai. Il vous reste ${daysRemaining} jour(s).`,
            statusCode: 'trial_active'
          };
        }
      }
    }
    
    // Si l'utilisateur n'a jamais eu d'abonnement ni de période d'essai
    return {
      hasActiveSubscription: false,
      isInTrial: false,
      subscriptionExpired: false,
      trialExpired: false,
      message: 'Vous ne disposez pas d\'un abonnement actif. Veuillez souscrire à une formule pour accéder à l\'application.',
      statusCode: 'no_subscription'
    };
  } catch (error) {
    console.error('Erreur lors de la vérification du statut d\'abonnement:', error);
    throw error;
  }
};

/**
 * Vérifie si un utilisateur peut se connecter (a un abonnement actif ou est en période d'essai)
 * @param businessId ID de l'entreprise
 * @returns Vrai si l'utilisateur peut se connecter, faux sinon avec un message d'erreur
 */
export const canUserLogin = async (businessId: string): Promise<{ canLogin: boolean; message: string; statusCode: string }> => {
  try {
    const status = await checkSubscriptionStatus(businessId);
    
    console.log('Statut d\'abonnement pour', businessId, ':', status);
    
    // Vérifier si l'utilisateur a un abonnement actif ou est en période d'essai
    if (status.hasActiveSubscription || status.isInTrial) {
      return {
        canLogin: true,
        message: status.message,
        statusCode: status.statusCode
      };
    }
    
    // Vérifier explicitement si l'abonnement est expiré
    if (status.subscriptionExpired) {
      console.log('Accès refusé: abonnement expiré');
      return {
        canLogin: false,
        message: status.message,
        statusCode: 'subscription_expired'
      };
    }
    
    // Vérifier si l'abonnement a été annulé
    if (status.subscriptionCancelled) {
      console.log('Accès refusé: abonnement annulé');
      return {
        canLogin: false,
        message: status.message,
        statusCode: 'subscription_cancelled'
      };
    }
    
    return {
      canLogin: false,
      message: status.message,
      statusCode: status.statusCode
    };
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'autorisation de connexion:', error);
    return {
      canLogin: false,
      message: 'Impossible de vérifier le statut de votre abonnement. Veuillez réessayer ultérieurement.',
      statusCode: 'no_subscription'
    };
  }
};

/**
 * Vérifie automatiquement le statut d'abonnement de l'utilisateur actuellement connecté
 * et le déconnecte si son abonnement est expiré, annulé ou si sa période d'essai est terminée
 * @returns Une promesse qui se résout à true si l'utilisateur a été déconnecté, false sinon
 */
export const autoCheckSubscriptionStatus = async (): Promise<boolean> => {
  try {
    // Vérifier si un utilisateur est connecté
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log('Aucun utilisateur connecté, pas de vérification d\'abonnement nécessaire');
      return false;
    }

    console.log('Vérification automatique du statut d\'abonnement pour', currentUser.email);
    
    // Vérifier le statut d'abonnement
    const status = await checkSubscriptionStatus(currentUser.uid);
    
    // Vérifier si l'utilisateur doit être déconnecté
    // Important: Ne déconnecter que si l'abonnement est expiré, annulé ou si la période d'essai est terminée
    // Les clients en période d'essai valide doivent pouvoir se connecter
    if (status.subscriptionExpired || status.subscriptionCancelled || status.trialExpired) {
      console.log('Statut d\'abonnement invalide, détail:', {
        isInTrial: status.isInTrial,
        hasActiveSubscription: status.hasActiveSubscription,
        subscriptionExpired: status.subscriptionExpired,
        subscriptionCancelled: status.subscriptionCancelled,
        trialExpired: status.trialExpired,
        statusCode: status.statusCode
      });
      console.log('Statut d\'abonnement invalide détecté, déconnexion automatique:', status.statusCode);
      
      // Déterminer le type de message à afficher
      let title = '';
      let message = '';
      let redirectUrl = '/#/subscription-plans';
      
      if (status.subscriptionExpired) {
        title = 'Abonnement expiré';
        message = status.message || 'Votre abonnement a expiré. Pour continuer à utiliser PayeSmart, veuillez renouveler votre abonnement.';
      } else if (status.subscriptionCancelled) {
        title = 'Abonnement annulé';
        message = status.message || 'Votre abonnement a été annulé. Pour continuer à utiliser PayeSmart, veuillez souscrire à un nouvel abonnement.';
      } else if (status.trialExpired) {
        title = 'Période d\'essai terminée';
        message = status.message || 'Votre période d\'essai a pris fin. Pour continuer à utiliser PayeSmart, veuillez souscrire à un abonnement.';
      }
      
      // Enregistrer le message dans localStorage pour l'afficher après la redirection
      localStorage.setItem('subscription_error', JSON.stringify({
        title,
        message,
        statusCode: status.statusCode
      }));
      
      // Déconnecter l'utilisateur
      await signOut(auth);
      
      // Rediriger vers la page appropriée
      window.location.href = redirectUrl;
      
      return true;
    }
    
    console.log('Statut d\'abonnement valide:', status.statusCode);
    return false;
  } catch (error) {
    console.error('Erreur lors de la vérification automatique du statut d\'abonnement:', error);
    return false;
  }
};
