import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { auth } from '../firebase';

/**
 * Service simplifié pour l'upload de vidéos
 * Version plus légère avec moins de logs et de traitement
 */
export const uploadVideoSimple = async (file: File): Promise<{
  success: boolean;
  videoUrl?: string;
  error?: string;
}> => {
  try {
    // Vérification de base
    if (!file || !file.type.startsWith('video/')) {
      return {
        success: false,
        error: "Fichier invalide ou non supporté"
      };
    }

    // Vérification de l'authentification
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return {
        success: false,
        error: "Vous devez être connecté pour télécharger des vidéos"
      };
    }
    
    // Création d'un nom de fichier unique
    const timestamp = new Date().getTime();
    const extension = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const fileName = `video_${timestamp}.${extension}`;
    const folderPath = 'products/videos';
    const fullPath = `${folderPath}/${fileName}`;
    
    // Référence au stockage Firebase
    const storage = getStorage();
    const storageRef = ref(storage, fullPath);
    
    // Upload du fichier directement
    const uploadTask = await uploadBytesResumable(storageRef, file);
    
    // Obtenir l'URL de téléchargement
    const downloadURL = await getDownloadURL(uploadTask.ref);
    
    return {
      success: true,
      videoUrl: downloadURL
    };
    
  } catch (error: any) {
    console.error('Erreur lors de l\'upload:', error);
    return {
      success: false,
      error: `Erreur: ${error.message || "Problème inconnu"}`
    };
  }
};
