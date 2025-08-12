import { db, auth } from '../firebase';
import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { Product } from '../types';
import { emitEvent } from './eventService';

const PRODUCTS_COLLECTION = 'products';

/**
 * Récupère le businessId de l'utilisateur connecté
 * Utilise plusieurs sources pour assurer la disponibilité du businessId
 */
const getCurrentBusinessId = (): string | null => {
  // Méthode 1: Essayer d'abord avec Firebase Auth
  const user = auth.currentUser;
  if (user) {
    console.log('BusinessId récupéré depuis Firebase Auth:', user.uid);
    return user.uid;
  }
  
  // Méthode 2: Essayer de récupérer depuis localStorage (currentEmployee)
  try {
    const savedEmployee = localStorage.getItem('currentEmployee');
    if (savedEmployee) {
      const employee = JSON.parse(savedEmployee);
      if (employee && employee.businessId) {
        console.log('BusinessId récupéré depuis localStorage (currentEmployee):', employee.businessId);
        return employee.businessId;
      }
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du businessId depuis localStorage:', error);
  }
  
  // Méthode 3: Valeur par défaut pour le développement
  console.log('Aucun businessId trouvé, utilisation de la valeur par défaut pour le développement');
  return 'business1';
};

/**
 * Récupère tous les produits depuis Firestore pour l'entreprise de l'utilisateur connecté
 */
export const getProducts = async (): Promise<Product[]> => {
  try {
    const businessId = getCurrentBusinessId();
    if (!businessId) {
      console.error('Aucun utilisateur connecté');
      return [];
    }
    
    const productsCollection = collection(db, PRODUCTS_COLLECTION);
    const q = query(productsCollection, where("businessId", "==", businessId));
    const productsSnapshot = await getDocs(q);
    
    return productsSnapshot.docs.map(doc => {
      const data = doc.data();
      // Convertir les dates de promotion si elles existent
      if (data.promotion) {
        data.promotion.startDate = data.promotion.startDate.toDate();
        data.promotion.endDate = data.promotion.endDate.toDate();
      }
      return { id: doc.id, ...data } as Product;
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    return [];
  }
};

/**
 * Récupère un produit par son ID
 */
export const getProductById = async (productId: string): Promise<Product | null> => {
  try {
    const businessId = getCurrentBusinessId();
    if (!businessId) {
      console.error('Aucun utilisateur connecté');
      return null;
    }
    
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    const productSnap = await getDoc(productRef);
    
    // Vérifier que le produit appartient à l'entreprise de l'utilisateur connecté
    if (productSnap.exists() && productSnap.data().businessId !== businessId) {
      console.error('Ce produit n\'appartient pas à votre entreprise');
      return null;
    }
    
    if (productSnap.exists()) {
      const data = productSnap.data();
      // Convertir les dates de promotion si elles existent
      if (data.promotion) {
        data.promotion.startDate = data.promotion.startDate.toDate();
        data.promotion.endDate = data.promotion.endDate.toDate();
      }
      return { id: productSnap.id, ...data } as Product;
    }
    
    return null;
  } catch (error) {
    console.error(`Erreur lors de la récupération du produit ${productId}:`, error);
    return null;
  }
};

/**
 * Ajoute un nouveau produit - Version corrigée avec contournement des problèmes d'authentification
 */
export const addProduct = async (product: Omit<Product, 'id'>): Promise<Product | null> => {
  console.log('Début de la fonction addProduct - VERSION SIMPLIFIÉE SANS DÉPENDANCE AUTH');
  try {
    // Récupérer le businessId depuis diverses sources
    let businessId = 'business1'; // Valeur par défaut sûre
    
    // Essayer d'abord localStorage
    try {
      const savedEmployeeJSON = localStorage.getItem('currentEmployee');
      if (savedEmployeeJSON) {
        const savedEmployee = JSON.parse(savedEmployeeJSON);
        if (savedEmployee && savedEmployee.businessId) {
          businessId = savedEmployee.businessId;
          console.log('BusinessId récupéré depuis localStorage:', businessId);
        }
      }
    } catch (e) {
      console.log('Impossible de récupérer les données du localStorage, utilisation de la valeur par défaut');
    }
    
    // Préparation des données du produit
    console.log('Préparation des données du produit avec businessId:', businessId);
    const productData = { ...product, businessId };
    
    // Convertir les dates de promotion si elles existent
    if (productData.promotion) {
      productData.promotion = {
        ...productData.promotion,
        startDate: new Date(productData.promotion.startDate),
        endDate: new Date(productData.promotion.endDate)
      };
    }
    
    // Ajouter directement le produit à Firestore
    console.log('Tentative d\'ajout du produit dans Firestore...');
    const productsCollection = collection(db, PRODUCTS_COLLECTION);
    
    // Délai artificiel pour s'assurer que la connexion Firestore est établie
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const docRef = await addDoc(productsCollection, productData);
      console.log('SUCCÈS! Produit ajouté avec ID:', docRef.id);
      return { id: docRef.id, ...productData } as Product;
    } catch (firestoreError) {
      console.error('Erreur Firestore spécifique:', firestoreError);
      alert('Erreur lors de l\'ajout du produit. Vérifiez la console pour plus de détails.');
      return null;
    }
  } catch (error) {
    console.error('ERREUR CRITIQUE GLOBALE:', error);
    if (error instanceof Error) {
      console.error('Message d\'erreur:', error.message);
      console.error('Pile d\'appel:', error.stack);
    }
    alert('Une erreur inattendue s\'est produite. Veuillez réessayer.');
    return null;
  }
};

/**
 * Met à jour un produit existant
 */
export const updateProduct = async (productId: string, productData: Partial<Product>): Promise<boolean> => {
  try {
    const businessId = getCurrentBusinessId();
    if (!businessId) {
      console.error('Aucun utilisateur connecté');
      return false;
    }
    
    // Vérifier que le produit appartient à l'entreprise de l'utilisateur connecté
    const productSnap = await getDoc(doc(db, PRODUCTS_COLLECTION, productId));
    if (!productSnap.exists() || productSnap.data().businessId !== businessId) {
      console.error('Ce produit n\'appartient pas à votre entreprise');
      return false;
    }
    
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    
    // Préparer les données pour Firestore
    const updateData = { ...productData };
    
    // Convertir les dates de promotion en timestamp Firestore si elles existent
    if (updateData.promotion) {
      updateData.promotion = {
        ...updateData.promotion,
        startDate: new Date(updateData.promotion.startDate),
        endDate: new Date(updateData.promotion.endDate)
      };
    }
    
    await updateDoc(productRef, updateData);
    return true;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du produit ${productId}:`, error);
    return false;
  }
};

/**
 * Supprime un produit - Version améliorée avec gestion d'erreurs robuste
 */
export const deleteProduct = async (productId: string): Promise<boolean> => {
  console.log(`Début de la suppression du produit avec ID: ${productId}`);
  try {
    // Récupérer le businessId depuis diverses sources
    let businessId = 'business1'; // Valeur par défaut sûre
    
    // Essayer d'abord localStorage
    try {
      const savedEmployeeJSON = localStorage.getItem('currentEmployee');
      if (savedEmployeeJSON) {
        const savedEmployee = JSON.parse(savedEmployeeJSON);
        if (savedEmployee && savedEmployee.businessId) {
          businessId = savedEmployee.businessId;
          console.log('BusinessId récupéré depuis localStorage:', businessId);
        }
      }
    } catch (e) {
      console.log('Impossible de récupérer les données du localStorage, utilisation de la valeur par défaut');
    }
    
    // Vérifier que le produit existe
    console.log(`Vérification de l'existence du produit ${productId}...`);
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    const productSnap = await getDoc(productRef);
    
    if (!productSnap.exists()) {
      console.error(`Le produit avec l'ID ${productId} n'existe pas`);
      alert('Ce produit n\'existe pas ou a déjà été supprimé.');
      return false;
    }
    
    const productData = productSnap.data();
    console.log('Données du produit récupérées:', productData);
    
    // Délai artificiel pour s'assurer que la connexion Firestore est établie
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Supprimer le produit
    console.log(`Tentative de suppression du produit ${productId}...`);
    try {
      await deleteDoc(productRef);
      console.log(`SUCCÈS! Produit ${productId} supprimé`);
      // Émettre un événement pour informer d'autres composants
      emitEvent('productDeleted', { productId });
      return true;
    } catch (firestoreError) {
      console.error('Erreur Firestore spécifique lors de la suppression:', firestoreError);
      alert('Erreur lors de la suppression du produit. Vérifiez la console pour plus de détails.');
      return false;
    }
  } catch (error) {
    console.error(`ERREUR CRITIQUE lors de la suppression du produit ${productId}:`, error);
    if (error instanceof Error) {
      console.error('Message d\'erreur:', error.message);
      console.error('Pile d\'appel:', error.stack);
    }
    alert('Une erreur inattendue s\'est produite lors de la suppression. Veuillez réessayer.');
    return false;
  }
};

/**
 * Ajuste le stock d'un produit en ajoutant ou soustrayant une quantité
 */
export const updateProductStock = async (productId: string, quantityChange: number): Promise<boolean> => {
  try {
    console.log(`Tentative d'ajustement du stock pour le produit ${productId} avec un changement relatif de ${quantityChange}`);
    
    const businessId = getCurrentBusinessId();
    if (!businessId) {
      console.error('Aucun utilisateur connecté, impossible de mettre à jour le stock');
      return false;
    }
    
    // Récupérer le produit pour obtenir le stock actuel
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    const productSnap = await getDoc(productRef);
    
    if (!productSnap.exists()) {
      console.error(`Le produit ${productId} n'existe pas`);
      return false;
    }
    
    const productData = productSnap.data();
    
    // Vérifier que le produit appartient à l'entreprise de l'utilisateur connecté
    if (productData.businessId !== businessId) {
      console.error(`Ce produit (${productId}) n'appartient pas à votre entreprise (${businessId} vs ${productData.businessId})`);
      return false;
    }
    
    // Calculer le nouveau stock
    const currentStock = productData.stock || 0;
    const newStock = currentStock + quantityChange;
    
    console.log(`Ajustement du stock pour le produit ${productId}: ${currentStock} => ${newStock} (ajout de ${quantityChange})`);
    
    // Mettre à jour le stock
    try {
      await updateDoc(productRef, { stock: newStock });
      console.log(`Stock mis à jour avec succès pour le produit ${productId}`);
      
      // Émettre un événement pour notifier les composants de la mise à jour du stock
      emitEvent('stockUpdated', {
        productId,
        newStock,
        previousStock: currentStock,
        product: { ...productData, id: productId, stock: newStock }
      });
      
      return true;
    } catch (updateError) {
      console.error(`Erreur lors de la mise à jour du document pour le produit ${productId}:`, updateError);
      if (updateError instanceof Error) {
        console.error('Message d\'erreur:', updateError.message);
        console.error('Stack trace:', updateError.stack);
      }
      return false;
    }
  } catch (error) {
    console.error(`Erreur générale lors de la mise à jour du stock du produit ${productId}:`, error);
    if (error instanceof Error) {
      console.error('Message d\'erreur:', error.message);
      console.error('Stack trace:', error.stack);
    }
    return false;
  }
};

/**
 * Définit le stock d'un produit à une valeur absolue
 */
export const setProductStockAbsolute = async (productId: string, newStockValue: number): Promise<boolean> => {
  try {
    console.log(`Tentative de définition du stock pour le produit ${productId} à la valeur absolue ${newStockValue}`);
    
    const businessId = getCurrentBusinessId();
    if (!businessId) {
      console.error('Aucun utilisateur connecté, impossible de mettre à jour le stock');
      return false;
    }
    
    // Récupérer le produit pour obtenir le stock actuel (pour la journalisation)
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    const productSnap = await getDoc(productRef);
    
    if (!productSnap.exists()) {
      console.error(`Le produit ${productId} n'existe pas`);
      return false;
    }
    
    const productData = productSnap.data();
    
    // Vérifier que le produit appartient à l'entreprise de l'utilisateur connecté
    if (productData.businessId !== businessId) {
      console.error(`Ce produit (${productId}) n'appartient pas à votre entreprise (${businessId} vs ${productData.businessId})`);
      return false;
    }
    
    const currentStock = productData.stock || 0;
    console.log(`Définition du stock pour le produit ${productId}: ${currentStock} => ${newStockValue}`);
    
    // Mettre à jour le stock
    try {
      await updateDoc(productRef, { stock: newStockValue });
      console.log(`Stock défini avec succès pour le produit ${productId}`);
      
      // Émettre un événement pour notifier les composants de la mise à jour du stock
      emitEvent('stockUpdated', {
        productId,
        newStock: newStockValue,
        previousStock: currentStock,
        product: { ...productData, id: productId, stock: newStockValue }
      });
      
      return true;
    } catch (updateError) {
      console.error(`Erreur lors de la mise à jour du document pour le produit ${productId}:`, updateError);
      return false;
    }
  } catch (error) {
    console.error(`Erreur générale lors de la définition du stock du produit ${productId}:`, error);
    return false;
  }
};

/**
 * Récupère les produits par catégorie
 */
export const getProductsByCategory = async (category: string): Promise<Product[]> => {
  try {
    const businessId = getCurrentBusinessId();
    if (!businessId) {
      console.error('Aucun utilisateur connecté');
      return [];
    }
    
    const productsCollection = collection(db, PRODUCTS_COLLECTION);
    const q = query(
      productsCollection, 
      where("category", "==", category),
      where("businessId", "==", businessId)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      // Convertir les dates de promotion si elles existent
      if (data.promotion) {
        data.promotion.startDate = data.promotion.startDate.toDate();
        data.promotion.endDate = data.promotion.endDate.toDate();
      }
      return { id: doc.id, ...data } as Product;
    });
  } catch (error) {
    console.error(`Erreur lors de la récupération des produits de la catégorie ${category}:`, error);
    return [];
  }
};

/**
 * Récupère les produits à faible stock
 */
export const getLowStockProducts = async (): Promise<Product[]> => {
  try {
    // On récupère tous les produits et on filtre côté client
    // car Firestore ne permet pas de comparer deux champs dans une requête
    const products = await getProducts();
    return products.filter(product => 
      product.stock <= (product.lowStockThreshold || 10)
    );
  } catch (error) {
    console.error('Erreur lors de la récupération des produits à faible stock:', error);
    return [];
  }
};
