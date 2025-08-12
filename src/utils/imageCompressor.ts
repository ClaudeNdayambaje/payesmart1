/**
 * Utilitaire de compression d'image pour réduire la taille avant upload vers Firebase Storage
 */

/**
 * Compresse une image en réduisant sa qualité et sa taille
 * @param file - Le fichier image à compresser
 * @param maxSizeKB - Taille cible maximale en KB (par défaut 200KB)
 * @param initialQuality - Qualité initiale (0-1) pour la compression
 * @returns Promise avec le fichier compressé
 */
export const compressImage = async (
  file: File,
  maxSizeKB: number = 200,
  initialQuality: number = 0.7
): Promise<File> => {
  // Vérifier si c'est une image
  if (!file.type.startsWith('image/')) {
    console.log('⚠️ Pas une image, compression ignorée');
    return file;
  }

  // Vérifier si l'image est déjà assez petite
  const fileSizeKB = file.size / 1024;
  if (fileSizeKB <= maxSizeKB) {
    console.log(`✅ L'image est déjà assez petite (${fileSizeKB.toFixed(1)} KB), pas de compression nécessaire`);
    return file;
  }

  console.log(`🔄 Compression d'image: Taille originale ${fileSizeKB.toFixed(1)} KB -> Cible ${maxSizeKB} KB`);

  // Créer une URL d'objet pour l'image
  const blobUrl = URL.createObjectURL(file);
  
  // Charger l'image dans un élément img
  const img = new Image();
  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
    img.src = blobUrl;
  });
  
  // Libérer l'URL d'objet
  URL.revokeObjectURL(blobUrl);
  
  // Calculer les dimensions max proportionnelles
  let maxWidth = 1024;
  let maxHeight = 1024;
  
  // Si l'image est très grande, réduire davantage
  if (fileSizeKB > 1000) {
    maxWidth = 800;
    maxHeight = 800;
  }
  
  // Calculer les nouvelles dimensions en conservant les proportions
  let width = img.width;
  let height = img.height;
  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width = Math.floor(width * ratio);
    height = Math.floor(height * ratio);
  }
  
  // Créer un canvas pour le redimensionnement
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  // Dessiner l'image redimensionnée
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.error('❌ Impossible de créer le contexte 2D pour la compression');
    return file;
  }
  
  ctx.drawImage(img, 0, 0, width, height);
  
  // Compression progressive jusqu'à atteindre la taille cible
  let quality = initialQuality;
  let blob: Blob | null = null;
  let iterations = 0;
  const maxIterations = 5; // Éviter une boucle infinie
  
  while (iterations < maxIterations) {
    // Convertir en blob avec la qualité actuelle
    blob = await new Promise<Blob>(resolve => {
      canvas.toBlob(
        newBlob => resolve(newBlob || new Blob()), 
        file.type, 
        quality
      );
    });
    
    // Vérifier si on a atteint la taille cible
    const newSizeKB = blob.size / 1024;
    console.log(`🔍 Itération ${iterations + 1}: Qualité ${(quality * 100).toFixed(0)}%, Taille ${newSizeKB.toFixed(1)} KB`);
    
    if (newSizeKB <= maxSizeKB || quality <= 0.2) {
      // On a atteint la taille cible ou la qualité minimale acceptable
      break;
    }
    
    // Réduire la qualité pour la prochaine itération
    quality = Math.max(0.2, quality - 0.1);
    iterations++;
  }
  
  if (!blob) {
    console.warn('⚠️ Échec de la compression, utilisation de l\'image originale');
    return file;
  }
  
  // Créer un nouveau fichier à partir du blob
  const compressedFile = new File(
    [blob], 
    file.name.replace(/\.[^/.]+$/, '') + '_compressed.' + file.name.split('.').pop(),
    { 
      type: file.type,
      lastModified: Date.now()
    }
  );
  
  console.log(`✅ Compression terminée: ${(file.size / 1024).toFixed(1)} KB -> ${(compressedFile.size / 1024).toFixed(1)} KB (${Math.round((1 - compressedFile.size / file.size) * 100)}% réduit)`);
  
  return compressedFile;
};
