import { db } from '../firebase';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { VivaPaymentsConfig, VivaTerminal, VivaConfigAuditLog } from '../types/vivaPaymentsIntegration';
import { VivaTestConfig } from '../types/vivaTestConfig';
import { getCurrentUser } from './authService';
import CryptoJS from 'crypto-js';
import axios from '../axios';

// Clé de chiffrement - Version compatible navigateur
const ENCRYPTION_KEY = (typeof window !== 'undefined' && (window as any).env?.REACT_APP_ENCRYPTION_KEY) || 
  (typeof process !== 'undefined' && process.env?.REACT_APP_ENCRYPTION_KEY) || 
  'PayeSmart_Secure_Encryption_Key';

/**
 * Chiffre les données sensibles
 * @param data Données à chiffrer
 * @returns Données chiffrées
 */
const encryptData = (data: string): string => {
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
};

/**
 * Déchiffre les données sensibles
 * @param encryptedData Données chiffrées
 * @returns Données déchiffrées
 */
const decryptData = (encryptedData: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

/**
 * Obtient toutes les configurations Viva Payments pour un client spécifique
 * @param clientId ID du client
 * @returns Liste des configurations Viva Payments
 */
export const getVivaConfigsByClient = async (clientId: string): Promise<VivaPaymentsConfig[]> => {
  try {
    const q = query(collection(db, 'vivaPaymentsConfigs'), where('clientId', '==', clientId));
    const querySnapshot = await getDocs(q);
    
    const configs: VivaPaymentsConfig[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as VivaPaymentsConfig;
      // Ne pas déchiffrer les données sensibles ici pour des raisons de sécurité
      // Elles seront déchiffrées uniquement lorsque nécessaire
      configs.push({ ...data, id: doc.id });
    });
    
    return configs;
  } catch (error) {
    console.error('Erreur lors de la récupération des configurations Viva:', error);
    throw error;
  }
};

/**
 * Obtient une configuration Viva Payments spécifique avec données sensibles déchiffrées
 * @param configId ID de la configuration
 * @returns Configuration Viva Payments avec données sensibles déchiffrées
 */
export const getVivaConfigById = async (configId: string): Promise<VivaPaymentsConfig | null> => {
  try {
    const docRef = doc(db, 'vivaPaymentsConfigs', configId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as VivaPaymentsConfig;
      
      // Déchiffrer les données sensibles
      return {
        ...data,
        id: docSnap.id,
        vivaClientId: decryptData(data.vivaClientId),
        vivaClientSecret: decryptData(data.vivaClientSecret),
        vivaMerchantId: data.vivaMerchantId ? decryptData(data.vivaMerchantId) : undefined,
        accessToken: data.accessToken ? decryptData(data.accessToken) : undefined
      };
    }
    
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération de la configuration Viva:', error);
    throw error;
  }
};

/**
 * Crée une nouvelle configuration Viva Payments
 * @param config Configuration Viva Payments à créer
 * @returns ID de la configuration créée
 */
export const createVivaConfig = async (config: Omit<VivaPaymentsConfig, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>): Promise<string> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('Utilisateur non authentifié');
    }
    
    // Chiffrer les données sensibles
    const encryptedConfig = {
      ...config,
      vivaClientId: encryptData(config.vivaClientId),
      vivaClientSecret: encryptData(config.vivaClientSecret),
      vivaMerchantId: config.vivaMerchantId ? encryptData(config.vivaMerchantId) : undefined,
      accessToken: config.accessToken ? encryptData(config.accessToken) : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: currentUser.uid,
      updatedBy: currentUser.uid
    };
    
    // Ajouter la configuration à Firestore
    const docRef = await addDoc(collection(db, 'vivaPaymentsConfigs'), encryptedConfig);
    
    // Créer un log d'audit
    await createAuditLog({
      configId: docRef.id,
      adminId: currentUser.uid,
      adminName: currentUser.displayName || currentUser.email || 'Admin inconnu',
      timestamp: Date.now(),
      action: 'create',
      success: true
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de la création de la configuration Viva:', error);
    throw error;
  }
};

/**
 * Met à jour une configuration Viva Payments existante
 * @param configId ID de la configuration à mettre à jour
 * @param updates Mises à jour à appliquer
 * @returns true si la mise à jour a réussi
 */
export const updateVivaConfig = async (configId: string, updates: Partial<VivaPaymentsConfig>): Promise<boolean> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('Utilisateur non authentifié');
    }
    
    // Récupérer la configuration actuelle pour l'audit
    const oldConfig = await getVivaConfigById(configId);
    if (!oldConfig) {
      throw new Error('Configuration non trouvée');
    }
    
    // Préparer les mises à jour en chiffrant les données sensibles
    const encryptedUpdates: Record<string, any> = {
      updatedAt: Date.now(),
      updatedBy: currentUser.uid
    };
    
    // Chiffrer uniquement les champs sensibles qui sont mis à jour
    if (updates.vivaClientId) {
      encryptedUpdates.vivaClientId = encryptData(updates.vivaClientId);
    }
    
    if (updates.vivaClientSecret) {
      encryptedUpdates.vivaClientSecret = encryptData(updates.vivaClientSecret);
    }
    
    if (updates.vivaMerchantId) {
      encryptedUpdates.vivaMerchantId = encryptData(updates.vivaMerchantId);
    }
    
    if (updates.accessToken) {
      encryptedUpdates.accessToken = encryptData(updates.accessToken);
    }
    
    // Ajouter les autres champs non sensibles
    Object.keys(updates).forEach(key => {
      if (!['vivaClientId', 'vivaClientSecret', 'vivaMerchantId', 'accessToken'].includes(key)) {
        encryptedUpdates[key] = updates[key as keyof typeof updates];
      }
    });
    
    // Mettre à jour la configuration
    await updateDoc(doc(db, 'vivaPaymentsConfigs', configId), encryptedUpdates);
    
    // Créer des logs d'audit pour chaque champ modifié
    for (const [key, value] of Object.entries(updates)) {
      // Masquer les valeurs sensibles dans les logs
      let oldValue = '';
      let newValue = '';
      
      if (['vivaClientId', 'vivaClientSecret', 'vivaMerchantId', 'accessToken'].includes(key)) {
        oldValue = '********';
        newValue = '********';
      } else {
        oldValue = String(oldConfig[key as keyof VivaPaymentsConfig] || '');
        newValue = String(value || '');
      }
      
      await createAuditLog({
        configId,
        adminId: currentUser.uid,
        adminName: currentUser.displayName || currentUser.email || 'Admin inconnu',
        timestamp: Date.now(),
        action: 'update',
        field: key,
        oldValue,
        newValue,
        success: true
      });
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la configuration Viva:', error);
    throw error;
  }
};

/**
 * Supprime une configuration Viva Payments
 * @param configId ID de la configuration à supprimer
 * @returns true si la suppression a réussi
 */
export const deleteVivaConfig = async (configId: string): Promise<boolean> => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      throw new Error('Utilisateur non authentifié');
    }
    
    // Récupérer la configuration pour l'audit
    const config = await getVivaConfigById(configId);
    if (!config) {
      throw new Error('Configuration non trouvée');
    }
    
    // Supprimer la configuration
    await deleteDoc(doc(db, 'vivaPaymentsConfigs', configId));
    
    // Créer un log d'audit
    await createAuditLog({
      configId,
      adminId: currentUser.uid,
      adminName: currentUser.displayName || currentUser.email || 'Admin inconnu',
      timestamp: Date.now(),
      action: 'delete',
      success: true
    });
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression de la configuration Viva:', error);
    throw error;
  }
};

/**
 * Crée un log d'audit pour les modifications de configuration Viva Payments
 * @param logData Données du log d'audit
 * @returns ID du log créé
 */
export const createAuditLog = async (logData: Omit<VivaConfigAuditLog, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'vivaConfigAuditLogs'), {
      ...logData,
      ipAddress: window.location?.hostname || 'unknown'
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de la création du log d\'audit:', error);
    throw error;
  }
};

/**
 * Teste la connexion à l'API Viva Payments avec les identifiants fournis
 * @param config Configuration à tester (peut être une configuration complète ou partielle pour test)
 * @returns Résultat du test
 */
export const testVivaConnection = async (config: VivaPaymentsConfig | VivaTestConfig): Promise<{ success: boolean; message: string; token?: string }> => {
  try {
    const baseUrl = config.environment === 'production'
      ? 'https://accounts.vivapayments.com/connect/token'
      : 'https://demo-accounts.vivapayments.com/connect/token';
    
    const tokenParams = new URLSearchParams();
    tokenParams.append('grant_type', 'client_credentials');
    tokenParams.append('client_id', config.vivaClientId);
    tokenParams.append('client_secret', config.vivaClientSecret);
    tokenParams.append('scope', 'urn:viva:payments:ecr:api');
    
    const response = await axios.post(baseUrl, tokenParams, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      }
    });
    
    // Créer un log d'audit pour le test (seulement si config.id existe)
    const currentUser = await getCurrentUser();
    if (currentUser && 'id' in config) {
      await createAuditLog({
        configId: config.id,
        adminId: currentUser.uid,
        adminName: currentUser.displayName || currentUser.email || 'Admin inconnu',
        timestamp: Date.now(),
        action: 'test',
        success: true
      });
    }
    
    return {
      success: true,
      message: 'Connexion réussie à l\'API Viva Payments',
      token: response.data.access_token
    };
  } catch (error: any) {
    console.error('Erreur lors du test de connexion à l\'API Viva:', error);
    
    // Créer un log d'audit pour l'échec du test (seulement si config.id existe)
    const currentUser = await getCurrentUser();
    if (currentUser && 'id' in config) {
      await createAuditLog({
        configId: config.id,
        adminId: currentUser.uid,
        adminName: currentUser.displayName || currentUser.email || 'Admin inconnu',
        timestamp: Date.now(),
        action: 'test',
        success: false
      });
    }
    
    return {
      success: false,
      message: error.response?.data?.error_description || error.message || 'Erreur de connexion à l\'API Viva Payments'
    };
  }
};

/**
 * Obtient tous les terminaux associés à une configuration Viva Payments
 * @param configId ID de la configuration
 * @returns Liste des terminaux
 */
export const getTerminalsByConfig = async (configId: string): Promise<VivaTerminal[]> => {
  try {
    const q = query(collection(db, 'vivaTerminals'), where('configId', '==', configId));
    const querySnapshot = await getDocs(q);
    
    const terminals: VivaTerminal[] = [];
    querySnapshot.forEach((doc) => {
      terminals.push({ ...doc.data() as VivaTerminal, id: doc.id });
    });
    
    return terminals;
  } catch (error) {
    console.error('Erreur lors de la récupération des terminaux:', error);
    throw error;
  }
};

/**
 * Crée un nouveau terminal associé à une configuration Viva Payments
 * @param terminal Terminal à créer
 * @returns ID du terminal créé
 */
export const createTerminal = async (terminal: Omit<VivaTerminal, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'vivaTerminals'), {
      ...terminal,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de la création du terminal:', error);
    throw error;
  }
};

/**
 * Met à jour un terminal existant
 * @param terminalId ID du terminal à mettre à jour
 * @param updates Mises à jour à appliquer
 * @returns true si la mise à jour a réussi
 */
export const updateTerminal = async (terminalId: string, updates: Partial<VivaTerminal>): Promise<boolean> => {
  try {
    await updateDoc(doc(db, 'vivaTerminals', terminalId), {
      ...updates,
      updatedAt: Date.now()
    });
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la mise à jour du terminal:', error);
    throw error;
  }
};

/**
 * Supprime un terminal
 * @param terminalId ID du terminal à supprimer
 * @returns true si la suppression a réussi
 */
export const deleteTerminal = async (terminalId: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, 'vivaTerminals', terminalId));
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression du terminal:', error);
    throw error;
  }
};
