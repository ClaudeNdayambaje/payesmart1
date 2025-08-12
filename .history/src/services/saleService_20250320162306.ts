import { db } from '../firebase';
import { collection, doc, getDocs, getDoc, addDoc, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { Sale, CartItem, Product } from '../types';
import { updateProductStock } from './productService';

const SALES_COLLECTION = 'sales';

// Interface pour les objets Firestore (avec Timestamp au lieu de Date)
interface FirestorePromotion {
  id: string;
  type: 'percentage' | 'fixed' | 'buyXgetY';
  value: number;
  startDate: Timestamp | null;
  endDate: Timestamp | null;
  description: string;
  buyQuantity?: number;
  getFreeQuantity?: number;
}

interface FirestoreProduct extends Omit<Product, 'promotion'> {
  promotion?: FirestorePromotion;
}

interface FirestoreCartItem {
  quantity: number;
  product: FirestoreProduct;
}

interface FirestoreSale extends Omit<Sale, 'id' | 'timestamp' | 'items'> {
  timestamp: Timestamp;
  items: FirestoreCartItem[];
}

/**
 * Convertit un objet Sale pour Firestore (dates -> timestamps)
 */
const prepareForFirestore = (sale: Omit<Sale, 'id'>): FirestoreSale => {
  // Fonction utilitaire pour convertir une date en Timestamp de manière sécurisée
  const safeTimestamp = (date?: Date): Timestamp | null => {
    if (!date) return null;
    try {
      return Timestamp.fromDate(date);
    } catch (e) {
      console.error('Erreur lors de la conversion de la date:', e);
      return Timestamp.now(); // Utiliser l'heure actuelle en cas d'erreur
    }
  };

  // Fonction pour préparer un produit pour Firestore
  const prepareProduct = (product: Product): FirestoreProduct => {
    const preparedProduct: any = { ...product };
    
    // Gérer les promotions de manière sécurisée
    if (product.promotion) {
      preparedProduct.promotion = {
        ...product.promotion,
        startDate: safeTimestamp(product.promotion.startDate),
        endDate: safeTimestamp(product.promotion.endDate)
      };
    }
    
    return preparedProduct as FirestoreProduct;
  };

  // Créer l'objet FirestoreSale
  return {
    ...sale,
    timestamp: safeTimestamp(sale.timestamp) || Timestamp.now(),
    items: sale.items.map(item => ({
      quantity: item.quantity,
      product: prepareProduct(item.product)
    })),
    // S'assurer que ces champs sont présents
    employeeId: sale.employeeId || '',
    vatAmounts: sale.vatAmounts || { vat6: 0, vat12: 0, vat21: 0 }
  };
};

/**
 * Convertit un document Firestore en objet Sale (timestamps -> dates)
 */
const convertFromFirestore = (doc: any): Sale => {
  const data = doc.data();
  
  // Fonction utilitaire pour convertir un Timestamp en Date de manière sécurisée
  const safeToDate = (timestamp: any): Date => {
    if (!timestamp) return new Date();
    try {
      return timestamp.toDate();
    } catch (e) {
      console.error('Erreur lors de la conversion du timestamp en date:', e);
      return new Date();
    }
  };
  
  // Fonction pour convertir un produit Firestore en produit normal
  const convertProduct = (firestoreProduct: any): Product => {
    const product = { ...firestoreProduct };
    
    // Convertir les promotions si elles existent
    if (product.promotion) {
      product.promotion = {
        ...product.promotion,
        startDate: product.promotion.startDate ? safeToDate(product.promotion.startDate) : new Date(),
        endDate: product.promotion.endDate ? safeToDate(product.promotion.endDate) : new Date()
      };
    }
    
    return product as Product;
  };
  
  return {
    ...data,
    id: doc.id,
    timestamp: safeToDate(data.timestamp),
    items: data.items.map((item: any) => ({
      quantity: item.quantity,
      product: convertProduct(item.product)
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
