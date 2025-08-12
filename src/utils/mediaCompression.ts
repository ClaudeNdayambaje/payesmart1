/**
 * Utilitaires de compression des médias
 * Permet de réduire la taille des images et vidéos avant téléchargement
 */

/**
 * Compresse une image en réduisant sa qualité et/ou sa taille
 * @param file - Fichier image à compresser
 * @param maxSizeMB - Taille maximale en MB
 * @param quality - Qualité de l'image (0.1 à 1.0)
 * @returns Promise avec le fichier compressé
 */
export const compressImage = async (
  file: File, 
  maxSizeMB: number = 5,
  quality: number = 0.7
): Promise<File> => {
  // Si ce n'est pas une image, retourner le fichier original
  if (!file.type.startsWith('image/')) {
    console.warn('Le fichier n\'est pas une image, aucune compression effectuée');
    return file;
  }

  // Si l'image est déjà plus petite que maxSizeMB, la retourner directement
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB <= maxSizeMB) {
    console.log(`L'image ${file.name} ne nécessite pas de compression (${fileSizeMB.toFixed(2)}MB)`);
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (!event.target?.result) {
        reject(new Error('Échec de lecture du fichier'));
        return;
      }

      const img = new Image();
      img.src = event.target.result as string;

      img.onload = () => {
        // Calculer les nouvelles dimensions pour maintenir le ratio
        let { width, height } = img;
        
        // Si l'image est vraiment grande, réduire ses dimensions
        const MAX_DIMENSION = 1920; // Limiter à une taille max de 1920px
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = Math.floor(height * (MAX_DIMENSION / width));
            width = MAX_DIMENSION;
          } else {
            width = Math.floor(width * (MAX_DIMENSION / height));
            height = MAX_DIMENSION;
          }
        }

        // Créer un canvas et dessiner l'image redimensionnée
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Impossible de créer le contexte canvas'));
          return;
        }
        
        // Dessiner l'image avec une meilleure qualité
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convertir le canvas en blob avec la qualité spécifiée
        const mimeType = file.type || 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Échec de compression de l\'image'));
              return;
            }
            
            // Créer un nouveau fichier à partir du blob
            const compressedFile = new File(
              [blob], 
              file.name, 
              { type: mimeType, lastModified: Date.now() }
            );
            
            const compressionRatio = (file.size / compressedFile.size).toFixed(2);
            console.log(
              `Image compressée: ${file.name}\n` +
              `Taille originale: ${(file.size / (1024 * 1024)).toFixed(2)}MB\n` +
              `Nouvelle taille: ${(compressedFile.size / (1024 * 1024)).toFixed(2)}MB\n` +
              `Ratio de compression: ${compressionRatio}x\n` +
              `Dimensions: ${width}x${height}`
            );
            
            resolve(compressedFile);
          },
          mimeType,
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Échec du chargement de l\'image pour compression'));
      };
    };

    reader.onerror = () => {
      reject(new Error('Échec de lecture du fichier image'));
    };

    reader.readAsDataURL(file);
  });
};

/**
 * Compresse une image si elle dépasse la taille maximale
 * @param file - Fichier image à vérifier et compresser si nécessaire
 * @param maxSizeMB - Taille maximale en MB
 * @returns Promise avec le fichier original ou compressé
 */
export const compressImageIfNeeded = async (
  file: File,
  maxSizeMB: number = 5
): Promise<File> => {
  const fileSizeMB = file.size / (1024 * 1024);
  
  // Si ce n'est pas une image ou si elle est déjà plus petite, retourner le fichier original
  if (!file.type.startsWith('image/') || fileSizeMB <= maxSizeMB) {
    return file;
  }
  
  // Essayer différentes qualités en fonction de la taille du fichier
  let quality = 0.7; // Qualité par défaut
  
  if (fileSizeMB > maxSizeMB * 4) {
    // Images très grandes (>20MB pour un max de 5MB)
    quality = 0.5;
  } else if (fileSizeMB > maxSizeMB * 2) {
    // Images grandes (>10MB pour un max de 5MB)
    quality = 0.6;
  }
  
  try {
    return await compressImage(file, maxSizeMB, quality);
  } catch (error) {
    console.error('Erreur de compression:', error);
    return file; // En cas d'échec, retourner le fichier original
  }
};

/**
 * Analyse une vidéo pour en extraire les dimensions et la durée
 * @param file - Fichier vidéo à analyser
 * @returns Promise avec les métadonnées de la vidéo
 */
export const getVideoMetadata = (file: File): Promise<{ width: number, height: number, duration: number }> => {
  return new Promise((resolve, reject) => {
    // Créer un élément video temporaire
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src); // Libérer la mémoire
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration
      });
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src); // Libérer la mémoire
      reject(new Error('Impossible d\'extraire les métadonnées de la vidéo'));
    };
    
    // Créer une URL pour le fichier
    video.src = URL.createObjectURL(file);
  });
};

/**
 * Vérifie si une vidéo respecte les contraintes de taille et de durée
 * @param file - Fichier vidéo à vérifier
 * @param maxSizeMB - Taille maximale en MB (100MB par défaut)
 * @param maxDurationSeconds - Durée maximale en secondes (300s = 5min par défaut)
 * @returns Promise avec le résultat de la validation et messages d'erreur éventuels
 */
export const validateVideo = async (
  file: File,
  maxSizeMB: number = 50,
  maxDurationSeconds: number = 300
): Promise<{ isValid: boolean; errorMessage?: string; metadata?: any }> => {
  // Vérifier si c'est bien une vidéo
  if (!file.type.startsWith('video/')) {
    return { 
      isValid: false, 
      errorMessage: 'Le fichier n\'est pas une vidéo valide'
    };
  }
  
  // Vérifier la taille du fichier
  const fileSizeMB = file.size / (1024 * 1024);
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxSizeBytes) {
    return { 
      isValid: false, 
      errorMessage: `La vidéo est trop volumineuse: ${fileSizeMB.toFixed(2)}MB (maximum: ${maxSizeMB}MB)`
    };
  }
  
  try {
    // Récupérer les métadonnées
    const metadata = await getVideoMetadata(file);
    
    // Vérifier la durée
    if (metadata.duration > maxDurationSeconds) {
      const durationMin = (metadata.duration / 60).toFixed(1);
      const maxDurationMin = (maxDurationSeconds / 60).toFixed(1);
      return { 
        isValid: false, 
        errorMessage: `La vidéo est trop longue: ${durationMin} minutes (maximum: ${maxDurationMin} minutes)`,
        metadata
      };
    }
    
    // Toutes les validations sont passées
    return { 
      isValid: true,
      metadata 
    };
    
  } catch (error) {
    console.warn('Erreur lors de la validation de la vidéo:', error);
    // Si on ne peut pas vérifier les métadonnées mais que la taille est OK, on accepte quand même
    return { 
      isValid: true,
      errorMessage: 'Impossible de vérifier la durée de la vidéo, mais la taille est acceptable' 
    };
  }
};
