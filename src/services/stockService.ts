import { db } from '../firebase';
import { collection, doc, getDocs, getDoc, addDoc, query, where, Timestamp } from 'firebase/firestore';
import { StockMovement, StockAdjustment } from '../types';
import { setProductStockAbsolute } from './productService';
import { getCurrentBusinessId } from './businessService';
import { emitEvent } from './eventService';

const STOCK_MOVEMENTS_COLLECTION = 'stockMovements';

/**
 * Prépare les données pour Firestore en convertissant les dates en Timestamp
 */
const prepareForFirestore = (data: any) => {
  const result = { ...data };
  
  // Convertir les dates en Timestamp
  if (result.timestamp && result.timestamp instanceof Date) {
    result.timestamp = Timestamp.fromDate(result.timestamp);
  }
  
  return result;
};

/**
 * Ajoute un mouvement de stock à Firestore
 */
const addStockMovement = async (movement: Omit<StockMovement, 'id'>): Promise<StockMovement | null> => {
  try {
    const movementData = prepareForFirestore(movement);
    const docRef = await addDoc(collection(db, STOCK_MOVEMENTS_COLLECTION), movementData);
    return { id: docRef.id, ...movement } as StockMovement;
  } catch (error) {
    console.error('Erreur lors de l\'ajout du mouvement de stock:', error);
    return null;
  }
};

/**
 * Récupère tous les mouvements de stock depuis Firestore
 */
const getStockMovements = async (): Promise<StockMovement[]> => {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      console.error('Aucun utilisateur connecté');
      return [];
    }
    
    console.log('Récupération des mouvements de stock pour businessId:', businessId);
    
    const stockMovementsCollection = collection(db, STOCK_MOVEMENTS_COLLECTION);
    
    // Requête sans orderBy pour éviter l'erreur d'index
    const q = query(
      stockMovementsCollection, 
      where('businessId', '==', businessId)
    );
    
    console.log('Exécution de la requête sans tri pour éviter l\'erreur d\'index');
    const stockMovementsSnapshot = await getDocs(q);
    
    // Récupérer les données sans tri dans Firestore
    const movements = stockMovementsSnapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data,
        timestamp: data.timestamp.toDate()
      } as StockMovement;
    });
    
    console.log(`${movements.length} mouvements de stock récupérés avec succès`);
    
    // Trier côté client
    return movements.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  } catch (error) {
    console.error('Erreur lors de la récupération des mouvements de stock:', error);
    return [];
  }
};

/**
 * Récupère les mouvements de stock pour un produit spécifique
 */
const getStockMovementsByProduct = async (productId: string): Promise<StockMovement[]> => {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      console.error('Aucun utilisateur connecté');
      return [];
    }
    
    console.log(`Récupération des mouvements de stock pour le produit ${productId}`);
    
    const stockMovementsCollection = collection(db, STOCK_MOVEMENTS_COLLECTION);
    
    // Requête sans orderBy pour éviter l'erreur d'index
    const q = query(
      stockMovementsCollection, 
      where('businessId', '==', businessId),
      where('productId', '==', productId)
    );
    
    console.log('Exécution de la requête sans tri pour éviter l\'erreur d\'index');
    const stockMovementsSnapshot = await getDocs(q);
    
    // Récupérer les données sans tri dans Firestore
    const movements = stockMovementsSnapshot.docs.map(doc => {
      const data = doc.data();
      return { 
        id: doc.id, 
        ...data,
        timestamp: data.timestamp.toDate()
      } as StockMovement;
    });
    
    console.log(`${movements.length} mouvements de stock récupérés pour le produit ${productId}`);
    
    // Trier côté client
    return movements.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  } catch (error) {
    console.error(`Erreur lors de la récupération des mouvements de stock pour le produit ${productId}:`, error);
    return [];
  }
};

/**
 * Ajuste le stock d'un produit et enregistre le mouvement
 */
const adjustStock = async (
  adjustment: Omit<StockAdjustment, 'businessId'>, 
  currentStock?: number
): Promise<StockMovement | null> => {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      console.error('Aucun utilisateur connecté, impossible d\'ajuster le stock');
      return null;
    }
    
    console.log('Ajustement du stock avec businessId:', businessId);
    
    // Si le stock actuel n'est pas fourni, récupérer le produit
    let previousStock = currentStock || 0; // Valeur par défaut à 0 pour éviter undefined
    
    if (currentStock === undefined) {
      // Récupérer le produit pour obtenir le stock actuel
      const productRef = doc(db, 'products', adjustment.productId);
      const productSnap = await getDoc(productRef);
      
      if (!productSnap.exists()) {
        throw new Error(`Produit ${adjustment.productId} non trouvé`);
      }
      
      const productData = productSnap.data();
      previousStock = productData.stock || 0;
    }
    
    // Calculer le nouveau stock
    const newStock = previousStock + adjustment.quantity;
    
    // Mettre à jour le stock du produit avec une valeur absolue
    await setProductStockAbsolute(adjustment.productId, newStock);
    
    // Créer le mouvement de stock avec businessId
    const movement: Omit<StockMovement, 'id'> = {
      productId: adjustment.productId,
      type: adjustment.type,
      quantity: adjustment.quantity,
      previousStock,
      newStock,
      timestamp: new Date(),
      reason: adjustment.reason || '',
      employeeId: adjustment.employeeId || '',
      reference: adjustment.reference || '',
      businessId
    };
    
    console.log('Création du mouvement de stock:', movement);
    
    // Ajouter le mouvement à Firestore
    const newMovement = await addStockMovement(movement);
    
    // Émettre un événement pour notifier les composants de la mise à jour du stock
    emitEvent('stockUpdated', {
      productId: adjustment.productId,
      newStock,
      previousStock,
      movement: newMovement
    });
    
    return newMovement;
  } catch (error) {
    console.error('Erreur lors de l\'ajustement du stock:', error);
    return null;
  }
};

export {
  addStockMovement,
  getStockMovements,
  getStockMovementsByProduct,
  adjustStock
};
