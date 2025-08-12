import { auth, storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { nanoid } from 'nanoid';

export interface VideoUploadResult {
  success: boolean;
  videoUrl?: string;
  error?: string;
  debugInfo?: any;
  metadata?: {
    duration?: number;
    width?: number;
    height?: number;
    size?: number;
  };
}

/**
 * Upload une vidéo de produit directement vers Firebase Storage
 * Contourne la Cloud Function problématique
 */
export const uploadProductVideoDirectly = async (file: File, options?: {
  onProgress?: (progress: number) => void;
}): Promise<VideoUploadResult> => {
  console.log('🚀 Démarrage upload vidéo directement vers Storage...');
  console.log('📁 Informations sur le fichier:', {
    name: file.name,
    type: file.type,
    size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
  });

  const { onProgress } = options || {};
  
  try {
    // Vérification de l'authentification
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('❌ Utilisateur non authentifié');
      return {
        success: false,
        error: "Vous devez être connecté pour télécharger des vidéos"
      };
    }
    
    console.log('👤 Utilisateur authentifié:', currentUser.email);
    
    if (onProgress) onProgress(10);
    
    // --- ÉTAPE 1: VALIDATION DU FICHIER ---
    
    // Validation de taille
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return {
        success: false,
        error: `Vidéo trop volumineuse: ${sizeMB}MB (maximum: 50MB)`
      };
    }
    
    // Validation du type
    if (!file.type.startsWith('video/')) {
      return {
        success: false,
        error: `Format de fichier non supporté: ${file.type}. Seuls les formats vidéo sont acceptés.`
      };
    }
    
    if (onProgress) onProgress(20);
    
    // --- ÉTAPE 2: PRÉPARATION POUR L'UPLOAD ---
    
    // Génération du nom de fichier unique
    const randomId = nanoid(8);
    const extension = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const fileName = `video_${randomId}_${Date.now()}.${extension}`;
    
    // Définir le chemin dans Firebase Storage
    const folderPath = 'products/videos';
    const fullPath = `${folderPath}/${fileName}`;
    
    console.log('📤 Préparation de l\'upload vers', fullPath);
    
    // Créer une référence vers le fichier dans Firebase Storage
    const storageRef = ref(storage, fullPath);
    
    // --- ÉTAPE 3: UPLOAD DU FICHIER ---
    
    console.log('📤 Début de l\'upload vers Firebase Storage...');
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    // Retourner une promesse qui suit l'upload et résout avec le résultat
    return new Promise<VideoUploadResult>((resolve) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Mise à jour de la progression
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          console.log(`📊 Progression: ${progress}%`);
          if (onProgress) onProgress(20 + (progress * 0.7)); // 20% à 90%
        },
        (error) => {
          // Gestion des erreurs
          console.error('❌ Erreur durant l\'upload:', error);
          resolve({
            success: false,
            error: 'Erreur lors du téléchargement de la vidéo: ' + error.message,
            debugInfo: error
          });
        },
        async () => {
          // Upload terminé avec succès
          try {
            // Obtenir l'URL de téléchargement
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('✅ Vidéo téléchargée avec succès:', downloadURL);
            
            if (onProgress) onProgress(100);
            
            resolve({
              success: true,
              videoUrl: downloadURL,
              metadata: {
                size: file.size
              }
            });
          } catch (error: any) {
            console.error('❌ Erreur lors de la récupération de l\'URL:', error);
            resolve({
              success: false,
              error: 'Erreur lors de la récupération de l\'URL de la vidéo',
              debugInfo: error
            });
          }
        }
      );
    });
  } catch (error: any) {
    console.error('❌ Erreur globale:', error);
    
    return {
      success: false,
      error: error.message || "Erreur inconnue lors de l'upload",
      debugInfo: {
        code: error.code,
        message: error.message,
        stack: error.stack
      }
    };
  }
};
