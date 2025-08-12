import { getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Utilitaire pour forcer la mise à jour du nom du magasin
 * Cette fonction est conçue pour résoudre le problème où le nom du magasin
 * n'est pas correctement actualisé après la connexion.
 */
export const forceStoreNameRefresh = async (businessId: string): Promise<string | null> => {
  // Effacer toutes les données en cache liées au nom du magasin
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('cachedSettings');
    localStorage.removeItem('lastSettings');
    localStorage.removeItem('currentStoreName');
  }
  
  if (!businessId) {
    console.error('Impossible de rafraîchir le nom du magasin : businessId manquant');
    return null;
  }
  
  try {
    // Récupérer directement les informations de l'entreprise depuis Firestore
    const businessRef = doc(db, 'businesses', businessId);
    const businessSnap = await getDoc(businessRef);
    
    if (businessSnap.exists()) {
      const businessData = businessSnap.data();
      
      if (businessData.businessName) {
        console.log('Nom du magasin récupéré depuis la base de données:', businessData.businessName);
        
        // Sauvegarder le nom dans localStorage pour un accès rapide
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('currentStoreName', businessData.businessName);
        }
        
        // Déclencher un événement pour mettre à jour tous les composants qui affichent le nom
        if (typeof window !== 'undefined' && window.document) {
          const event = new CustomEvent('storeNameUpdated', {
            detail: {
              storeName: businessData.businessName,
              timestamp: Date.now()
            }
          });
          
          document.dispatchEvent(event);
        }
        
        return businessData.businessName;
      }
    }
    
    console.error('Aucun nom de magasin trouvé pour businessId:', businessId);
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération du nom du magasin:', error);
    return null;
  }
};

/**
 * Nettoie toutes les données liées au magasin lors de la déconnexion
 */
export const clearStoreData = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    // Clés spécifiques à supprimer
    const keysToRemove = [
      'businessId',
      'currentEmployee',
      'currentStoreName',
      'cachedSettings',
      'lastSettings',
      'cartItems'
    ];
    
    // Supprimer toutes ces clés
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log('Données du magasin effacées avec succès');
  }
};
