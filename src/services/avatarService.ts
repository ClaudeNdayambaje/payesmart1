import { db } from '../firebase';
import { doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';
import { ADMIN_USERS_COLLECTION } from './adminUserService';

/**
 * Service pour gérer les avatars des utilisateurs sans utiliser Firebase Storage directement
 * Cette approche contourne les problèmes CORS en stockant l'avatar en base64 dans Firestore
 */

/**
 * Enregistre un avatar d'utilisateur en base64 directement dans Firestore
 * @param userId ID de l'utilisateur
 * @param dataUrl Image en format base64 (data URL)
 * @returns true si l'opération a réussi, false sinon
 */
export const saveUserAvatarBase64 = async (userId: string, dataUrl: string): Promise<boolean> => {
  try {
    console.log('Début de l\'enregistrement de l\'avatar en base64 pour l\'utilisateur:', userId);
    
    // Vérifier que l'utilisateur existe
    const userRef = doc(db, ADMIN_USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error(`L'utilisateur avec l'ID ${userId} n'existe pas`);
      return false;
    }
    
    // Vérifier que le format est correct
    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      console.error('Format d\'image invalide');
      return false;
    }
    
    // Limiter la taille de l'image (environ 2MB en base64)
    if (dataUrl.length > 2800000) {
      console.error('Image trop volumineuse (max ~2MB)');
      return false;
    }
    
    // Ajouter un timestamp pour éviter les problèmes de cache
    const timestamp = Date.now();
    
    // Mettre à jour l'utilisateur avec l'avatar en base64
    await updateDoc(userRef, {
      avatarBase64: dataUrl,
      avatarUrl: `data:image/base64;${timestamp}`, // URL fictive avec timestamp pour forcer le rafraîchissement
      updatedAt: Timestamp.now()
    });
    
    console.log('Avatar en base64 enregistré avec succès');
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'avatar en base64:', error);
    return false;
  }
};

/**
 * Récupère l'avatar en base64 d'un utilisateur
 * @param userId ID de l'utilisateur
 * @returns L'avatar en base64 ou null si non trouvé
 */
export const getUserAvatarBase64 = async (userId: string): Promise<string | null> => {
  try {
    const userRef = doc(db, ADMIN_USERS_COLLECTION, userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return null;
    }
    
    const userData = userDoc.data();
    return userData.avatarBase64 || null;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'avatar en base64:', error);
    return null;
  }
};
