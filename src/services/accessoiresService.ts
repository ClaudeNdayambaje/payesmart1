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

export interface Accessory {
  id: string;
  name: string;            // Nom de l'accessoire
  description: string;     // Description détaillée
  category: string;        // Catégorie (impression, paiement, affichage, reseau, etc.)
  price: number;           // Prix en euros
  features: string[];      // Liste des caractéristiques techniques
  imageUrl: string;        // URL de l'image principale
  videoUrl?: string;       // URL de la vidéo (facultatif)
  showVideoButton?: boolean; // Afficher ou non le bouton vidéo (même si URL présente)
  stock?: number;          // Quantité en stock
  availability?: boolean;  // Disponibilité du produit
  technicalSpecs?: Record<string, string>; // Spécifications techniques (clé-valeur)
  active?: boolean;        // Statut de l'accessoire (actif/inactif)
  createdBy?: string;      // UID de l'utilisateur ayant créé l'accessoire
  createdAt?: string;      // Date de création au format ISO
  updatedAt?: string;      // Date de dernière mise à jour au format ISO
  priority?: number;       // Priorité d'affichage
}

// Collection Firestore pour les accessoires
const ACCESSORIES_COLLECTION = 'accessoires';

/**
 * Récupère tous les accessoires depuis Firestore
 */
export const getAccessories = async (): Promise<Accessory[]> => {
  try {
    const accessoriesCollection = collection(db, ACCESSORIES_COLLECTION);
    const accessoriesSnapshot = await getDocs(accessoriesCollection);
    
    return accessoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Accessory[];
  } catch (error) {
    console.error('Erreur lors de la récupération des accessoires:', error);
    return [];
  }
};

/**
 * Récupère un accessoire spécifique par son ID
 */
export const getAccessoryById = async (accessoryId: string): Promise<Accessory | null> => {
  try {
    const accessoryRef = doc(db, ACCESSORIES_COLLECTION, accessoryId);
    const accessorySnap = await getDoc(accessoryRef);
    
    if (accessorySnap.exists()) {
      return {
        id: accessorySnap.id,
        ...accessorySnap.data()
      } as Accessory;
    }
    
    return null;
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'accessoire ${accessoryId}:`, error);
    return null;
  }
};

/**
 * Ajoute un nouvel accessoire
 */
export const addAccessory = async (accessoryData: Omit<Accessory, 'id'>): Promise<Accessory | null> => {
  try {
    // Créer un objet de données nettoyé sans propriétés undefined
    const cleanedData: Partial<Accessory> = Object.entries(accessoryData)
      .filter(([_, value]) => value !== undefined)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {} as Partial<Accessory>);
    
    console.log('Données nettoyées pour l\'ajout:', cleanedData);
    
    // S'assurer que les champs obligatoires existent
    if (!cleanedData.name) throw new Error('Le nom de l\'accessoire est obligatoire');
    if (!cleanedData.description) throw new Error('La description est obligatoire');
    if (!cleanedData.category) throw new Error('La catégorie est obligatoire');
    if (cleanedData.price === undefined) throw new Error('Le prix est obligatoire');
    
    // Ajouter des valeurs par défaut pour certains champs
    if (!cleanedData.features) cleanedData.features = [];
    if (cleanedData.active === undefined) cleanedData.active = true;
    if (cleanedData.availability === undefined) cleanedData.availability = true;
    cleanedData.createdAt = new Date().toISOString();
    cleanedData.updatedAt = new Date().toISOString();
    
    const accessoriesCollection = collection(db, ACCESSORIES_COLLECTION);
    const docRef = await addDoc(accessoriesCollection, cleanedData);
    
    return {
      id: docRef.id,
      ...cleanedData
    } as Accessory;
  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'accessoire:', error);
    return null;
  }
};

/**
 * Met à jour un accessoire existant
 */
export const updateAccessory = async (accessoryId: string, accessoryData: Partial<Accessory>): Promise<boolean> => {
  try {
    console.log(`Début de mise à jour de l'accessoire ${accessoryId}`, accessoryData);
    const accessoryRef = doc(db, ACCESSORIES_COLLECTION, accessoryId);
    const accessorySnap = await getDoc(accessoryRef);
    
    if (!accessorySnap.exists()) {
      console.error(`L'accessoire ${accessoryId} n'existe pas`);
      return false;
    }
    
    // Vérifier spécifiquement l'URL de la vidéo
    if (accessoryData.videoUrl !== undefined) {
      console.log(`Mise à jour de l'URL vidéo: ${accessoryData.videoUrl}`);
    }
    
    // Créer un objet de mise à jour sans propriétés undefined
    const cleanedData: Partial<Accessory> = Object.entries(accessoryData)
      .filter(([_, value]) => value !== undefined)
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {} as Partial<Accessory>);
    
    console.log('Données nettoyées pour la mise à jour:', cleanedData);
    
    // Ajouter la date de mise à jour
    cleanedData.updatedAt = new Date().toISOString();
    
    await updateDoc(accessoryRef, cleanedData);
    console.log(`Accessoire ${accessoryId} mis à jour avec succès`);
    return true;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de l'accessoire ${accessoryId}:`, error);
    return false;
  }
};

/**
 * Supprime un accessoire
 */
export const deleteAccessory = async (accessoryId: string): Promise<boolean> => {
  try {
    // Vérification de la connexion Firebase
    if (!db) {
      console.error('🛑 ERREUR CRITIQUE: Connexion Firestore non disponible');
      return false;
    }

    console.log(`🔴 FONCTION deleteAccessory APPELÉE pour ID: ${accessoryId}`);
    console.log(`💾 Collection cible: '${ACCESSORIES_COLLECTION}'`);
    
    // Vérification de base de l'ID
    if (!accessoryId || typeof accessoryId !== 'string' || accessoryId.trim() === '') {
      console.error('❌ ID accessoire invalide pour suppression:', accessoryId);
      return false;
    }
    
    // Référence directe au document dans Firestore
    const accessoryRef = doc(db, ACCESSORIES_COLLECTION, accessoryId);
    console.log(`📝 Référence créée: ${accessoryRef.path}`);
    
    // Exécuter la suppression sans vérification préalable
    console.log(`⚔️ Exécution de deleteDoc sur ${accessoryRef.path}...`);
    
    await deleteDoc(accessoryRef);
    
    console.log(`✅ Suppression réussie pour l'ID: ${accessoryId}`);
    return true;
    
  } catch (error) {
    console.error(`❌ ERREUR dans deleteAccessory pour ${accessoryId}:`, error);
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
 * @param storagePath Chemin du fichier dans Firebase Storage (ex: 'videos/accessoire123.mp4')
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
 * Actualise l'URL vidéo d'un accessoire en générant une URL signée
 * @param accessoryId ID de l'accessoire
 * @returns true si l'actualisation a réussi, false sinon
 */
export const refreshAccessoryVideoUrl = async (accessoryId: string): Promise<boolean> => {
  try {
    // 1. Récupérer l'accessoire
    const accessory = await getAccessoryById(accessoryId);
    if (!accessory || !accessory.videoUrl) {
      console.warn('Accessoire non trouvé ou sans URL vidéo');
      return false;
    }
    
    // 2. Générer une nouvelle URL signée
    const newSignedUrl = await generateSignedUrl(accessory.videoUrl);
    if (!newSignedUrl) return false;
    
    // 3. Mettre à jour l'accessoire avec la nouvelle URL
    return updateAccessory(accessoryId, { videoUrl: newSignedUrl });
  } catch (error) {
    console.error('Erreur lors de l\'actualisation de l\'URL vidéo:', error);
    return false;
  }
};

/**
 * Active ou désactive un accessoire
 */
export const toggleAccessoryActive = async (accessoryId: string, active: boolean): Promise<boolean> => {
  return updateAccessory(accessoryId, { active });
};

export default { 
  getAccessories, 
  getAccessoryById, 
  addAccessory,
  updateAccessory, 
  deleteAccessory, 
  generateSignedUrl,
  refreshAccessoryVideoUrl,
  toggleAccessoryActive
};
