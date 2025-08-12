import { getFunctions, httpsCallable } from 'firebase/functions';
import { nanoid } from 'nanoid';

/**
 * Interface pour les options d'upload
 */
interface UploadVideoOptions {
  onProgress?: (progress: number) => void;
  collection?: string;
  metadata?: Record<string, any>;
}

/**
 * Interface pour le résultat de l'upload
 */
interface UploadVideoResult {
  success: boolean;
  videoId?: string;
  videoUrl?: string;
  metadata?: any;
  error?: string;
}

/**
 * Convertit un fichier en chaîne base64
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

/**
 * Obtient l'extension d'un fichier à partir de son nom
 */
const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

/**
 * Vérifie si une vidéo est valide (type et taille)
 */
const validateVideoFile = (file: File): { valid: boolean; message: string } => {
  // Vérifier le type MIME
  const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
  if (!validTypes.includes(file.type)) {
    return { 
      valid: false, 
      message: `Type de fichier non supporté. Types acceptés: ${validTypes.join(', ')}`
    };
  }

  // Vérifier la taille (max 100MB)
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (file.size > maxSize) {
    return {
      valid: false,
      message: `La vidéo est trop volumineuse (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maximum: 100MB`
    };
  }

  return { valid: true, message: '' };
};

/**
 * Service pour télécharger une vidéo vers Firestore via Cloud Function
 */
export const uploadVideoToFirestore = async (
  file: File,
  options: UploadVideoOptions = {}
): Promise<UploadVideoResult> => {
  console.log('🎬 Début du processus d\'upload de vidéo vers Firestore...');
  
  // Valider le fichier vidéo
  const validation = validateVideoFile(file);
  if (!validation.valid) {
    console.error('❌ Validation du fichier échouée:', validation.message);
    return { success: false, error: validation.message };
  }
  
  // Déterminer la collection Firestore pour les produits marketing
  const collection = options.collection || 'marketing_products/videos';
  console.log(`📁 Collection Firestore cible: ${collection}`);
  
  try {
    // Convertir le fichier en base64
    console.log('🔄 Conversion de la vidéo en base64...');
    const base64 = await fileToBase64(file);
    console.log('✅ Vidéo convertie en base64 avec succès');
    
    // Simuler une progression pour l'interface utilisateur
    let progressInterval: NodeJS.Timeout | null = null;
    if (options.onProgress) {
      let progress = 0;
      progressInterval = setInterval(() => {
        progress += 5;
        if (progress > 95) {
          progress = 95; // On reste à 95% jusqu'à confirmation de succès
        }
        options.onProgress?.(progress);
      }, 1000);
    }
    
    // Initialiser Firebase Functions avec la région correcte
    console.log('☁️ Initialisation de Firebase Functions...');
    const functions = getFunctions(undefined, 'us-central1');
    const uploadVideoFn = httpsCallable(functions, 'uploadVideoToFirestore', { timeout: 300000 }); // 5 minutes timeout
    
    // Générer un nom de fichier unique
    const fileName = `video-${nanoid(8)}.${getFileExtension(file.name)}`;
    
    // Appeler la Cloud Function
    console.log('📤 Appel de la Cloud Function uploadVideoToFirestore...');
    const uploadData = {
      base64Data: base64,
      fileName,
      contentType: file.type,
      fileType: 'video',
      collection,
      ...options.metadata
    };
    
    const result = await uploadVideoFn(uploadData);
    
    // Nettoyer l'intervalle de progression simulée
    if (progressInterval) {
      clearInterval(progressInterval);
    }
    
    // Mettre à jour la progression à 100% pour signaler la fin
    if (options.onProgress) {
      options.onProgress(100);
    }
    
    // Traiter le résultat
    const data = result.data as any;
    console.log('✅ Réponse de la Cloud Function:', data);
    
    if (data.success && data.videoUrl) {
      return {
        success: true,
        videoId: data.videoId,
        videoUrl: data.videoUrl,
        metadata: data.metadata
      };
    } else {
      console.error('❌ Erreur inattendue lors de l\'upload de la vidéo');
      return { 
        success: false, 
        error: 'Échec de l\'upload de la vidéo: Réponse invalide du serveur'
      };
    }
    
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'upload de la vidéo:', error);
    
    // Nettoyer l'intervalle de progression si nécessaire
    if (options.onProgress) {
      options.onProgress(0); // Réinitialiser la progression
    }
    
    // Extraire le message d'erreur de Firebase Functions
    let errorMessage = 'Erreur inconnue lors de l\'upload';
    if (error.code === 'functions/invalid-argument') {
      errorMessage = error.message || 'Arguments invalides';
    } else if (error.code === 'functions/internal') {
      errorMessage = error.message || 'Erreur interne du serveur';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return { success: false, error: errorMessage };
  }
};

/**
 * Service pour récupérer les métadonnées d'une vidéo depuis Firestore
 */
export const getVideoMetadata = async (videoId: string, collection: string = 'videos'): Promise<any> => {
  try {
    // Ici, vous pouvez implémenter la logique pour récupérer les métadonnées depuis Firestore
    // Cette fonction est laissée à implémenter selon les besoins spécifiques
    console.log(`📋 Récupération des métadonnées de la vidéo ${videoId} depuis ${collection}`);
    
    // Exemple d'implémentation (à adapter)
    // const videoDoc = await firestore.collection(collection).doc(videoId).get();
    // return videoDoc.exists ? videoDoc.data() : null;
    
    return {
      // Placeholder pour l'implémentation future
      videoId,
      collection
    };
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des métadonnées vidéo:', error);
    throw error;
  }