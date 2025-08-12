import { nanoid } from 'nanoid';
import { getApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, uploadString, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

/**
 * Options pour le téléchargement d'image
 */
export interface UploadOptions {
  onProgress?: (progress: number) => void;
}

/**
 * Résultat du téléchargement d'image
 */
export interface UploadResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
  debug?: any;
}

/**
 * Version robuste du téléchargement d'image produit avec solutions de contournement
 * @param file Fichier image à télécharger
 * @param options Options optionnelles (progression)
 */
export const uploadProductImage = async (file: File, options?: UploadOptions): Promise<UploadResult> => {
  const { onProgress } = options || {};
  
  // Initialisation des services Firebase avec un petit délai pour s'assurer que tout est bien chargé
  const app = getApp();
  const auth = getAuth(app);
  let storage: ReturnType<typeof getStorage>;
  
  // Petit délai pour s'assurer que Firebase est bien initialisé
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Initialisation avec try/catch pour détecter les problèmes
  try {
    storage = getStorage(app);
    console.log('✅ Firebase Storage initialisé avec succès');
  } catch (storageError) {
    console.error('❌ Problème d\'initialisation de Firebase Storage:', storageError);
    return {
      success: false,
      error: "Problème de connexion au stockage. Veuillez rafraîchir la page et réessayer."
    };
  }
  
  try {
    // --- ÉTAPE 1: VÉRIFICATION PRÉLIMINAIRE ---
    
    // Vérification explicite de l'authentification
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.uid) {
      console.error("⛔ ERREUR: Aucun utilisateur connecté");
      return { 
        success: false, 
        error: "Veuillez vous connecter pour uploader des images" 
      };
    }
    
    console.log("👤 Utilisateur authentifié:", currentUser.uid);
    if (onProgress) onProgress(10);
    
    // --- ÉTAPE 2: PRÉPARATION DU FICHIER ---
    
    // Validation basique du fichier
    if (!file || file.size <= 0 || file.size > 5 * 1024 * 1024) { // Max 5MB
      return {
        success: false,
        error: "Le fichier doit être valide et faire moins de 5MB"
      };
    }
    
    // Vérification du type de fichier (images uniquement)
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        error: "Seuls les fichiers image sont autorisés"
      };
    }

    if (onProgress) onProgress(20);

    // --- ÉTAPE 3: UPLOAD AVEC MÉTHODE ALTERNATIVE ---

    // Génération d'un nom de fichier simple avec extension
    const randomId = nanoid(6); 
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `products/images/${randomId}.${extension}`;

    console.log("📤 UPLOAD VERS:", filePath);

    // Créer une référence au fichier
    const storageRef = ref(storage, filePath);

    if (onProgress) onProgress(30);
    
    // Utilisation de métadonnées minimales
    const metadata = {
      contentType: file.type,
      cacheControl: 'public,max-age=31536000' // 1 an de cache
    };
    
    // Conversion du fichier en Base64 pour méthode alternative
    const reader = new FileReader();
    
    try {
      // Attendre que le fichier soit lu
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
      
      if (onProgress) onProgress(50);
      
      console.log('📡 Tentative d\'upload avec uploadString...');
      
      // Utiliser uploadString au lieu de uploadBytes
      const snapshot = await uploadString(storageRef, base64Data, 'data_url', metadata);
      console.log('✅ Upload avec uploadString réussi!', snapshot);
      
      if (onProgress) onProgress(80);
      
      // Récupération de l'URL
      console.log('🔗 Récupération de l\'URL...');
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('🔗 URL obtenue avec succès:', downloadURL);
      
      if (onProgress) onProgress(100);
      
      return {
        success: true,
        imageUrl: downloadURL
      };
      
    } catch (uploadError: any) {
      console.error('❌ Échec de la méthode alternative:', uploadError);
      throw uploadError; // Propager l'erreur pour la traiter dans le catch principal
    }
  } catch (error: any) {
    console.error("🔴 ERREUR UPLOAD:", error);

    // Récupération des informations de debug en évitant les références potentiellement nulles
    const debugInfo = {
      errorCode: error.code || 'none',
      errorMessage: error.message || 'Message inconnu',
      serverResponse: error.serverResponse || 'Pas de réponse serveur',
      user: auth?.currentUser ? { uid: auth.currentUser.uid } : 'non connecté',
      appName: app?.name || 'inconnu'
    };

    // Message d'erreur détaillé et actions recommandées
    let errorMessage = "Impossible d'uploader l'image.";
    let actionRecommandee = "Veuillez réessayer plus tard.";

    // Messages personnalisés selon le type d'erreur
    if (error.code === 'storage/unauthorized') {
      errorMessage = "Vous n'avez pas les autorisations nécessaires pour uploader cette image.";
      actionRecommandee = "Veuillez vous reconnecter et réessayer.";
    } else if (error.code === 'storage/canceled') {
      errorMessage = "L'upload a été annulé.";
      actionRecommandee = "Veuillez réessayer.";
    } else if (error.code === 'storage/quota-exceeded') {
      errorMessage = "L'espace de stockage est insuffisant.";
      actionRecommandee = "Contactez l'administrateur.";
    } else if (error.code === 'storage/unauthenticated') {
      errorMessage = "Vous n'êtes pas authentifié.";
      actionRecommandee = "Veuillez vous reconnecter.";
    } else if (error.code === 'storage/unknown') {
      errorMessage = "Une erreur inconnue s'est produite lors du téléchargement.";
      actionRecommandee = "Vérifiez votre connexion internet et réessayez dans quelques instants.";
    } else if (error.code === 'storage/invalid-format') {
      errorMessage = "Le fichier a été corrompu pendant le téléchargement.";
      actionRecommandee = "Veuillez réessayer avec un fichier moins volumineux.";
    }

    return { 
      success: false, 
      error: `${errorMessage} ${actionRecommandee}`,
      debug: debugInfo
    };
  }
};
