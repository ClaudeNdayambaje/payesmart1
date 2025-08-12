import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { storage } from '../firebase';

/**
 * Service de gestion des vidéos pour les Deals dans Firebase Storage
 */

/**
 * Télécharge une vidéo vers Firebase Storage
 * @param file Fichier vidéo à télécharger
 * @param dealId Identifiant du deal
 * @returns URL de téléchargement de la vidéo
 */
export const uploadDealVideo = async (file: File, dealId: string): Promise<string> => {
  try {
    // Création d'un nom de fichier unique avec timestamp
    const timestamp = new Date().getTime();
    const fileName = `${dealId}_${timestamp}_${file.name.replace(/\s+/g, '_')}`;
    
    // Référence vers le chemin de stockage dans Firebase
    const storageRef = ref(storage, `deals/${dealId}/videos/${fileName}`);
    
    // Téléchargement du fichier
    const snapshot = await uploadBytes(storageRef, file);
    console.log('Vidéo téléchargée avec succès:', snapshot);
    
    // Récupération de l'URL de téléchargement
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('URL de téléchargement:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('Erreur lors du téléchargement de la vidéo:', error);
    throw error;
  }
};

/**
 * Récupère toutes les vidéos associées à un deal
 * @param dealId Identifiant du deal
 * @returns Liste des URLs des vidéos
 */
export const getDealVideos = async (dealId: string): Promise<string[]> => {
  try {
    const videosRef = ref(storage, `deals/${dealId}/videos`);
    const result = await listAll(videosRef);
    
    // Récupération des URLs pour chaque vidéo
    const urls = await Promise.all(result.items.map(itemRef => getDownloadURL(itemRef)));
    
    return urls;
  } catch (error) {
    console.error('Erreur lors de la récupération des vidéos:', error);
    return [];
  }
};

/**
 * Supprime une vidéo de Firebase Storage
 * @param videoUrl URL de la vidéo à supprimer
 * @returns true si la suppression a réussi
 */
export const deleteDealVideo = async (videoUrl: string): Promise<boolean> => {
  try {
    // Extraire le chemin depuis l'URL
    const videoRef = ref(storage, decodeURIComponent(videoUrl.split('?')[0].split('/o/')[1]));
    await deleteObject(videoRef);
    console.log('Vidéo supprimée avec succès');
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression de la vidéo:', error);
    return false;
  }
};

/**
 * Vérifie si une URL vidéo est valide et accessible
 * @param videoUrl URL de la vidéo à vérifier
 * @returns true si l'URL est valide et accessible
 */
export const checkVideoUrlValid = (videoUrl: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.onloadedmetadata = () => resolve(true);
    video.onerror = () => resolve(false);
    video.src = videoUrl;
  });
};

/**
 * Génère une URL de vidéo optimisée pour éviter les problèmes de cache
 * @param videoUrl URL de la vidéo d'origine
 * @returns URL optimisée avec cache buster
 */
export const getOptimizedVideoUrl = (videoUrl: string): string => {
  if (!videoUrl) return '';
  
  // Ajouter un timestamp aléatoire pour éviter la mise en cache
  const cacheBuster = Math.floor(Math.random() * 1000000);
  const separator = videoUrl.includes('?') ? '&' : '?';
  return `${videoUrl}${separator}_=${cacheBuster}`;
};
