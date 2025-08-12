import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, orderBy, limit, Timestamp, serverTimestamp } from 'firebase/firestore';
import { getCurrentBusinessId } from './businessService';

// Collection pour les journaux d'audit
const AUDIT_LOGS_COLLECTION = 'audit_logs';

// Types d'actions pour les journaux d'audit
export enum AuditActionType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  ACTIVATE = 'activate'
}

// Interface pour un journal d'audit
export interface AuditLog {
  id?: string;
  userId: string;
  userName: string;
  actionType: AuditActionType;
  resourceType: string;
  resourceId: string;
  resourceName?: string;
  timestamp: Date | Timestamp;
  details?: any;
  businessId: string;
}

/**
 * Crée un journal d'audit pour une action
 * @param log Données du journal d'audit
 * @returns L'ID du journal d'audit créé
 */
export const createAuditLog = async (log: Omit<AuditLog, 'id' | 'timestamp' | 'businessId'>): Promise<string> => {
  try {
    const businessId = await getCurrentBusinessId();
    
    const logData = {
      ...log,
      timestamp: serverTimestamp(),
      businessId
    };
    
    const docRef = await addDoc(collection(db, AUDIT_LOGS_COLLECTION), logData);
    console.log(`Journal d'audit créé avec l'ID: ${docRef.id}`);
    
    return docRef.id;
  } catch (error) {
    console.error('Erreur lors de la création du journal d\'audit:', error);
    throw error;
  }
};

/**
 * Récupère les journaux d'audit pour un type de ressource spécifique
 * @param resourceType Type de ressource (ex: 'trial_period')
 * @param resourceId ID de la ressource (optionnel)
 * @param limit Nombre maximum de journaux à récupérer
 * @returns Liste des journaux d'audit
 */
export const getAuditLogs = async (
  resourceType: string,
  resourceId?: string,
  maxResults: number = 100
): Promise<AuditLog[]> => {
  try {
    const businessId = await getCurrentBusinessId();
    
    // Construire la requête de base
    let auditQuery: any = query(
      collection(db, AUDIT_LOGS_COLLECTION),
      where('businessId', '==', businessId),
      where('resourceType', '==', resourceType),
      orderBy('timestamp', 'desc'),
      limit(maxResults)
    );
    
    // Ajouter le filtre par ID de ressource si spécifié
    if (resourceId) {
      auditQuery = query(
        collection(db, AUDIT_LOGS_COLLECTION),
        where('businessId', '==', businessId),
        where('resourceType', '==', resourceType),
        where('resourceId', '==', resourceId),
        orderBy('timestamp', 'desc'),
        limit(maxResults)
      );
    }
    
    const snapshot = await getDocs(auditQuery);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date()
    })) as AuditLog[];
  } catch (error) {
    console.error('Erreur lors de la récupération des journaux d\'audit:', error);
    return [];
  }
};

/**
 * Récupère les journaux d'audit pour les périodes d'essai
 * @param trialPeriodId ID de la période d'essai (optionnel)
 * @param maxResults Nombre maximum de journaux à récupérer
 * @returns Liste des journaux d'audit
 */
export const getTrialPeriodAuditLogs = async (
  trialPeriodId?: string,
  maxResults: number = 100
): Promise<AuditLog[]> => {
  return getAuditLogs('trial_period', trialPeriodId, maxResults);
};
