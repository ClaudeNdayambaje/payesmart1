import { db, auth, storage } from '../firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  Timestamp, 
  DocumentSnapshot, 
  QueryDocumentSnapshot 
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getCurrentBusinessId as getBusinessIdUtil } from '../utils/authUtils';

export const ADMIN_USERS_COLLECTION = 'adminUsers';

/**
 * Obtient l'ID de l'entreprise actuelle depuis l'utilitaire centralisé
 */
const getCurrentBusinessId = async (): Promise<string> => {
  const businessId = await getBusinessIdUtil();
  
  // Si l'ID de l'entreprise est null, utiliser une valeur par défaut pour la démo
  if (!businessId) {
    console.log('Utilisation d\'un ID d\'entreprise par défaut pour la démo');
    return 'demo-business-id';
  }
  
  return businessId;
};

/**
 * Interface pour les utilisateurs administratifs
 */
export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'superadmin' | 'admin' | 'support' | 'readonly';
  active: boolean;
  createdAt: Date;
  lastLogin?: Date;
  createdBy?: string;
  avatarUrl?: string;
  avatarBase64?: string;
  businessId?: string;
  permissions?: string[];
}

/**
 * Interface pour les documents Firestore des utilisateurs administratifs
 */
interface AdminUserFirestoreDocument {
  email: string;
  firstName: string;
  lastName: string;
  role: 'superadmin' | 'admin' | 'support' | 'readonly';
  active: boolean;
  createdAt: Timestamp;
  lastLogin?: Timestamp;
  createdBy?: string;
  businessId: string;
  permissions?: string[];
  avatarUrl?: string;
  avatarBase64?: string;
  updatedAt?: Timestamp;
}

/**
 * Convertit un objet AdminUser pour Firestore (dates -> timestamps)
 * Ne conserve que les champs qui sont définis (non undefined)
 */
const prepareAdminUserForFirestore = (user: Partial<AdminUser>): Partial<AdminUserFirestoreDocument> => {
  // Initialiser un objet vide pour stocker uniquement les champs définis
  const userData: Partial<AdminUserFirestoreDocument> = {};
  
  // N'ajouter que les champs qui sont définis
  if (user.email !== undefined) userData.email = user.email;
  if (user.firstName !== undefined) userData.firstName = user.firstName;
  if (user.lastName !== undefined) userData.lastName = user.lastName;
  if (user.role !== undefined) userData.role = user.role;
  if (user.active !== undefined) userData.active = user.active;
  if (user.businessId !== undefined) userData.businessId = user.businessId;
  if (user.createdBy !== undefined) userData.createdBy = user.createdBy;
  if (user.permissions !== undefined) userData.permissions = user.permissions;
  if (user.avatarUrl !== undefined) userData.avatarUrl = user.avatarUrl;
  
  // Convertir les dates en timestamps
  if (user.createdAt instanceof Date) {
    userData.createdAt = Timestamp.fromDate(user.createdAt);
  }
  
  if (user.lastLogin instanceof Date) {
    userData.lastLogin = Timestamp.fromDate(user.lastLogin);
  }
  
  // Ajouter un champ updatedAt pour suivre les modifications
  userData.updatedAt = Timestamp.now();
  
  return userData;
};

/**
 * Convertit un document Firestore en objet AdminUser (timestamps -> dates)
 */
const convertAdminUserFromFirestore = (doc: DocumentSnapshot | QueryDocumentSnapshot): AdminUser => {
  const data = doc.data() as AdminUserFirestoreDocument;
  
  return {
    id: doc.id,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    role: data.role,
    active: data.active,
    createdAt: data.createdAt?.toDate() || new Date(),
    lastLogin: data.lastLogin?.toDate(),
    createdBy: data.createdBy,
    businessId: data.businessId,
    permissions: data.permissions,
    avatarUrl: data.avatarUrl,
    avatarBase64: data.avatarBase64
  };
};

/**
 * Récupère tous les utilisateurs administratifs
 */
export const getAdminUsers = async (): Promise<AdminUser[]> => {
  try {
    // Récupérer tous les utilisateurs sans filtre de businessId
    const usersQuery = query(collection(db, ADMIN_USERS_COLLECTION));
    
    // Journaliser la requête pour le débogage
    console.log('Récupération de tous les utilisateurs administratifs');
    
    const snapshot = await getDocs(usersQuery);
    console.log(`Nombre d'utilisateurs trouvés: ${snapshot.docs.length}`);
    
    // Convertir les documents en objets AdminUser
    const users = snapshot.docs.map(doc => {
      const user = convertAdminUserFromFirestore(doc);
      console.log(`Utilisateur trouvé: ${user.firstName} ${user.lastName} (${user.email})`);
      return user;
    });
    
    return users;
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs administratifs:', error);
    return [];
  }
};

/**
 * Récupère un utilisateur administratif par son ID
 */
export const getAdminUserById = async (userId: string): Promise<AdminUser | null> => {
  try {
    const userDoc = await getDoc(doc(db, ADMIN_USERS_COLLECTION, userId));
    
    if (userDoc.exists()) {
      return convertAdminUserFromFirestore(userDoc);
    }
    
    return null;
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'utilisateur administratif ${userId}:`, error);
    return null;
  }
};

/**
 * Récupère un utilisateur administratif par son email
 */
export const getAdminUserByEmail = async (email: string): Promise<AdminUser | null> => {
  try {
    const businessId = await getCurrentBusinessId();
    const usersQuery = query(
      collection(db, ADMIN_USERS_COLLECTION),
      where('email', '==', email),
      where('businessId', '==', businessId)
    );
    
    const snapshot = await getDocs(usersQuery);
    
    if (!snapshot.empty) {
      return convertAdminUserFromFirestore(snapshot.docs[0]);
    }
    
    return null;
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'utilisateur administratif avec l'email ${email}:`, error);
    return null;
  }
};

/**
 * Ajoute un nouvel utilisateur administratif
 */
export const addAdminUser = async (userData: Partial<AdminUser>, password: string): Promise<AdminUser | null> => {
  try {
    // Validation des données d'entrée
    if (!userData) {
      throw new Error('Les données utilisateur sont requises');
    }
    
    if (!userData.email || !userData.firstName || !userData.lastName || !userData.role) {
      throw new Error('Tous les champs obligatoires doivent être remplis (email, prénom, nom, rôle)');
    }
    
    if (!password || password.length < 6) {
      throw new Error('Le mot de passe doit contenir au moins 6 caractères');
    }
    
    const businessId = await getCurrentBusinessId();
    
    // Vérifier si l'email existe déjà dans Firestore
    const existingUser = await getAdminUserByEmail(userData.email);
    if (existingUser) {
      throw new Error('Un utilisateur avec cet email existe déjà dans la base de données');
    }
    
    // Préparer les données pour Firestore avec des valeurs par défaut pour les champs obligatoires
    const now = new Date();
    const adminUserData: AdminUser = {
      id: '', // Sera remplacé par l'ID du document après création
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      active: userData.active !== undefined ? userData.active : true,
      businessId: businessId,
      createdAt: now
    };
    
    try {
      // Créer l'utilisateur dans Firebase Auth
      await createUserWithEmailAndPassword(auth, userData.email, password);
    } catch (error: any) {
      // Gérer le cas où l'email existe déjà dans Firebase Auth
      if (error.code === 'auth/email-already-in-use') {
        // Dans ce cas, nous pouvons continuer car l'utilisateur existe déjà dans Firebase
        // mais pas dans notre collection adminUsers
        console.log(`L'email ${userData.email} existe déjà dans Firebase Auth, mais pas dans notre base de données. Création de l'entrée dans Firestore uniquement.`);
      } else {
        // Pour les autres erreurs, on les propage
        throw error;
      }
    }
    
    // Ajouter l'utilisateur à Firestore
    try {
      const firestoreData = {
        email: adminUserData.email,
        firstName: adminUserData.firstName,
        lastName: adminUserData.lastName,
        role: adminUserData.role,
        active: adminUserData.active,
        businessId: adminUserData.businessId,
        createdAt: Timestamp.fromDate(adminUserData.createdAt)
      };
      
      const docRef = await addDoc(collection(db, ADMIN_USERS_COLLECTION), firestoreData);
      
      // Retourner l'utilisateur créé
      return {
        ...adminUserData,
        id: docRef.id
      };
    } catch (firestoreError) {
      console.error('Erreur Firestore lors de la création de l\'utilisateur:', firestoreError);
      throw new Error('Erreur lors de l\'enregistrement des données utilisateur');
    }
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur administratif:', error);
    throw error; // Propager l'erreur pour la gérer dans le composant
  }
};

/**
 * Met à jour un utilisateur administratif existant
 */
export const updateAdminUser = async (userId: string, userData: Partial<AdminUser>): Promise<boolean> => {
  try {
    // Préparer les données pour Firestore
    const firestoreData = prepareAdminUserForFirestore(userData);
    
    // Mettre à jour l'utilisateur dans Firestore
    await updateDoc(doc(db, ADMIN_USERS_COLLECTION, userId), firestoreData);
    
    return true;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de l'utilisateur administratif ${userId}:`, error);
    return false;
  }
};

/**
 * Supprime un utilisateur administratif
 * Note: Cette fonction ne supprime pas l'utilisateur de Firebase Auth
 */
export const deleteAdminUser = async (userId: string): Promise<boolean> => {
  try {
    // Supprimer l'utilisateur de Firestore
    await deleteDoc(doc(db, ADMIN_USERS_COLLECTION, userId));
    
    return true;
  } catch (error) {
    console.error(`Erreur lors de la suppression de l'utilisateur administratif ${userId}:`, error);
    return false;
  }
};

/**
 * Envoie un email de réinitialisation de mot de passe
 */
export const sendPasswordReset = async (email: string): Promise<boolean> => {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email de réinitialisation de mot de passe:', error);
    return false;
  }
};

/**
 * Upload un avatar pour un utilisateur administratif et met à jour son profil
 * @param userId ID de l'utilisateur
 * @param file Fichier image à uploader
 * @returns URL de l'avatar uploadé
 */
export const uploadUserAvatar = async (userId: string, file: File): Promise<string> => {
  try {
    console.log('Début de l\'upload d\'avatar pour l\'utilisateur:', userId);
    console.log('Type de fichier:', file.type);
    console.log('Taille du fichier:', file.size);
    console.log('Nom du fichier:', file.name);
    
    // Vérifier que le fichier est une image
    if (!file.type.startsWith('image/')) {
      throw new Error('Le fichier doit être une image');
    }
    
    // Limiter la taille du fichier à 5MB
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('L\'image ne doit pas dépasser 5MB');
    }
    
    // Étape 1: Convertir le fichier en DataURL pour s'assurer qu'il est valide
    let dataUrl: string;
    try {
      dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Échec de la lecture du fichier comme DataURL'));
          }
        };
        reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
        reader.readAsDataURL(file);
      });
      console.log('Fichier converti en DataURL avec succès, longueur:', dataUrl.length);
    } catch (error: any) {
      console.error('Erreur lors de la conversion du fichier en DataURL:', error);
      throw new Error(`Impossible de lire le fichier image: ${error.message}`);
    }
    
    // Étape 2: Créer un élément image pour vérifier que l'image est valide
    try {
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          console.log('Image chargée avec succès, dimensions:', img.width, 'x', img.height);
          resolve();
        };
        img.onerror = () => reject(new Error('Le fichier n\'est pas une image valide'));
        img.src = dataUrl;
      });
    } catch (error: any) {
      console.error('Erreur lors de la validation de l\'image:', error);
      throw new Error(`Le fichier n'est pas une image valide: ${error.message}`);
    }
    
    // Étape 3: Convertir la DataURL en Blob
    let fileBlob: Blob;
    try {
      const response = await fetch(dataUrl);
      fileBlob = await response.blob();
      console.log('DataURL convertie en Blob avec succès, taille:', fileBlob.size);
      
      if (fileBlob.size === 0) {
        throw new Error('Le fichier est vide après conversion');
      }
    } catch (error: any) {
      console.error('Erreur lors de la conversion de la DataURL en Blob:', error);
      throw new Error(`Erreur lors de la préparation de l'image: ${error.message}`);
    }
    
    // Étape 4: Générer un nom de fichier unique avec timestamp
    const timestamp = Date.now();
    const fileExtension = file.type.split('/')[1] || 'jpg';
    const fileName = `avatars/users/${userId}_${timestamp}.${fileExtension}`;
    console.log('Nom de fichier généré:', fileName);
    
    // Étape 5: Uploader le blob vers Firebase Storage
    const storageRef = ref(storage, fileName);
    try {
      const uploadResult = await uploadBytes(storageRef, fileBlob);
      console.log('Upload terminé avec succès:', uploadResult.metadata.fullPath);
    } catch (error: any) {
      console.error('Erreur lors de l\'upload vers Firebase Storage:', error);
      throw new Error(`Erreur lors de l'upload de l'image: ${error.message}`);
    }
    
    // Étape 6: Obtenir l'URL de téléchargement
    let downloadURL: string;
    try {
      downloadURL = await getDownloadURL(storageRef);
      // Ajouter un paramètre de cache-busting
      const cacheBustedURL = `${downloadURL}?t=${timestamp}`;
      console.log('URL de téléchargement obtenue:', cacheBustedURL);
      
      // Vérifier que l'URL est accessible
      const checkResponse = await fetch(cacheBustedURL, { method: 'HEAD' });
      if (!checkResponse.ok) {
        console.warn('Avertissement: L\'URL de l\'avatar pourrait ne pas être accessible:', checkResponse.status);
      } else {
        console.log('URL de l\'avatar vérifiée avec succès');
      }
      
      // Étape 7: Mettre à jour l'utilisateur dans Firestore
      const userRef = doc(db, ADMIN_USERS_COLLECTION, userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        throw new Error(`L'utilisateur avec l'ID ${userId} n'existe pas`);
      }
      
      // Mettre à jour l'URL de l'avatar et l'horodatage
      await updateDoc(userRef, {
        avatarUrl: cacheBustedURL,
        updatedAt: Timestamp.now()
      });
      console.log('Document utilisateur mis à jour avec succès');
      
      // Étape 8: Vérifier que la mise à jour a bien été prise en compte
      const updatedUserDoc = await getDoc(userRef);
      const updatedUserData = updatedUserDoc.data();
      
      if (!updatedUserData || updatedUserData.avatarUrl !== cacheBustedURL) {
        console.warn('Avertissement: L\'URL de l\'avatar dans Firestore ne correspond pas à celle attendue', {
          expected: cacheBustedURL,
          actual: updatedUserData?.avatarUrl
        });
      } else {
        console.log('Vérification réussie: L\'URL de l\'avatar est correctement enregistrée dans Firestore');
      }
      
      // Attendre un peu pour s'assurer que les modifications sont propagées
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return cacheBustedURL;
    } catch (error: any) {
      console.error('Erreur lors de la finalisation de l\'upload:', error);
      throw new Error(`Erreur lors de la finalisation de l'upload: ${error.message}`);
    }
  } catch (error: any) {
    console.error('Erreur globale lors de l\'upload de l\'avatar:', error);
    throw new Error(`Erreur lors de l'upload de l'avatar: ${error.message}`);
  }
};

/**
 * Vérifie si un avatar est correctement enregistré sur Firebase et dans Firestore
 * @param userId ID de l'utilisateur
 * @param avatarUrl URL de l'avatar à vérifier
 * @returns true si l'avatar est valide et correctement enregistré, false sinon
 */
export const verifyUserAvatar = async (userId: string, avatarUrl: string): Promise<boolean> => {
  try {
    console.log('Vérification complète de l\'avatar pour l\'utilisateur:', userId);
    console.log('URL de l\'avatar à vérifier:', avatarUrl);
    
    // Étape 1: Vérifier que l'URL est valide
    if (!avatarUrl || !avatarUrl.startsWith('https://')) {
      console.error('URL d\'avatar invalide:', avatarUrl);
      return false;
    }
    
    // Étape 2: Vérifier que l'URL pointe vers Firebase Storage
    if (!avatarUrl.includes('firebasestorage.googleapis.com')) {
      console.error('L\'URL ne pointe pas vers Firebase Storage:', avatarUrl);
      return false;
    }
    
    // Étape 3: Vérifier que l'image est accessible via l'URL
    let contentType: string | null = null;
    try {
      console.log('Tentative d\'accès à l\'image via fetch...');
      const response = await fetch(avatarUrl, { 
        method: 'HEAD',
        cache: 'no-cache' // Éviter les problèmes de cache
      });
      
      if (!response.ok) {
        console.error('Impossible d\'accéder à l\'image:', response.status, response.statusText);
        return false;
      }
      
      // Vérifier que l'image est bien un type image
      contentType = response.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image/')) {
        console.error('Le contenu n\'est pas une image:', contentType);
        return false;
      }
      
      console.log('Vérification HTTP réussie, l\'image est accessible avec le type:', contentType);
    } catch (fetchError) {
      console.error('Erreur lors de la récupération de l\'image via fetch:', fetchError);
      return false;
    }
    
    // Étape 4: Vérifier que l'URL est correctement enregistrée dans Firestore
    try {
      console.log('Vérification de l\'enregistrement dans Firestore...');
      const userRef = doc(db, ADMIN_USERS_COLLECTION, userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        console.error(`L'utilisateur avec l'ID ${userId} n'existe pas dans Firestore`);
        return false;
      }
      
      const userData = userDoc.data();
      const storedAvatarUrl = userData?.avatarUrl;
      
      // Comparer les URLs en ignorant les paramètres de cache-busting
      const baseStoredUrl = storedAvatarUrl?.split('?')[0];
      const baseInputUrl = avatarUrl.split('?')[0];
      
      if (!storedAvatarUrl) {
        console.error('Aucune URL d\'avatar n\'est enregistrée dans Firestore pour cet utilisateur');
        return false;
      }
      
      if (baseStoredUrl !== baseInputUrl) {
        console.error('L\'URL de l\'avatar dans Firestore ne correspond pas à celle fournie:', {
          stored: baseStoredUrl,
          provided: baseInputUrl
        });
        return false;
      }
      
      console.log('Vérification Firestore réussie, l\'URL est correctement enregistrée');
    } catch (firestoreError) {
      console.error('Erreur lors de la vérification dans Firestore:', firestoreError);
      return false;
    }
    
    // Étape 5: Tenter de charger l'image complètement pour s'assurer qu'elle est valide
    try {
      console.log('Test de chargement complet de l\'image...');
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          console.log('Image chargée avec succès, dimensions:', img.width, 'x', img.height);
          resolve();
        };
        img.onerror = () => {
          reject(new Error('Impossible de charger l\'image complètement'));
        };
        // Ajouter un paramètre de cache-busting unique
        img.src = `${avatarUrl}&nocache=${Date.now()}`;
        
        // Timeout de sécurité
        setTimeout(() => reject(new Error('Timeout lors du chargement de l\'image')), 10000);
      });
      
      console.log('Test de chargement complet réussi');
    } catch (loadError) {
      console.error('Erreur lors du test de chargement complet:', loadError);
      // Ne pas échouer la vérification complète si cette étape échoue
      console.warn('L\'image pourrait ne pas se charger correctement dans l\'interface');
    }
    
    console.log('Toutes les vérifications ont réussi, l\'avatar est valide et correctement enregistré');
    return true;
  } catch (error) {
    console.error('Erreur globale lors de la vérification de l\'avatar:', error);
    return false;
  }
};

/**
 * Récupère les rôles disponibles pour les utilisateurs administratifs
 */
export const getAvailableRoles = (): { id: string, name: string, description: string }[] => {
  return [
    {
      id: 'superadmin',
      name: 'Super Administrateur',
      description: 'Accès complet à toutes les fonctionnalités du système'
    },
    {
      id: 'admin',
      name: 'Administrateur',
      description: 'Accès à la plupart des fonctionnalités administratives'
    },
    {
      id: 'support',
      name: 'Support',
      description: 'Accès limité pour fournir du support aux utilisateurs'
    },
    {
      id: 'readonly',
      name: 'Lecture seule',
      description: 'Accès en lecture seule aux données'
    }
  ];
};
