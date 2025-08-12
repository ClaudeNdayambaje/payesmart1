/**
 * @deprecated - Ce service est déprécié. Utilisez productImageService.ts à la place.
 * Ce fichier est maintenu uniquement pour la compatibilité avec le code existant.
 */

import { uploadProductImage } from './productImageService';

/**
 * Upload une image directement vers Firebase Storage
 * @deprecated - Utilisez uploadProductImage de productImageService.ts à la place
 * @param file - Le fichier à uploader
 * @param onProgress - Callback pour suivre la progression (optionnel)
 * @returns Promise<string> - URL de téléchargement
 */
export const uploadImageDirectStorage = async (file: File, onProgress?: (progress: number) => void): Promise<string> => {
  console.warn('⚠️ uploadImageDirectStorage est déprécié. Utilisez uploadProductImage de productImageService.ts à la place');
  return uploadProductImage(file, onProgress);
};

/**
 * Upload direct d'une image vers Firebase Storage
 * @deprecated - Utilisez uploadProductImage de productImageService.ts à la place
 * @param file - Fichier image
 * @param filePath - Chemin de stockage (non utilisé)
 * @param onProgress - Callback pour la progression
 * @returns Promise avec l'URL de téléchargement
 */
export const uploadProductImageDirect = async (
  file: File,
  _filePath?: string, // paramètre non utilisé, renommé avec _ pour éviter l'avertissement
  onProgress?: (progress: number) => void
): Promise<string> => {
  console.warn('⚠️ uploadProductImageDirect est déprécié. Utilisez uploadProductImage de productImageService.ts à la place');
  return uploadProductImage(file, onProgress);
};
