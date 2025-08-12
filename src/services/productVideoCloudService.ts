import { getFunctions, httpsCallable } from 'firebase/functions';
import { nanoid } from 'nanoid';
import { auth } from '../firebase';
import { getIdToken } from 'firebase/auth';

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
 * Upload une vidéo de produit via Cloud Function
 * Approche similaire au service d'images qui fonctionne correctement
 */
export const uploadProductVideoViaCloud = async (file: File, options?: {
  onProgress?: (progress: number) => void;
}): Promise<VideoUploadResult> => {
  console.log('🚀 Démarrage upload vidéo via Cloud Function...');
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
    
    // Rafraîchissement du token pour garantir qu'il est valide
    try {
      const idToken = await getIdToken(currentUser, true);
      console.log('✅ Token d\'authentification actualisé avec succès');
    } catch (tokenError) {
      console.error('❌ Impossible de rafraîchir le token:', tokenError);
      return {
        success: false,
        error: "Problème d'authentification. Veuillez vous reconnecter."
      };
    }
    
    // Petit délai pour s'assurer que Firebase est bien initialisé
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('👤 Démarrage de l\'upload vidéo avec authentification vérifiée');
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
    
    // --- ÉTAPE 2: CONVERSION EN BASE64 ---
    
    console.log('📝 Conversion du fichier en base64...');
    
    // Conversion du fichier en Base64
    const reader = new FileReader();
    const base64Data = await new Promise<string>((resolve, reject) => {
      reader.onload = (e) => {
        if (!e.target || typeof e.target.result !== 'string') {
          reject(new Error('Échec de lecture du fichier'));
          return;
        }
        resolve(e.target.result);
      };
      reader.onerror = () => reject(new Error('Échec de lecture du fichier'));
      reader.readAsDataURL(file);
    });
    
    console.log('✅ Vidéo convertie avec succès en base64');
    if (onProgress) onProgress(40);
    
    // --- ÉTAPE 3: PRÉPARATION DES DONNÉES ---
    
    // Génération du nom de fichier
    const randomId = nanoid(8);
    const extension = file.name.split('.').pop()?.toLowerCase() || 'mp4';
    const fileName = `video_${randomId}.${extension}`;
    const folderPath = 'products/videos';
    
    console.log('☁️ Appel de la Cloud Function uploadVideoToFirestore...');
    
    // Initialisation de la fonction Cloud avec région
    const functions = getFunctions(undefined, 'us-central1');
    console.log('✅ Firebase Functions initialisé avec région us-central1');
    
    // Récupération de la fonction uploadVideoToFirestore
    const uploadVideoFunction = httpsCallable(functions, 'uploadVideoToFirestore');
    console.log('✅ Fonction uploadVideoToFirestore récupérée, prêt à appeler');
    
    if (onProgress) onProgress(60);
    
    // Récupération explicite du token d'authentification
    const idToken = await getIdToken(currentUser, true);
    console.log('🔑 Token d\'authentification obtenu et sera envoyé avec la requête');
    
    // Préparer les données avec token d'auth explicite
    const requestData = {
      imageBase64: base64Data,
      fileName: fileName,
      folder: folderPath,
      authToken: idToken,  // Transmission explicite du token
      userEmail: currentUser.email // Information supplémentaire pour debug
    };
    
    console.log('📣 Envoi des données à la Cloud Function...');
    
    // Appel de la fonction Cloud avec gestion de la progression
    if (onProgress) onProgress(75);
    
    console.log('💬 Données envoyées à la fonction Cloud:', {
      fileName,
      folder: folderPath,
      imageSize: `${(base64Data.length / (1024 * 1024)).toFixed(2)} MB (base64)`
    });
    
    // Appel de la fonction Cloud
    const response = await uploadVideoFunction(requestData);
    const responseData = response.data as any;
    
    console.log('✅ Réponse de la Cloud Function:', responseData);
    if (onProgress) onProgress(100);
    
    // Vérification de la réponse
    if (responseData && responseData.success && responseData.videoUrl) {
      return {
        success: true,
        videoUrl: responseData.videoUrl,
        metadata: {
          size: file.size
        }
      };
    } else {
      throw new Error(responseData?.error || 'Réponse invalide de la fonction Cloud');
    }
    
  } catch (error: any) {
    console.error('❌ Erreur détaillée:', error);
    
    // Gestion des erreurs avec messages personnalisés
    let errorMessage = error.message || "Erreur inconnue lors de l'upload";
    
    // Messages personnalisés selon le type d'erreur
    if (error.code === 'functions/unauthenticated') {
      errorMessage = "Vous n'êtes pas authentifié pour cette opération";
    } else if (error.code === 'functions/invalid-argument') {
      errorMessage = "Données invalides pour l'upload de la vidéo";
    } else if (error.code === 'functions/internal') {
      errorMessage = "Erreur serveur lors du traitement de la vidéo";
    }
    
    return {
      success: false,
      error: errorMessage,
      debugInfo: {
        code: error.code,
        message: error.message,
        details: error.details,
        stack: error.stack
      }
    };
  }
};
