import { db } from '../firebase';
import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { SupplierOrder, Product } from '../types';
import { updateProductStock } from './productService';
import { getCurrentBusinessId } from './businessService';
import { emitEvent } from './eventService';

const SUPPLIER_ORDERS_COLLECTION = 'supplierOrders';

// Interface pour les objets Firestore (avec Timestamp au lieu de Date)
interface FirestoreProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  image?: string;
  lowStockThreshold?: number;
  vatRate: 21 | 12 | 6;
  supplier?: string;
  orderQuantity?: number;
}

interface FirestoreOrderProduct {
  product: FirestoreProduct;
  quantity: number;
}

interface FirestoreSupplierOrder extends Omit<SupplierOrder, 'id' | 'orderDate' | 'expectedDeliveryDate' | 'products'> {
  orderDate: Timestamp;
  expectedDeliveryDate?: Timestamp;
  products: FirestoreOrderProduct[];
  businessId: string;
}

/**
 * Convertit un objet SupplierOrder pour Firestore (dates -> timestamps)
 */
const prepareForFirestore = (order: Omit<SupplierOrder, 'id'>): FirestoreSupplierOrder => {
  // Fonction utilitaire pour convertir une date en Timestamp de manière sécurisée
  const safeTimestamp = (date?: Date): Timestamp => {
    if (!date) return Timestamp.now();
    try {
      return Timestamp.fromDate(date);
    } catch (e) {
      console.error('Erreur lors de la conversion de la date:', e);
      return Timestamp.now(); // Utiliser l'heure actuelle en cas d'erreur
    }
  };

  return {
    ...order,
    orderDate: safeTimestamp(order.orderDate),
    expectedDeliveryDate: order.expectedDeliveryDate ? safeTimestamp(order.expectedDeliveryDate) : undefined,
    products: order.products.map(item => ({
      quantity: item.quantity,
      product: {
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        stock: item.product.stock,
        category: item.product.category,
        image: item.product.image,
        lowStockThreshold: item.product.lowStockThreshold,
        vatRate: item.product.vatRate,
        supplier: item.product.supplier,
        orderQuantity: item.product.orderQuantity
      }
    }))
  };
};

/**
 * Convertit un document Firestore en objet SupplierOrder (timestamps -> dates)
 */
const convertFromFirestore = (doc: any): SupplierOrder => {
  console.log('Début de convertFromFirestore pour le document:', doc.id);
  
  if (!doc || !doc.data) {
    console.error('Document invalide reçu dans convertFromFirestore:', doc);
    return {
      id: doc.id || 'unknown',
      businessId: 'business1',
      orderDate: new Date(),
      status: 'pending',
      totalAmount: 0,
      products: []
    } as SupplierOrder;
  }
  
  const data = doc.data();
  console.log('Données du document:', JSON.stringify(data, null, 2));
  
  // Vérifier si les produits existent
  const products = data.products || [];
  console.log('Produits trouvés:', products.length);
  
  // Créer un objet SupplierOrder valide
  try {
    console.log('Conversion des dates...');
    const orderDate = safeToDate(data.orderDate);
    console.log('Date de commande convertie:', orderDate);
    
    const expectedDeliveryDate = data.expectedDeliveryDate ? safeToDate(data.expectedDeliveryDate) : undefined;
    console.log('Date de livraison attendue convertie:', expectedDeliveryDate);
    
    console.log('Conversion des produits...');
    const convertedProducts = Array.isArray(products) ? products.map((item: any, index: number) => {
      console.log(`Conversion du produit ${index}...`);
      // S'assurer que l'objet product est complet
      const product = item.product || {};
      return {
        quantity: item.quantity || 1,
        product: {
          id: product.id || 'unknown',
          name: product.name || 'Produit inconnu',
          price: product.price || 0,
          stock: product.stock || 0,
          category: product.category || 'Non classé',
          vatRate: product.vatRate || 21,
          businessId: product.businessId || 'business1',
          lowStockThreshold: product.lowStockThreshold || 5,
          supplier: product.supplier || 'Fournisseur inconnu'
        } as Product
      };
    }) : [];
    console.log('Nombre de produits convertis:', convertedProducts.length);
    
    const result = {
      ...data,
      id: doc.id,
      businessId: data.businessId || 'business1',
      orderDate: orderDate || new Date(),
      expectedDeliveryDate: expectedDeliveryDate,
      status: data.status || 'pending',
      totalAmount: data.totalAmount || 0,
      products: convertedProducts
    } as SupplierOrder;
    
    console.log('Conversion réussie pour le document:', doc.id);
    return result;
  } catch (error) {
    console.error('Erreur lors de la conversion du document:', error);
    if (error instanceof Error) {
      console.error('Message d\'erreur:', error.message);
      console.error('Stack trace:', error.stack);
    }
    
    // Retourner un objet par défaut en cas d'erreur
    return {
      id: doc.id,
      businessId: 'business1',
      orderDate: new Date(),
      status: 'pending',
      totalAmount: 0,
      products: []
    } as SupplierOrder;
  }
};

// Fonction utilitaire pour convertir un Timestamp en Date de manière sécurisée
const safeToDate = (timestamp: any): Date => {
  console.log('safeToDate appelé avec:', timestamp);
  
  if (!timestamp) {
    console.log('Timestamp vide, retour d\'une nouvelle date');
    return new Date();
  }
  
  try {
    console.log('Type du timestamp:', typeof timestamp);
    if (typeof timestamp === 'object' && timestamp.toDate && typeof timestamp.toDate === 'function') {
      const date = timestamp.toDate();
      console.log('Conversion réussie en date:', date);
      return date;
    } else if (timestamp instanceof Date) {
      console.log('Déjà une instance de Date, retour direct');
      return timestamp;
    } else if (typeof timestamp === 'string') {
      console.log('Conversion de string en Date');
      return new Date(timestamp);
    } else if (typeof timestamp === 'number') {
      console.log('Conversion de timestamp numérique en Date');
      return new Date(timestamp);
    } else {
      console.error('Format de timestamp non reconnu:', timestamp);
      return new Date();
    }
  } catch (e) {
    console.error('Erreur lors de la conversion du timestamp en date:', e);
    if (e instanceof Error) {
      console.error('Message d\'erreur:', e.message);
      console.error('Stack trace:', e.stack);
    }
    return new Date();
  }
};

/**
 * Récupère toutes les commandes fournisseurs pour l'entreprise actuelle par défaut
 * ou pour une entreprise spécifique si businessId est fourni et que l'utilisateur est autorisé
 */
export const getSupplierOrders = async (specificBusinessId?: string): Promise<SupplierOrder[]> => {
  try {
    console.log('Début de getSupplierOrders');
    
    // Récupérer le businessId actuel de l'utilisateur
    const currentUserBusinessId = await getCurrentBusinessId();
    console.log('BusinessId de l\'utilisateur connecté:', currentUserBusinessId);
    
    if (!currentUserBusinessId) {
      console.error('Aucun utilisateur connecté - accès refusé');
      return [];
    }
    
    // Déterminer quel businessId utiliser pour le filtrage
    let businessIdToFilter = specificBusinessId || currentUserBusinessId;
    
    // Sécurité: vérifier si l'utilisateur demande des commandes d'une autre entreprise
    // En production, on ne doit voir que ses propres commandes
    if (specificBusinessId && specificBusinessId !== currentUserBusinessId && process.env.NODE_ENV !== 'development') {
      console.error(`Tentative d'accès aux commandes d'une autre entreprise (${specificBusinessId}) rejetée`);
      return []; // Retourner une liste vide pour des raisons de sécurité
    }
    
    console.log(`Filtrage des commandes par businessId: ${businessIdToFilter}`);
    
    if (!businessIdToFilter) {
      console.error('Aucun identifiant d\'entreprise disponible pour le filtrage');
      return [];
    }
    
    // Créer une référence à la collection
    console.log('Création de la référence à la collection:', SUPPLIER_ORDERS_COLLECTION);
    const ordersCollection = collection(db, SUPPLIER_ORDERS_COLLECTION);
    
    // Utiliser une requête plus simple qui ne nécessite pas d'index composé
    // Filtrer uniquement par businessId et trier côté client
    console.log(`Requête avec filtre businessId: ${businessIdToFilter}`);
    const q = query(
      ordersCollection,
      where('businessId', '==', businessIdToFilter)
      // Ne pas utiliser orderBy pour éviter l'erreur d'index manquant
    );
    
    console.log('Exécution de la requête Firestore avec les paramètres:', {
      collection: SUPPLIER_ORDERS_COLLECTION,
      where: 'businessId == ' + businessIdToFilter
    });
    
    // Exécuter la requête
    console.log('Avant getDocs...');
    const ordersSnapshot = await getDocs(q);
    console.log('Après getDocs...');
    
    if (ordersSnapshot.empty) {
      console.log('Aucune commande fournisseur trouvée');
      return [];
    }
    
    console.log('Nombre de commandes trouvées:', ordersSnapshot.docs.length);
    
    // Convertir les documents en objets SupplierOrder
    let orders = ordersSnapshot.docs.map(doc => {
      try {
        return convertFromFirestore(doc);
      } catch (error) {
        console.error(`Erreur lors de la conversion du document ${doc.id}:`, error);
        return null;
      }
    }).filter(Boolean) as SupplierOrder[];
    
    // Trier manuellement les commandes par date côté client 
    // (ordre décroissant - plus récent d'abord)
    orders.sort((a, b) => {
      const dateA = new Date(a.orderDate).getTime();
      const dateB = new Date(b.orderDate).getTime();
      return dateB - dateA;
    });
    
    console.log(`${orders.length} commandes récupérées et triées`);
    return orders;
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes fournisseurs:', error);
    if (error instanceof Error) {
      console.error('Message d\'erreur:', error.message);
      console.error('Stack trace:', error.stack);
    }
    return [];
  }
};

/**
 * Récupère les commandes fournisseurs pour une entreprise spécifique
 * avec vérification des permissions
 */
export const getSupplierOrdersByBusiness = async (businessId: string): Promise<SupplierOrder[]> => {
  if (!businessId) {
    console.error('BusinessId requis pour récupérer les commandes d\'une entreprise spécifique');
    return [];
  }
  
  // Récupérer l'identifiant de l'entreprise actuelle pour vérification
  const currentUserBusinessId = await getCurrentBusinessId();
  
  // Vérifier si l'utilisateur a le droit d'accéder aux commandes de cette entreprise
  // En production, seule sa propre entreprise est autorisée
  if (businessId !== currentUserBusinessId && process.env.NODE_ENV !== 'development') {
    console.error(`Accès refusé aux commandes de l'entreprise ${businessId} pour l'utilisateur de l'entreprise ${currentUserBusinessId}`);
    return [];
  }
  
  console.log(`Récupération des commandes pour l'entreprise: ${businessId}`);
  return getSupplierOrders(businessId);
};

/**
 * Récupère une commande fournisseur par son ID
 */
export const getSupplierOrderById = async (orderId: string): Promise<SupplierOrder | null> => {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      console.error('Aucun utilisateur connecté');
      return null;
    }
    
    const orderRef = doc(db, SUPPLIER_ORDERS_COLLECTION, orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (orderSnap.exists()) {
      const orderData = orderSnap.data();
      
      // Vérifier que la commande appartient à l'entreprise de l'utilisateur connecté
      // En mode développement, ignorer la vérification du businessId
      if (process.env.NODE_ENV !== 'development' && orderData.businessId !== businessId) {
        console.error(`Cette commande n'appartient pas à votre entreprise (commande: ${orderData.businessId}, utilisateur: ${businessId})`);
        return null;
      }
      
      // Si nous sommes en mode développement et que les IDs ne correspondent pas, on log mais on continue
      if (process.env.NODE_ENV === 'development' && orderData.businessId !== businessId) {
        console.warn(`Mode développement: Ignorer la vérification du businessId (commande: ${orderData.businessId}, utilisateur: ${businessId})`);
      }
      
      return convertFromFirestore(orderSnap);
    }
    
    return null;
  } catch (error) {
    console.error(`Erreur lors de la récupération de la commande ${orderId}:`, error);
    return null;
  }
};

/**
 * Ajoute une nouvelle commande fournisseur
 */
export const addSupplierOrder = async (order: Omit<SupplierOrder, 'id'>): Promise<SupplierOrder> => {
  try {
    console.log('Début de création de commande fournisseur...');
    
    // Vérifier si Firebase est initialisé
    if (!db) {
      throw new Error('Firebase n\'est pas initialisé correctement');
    }
    
    // Récupérer et valider le businessId
    let businessId = order.businessId;
    if (!businessId || businessId.trim() === '') {
      console.log('BusinessId manquant dans l\'ordre, tentative de récupération...');
      businessId = await getCurrentBusinessId();
      console.log('BusinessId récupéré:', businessId);
    }
    
    // Validation explicite du businessId
    if (!businessId || businessId.trim() === '') {
      throw new Error('Impossible de créer la commande - Identifiant d\'entreprise introuvable');
    }
    
    // Utiliser businessId1 par défaut en mode développement si toujours pas de valeur
    if (process.env.NODE_ENV === 'development' && (!businessId || businessId.trim() === '')) {
      console.log('Mode développement: utilisation du businessId par défaut');
      businessId = 'business1';
    }
    
    // Vérifier que les produits sont valides
    if (!order.products || order.products.length === 0) {
      throw new Error('La commande ne contient aucun produit');
    }
    
    // Vérifier que chaque produit a un ID valide
    const invalidProducts = order.products.filter(item => !item.product || !item.product.id);
    if (invalidProducts.length > 0) {
      throw new Error(`${invalidProducts.length} produit(s) dans la commande sont invalides`);
    }
    
    // Ajouter le businessId à la commande
    const orderWithBusinessId = {
      ...order,
      businessId
    };
    
    // Journaliser explicitement le businessId utilisé
    console.log('BusinessId final utilisé pour la commande:', businessId);
    
    // S'assurer que les dates sont valides
    if (!orderWithBusinessId.orderDate) {
      orderWithBusinessId.orderDate = new Date();
    }
    
    // Préparer les données pour Firestore
    const orderData = prepareForFirestore(orderWithBusinessId);
    
    console.log('Données de commande préparées pour Firebase:', {
      businessId: orderData.businessId,
      productsCount: orderData.products.length,
      totalAmount: order.totalAmount,
      status: order.status
    });
    
    // Vérification supplémentaire en mode développement
    if (process.env.NODE_ENV === 'development') {
      console.log('Mode développement: vérification complète de la commande avant envoi');
      console.log('Date de commande:', orderData.orderDate);
      console.log('Date de livraison:', orderData.expectedDeliveryDate);
      
      // Vérifier la structure des produits
      if (orderData.products && orderData.products.length > 0) {
        console.log('Premier produit de la commande:', orderData.products[0]);
      }
    }
    
    // Ajouter la commande à Firestore
    console.log(`Ajout de la commande dans la collection '${SUPPLIER_ORDERS_COLLECTION}'...`);
    
    const ordersCollection = collection(db, SUPPLIER_ORDERS_COLLECTION);
    const docRef = await addDoc(ordersCollection, orderData);
    
    if (!docRef || !docRef.id) {
      throw new Error('Erreur lors de la création du document dans Firestore');
    }
    
    console.log('✅ Commande créée avec succès!', {
      orderId: docRef.id,
      businessId: orderWithBusinessId.businessId,
      totalAmount: orderWithBusinessId.totalAmount
    });
    
    // Retourner la commande complète avec l'ID généré
    return { 
      id: docRef.id, 
      ...orderWithBusinessId 
    } as SupplierOrder;
  } catch (error) {
    console.error('Erreur lors de l\'ajout de la commande fournisseur:', error);
    // Journaliser plus de détails sur l'erreur
    if (error instanceof Error) {
      console.error('Message d\'erreur:', error.message);
      console.error('Stack trace:', error.stack);
    }
    
    // En mode développement, essayer de fournir plus d'informations de débogage
    if (process.env.NODE_ENV === 'development') {
      console.error('Détails supplémentaires en mode développement:');
      console.error('Firebase initialisé?', !!db);
      console.error('Collection utilisée:', SUPPLIER_ORDERS_COLLECTION);
      console.error('BusinessId:', order.businessId || 'non défini');
      
      // Si c'est un problème de Firebase, tenter de résoudre en fournissant une commande fictive
      if (error instanceof Error && error.toString().includes('Firebase') && process.env.NODE_ENV === 'development') {
        console.warn('ATTENTION: Mode développement - Retour d\'une commande fictive pour déboguer l\'UI');
        return {
          id: 'dev-order-' + Date.now(),
          ...order,
          products: order.products.map(p => ({ ...p })),
          businessId: order.businessId || 'business1',
          orderDate: new Date(),
          expectedDeliveryDate: order.expectedDeliveryDate || new Date(),
          status: order.status || 'pending',
          totalAmount: order.totalAmount || 0
        } as SupplierOrder;
      }
    }
    
    throw error; // Propager l'erreur pour une meilleure gestion dans le composant
  }
};

/**
 * Met à jour le statut d'une commande fournisseur
 */
export const updateSupplierOrderStatus = async (
  orderId: string, 
  status: 'pending' | 'confirmed' | 'delivered'
): Promise<boolean> => {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      console.error('Aucun utilisateur connecté');
      return false;
    }
    
    // Vérifier que la commande appartient à l'entreprise de l'utilisateur connecté
    const orderSnap = await getDoc(doc(db, SUPPLIER_ORDERS_COLLECTION, orderId));
    if (!orderSnap.exists()) {
      console.error(`La commande ${orderId} n'existe pas`);
      return false;
    }
    
    const orderData = orderSnap.data();
    console.log(`Vérification de la commande: businessId=${orderData.businessId}, utilisateur businessId=${businessId}`);
    
    // En mode développement, ignorer la vérification du businessId
    if (process.env.NODE_ENV !== 'development' && orderData.businessId !== businessId) {
      console.error(`Cette commande n'appartient pas à votre entreprise (commande: ${orderData.businessId}, utilisateur: ${businessId})`);
      return false;
    }
    
    // Si nous sommes en mode développement et que les IDs ne correspondent pas, on log mais on continue
    if (process.env.NODE_ENV === 'development' && orderData.businessId !== businessId) {
      console.warn(`Mode développement: Ignorer la vérification du businessId (commande: ${orderData.businessId}, utilisateur: ${businessId})`);
    }
    
    const orderRef = doc(db, SUPPLIER_ORDERS_COLLECTION, orderId);
    await updateDoc(orderRef, { status });
    return true;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du statut de la commande ${orderId}:`, error);
    return false;
  }
};

/**
 * Marque une commande comme livrée et met à jour le stock
 */
export const receiveSupplierOrder = async (orderId: string): Promise<boolean> => {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      console.error('Aucun utilisateur connecté');
      return false;
    }
    
    // Récupérer la commande
    const order = await getSupplierOrderById(orderId);
    if (!order) return false;
    
    // Vérifier que la commande appartient à l'entreprise de l'utilisateur connecté
    // En mode développement, ignorer la vérification du businessId
    if (process.env.NODE_ENV !== 'development' && order.businessId !== businessId) {
      console.error(`Cette commande n'appartient pas à votre entreprise (commande: ${order.businessId}, utilisateur: ${businessId})`);
      return false;
    }
    
    // Si nous sommes en mode développement et que les IDs ne correspondent pas, on log mais on continue
    if (process.env.NODE_ENV === 'development' && order.businessId !== businessId) {
      console.warn(`Mode développement: Ignorer la vérification du businessId (commande: ${order.businessId}, utilisateur: ${businessId})`);
    }
    
    // Vérifier si la commande est déjà livrée pour éviter les mises à jour en double
    if (order.status === 'delivered') {
      console.warn(`La commande ${orderId} a déjà été marquée comme livrée. Aucune mise à jour de stock ne sera effectuée.`);
      return true;
    }
    
    // Mettre à jour le statut
    await updateSupplierOrderStatus(orderId, 'delivered');
    
    // Mettre à jour le stock pour chaque produit reçu
    const updateStockPromises = order.products.map(item => {
      // Calculer la différence à ajouter au stock actuel
      const quantityToAdd = item.quantity;
      // Utiliser la fonction updateProductStock avec la quantité à ajouter
      // Cette fonction ajoute la quantité au stock existant
      return updateProductStock(item.product.id, quantityToAdd);
    });
    
    // Ajouter un log pour suivre les mises à jour de stock
    console.log(`Mise à jour du stock pour ${order.products.length} produits de la commande ${orderId}`);
    
    await Promise.all(updateStockPromises);
    
    // Émettre un événement pour notifier les composants que le stock a été mis à jour
    // suite à la réception d'une commande fournisseur
    emitEvent('stockUpdated', {
      orderId,
      orderProducts: order.products,
      source: 'supplierOrder'
    });
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la réception de la commande:', error);
    return false;
  }
};

/**
 * Récupère les commandes fournisseurs par statut
 */
export const getSupplierOrdersByStatus = async (status: 'pending' | 'confirmed' | 'delivered'): Promise<SupplierOrder[]> => {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      console.error('Aucun utilisateur connecté');
      return [];
    }
    
    const ordersCollection = collection(db, SUPPLIER_ORDERS_COLLECTION);
    const q = query(
      ordersCollection,
      where('businessId', '==', businessId),
      where('status', '==', status),
      orderBy('orderDate', 'desc')
    );
    
    const ordersSnapshot = await getDocs(q);
    return ordersSnapshot.docs.map(convertFromFirestore);
  } catch (error) {
    console.error(`Erreur lors de la récupération des commandes avec le statut ${status}:`, error);
    return [];
  }
};

/**
 * Récupère les commandes fournisseurs par fournisseur
 */
export const getSupplierOrdersBySupplier = async (supplierName: string): Promise<SupplierOrder[]> => {
  try {
    const businessId = 'business1';
    console.log('Utilisation de l\'ID d\'entreprise par défaut pour les commandes par fournisseur:', businessId);
    
    // Note: Cette fonction est plus complexe car nous devons filtrer sur un champ imbriqué
    // Nous récupérons d'abord toutes les commandes de l'entreprise, puis filtrons côté client
    const ordersCollection = collection(db, SUPPLIER_ORDERS_COLLECTION);
    const q = query(
      ordersCollection,
      where('businessId', '==', businessId),
      orderBy('orderDate', 'desc')
    );
    
    const ordersSnapshot = await getDocs(q);
    const orders = ordersSnapshot.docs.map(convertFromFirestore);
    
    // Filtrer côté client pour les commandes contenant des produits du fournisseur spécifié
    return orders.filter(order => 
      order.products.some(item => item.product.supplier === supplierName)
    );
  } catch (error) {
    console.error(`Erreur lors de la récupération des commandes pour le fournisseur ${supplierName}:`, error);
    return [];
  }
};

/**
 * Récupère les commandes fournisseurs par période
 */
export const getSupplierOrdersByDateRange = async (startDate: Date, endDate: Date): Promise<SupplierOrder[]> => {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      console.error('Aucun utilisateur connecté');
      return [];
    }
    
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);
    
    const ordersCollection = collection(db, SUPPLIER_ORDERS_COLLECTION);
    const q = query(
      ordersCollection,
      where('businessId', '==', businessId),
      where('orderDate', '>=', startTimestamp),
      where('orderDate', '<=', endTimestamp),
      orderBy('orderDate', 'desc')
    );
    
    const ordersSnapshot = await getDocs(q);
    return ordersSnapshot.docs.map(convertFromFirestore);
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes par période:', error);
    return [];
  }
};

/**
 * Met à jour une commande fournisseur existante
 */
export const updateSupplierOrder = async (orderId: string, orderData: Partial<Omit<SupplierOrder, 'id'>>): Promise<SupplierOrder | null> => {
  try {
    console.log(`Début de la mise à jour de la commande: ${orderId}`);
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      console.error('Aucun utilisateur connecté');
      return null;
    }
    
    // Vérifier que la commande existe
    const orderRef = doc(db, SUPPLIER_ORDERS_COLLECTION, orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      console.error(`La commande ${orderId} n'existe pas`);
      return null;
    }
    
    const existingOrder = orderSnap.data();
    console.log(`Vérification de la commande pour modification: businessId=${existingOrder.businessId}, utilisateur businessId=${businessId}`);
    
    // Vérifier que l'utilisateur a le droit de modifier cette commande
    if (process.env.NODE_ENV !== 'development' && existingOrder.businessId !== businessId) {
      console.error(`Cette commande n'appartient pas à votre entreprise (commande: ${existingOrder.businessId}, utilisateur: ${businessId})`);
      return null;
    }
    
    // Préparer les données pour Firestore
    let updateData: any = {};
    
    // Mettre à jour uniquement les propriétés fournies
    if (orderData.orderDate) {
      updateData.orderDate = Timestamp.fromDate(orderData.orderDate);
    }
    
    if (orderData.expectedDeliveryDate) {
      updateData.expectedDeliveryDate = Timestamp.fromDate(orderData.expectedDeliveryDate);
    }
    
    if (orderData.status) {
      updateData.status = orderData.status;
    }
    
    if (orderData.totalAmount !== undefined) {
      updateData.totalAmount = orderData.totalAmount;
    }
    
    if (orderData.products) {
      // Convertir les produits pour Firestore
      updateData.products = orderData.products.map(item => ({
        quantity: item.quantity,
        product: {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          stock: item.product.stock,
          category: item.product.category,
          image: item.product.image,
          lowStockThreshold: item.product.lowStockThreshold,
          vatRate: item.product.vatRate,
          supplier: item.product.supplier,
          orderQuantity: item.product.orderQuantity
        }
      }));
    }
    
    console.log(`Mise à jour de la commande avec les données:`, updateData);
    
    // Mettre à jour la commande
    await updateDoc(orderRef, updateData);
    
    // Récupérer la commande mise à jour
    const updatedOrderSnap = await getDoc(orderRef);
    if (!updatedOrderSnap.exists()) {
      console.error(`Impossible de récupérer la commande mise à jour ${orderId}`);
      return null;
    }
    
    // Convertir la commande mise à jour
    const updatedOrder = convertFromFirestore({
      id: updatedOrderSnap.id,
      data: () => updatedOrderSnap.data()
    });
    
    console.log(`Commande ${orderId} mise à jour avec succès`);
    return updatedOrder;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de la commande ${orderId}:`, error);
    return null;
  }
};

/**
 * Supprime une commande fournisseur
 */
export const deleteSupplierOrder = async (orderId: string): Promise<boolean> => {
  try {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      console.error('Aucun utilisateur connecté');
      return false;
    }
    
    // Vérifier que la commande existe
    const orderSnap = await getDoc(doc(db, SUPPLIER_ORDERS_COLLECTION, orderId));
    if (!orderSnap.exists()) {
      console.error(`La commande ${orderId} n'existe pas`);
      return false;
    }
    
    const orderData = orderSnap.data();
    console.log(`Vérification de la commande pour suppression: businessId=${orderData.businessId}, utilisateur businessId=${businessId}`);
    
    // En mode développement, ignorer la vérification du businessId
    if (process.env.NODE_ENV !== 'development' && orderData.businessId !== businessId) {
      console.error(`Cette commande n'appartient pas à votre entreprise (commande: ${orderData.businessId}, utilisateur: ${businessId})`);
      return false;
    }
    
    // Si nous sommes en mode développement et que les IDs ne correspondent pas, on log mais on continue
    if (process.env.NODE_ENV === 'development' && orderData.businessId !== businessId) {
      console.warn(`Mode développement: Ignorer la vérification du businessId pour la suppression (commande: ${orderData.businessId}, utilisateur: ${businessId})`);
    }
    
    // Supprimer la commande
    await deleteDoc(doc(db, SUPPLIER_ORDERS_COLLECTION, orderId));
    console.log(`Commande ${orderId} supprimée avec succès`);
    return true;
  } catch (error) {
    console.error(`Erreur lors de la suppression de la commande ${orderId}:`, error);
    return false;
  }
};
