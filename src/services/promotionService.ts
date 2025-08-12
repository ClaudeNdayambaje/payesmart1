import { db } from '../firebase';
import { collection, doc, getDocs, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { Product, Promotion } from '../types';

const PRODUCTS_COLLECTION = 'products';

/**
 * Normalise les données de promotion pour assurer la cohérence
 */
export const normalizePromotion = (promotion: any): Promotion | undefined => {
  if (!promotion) return undefined;
  
  // Convertir les dates Firestore en objets Date JavaScript
  let startDate = promotion.startDate;
  let endDate = promotion.endDate;
  
  // Si c'est un Timestamp Firestore
  if (startDate && typeof startDate.toDate === 'function') {
    startDate = startDate.toDate();
  } else if (startDate) {
    startDate = new Date(startDate);
  }
  
  if (endDate && typeof endDate.toDate === 'function') {
    endDate = endDate.toDate();
  } else if (endDate) {
    endDate = new Date(endDate);
  }
  
  return {
    ...promotion,
    startDate,
    endDate,
    value: Number(promotion.value),
    buyQuantity: promotion.buyQuantity ? Number(promotion.buyQuantity) : 0,
    getFreeQuantity: promotion.getFreeQuantity ? Number(promotion.getFreeQuantity) : 0,
  };
};

/**
 * Récupère toutes les promotions actives
 */
export const getActivePromotions = async (): Promise<{ product: Product, promotion: Promotion }[]> => {
  try {
    const productsCollection = collection(db, PRODUCTS_COLLECTION);
    const productsSnapshot = await getDocs(productsCollection);
    
    const now = new Date();
    const productsWithPromotions = productsSnapshot.docs
      .map(doc => {
        const data = doc.data();
        // Normaliser la promotion si elle existe
        if (data.promotion) {
          data.promotion = normalizePromotion(data.promotion);
        }
        return { id: doc.id, ...data } as Product;
      })
      .filter(product => 
        product.promotion && 
        product.promotion.startDate <= now && 
        product.promotion.endDate >= now
      )
      .map(product => ({
        product,
        promotion: product.promotion as Promotion
      }));
    
    return productsWithPromotions;
  } catch (error) {
    console.error('Erreur lors de la récupération des promotions actives:', error);
    return [];
  }
};

/**
 * Ajoute ou met à jour une promotion pour un produit
 */
export const updateProductPromotion = async (
  productId: string, 
  promotion: Promotion | undefined
): Promise<boolean> => {
  try {
    console.log('Mise à jour de la promotion pour le produit', productId);
    console.log('Promotion:', promotion);
    
    // Vérifier si l'ID du produit est valide
    if (!productId) {
      console.error('ID de produit non valide');
      return false;
    }
    
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    
    // Vérifier si le produit existe
    const productDoc = await getDoc(productRef);
    if (!productDoc.exists()) {
      console.error(`Le produit avec l'ID ${productId} n'existe pas`);
      return false;
    }
    
    // Si la promotion est undefined, nous la supprimons
    if (!promotion) {
      console.log('Suppression de la promotion');
      await updateDoc(productRef, { promotion: null });
      return true;
    }
    
    // Vérifier que la promotion a une valeur
    if (promotion.value === undefined || promotion.value === null) {
      console.error('La promotion n\'a pas de valeur valide');
      return false;
    }
    
    // Convertir les dates en Timestamp pour Firestore
    console.log('Dates avant conversion:', promotion.startDate, promotion.endDate);
    
    // S'assurer que les dates sont des objets Date valides
    let startDate = promotion.startDate;
    let endDate = promotion.endDate;
    
    // Vérifier si les dates sont des objets Date valides
    if (!(startDate instanceof Date) || isNaN(startDate.getTime())) {
      startDate = new Date(startDate);
    }
    
    if (!(endDate instanceof Date) || isNaN(endDate.getTime())) {
      endDate = new Date(endDate);
    }
    
    console.log('Dates après vérification:', startDate, endDate);
    
    // Créer une copie de l'objet promotion sans les dates
    const { startDate: _, endDate: __, ...promotionWithoutDates } = promotion;
    
    // Créer l'objet final avec les dates converties en Timestamp
    let promotionData = {
      ...promotionWithoutDates,
      startDate: Timestamp.fromDate(startDate),
      endDate: Timestamp.fromDate(endDate)
    };
    
    // Nettoyer les valeurs undefined qui ne sont pas supportées par Firestore
    const cleanPromotionData: any = {};
    
    // Parcourir tous les champs de promotionData
    Object.entries(promotionData).forEach(([key, value]) => {
      // Si la valeur n'est pas undefined, on la conserve
      if (value !== undefined) {
        cleanPromotionData[key] = value;
      } else if (key === 'buyQuantity' || key === 'getFreeQuantity') {
        // Pour ces champs spécifiques, utiliser 0 au lieu de undefined
        cleanPromotionData[key] = 0;
      }
      // Sinon, on ignore ce champ (undefined n'est pas supporté par Firestore)
    });
    
    // Réassigner promotionData avec les données nettoyées
    promotionData = cleanPromotionData;
    
    console.log('Promotion data nettoyée à enregistrer:', promotionData);
    
    await updateDoc(productRef, { promotion: promotionData });
    console.log('Promotion mise à jour avec succès');
    return true;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de la promotion pour le produit ${productId}:`, error);
    return false;
  }
};

/**
 * Supprime une promotion pour un produit
 */
export const removePromotion = async (productId: string): Promise<boolean> => {
  return updateProductPromotion(productId, undefined);
};

/**
 * Récupère les produits avec des promotions qui expirent bientôt (dans les 7 prochains jours)
 */
export const getExpiringPromotions = async (daysThreshold: number = 7): Promise<{ product: Product, promotion: Promotion, daysRemaining: number }[]> => {
  try {
    const productsCollection = collection(db, PRODUCTS_COLLECTION);
    const productsSnapshot = await getDocs(productsCollection);
    
    const now = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(now.getDate() + daysThreshold);
    
    const productsWithExpiringPromotions = productsSnapshot.docs
      .map(doc => {
        const data = doc.data();
        // Normaliser la promotion si elle existe
        if (data.promotion) {
          data.promotion = normalizePromotion(data.promotion);
        }
        return { id: doc.id, ...data } as Product;
      })
      .filter(product => 
        product.promotion && 
        product.promotion.startDate <= now && 
        product.promotion.endDate >= now &&
        product.promotion.endDate <= thresholdDate
      )
      .map(product => {
        const promotion = product.promotion as Promotion;
        const endDate = promotion.endDate;
        const diffTime = Math.abs(endDate.getTime() - now.getTime());
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return {
          product,
          promotion,
          daysRemaining
        };
      });
    
    return productsWithExpiringPromotions;
  } catch (error) {
    console.error('Erreur lors de la récupération des promotions qui expirent bientôt:', error);
    return [];
  }
};
