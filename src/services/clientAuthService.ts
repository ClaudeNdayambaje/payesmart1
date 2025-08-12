import { auth, db } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { getDefaultPermissionsForRoleWithBusinessId } from './permissionService';
import { syncBusinessToSaasClient } from './saasClientService';

const BUSINESSES_COLLECTION = 'businesses';
const EMPLOYEES_COLLECTION = 'employees';

/**
 * Interface pour les données d'inscription
 */
export interface ClientRegistrationData {
  email: string;
  password: string;
  businessName: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

/**
 * Interface pour les données de l'entreprise
 */
export interface Business {
  id: string;
  businessName: string;
  ownerFirstName: string;
  ownerLastName: string;
  email: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
  plan: 'free' | 'basic' | 'premium';
  active: boolean;
}

/**
 * Crée un nouveau compte client et une entreprise associée
 */
export const registerClient = async (data: ClientRegistrationData): Promise<User> => {
  try {
    // Créer un compte utilisateur avec Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    const user = userCredential.user;
    
    // Mettre à jour le profil utilisateur
    await updateProfile(user, {
      displayName: `${data.firstName} ${data.lastName}`
    });
    
    // Envoyer un email de vérification
    await sendEmailVerification(user);
    
    // Créer un document business dans Firestore avec l'UID de l'utilisateur comme ID
    const businessRef = doc(db, BUSINESSES_COLLECTION, user.uid);
    await setDoc(businessRef, {
      businessName: data.businessName,
      ownerFirstName: data.firstName,
      ownerLastName: data.lastName,
      email: data.email,
      phone: data.phone || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      plan: 'free',
      active: true
    });
    
    // Créer un employé administrateur par défaut pour ce business avec toutes les informations disponibles
    const defaultPin = '1234'; // PIN par défaut
    const employeesCol = collection(db, EMPLOYEES_COLLECTION);
    
    // Préparation d'un objet employé complet avec toutes les informations disponibles
    const employeeData = {
      // Informations personnelles
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || '', // Inclure le téléphone s'il est disponible
      displayName: `${data.firstName} ${data.lastName}`,
      avatarUrl: '', // Pourra être mis à jour ultérieurement
      
      // Informations professionnelles
      role: 'admin',
      title: 'Administrateur principal', // Titre professionnel
      department: 'Direction', // Département par défaut
      businessId: user.uid,
      businessName: data.businessName,
      
      // Statut et sécurité
      pin: defaultPin,
      active: true,
      isMainAdmin: true, // Marquer comme administrateur principal
      
      // Droits et dates
      permissions: await getDefaultPermissionsForRoleWithBusinessId('admin', user.uid),
      createdAt: serverTimestamp(),
      lastUpdatedAt: serverTimestamp(),
      createdBy: user.uid
    };
    
    // Ajout de l'employé dans la collection
    await addDoc(employeesCol, employeeData);
    
    // Stocker les informations de connexion dans le localStorage pour les afficher après la redirection
    // et pour les utiliser dans les paramètres par défaut
    if (typeof window !== 'undefined' && window.localStorage) {
      // Forcer une déconnexion temporaire pour assurer un état propre
      await auth.signOut();
      
      // Puis reconnecter avec les nouvelles informations pour garantir que les données correctes sont chargées
      await signInWithEmailAndPassword(auth, data.email, data.password);
      
      localStorage.setItem('newAccountInfo', JSON.stringify({
        adminName: `${data.firstName} ${data.lastName}`,
        businessName: data.businessName,
        defaultPin: defaultPin,
        userId: user.uid, // Stocker l'ID utilisateur pour validation ultérieure
        email: data.email,
        phone: data.phone || '',
        address: '',  // Ces champs peuvent être ajoutés lors de l'inscription si nécessaire
        vatNumber: ''
      }));
      
      // Définir un flag pour indiquer qu'un rafraîchissement est nécessaire
      // Ce flag sera vérifié par EmployeeLogin.tsx pour rafraîchir la page
      localStorage.setItem('needsRefreshAfterAccountCreation', 'true');
      
      // Forcer le rechargement des paramètres pour utiliser les nouvelles informations
      localStorage.removeItem('cachedSettings');
    }
    
    // Importer et initialiser les paramètres avec les informations du compte
    try {
      const { getSettings } = await import('./settingsService');
      await getSettings(); // Cela va créer les paramètres par défaut avec les informations du compte
    } catch (error) {
      console.error('Erreur lors de l\'initialisation des paramètres:', error);
    }
    
    // Synchroniser avec le système SaaS pour l'administration
    await syncBusinessToSaasClient(user.uid);
    
    return user;
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    throw error;
  }
};

/**
 * Connecte un client avec son email et mot de passe
 * Vérifie également si l'utilisateur a un abonnement actif ou est en période d'essai
 */
// SIMPLIFICATION : Plus besoin de vérifier l'abonnement lors de la connexion
// Les clients en période d'essai doivent pouvoir se connecter sans restrictions

export const loginClient = async (email: string, password: string): Promise<User> => {
  try {
    console.log('Tentative de connexion avec:', email);
    
    // Authentifier l'utilisateur avec Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // CONNEXION RÉUSSIE: On autorise tous les utilisateurs authentifiés à se connecter
    console.log('Utilisateur authentifié avec succès:', email);
    
    // Retourner l'utilisateur connecté sans aucune vérification d'abonnement
    // Les clients en période d'essai peuvent se connecter normalement
    return user;
  } catch (error) {
    console.error('Erreur de connexion:', error);
    throw error;
  }
};

/**
 * Déconnecte le client actuel
 */
export const logoutClient = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Erreur de déconnexion:', error);
    throw error;
  }
};

/**
 * Envoie un email de réinitialisation de mot de passe
 */
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de réinitialisation:', error);
    throw error;
  }
};

/**
 * Récupère les informations de l'entreprise du client connecté
 */
export const getCurrentBusiness = async (): Promise<Business | null> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return null;
    }
    
    const businessRef = doc(db, BUSINESSES_COLLECTION, currentUser.uid);
    const businessSnapshot = await getDoc(businessRef);
    
    if (!businessSnapshot.exists()) {
      return null;
    }
    
    const data = businessSnapshot.data();
    return {
      id: businessSnapshot.id,
      businessName: data.businessName,
      ownerFirstName: data.ownerFirstName,
      ownerLastName: data.ownerLastName,
      email: data.email,
      phone: data.phone,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
      plan: data.plan,
      active: data.active
    } as Business;
  } catch (error) {
    console.error('Erreur lors de la récupération des informations de l\'entreprise:', error);
    return null;
  }
};

/**
 * Met à jour les informations de l'entreprise
 */
export const updateBusiness = async (businessData: Partial<Business>): Promise<boolean> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return false;
    }
    
    const businessRef = doc(db, BUSINESSES_COLLECTION, currentUser.uid);
    await updateDoc(businessRef, {
      ...businessData,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la mise à jour des informations de l\'entreprise:', error);
    return false;
  }
};
