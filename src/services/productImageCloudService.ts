import { getFunctions, httpsCallable } from 'firebase/functions';
import { nanoid } from 'nanoid';

export interface UploadResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  debugInfo?: any;
}

/**
 * Upload une image produit via Cloud Function pour contourner les problèmes d'upload direct
 * vers Firebase Storage
 */
export const uploadProductImageViaCloud = async (
  file: File,
  options?: {
    onProgress?: (progress: number) => void;
  }
): Promise<UploadResult> => {
  try {
    console.log('🚀 Démarrage upload via Cloud Function...');
    console.log('📁 Informations sur le fichier:', { 
      nom: file.name, 
      type: file.type, 
      taille: `${(file.size / 1024).toFixed(2)}KB`,
      environnement: process.env.NODE_ENV || 'non défini'
    });
    
    // Validation du fichier
    if (!file || !(file instanceof File)) {
      throw new Error('Fichier invalide');
    }
    
    // Vérifier si c'est une image
    if (!file.type.startsWith('image/')) {
      throw new Error('Le fichier doit être une image');
    }
    
    // Vérifier la taille (max 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      throw new Error(
        `Image trop volumineuse (${sizeMB} Mo). \n\n` + 
        `La taille maximale autorisée est de 5 Mo. \n\n` +
        `Veuillez réduire la taille de votre image avec un outil de compression d'image avant de l'envoyer.`
      );
    }

    // Simplifier la progression
    if (options?.onProgress) {
      options.onProgress(50);
    }
    
    // Convertir le fichier en base64
    console.log('📝 Conversion du fichier en base64...');
    const base64 = await fileToBase64(file);
    console.log('✅ Image convertie avec succès en base64');
    
    // Appeler la Cloud Function
    console.log('☁️ Appel de la Cloud Function uploadImage...');
    let uploadImageFn;
    try {
      // Spécifier la bonne région pour les fonctions
      const functions = getFunctions(undefined, 'us-central1');
      console.log('✅ Firebase Functions initialisé avec région us-central1');
      
      // En environnement de développement, on pourrait se connecter à l'émulateur
      // Mais en production nous utilisons les vraies Cloud Functions
      if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR === 'true') {
        console.log('🚧 Connexion à l\'\u00e9mulateur de fonctions sur localhost:5001');
        // Désactivé en production
        // connectFunctionsEmulator(functions, 'localhost', 5001);
      }
      
      // Utiliser la fonction uploadImage qui existe dans votre projet Firebase
      uploadImageFn = httpsCallable(functions, 'uploadImage', { timeout: 180000 }); // 3 minutes timeout
      console.log('✅ Fonction uploadImage récupérée, prêt à appeler');
    } catch (funcError: any) {
      console.error('❌ Erreur lors de l\'initialisation de Firebase Functions:', funcError);
      throw new Error(`Erreur lors de l'initialisation de Firebase Functions: ${funcError.message || 'Erreur inconnue'}`);
    }
    
    // Vérifier que la fonction a bien été initialisée
    if (!uploadImageFn) {
      throw new Error('La fonction Cloud uploadImage n\'a pas pu être initialisée correctement');
    }
    
    console.log('📣 Envoi des données à la Cloud Function...');
    // Respecter le format exact attendu par la fonction Cloud uploadImage (différent de uploadVideo)
    const fileName = `product-image-${nanoid(8)}.${getFileExtension(file.name)}`;
    const folder = 'products/images';
    const uploadData = {
      imageBase64: base64,     // Paramètre attendu par la fonction Cloud
      fileName: fileName,
      folder: folder
    };

    console.log('💬 Données envoyées à la fonction Cloud:', {
      contentType: file.type,
      fileName: fileName,
      fileType: 'image',
      dataSize: base64.length
    });
    
    const result = await uploadImageFn(uploadData);
    
    // Mettre à jour la progression à 100%
    if (options?.onProgress) options.onProgress(100);
    
    // Traiter le résultat
    const data = result.data as any;
    console.log('✅ Réponse de la Cloud Function:', data);
    
    if (data.success && data.imageUrl) {
      return {
        success: true,
        imageUrl: data.imageUrl
      };
    } else {
      throw new Error('Réponse invalide de la Cloud Function');
    }
  } catch (error: any) {
    console.error("❌ Erreur d'upload via Cloud:", error);
    return {
      success: false,
      error: error.message || "Erreur inconnue lors de l'upload",
      debugInfo: error
    };
  }
};

/**
 * Utilitaire pour convertir un fichier en base64
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

/**
 * Récupère l'extension d'un nom de fichier
 */
const getFileExtension = (filename: string): string => {
  return filename.split('.').pop() || 'jpg';
};
