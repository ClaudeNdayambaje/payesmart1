import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service pour gérer le téléchargement et la récupération de fichiers
 */

/**
 * Télécharge un fichier dans Firebase Storage et retourne l'URL de téléchargement
 * @param file Le fichier à télécharger
 * @param path Le chemin dans Firebase Storage (ex: 'employees/avatars')
 * @returns L'URL de téléchargement du fichier
 */
export const uploadFile = async (file: File, path: string): Promise<string> => {
  try {
    // Générer un nom de fichier unique
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const fullPath = `${path}/${fileName}`;
    
    // Créer une référence au fichier dans Firebase Storage
    const storageRef = ref(storage, fullPath);
    
    // Télécharger le fichier
    const snapshot = await uploadBytes(storageRef, file);
    
    // Récupérer l'URL de téléchargement
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Erreur lors du téléchargement du fichier:', error);
    throw error;
  }
};

/**
 * Version simplifiée pour télécharger et redimensionner une image
 * @param file Le fichier image à télécharger
 * @param path Le chemin dans Firebase Storage
 * @returns L'URL de téléchargement de l'image ou une URL data pour le développement local
 */
export const uploadAndResizeImage = async (file: File, path: string): Promise<string> => {
  try {
    // Vérifier que le fichier est une image
    if (!file.type.startsWith('image/')) {
      throw new Error('Le fichier doit être une image');
    }
    
    // Solution temporaire pour environnement de développement local
    // Contournement du problème CORS en utilisant une URL de données
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('Environnement de développement détecté, utilisation du mode local pour les images');
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          // Base64 data URL de l'image
          const dataUrl = reader.result as string;
          console.log('Image convertie en URL data pour le développement local');
          resolve(dataUrl);
        };
        reader.readAsDataURL(file);
      });
    }
    
    // En production, utiliser Firebase Storage normalement
    console.log('Début du téléchargement de l\'image:', file.name);
    
    // Générer un nom de fichier unique
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const fullPath = `${path}/${fileName}`;
    
    // Créer une référence au fichier dans Firebase Storage
    const storageRef = ref(storage, fullPath);
    
    // Télécharger le fichier
    console.log('Téléchargement vers Firebase Storage...');
    const snapshot = await uploadBytes(storageRef, file);
    
    // Récupérer l'URL de téléchargement
    console.log('Récupération de l\'URL de téléchargement...');
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('Téléchargement réussi, URL:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Erreur lors du téléchargement de l\'image:', error);
    // En cas d'erreur, renvoyer une URL de données pour éviter que l'application ne plante
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        console.log('Fallback vers URL data suite à une erreur');
        resolve(dataUrl);
      };
      reader.readAsDataURL(file);
    });
  }
};
