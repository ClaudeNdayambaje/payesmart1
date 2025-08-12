import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Employee, Permission } from '../types/index';
import { getAllPermissions } from './permissionService';
import { clearSalesCache as clearSalesCacheUtil } from '../utils/authUtils';
import { refreshPageAfterLogin } from '../utils/pageRefresh';

const EMPLOYEES_COLLECTION = 'employees';

// Fonction pour vider le cache des ventes
export const clearSalesCache = () => {
  // Utiliser la fonction utilitaire centralisée
  clearSalesCacheUtil();
};

/**
 * Convertit un document Firestore en objet Employee
 */
const convertEmployeeFromFirestore = (doc: any): Employee => {
  const data = doc.data();
  
  // S'assurer que le businessId existe
  const businessId = data.businessId || 'default';
  console.log(`Conversion de l'employé ${doc.id} avec businessId: ${businessId}`);
  
  // Convertir les permissions en objets Permission complets
  let permissions: Permission[] = [];
  
  // Cas 1: Si les permissions sont stockées comme des objets complets
  if (data.permissions && Array.isArray(data.permissions) && 
      data.permissions.length > 0 && typeof data.permissions[0] === 'object') {
    console.log(`Employé ${doc.id}: permissions stockées comme objets complets`);
    permissions = data.permissions.map((perm: any) => ({
      ...perm,
      businessId: businessId // S'assurer que le businessId est correct
    }));
  }
  // Cas 2: Si les permissions sont stockées comme des IDs (chaînes)
  else if (data.permissions && Array.isArray(data.permissions)) {
    console.log(`Employé ${doc.id}: permissions stockées comme IDs`);
    const allPermissions = getAllPermissions();
    permissions = data.permissions.map((permId: string) => {
      const foundPermission = allPermissions.find(p => p.id === permId);
      if (foundPermission) {
        return {
          ...foundPermission,
          businessId: businessId
        };
      }
      // Si la permission n'est pas trouvée, utiliser une catégorie valide
      return {
        id: permId,
        name: permId,
        description: 'Permission',
        category: 'admin',
        level: 'read',
        businessId: businessId
      };
    });
  }
  
  console.log(`Employé ${doc.id}: ${permissions.length} permissions converties`);
  
  const employee = {
    ...data,
    id: doc.id,
    businessId: businessId, // S'assurer que le businessId est défini
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
    lastLogin: data.lastLogin?.toDate ? data.lastLogin.toDate() : data.lastLogin,
    birthDate: data.birthDate?.toDate ? data.birthDate.toDate() : data.birthDate,
    hireDate: data.hireDate?.toDate ? data.hireDate.toDate() : data.hireDate,
    permissions: permissions, // Utiliser les permissions converties
    firebasePassword: data.firebasePassword, // Inclure le mot de passe Firebase s'il existe
    documents: data.documents ? data.documents.map((document: any) => ({
      ...document,
      uploadDate: document.uploadDate?.toDate ? document.uploadDate.toDate() : document.uploadDate
    })) : []
  } as Employee;
  
  return employee;
};

/**
 * Authentifie un employé avec son email et son PIN
 */
export const loginWithEmailAndPin = async (email: string, pin: string): Promise<Employee | null> => {
  try {
    // Essayer de se connecter avec Firebase Auth (pour les administrateurs)
    await signInWithEmailAndPassword(auth, email, pin);
    
    // Vider le cache des ventes pour forcer un rechargement
    clearSalesCache();
    
    // Récupérer les informations de l'employé depuis Firestore
    const employeesCollection = collection(db, EMPLOYEES_COLLECTION);
    const q = query(employeesCollection, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    // Vérifier que l'employé appartient au bon compte
    const employee = convertEmployeeFromFirestore(querySnapshot.docs[0]);
    const currentUser = auth.currentUser;
    
    if (currentUser && employee.businessId !== currentUser.uid) {
      console.error(`L'employé ${employee.id} n'appartient pas à cette entreprise`);
      await signOut(auth); // Déconnecter l'utilisateur
      return null;
    }
    
    // Actualiser la page pour appliquer les nouveaux thèmes
    refreshPageAfterLogin();
    
    return employee;
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return null;
  }
};

/**
 * Authentifie un employé avec son ID et son PIN
 */
export const loginWithIdAndPin = async (employeeId: string, pin: string): Promise<Employee | null> => {
  try {
    console.log(`Tentative de connexion pour l'employé ID: ${employeeId} avec PIN: ${pin.replace(/./g, '*')}`);
    
    // Récupérer l'employé depuis Firestore
    const employeeRef = doc(db, EMPLOYEES_COLLECTION, employeeId);
    const employeeSnapshot = await getDoc(employeeRef);
    
    if (!employeeSnapshot.exists()) {
      console.log(`Employé ID ${employeeId} non trouvé dans Firestore`);
      return null;
    }
    
    // Afficher les données brutes de l'employé pour débogage
    const rawData = employeeSnapshot.data();
    console.log(`Données brutes de l'employé:`, rawData);
    console.log(`PIN stocké dans Firestore: ${rawData.pin}, type: ${typeof rawData.pin}`);
    console.log(`PIN fourni: ${pin}, type: ${typeof pin}`);
    
    // Vérifier que le PIN correspond (convertir en chaîne pour être sûr)
    const storedPin = String(rawData.pin);
    if (storedPin !== pin) {
      console.log(`PIN incorrect pour l'employé ID ${employeeId}. Attendu: ${storedPin}, Reçu: ${pin}`);
      return null;
    }
    
    // Convertir les données de l'employé
    const employee = convertEmployeeFromFirestore(employeeSnapshot);
    console.log(`Employé récupéré: ${employee.firstName} ${employee.lastName}, rôle: ${employee.role}`);
    console.log(`Permissions de l'employé: ${employee.permissions.length}`);
    
    // Stocker le businessId dans le localStorage pour les futures requêtes (seulement côté client)
    if (employee.businessId && typeof window !== 'undefined' && window.localStorage) {
      try {
        console.log(`Stockage du businessId dans localStorage: ${employee.businessId}`);
        localStorage.setItem('businessId', employee.businessId);
      } catch (e) {
        console.error('Erreur lors de l\'accès au localStorage:', e);
      }
    }
    
    // Si c'est un admin, se connecter avec Firebase Auth
    if (employee.role === 'admin' && employee.email) {
      console.log(`Tentative d'authentification Firebase pour l'admin: ${employee.email}`);
      
      try {
        // Vérifier si l'employé a un mot de passe Firebase spécifique
        if (employee.firebasePassword) {
          try {
            await signInWithEmailAndPassword(auth, employee.email, employee.firebasePassword);
            console.log(`Authentification Firebase réussie pour ${employee.email}`);
            
            // Vérifier que l'employé appartient au bon compte
            const currentUser = auth.currentUser;
            if (currentUser && employee.businessId !== currentUser.uid) {
              console.error(`L'employé ${employee.id} n'appartient pas à cette entreprise`);
              await signOut(auth); // Déconnecter l'utilisateur
              return null;
            }
          } catch (authError) {
            console.error('Erreur lors de la connexion Firebase Auth:', authError);
            // Continuer même si la connexion Firebase Auth échoue
          }
        } else {
          console.log(`L'employé ${employee.id} n'a pas de mot de passe Firebase, authentification locale uniquement`);
        }
      } catch (authError) {
        console.error('Erreur lors de la connexion Firebase Auth:', authError);
        // Continuer même si la connexion Firebase Auth échoue
      }
    }
    
    // Vider le cache des ventes pour forcer un rechargement
    clearSalesCache();
    
    // Vérifier que les permissions ont bien le businessId correct
    if (employee.permissions && Array.isArray(employee.permissions)) {
      // S'assurer que toutes les permissions ont le bon businessId
      employee.permissions = employee.permissions.map(perm => {
        if (typeof perm === 'string') {
          // Si c'est juste un ID de permission, le convertir en objet Permission
          const allPermissions = getAllPermissions();
          const foundPerm = allPermissions.find(p => p.id === perm);
          if (foundPerm) {
            return {
              ...foundPerm,
              businessId: employee.businessId || 'default'
            };
          }
          return {
            id: perm,
            name: perm,
            description: 'Permission',
            category: 'admin',
            level: 'read',
            businessId: employee.businessId || 'default'
          };
        } else {
          // Si c'est déjà un objet Permission, s'assurer que le businessId est correct
          return {
            ...perm,
            businessId: employee.businessId || 'default'
          };
        }
      });
    }
    
    console.log(`Connexion réussie pour ${employee.firstName} ${employee.lastName}`);
    console.log(`Nombre de permissions après vérification: ${employee.permissions.length}`);
    
    // Actualiser la page pour appliquer les nouveaux thèmes
    refreshPageAfterLogin();
    
    return employee;
  } catch (error) {
    console.error('Erreur lors de la connexion avec ID et PIN:', error);
    return null;
  }
};

/**
 * Déconnecte l'utilisateur actuel
 */
export const logout = async (): Promise<void> => {
  try {
    // Vider le cache des ventes pour forcer un rechargement
    clearSalesCache();
    
    await signOut(auth);
  } catch (error) {
    console.error('Erreur de déconnexion:', error);
  }
};

/**
 * Récupère l'utilisateur actuellement connecté
 */
export const getCurrentUser = async (): Promise<User | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

/**
 * Récupère tous les employés actifs pour l'écran de connexion
 */
export const getActiveEmployees = async (): Promise<Employee[]> => {
  try {
    console.log('Récupération des employés actifs pour l\'écran de connexion');
    
    // Récupérer l'utilisateur connecté pour obtenir le businessId
    const currentUser = await getCurrentUser();
    let businessId = currentUser?.uid;
    console.log('Utilisateur connecté:', currentUser ? 'Oui' : 'Non', 'UID:', businessId);
    
    // Si aucun businessId n'est trouvé via l'utilisateur connecté,
    // essayer de le récupérer du localStorage (seulement côté client)
    if (!businessId && typeof window !== 'undefined' && window.localStorage) {
      try {
        const storedBusinessId = localStorage.getItem('businessId');
        if (storedBusinessId) {
          console.log('BusinessId récupéré du localStorage:', storedBusinessId);
          businessId = storedBusinessId;
        }
      } catch (e) {
        console.error('Erreur lors de l\'accès au localStorage:', e);
      }
    }
    
    // Récupérer les employés actifs filtrés par businessId
    const employeesCollection = collection(db, EMPLOYEES_COLLECTION);
    
    // Vérifier si nous avons un businessId valide
    if (!businessId) {
      console.error('Aucun businessId disponible pour filtrer les employés.');
      return [];
    }
    
    console.log('Récupération des employés actifs avec businessId:', businessId);
    const q = query(employeesCollection, 
      where("active", "==", true),
      where("businessId", "==", businessId)
    );
    
    const querySnapshot = await getDocs(q);
    console.log(`Nombre d'employés actifs trouvés: ${querySnapshot.docs.length}`);
    
    // Afficher les businessId de tous les employés trouvés pour débogage
    if (querySnapshot.docs.length > 0) {
      console.log('Liste des employés trouvés:');
      querySnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`Employé ${index + 1}: ID=${doc.id}, Nom=${data.firstName} ${data.lastName}, BusinessId=${data.businessId || 'non défini'}`);
      });
    } else {
      console.log('Aucun employé actif trouvé dans la base de données');
    }
    
    return querySnapshot.docs.map(convertEmployeeFromFirestore);
  } catch (error) {
    console.error('Erreur lors de la récupération des employés actifs:', error);
    return [];
  }
};
