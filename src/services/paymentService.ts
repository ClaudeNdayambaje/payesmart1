import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, orderBy, Timestamp, getDoc } from 'firebase/firestore';
import { Payment } from '../types/saas';

// Collection Firestore
const PAYMENTS_COLLECTION = 'payments';

// Obtenir tous les paiements
export const getPayments = async (): Promise<Payment[]> => {
  try {
    const paymentsQuery = query(
      collection(db, PAYMENTS_COLLECTION),
      orderBy('paymentDate', 'desc')
    );
    
    const snapshot = await getDocs(paymentsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Payment));
  } catch (error) {
    console.error('Erreur lors de la récupération des paiements:', error);
    throw error;
  }
};

// Obtenir les paiements d'un client
export const getClientPayments = async (clientId: string): Promise<Payment[]> => {
  try {
    // Retirer le orderBy pour éviter le besoin d'un index composite
    const paymentsQuery = query(
      collection(db, PAYMENTS_COLLECTION),
      where('clientId', '==', clientId)
      // Pas de orderBy pour éviter l'erreur d'index manquant
    );
    
    const snapshot = await getDocs(paymentsQuery);
    const results = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Payment));
    
    // Tri côté client
    return results.sort((a, b) => {
      const dateA = a.paymentDate || 0;
      const dateB = b.paymentDate || 0;
      return dateB - dateA; // Tri décroissant par date de paiement
    });
  } catch (error) {
    console.error(`Erreur lors de la récupération des paiements du client ${clientId}:`, error);
    // En cas d'erreur, renvoyer un tableau vide pour ne pas bloquer la suppression
    return [];
  }
};

// Obtenir les paiements d'un abonnement
export const getSubscriptionPayments = async (subscriptionId: string): Promise<Payment[]> => {
  try {
    const paymentsQuery = query(
      collection(db, PAYMENTS_COLLECTION),
      where('subscriptionId', '==', subscriptionId),
      orderBy('paymentDate', 'desc')
    );
    
    const snapshot = await getDocs(paymentsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Payment));
  } catch (error) {
    console.error(`Erreur lors de la récupération des paiements de l'abonnement ${subscriptionId}:`, error);
    throw error;
  }
};

// Ajouter un nouveau paiement
export const addPayment = async (paymentData: Omit<Payment, 'id'>): Promise<Payment> => {
  try {
    const docRef = await addDoc(collection(db, PAYMENTS_COLLECTION), paymentData);
    
    return {
      id: docRef.id,
      ...paymentData
    } as Payment;
  } catch (error) {
    console.error('Erreur lors de l\'ajout du paiement:', error);
    throw error;
  }
};

// Mettre à jour un paiement
export const updatePayment = async (paymentId: string, paymentData: Partial<Payment>): Promise<void> => {
  try {
    const paymentRef = doc(db, PAYMENTS_COLLECTION, paymentId);
    await updateDoc(paymentRef, paymentData);
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du paiement ${paymentId}:`, error);
    throw error;
  }
};

// Marquer un paiement comme complété
export const markPaymentAsCompleted = async (paymentId: string, transactionId: string): Promise<void> => {
  try {
    const paymentRef = doc(db, PAYMENTS_COLLECTION, paymentId);
    await updateDoc(paymentRef, {
      status: 'completed',
      transactionId
    });
  } catch (error) {
    console.error(`Erreur lors du marquage du paiement ${paymentId} comme complété:`, error);
    throw error;
  }
};

// Marquer un paiement comme remboursé
export const refundPayment = async (paymentId: string, notes?: string): Promise<void> => {
  try {
    const paymentRef = doc(db, PAYMENTS_COLLECTION, paymentId);
    await updateDoc(paymentRef, {
      status: 'refunded',
      notes: notes || 'Remboursement effectué'
    });
  } catch (error) {
    console.error(`Erreur lors du remboursement du paiement ${paymentId}:`, error);
    throw error;
  }
};
