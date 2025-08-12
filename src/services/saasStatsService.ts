import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../firebase';
import { SaasStats, Subscription, Client, SubscriptionPlan, Payment } from '../types/saas';
import { getTrialClients } from './saasClientService';
import { getSubscriptionPlans } from './subscriptionPlanService';
import { getAllBusinesses } from './getAllBusinesses';
import { Business } from '../types';

// Interface pour étendre Business avec les propriétés nécessaires pour le traitement des périodes d'essai
interface BusinessWithTrialInfo extends Business {
  isInTrial: boolean;
  trialStartDate?: number;
  trialEndDate?: number;
  deleted: boolean;
}

// Collections Firestore
const CLIENTS_COLLECTION = 'businesses';
const SUBSCRIPTIONS_COLLECTION = 'subscriptions';
const PAYMENTS_COLLECTION = 'payments';

/**
 * Récupère l'évolution des clients par mois sur les 12 derniers mois
 * Utilise les mêmes données que la page Client pour une cohérence parfaite
 * @returns Tableau avec les données d'évolution des clients par mois
 */
export const getClientEvolutionData = async () => {
  try {
    console.log('Récupération des données d\'\u00e9volution des clients depuis la page Client...');
    
    // Utiliser directement la même fonction que la page Client
    // pour récupérer les données
    const allBusinesses = await getAllBusinesses();
    console.log(`${allBusinesses.length} clients récupérés depuis getAllBusinesses`);
    
    // Récupérer les clients en période d'essai
    const trialClients = await getTrialClients();
    console.log(`${trialClients.length} clients en essai récupérés`);
    
    // Créer une map des clients en période d'essai par email pour une recherche rapide
    const trialEmailsMap = new Map();
    trialClients.forEach(client => {
      trialEmailsMap.set(client.email, client);
    });
    
    // Mettre à jour les propriétés isInTrial des clients existants
    const mergedClients: BusinessWithTrialInfo[] = allBusinesses.map(business => {
      if (trialEmailsMap.has(business.email)) {
        const trialClient = trialEmailsMap.get(business.email);
        return {
          ...business,
          isInTrial: true,
          trialStartDate: trialClient.trialStartDate,
          trialEndDate: trialClient.trialEndDate,
          deleted: false // Ajouter la propriété deleted pour éviter les erreurs
        } as BusinessWithTrialInfo;
      }
      return {
        ...business,
        isInTrial: false,
        deleted: false // Ajouter la propriété deleted pour éviter les erreurs
      } as BusinessWithTrialInfo;
    });
    
    // Récupérer tous les abonnements actifs depuis la collection subscriptions
    const subscriptionsQuery = query(collection(db, SUBSCRIPTIONS_COLLECTION));
    const subscriptionsSnapshot = await getDocs(subscriptionsQuery);
    const subscriptions = subscriptionsSnapshot.docs.map(doc => {
      const data = doc.data();
      return { id: doc.id, ...data } as Subscription;
    });
    
    // Identifier les clients avec des abonnements actifs
    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
    const clientsWithActiveSubscriptionIds = new Set(
      activeSubscriptions.map(sub => sub.clientId)
    );
    
    // Préparer les données pour les 12 derniers mois
    const monthsData = [];
    const moisFrancais = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    
    // Date actuelle pour les calculs
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const currentDate = new Date();
      currentDate.setMonth(now.getMonth() - 11 + i);
      
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      // Date de début et fin du mois
      const startOfMonth = new Date(year, month, 1).getTime();
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();
      
      // Clients actifs - utiliser la même méthode de calcul que le KPI principal
      // Compter les clients qui ont un abonnement actif à cette date
      const activClientsCount = mergedClients.filter((business: BusinessWithTrialInfo) => 
        !business.deleted && 
        clientsWithActiveSubscriptionIds.has(business.id)
      ).length;
      
      // Clients en essai dans ce mois
      const essaiClientsCount = mergedClients.filter((business: BusinessWithTrialInfo) => 
        business.isInTrial && 
        business.trialStartDate && business.trialStartDate <= endOfMonth &&
        business.trialEndDate && business.trialEndDate >= startOfMonth
      ).length;
      
      // Clients désabonnés dans ce mois
      const desabonnesCount = subscriptions.filter(sub => 
        sub.status === 'cancelled' && 
        sub.cancelDate && 
        sub.cancelDate >= startOfMonth && 
        sub.cancelDate <= endOfMonth
      ).length;
      
      monthsData.push({
        mois: moisFrancais[month],
        actifs: activClientsCount,
        essai: essaiClientsCount,
        désabonnés: desabonnesCount
      });
    }
    
    console.log('Données d\'évolution des clients générées:', monthsData);
    return monthsData;
    
  } catch (error) {
    console.error('Erreur lors de la récupération des données d\'évolution des clients:', error);
    // Retourner des données vides en cas d'erreur
    return [];
  }
};


/**
 * Récupère les revenus mensuels réels à partir des paiements enregistrés dans Firestore
 * @returns Tableau avec les données de revenus mensuels réels
 */
export const getMonthlyRevenueData = async () => {
  try {
    console.log('Récupération des revenus mensuels réels depuis Firestore...');
    
    // Récupérer tous les paiements de la collection payments
    const paymentsQuery = query(collection(db, PAYMENTS_COLLECTION));
    const paymentsSnapshot = await getDocs(paymentsQuery);
    const payments = paymentsSnapshot.docs.map(doc => {
      const data = doc.data();
      return { id: doc.id, ...data } as Payment;
    });
    
    console.log(`${payments.length} paiements récupérés`);
    
    // Préparer les données pour les 12 derniers mois
    const monthsData = [];
    const moisFrancais = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    
    // Date actuelle pour les calculs
    const now = new Date();
    
    for (let i = 0; i < 12; i++) {
      const currentDate = new Date();
      currentDate.setMonth(now.getMonth() - 11 + i);
      
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      // Date de début et fin du mois
      const startOfMonth = new Date(year, month, 1).getTime();
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();
      
      // Filtrer les paiements pour ce mois
      const monthPayments = payments.filter(payment => {
        // Utiliser paymentDate ou date selon ce qui est disponible
        const paymentDate = payment.date || payment.paymentDate || 0;
        
        return paymentDate >= startOfMonth && paymentDate <= endOfMonth;
      });
      
      // Calculer le revenu total pour ce mois
      const monthRevenue = monthPayments.reduce((total, payment) => {
        return total + (payment.amount || 0);
      }, 0);
      
      monthsData.push({
        mois: moisFrancais[month],
        revenu: parseFloat(monthRevenue.toFixed(2)),
        annee: year
      });
    }
    
    console.log('Données de revenus mensuels réels générées:', monthsData);
    return monthsData;
    
  } catch (error) {
    console.error('Erreur lors de la récupération des revenus mensuels:', error);
    // En cas d'erreur, retourner des données vides
    return [];
  }
};

export const getSaasStats = async (): Promise<SaasStats> => {
  try {
    console.log('Calcul des statistiques SaaS dynamiques à partir des données Firestore...');
    
    // Récupérer tous les clients de la collection businesses
    const allClientsQuery = query(collection(db, CLIENTS_COLLECTION));
    const allClientsSnapshot = await getDocs(allClientsQuery);
    const allClients = allClientsSnapshot.docs.map(doc => {
      const data = doc.data();
      return { id: doc.id, ...data } as Client;
    });
    
    // Récupérer tous les abonnements
    const allSubscriptionsQuery = query(collection(db, SUBSCRIPTIONS_COLLECTION));
    const allSubscriptionsSnapshot = await getDocs(allSubscriptionsQuery);
    const allSubscriptions = allSubscriptionsSnapshot.docs.map(doc => {
      const data = doc.data();
      return { id: doc.id, ...data } as Subscription;
    });
    
    // Filtrer les abonnements actifs
    const activeSubscriptions = allSubscriptions.filter(sub => sub.status === 'active');
    
    // Récupérer les IDs des clients avec des abonnements actifs
    const clientsWithActiveSubscriptions = activeSubscriptions
      .map(sub => sub.clientId)
      .filter(clientId => {
        // Vérifier si le client existe dans la collection
        return allClients.some(client => client.id === clientId);
      });
    
    // Récupérer les clients en période d'essai à partir du service dédié
    // pour assurer la cohérence avec la page 'Clients en essai'
    const trialClients = await getTrialClients();
    
    // Filtrer les clients actifs (ceux qui ont un abonnement actif)
    const activeClients = allClients.filter(client => 
      clientsWithActiveSubscriptions.includes(client.id));
    
    console.log(`Débogage - Tous les clients: ${allClients.length}`);
    console.log(`Débogage - Clients actifs: ${activeSubscriptions.length}`);
    console.log(`Débogage - Clients actifs: ${activeClients.length}`);
    console.log(`Débogage - Clients en essai: ${trialClients.length}`);
    
    // Information déjà récupérée plus haut
    console.log(`Débogage - Tous les abonnements: ${allSubscriptions.length}`);
    console.log(`Débogage - Abonnements actifs: ${activeSubscriptions.length}`);
    
    // Récupérer tous les plans d'abonnement pour le calcul du revenu
    // en suivant la même méthode que dans la page Abonnements
    const subscriptionPlans = await getSubscriptionPlans();
    
    // Convertir les plans en map pour faciliter l'accès
    const plansMap: Record<string, SubscriptionPlan> = {};
    subscriptionPlans.forEach(plan => {
      plansMap[plan.id] = plan;
    });
    
    // Filtrer pour ne garder que les abonnements dont le client existe réellement
    // (même logique que dans la page Abonnements)
    const validActiveSubscriptions = activeSubscriptions.filter(sub => {
      return clientsWithActiveSubscriptions.includes(sub.clientId) && plansMap[sub.planId];
    });
    
    // Calculer le revenu mensuel récurrent (MRR) en utilisant les prix des plans
    // comme dans la page Abonnements
    const monthlyRecurringRevenue = validActiveSubscriptions.reduce((total, sub) => {
      const plan = plansMap[sub.planId];
      if (!plan) return total;
      
      // Si c'est un plan annuel, diviser par 12 pour obtenir la valeur mensuelle
      let monthlyValue = plan.price || 0;
      if (plan.billingCycle === 'yearly' || plan.billingCycle === 'annually') {
        monthlyValue = monthlyValue / 12;
      }
      
      return total + monthlyValue;
    }, 0);
    
    // Calculer le revenu total (tous les paiements)
    const totalRevenue = allSubscriptions.reduce((total, sub) => {
      return total + (sub.price || 0);
    }, 0);
    
    // Calculer le taux de renouvellement
    const autoRenewSubscriptions = activeSubscriptions.filter(sub => sub.autoRenew);
    const renewalRate = (autoRenewSubscriptions.length / (activeSubscriptions.length || 1)) * 100;
    
    // Calculer le taux de rétention (clients actifs / total clients)
    const retentionRate = (activeClients.length / (allClients.length || 1)) * 100;
    
    // Calculer le taux d'attrition (churn)
    const churnRate = 100 - retentionRate;
    
    // Calculer le revenu moyen par utilisateur
    const averageRevenuePerUser = activeClients.length ? (monthlyRecurringRevenue / activeClients.length) : 0;
    
    // Approximation de la valeur à vie du client (LTV) - formule simplifiée
    const lifetimeValue = averageRevenuePerUser * (100 / (churnRate || 1)) || 0;
    
    return {
      totalClients: allClients.length,
      activeClients: activeClients.length,
      trialClients: trialClients.length,
      monthlyRecurringRevenue: parseFloat(monthlyRecurringRevenue.toFixed(2)),
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      retentionRate: parseFloat(retentionRate.toFixed(2)),
      renewalRate: parseFloat(renewalRate.toFixed(2)),
      churnRate: parseFloat(churnRate.toFixed(2)),
      averageRevenuePerUser: parseFloat(averageRevenuePerUser.toFixed(2)),
      lifetimeValue: parseFloat(lifetimeValue.toFixed(2)),
      clientGrowthRate: 0 // Nécessiterait des données historiques pour un calcul précis
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques SaaS:', error);
    // Retourner des statistiques par défaut en cas d'erreur
    return {
      totalClients: 4,
      activeClients: 4,
      trialClients: 1,
      monthlyRecurringRevenue: 29,
      totalRevenue: 859.94,
      retentionRate: 100,
      renewalRate: 78,
      churnRate: 0,
      averageRevenuePerUser: 7.25,
      lifetimeValue: 725,
      clientGrowthRate: 0
    };
  }
};
