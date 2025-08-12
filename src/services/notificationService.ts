import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs, Timestamp, serverTimestamp } from 'firebase/firestore';
import { sendEmail } from './emailService';

// Collection pour les notifications
const NOTIFICATIONS_COLLECTION = 'notifications';
const CLIENTS_COLLECTION = 'clients';

// Types de notifications
export enum NotificationType {
  TRIAL_EXPIRING_SOON = 'trial_expiring_soon',
  TRIAL_EXPIRED = 'trial_expired',
  PAYMENT_DUE = 'payment_due',
  SYSTEM = 'system'
}

// Interface pour une notification
export interface Notification {
  id?: string;
  type: NotificationType;
  title: string;
  message: string;
  recipientId: string;
  recipientEmail?: string;
  isRead: boolean;
  createdAt: Date | Timestamp;
  expiresAt?: Date | Timestamp;
  data?: any;
}

/**
 * Crée une nouvelle notification
 * @param notification La notification à créer
 * @returns L'ID de la notification créée
 */
export const createNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Promise<string> => {
  try {
    const notificationData = {
      ...notification,
      isRead: false,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), notificationData);
    console.log(`Notification créée avec l'ID: ${docRef.id}`);
    
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error);
    throw error;
  }
};

/**
 * Envoie une notification par email et crée une entrée dans la base de données
 * @param notification La notification à envoyer
 * @param sendEmailNotification Si true, envoie également un email
 * @returns L'ID de la notification créée
 */
export const sendNotification = async (
  notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>, 
  sendEmailNotification: boolean = true
): Promise<string> => {
  try {
    // Créer la notification dans la base de données
    const notificationId = await createNotification(notification);
    
    // Envoyer un email si demandé et si l'email du destinataire est disponible
    if (sendEmailNotification && notification.recipientEmail) {
      await sendEmail({
        to: notification.recipientEmail,
        subject: notification.title,
        html: notification.message
      });
      console.log(`Email de notification envoyé à ${notification.recipientEmail}`);
    }
    
    return notificationId;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification:', error);
    throw error;
  }
};

/**
 * Vérifie les périodes d'essai qui expirent bientôt et envoie des notifications
 * @param daysBeforeExpiration Nombre de jours avant l'expiration pour envoyer la notification
 */
export const checkTrialExpirations = async (daysBeforeExpiration: number = 3): Promise<void> => {
  try {
    const now = new Date();
    
    // Calculer la date limite pour les notifications (maintenant + jours spécifiés)
    const expirationThreshold = new Date();
    expirationThreshold.setDate(now.getDate() + daysBeforeExpiration);
    
    // Requête pour trouver les clients dont la période d'essai expire bientôt
    const clientsQuery = query(
      collection(db, CLIENTS_COLLECTION),
      where('isInTrial', '==', true),
      where('trialEndDate', '<=', expirationThreshold),
      where('trialEndDate', '>', now)
    );
    
    const clientsSnapshot = await getDocs(clientsQuery);
    
    // Pour chaque client, créer et envoyer une notification
    const notificationPromises = clientsSnapshot.docs.map(async (doc) => {
      const clientData = doc.data();
      const clientId = doc.id;
      const trialEndDate = clientData.trialEndDate.toDate();
      const daysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Créer le message de notification
      const title = `Votre période d'essai expire bientôt`;
      const message = `
        <p>Bonjour ${clientData.contactName || 'Cher client'},</p>
        <p>Votre période d'essai de PayeSmart se termine dans <strong>${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}</strong> (le ${trialEndDate.toLocaleDateString()}).</p>
        <p>Pour continuer à utiliser tous les avantages de PayeSmart, veuillez souscrire à l'un de nos plans d'abonnement.</p>
        <p>Connectez-vous à votre compte pour voir nos offres ou contactez notre équipe commerciale pour plus d'informations.</p>
        <p>Cordialement,<br>L'équipe PayeSmart</p>
      `;
      
      // Envoyer la notification
      return sendNotification({
        type: NotificationType.TRIAL_EXPIRING_SOON,
        title,
        message,
        recipientId: clientId,
        recipientEmail: clientData.email,
        data: {
          trialEndDate,
          daysRemaining
        },
        expiresAt: trialEndDate
      });
    });
    
    await Promise.all(notificationPromises);
    console.log(`Vérification des expirations de périodes d'essai terminée. ${notificationPromises.length} notifications envoyées.`);
  } catch (error) {
    console.error('Erreur lors de la vérification des expirations de périodes d\'essai:', error);
    throw error;
  }
};

/**
 * Récupère les notifications non lues pour un client
 * @param clientId ID du client
 * @returns Liste des notifications non lues
 */
export const getUnreadNotifications = async (clientId: string): Promise<Notification[]> => {
  try {
    const notificationsQuery = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('recipientId', '==', clientId),
      where('isRead', '==', false)
    );
    
    const notificationsSnapshot = await getDocs(notificationsQuery);
    
    return notificationsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Notification[];
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications non lues:', error);
    return [];
  }
};
