import { db, storage } from '../firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';

export interface MarketingProduct {
  id: string;
  name: string;            // Titre principal (H1)
  subtitle: string;        // Sous-titre accroche (H2)
  description: string;     // Description détaillée
  category: string;
  price: number;
  features: string[];      // Liste des caractéristiques techniques
  imageUrl: string;        // Image principale
  videoUrl?: string;       // URL de la vidéo du produit (facultatif)
  showVideoButton?: boolean; // Afficher ou non le bouton vidéo (même si URL présente)
  buttonCTAs?: {
    label: string;         // Texte du bouton
    url: string;           // URL ou action liée
    type: 'primary' | 'secondary'; // Style du bouton
  }[];
  technicalSpecs?: Record<string, string>; // Spécifications techniques (clé-valeur)
  active?: boolean;        // Statut du produit (actif/inactif)
  createdBy?: string;      // UID de l'utilisateur ayant créé le produit
  createdAt?: string;      // Date de création au format ISO
  updatedAt?: string;      // Date de dernière mise à jour au format ISO
  priority?: number;
}

// Collection Firestore pour les produits marketing
const PRODUCTS_COLLECTION = 'produits';

/**
 * Récupère tous les produits marketing depuis Firestore
 */
export const getMarketingProducts = async (): Promise<MarketingProduct[]> => {
  try {
    const productsCollection = collection(db, PRODUCTS_COLLECTION);
    const productsSnapshot = await getDocs(productsCollection);
    
    return productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MarketingProduct[];
  } catch (error) {
    console.error('Erreur lors de la récupération des produits marketing:', error);
    return [];
  }
};

/**
 * Récupère un produit marketing spécifique par son ID
 */
export const getMarketingProductById = async (productId: string): Promise<MarketingProduct | null> => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    const productSnap = await getDoc(productRef);
    
    if (productSnap.exists()) {
      return {
        id: productSnap.id,
        ...productSnap.data()
      } as MarketingProduct;
    }
    
    return null;
  } catch (error) {
    console.error(`Erreur lors de la récupération du produit marketing ${productId}:`, error);
    return null;
  }
};

/**
 * Ajoute un nouveau produit marketing
 */
export const addMarketingProduct = async (productData: Omit<MarketingProduct, 'id'>): Promise<MarketingProduct | null> => {
  try {
    const productsCollection = collection(db, PRODUCTS_COLLECTION);
    const docRef = await addDoc(productsCollection, productData);
    
    return {
      id: docRef.id,
      ...productData
    } as MarketingProduct;
  } catch (error) {
    console.error('Erreur lors de l\'ajout du produit marketing:', error);
    return null;
  }
};

/**
 * Met à jour un produit marketing existant
 */
export const updateMarketingProduct = async (productId: string, productData: Partial<MarketingProduct>): Promise<boolean> => {
  try {
    console.log(`Début de mise à jour du produit marketing ${productId}`, productData);
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    const productSnap = await getDoc(productRef);
    
    if (!productSnap.exists()) {
      console.error(`Le produit marketing ${productId} n'existe pas`);
      return false;
    }
    
    // Vérifier spécifiquement l'URL de la vidéo
    if (productData.videoUrl !== undefined) {
      console.log(`Mise à jour de l'URL vidéo: ${productData.videoUrl}`);
    }
    
    // Créer un objet de mise à jour sans propriétés undefined
    const cleanedData = Object.entries(productData)
      .filter(([_, value]) => value !== undefined)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    
    console.log('Données nettoyées pour la mise à jour:', cleanedData);
    
    await updateDoc(productRef, cleanedData);
    console.log(`Produit marketing ${productId} mis à jour avec succès`);
    return true;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du produit marketing ${productId}:`, error);
    return false;
  }
};

/**
 * Supprime un produit marketing - Version optimisée et corrigée pour la collection 'produits'
 */
export const deleteMarketingProduct = async (productId: string): Promise<boolean> => {
  try {
    // Vérification de la connexion Firebase
    if (!db) {
      console.error('🛑 ERREUR CRITIQUE: Connexion Firestore non disponible');
      return false;
    }

    console.log(`🔴 FONCTION deleteMarketingProduct APPELÉE pour ID: ${productId}`);
    console.log(`💾 Collection cible: '${PRODUCTS_COLLECTION}'`);
    
    // Vérification de base de l'ID
    if (!productId || typeof productId !== 'string' || productId.trim() === '') {
      console.error('❌ ID produit invalide pour suppression:', productId);
      return false;
    }
    
    // Référence directe au document dans Firestore
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    console.log(`📝 Référence créée: ${productRef.path}`);
    
    // Exécuter la suppression sans vérification préalable
    console.log(`⚔️ Exécution de deleteDoc sur ${productRef.path}...`);
    
    await deleteDoc(productRef);
    
    console.log(`✅ Suppression réussie pour l'ID: ${productId}`);
    return true;
    
  } catch (error) {
    console.error(`❌ ERREUR dans deleteMarketingProduct pour ${productId}:`, error);
    console.error('Type d\'erreur:', error?.constructor?.name || 'Inconnu');
    
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
      
      // Vérification des erreurs liées aux permissions
      const errorMsg = error.message.toLowerCase();
      if (errorMsg.includes('permission') || errorMsg.includes('access') || errorMsg.includes('denied')) {
        console.error('🚫 ERREUR DE PERMISSION: Vérifiez les règles de sécurité Firestore');
      }
    }
    
    return false;
  }
};

/**
 * Génère une URL signée Firebase Storage à partir d'un chemin de stockage
 * @param storagePath Chemin du fichier dans Firebase Storage (ex: 'videos/produit123.mp4')
 * @returns URL signée ou null en cas d'erreur
 */
export const generateSignedUrl = async (storagePath: string): Promise<string | null> => {
  if (!storagePath) return null;
  
  try {
    // Si l'URL est déjà une URL complète (http/https), la retourner telle quelle
    if (storagePath.startsWith('http')) {
      return storagePath;
    }
    
    // Sinon, générer une URL signée depuis Firebase Storage
    const storageRef = ref(storage, storagePath);
    const signedUrl = await getDownloadURL(storageRef);
    return signedUrl;
  } catch (error) {
    console.error('Erreur lors de la génération de l\'URL signée:', error);
    return null;
  }
};

/**
 * Actualise l'URL vidéo d'un produit en générant une URL signée
 * @param productId ID du produit
 * @returns true si l'actualisation a réussi, false sinon
 */
export const refreshProductVideoUrl = async (productId: string): Promise<boolean> => {
  try {
    // 1. Récupérer le produit
    const product = await getMarketingProductById(productId);
    if (!product || !product.videoUrl) {
      console.warn('Produit non trouvé ou sans URL vidéo');
      return false;
    }
    
    // 2. Générer une nouvelle URL signée
    const newSignedUrl = await generateSignedUrl(product.videoUrl);
    if (!newSignedUrl) return false;
    
    // 3. Mettre à jour le produit avec la nouvelle URL
    return updateMarketingProduct(productId, { videoUrl: newSignedUrl });
  } catch (error) {
    console.error('Erreur lors de l\'actualisation de l\'URL vidéo:', error);
    return false;
  }
};

// Export explicite pour assurer la disponibilité de la fonction
export default { deleteMarketingProduct };

/**
 * Active ou désactive un produit marketing
 */
export const toggleMarketingProductActive = async (productId: string, active: boolean): Promise<boolean> => {
  return updateMarketingProduct(productId, { active });
};
