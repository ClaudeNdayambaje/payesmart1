import { db, auth } from '../firebase';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { getCurrentBusinessId } from '../utils/authUtils';

const ADMIN_USERS_COLLECTION = 'adminUsers';

/**
 * Vérifie si des utilisateurs administrateurs existent déjà
 */
export const checkIfAdminUsersExist = async (): Promise<boolean> => {
  try {
    const businessId = await getCurrentBusinessId();
    
    // Si nous n'avons pas d'ID d'entreprise, utiliser une valeur par défaut
    const effectiveBusinessId = businessId || 'demo-business-id';
    
    const usersQuery = query(
      collection(db, ADMIN_USERS_COLLECTION),
      where('businessId', '==', effectiveBusinessId)
    );
    
    const snapshot = await getDocs(usersQuery);
    return !snapshot.empty;
  } catch (error) {
    console.error('Erreur lors de la vérification des utilisateurs administratifs:', error);
    return false;
  }
};

/**
 * Crée un utilisateur administrateur par défaut si aucun n'existe
 */
export const createDefaultAdminUser = async (): Promise<boolean> => {
  try {
    // Vérifier si des utilisateurs existent déjà
    const adminUsersExist = await checkIfAdminUsersExist();
    if (adminUsersExist) {
      console.log('Des utilisateurs administrateurs existent déjà, pas besoin d\'en créer un par défaut');
      return false;
    }
    
    console.log('Aucun utilisateur administrateur trouvé, création d\'un utilisateur par défaut');
    
    const businessId = await getCurrentBusinessId();
    const effectiveBusinessId = businessId || 'demo-business-id';
    
    // Informations de l'utilisateur par défaut
    const defaultEmail = 'admin@payesmart.com';
    const defaultPassword = 'admin123';
    const defaultFirstName = 'Admin';
    const defaultLastName = 'PayeSmart';
    
    // Vérifier si l'utilisateur existe déjà dans Firebase Auth
    try {
      // Essayer de créer l'utilisateur dans Firebase Auth
      await createUserWithEmailAndPassword(auth, defaultEmail, defaultPassword);
      console.log('Utilisateur créé dans Firebase Auth');
    } catch (authError: any) {
      // Si l'erreur est que l'utilisateur existe déjà, c'est OK
      if (authError.code === 'auth/email-already-in-use') {
        console.log('L\'utilisateur existe déjà dans Firebase Auth, continuons');
      } else {
        console.error('Erreur lors de la création de l\'utilisateur dans Firebase Auth:', authError);
        throw authError;
      }
    }
    
    // Créer l'utilisateur dans Firestore
    const adminUserData = {
      email: defaultEmail,
      firstName: defaultFirstName,
      lastName: defaultLastName,
      role: 'superadmin',
      active: true,
      createdAt: Timestamp.now(),
      lastLogin: Timestamp.now(),
      businessId: effectiveBusinessId,
      permissions: ['all']
    };
    
    await addDoc(collection(db, ADMIN_USERS_COLLECTION), adminUserData);
    console.log('Utilisateur administrateur par défaut créé avec succès');
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur administrateur par défaut:', error);
    return false;
  }
};
