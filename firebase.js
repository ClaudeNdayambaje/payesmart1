import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, updateDoc, getDoc, query, where, getDocs } from 'firebase/firestore';

// Configuration Firebase - À remplacer avec vos propres valeurs
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "payesmart.firebaseapp.com",
  projectId: "payesmart",
  storageBucket: "payesmart.appspot.com",
  messagingSenderId: "VOTRE_MESSAGING_SENDER_ID",
  appId: "VOTRE_APP_ID"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Sauvegarde une transaction dans Firestore
 * @param {Object} transactionData - Données de la transaction
 * @returns {Promise<string>} ID du document créé
 */
export const saveTransaction = async (transactionData) => {
  try {
    const docRef = await addDoc(collection(db, 'transactions'), {
      ...transactionData,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'initiated'
    });
    
    console.log('Transaction sauvegardée avec ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la transaction:', error);
    throw error;
  }
};

/**
 * Met à jour le statut d'une transaction
 * @param {string} transactionId - ID du document de transaction
 * @param {string} status - Nouveau statut
 * @param {Object} additionalData - Données supplémentaires à mettre à jour
 * @returns {Promise<void>}
 */
export const updateTransactionStatus = async (transactionId, status, additionalData = {}) => {
  try {
    const transactionRef = doc(db, 'transactions', transactionId);
    
    await updateDoc(transactionRef, {
      status,
      updatedAt: new Date(),
      ...additionalData
    });
    
    console.log(`Statut de la transaction ${transactionId} mis à jour: ${status}`);
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du statut de la transaction ${transactionId}:`, error);
    throw error;
  }
};

/**
 * Recherche une transaction par sa sessionId Viva
 * @param {string} sessionId - ID de session Viva
 * @returns {Promise<Object|null>} Document de transaction ou null
 */
export const findTransactionBySessionId = async (sessionId) => {
  try {
    const q = query(
      collection(db, 'transactions'),
      where('sessionId', '==', sessionId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log(`Aucune transaction trouvée avec sessionId: ${sessionId}`);
      return null;
    }
    
    // Retourner la première correspondance
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error(`Erreur lors de la recherche de transaction avec sessionId ${sessionId}:`, error);
    throw error;
  }
};

export default {
  db,
  saveTransaction,
  updateTransactionStatus,
  findTransactionBySessionId
};
