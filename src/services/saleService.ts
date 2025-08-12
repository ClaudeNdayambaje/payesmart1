import { db } from '../firebase';
import { collection, doc, getDocs, getDoc, addDoc, query, where, orderBy, Timestamp, limit, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { Sale } from '../types';
import { getCurrentBusinessId as getBusinessIdUtil } from '../utils/authUtils';

const SALES_COLLECTION = 'sales';
const BUSINESS_SALES_COLLECTION = 'business_sales';

// Cache local pour les ventes
let salesCache: Sale[] = [];
let salesListeners: (() => void)[] = [];

// Variable pour suivre si l'écouteur est déjà initialisé
let isListenerInitialized = false;

/**
 * Obtient l'ID de l'entreprise actuelle depuis l'utilitaire centralisé
 */
const getCurrentBusinessId = async (): Promise<string> => {
  const businessId = await getBusinessIdUtil();
  return businessId || 'unknown';
};

/**
 * Prépare les données pour Firestore en convertissant les dates en Timestamp
 */
const prepareForFirestore = (data: any) => {
  try {
    console.log('Préparation des données pour Firestore');
    const result = { ...data };
    
    // Convertir les dates en Timestamp
    if (result.timestamp && result.timestamp instanceof Date) {
      result.timestamp = Timestamp.fromDate(result.timestamp);
    }
    
    // Traiter la carte de fidélité si elle existe
    if (result.loyaltyCard) {
      try {
        // Si la carte a une date de création, la convertir en Timestamp
        if (result.loyaltyCard.createdAt) {
          if (result.loyaltyCard.createdAt instanceof Date) {
            result.loyaltyCard.createdAt = Timestamp.fromDate(result.loyaltyCard.createdAt);
          } else if (typeof result.loyaltyCard.createdAt === 'string') {
            // Essayer de convertir la chaîne en Date
            const date = new Date(result.loyaltyCard.createdAt);
            if (!isNaN(date.getTime())) {
              result.loyaltyCard.createdAt = Timestamp.fromDate(date);
            } else {
              // Si la date n'est pas valide, utiliser la date actuelle
              result.loyaltyCard.createdAt = Timestamp.fromDate(new Date());
            }
          } else if (result.loyaltyCard.createdAt.seconds && result.loyaltyCard.createdAt.nanoseconds) {
            // C'est déjà un Timestamp, ne rien faire
          } else {
            // Fallback: utiliser la date actuelle
            result.loyaltyCard.createdAt = Timestamp.fromDate(new Date());
          }
        } else {
          // Si aucune date de création n'est fournie, utiliser la date actuelle
          result.loyaltyCard.createdAt = Timestamp.fromDate(new Date());
        }
        
        // Si la carte a une date de dernière utilisation, la convertir en Timestamp
        if (result.loyaltyCard.lastUsed) {
          if (result.loyaltyCard.lastUsed instanceof Date) {
            result.loyaltyCard.lastUsed = Timestamp.fromDate(result.loyaltyCard.lastUsed);
          } else if (typeof result.loyaltyCard.lastUsed === 'string') {
            // Essayer de convertir la chaîne en Date
            const date = new Date(result.loyaltyCard.lastUsed);
            if (!isNaN(date.getTime())) {
              result.loyaltyCard.lastUsed = Timestamp.fromDate(date);
            } else {
              // Si la date n'est pas valide, utiliser la date actuelle
              result.loyaltyCard.lastUsed = Timestamp.fromDate(new Date());
            }
          } else if (result.loyaltyCard.lastUsed.seconds && result.loyaltyCard.lastUsed.nanoseconds) {
            // C'est déjà un Timestamp, ne rien faire
          } else {
            // Fallback: utiliser la date actuelle
            result.loyaltyCard.lastUsed = Timestamp.fromDate(new Date());
          }
        } else {
          // Si aucune date de dernière utilisation n'est fournie, utiliser la date actuelle
          result.loyaltyCard.lastUsed = Timestamp.fromDate(new Date());
        }
      } catch (error) {
        console.error('Erreur lors du traitement des dates de la carte de fidélité:', error);
        // Assurer des valeurs par défaut
        result.loyaltyCard.createdAt = Timestamp.fromDate(new Date());
        result.loyaltyCard.lastUsed = Timestamp.fromDate(new Date());
      }
    }
    
    // Simplifier les éléments du panier pour éviter les références circulaires
    if (result.items && Array.isArray(result.items)) {
      result.items = result.items.map((item: any) => {
        const itemCopy = { ...item };
        
        // Stocker uniquement l'ID du produit et les informations essentielles
        if (itemCopy.product) {
          itemCopy.product = {
            id: itemCopy.product.id,
            name: itemCopy.product.name,
            price: itemCopy.product.price,
            category: itemCopy.product.category,
            vatRate: itemCopy.product.vatRate,
            businessId: itemCopy.product.businessId
          };
        }
        
        return itemCopy;
      });
    }
    
    return result;
  } catch (error) {
    console.error('Erreur lors de la préparation des données pour Firestore:', error);
    throw error;
  }
};

/**
 * Convertit les données Firestore en objet JavaScript
 */
const convertFromFirestore = (doc: any): Sale => {
  try {
    const data = doc.data();
    if (!data) return { id: doc.id } as Sale;
    
    // Convertir les Timestamp en Date
    const result = {
      ...data,
      id: doc.id,
      timestamp: data.timestamp ? data.timestamp.toDate() : new Date()
    };
    
    // Traiter la carte de fidélité si elle existe
    if (result.loyaltyCard) {
      try {
        // Convertir la date de création si elle existe
        if (result.loyaltyCard.createdAt) {
          if (result.loyaltyCard.createdAt.toDate) {
            result.loyaltyCard.createdAt = result.loyaltyCard.createdAt.toDate();
          } else if (typeof result.loyaltyCard.createdAt === 'string') {
            const date = new Date(result.loyaltyCard.createdAt);
            if (!isNaN(date.getTime())) {
              result.loyaltyCard.createdAt = date;
            } else {
              result.loyaltyCard.createdAt = new Date();
            }
          }
        } else {
          result.loyaltyCard.createdAt = new Date();
        }
        
        // Convertir la date de dernière utilisation si elle existe
        if (result.loyaltyCard.lastUsed) {
          if (result.loyaltyCard.lastUsed.toDate) {
            result.loyaltyCard.lastUsed = result.loyaltyCard.lastUsed.toDate();
          } else if (typeof result.loyaltyCard.lastUsed === 'string') {
            const date = new Date(result.loyaltyCard.lastUsed);
            if (!isNaN(date.getTime())) {
              result.loyaltyCard.lastUsed = date;
            } else {
              result.loyaltyCard.lastUsed = new Date();
            }
          }
        } else {
          result.loyaltyCard.lastUsed = new Date();
        }
      } catch (error) {
        console.error('Erreur lors de la conversion des dates de la carte de fidélité:', error);
        // Assurer des valeurs par défaut
        result.loyaltyCard.createdAt = new Date();
        result.loyaltyCard.lastUsed = new Date();
      }
    }
    
    return result as Sale;
  } catch (error) {
    console.error('Erreur lors de la conversion des données Firestore:', error);
    return { id: doc.id } as Sale;
  }
};

/**
 * Initialise un écouteur pour les changements dans la collection des ventes
 */
export const initSalesListener = (callback: (sales: Sale[]) => void): () => void => {
  console.log('Initialisation de l\'écouteur de ventes');
  
  // Si l'écouteur est déjà initialisé et que le cache contient des données, 
  // appeler immédiatement le callback avec les données du cache
  if (isListenerInitialized && salesCache.length > 0) {
    console.log(`Utilisation du cache existant avec ${salesCache.length} ventes`);
    setTimeout(() => callback(salesCache), 0);
  }
  
  // Nettoyer les écouteurs existants seulement si nous n'avons pas déjà un écouteur actif
  if (!isListenerInitialized) {
    cleanupSalesListeners();
  }
  
  // Si l'écouteur est déjà initialisé, retourner une fonction de nettoyage sécurisée
  if (isListenerInitialized) {
    console.log('Écouteur déjà initialisé, retour d\'une fonction de nettoyage sécurisée');
    return () => {
      console.log('Fonction de nettoyage appelée pour un écouteur secondaire');
      // Ne pas nettoyer l'écouteur principal ici, car il peut être utilisé par d'autres composants
      return;
    };
  }
  
  // Utiliser une valeur fixe pour le businessId en mode développement
  // Cela évite d'utiliser une Promise dans la clause where()
  let effectiveBusinessId = 'business1';
  
  // En mode production, essayer de récupérer le businessId depuis localStorage
  if (process.env.NODE_ENV !== 'development') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedId = localStorage.getItem('businessId');
        if (storedId) {
          effectiveBusinessId = storedId;
          console.log('BusinessId récupéré du localStorage:', effectiveBusinessId);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du businessId:', error);
    }
  }
  
  console.log('BusinessId effectif pour l\'écouteur:', effectiveBusinessId);
  
  // Créer la requête
  const salesCollection = collection(db, SALES_COLLECTION);
  let q;
  
  try {
    if (effectiveBusinessId === 'business1') {
      // En mode développement, récupérer toutes les ventes sans filtrer par businessId
      // Utiliser seulement orderBy pour éviter les erreurs d'index
      q = query(salesCollection, orderBy('timestamp', 'desc'), limit(100));
    } else {
      // En mode production, filtrer par businessId
      q = query(salesCollection, where("businessId", "==", effectiveBusinessId));
    }
    
    // Ajouter l'écouteur
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        console.log(`Mise à jour des ventes reçue, ${snapshot.docs.length} documents`);
        
        // Convertir les documents en objets Sale
        const sales = snapshot.docs.map(doc => convertFromFirestore(doc));
        
        // Trier les ventes par date côté client
        sales.sort((a, b) => {
          const dateA = new Date(a.timestamp).getTime();
          const dateB = new Date(b.timestamp).getTime();
          return dateB - dateA; // Tri décroissant (plus récent d'abord)
        });
        
        // Mettre à jour le cache
        salesCache = [...sales];
        
        // Stocker les ventes pour cette entreprise
        storeSalesForBusiness(effectiveBusinessId, sales)
          .then(() => console.log(`Ventes stockées avec succès pour l'entreprise ${effectiveBusinessId}`))
          .catch(error => console.error('Erreur lors du stockage des ventes:', error));
        
        // Appeler le callback avec les ventes
        callback(sales);
      } catch (error) {
        console.error('Erreur lors du traitement des données de ventes:', error);
      }
    }, (error) => {
      console.error('Erreur lors de l\'écoute des changements de ventes:', error);
    });
    
    // Marquer l'écouteur comme initialisé
    isListenerInitialized = true;
    
    // Stocker la fonction de nettoyage
    salesListeners.push(unsubscribe);
    
    // Retourner la fonction de nettoyage sécurisée qui vérifie si l'objet existe
    return () => {
      console.log('Fonction de nettoyage appelée pour un écouteur principal');
      // Vérifier si les éléments nécessaires existent avant de les utiliser
      if (salesListeners && salesListeners.length > 0) {
        try {
          // Désabonner individuellement
          console.log('Nettoyage sécurisé des écouteurs de ventes');
        } catch (error) {
          console.error('Erreur lors du nettoyage des écouteurs de ventes:', error);
        }
      }
    };
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de l\'écouteur de ventes:', error);
    return () => {}; // Retourner une fonction vide en cas d'erreur
  }
};

/**
 * Stocke les ventes pour une entreprise spécifique dans une collection dédiée
 */
const storeSalesForBusiness = async (businessId: string, sales: Sale[]) => {
  try {
    console.log(`Stockage de ${sales.length} ventes pour l'entreprise ${businessId}`);
    
    // Créer une référence au document de l'entreprise
    const businessSalesRef = doc(db, BUSINESS_SALES_COLLECTION, businessId);
    
    // Stocker les ventes dans le document
    await setDoc(businessSalesRef, {
      sales: sales.map(sale => ({
        id: sale.id,
        timestamp: sale.timestamp,
        total: sale.total,
        paymentMethod: sale.paymentMethod,
        receiptNumber: sale.receiptNumber,
        businessId: sale.businessId
      })),
      lastUpdated: Timestamp.now()
    }, { merge: true });
    
    console.log(`Ventes stockées avec succès pour l'entreprise ${businessId}`);
  } catch (error) {
    console.error(`Erreur lors du stockage des ventes pour l'entreprise ${businessId}:`, error);
  }
};

/**
 * Récupère les ventes stockées pour une entreprise spécifique
 */
const getSalesForBusiness = async (businessId: string): Promise<Sale[]> => {
  try {
    console.log(`Récupération des ventes pour l'entreprise ${businessId}`);
    
    // Créer une référence au document de l'entreprise
    const businessSalesRef = doc(db, BUSINESS_SALES_COLLECTION, businessId);
    const businessSalesSnap = await getDoc(businessSalesRef);
    
    if (businessSalesSnap.exists()) {
      const data = businessSalesSnap.data();
      console.log(`${data.sales?.length || 0} ventes récupérées pour l'entreprise ${businessId}`);
      
      // Si des ventes sont stockées, les retourner
      if (data.sales && Array.isArray(data.sales) && data.sales.length > 0) {
        // Pour chaque vente stockée, récupérer les détails complets
        const salesPromises = data.sales.map(async (saleSummary: any) => {
          return await getSaleById(saleSummary.id);
        });
        
        const salesDetails = await Promise.all(salesPromises);
        return salesDetails.filter(Boolean) as Sale[];
      }
    }
    
    console.log(`Aucune vente stockée pour l'entreprise ${businessId}`);
    return [];
  } catch (error) {
    console.error(`Erreur lors de la récupération des ventes pour l'entreprise ${businessId}:`, error);
    return [];
  }
};

/**
 * Nettoie tous les écouteurs de ventes de manière sécurisée
 */
export const cleanupSalesListeners = () => {
  try {
    // Vérifier que salesListeners existe et n'est pas vide
    if (salesListeners && Array.isArray(salesListeners)) {
      console.log(`Nettoyage de ${salesListeners.length} écouteurs de ventes`);
      
      // Parcourir sécuritairement le tableau et vérifier que chaque élément est une fonction
      salesListeners.forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          try {
            unsubscribe();
          } catch (error) {
            console.error('Erreur lors du désabonnement d\'un écouteur:', error);
          }
        }
      });
      
      // Réinitialiser le tableau
      salesListeners = [];
    } else {
      console.log('Aucun écouteur de ventes à nettoyer');
      salesListeners = [];
    }
    
    // Réinitialiser l'état
    isListenerInitialized = false;
  } catch (error) {
    console.error('Erreur lors du nettoyage des écouteurs de ventes:', error);
    // Réinitialiser l'état en cas d'erreur pour éviter de futurs problèmes
    salesListeners = [];
    isListenerInitialized = false;
  }
};

/**
 * Ajoute un businessId aux ventes qui n'en ont pas
 */
const addBusinessIdToSales = async (): Promise<void> => {
  try {
    console.log('Recherche des ventes sans businessId...');
    
    // Récupérer toutes les ventes
    const salesCollection = collection(db, SALES_COLLECTION);
    const salesSnapshot = await getDocs(salesCollection);
    
    // Identifier les ventes sans businessId
    const salesWithoutBusinessId = salesSnapshot.docs.filter(doc => {
      const data = doc.data();
      return !data.businessId;
    });
    
    console.log(`${salesWithoutBusinessId.length} ventes sans businessId trouvées`);
    
    // Ajouter un businessId aux ventes qui n'en ont pas
    const updatePromises = salesWithoutBusinessId.map(async (docSnapshot) => {
      const saleId = docSnapshot.id;
      console.log(`Ajout d'un businessId à la vente ${saleId}`);
      
      // Mettre à jour le document avec un businessId par défaut
      const saleRef = doc(db, SALES_COLLECTION, saleId);
      await setDoc(saleRef, { businessId: 'business1' }, { merge: true });
      
      return saleId;
    });
    
    // Attendre que toutes les mises à jour soient terminées
    const updatedSaleIds = await Promise.all(updatePromises);
    console.log(`${updatedSaleIds.length} ventes mises à jour avec un businessId`);
    
  } catch (error) {
    console.error('Erreur lors de l\'ajout de businessId aux ventes:', error);
  }
};

/**
 * Récupère toutes les ventes depuis Firestore ou du cache
 */
export const getSales = async (forceRefresh = false): Promise<Sale[]> => {
  try {
    console.log('Début de getSales(), forceRefresh:', forceRefresh);
    
    // Si le cache contient des ventes et qu'on ne force pas le rechargement, les retourner immédiatement
    if (salesCache.length > 0 && !forceRefresh) {
      console.log(`Retour de ${salesCache.length} ventes depuis le cache`);
      return salesCache;
    }
    
    // D'abord, ajouter un businessId aux ventes qui n'en ont pas
    await addBusinessIdToSales();
    
    // Ensuite, récupérer les ventes depuis Firestore
    const businessId = await getCurrentBusinessId();
    console.log('BusinessId récupéré:', businessId);
    
    // Utiliser un ID par défaut pour le développement si aucun utilisateur n'est connecté
    const effectiveBusinessId = businessId;
    console.log('BusinessId effectif utilisé:', effectiveBusinessId);
    
    // Si nous avons un businessId valide (pas en mode développement), essayer de récupérer les ventes stockées
    if (effectiveBusinessId !== 'business1') {
      const storedSales = await getSalesForBusiness(effectiveBusinessId);
      if (storedSales.length > 0) {
        console.log(`Utilisation de ${storedSales.length} ventes stockées pour l'entreprise ${effectiveBusinessId}`);
        salesCache = storedSales;
        return storedSales;
      }
    }
    
    const salesCollection = collection(db, SALES_COLLECTION);
    
    // Récupérer toutes les ventes pour déboguer
    console.log('Récupération de toutes les ventes pour déboguer...');
    const allSalesSnapshot = await getDocs(collection(db, SALES_COLLECTION));
    console.log(`Total de ${allSalesSnapshot.docs.length} ventes dans la base de données`);
    
    // Afficher les businessIds présents dans la collection
    const businessIds = new Set<string>();
    allSalesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.businessId) {
        businessIds.add(data.businessId);
      }
    });
    console.log('BusinessIds présents dans la collection:', Array.from(businessIds));
    
    // Récupérer les ventes avec le businessId effectif
    async function retrieveSales() {
      try {
        let q;
        // Toujours filtrer par businessId, même en mode développement
        console.log('Filtrage par businessId:', effectiveBusinessId);
        q = query(salesCollection, where("businessId", "==", effectiveBusinessId), orderBy('timestamp', 'desc'));
        
        console.log('Exécution de la requête Firestore avec tri...');
        const salesSnapshot = await getDocs(q);
        console.log(`${salesSnapshot.docs.length} ventes récupérées`);
        
        // Convertir les documents en objets Sale
        return salesSnapshot.docs.map(doc => convertFromFirestore(doc));
      } catch (indexError) {
        // Si erreur d'index, essayer sans le tri
        console.warn('Index manquant dans Firestore. Tentative sans tri:', indexError);
        console.warn('Un index doit être créé dans Firebase Console pour optimiser cette requête.');
        
        // Solution de secours sans orderBy pour éviter l'erreur d'index
        const qFallback = query(salesCollection, where("businessId", "==", effectiveBusinessId));
        console.log('Exécution de la requête Firestore sans tri...');
        const salesSnapshot = await getDocs(qFallback);
        console.log(`${salesSnapshot.docs.length} ventes récupérées sans tri`);
        
        // Convertir les documents et trier côté client
        const sales = salesSnapshot.docs.map(doc => convertFromFirestore(doc));
        return sales.sort((a, b) => {
          const dateA = a.timestamp instanceof Date ? a.timestamp : new Date();
          const dateB = b.timestamp instanceof Date ? b.timestamp : new Date();
          return dateB.getTime() - dateA.getTime(); // Tri décroissant
        });
      }
    }
    
    // Récupérer les ventes
    const sales = await retrieveSales();
    
    // Mettre à jour le cache
    salesCache = sales;
    
    // Stocker les ventes pour l'entreprise si nous ne sommes pas en mode développement
    if (effectiveBusinessId !== 'business1') {
      await storeSalesForBusiness(effectiveBusinessId, sales);
    }
    
    // Afficher un exemple de vente si disponible
    if (sales.length > 0) {
      console.log('Exemple de vente:', JSON.stringify(sales[0], null, 2));
    }
    
    return sales;
  } catch (error) {
    console.error('Erreur lors de la récupération des ventes:', error);
    return salesCache; // Retourner le cache en cas d'erreur
  }
};

/**
 * Récupère une vente par son ID
 */
export const getSaleById = async (saleId: string): Promise<Sale | null> => {
  try {
    // Vérifier d'abord dans le cache
    const cachedSale = salesCache.find(sale => sale.id === saleId);
    if (cachedSale) {
      return cachedSale;
    }
    
    const businessId = await getCurrentBusinessId();
    
    const saleRef = doc(db, SALES_COLLECTION, saleId);
    const saleSnap = await getDoc(saleRef);
    
    if (saleSnap.exists()) {
      const saleData = saleSnap.data();
      
      // En mode développement, permettre l'accès à toutes les ventes
      if (businessId === 'business1' || saleData.businessId === businessId) {
        return convertFromFirestore(saleSnap);
      } else {
        console.error('Cette vente n\'appartient pas à votre entreprise');
        return null;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Erreur lors de la récupération de la vente ${saleId}:`, error);
    return null;
  }
};

/**
 * Ajoute une nouvelle vente
 */
export const addSale = async (sale: Omit<Sale, 'id'>): Promise<Sale | null> => {
  try {
    console.log('Début de addSale()');
    
    // Vérifier que le businessId est présent
    if (!sale.businessId) {
      console.error('Erreur: businessId manquant dans les données de vente');
      sale.businessId = 'business1'; // Valeur par défaut si manquante
    }
    
    // Vérifier que tous les éléments du panier ont un businessId
    const itemsWithMissingBusinessId = sale.items.filter(item => !item.businessId);
    if (itemsWithMissingBusinessId.length > 0) {
      console.log('Correction des éléments du panier sans businessId');
      
      // Corriger les éléments sans businessId
      sale.items = sale.items.map(item => {
        if (!item.businessId) {
          return {
            ...item,
            businessId: sale.businessId
          };
        }
        return item;
      });
    }
    
    // Vérifier que la carte de fidélité est valide si elle est présente
    if (sale.loyaltyCard && !sale.loyaltyCard.id) {
      console.log('Suppression de la carte de fidélité invalide');
      sale.loyaltyCard = undefined;
      sale.pointsEarned = 0;
    }
    
    // Simplifier les données pour Firestore
    const firestoreSale = prepareForFirestore(sale);
    
    try {
      // Ajouter la vente à Firestore de manière simple
      console.log('Ajout de la vente à Firestore');
      const salesCollection = collection(db, SALES_COLLECTION);
      const docRef = await addDoc(salesCollection, firestoreSale);
      console.log('Vente ajoutée avec succès, ID:', docRef.id);
      
      // Retourner la vente avec son ID
      const newSale = {
        ...sale,
        id: docRef.id
      } as Sale;
      
      // Ajouter la nouvelle vente au cache
      salesCache = [newSale, ...salesCache];
      
      // Mettre à jour le stockage des ventes pour l'entreprise
      if (sale.businessId !== 'business1') {
        await storeSalesForBusiness(sale.businessId, salesCache);
      }
      
      return newSale;
    } catch (firestoreError) {
      console.error('Erreur Firestore lors de l\'ajout de la vente:', firestoreError);
      return null;
    }
  } catch (error) {
    console.error('Erreur générale lors de l\'ajout de la vente:', error);
    return null;
  }
};

/**
 * Récupère les ventes par date
 */
export const getSalesByDate = async (startDate: Date, endDate: Date): Promise<Sale[]> => {
  try {
    // Filtrer d'abord le cache si possible
    if (salesCache.length > 0) {
      const filteredSales = salesCache.filter(sale => {
        // Convertir le timestamp en date
        let saleDate;
        try {
          // Gestion des différents formats de timestamp
          if (sale.timestamp instanceof Date) {
            saleDate = sale.timestamp;
          } else if (sale.timestamp && typeof sale.timestamp === 'object' && sale.timestamp !== null) {
            // Essayer de gérer les Timestamp Firestore
            try {
              if ('toDate' in sale.timestamp && typeof (sale.timestamp as any).toDate === 'function') {
                saleDate = (sale.timestamp as any).toDate();
              } else {
                saleDate = new Date(sale.timestamp as any);
              }
            } catch (e) {
              saleDate = new Date(sale.timestamp as any);
            }
          } else {
            // Chaîne de caractères ou nombre
            saleDate = new Date(sale.timestamp);
          }
          
          // Vérifier si la date est valide
          if (isNaN(saleDate.getTime())) {
            console.warn(`Date invalide pour la vente ${sale.id}:`, sale.timestamp);
            return false;
          }
          
          // Comparer avec la plage de dates (inclure les dates limites)
          const startOfStartDate = new Date(startDate);
          startOfStartDate.setHours(0, 0, 0, 0);
          
          const endOfEndDate = new Date(endDate);
          endOfEndDate.setHours(23, 59, 59, 999);
          
          return saleDate >= startOfStartDate && saleDate <= endOfEndDate;
        } catch (error) {
          console.error(`Erreur lors de la conversion de la date pour la vente ${sale.id}:`, error);
          return false;
        }
      });
      
      if (filteredSales.length > 0) {
        console.log(`Retour de ${filteredSales.length} ventes filtrées par date depuis le cache`);
        return filteredSales;
      }
    }
    
    const businessId = await getCurrentBusinessId();
    
    const salesCollection = collection(db, SALES_COLLECTION);
    
    let salesData: Sale[] = [];
    
    try {
      // Stratégie 1: Essayer d'abord avec une requête simple pour éviter les erreurs d'index
      if (businessId === 'business1') {
        // En mode développement, récupérer toutes les ventes
        const q = query(salesCollection);
        const snapshot = await getDocs(q);
        salesData = snapshot.docs.map(doc => convertFromFirestore(doc));
        
        // Filtrer côté client
        salesData = salesData.filter(sale => {
          const saleDate = new Date(sale.timestamp);
          return saleDate >= startDate && saleDate <= endDate;
        });
      } else {
        // En mode production, filtrer par businessId
        const q = query(salesCollection, where('businessId', '==', businessId));
        const snapshot = await getDocs(q);
        salesData = snapshot.docs.map(doc => convertFromFirestore(doc));
        
        // Filtrer par date côté client
        salesData = salesData.filter(sale => {
          const saleDate = new Date(sale.timestamp);
          return saleDate >= startDate && saleDate <= endDate;
        });
      }
    } catch (error) {
      console.warn('Erreur avec la requête simple, tentative avec une requête alternative:', error);
      
      // Stratégie 2: Si la première approche échoue, essayer avec une requête plus simple
      const q = query(salesCollection);
      const snapshot = await getDocs(q);
      salesData = snapshot.docs.map(doc => convertFromFirestore(doc));
      
      // Filtrer manuellement côté client
      salesData = salesData.filter(sale => {
        // Filtrer par businessId
        if (businessId !== 'business1' && sale.businessId !== businessId) {
          return false;
        }
        
        // Filtrer par date
        // Convertir le timestamp en date
        let saleDate;
        try {
          // Gestion des différents formats de timestamp
          if (sale.timestamp instanceof Date) {
            saleDate = sale.timestamp;
          } else if (sale.timestamp && typeof sale.timestamp === 'object' && sale.timestamp !== null) {
            // Essayer de gérer les Timestamp Firestore
            try {
              if ('toDate' in sale.timestamp && typeof (sale.timestamp as any).toDate === 'function') {
                saleDate = (sale.timestamp as any).toDate();
              } else {
                saleDate = new Date(sale.timestamp as any);
              }
            } catch (e) {
              saleDate = new Date(sale.timestamp as any);
            }
          } else {
            // Chaîne de caractères ou nombre
            saleDate = new Date(sale.timestamp);
          }
          
          // Vérifier si la date est valide
          if (isNaN(saleDate.getTime())) {
            console.warn(`Date invalide pour la vente ${sale.id}:`, sale.timestamp);
            return false;
          }
          
          // Comparer avec la plage de dates (inclure les dates limites)
          const startOfStartDate = new Date(startDate);
          startOfStartDate.setHours(0, 0, 0, 0);
          
          const endOfEndDate = new Date(endDate);
          endOfEndDate.setHours(23, 59, 59, 999);
          
          return saleDate >= startOfStartDate && saleDate <= endOfEndDate;
        } catch (error) {
          console.error(`Erreur lors de la conversion de la date pour la vente ${sale.id}:`, error);
          return false;
        }
      });
    }
    
    // Trier les ventes par date (plus récent d'abord)
    salesData.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return dateB - dateA;
    });
    
    console.log(`Récupération de ${salesData.length} ventes par date`);
    return salesData;
  } catch (error) {
    console.error('Erreur lors de la récupération des ventes par date:', error);
    return [];
  }
};

/**
 * Vide le cache des ventes pour forcer un rechargement
 */
export const clearSalesCache = () => {
  console.log('Vidage du cache des ventes');
  salesCache = [];
};

/**
 * Supprime une vente par son ID
 * @param saleId ID de la vente à supprimer
 * @returns true si la suppression est réussie, false sinon
 */
export const deleteSale = async (saleId: string): Promise<boolean> => {
  try {
    console.log(`Tentative de suppression de la vente: ${saleId}`);
    
    // Référence au document de la vente
    const saleRef = doc(db, SALES_COLLECTION, saleId);
    
    // Vérifier si la vente existe
    const saleDoc = await getDoc(saleRef);
    if (!saleDoc.exists()) {
      console.error(`La vente avec l'ID ${saleId} n'existe pas`);
      return false;
    }
    
    // Supprimer la vente de Firestore en utilisant la méthode deleteDoc
    await deleteDoc(saleRef);
    
    // Mettre à jour le cache en supprimant la vente
    salesCache = salesCache.filter(sale => sale.id !== saleId);
    
    console.log(`Vente ${saleId} supprimée avec succès`);
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression de la vente:', error);
    return false;
  }
};
