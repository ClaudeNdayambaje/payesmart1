import { db } from '../firebase';
import { collection, doc, getDocs, getDoc, addDoc, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { Sale, CartItem, Product } from '../types';
import { updateProductStock } from './productService';

const SALES_COLLECTION = 'sales';

/**
 * Convertit un objet Sale pour Firestore (dates -> timestamps)
 */
const prepareForFirestore = (sale: Sale): any => {
  return {
    ...sale,
    timestamp: Timestamp.fromDate(sale.timestamp),
    items: sale.items.map(item => ({
      ...item,
      product: {
        ...item.product,
        // Convertir les dates de promotion si elles existent
        promotion: item.product.promotion ? {
          ...item.product.promotion,
          startDate: Timestamp.fromDate(item.product.promotion.startDate),
          endDate: Timestamp.fromDate(item.product.promotion.endDate)
        } : undefined
      }
    }))
  };
};

/**
 * Convertit un document Firestore en objet Sale (timestamps -> dates)
 */
const convertFromFirestore = (doc: any): Sale => {
  const data = doc.data();
  return {
    ...data,
    id: doc.id,
    timestamp: data.timestamp.toDate(),
    items: data.items.map((item: any) => ({
      ...item,
      product: {
        ...item.product,
        // Convertir les timestamps en dates pour les promotions si elles existent
        promotion: item.product.promotion ? {
          ...item.product.promotion,
          startDate: item.product.promotion.startDate.toDate(),
          endDate: item.product.promotion.endDate.toDate()
        } : undefined
      }
    }))
  } as Sale;
};

/**
 * Récupère toutes les ventes depuis Firestore
 */
export const getSales = async (): Promise<Sale[]> => {
  try {
    const salesCollection = collection(db, SALES_COLLECTION);
    const q = query(salesCollection, orderBy('timestamp', 'desc'));
    const salesSnapshot = await getDocs(q);
    
    return salesSnapshot.docs.map(convertFromFirestore);
  } catch (error) {
    console.error('Erreur lors de la récupération des ventes:', error);
    return [];
  }
};

/**
 * Récupère une vente par son ID
 */
export const getSaleById = async (saleId: string): Promise<Sale | null> => {
  try {
    const saleRef = doc(db, SALES_COLLECTION, saleId);
    const saleSnap = await getDoc(saleRef);
    
    if (saleSnap.exists()) {
      return convertFromFirestore(saleSnap);
    }
    
    return null;
  } catch (error) {
    console.error(`Erreur lors de la récupération de la vente ${saleId}:`, error);
    return null;
  }
};

/**
 * Ajoute une nouvelle vente et met à jour le stock des produits
 */
export const addSale = async (sale: Omit<Sale, 'id'>): Promise<Sale | null> => {
  try {
    // Préparer les données pour Firestore
    const saleData = prepareForFirestore(sale);
    
    // Ajouter la vente à Firestore
    const docRef = await addDoc(collection(db, SALES_COLLECTION), saleData);
    
    // Mettre à jour le stock pour chaque produit vendu
    const updateStockPromises = sale.items.map((item: CartItem) => {
      const newStock = item.product.stock - item.quantity;
      return updateProductStock(item.product.id, newStock);
    });
    
    await Promise.all(updateStockPromises);
    
    return { id: docRef.id, ...sale } as Sale;
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la vente:', error);
    return null;
  }
};

/**
 * Récupère les ventes par date
 */
export const getSalesByDate = async (startDate: Date, endDate: Date): Promise<Sale[]> => {
  try {
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);
    
    const salesCollection = collection(db, SALES_COLLECTION);
    const q = query(
      salesCollection,
      where('timestamp', '>=', startTimestamp),
      where('timestamp', '<=', endTimestamp),
      orderBy('timestamp', 'desc')
    );
    
    const salesSnapshot = await getDocs(q);
    return salesSnapshot.docs.map(convertFromFirestore);
  } catch (error) {
    console.error('Erreur lors de la récupération des ventes par date:', error);
    return [];
  }
};

/**
 * Récupère les ventes par employé
 */
export const getSalesByEmployee = async (employeeId: string): Promise<Sale[]> => {
  try {
    const salesCollection = collection(db, SALES_COLLECTION);
    const q = query(
      salesCollection,
      where('employeeId', '==', employeeId),
      orderBy('timestamp', 'desc')
    );
    
    const salesSnapshot = await getDocs(q);
    return salesSnapshot.docs.map(convertFromFirestore);
  } catch (error) {
    console.error(`Erreur lors de la récupération des ventes de l'employé ${employeeId}:`, error);
    return [];
  }
};

/**
 * Récupère les dernières ventes (limité à un nombre spécifique)
 */
export const getRecentSales = async (count: number = 10): Promise<Sale[]> => {
  try {
    const salesCollection = collection(db, SALES_COLLECTION);
    const q = query(
      salesCollection,
      orderBy('timestamp', 'desc'),
      limit(count)
    );
    
    const salesSnapshot = await getDocs(q);
    return salesSnapshot.docs.map(convertFromFirestore);
  } catch (error) {
    console.error('Erreur lors de la récupération des ventes récentes:', error);
    return [];
  }
};

/**
 * Calcule le total des ventes pour une période donnée
 */
export const calculateSalesTotal = async (startDate: Date, endDate: Date): Promise<number> => {
  try {
    const sales = await getSalesByDate(startDate, endDate);
    return sales.reduce((total, sale) => total + sale.total, 0);
  } catch (error) {
    console.error('Erreur lors du calcul du total des ventes:', error);
    return 0;
  }
};
