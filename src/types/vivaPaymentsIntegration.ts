// Types pour l'intégration multi-compte Viva Payments

/**
 * Interface pour les informations d'intégration Viva Payments
 * Liée à un client spécifique
 */
export interface VivaPaymentsConfig {
  id: string;
  clientId: string;            // ID du client PayeSmart auquel cette config est liée
  businessId: string;          // ID de l'entreprise associée
  vivaClientId: string;        // Client ID fourni par Viva Payments
  vivaClientSecret: string;    // Client Secret fourni par Viva Payments
  merchantId?: string;        // Merchant ID (optionnel)
  accessToken?: string;        // Token d'accès (généré ou stocké)
  tokenExpiry?: number;        // Date d'expiration du token
  callbackUrl?: string;        // URL de callback pour les notifications
  environment: 'sandbox' | 'production'; // Environnement Viva
  createdAt: number;           // Date de création
  updatedAt: number;           // Date de dernière modification
  createdBy: string;           // ID de l'administrateur qui a créé la config
  updatedBy: string;           // ID de l'administrateur qui a modifié la config
  isActive: boolean;           // État d'activation de l'intégration
}

/**
 * Interface pour les terminaux Viva Payments
 * Associés à une configuration Viva Payments
 */
export interface VivaTerminal {
  id: string;
  configId: string;            // ID de la config Viva Payments
  terminalId: string;          // ID du terminal chez Viva
  name: string;                // Nom convivial du terminal
  description?: string;        // Description optionnelle
  location?: string;           // Emplacement du terminal
  isActive: boolean;           // État d'activation du terminal
  createdAt: number;           // Date de création
  updatedAt: number;           // Date de dernière modification
}

/**
 * Interface pour les logs d'audit des modifications
 * de configuration Viva Payments
 */
export interface VivaConfigAuditLog {
  id: string;
  configId: string;            // ID de la config modifiée
  adminId: string;             // ID de l'administrateur
  adminName: string;           // Nom de l'administrateur
  timestamp: number;           // Date/heure de la modification
  action: 'create' | 'update' | 'delete' | 'test'; // Type d'action
  field?: string;              // Champ modifié (pour les updates)
  oldValue?: string;           // Ancienne valeur (masquée pour données sensibles)
  newValue?: string;           // Nouvelle valeur (masquée pour données sensibles)
  ipAddress?: string;          // Adresse IP de l'administrateur
  success: boolean;            // Succès de l'opération
}
