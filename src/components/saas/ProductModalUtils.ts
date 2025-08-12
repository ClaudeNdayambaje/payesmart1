import { auth, storage } from "../../firebase";
import { toast } from "react-hot-toast";
import { ref, getDownloadURL, listAll, deleteObject } from "firebase/storage";
import { nanoid } from "nanoid";
import { signInAnonymously } from "firebase/auth";

/**
 * Vérifie si l'utilisateur est authentifié et tente une connexion anonyme si nécessaire
 * @returns Promise qui se résout avec true si l'authentification réussit
 */
export const ensureAuthentication = async (): Promise<boolean> => {
  try {
    // Vérifier si un utilisateur est déjà connecté
    if (auth.currentUser) {
      console.log("Utilisateur déjà authentifié:", auth.currentUser.uid);
      return true;
    }
    
    // Tenter une connexion anonyme
    console.log("Tentative d'authentification anonyme...");
    const userCredential = await signInAnonymously(auth);
    console.log("Authentification anonyme réussie:", userCredential.user.uid);
    return true;
  } catch (error) {
    console.error("Erreur d'authentification:", error);
    toast.error("Impossible de se connecter pour effectuer cette action");
    return false;
  }
};

/**
 * Vérifie si l'utilisateur est authentifié
 * @returns true si l'utilisateur est authentifié, sinon affiche un message d'erreur et retourne false
 */
export const checkAuthentication = (): boolean => {
  if (!auth.currentUser) {
    console.error("Utilisateur non connecté. Impossible de continuer.");
    toast.error("Vous devez être connecté pour effectuer cette action");
    return false;
  }
  return true;
};

/**
 * Génère un nom de fichier unique pour l'upload
 * @param originalFilename Le nom de fichier original
 * @returns Un nom de fichier unique basé sur un timestamp et un ID aléatoire
 */
export const generateUniqueFileName = (originalFilename: string): string => {
  const timestamp = new Date().getTime();
  const randomId = nanoid(6);
  const extension = originalFilename.split('.').pop() || '';
  return `${timestamp}_${randomId}${extension ? '.' + extension : ''}`;
};

/**
 * Nettoie les anciennes images temporaires d'un utilisateur
 * @param directory Le répertoire à nettoyer (ex: 'products/temp')
 */
export const cleanupTempFiles = async (directory: string): Promise<void> => {
  try {
    if (!auth.currentUser) return;
    
    const userId = auth.currentUser.uid;
    const userTempDir = `${directory}/${userId}`;
    
    const dirRef = ref(storage, userTempDir);
    
    // Lister tous les fichiers dans le répertoire temporaire
    const fileList = await listAll(dirRef);
    
    // Supprimer tous les fichiers plus vieux que 24h
    const deletePromises = fileList.items.map(async (itemRef) => {
      try {
        // Vérifier si le nom du fichier contient un timestamp
        const name = itemRef.name;
        const timestampMatch = name.match(/^(\d+)_/); // Extrait le timestamp du début du nom
        
        if (timestampMatch) {
          const fileTimestamp = parseInt(timestampMatch[1]);
          const now = new Date().getTime();
          const fileAge = now - fileTimestamp;
          
          // Si le fichier a plus de 24h (86400000 ms)
          if (fileAge > 86400000) {
            console.log(`Suppression du fichier temporaire: ${name}`);
            await deleteObject(itemRef);
          }
        } else {
          // Si le fichier n'a pas de timestamp, on le supprime par précaution
          await deleteObject(itemRef);
        }
      } catch (error) {
        console.error(`Erreur lors de la suppression du fichier ${itemRef.name}:`, error);
      }
    });
    
    await Promise.all(deletePromises);
    console.log(`Nettoyage des fichiers temporaires terminé pour ${userTempDir}`);
  } catch (error) {
    console.error("Erreur lors du nettoyage des fichiers temporaires:", error);
  }
};

/**
 * S'assure que l'URL de téléchargement contient un token d'authentification si nécessaire
 * @param url URL de Firebase Storage
 * @returns URL avec token d'authentification si nécessaire
 */
export const ensureAuthenticatedUrl = async (url: string): Promise<string> => {
  // Vérifier si l'URL est une URL Firebase Storage
  if (!url || !url.includes('firebasestorage.googleapis.com')) {
    return url;
  }
  
  try {
    // Extraire le chemin relatif de l'URL Firebase Storage
    const pathMatch = url.match(/o\/([^?]+)/);
    if (!pathMatch || !pathMatch[1]) {
      return url;
    }
    
    // Décoder le chemin URL-encoded
    const path = decodeURIComponent(pathMatch[1]);
    const fileRef = ref(storage, path);
    
    // Générer une nouvelle URL avec un token valide
    const freshUrl = await getDownloadURL(fileRef);
    console.log("URL avec token d'authentification rafraîchie");
    return freshUrl;
  } catch (error) {
    console.error("Erreur lors de la génération de l'URL authentifiée:", error);
    return url; // Retourner l'URL d'origine en cas d'erreur
  }
};
