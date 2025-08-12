import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

const ADMIN_USERS_COLLECTION = 'adminUsers';

/**
 * Service de sécurité pour vérifier l'autorisation des utilisateurs
 */

/**
 * Vérifie si un utilisateur existe dans la base de données et est autorisé à accéder à l'application
 * @param email Email de l'utilisateur à vérifier
 * @returns Un objet contenant le statut d'autorisation et les informations de l'utilisateur
 */
export const verifyUserAuthorization = async (email: string | null | undefined) => {
  try {
    // Si aucun email n'est fourni, l'utilisateur n'est pas autorisé
    if (!email) {
      console.error('Aucun email fourni pour la vérification d\'autorisation');
      return { authorized: false, user: null, reason: 'NO_EMAIL' };
    }

    // Rechercher l'utilisateur dans la collection adminUsers
    const usersQuery = query(
      collection(db, ADMIN_USERS_COLLECTION),
      where('email', '==', email)
    );
    
    const snapshot = await getDocs(usersQuery);
    
    // Si aucun utilisateur n'est trouvé, l'accès est refusé
    if (snapshot.empty) {
      console.error(`Aucun utilisateur trouvé avec l'email ${email}`);
      return { authorized: false, user: null, reason: 'USER_NOT_FOUND' };
    }
    
    // Récupérer les données de l'utilisateur
    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    
    // Vérifier si l'utilisateur est actif
    if (userData.active === false) {
      console.error(`L'utilisateur ${email} est désactivé`);
      return { authorized: false, user: null, reason: 'USER_DISABLED' };
    }
    
    // Vérifier le rôle de l'utilisateur (optionnel, selon vos besoins)
    const allowedRoles = ['superadmin', 'admin', 'support', 'readonly'];
    if (!userData.role || !allowedRoles.includes(userData.role)) {
      console.error(`L'utilisateur ${email} a un rôle non autorisé: ${userData.role}`);
      return { authorized: false, user: null, reason: 'INVALID_ROLE' };
    }
    
    // L'utilisateur est autorisé
    return { 
      authorized: true, 
      user: {
        id: userDoc.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        avatarUrl: userData.avatarUrl,
        avatarBase64: userData.avatarBase64 || null
      },
      reason: 'AUTHORIZED'
    };
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'autorisation:', error);
    return { authorized: false, user: null, reason: 'ERROR' };
  }
};

/**
 * Déconnecte l'utilisateur et nettoie les données de session
 */
export const forceLogout = async () => {
  try {
    // Supprimer les données de session
    localStorage.removeItem('payesmart_admin_email');
    localStorage.removeItem('payesmart_admin_token');
    
    // Déconnecter l'utilisateur de Firebase Auth
    await signOut(auth);
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la déconnexion forcée:', error);
    return false;
  }
};

/**
 * Vérifie périodiquement l'autorisation de l'utilisateur
 * @param callback Fonction à appeler avec le résultat de la vérification
 * @param interval Intervalle en millisecondes entre chaque vérification (par défaut: 5 minutes)
 * @returns Une fonction pour arrêter les vérifications périodiques
 */
export const startPeriodicAuthCheck = (
  callback: (result: { authorized: boolean, user: any, reason: string }) => void,
  interval = 5 * 60 * 1000
) => {
  // Vérifier immédiatement
  const checkAuth = async () => {
    const currentUser = auth.currentUser;
    const storedEmail = localStorage.getItem('payesmart_admin_email');
    const email = currentUser?.email || storedEmail;
    
    const result = await verifyUserAuthorization(email);
    callback(result);
  };
  
  // Lancer la première vérification
  checkAuth();
  
  // Configurer la vérification périodique
  const intervalId = setInterval(checkAuth, interval);
  
  // Retourner une fonction pour arrêter les vérifications
  return () => clearInterval(intervalId);
};
