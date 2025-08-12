import { db } from '../firebase';
import { collection, doc, addDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { CartItem } from '../types';
import { getSaleById } from './saleService';
import { getCurrentBusinessId } from '../utils/authUtils';

const REFUNDS_COLLECTION = 'refunds';
const SALES_COLLECTION = 'sales';

// Interface pour le remboursement
export interface Refund {
  id: string;
  saleId: string;
  refundedItems: CartItem[];
  refundAmount: number;
  refundMethod: 'cash' | 'card';
  timestamp: Date;
  employeeId: string;
  businessId: string;
  fullRefund: boolean;
}

/**
 * Effectue un remboursement pour une vente
 * @param saleId ID de la vente à rembourser
 * @param refundItems Articles à rembourser
 * @param refundMethod Méthode de remboursement (cash ou card)
 * @param employeeId ID de l'employé qui effectue le remboursement
 * @param fullRefund Indique si c'est un remboursement total
 * @returns L'objet de remboursement créé
 */
export const processRefund = async (
  saleId: string,
  refundItems: CartItem[],
  refundMethod: 'cash' | 'card',
  employeeId: string,
  fullRefund: boolean
): Promise<Refund | null> => {
  try {
    // Récupérer la vente originale
    const sale = await getSaleById(saleId);
    
    if (!sale) {
      console.error('Vente non trouvée:', saleId);
      throw new Error('Vente non trouvée');
    }
    
    // Calculer le montant du remboursement
    const refundAmount = refundItems.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
    
    // Obtenir l'ID de l'entreprise
    const businessId = await getCurrentBusinessId();
    
    // Créer l'objet de remboursement
    const refund: Omit<Refund, 'id'> = {
      saleId,
      refundedItems: refundItems,
      refundAmount,
      refundMethod,
      timestamp: new Date(),
      employeeId,
      businessId: businessId || sale.businessId,
      fullRefund
    };
    
    // Préparer les données pour Firestore
    const refundData = {
      ...refund,
      timestamp: Timestamp.fromDate(refund.timestamp)
    };
    
    // Ajouter le remboursement à la collection des remboursements
    const refundRef = await addDoc(collection(db, REFUNDS_COLLECTION), refundData);
    
    // Mettre à jour la vente originale pour indiquer qu'elle a été remboursée
    const saleRef = doc(db, SALES_COLLECTION, saleId);
    await updateDoc(saleRef, {
      refunded: true,
      refundId: refundRef.id,
      refundedItems: refundItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      })),
      refundAmount,
      refundTimestamp: Timestamp.fromDate(new Date()),
      refundMethod,
      fullRefund
    });
    
    // Retourner l'objet de remboursement avec son ID
    return {
      id: refundRef.id,
      ...refund
    };
  } catch (error) {
    console.error('Erreur lors du remboursement:', error);
    return null;
  }
};

/**
 * Récupère l'historique des remboursements pour une entreprise
 * @param businessId ID de l'entreprise - paramètre conservé pour l'implémentation future
 * @returns Liste des remboursements
 */
export const getRefundsHistory = async (businessId: string): Promise<Refund[]> => {
  try {
    // Récupérer les remboursements de la collection 'refunds' pour cette entreprise
    // Cette référence est déclarée mais non utilisée pour l'instant
    // Elle sera utilisée dans une implémentation future pour récupérer les données
    // const refundsRef = collection(db, 'businesses', businessId, 'refunds');
    
    // Note: Cette fonction est préparée pour une implémentation future
    // Pour l'instant, nous retournons un tableau vide
    return [];
  } catch (error) {
    console.error('Erreur lors de la récupération des remboursements:', error);
    return [];
  }
};
