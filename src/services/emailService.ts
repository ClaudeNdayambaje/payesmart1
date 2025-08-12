import { db } from '../firebase';
import { collection, addDoc, Timestamp, getDocs } from 'firebase/firestore';

// Collection pour stocker les emails à envoyer
const EMAIL_QUEUE_COLLECTION = 'email_queue';

/**
 * Interface pour les emails en file d'attente
 */
export interface QueuedEmail {
  id?: string;
  to: string;
  subject: string;
  message: string;
  createdAt: number;
  status: 'pending' | 'sent' | 'failed';
  sentAt?: number;
  error?: string;
}

/**
 * Interface pour les options d'email
 */
export interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

/**
 * Envoie un email (ou le met en file d'attente pour envoi)
 * Dans un environnement de production, cette fonction pourrait utiliser une API d'email comme SendGrid, Mailgun, etc.
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    // En environnement de développement, on simule l'envoi d'email en l'ajoutant à une collection Firestore
    const emailData: QueuedEmail = {
      to: options.to,
      subject: options.subject,
      message: options.html || options.text || '',
      createdAt: Date.now(),
      status: 'pending'
    };
    
    // Ajouter l'email à la file d'attente
    await addDoc(collection(db, EMAIL_QUEUE_COLLECTION), {
      ...emailData,
      createdAt: Timestamp.fromDate(new Date(emailData.createdAt))
    });
    
    console.log(`Email ajouté à la file d'attente: ${options.subject} pour ${options.to}`);
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'email à la file d\'attente:', error);
    return false;
  }
};

/**
 * Récupère tous les emails en file d'attente
 * Utile pour afficher les emails "envoyés" en mode développement
 */
export const getQueuedEmails = async (): Promise<QueuedEmail[]> => {
  try {
    const emailsRef = collection(db, EMAIL_QUEUE_COLLECTION);
    const snapshot = await getDocs(emailsRef);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as QueuedEmail));
  } catch (error) {
    console.error('Erreur lors de la récupération des emails en file d\'attente:', error);
    return [];
  }
};
