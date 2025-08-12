import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

/**
 * Utilitaires d'authentification centralisés pour éviter les dépendances circulaires
 */

/**
 * Obtient l'utilisateur actuellement connecté directement depuis Firebase Auth
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Obtient l'ID de l'entreprise actuelle avec priorité sur le localStorage puis Firebase Auth
 * @returns Promise<string> ID de l'entreprise ou null si non connecté
 */
export const getCurrentBusinessId = async (): Promise<string | null> => {
  // Vérifier d'abord dans le localStorage
  if (typeof window !== 'undefined' && window.localStorage) {
    const storedBusinessId = localStorage.getItem('businessId');
    if (storedBusinessId) {
      // console.log(`getCurrentBusinessId: Utilisation de l'ID stocké en local: ${storedBusinessId}`);
      return storedBusinessId;
    }
  }

  // Si pas dans localStorage, vérifier l'utilisateur connecté
  const user = auth.currentUser;
  
  if (!user) {
    // En mode développement, ne pas afficher d'erreur mais retourner null silencieusement
    if (process.env.NODE_ENV === 'development') {
      // console.error("getCurrentBusinessId: Aucun utilisateur connecté");
      return null;
    } else {
      console.error("getCurrentBusinessId: Aucun utilisateur connecté");
      return null;
    }
  }

  try {
    // Vérifier si le document business existe
    const businessDoc = await getDoc(doc(db, 'businesses', user.uid));
    
    if (!businessDoc.exists()) {
      console.log(`Création d'une entreprise par défaut pour l'utilisateur ${user.uid}`);
      
      // Récupérer les informations de l'entreprise associée à l'abonnement
      const subscriptionQuery = await getDoc(doc(db, 'saas_clients', user.uid));
      
      let businessName = "Mon Entreprise";
      let businessEmail = user.email || "";
      let businessAddress = "";
      let businessPhone = "";
      
      // Si nous avons des informations d'entreprise dans saas_clients, les utiliser
      if (subscriptionQuery.exists()) {
        const clientData = subscriptionQuery.data();
        businessName = clientData.businessName || businessName;
        businessEmail = clientData.email || businessEmail;
        businessAddress = clientData.address || businessAddress;
        businessPhone = clientData.phone || businessPhone;
        console.log('Informations d\'entreprise récupérées:', clientData);
      } else {
        console.log('Aucune information d\'entreprise trouvée dans saas_clients');
      }
      
      // Créer une entreprise avec les informations récupérées
      const defaultBusiness = {
        name: businessName,
        address: businessAddress,
        phone: businessPhone,
        email: businessEmail,
        logo: "",
        createdAt: new Date().getTime(),
        updatedAt: new Date().getTime(),
        settings: {
          currency: "EUR",
          language: "fr",
          timezone: "Europe/Paris"
        },
        isInTrial: true,
        trialStartDate: new Date().getTime(),
        trialEndDate: new Date().getTime() + (14 * 24 * 60 * 60 * 1000), // 14 jours par défaut
        owner: user.uid
      };
      
      // Sauvegarder l'entreprise dans Firestore
      await setDoc(doc(db, 'businesses', user.uid), defaultBusiness);
      
      // Stocker l'ID dans localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('businessId', user.uid);
      }
      
      return user.uid;
    }
    
    // Stocker l'ID dans localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('businessId', user.uid);
    }
    
    return user.uid;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'entreprise:", error);
    return null;
  }
};

/**
 * Vide le cache des ventes
 * Cette fonction est utilisée par plusieurs services pour éviter les dépendances circulaires
 */
export const clearSalesCache = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('salesCache');
    localStorage.removeItem('salesCacheTimestamp');
  }
};
