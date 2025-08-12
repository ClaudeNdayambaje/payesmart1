import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { Client } from '../types/saas';
import { Business } from './clientAuthService';
// Implémentation locale de formatDate pour éviter les problèmes de résolution de chemin avec Netlify
const formatDate = (timestamp: number): string => {
  if (!timestamp) return '-';
  
  try {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  } catch (error) {
    console.error('Erreur lors du formatage de la date:', error);
    return '-';
  }
};

// Collection Firestore
const SAAS_CLIENTS_COLLECTION = 'saas_clients';
const BUSINESSES_COLLECTION = 'businesses';

/**
 * Synchronise un nouveau client d'entreprise avec le système SaaS
 * Cette fonction est appelée après l'inscription d'un nouveau client
 */
/**
 * Met à jour spécifiquement le statut d'essai d'un client lorsqu'il a un abonnement actif
 * @param clientId Identifiant du client à mettre à jour
 */
export const updateClientWithActiveSubscription = async (clientId: string): Promise<{success: boolean; message: string}> => {
  try {
    // Vérifier si le client existe dans la collection businesses
    const businessRef = doc(db, BUSINESSES_COLLECTION, clientId);
    const businessDoc = await getDoc(businessRef);
    
    if (!businessDoc.exists()) {
      return { success: false, message: `Client ${clientId} non trouvé dans la collection businesses` };
    }
    
    // Vérifier s'il a un abonnement actif
    const subscriptionsQuery = query(
      collection(db, 'subscriptions'),
      where('clientId', '==', clientId),
      where('status', '==', 'active')
    );
    
    const subscriptionsSnapshot = await getDocs(subscriptionsQuery);
    
    if (subscriptionsSnapshot.empty) {
      return { success: false, message: `Aucun abonnement actif trouvé pour le client ${clientId}` };
    }
    
    // Si le client a un abonnement actif, mettre à jour son statut isInTrial à false
    console.log(`Client ${clientId} a un abonnement actif, mise à jour du statut d'essai...`);
    
    // Mettre à jour le document business
    await updateDoc(businessRef, {
      isInTrial: false,
      updatedAt: Timestamp.now()
    });
    
    // Trouver et mettre à jour le client correspondant dans saas_clients
    const saasClientsQuery = query(
      collection(db, SAAS_CLIENTS_COLLECTION),
      where('businessId', '==', clientId)
    );
    
    const saasClientsSnapshot = await getDocs(saasClientsQuery);
    
    if (!saasClientsSnapshot.empty) {
      const saasClientDoc = saasClientsSnapshot.docs[0];
      await updateDoc(doc(db, SAAS_CLIENTS_COLLECTION, saasClientDoc.id), {
        isInTrial: false
      });
      console.log(`Document saas_client ${saasClientDoc.id} mis à jour avec isInTrial=false`);
    }
    
    return { success: true, message: `Le statut du client ${clientId} a été mis à jour avec succès` };
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut du client:', error);
    return { success: false, message: `Erreur: ${error instanceof Error ? error.message : String(error)}` };
  }
};

/**
 * Vérifie et met à jour tous les clients ayant un abonnement actif
 * Désactive automatiquement le statut d'essai pour les clients ayant un abonnement actif
 */
export const updateClientsWithActiveSubscriptions = async (): Promise<{success: boolean; message: string; updatedCount: number}> => {
  try {
    console.log('Démarrage de la vérification des clients avec abonnements actifs...');
    
    // Récupérer tous les abonnements actifs
    const activeSubscriptionsQuery = query(
      collection(db, 'subscriptions'),
      where('status', '==', 'active')
    );
    
    const activeSubscriptionsSnapshot = await getDocs(activeSubscriptionsQuery);
    console.log(`${activeSubscriptionsSnapshot.size} abonnements actifs trouvés`);
    
    let clientsWithActiveSubscriptionsUpdated = 0;
    
    for (const subscriptionDoc of activeSubscriptionsSnapshot.docs) {
      const subscription = subscriptionDoc.data();
      const clientId = subscription.clientId;
      
      if (!clientId) {
        console.warn(`Abonnement ${subscriptionDoc.id} sans clientId associé`);  
        continue;
      }
      
      // Vérifier si la date de fin de l'abonnement est dans le futur
      let endDate: Date;
      if (subscription.endDate instanceof Timestamp) {
        endDate = subscription.endDate.toDate();
      } else if (typeof subscription.endDate === 'number') {
        endDate = new Date(subscription.endDate);
      } else {
        endDate = new Date(subscription.endDate);
      }
      
      const currentDate = new Date();
      if (endDate <= currentDate) {
        console.log(`Abonnement ${subscriptionDoc.id} expiré le ${endDate.toLocaleDateString()}`);  
        continue;
      }
      
      console.log(`Client ${clientId} a un abonnement actif valide jusqu'au ${endDate.toLocaleDateString()}`);
      
      // Vérifier et mettre à jour le statut d'essai dans businesses
      const businessRef = doc(db, BUSINESSES_COLLECTION, clientId);
      const businessDoc = await getDoc(businessRef);
      
      if (businessDoc.exists()) {
        const businessData = businessDoc.data();
        
        if (businessData.isInTrial === true) {
          console.log(`Client ${clientId} (${businessData.businessName || 'sans nom'}) a un abonnement actif mais est marqué comme en période d'essai - correction...`);
          
          // Mettre à jour le document business
          try {
            await updateDoc(businessRef, {
              isInTrial: false,
              updatedAt: serverTimestamp()
            });
            
            // Mettre à jour le document saas_client correspondant s'il existe
            const saasClientsQuery = query(
              collection(db, SAAS_CLIENTS_COLLECTION),
              where('businessId', '==', clientId)
            );
            
            const saasClientsSnapshot = await getDocs(saasClientsQuery);
            
            if (!saasClientsSnapshot.empty) {
              const saasClientDoc = saasClientsSnapshot.docs[0];
              await updateDoc(doc(db, SAAS_CLIENTS_COLLECTION, saasClientDoc.id), {
                isInTrial: false
              });
              console.log(`Document saas_client ${saasClientDoc.id} mis à jour avec isInTrial=false`);
            }
            
            clientsWithActiveSubscriptionsUpdated++;
            console.log(`✅ Statut d'essai corrigé pour ${clientId}`);
          } catch (error) {
            console.error(`❌ Erreur lors de la mise à jour du statut d'essai pour ${clientId}:`, error);
          }
        }
      }
    }
    
    return {
      success: true,
      message: `Vérification terminée. ${clientsWithActiveSubscriptionsUpdated} clients avec abonnements actifs ont été mis à jour.`,
      updatedCount: clientsWithActiveSubscriptionsUpdated
    };
  } catch (error) {
    console.error('Erreur lors de la vérification des clients avec abonnements actifs:', error);
    return { 
      success: false, 
      message: `Erreur: ${error instanceof Error ? error.message : String(error)}`,
      updatedCount: 0
    };
  }
};

/**
 * Synchronise de manière bidirectionnelle les statuts d'essai entre les collections 'businesses' et 'saas_clients'
 * Cela garantit la cohérence des données entre les deux collections
 * Vérifie également et met à jour les clients ayant un abonnement actif
 */
export const synchronizeTrialStatus = async (): Promise<{success: boolean; message: string}> => {
  try {
    console.log('Démarrage de la synchronisation bidirectionnelle des statuts d\'essai...');
    
    // 1. D'abord, récupérer tous les clients en période d'essai depuis la collection saas_clients
    const trialClientsQuery = query(
      collection(db, SAAS_CLIENTS_COLLECTION),
      where('isInTrial', '==', true)
    );
    
    const trialClientsSnapshot = await getDocs(trialClientsQuery);
    console.log(`${trialClientsSnapshot.size} clients en période d'essai trouvés dans saas_clients`);
    
    // 2. Pour chaque client en essai, mettre à jour son entrée correspondante dans businesses
    let updatedCount = 0;
    let failedCount = 0;
    let noBusinessIdCount = 0;
    
    for (const clientDoc of trialClientsSnapshot.docs) {
      const saasClientData = clientDoc.data() as Client;
      const businessId = saasClientData.businessId;
      
      if (!businessId) {
        console.warn(`Client ${clientDoc.id} (${saasClientData.email}) n'a pas de businessId`);
        noBusinessIdCount++;
        continue;
      }
      
      // Récupérer le document business correspondant
      const businessRef = doc(db, BUSINESSES_COLLECTION, businessId);
      const businessDoc = await getDoc(businessRef);
      
      if (businessDoc.exists()) {
        // Mettre à jour le statut d'essai dans le document business
        try {
          await updateDoc(businessRef, {
            isInTrial: true,
            trialStartDate: saasClientData.trialStartDate || Date.now(),
            trialEndDate: saasClientData.trialEndDate || (Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 jours par défaut
            updatedAt: Timestamp.now()
          });
          
          console.log(`✅ Statut d'essai mis à jour dans businesses pour ${businessId} (${saasClientData.email})`);
          updatedCount++;
        } catch (error) {
          console.error(`❌ Erreur lors de la mise à jour du statut d'essai pour ${businessId}:`, error);
          failedCount++;
        }
      } else {
        console.warn(`⚠️ Business ${businessId} non trouvé dans la collection businesses`);
        failedCount++;
      }
    }
    
    // 3. Maintenant, faire l'inverse : récupérer tous les clients avec statut 'Essai Actif' dans businesses
    // et les marquer comme isInTrial=true dans saas_clients s'ils ne le sont pas déjà
    console.log('Démarrage de la synchronisation inverse (businesses vers saas_clients)...');
    
    const businessesQuery = query(
      collection(db, BUSINESSES_COLLECTION),
      where('isInTrial', '==', true)
    );
    
    const businessesSnapshot = await getDocs(businessesQuery);
    console.log(`${businessesSnapshot.size} clients en période d'essai trouvés dans businesses`);
    
    let saasClientsCreatedCount = 0;
    let saasClientsUpdatedCount = 0;
    
    for (const businessDoc of businessesSnapshot.docs) {
      const businessData = businessDoc.data();
      const businessId = businessDoc.id;
      const email = businessData.email;
      
      if (!email) {
        console.warn(`Business ${businessId} n'a pas d'email, impossible de synchroniser`);
        continue;
      }
      
      // Vérifier si ce client existe déjà dans la collection saas_clients
      const saasClientsQuery = query(
        collection(db, SAAS_CLIENTS_COLLECTION),
        where('email', '==', email)
      );
      
      const saasClientsSnapshot = await getDocs(saasClientsQuery);
      
      if (saasClientsSnapshot.empty) {
        // Le client n'existe pas dans saas_clients, le créer
        try {
          // Créer un nouveau client SaaS avec les données de business
          const newClient: Partial<Client> = {
            businessName: businessData.businessName || 'Sans nom',
            contactName: businessData.contactName || 'Inconnu',
            email: email,
            businessId: businessId,
            isInTrial: true,
            trialStartDate: businessData.trialStartDate || Date.now(),
            trialEndDate: businessData.trialEndDate || (Date.now() + 30 * 24 * 60 * 60 * 1000), // Période d'essai de 30 jours forcée
            createdAt: Date.now(),
            status: 'active'
          };
          
          await addDoc(collection(db, SAAS_CLIENTS_COLLECTION), newClient);
          console.log(`✅ Nouveau client SaaS créé pour ${email} avec statut d'essai`);
          saasClientsCreatedCount++;
        } catch (error) {
          console.error(`❌ Erreur lors de la création du client SaaS pour ${email}:`, error);
          failedCount++;
        }
      } else {
        // Le client existe déjà, mettre à jour son statut d'essai si nécessaire
        const saasClientDoc = saasClientsSnapshot.docs[0];
        const saasClientData = saasClientDoc.data();
        
        if (!saasClientData.isInTrial) {
          try {
            await updateDoc(doc(db, SAAS_CLIENTS_COLLECTION, saasClientDoc.id), {
              isInTrial: true,
              trialStartDate: businessData.trialStartDate || saasClientData.trialStartDate || Date.now(),
              trialEndDate: businessData.trialEndDate || saasClientData.trialEndDate || (Date.now() + 15 * 24 * 60 * 60 * 1000)
            });
            
            console.log(`✅ Statut d'essai mis à jour dans saas_clients pour ${email}`);
            saasClientsUpdatedCount++;
          } catch (error) {
            console.error(`❌ Erreur lors de la mise à jour du statut d'essai dans saas_clients pour ${email}:`, error);
            failedCount++;
          }
        }
      }
    }
    
    console.log(`Synchronisation inverse terminée: ${saasClientsCreatedCount} clients SaaS créés, ${saasClientsUpdatedCount} clients SaaS mis à jour`);
    
    // Étape finale: Vérifier et mettre à jour tous les clients qui ont un abonnement actif
    console.log('Vérification des clients avec abonnements actifs...');
    const subscriptionResult = await updateClientsWithActiveSubscriptions();
    console.log(subscriptionResult.message);
    
    return {
      success: true,
      message: `${updatedCount} clients ont été synchronisés avec succès (saas_clients vers businesses). ${saasClientsCreatedCount} clients SaaS créés, ${saasClientsUpdatedCount} clients SaaS mis à jour (businesses vers saas_clients). ${subscriptionResult.updatedCount} clients avec abonnements actifs corrigés. ${failedCount} échecs au total.`
    };
  } catch (error) {
    console.error('Erreur lors de la synchronisation des statuts d\'essai:', error);
    return {
      success: false,
      message: `Erreur lors de la synchronisation: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

/**
 * Synchronise un nouveau client d'entreprise avec le système SaaS
 * Cette fonction est appelée après l'inscription d'un nouveau client
 */
export const syncBusinessToSaasClient = async (businessId: string): Promise<void> => {
  try {
    // Vérifier si le client existe déjà dans la collection SaaS
    const existingClientQuery = query(
      collection(db, SAAS_CLIENTS_COLLECTION),
      where('businessId', '==', businessId)
    );
    
    const existingClientSnapshot = await getDocs(existingClientQuery);
    
    // Si le client existe déjà, ne rien faire
    if (!existingClientSnapshot.empty) {
      console.log(`Le client SaaS pour l'entreprise ${businessId} existe déjà`);
      return;
    }
    
    // Récupérer les informations de l'entreprise
    const businessRef = await getDocs(query(
      collection(db, BUSINESSES_COLLECTION),
      where('__name__', '==', businessId)
    ));
    
    if (businessRef.empty) {
      console.error(`Entreprise ${businessId} non trouvée`);
      return;
    }
    
    const businessData = businessRef.docs[0].data() as Business;
    
    // Récupérer la période d'essai active configurée dans l'interface d'administration
    const now = Date.now();
    
    // Utiliser notre service centralisé pour récupérer la période d'essai active
    const { getActiveTrialPeriod } = await import('./trialPeriodService');
    const activePeriod = await getActiveTrialPeriod();
    
    // Vérifier si une période d'essai active a été configurée
    if (!activePeriod) {
      console.log('[saasClientService] Aucune période d\'essai active n\'a été configurée. Aucune période d\'essai ne sera appliquée.');
    }
    
    // Calculer la durée de la période d'essai en millisecondes uniquement si une période active existe
    const trialDurationMs = activePeriod ? (activePeriod.days * 24 * 60 * 60 * 1000) + (activePeriod.minutes * 60 * 1000) : 0;
    
    // Calculer la date de fin de la période d'essai
    const trialEndDate = activePeriod ? now + trialDurationMs : 0;
    
    // Informations sur la période d'essai appliquée
    const periodName = activePeriod ? activePeriod.name : 'Aucune période d\'essai';
    
    if (activePeriod) {
      console.log(`[saasClientService] Période d'essai appliquée: ${periodName}`);
      console.log(`[saasClientService] Durée: ${activePeriod.days} jours et ${activePeriod.minutes} minutes`);
      console.log(`[saasClientService] Date de début: ${formatDate(now)}`);
      console.log(`[saasClientService] Date de fin: ${formatDate(trialEndDate)}`);
    } else {
      console.log(`[saasClientService] Aucune période d'essai n'a été appliquée.`);
    }
    
    // Créer un nouveau client SaaS
    const newSaasClient: Omit<Client, 'id'> = {
      businessName: businessData.businessName,
      contactName: `${businessData.ownerFirstName} ${businessData.ownerLastName}`,
      email: businessData.email,
      phone: businessData.phone || '',
      address: '',
      city: '',
      postalCode: '',
      country: '',
      createdAt: Date.now(),
      status: 'active',
      notes: 'Client créé automatiquement lors de l\'inscription',
      businessId: businessId, // Champ supplémentaire pour lier le client SaaS à l'entreprise
      // Toujours définir un statut d'essai par défaut pour permettre la connexion
      trialStartDate: activePeriod ? now : now,
      trialEndDate: activePeriod ? trialEndDate : (now + (30 * 24 * 60 * 60 * 1000)), // 30 jours par défaut si aucune période active
      isInTrial: true // Toujours en essai pour permettre la connexion
    };
    
    // Ajouter les informations de période d'essai
    if (activePeriod) {
      newSaasClient.trialInfo = {
        trialPeriodId: activePeriod.id,
        trialPeriodName: activePeriod.name,
        durationDays: activePeriod.days,
        durationMinutes: activePeriod.minutes,
        formattedEndDate: formatDate(trialEndDate)
      };
    } else {
      // Ajouter des informations de période par défaut pour assurer la compatibilité
      newSaasClient.trialInfo = {
        trialPeriodId: 'default',
        trialPeriodName: 'Période d\'essai standard 30 jours',
        durationDays: 30,
        durationMinutes: 0,
        formattedEndDate: formatDate(newSaasClient.trialEndDate || 0)
      };
    }
    
    // Ajouter le client à la collection SaaS
    await addDoc(collection(db, SAAS_CLIENTS_COLLECTION), newSaasClient);
    
    console.log(`Client SaaS créé pour l'entreprise ${businessId}`);
  } catch (error) {
    console.error('Erreur lors de la synchronisation du client SaaS:', error);
  }
};

/**
 * Recherche un client SaaS par son adresse email
 * @param email Adresse email du client à rechercher
 * @returns Le client s'il existe, null sinon
 */
export const findClientByEmail = async (email: string): Promise<Client | null> => {
  try {
    const clientsQuery = query(
      collection(db, SAAS_CLIENTS_COLLECTION),
      where('email', '==', email)
    );
    
    const snapshot = await getDocs(clientsQuery);
    
    if (snapshot.empty) {
      return null;
    }
    
    // Retourner le premier client trouvé avec cette adresse email
    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data()
    } as Client;
  } catch (error) {
    console.error('Erreur lors de la recherche du client par email:', error);
    return null;
  }
};

/**
 * Récupère tous les clients SaaS liés à des entreprises
 */
export const getSaasClientsWithBusinessData = async (): Promise<Client[]> => {
  try {
    const clientsQuery = query(collection(db, SAAS_CLIENTS_COLLECTION));
    const snapshot = await getDocs(clientsQuery);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Client));
  } catch (error) {
    console.error('Erreur lors de la récupération des clients SaaS:', error);
    throw error;
  }
};

/**
 * Calcule le taux de conversion des clients qui sont passés de la période d'essai à un abonnement
 * @returns Un objet contenant le taux de conversion et les nombres associés
 */
export const getTrialConversionRate = async (): Promise<{ rate: number; convertedClients: number; totalTrialEnded: number }> => {
  try {
    // Récupérer les 30 derniers jours en millisecondes (30 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    
    // Récupérer tous les clients dont la période d'essai s'est terminée
    // Note: On ne peut pas utiliser plusieurs conditions d'inégalité sur des champs différents
    // Nous allons donc faire une requête plus simple puis filtrer les résultats en mémoire
    const clientsQuery = query(
      collection(db, SAAS_CLIENTS_COLLECTION),
      where('isInTrial', '==', false), // Clients qui ne sont plus en essai
      where('trialEndDate', '>=', thirtyDaysAgo) // Essai terminé au cours des 30 derniers jours
    );
    
    const clientsSnapshot = await getDocs(clientsQuery);
    
    // Filtrer les clients dont la période d'essai est déjà terminée
    const filteredClients = clientsSnapshot.docs.filter(doc => {
      const client = doc.data() as Client;
      return client.trialEndDate && client.trialEndDate <= Date.now();
    });
    
    if (filteredClients.length === 0) {
      console.log('Aucun client avec période d\'essai terminée dans les 30 derniers jours');
      return { rate: 0, convertedClients: 0, totalTrialEnded: 0 };
    }
    
    // Nombre total de clients dont la période d'essai s'est terminée
    const totalTrialEnded = filteredClients.length;
    console.log(`${totalTrialEnded} clients ont terminé leur période d'essai dans les 30 derniers jours`);
    
    // Vérifier lesquels ont un abonnement actif
    let convertedClients = 0;
    
    for (const doc of filteredClients) {
      const client = doc.data() as Client;
      
      // Vérifier si le client a un abonnement actif dans la collection des abonnements
      try {
        const subscriptionsQuery = query(
          collection(db, 'subscriptions'),
          where('clientId', '==', client.businessId),
          where('status', '==', 'active')
        );
        
        const subscriptionsSnapshot = await getDocs(subscriptionsQuery);
        
        if (!subscriptionsSnapshot.empty) {
          // Le client a au moins un abonnement actif, donc il a été converti
          convertedClients++;
        }
      } catch (error) {
        console.warn(`Impossible de vérifier les abonnements pour le client ${client.businessName}:`, error);
        // Continuer avec le client suivant
      }
    }
    
    // Calculer le taux de conversion
    const conversionRate = totalTrialEnded > 0 ? (convertedClients / totalTrialEnded) * 100 : 0;
    console.log(`Taux de conversion: ${conversionRate.toFixed(2)}%`);
    
    return {
      rate: parseFloat(conversionRate.toFixed(2)),
      convertedClients,
      totalTrialEnded
    };
  } catch (error) {
    console.error('Erreur lors du calcul du taux de conversion:', error);
    return { rate: 0, convertedClients: 0, totalTrialEnded: 0 };
  }
};

/**
 * Récupère uniquement les clients SaaS qui sont en période d'essai
 * avec synchronisation des données des entreprises
 */
export const getTrialClients = async (): Promise<Client[]> => {
  try {
    // Récupérer tous les clients en période d'essai
    const clientsQuery = query(
      collection(db, SAAS_CLIENTS_COLLECTION),
      where('isInTrial', '==', true)
    );
    
    const clientsSnapshot = await getDocs(clientsQuery);
    
    if (clientsSnapshot.empty) {
      console.log('Aucun client en période d\'essai trouvé');
      return [];
    }
    
    // Créer une liste des clients en période d'essai
    const trialClientsData = clientsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data
      } as Client; // Conversion explicite en type Client
    });
    
    // Récupérer les données complètes des entreprises pour synchroniser les informations
    // Créer un tableau d'emails pour récupérer les entreprises correspondantes
    const clientEmails = trialClientsData.map(client => client.email).filter(Boolean);
    
    // Obtenir les entreprises correspondantes à ces emails
    const businessesCollection = collection(db, 'businesses');
    const businessesQuery = query(businessesCollection, where('email', 'in', clientEmails));
    const businessesSnapshot = await getDocs(businessesQuery);
    
    // Créer une carte email -> business pour faciliter la fusion des données
    const businessMap = new Map<string, any>();
    businessesSnapshot.docs.forEach(doc => {
      const businessData = doc.data() as any;
      if (businessData.email) {
        businessMap.set(businessData.email, {
          id: doc.id,
          ...businessData
        });
      }
    });
    
    console.log('Données des entreprises récupérées:', businessMap.size);
    
    // Fusionner les données des clients et des entreprises
    const enrichedTrialClients = trialClientsData.map(trialClient => {
      const business = businessMap.get(trialClient.email);
      
      // Ajouter des informations de débogage
      console.log(`Enrichissement du client d'essai ${trialClient.id}:`, {
        email: trialClient.email,
        businessFound: !!business,
        businessName: business?.businessName || trialClient.businessName,
        contactName: business?.contactName || 
                    `${business?.ownerFirstName || ''} ${business?.ownerLastName || ''}`.trim() || 
                    trialClient.contactName || 'Inconnu'
      });
      
      // Si une entreprise correspondante est trouvée, utiliser ses informations
      if (business) {
        return {
          ...trialClient,
          businessName: business.businessName || trialClient.businessName || 'Sans nom',
          contactName: business.contactName || 
                      `${business.ownerFirstName || ''} ${business.ownerLastName || ''}`.trim() || 
                      trialClient.contactName || 'Inconnu',
          businessId: business.id || trialClient.businessId
        };
      }
      
      return trialClient;
    }) as Client[];
    
    return enrichedTrialClients;
  } catch (error) {
    console.error('Erreur lors de la récupération des clients en période d\'essai:', error);
    return [];
  }
};
