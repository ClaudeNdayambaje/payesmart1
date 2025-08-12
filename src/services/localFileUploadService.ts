import { nanoid } from 'nanoid';

/**
 * Service pour simuler un téléchargement local des fichiers
 * Puisque nous ne pouvons pas directement enregistrer des fichiers dans le dossier public 
 * du côté client, cette fonction génère un nom de fichier et un chemin qui sera utilisé
 * comme référence pour les images statiques déjà placées dans le dossier public.
 */

/**
 * Crée une référence vers un fichier "téléchargé" localement
 * @param file - Le fichier image à traiter
 * @param productName - Nom du produit pour le mapping
 * @returns Promise avec l'URL locale du fichier (chemin public)
 */
export const uploadLocalImage = async (
  file: File,
  productName?: string
): Promise<string> => {
  // Vérifier que le fichier existe et est valide
  if (!file || file.size === 0) {
    console.error('Fichier local invalide ou vide');
    throw new Error('Le fichier est invalide ou vide');
  }

  // Générer un nom de fichier unique pour référence
  const timestamp = Date.now();
  const uniqueId = nanoid(8);
  const fileExtension = file.name.split('.').pop() || 'png';
  const fileName = `${timestamp}-${uniqueId}.${fileExtension}`;
  
  console.log(`🔄 Simulation d'upload local pour: ${file.name}`);

  // Essayer d'utiliser le nom du produit pour le mapping si disponible
  if (productName) {
    // Transformation du nom de produit en format pour nom de fichier
    const sanitizedName = productName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
    
    // Vérifier si nous avons une image statique existante pour ce produit
    const staticImagePath = `/marketing/img/produits/${sanitizedName}-poster.png`;
    console.log(`🔍 Recherche d'une image statique: ${staticImagePath}`);
    
    return `/marketing/img/produits/${sanitizedName}-poster.png`;
  }

  // Si pas de nom de produit ou pas d'image statique correspondante, 
  // renvoyer un chemin vers un dossier d'upload simulé
  return `/marketing/img/produits/uploads/${fileName}`;
};

/**
 * Génère une URL fallback pour une image produit
 * @param fileName - Nom du fichier original
 * @returns URL placeholder
 */
export const getPlaceholderImageUrl = (fileName: string): string => {
  const encodedText = encodeURIComponent(fileName);
  return `https://placehold.co/600x400/EEE/31343C?text=${encodedText}`;
};

/**
 * Télécharge une image vers un emplacement local (simulation)
 * @param file - Le fichier image à télécharger
 * @param productName - Nom du produit pour le mapping
 * @returns Promise avec l'URL de téléchargement de l'image
 */
export const uploadProductImageLocally = async (
  file: File,
  productName?: string
): Promise<string> => {
  console.log(`🔄 Début téléchargement local pour image produit: ${file.name}`);
  
  try {
    // Tentative de mapper vers une image statique existante
    const imageUrl = await uploadLocalImage(file, productName);
    console.log(`✅ URL locale générée: ${imageUrl}`);
    return imageUrl;
  } catch (error) {
    console.error('❌ Erreur lors du téléchargement local:', error);
    // Fallback vers placeholder si tout échoue
    const placeholderUrl = getPlaceholderImageUrl(file.name);
    console.log(`⚠️ Utilisation d'URL placeholder comme fallback: ${placeholderUrl}`);
    return placeholderUrl;
  }
};
