import { db, auth } from '../firebase';
import { collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, Timestamp, DocumentSnapshot, QueryDocumentSnapshot } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Employee, Shift, Permission, Break, EmployeeFirestoreDocument, ShiftFirestoreDocument } from '../types/index';
import { getDefaultPermissionsForRoleWithBusinessId, getAllPermissions } from './permissionService';
import { getCurrentUser as getUserUtil, getCurrentBusinessId as getBusinessIdUtil } from '../utils/authUtils';

const EMPLOYEES_COLLECTION = 'employees';
const SHIFTS_COLLECTION = 'shifts';
const PERMISSIONS_COLLECTION = 'permissions';

/**
 * Obtient l'utilisateur actuellement connecté depuis l'utilitaire centralisé
 */
const getCurrentUser = async () => {
  return getUserUtil();
};

/**
 * Obtient l'ID de l'entreprise actuelle depuis l'utilitaire centralisé
 */
const getCurrentBusinessId = async (): Promise<string> => {
  return getBusinessIdUtil();
};

/**
 * Convertit un objet Employee pour Firestore (dates -> timestamps)
 */
const prepareEmployeeForFirestore = (employee: Partial<Employee>): Partial<EmployeeFirestoreDocument> => {
  // Créer un nouvel objet pour éviter les problèmes de typage
  const employeeData: Partial<EmployeeFirestoreDocument> = {};
  
  // N'ajouter que les propriétés qui sont définies
  if (employee.firstName !== undefined) employeeData.firstName = employee.firstName;
  if (employee.lastName !== undefined) employeeData.lastName = employee.lastName;
  if (employee.email !== undefined) employeeData.email = employee.email;
  if (employee.pin !== undefined) employeeData.pin = employee.pin;
  if (employee.role !== undefined) employeeData.role = employee.role;
  if (employee.active !== undefined) employeeData.active = employee.active;
  if (employee.businessId !== undefined) employeeData.businessId = employee.businessId;
  if (employee.isMainAdmin !== undefined) employeeData.isMainAdmin = employee.isMainAdmin;
  if (employee.permissions) employeeData.permissions = employee.permissions.map(p => p.id);
  if (employee.avatarUrl !== undefined) employeeData.avatarUrl = employee.avatarUrl;
  if (employee.address !== undefined) employeeData.address = employee.address;
  if (employee.phone !== undefined) employeeData.phone = employee.phone;
  if (employee.emergencyContact !== undefined) employeeData.emergencyContact = employee.emergencyContact;
  if (employee.contractType !== undefined) employeeData.contractType = employee.contractType;
  if (employee.hourlyRate !== undefined) employeeData.hourlyRate = employee.hourlyRate;
  if (employee.bankAccount !== undefined) employeeData.bankAccount = employee.bankAccount;
  if (employee.socialSecurityNumber !== undefined) employeeData.socialSecurityNumber = employee.socialSecurityNumber;
  if (employee.notes !== undefined) employeeData.notes = employee.notes;
  if (employee.schedule !== undefined) employeeData.schedule = employee.schedule;
  
  // Convertir les dates en timestamps
  if (employeeData.createdAt && employeeData.createdAt instanceof Date) {
    employeeData.createdAt = Timestamp.fromDate(employeeData.createdAt);
  }
  if (employeeData.lastLogin && employeeData.lastLogin instanceof Date) {
    employeeData.lastLogin = Timestamp.fromDate(employeeData.lastLogin);
  }
  if (employeeData.birthDate && employeeData.birthDate instanceof Date) {
    employeeData.birthDate = Timestamp.fromDate(employeeData.birthDate);
  }
  if (employeeData.hireDate && employeeData.hireDate instanceof Date) {
    employeeData.hireDate = Timestamp.fromDate(employeeData.hireDate);
  }
  if (employeeData.terminationDate && employeeData.terminationDate instanceof Date) {
    employeeData.terminationDate = Timestamp.fromDate(employeeData.terminationDate);
  }
  
  // Convertir les dates des documents si ils existent
  if (employeeData.documents && Array.isArray(employeeData.documents)) {
    const firestoreDocuments = employeeData.documents.map(document => {
      if (document.uploadDate instanceof Date) {
        return {
          ...document,
          uploadDate: Timestamp.fromDate(document.uploadDate)
        };
      }
      return document;
    });
    employeeData.documents = firestoreDocuments;
  }
  
  return employeeData;
};

/**
 * Convertit un document Firestore en objet Employee (timestamps -> dates)
 */
const convertEmployeeFromFirestore = (doc: DocumentSnapshot | QueryDocumentSnapshot): Employee => {
  const data = doc.data();
  if (!data) {
    throw new Error(`Document ${doc.id} n'existe pas ou n'a pas de données`);
  }
  
  // Récupérer le businessId du document
  const businessId = data.businessId || '';
  
  // Récupérer les permissions spécifiques de l'employé si elles existent
  // Sinon, utiliser les permissions par défaut en fonction du rôle
  let permissions: Permission[] = [];
  
  if (data.permissions && Array.isArray(data.permissions)) {
    // Convertir les IDs de permissions en objets Permission complets
    const allPermissions = getAllPermissions();
    permissions = data.permissions.map((permId: string) => {
      const foundPermission = allPermissions.find(p => p.id === permId);
      if (foundPermission) {
        return {
          ...foundPermission,
          businessId
        };
      }
      // Si la permission n'est pas trouvée, utiliser une catégorie valide
      return {
        id: permId,
        name: permId,
        description: 'Permission',
        category: 'admin', // Catégorie valide au lieu de 'unknown'
        level: 'read',
        businessId
      };
    });
    console.log('Permissions récupérées depuis Firestore:', permissions);
  } else {
    // Utiliser les permissions par défaut pour le rôle
    permissions = getDefaultPermissionsForRoleWithBusinessId(data.role || 'cashier', businessId);
    console.log('Permissions par défaut utilisées lors de la récupération:', permissions);
  }
  
  // Convertir les timestamps en dates
  const employee: Employee = {
    id: doc.id,
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    email: data.email || '',
    role: data.role || 'cashier',
    pin: data.pin || '',
    active: data.active !== undefined ? data.active : true,
    businessId: businessId,
    permissions: permissions,
    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt || new Date()),
    lastLogin: data.lastLogin?.toDate ? data.lastLogin.toDate() : data.lastLogin,
    birthDate: data.birthDate?.toDate ? data.birthDate.toDate() : data.birthDate,
    hireDate: data.hireDate?.toDate ? data.hireDate.toDate() : data.hireDate,
    terminationDate: data.terminationDate?.toDate ? data.terminationDate.toDate() : data.terminationDate,
    avatarUrl: data.avatarUrl,
    address: data.address,
    phone: data.phone,
    emergencyContact: data.emergencyContact,
    contractType: data.contractType,
    hourlyRate: data.hourlyRate,
    bankAccount: data.bankAccount,
    socialSecurityNumber: data.socialSecurityNumber,
    notes: data.notes,
    schedule: data.schedule
  };
  
  // Convertir les documents
  if (data.documents && Array.isArray(data.documents)) {
    employee.documents = data.documents.map((doc: any) => ({
      id: doc.id,
      type: doc.type,
      name: doc.name,
      url: doc.url,
      uploadDate: doc.uploadDate.toDate(),
      businessId: businessId
    }));
  }
  
  return employee;
};

/**
 * Récupère tous les employés d'une entreprise depuis Firestore
 */
export const getEmployees = async (): Promise<Employee[]> => {
  try {
    // Récupérer le businessId directement du localStorage pour éviter les problèmes asynchrones
    const businessIdStr = localStorage.getItem("businessId");
    if (!businessIdStr) {
      console.error('Aucun businessId trouvé dans localStorage');
      return [];
    }
    
    console.log('Récupération des employés pour le businessId:', businessIdStr);
    
    // Récupérer tous les employés de l'entreprise
    const employeesCollection = collection(db, EMPLOYEES_COLLECTION);
    const employeesQuery = query(employeesCollection, where('businessId', '==', businessIdStr));
    const employeesSnapshot = await getDocs(employeesQuery);
    
    console.log(`Nombre d'employés trouvés dans Firestore: ${employeesSnapshot.docs.length}`);
    
    if (employeesSnapshot.empty) {
      console.warn('Aucun employé trouvé dans Firestore pour ce businessId');
      return [];
    }
    
    // Convertir les documents Firestore en objets Employee
    const allEmployees = employeesSnapshot.docs.map(doc => {
      const employee = convertEmployeeFromFirestore(doc);
      console.log(`Employé converti: ${employee.firstName} ${employee.lastName}, businessId: ${employee.businessId}`);
      return employee;
    });
    
    console.log('Tous les employés après conversion:', allEmployees.map(e => `${e.firstName} ${e.lastName}`));
    
    // Vérifier que les employés ont bien le bon businessId
    const filteredEmployees = allEmployees.filter(employee => employee.businessId === businessIdStr);
    
    if (filteredEmployees.length !== allEmployees.length) {
      console.warn(`${allEmployees.length - filteredEmployees.length} employés ont été filtrés car ils n'appartiennent pas à l'entreprise actuelle`);
    }
    
    console.log(`Nombre final d'employés après filtrage: ${filteredEmployees.length}`);
    return filteredEmployees;
  } catch (error) {
    console.error('Erreur lors de la récupération des employés:', error);
    return [];
  }
};

/**
 * Récupère un employé par son ID
 */
export const getEmployeeById = async (employeeId: string): Promise<Employee | null> => {
  try {
    // Vérifier que l'utilisateur est connecté
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      console.error('Aucun utilisateur connecté');
      return null;
    }
    
    const businessId = await getCurrentBusinessId();
    
    // Récupérer l'employé
    const employeeRef = doc(db, EMPLOYEES_COLLECTION, employeeId);
    const employeeDoc = await getDoc(employeeRef);
    
    if (!employeeDoc.exists()) {
      console.error(`L'employé ${employeeId} n'existe pas`);
      return null;
    }
    
    // Convertir le document en objet Employee
    const employee = convertEmployeeFromFirestore(employeeDoc);
    
    // Vérifier que l'employé appartient bien à l'entreprise de l'utilisateur connecté
    if (employee.businessId !== businessId) {
      console.error(`L'employé ${employeeId} n'appartient pas à cette entreprise`);
      return null;
    }
    
    return employee;
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'employé ${employeeId}:`, error);
    return null;
  }
};

/**
 * Récupère un employé par son adresse email
 */
export const getEmployeeByEmail = async (email: string): Promise<Employee | null> => {
  try {
    if (!email) {
      console.error('Aucune adresse email fournie pour la recherche');
      return null;
    }
    
    const businessId = await getCurrentBusinessId();
    console.log(`Recherche de l'employé avec l'email ${email} et businessId ${businessId}`);
    
    const employeesCollection = collection(db, EMPLOYEES_COLLECTION);
    const employeesQuery = query(
      employeesCollection, 
      where('email', '==', email),
      where('businessId', '==', businessId)
    );
    
    const employeesSnapshot = await getDocs(employeesQuery);
    
    if (employeesSnapshot.empty) {
      console.log(`Aucun employé trouvé avec l'email ${email}`);
      return null;
    }
    
    // Il ne devrait y avoir qu'un seul employé avec cet email
    const employeeDoc = employeesSnapshot.docs[0];
    console.log(`Employé trouvé avec l'email ${email}: ${employeeDoc.id}`);
    
    return convertEmployeeFromFirestore(employeeDoc);
  } catch (error) {
    console.error(`Erreur lors de la recherche de l'employé par email ${email}:`, error);
    return null;
  }
};

/**
 * Ajoute un nouvel employé à Firestore
 * @param employee Les données de l'employé à ajouter
 * @returns L'employé ajouté avec son ID
 */
export const addEmployee = async (employee: Partial<Employee>): Promise<Employee> => {
  try {
    // Récupérer l'utilisateur actuel
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error("Aucun utilisateur connecté");
    }
    
    // Utiliser le businessId de l'utilisateur connecté (obligatoire)
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      throw new Error("Impossible de récupérer l'identifiant de l'entreprise");
    }
    
    // Forcer l'utilisation du businessId de l'utilisateur connecté
    employee.businessId = businessId;
    
    // Ajouter le businessId aux permissions si elles existent
    // Ne pas utiliser les permissions par défaut si des permissions spécifiques ont été sélectionnées
    if (employee.permissions && employee.permissions.length > 0) {
      employee.permissions = employee.permissions.map(perm => ({
        ...perm,
        businessId
      }));
    } else {
      // Utiliser les permissions par défaut uniquement si aucune permission n'a été spécifiée
      employee.permissions = getDefaultPermissionsForRoleWithBusinessId(employee.role || 'cashier', businessId).map(perm => ({
        ...perm,
        businessId
      }));
    }
    
    console.log("Données de l'employé avant ajout:", employee);
    
    // Préparer les données pour Firestore
    const employeeData: any = {
      ...employee,
      createdAt: Timestamp.now(),
      active: employee.active !== undefined ? employee.active : true,
      // Stocker uniquement les IDs des permissions
      permissions: employee.permissions ? employee.permissions.map(p => p.id) : []
    };
    
    // Supprimer l'ID s'il existe (sera généré par Firestore)
    delete employeeData.id;
    
    // Ajouter l'employé à Firestore
    const docRef = await addDoc(collection(db, EMPLOYEES_COLLECTION), employeeData);
    
    // Si c'est un admin, créer un compte Firebase Auth
    if (employee.role === 'admin' && employee.email && employee.pin) {
      try {
        // Créer un compte Firebase Auth avec l'email et le PIN comme mot de passe
        await createUserWithEmailAndPassword(auth, employee.email, employee.pin);
        console.log(`Compte Firebase Auth créé pour ${employee.email}`);
      } catch (authError) {
        console.error("Erreur lors de la création du compte Firebase Auth:", authError);
        // Ne pas bloquer la création de l'employé si la création du compte Auth échoue
      }
    }
    
    // Récupérer l'employé complet avec son ID
    const employeeDoc = await getDoc(docRef);
    return convertEmployeeFromFirestore(employeeDoc);
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'employé:", error);
    throw error;
  }
};

/**
 * Met à jour un employé existant
 */
export const updateEmployee = async (employeeId: string, employeeData: Partial<Employee>): Promise<boolean> => {
  try {
    const employeeRef = doc(db, EMPLOYEES_COLLECTION, employeeId);
    
    // Vérifier si l'avatar a été modifié
    console.log('Données de mise à jour de l\'employé:', employeeData);
    console.log('Avatar URL reçue:', employeeData.avatarUrl ? 
      `présent (longueur: ${employeeData.avatarUrl.length})` : 'vide');
    
    // Préparer les données pour Firestore
    const updateData: any = { ...prepareEmployeeForFirestore(employeeData) };
    
    // S'assurer que l'avatar est TOUJOURS inclus dans les données de mise à jour
    // même si c'est une chaîne vide (pour supprimer l'avatar)
    updateData.avatarUrl = employeeData.avatarUrl;
    console.log('Avatar URL incluse dans la mise à jour:', updateData.avatarUrl ? 
      `présent (longueur: ${updateData.avatarUrl.length})` : 'vide');
    
    // Effectuer la mise à jour dans Firestore
    await updateDoc(employeeRef, updateData);
    
    // Vérifier que la mise à jour a bien été effectuée
    const updatedDoc = await getDoc(employeeRef);
    const updatedData = updatedDoc.data();
    console.log('Données après mise à jour:', updatedData);
    console.log('Avatar URL après mise à jour:', updatedData?.avatarUrl ? 
      `présent (longueur: ${updatedData.avatarUrl.length})` : 'vide');
    
    return true;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de l'employé ${employeeId}:`, error);
    return false;
  }
};

/**
 * Supprime un employé
 */
export const deleteEmployee = async (employeeId: string): Promise<boolean> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      console.error('Aucun utilisateur connecté');
      return false;
    }
    
    // Vérifier que l'employé appartient bien à l'entreprise de l'utilisateur connecté
    if (!employeeId) {
      console.error(`ID d'employé non valide`);
      return false;
    }
    
    const employeeRef = doc(db, EMPLOYEES_COLLECTION, employeeId);
    const employeeSnapshot = await getDoc(employeeRef);
    
    if (!employeeSnapshot.exists()) {
      console.error(`L'employé ${employeeId} n'existe pas`);
      return false;
    }
    
    const employee = convertEmployeeFromFirestore(employeeSnapshot);
    
    // Vérifier si c'est l'administrateur principal (isMainAdmin = true)
    if (employee.isMainAdmin) {
      console.error(`Impossible de supprimer l'administrateur principal`);
      return false;
    }
    
    // Vérifier si cet employé est lié à un compte Firebase (administrateur système)
    if (employee.firebaseUid) {
      console.error(`Impossible de supprimer un employé lié à un compte administrateur système`);
      return false;
    }
    
    if (employee.businessId !== await getCurrentBusinessId()) {
      console.error(`L'employé ${employeeId} n'appartient pas à cette entreprise`);
      return false;
    }
    
    await deleteDoc(employeeRef);
    return true;
  } catch (error) {
    console.error(`Erreur lors de la suppression de l'employé ${employeeId}:`, error);
    return false;
  }
};

/**
 * Convertit un objet Shift pour Firestore (dates -> timestamps)
 */
const prepareShiftForFirestore = (shift: Partial<Shift>): Partial<ShiftFirestoreDocument> => {
  console.log("Shift pour Firestore après conversion:", shift);
  
  // Récupérer le businessId de localStorage si nécessaire
  let businessId = shift.businessId;
  if (!businessId) {
    businessId = localStorage.getItem("businessId") || "";
  } else if (typeof businessId === "object") {
    // Si c'est une Promise, on utilise une valeur de secours du localStorage
    businessId = localStorage.getItem("businessId") || "";
  }
  
  // Créer un nouvel objet pour éviter les problèmes de typage
  const shiftData: Partial<ShiftFirestoreDocument> = {
    employeeId: shift.employeeId,
    businessId: businessId as string, // Forcer le type string
    status: shift.status,
    notes: shift.notes,
    overrideHourlyRate: shift.overrideHourlyRate,
    totalHours: shift.totalHours,
    totalPay: shift.totalPay,
    // Ajouter les dates qui manquaient
    start: shift.start,
    end: shift.end,
    actualStart: shift.actualStart,
    actualEnd: shift.actualEnd,
    breaks: shift.breaks
  };
  
  // Convertir les dates en timestamps
  if (shift.start && shift.start instanceof Date) {
    shiftData.start = Timestamp.fromDate(shift.start);
  }
  if (shift.end && shift.end instanceof Date) {
    shiftData.end = Timestamp.fromDate(shift.end);
  }
  if (shift.actualStart && shift.actualStart instanceof Date) {
    shiftData.actualStart = Timestamp.fromDate(shift.actualStart);
  }
  if (shift.actualEnd && shift.actualEnd instanceof Date) {
    shiftData.actualEnd = Timestamp.fromDate(shift.actualEnd);
  }
  
  // Convertir les dates des pauses si elles existent
  if (shiftData.breaks && Array.isArray(shiftData.breaks)) {
    const firestoreBreaks = shiftData.breaks.map(breakItem => {
      if (breakItem.start instanceof Date) {
        return {
          ...breakItem,
          start: Timestamp.fromDate(breakItem.start),
          end: breakItem.end instanceof Date ? Timestamp.fromDate(breakItem.end) : null
        };
      }
      return breakItem;
    });
    shiftData.breaks = firestoreBreaks;
  }
  
  console.log('Shift pour Firestore après conversion:', {
    original: {
      start: shift.start,
      end: shift.end
    },
    converti: {
      start: shiftData.start,
      end: shiftData.end
    }
  });
  
  return shiftData;
};

/**
 * Convertit un document Firestore en objet Shift (timestamps -> dates)
 */
const convertShiftFromFirestore = (doc: DocumentSnapshot | QueryDocumentSnapshot): Shift => {
  const data = doc.data();
  if (!data) {
    throw new Error(`Document ${doc.id} n'existe pas ou n'a pas de données`);
  }
  
  // Récupérer le businessId
  const businessId = data.businessId || '';
  
  // Convertir les pauses
  const breaks: Break[] = [];
  if (data.breaks && Array.isArray(data.breaks)) {
    for (const breakItem of data.breaks) {
      breaks.push({
        id: breakItem.id,
        type: breakItem.type,
        paid: breakItem.paid,
        duration: breakItem.duration,
        start: breakItem.start.toDate(),
        end: breakItem.end ? breakItem.end.toDate() : null,
        businessId: breakItem.businessId || businessId // Utiliser le businessId du shift si non défini
      });
    }
  }
  
  return {
    id: doc.id,
    employeeId: data.employeeId,
    start: data.start.toDate(),
    end: data.end ? data.end.toDate() : null,
    breaks: breaks,
    notes: data.notes || '',
    businessId: businessId,
    status: data.status || 'scheduled'
  };
};

/**
 * Ajoute un nouveau shift
 */
export const addShift = async (shift: Partial<Shift>): Promise<Shift | null> => {
  try {
    // S'assurer que le businessId est une chaîne et non une Promise
    let businessIdStr = "";
    
    // Vérifier si le businessId est présent, sinon le récupérer du localStorage
    if (!shift.businessId) {
      // Récupérer directement du localStorage plutôt que d'utiliser la fonction asynchrone
      businessIdStr = localStorage.getItem("businessId") || "";
      if (!businessIdStr) {
        console.error('Impossible de récupérer le businessId pour le shift');
        return null;
      }
      shift.businessId = businessIdStr;
    } else if (typeof shift.businessId === 'object' && shift.businessId !== null) {
      // Si c'est un objet (potentiellement une Promise), essayer de l'attendre
      try {
        // @ts-ignore - Ignorer l'erreur TypeScript car nous faisons une vérification dynamique
        if (shift.businessId.then && typeof shift.businessId.then === 'function') {
          // C'est une Promise-like
          businessIdStr = await shift.businessId;
          shift.businessId = businessIdStr;
        }
      } catch(err) {
        console.error("Erreur lors de la résolution de la Promise businessId:", err);
        // Tentative de récupération du localStorage en cas d'échec
        businessIdStr = localStorage.getItem("businessId") || "";
        if (!businessIdStr) {
          console.error('Impossible de récupérer le businessId de secours');
          return null;
        }
        shift.businessId = businessIdStr;
      }
    }
    
    console.log('Ajout d\'un shift avec businessId:', shift.businessId);
    
    // Préparer les données pour Firestore
    const shiftData = prepareShiftForFirestore(shift);
    
    // Ajouter le shift à Firestore
    const docRef = await addDoc(collection(db, SHIFTS_COLLECTION), shiftData);
    return { id: docRef.id, ...shift } as Shift;
  } catch (error) {
    console.error('Erreur lors de l\'ajout du shift:', error);
    return null;
  }
};

/**
 * Met à jour un shift existant
 */
export const updateShift = async (shiftId: string, shiftData: Partial<Shift>): Promise<boolean> => {
  try {
    const shiftRef = doc(db, SHIFTS_COLLECTION, shiftId);
    
    // Préparer les données pour Firestore
    const updateData = prepareShiftForFirestore(shiftData);
    
    await updateDoc(shiftRef, updateData);
    return true;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du shift ${shiftId}:`, error);
    return false;
  }
};

/**
 * Récupère tous les shifts depuis Firestore
 */
export const getShifts = async (): Promise<Shift[]> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      console.error('Aucun utilisateur connecté');
      return [];
    }
    
    const businessId = await getCurrentBusinessId();
    console.log('Récupération des shifts pour le businessId:', businessId);
    
    const shiftsCollection = collection(db, SHIFTS_COLLECTION);
    const shiftsQuery = query(shiftsCollection, where('businessId', '==', businessId));
    const shiftsSnapshot = await getDocs(shiftsQuery);
    
    console.log(`Nombre de shifts trouvés: ${shiftsSnapshot.docs.length}`);
    
    // Vérifier que chaque shift a bien le bon businessId
    const shifts = shiftsSnapshot.docs
      .map(convertShiftFromFirestore)
      .filter(shift => {
        const hasCorrectBusinessId = shift.businessId === businessId;
        if (!hasCorrectBusinessId) {
          console.warn(`Shift ${shift.id} avec businessId incorrect: ${shift.businessId} au lieu de ${businessId}`);
        }
        return hasCorrectBusinessId;
      });
    
    console.log(`Nombre de shifts après filtrage: ${shifts.length}`);
    return shifts;
  } catch (error) {
    console.error('Erreur lors de la récupération des shifts:', error);
    return [];
  }
};

/**
 * Récupère les statistiques des employés
 */
export const getEmployeeStats = async (): Promise<Record<string, any>> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      console.error('Aucun utilisateur connecté');
      return {};
    }
    
    // Récupérer tous les employés de l'entreprise
    const employees = await getEmployees();
    
    // Récupérer tous les shifts de l'entreprise
    const shifts = await getShifts();
    
    // Calculer les statistiques pour chaque employé
    const stats: Record<string, any> = {};
    
    employees.forEach(employee => {
      const employeeShifts = shifts.filter(shift => shift.employeeId === employee.id);
      
      // Calculer les heures travaillées
      let totalHoursWorked = 0;
      let totalShifts = employeeShifts.length;
      let completedShifts = 0;
      let lateArrivals = 0;
      
      employeeShifts.forEach(shift => {
        if (shift.status === 'completed' && shift.actualStart && shift.actualEnd) {
          const shiftDuration = (shift.actualEnd.getTime() - shift.actualStart.getTime()) / (1000 * 60 * 60);
          totalHoursWorked += shiftDuration;
          completedShifts++;
          
          // Vérifier si l'employé est arrivé en retard
          if (shift.actualStart.getTime() > shift.start.getTime()) {
            lateArrivals++;
          }
        }
      });
      
      stats[employee.id] = {
        totalHoursWorked,
        totalShifts,
        completedShifts,
        lateArrivals,
        completionRate: totalShifts > 0 ? (completedShifts / totalShifts) * 100 : 0,
        punctualityRate: completedShifts > 0 ? ((completedShifts - lateArrivals) / completedShifts) * 100 : 0
      };
    });
    
    return stats;
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques des employés:', error);
    return {};
  }
};

/**
 * Récupère toutes les permissions disponibles
 */
export const getAvailablePermissions = async (): Promise<Permission[]> => {
  try {
    const permissionsCollection = collection(db, PERMISSIONS_COLLECTION);
    const permissionsSnapshot = await getDocs(permissionsCollection);
    
    if (permissionsSnapshot.empty) {
      // Si aucune permission n'existe, créer des permissions par défaut
      return createDefaultPermissions();
    }
    
    return permissionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Permission[];
  } catch (error) {
    console.error('Erreur lors de la récupération des permissions:', error);
    return [];
  }
};

/**
 * Crée des permissions par défaut si aucune n'existe
 */
export const createDefaultPermissions = async (): Promise<Permission[]> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      console.error('Aucun utilisateur connecté');
      return [];
    }
    
    const businessId = await getCurrentBusinessId();
    
    const permissionsCollection = collection(db, PERMISSIONS_COLLECTION);
    const permissionsQuery = query(permissionsCollection, where('businessId', '==', businessId));
    const permissionsSnapshot = await getDocs(permissionsQuery);
    
    // Si des permissions existent déjà, les retourner
    if (!permissionsSnapshot.empty) {
      return permissionsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          description: data.description,
          category: data.category,
          level: data.level,
          businessId: data.businessId
        };
      });
    }
    
    // Sinon, créer des permissions par défaut
    const defaultPermissions: Omit<Permission, 'id'>[] = [
      {
        name: 'Gestion des stocks',
        description: 'Permet de gérer les stocks et les produits',
        category: 'inventory',
        level: 'write',
        businessId
      },
      {
        name: 'Consultation des stocks',
        description: 'Permet de consulter les stocks et les produits',
        category: 'inventory',
        level: 'write',
        businessId
      },
      {
        name: 'Consultation des ventes',
        description: 'Permet de consulter les ventes et les transactions',
        category: 'sales',
        level: 'read',
        businessId
      },
      {
        name: 'Gestion des ventes',
        description: 'Permet de gérer les ventes et les transactions',
        category: 'sales',
        level: 'write',
        businessId
      },
      {
        name: 'Administration des employés',
        description: 'Permet de gérer tous les aspects des employés',
        category: 'employees',
        level: 'admin',
        businessId
      },
      {
        name: 'Gestion des employés',
        description: 'Permet de gérer les employés',
        category: 'employees',
        level: 'write',
        businessId
      },
      {
        name: 'Consultation des rapports',
        description: 'Permet de consulter les rapports',
        category: 'reports',
        level: 'read',
        businessId
      },
      {
        name: 'Administration des paramètres',
        description: 'Permet de gérer tous les paramètres du système',
        category: 'settings',
        level: 'admin',
        businessId
      }
    ];
    
    // Ajouter les permissions à Firestore
    const addedPermissions: Permission[] = [];
    for (const permission of defaultPermissions) {
      const docRef = await addDoc(collection(db, PERMISSIONS_COLLECTION), permission);
      addedPermissions.push({
        ...permission,
        id: docRef.id
      });
    }
    
    return addedPermissions;
  } catch (error) {
    console.error('Erreur lors de la création des permissions par défaut:', error);
    return [];
  }
};

/**
 * Définit les permissions par défaut pour les différents rôles
 */
const getDefaultPermissionsForRoleSync = (role: string, businessId: string): Permission[] => {
  switch (role) {
    case 'admin':
      return [
        {
          id: 'perm_inventory_write',
          name: 'Gestion des stocks',
          description: 'Permet de gérer les stocks et les produits',
          category: 'inventory',
          level: 'write',
          businessId
        },
        {
          id: 'perm_inventory_read',
          name: 'Consultation des stocks',
          description: 'Permet de consulter les stocks et les produits',
          category: 'inventory',
          level: 'write',
          businessId
        },
        {
          id: 'perm_sales_read',
          name: 'Consultation des ventes',
          description: 'Permet de consulter les ventes et les transactions',
          category: 'sales',
          level: 'read',
          businessId
        },
        {
          id: 'perm_sales_write',
          name: 'Gestion des ventes',
          description: 'Permet de gérer les ventes et les transactions',
          category: 'sales',
          level: 'write',
          businessId
        },
        {
          id: 'perm_employees_admin',
          name: 'Administration des employés',
          description: 'Permet de gérer tous les aspects des employés',
          category: 'employees',
          level: 'admin',
          businessId
        },
        {
          id: 'perm_employees_write',
          name: 'Gestion des employés',
          description: 'Permet de gérer les employés',
          category: 'employees',
          level: 'write',
          businessId
        },
        {
          id: 'perm_reports_read',
          name: 'Consultation des rapports',
          description: 'Permet de consulter les rapports',
          category: 'reports',
          level: 'read',
          businessId
        },
        {
          id: 'perm_settings_admin',
          name: 'Administration des paramètres',
          description: 'Permet de gérer tous les paramètres du système',
          category: 'settings',
          level: 'admin',
          businessId
        }
      ];
    
    case 'manager':
      return [
        {
          id: 'perm_inventory_write',
          name: 'Gestion des stocks',
          description: 'Permet de gérer les stocks et les produits',
          category: 'inventory',
          level: 'write',
          businessId
        },
        {
          id: 'perm_sales_write',
          name: 'Gestion des ventes',
          description: 'Permet de gérer les ventes et les transactions',
          category: 'sales',
          level: 'write',
          businessId
        },
        {
          id: 'perm_employees_write',
          name: 'Gestion des employés',
          description: 'Permet de gérer les employés',
          category: 'employees',
          level: 'write',
          businessId
        },
        {
          id: 'perm_reports_read',
          name: 'Consultation des rapports',
          description: 'Permet de consulter les rapports',
          category: 'reports',
          level: 'read',
          businessId
        }
      ];
    
    case 'cashier':
    default:
      return [
        {
          id: 'perm_sales_write',
          name: 'Gestion des ventes',
          description: 'Permet de gérer les ventes et les transactions',
          category: 'sales',
          level: 'write',
          businessId
        },
        {
          id: 'perm_inventory_read',
          name: 'Consultation des stocks',
          description: 'Permet de consulter les stocks et les produits',
          category: 'inventory',
          level: 'read',
          businessId
        }
      ];
  }
};

/**
 * Ajoute une pause à un shift
 */
export const addBreakToShift = async (shiftId: string, breakData: Partial<Break>): Promise<Shift> => {
  try {
    // Récupérer le shift
    const shiftRef = doc(db, SHIFTS_COLLECTION, shiftId);
    const shiftDoc = await getDoc(shiftRef);
    
    if (!shiftDoc.exists()) {
      throw new Error(`Le shift ${shiftId} n'existe pas`);
    }
    
    // Récupérer le businessId actuel si non fourni
    if (!breakData.businessId) {
      const businessId = await getCurrentBusinessId();
      if (!businessId) {
        throw new Error("Impossible de récupérer l'identifiant de l'entreprise");
      }
      breakData.businessId = businessId;
    }
    
    // Créer un ID unique pour la pause
    const breakId = `break_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Préparer les données de la pause
    const newBreak: Break = {
      id: breakId,
      type: breakData.type || 'rest',
      paid: breakData.paid !== undefined ? breakData.paid : false,
      duration: breakData.duration,
      start: breakData.start || new Date(),
      end: breakData.end || null,
      businessId: breakData.businessId
    };
    
    // Récupérer les pauses existantes
    const shiftData = shiftDoc.data();
    const breaks = shiftData?.breaks || [];
    
    // Ajouter la nouvelle pause
    await updateDoc(shiftRef, {
      breaks: [...breaks, newBreak]
    });
    
    // Récupérer le shift mis à jour
    const updatedShiftDoc = await getDoc(shiftRef);
    return convertShiftFromFirestore(updatedShiftDoc);
  } catch (error) {
    console.error("Erreur lors de l'ajout de la pause:", error);
    throw error;
  }
};

/**
 * Supprime les administrateurs principaux en double et s'assure qu'un seul administrateur principal existe
 */
export const removeExtraMainAdmins = async (): Promise<void> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      console.error('Aucun utilisateur connecté');
      return;
    }
    
    const businessId = await getCurrentBusinessId();
    console.log('Recherche des administrateurs principaux en double pour businessId:', businessId);
    
    // Récupérer tous les employés
    const employeesCollection = collection(db, EMPLOYEES_COLLECTION);
    const employeesQuery = query(
      employeesCollection,
      where('businessId', '==', businessId),
      where('isMainAdmin', '==', true)
    );
    
    const mainAdminsSnapshot = await getDocs(employeesQuery);
    const mainAdmins = mainAdminsSnapshot.docs.map(convertEmployeeFromFirestore);
    
    if (mainAdmins.length === 0) {
      console.log('Aucun administrateur principal trouvé, création d\'un administrateur par défaut');
      await createDefaultAdmin();
      return;
    }
    
    if (mainAdmins.length === 1) {
      console.log('Un seul administrateur principal trouvé, pas besoin de nettoyage');
      return;
    }
    
    console.log(`${mainAdmins.length} administrateurs principaux trouvés, conservation du premier seulement`);
    
    // Supprimer complètement les autres administrateurs principaux (pas seulement les rétrograder)
    for (let i = 1; i < mainAdmins.length; i++) {
      const admin = mainAdmins[i];
      console.log(`Suppression de l'administrateur principal en double ${admin.id}`);
      
      // Supprimer l'employé complètement
      await deleteDoc(doc(db, EMPLOYEES_COLLECTION, admin.id));
    }
    
    console.log('Suppression des administrateurs principaux en double terminée');
  } catch (error) {
    console.error('Erreur lors de la suppression des administrateurs principaux en double:', error);
  }
};

/**
 * Crée un administrateur principal par défaut si aucun n'existe
 */
export const createDefaultAdmin = async (): Promise<Employee | null> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      console.error('Aucun utilisateur connecté');
      return null;
    }
    
    const businessId = await getCurrentBusinessId();
    
    // Vérifier si un employé existe déjà
    const employeesCollection = collection(db, EMPLOYEES_COLLECTION);
    const adminQuery = query(
      employeesCollection, 
      where('businessId', '==', businessId)
    );
    
    const adminSnapshot = await getDocs(adminQuery);
    
    if (!adminSnapshot.empty) {
      console.log('Des employés existent déjà, vérification de l\'administrateur principal');
      
      // Vérifier si un administrateur principal existe déjà
      const employees = adminSnapshot.docs.map(convertEmployeeFromFirestore);
      const mainAdmin = employees.find(emp => emp.isMainAdmin === true);
      
      if (mainAdmin) {
        console.log('Un administrateur principal existe déjà:', mainAdmin.id);
        return null;
      }
      
      // Si des employés existent mais aucun n'est marqué comme administrateur principal,
      // marquer le premier administrateur comme principal
      const adminEmployee = employees.find(emp => emp.role === 'admin');
      
      if (adminEmployee) {
        console.log('Mise à jour d\'un administrateur existant comme principal:', adminEmployee.id);
        const updatedAdmin = { 
          ...adminEmployee, 
          isMainAdmin: true,
          role: 'admin',
          permissions: getDefaultPermissionsForRoleWithBusinessId('admin', businessId)
        };
        
        await updateEmployee(adminEmployee.id, updatedAdmin);
        return updatedAdmin;
      }
    }
    
    // Créer un administrateur par défaut
    const defaultAdmin: Omit<Employee, 'id'> = {
      firstName: 'Admin',
      lastName: 'Principal',
      email: `admin.${businessId.substring(0, 5)}@payesmart.com`,
      role: 'admin',
      pin: '1234',
      active: true,
      businessId: businessId,
      isMainAdmin: true,
      permissions: getDefaultPermissionsForRoleWithBusinessId('admin', businessId),
      createdAt: new Date()
    };
    
    console.log('Création d\'un administrateur par défaut:', defaultAdmin);
    
    // Ajouter l'administrateur à Firestore
    return await addEmployee(defaultAdmin);
  } catch (error) {
    console.error('Erreur lors de la création de l\'administrateur par défaut:', error);
    return null;
  }
};

/**
 * Crée un administrateur par défaut pour un business qui n'a pas encore d'employés
 * Cette fonction est appelée depuis l'écran de connexion
 */
export const createDefaultAdminForLogin = async (businessId: string): Promise<Employee | null> => {
  try {
    if (!businessId) {
      console.error('Aucun businessId fourni pour créer l\'administrateur par défaut');
      return null;
    }
    
    console.log('Tentative de création d\'un administrateur par défaut pour le business:', businessId);
    
    // Vérifier si un employé avec cet email existe déjà
    const employeesCollection = collection(db, EMPLOYEES_COLLECTION);
    const existingEmployeesQuery = query(
      employeesCollection,
      where('businessId', '==', businessId)
    );
    
    const existingEmployeesSnapshot = await getDocs(existingEmployeesQuery);
    
    if (!existingEmployeesSnapshot.empty) {
      console.log('Des employés existent déjà pour ce business, vérification de l\'administrateur principal');
      
      // Vérifier si un administrateur principal existe déjà
      const employees = existingEmployeesSnapshot.docs.map(convertEmployeeFromFirestore);
      const mainAdmin = employees.find(emp => emp.isMainAdmin === true);
      
      if (mainAdmin) {
        console.log('Un administrateur principal existe déjà:', mainAdmin.id);
        return mainAdmin;
      }
      
      // Si des employés existent mais aucun n'est marqué comme administrateur principal,
      // marquer le premier administrateur comme principal
      const adminEmployee = employees.find(emp => emp.role === 'admin');
      
      if (adminEmployee) {
        console.log('Mise à jour d\'un administrateur existant comme principal:', adminEmployee.id);
        const updatedAdmin = { 
          ...adminEmployee, 
          isMainAdmin: true,
          role: 'admin',
          permissions: getDefaultPermissionsForRoleWithBusinessId('admin', businessId)
        };
        
        await updateEmployee(adminEmployee.id, updatedAdmin);
        return updatedAdmin;
      }
    }
    
    // Vérifier si le business existe
    const businessRef = doc(db, 'businesses', businessId);
    const businessSnap = await getDoc(businessRef);
    
    if (!businessSnap.exists()) {
      console.error('Le business n\'existe pas:', businessId);
      return null;
    }
    
    const businessData = businessSnap.data();
    
    // Créer un administrateur par défaut
    const defaultAdmin: Omit<Employee, 'id'> = {
      firstName: businessData.ownerFirstName || 'Admin',
      lastName: businessData.ownerLastName || 'Principal',
      email: businessData.email || `admin@${businessId.substring(0, 5)}.com`,
      role: 'admin',
      pin: '1234', // PIN par défaut
      active: true,
      businessId: businessId,
      isMainAdmin: true,
      permissions: await getDefaultPermissionsForRoleWithBusinessId('admin', businessId),
      createdAt: new Date(),
      firebaseUid: businessData.firebaseUid
    };
    
    console.log('Création d\'un administrateur par défaut pour le login:', defaultAdmin);
    
    // Ajouter l'administrateur à Firestore
    return await addEmployee(defaultAdmin);
  } catch (error) {
    console.error('Erreur lors de la création de l\'administrateur par défaut pour le login:', error);
    return null;
  }
};

/**
 * Synchronise le compte Firebase avec l'employé administrateur principal
 * Cette fonction est utilisée pour s'assurer que l'utilisateur Firebase est bien dans la liste des employés
 */
export const syncFirebaseUserWithEmployees = async (): Promise<Employee | null> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      console.log('Aucun utilisateur Firebase connecté');
      return null;
    }
    
    const businessId = await getCurrentBusinessId();
    
    // Vérifier si un employé avec cet email existe déjà
    const employeesCollection = collection(db, EMPLOYEES_COLLECTION);
    const employeeQuery = query(
      employeesCollection, 
      where('businessId', '==', businessId),
      where('email', '==', currentUser.email)
    );
    
    const employeeSnapshot = await getDocs(employeeQuery);
    
    // Si l'employé existe, s'assurer qu'il est marqué comme administrateur principal
    if (!employeeSnapshot.empty) {
      const employeeDoc = employeeSnapshot.docs[0];
      const employee = convertEmployeeFromFirestore(employeeDoc);
      
      console.log(`Employé trouvé: ${employee.firstName} ${employee.lastName}, Admin Principal: ${employee.isMainAdmin}`);
      
      // Si l'employé n'est pas déjà administrateur principal, le mettre à jour
      if (!employee.isMainAdmin) {
        console.log(`Mise à jour de ${employee.firstName} ${employee.lastName} comme administrateur principal`);
        const updatedAdmin = { ...employee, isMainAdmin: true };
        await updateEmployee(employee.id, updatedAdmin);
        return updatedAdmin;
      }
      
      return employee;
    }
    
    // Si aucun employé n'existe avec cet email, en créer un nouveau
    console.log(`Création d'un nouvel employé pour ${currentUser.email}`);
    const newEmployee: Omit<Employee, 'id'> = {
      firstName: currentUser.displayName || 'Admin',
      lastName: '',
      email: currentUser.email || '',
      role: 'admin',
      pin: '1234', // PIN par défaut
      active: true,
      businessId: businessId,
      isMainAdmin: true,
      permissions: getDefaultPermissionsForRoleWithBusinessId('admin', businessId),
      createdAt: new Date(),
      firebaseUid: currentUser.uid
    };
    
    console.log('Création d\'un nouvel employé pour le compte Firebase:', newEmployee);
    
    // Ajouter l'employé à Firestore
    return await addEmployee(newEmployee);
  } catch (error) {
    console.error('Erreur lors de la synchronisation du compte Firebase:', error);
    return null;
  }
};
