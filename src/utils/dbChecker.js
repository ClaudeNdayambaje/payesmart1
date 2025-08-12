// Utilitaire pour vérifier les collections Firebase
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

/**
 * Vérifie le contenu d'une collection Firebase
 * @param {string} collectionName - Nom de la collection à vérifier
 */
export const checkCollection = async (collectionName) => {
  try {
    console.log(`Vérification de la collection '${collectionName}'...`);
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);
    
    if (snapshot.empty) {
      console.log(`La collection '${collectionName}' est vide.`);
      return [];
    } else {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log(`Trouvé ${data.length} documents dans '${collectionName}':`, data);
      return data;
    }
  } catch (error) {
    console.error(`Erreur lors de la vérification de '${collectionName}':`, error);
    return null;
  }
};
