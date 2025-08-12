import { db } from '../firebase';
import { collection, doc, getDocs, query, setDoc, updateDoc, where, Timestamp, addDoc } from 'firebase/firestore';
import { Client } from '../types/saas';
// import { getTrialConfig } from './trialConfigService'; // Commenté car non utilisé suite à la modification
import { getActiveTrialPeriod, DEFAULT_TRIAL_DURATION_DAYS } from './trialPeriodService';
import { getSubscriptionPlanById } from './subscriptionPlanService';

const SAAS_CLIENTS_COLLECTION = 'saas_clients';

/**
 * Vérifie les essais qui arrivent à expiration et envoie des notifications
 */
export const checkExpiringTrials = async (): Promise<void> => {
  try {
    const now = Date.now();
    const threeDaysFromNow = now + (3 * 24 * 60 * 60 * 1000);
    const oneDayFromNow = now + (1 * 24 * 60 * 60 * 1000);
    
    // Récupérer tous les clients en essai
    const clientsQuery = query(
      collection(db, SAAS_CLIENTS_COLLECTION),
      where('isInTrial', '==', true)
    );
    
    const snapshot = await getDocs(clientsQuery);
    const clients = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Client));
    
    // Traiter chaque client
    for (const client of clients) {
      if (!client.trialEndDate) continue;
      
      const daysRemaining = Math.ceil((client.trialEndDate - now) / (24 * 60 * 60 * 1000));
      
      // Essai expiré
      if (client.trialEndDate < now) {
        await handleExpiredTrial(client);
        continue;
      }
      
      // Notification à 3 jours de l'expiration
      if (client.trialEndDate <= threeDaysFromNow && client.trialEndDate > oneDayFromNow) {
        await simulateSendExpirationNotification(client, daysRemaining);
      }
      
      // Notification finale à 1 jour de l'expiration
      if (client.trialEndDate <= oneDayFromNow && client.trialEndDate > now) {
        await simulateSendFinalExpirationNotification(client);
      }
    }
    
    console.log('Vérification des essais terminée');
  } catch (error) {
    console.error('Erreur lors de la vérification des essais:', error);
  }
};

/**
 * Gère un essai expiré
 */
export const handleExpiredTrial = async (client: Client): Promise<void> => {
  try {
    // 1. Mettre à jour le statut du client
    const clientRef = doc(db, SAAS_CLIENTS_COLLECTION, client.id);
    await updateDoc(clientRef, {
      isInTrial: false,
      status: 'inactive',
      trialExpiredAt: Timestamp.now()
    });
    
    // 2. Envoyer un email de notification d'expiration
    await simulateSendExpiredTrialNotification(client);
    
    console.log(`Essai expiré traité pour ${client.businessName}`);
  } catch (error) {
    console.error(`Erreur lors du traitement de l'essai expiré pour ${client.businessName}:`, error);
  }
};

/**
 * Convertit un essai en abonnement payant
 */
export const convertTrialToSubscription = async (clientId: string | undefined, planId: string): Promise<boolean> => {
  if (!clientId) return false;
  
  try {
    // Récupérer les détails du client
    const clientSnapshot = await getDocs(query(
      collection(db, SAAS_CLIENTS_COLLECTION),
      where('__name__', '==', clientId)
    ));
    
    if (clientSnapshot.empty) {
      console.error(`Client ${clientId} non trouvé`);
      return false;
    }
    
    const clientData = clientSnapshot.docs[0].data() as Client;
    
    // Récupérer les détails du plan d'abonnement
    const plan = await getSubscriptionPlanById(planId);
    if (!plan) {
      console.error(`Plan d'abonnement ${planId} non trouvé`);
      return false;
    }
    
    // 1. Mettre à jour le statut du client
    const clientRef = doc(db, SAAS_CLIENTS_COLLECTION, clientId);
    await updateDoc(clientRef, {
      isInTrial: false,
      status: 'active',
      subscriptionPlanId: planId,
      subscriptionStartDate: Timestamp.now()
    });
    
    // 2. Créer un abonnement réel dans la collection des abonnements
    const now = new Date();
    const startDate = now.getTime();
    
    // Calculer la date de fin en fonction du cycle de facturation
    let endDate: number;
    if (plan.billingCycle === 'monthly') {
      // Date de fin = date actuelle + 1 mois
      const endDateObj = new Date(now);
      endDateObj.setMonth(endDateObj.getMonth() + 1);
      endDate = endDateObj.getTime();
    } else if (plan.billingCycle === 'yearly') {
      // Date de fin = date actuelle + 1 an
      const endDateObj = new Date(now);
      endDateObj.setFullYear(endDateObj.getFullYear() + 1);
      endDate = endDateObj.getTime();
    } else {
      // Par défaut, 30 jours
      endDate = startDate + (30 * 24 * 60 * 60 * 1000);
    }
    
    // Créer l'abonnement
    const subscriptionData = {
      planId: planId,
      clientId: clientData.businessId, // Utiliser businessId pour maintenir la cohérence
      status: 'active',
      startDate: startDate,
      endDate: endDate,
      createdAt: startDate,
      price: plan.price,
      currency: plan.currency || 'EUR',
      billingCycle: plan.billingCycle,
      autoRenew: true,
      paymentMethod: 'card', // Valeur par défaut
      notes: 'Converti depuis la période d\'essai',
      lastModified: startDate
    };
    
    await addDoc(collection(db, 'subscriptions'), subscriptionData);
    
    console.log(`Essai converti en abonnement pour le client ${clientId} - Plan: ${plan.name}`);
    return true;
  } catch (error) {
    console.error(`Erreur lors de la conversion de l'essai en abonnement pour ${clientId}:`, error);
    return false;
  }
};

/**
 * Prolonge la période d'essai d'un client
 */
export const extendTrialPeriod = async (clientId: string | undefined, additionalDays: number): Promise<boolean> => {
  if (!clientId) return false;
  
  try {
    // Récupérer le client
    const clientRef = doc(db, SAAS_CLIENTS_COLLECTION, clientId);
    const clientSnapshot = await getDocs(query(
      collection(db, SAAS_CLIENTS_COLLECTION),
      where('__name__', '==', clientId)
    ));
    
    if (clientSnapshot.empty) {
      console.error(`Client ${clientId} non trouvé`);
      return false;
    }
    
    const clientData = clientSnapshot.docs[0].data() as Client;
    
    // Calculer la nouvelle date de fin d'essai
    const currentEndDate = clientData.trialEndDate || Date.now();
    const newEndDate = currentEndDate + (additionalDays * 24 * 60 * 60 * 1000);
    
    // Mettre à jour le client
    await updateDoc(clientRef, {
      isInTrial: true,
      status: 'active',
      trialEndDate: newEndDate
    });
    
    console.log(`Période d'essai prolongée de ${additionalDays} jours pour le client ${clientId}`);
    return true;
  } catch (error) {
    console.error(`Erreur lors de la prolongation de la période d'essai pour ${clientId}:`, error);
    return false;
  }
};

/**
 * Prolonge la période d'essai d'un client avec des minutes supplémentaires
 * Utile pour les tests
 */
export const extendTrialPeriodWithMinutes = async (clientId: string | undefined, additionalDays: number, additionalMinutes: number): Promise<boolean> => {
  if (!clientId) return false;
  
  try {
    // Récupérer le client
    const clientRef = doc(db, SAAS_CLIENTS_COLLECTION, clientId);
    const clientSnapshot = await getDocs(query(
      collection(db, SAAS_CLIENTS_COLLECTION),
      where('__name__', '==', clientId)
    ));
    
    if (clientSnapshot.empty) {
      console.error(`Client ${clientId} non trouvé`);
      return false;
    }
    
    const clientData = clientSnapshot.docs[0].data() as Client;
    
    // Calculer la nouvelle date de fin d'essai
    const currentEndDate = clientData.trialEndDate || Date.now();
    const daysInMs = additionalDays * 24 * 60 * 60 * 1000;
    const minutesInMs = additionalMinutes * 60 * 1000;
    const newEndDate = currentEndDate + daysInMs + minutesInMs;
    
    // Mettre à jour le client
    await updateDoc(clientRef, {
      isInTrial: true,
      status: 'active',
      trialEndDate: newEndDate
    });
    
    console.log(`Période d'essai prolongée de ${additionalDays} jours et ${additionalMinutes} minutes pour le client ${clientId}`);
    return true;
  } catch (error) {
    console.error(`Erreur lors de la prolongation de la période d'essai pour ${clientId}:`, error);
    return false;
  }
};

/**
 * Crée un nouveau client avec une période d'essai configurée
 */
export const createClientWithTrial = async (client: Omit<Client, 'id' | 'trialStartDate' | 'trialEndDate' | 'isInTrial'>, _businessId: string): Promise<string | null> => {
  // Le paramètre businessId est maintenant préfixé avec underscore (_businessId) pour indiquer qu'il n'est pas utilisé
  try {
    console.log(`[trialManagementService] Début de création d'un client avec période d'essai pour ${client.businessName || 'Nouveau client'}`);
    
    // Solution directe pour forcer 30 jours, quel que soit ce qui est configuré dans le système
    console.log('[trialManagementService] ATTENTION: Forçage direct de la période à 30 jours');
    
    // Paramètres de période d'essai de 30 jours
    let trialDays = 30; // Force directement à 30 jours
    let trialMinutes = 0;
    let periodName = 'Période d\'essai 30 jours';
    let periodId = 'force_30j';
    let periodSource = 'forced';
    
    console.log(`[trialManagementService] Période forcée: ${trialDays} jours`);
    
    // Essai de récupération de la période configurée (pour information uniquement)
    try {
      const activePeriod = await getActiveTrialPeriod();
      if (activePeriod) {
        console.log(`[trialManagementService] Note: Une période configurée existe: ${activePeriod.name} (${activePeriod.days} jours), mais on utilise 30 jours`);
      }
    } catch (error) {
      console.error('[trialManagementService] Erreur lors de la récupération de la période active:', error);
    }
    
    // Calculer la date de fin d'essai en utilisant la période sélectionnée par l'utilisateur
    console.log(`[trialManagementService] Utilisation de la période d'essai sélectionnée: ${periodName} (${trialDays} jours et ${trialMinutes} minutes)`);
    
    const now = Date.now();
    const daysInMs = trialDays * 24 * 60 * 60 * 1000;
    const minutesInMs = trialMinutes * 60 * 1000;
    const trialEndDate = now + daysInMs + minutesInMs;
    
    // Formater la date de fin pour le journal
    const endDate = new Date(trialEndDate);
    const formattedEndDate = endDate.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
    
    // Créer le client avec les informations d'essai
    const clientData = {
      ...client,
      trialStartDate: now,
      trialEndDate,
      isInTrial: true,
      status: 'active',
      createdAt: now,
      // Ajouter des informations sur la période d'essai pour le suivi
      trialInfo: {
        durationDays: trialDays,
        durationMinutes: trialMinutes,
        configId: periodId,
        periodName: periodName,
        formattedEndDate
      }
    };
    
    // Ajouter le client à Firestore
    const clientsRef = collection(db, SAAS_CLIENTS_COLLECTION);
    const docRef = await doc(clientsRef);
    await setDoc(docRef, clientData);
    
    // Journal d'audit amélioré
    console.log(`Client créé avec la période d'essai "${periodName}" (${trialDays} jours et ${trialMinutes} minutes)`);
    console.log(`La période d'essai se terminera le ${formattedEndDate}`);
    
    // Enregistrer l'action dans le journal d'audit si la fonction existe
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Enregistrer la période d'essai utilisée dans le localStorage pour référence
        const trialLog = {
          clientId: docRef.id,
          businessName: client.businessName || 'Sans nom',
          trialDays: trialDays,
          trialMinutes: trialMinutes,
          periodName: periodName,
          periodSource: periodSource,  // Ajout de la source de la période pour le débogage
          startDate: new Date(now).toISOString(),
          endDate: endDate.toISOString(),
          createdAt: new Date().toISOString()
        };
        
        console.log(`[trialManagementService] Période d'essai utilisée (source: ${periodSource}) pour le client ${docRef.id}: ${periodName}`);
        
        // Ajouter au journal des périodes d'essai
        const trialLogsStr = localStorage.getItem('trialCreationLogs') || '[]';
        const trialLogs = JSON.parse(trialLogsStr);
        trialLogs.push(trialLog);
        localStorage.setItem('trialCreationLogs', JSON.stringify(trialLogs));
      }
    } catch (e) {
      console.error('Erreur lors de l\'enregistrement du journal d\'audit:', e);
    }
    
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de la création du client avec période d\'essai:', error);
    return null;
  }
};

/**
 * Simule l'envoi d'une notification d'expiration imminente (3 jours)
 */
const simulateSendExpirationNotification = async (client: Client, daysRemaining: number): Promise<void> => {
  console.log(`Simulation d'envoi de notification d'expiration à ${client.email}`);
  console.log(`Contenu: Votre essai PayeSmart se termine dans ${daysRemaining} jours`);
};

/**
 * Simule l'envoi d'une notification finale d'expiration (1 jour)
 */
const simulateSendFinalExpirationNotification = async (client: Client): Promise<void> => {
  console.log(`Simulation d'envoi de notification finale d'expiration à ${client.email}`);
};

/**
 * Simule l'envoi d'une notification d'essai expiré
 */
const simulateSendExpiredTrialNotification = async (client: Client): Promise<void> => {
  console.log(`Simulation d'envoi de notification d'essai expiré à ${client.email}`);
};
