import { storage, auth } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { nanoid } from 'nanoid';
import { analyzeFile } from '../utils/debugUtils';

/**
 * Service pour gérer le téléchargement des fichiers vers Firebase Storage
 */

/**
 * Télécharge un fichier vers Firebase Storage
 * @param file - Le fichier à télécharger
 * @param storagePath - Le chemin de destination dans Firebase Storage
 * @param onProgress - Fonction de callback pour suivre la progression
 * @returns Promise avec l'URL du fichier téléchargé
 */

/**
 * Vérifie si le navigateur est connecté à Internet
 * @returns true si connecté, false sinon
 */
const isOnline = (): boolean => {
  return navigator.onLine;
};

export const uploadFileToStorage = async (
  file: File,
  storagePath: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  // Vérifier la connectivité réseau
  if (!isOnline()) {
    console.error('❌ Pas de connexion Internet détectée');
    throw new Error('Pas de connexion Internet. Veuillez vérifier votre connexion et réessayer.');
  }
  
  // Utiliser directement le fichier sans compression
  const fileToUpload = file;
  console.log(`📤 Upload direct du fichier: ${(file.size / 1024).toFixed(1)}KB`);
  // Variables pour les tentatives
  let retryCount = 0;
  const maxRetries = 3;
  
  // S'assurer que le fichier existe et est valide
  if (!fileToUpload || fileToUpload.size === 0) {
    console.error('Fichier invalide ou vide');
    throw new Error('Le fichier est invalide ou vide');
  }
  
  // Analyser le fichier pour détecter des problèmes potentiels
  const fileAnalysis = analyzeFile(fileToUpload);
  const fileSizeMB = fileToUpload.size / (1024 * 1024);
  console.log(`📤 Début d'upload : ${fileToUpload.name} (${fileToUpload.type}, ${fileSizeMB.toFixed(2)} MB) vers ${storagePath}`);
  
  // Afficher les problèmes potentiels
  if (fileAnalysis.potentialIssues.length > 0) {
    console.warn('⚠️ Problèmes potentiels détectés avec le fichier:');
    fileAnalysis.potentialIssues.forEach(issue => console.warn(`   - ${issue}`));
  }
  
  // Vérifier les quotas de taille Firebase (limites communes)
  if (fileSizeMB > 100) {
    throw new Error(`Le fichier est trop volumineux (${fileSizeMB.toFixed(1)} MB). Firebase Storage a une limite de 100MB par fichier.`);
  }
  
  // Tentative d'upload avec plusieurs approches
  const tryMultipleUploadMethods = async (): Promise<string> => {
    // Vérifier si un utilisateur est connecté (obligatoire pour Firebase Storage)
    if (!auth.currentUser) {
      console.log('⚠️ Aucun utilisateur authentifié. Un compte utilisateur est requis pour l\'upload.');
      throw new Error('Vous devez être connecté pour télécharger des fichiers. Veuillez vous reconnecter.');
    } else if (auth.currentUser && auth.currentUser.uid) {
      console.log('👤 Utilisateur déjà authentifié:', auth.currentUser.uid);
    } else {
      console.log('⚠️ État d\'authentification indéterminé');
    }
    
    // Générer un nom de fichier unique pour éviter les conflits
    const timestamp = Date.now();
    const uniqueId = nanoid(8);
    const fileExtension = fileToUpload.name.split('.').pop() || 'file';
    const fileName = `${timestamp}-${uniqueId}.${fileExtension}`;
    
    // Simplifier la structure des chemins de stockage
    const cleanPath = storagePath.replace(/^\//g, '').replace(/\/$/, '');
    // Utiliser un chemin direct sans sous-dossiers de date
    const fullPath = `${cleanPath}/${fileName}`;
    console.log(`📂 Chemin de stockage: ${fullPath}`);
    const storageRef = ref(storage, fullPath);
    
    // Forcer un court délai pour s'assurer que Firebase est prêt
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      // Préférer directement uploadBytesResumable car plus stable
      console.log('🔄 Tentative d\'upload direct via uploadBytesResumable...');
      const uploadTask = uploadBytesResumable(storageRef, fileToUpload);
      
      return new Promise<string>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`📈 Progression: ${progress.toFixed(1)}%`);
            if (onProgress) onProgress(progress);
          },
          (error) => {
            console.error('❌ Échec de l\'upload direct:', error);
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              console.log('✅ Téléchargement réussi:', downloadURL);
              resolve(downloadURL);
            } catch (error) {
              console.error('❌ Erreur lors de la récupération de l\'URL:', error);
              reject(error);
            }
          }
        );
      });
    } catch (error1) {
      console.error('❌ Échec de l\'upload via Base64:', error1);
      
      try {
        // Méthode 2: Essayer uploadBytesResumable comme fallback
        console.log('🔄 Tentative d\'upload via uploadBytesResumable...');
        const uploadTask = uploadBytesResumable(storageRef, fileToUpload);
        
        return new Promise<string>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              console.log(`📊 Progression: ${progress.toFixed(1)}%`);
              if (onProgress) onProgress(progress);
            },
            (error) => {
              console.error('❌ Échec de l\'upload via uploadBytesResumable:', error);
              reject(error);
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                console.log('✅ Téléchargement réussi via uploadBytesResumable:', downloadURL);
                resolve(downloadURL);
              } catch (error) {
                console.error('❌ Erreur lors de la récupération de l\'URL:', error);
                reject(error);
              }
            }
          );
        });
      } catch (error2) {
        console.error('❌ Échecs de toutes les méthodes d\'upload:', error1, error2);
        throw new Error(`Échec de téléchargement de l'image: ${error2 instanceof Error ? error2.message : 'Erreur inconnue'}`);
      }
    }
  };

  // Boucle de tentatives avec délai exponentiel
  while (true) {
    try {
      return await tryMultipleUploadMethods();
    } catch (error) {
      console.error(`❌ Erreur lors de la tentative ${retryCount + 1}:`, error);
      
      // Forcer une attente courte pour laisser Firebase se stabiliser
      const shortPause = Math.random() * 1000 + 500; // Entre 500-1500ms pour éviter les conflits
      console.log(`⏱️ Pause courte de ${shortPause}ms pour stabilisation`);
      await new Promise(resolve => setTimeout(resolve, shortPause));
      
      if (retryCount >= maxRetries) {
        console.error('📵 Toutes les tentatives ont échoué, abandon.');
        throw new Error(`Échec du téléchargement après ${maxRetries + 1} tentatives: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
      
      retryCount++;
      const waitTime = 1000 * (2 ** retryCount);
      console.log(`🔄 Nouvelle tentative ${retryCount + 1}/${maxRetries + 1} dans ${waitTime/1000} seconde(s)...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // Pour la tentative suivante, utiliser un chemin légèrement différent
      if (retryCount % 2 === 0) {
        console.log('🔀 Modification du chemin de stockage pour la prochaine tentative');
      }
    }
  }
};

/**
 * Télécharge une image vers Firebase Storage
 * @param file - Le fichier image à télécharger
 * @param onProgress - Fonction de callback pour suivre la progression
 * @returns Promise avec l'URL de téléchargement de l'image
 */
export const uploadProductImage = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    // Vérifier que le fichier est une image
    if (!file.type.startsWith('image/')) {
      throw new Error('Le fichier n\'est pas une image valide');
    }
    
    // Analyser le fichier (utilité de débogage)
    analyzeFile(file);
    
    console.log(`📤 Début d'upload direct: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
    
    // Upload direct sans compression
    return await uploadFileToStorage(
      file, 
      `products/images/${Date.now()}-${nanoid(8)}.${file.name.split('.').pop() || 'jpg'}`,
      onProgress
    );
  } catch (error) {
    console.error('Erreur lors du téléchargement de l\'image:', error);
    throw error;
  }
};

// Fonctionnalité vidéo supprimée intentionnellement pour simplifier l'interface produit
