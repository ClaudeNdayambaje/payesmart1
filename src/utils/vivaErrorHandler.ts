/**
 * Gestionnaire d'erreurs pour l'API Viva Payments
 * Ce module fournit des fonctions et des mappages pour traduire les codes d'erreur
 * de l'API Viva Payments en messages compréhensibles pour les utilisateurs.
 */

// Mappage des codes d'erreur (Error IDs) du corps de la réponse
export const errorIdMessages: Record<string, string> = {
  // Erreurs de transaction
  '1000': 'Transaction annulée par l\'utilisateur',
  '1001': 'Le SDK de paiement est occupé en ce moment',
  '1002': 'Il y a des transactions stockées qui doivent être annulées',
  '1003': 'Le terminal a expiré',
  '1004': 'Le terminal a refusé la transaction',
  '1006': 'Transaction refusée par le serveur',
  '1007': 'Refusé par la carte',
  '1008': 'Transaction non réversible',
  '1009': 'Montant invalide pour l\'annulation',
  '1010': 'Carte invalide',
  '1011': 'Aucune transaction trouvée',
  '1012': 'La transaction n\'existe pas',
  '1013': 'Impossible d\'initialiser une vente ISV. Veuillez vérifier vos paramètres d\'entrée',
  '1014': 'Le remboursement est désactivé pour ce marchand. Rôle AllowLiquidation manquant',
  '1016': 'Transaction interrompue',
  '1017': 'Montant invalide pour la capture',
  '1018': 'Aucun paramètre trouvé pour ce marchand',
  '1019': 'Essayez une autre carte',
  '1020': 'Fonds insuffisants',
  '1021': 'Transaction non réversible',
  '1047': 'Marchand invalide',
  '1048': 'Erreur générale',
  '1049': 'Transaction invalide',
  '1050': 'Aucune action prise',
  '1051': 'Saisissez à nouveau la transaction',
  '1052': 'Erreur de format',
  '1053': 'Pas de compte de crédit',
  '1054': 'Carte perdue',
  '1055': 'Carte volée',
  '1056': 'Compte fermé',
  '1057': 'Fonds insuffisants',
  '1058': 'Pas de compte courant',
  '1059': 'Pas de compte d\'épargne',
  '1060': 'Problème de date d\'expiration',
  '1061': 'PIN incorrect ou manquant',
  '1062': 'Transaction non autorisée pour le titulaire de la carte',
  '1063': 'Transaction non autorisée sur ce terminal',
  '1064': 'Limite de montant dépassée',
  '1065': 'Carte restreinte',
  '1066': 'Nombre d\'essais PIN dépassé',
  '1067': 'Carte bloquée ou non active',
  '1068': 'Erreur de PIN',
  '1069': 'Échec cryptographique',
  '1070': 'Émetteur indisponible',
  '1071': 'Transaction incomplète en raison de la loi',
  '1072': 'Dysfonctionnement du système',
  '1074': 'Montant de transaction non correspondant. Veuillez vérifier et réessayer.',
  '1075': 'Échec de vérification de signature (correspondance ID Terminal).',
  '1076': 'Échec de vérification de signature (ProviderID).',
  '1077': 'Non-concordance des détails AADE de transaction. Veuillez vérifier et réessayer.',
  '1079': 'Reçu expiré (durée dépassée). Veuillez initier le paiement à nouveau.',
  '1080': 'Erreur inattendue pendant la transaction AADE',
  '1081': 'Transaction AADE reçue alors que l\'AADE est désactivé',
  '1082': 'Seule une transaction AADE peut être reçue lorsque l\'AADE est activé',
  '1083': 'Tous les paramètres requis pour la demande AADE ne sont pas fournis',
  '1099': 'Erreur de transaction générique',
  '1100': 'Une demande est déjà en cours',
  '1101': 'Impossible de récupérer les paramètres pour parentSessionId',
  '1102': 'Transaction expirée',
  '1110': 'Erreur interne du courtier de transaction',
  '1301': 'Erreur d\'insertion SCA',
  '1302': 'Erreur de double tap SCA',
  '1303': 'Erreur de relecture de double tap SCA',
  '2000': 'Services de localisation désactivés',
  '3000': 'Le terminal n\'est pas connecté',
  '3001': 'Erreur de connexion au terminal',
  '3002': 'Délai de connexion au terminal dépassé',
  '3099': 'Erreur de terminal générique',
  '4000': 'Erreur de connexion réseau',
  '5000': 'Capacité \'MOTO\' manquante',
  '5001': 'Capacité \'Versements\' manquante',
  '5002': 'Capacité \'Préautorisation\' manquante',
  '5003': 'Capacité \'QR\' manquante',
  '5004': 'Capacité \'Annulation\' manquante',
  '5005': 'Capacité \'Pourboire\' manquante',
  '5006': 'Capacité \'Vente\' manquante',
  '6000': 'Paramètres de demande incorrects',
  '6102': 'Rôle ISV manquant',
  '6201': 'Seule la vente régulière est autorisée en mode SaF',
  '7001': 'Montant dépassant la limite de transaction SaF',
  '7002': 'Montant total des ventes pendant SaF dépassant la limite totale SaF',
  '7003': 'Limite de durée du mode SaF dépassée',
  '7004': 'Carte Mastercard, Visa ou AMEX requise',
  '7005': 'Type de transaction non pris en charge en mode SaF'
};

// Mappage des codes d'événement (Event IDs) de l'en-tête de la réponse
export const eventIdMessages: Record<string, string> = {
  '1100': 'Session créée avec succès',
  '1101': 'Session créée avec succès',
  '1108': 'Session créée avec succès',
  '1102': 'Session(s) retournée(s) avec succès',
  '1103': 'Session(s) retournée(s) avec succès',
  '1104': 'Abandon accepté - Session a été acceptée pour le processus d\'abandon',
  '1106': 'Appareils retournés avec succès',
  '1107': 'Jeton d\'authentification retourné avec succès',
  '1200': 'Échec de validation - Problème avec les données de la requête',
  '1201': 'Session en double - Cet ID de session existe déjà',
  '1202': 'Session en double - Cet ID de session existe déjà',
  '1212': 'Session en double - Cet ID de session existe déjà',
  '1203': 'Session parent non trouvée',
  '1213': 'Session parent non trouvée',
  '1204': 'Session dans un état incorrect - Traitement non terminé',
  '1205': 'Session non trouvée',
  '1207': 'Session non trouvée',
  '1206': 'ID ECR incorrect - Seule la caisse ayant créé la session peut l\'abandonner',
  '1208': 'Session déjà abandonnée',
  '1300': 'Une erreur s\'est produite lors de l\'enregistrement des données',
  '1400': 'Le serveur est occupé - Impossible de traiter la demande actuellement'
};

// Mappage des erreurs d'authentification OAuth2
export const oauthErrorMessages: Record<string, string> = {
  'invalid_client': 'ID client ou secret client invalide. Vérifiez vos identifiants.',
  'invalid_grant': 'Le jeton d\'authentification est invalide ou expiré.',
  'invalid_scope': 'La portée (scope) demandée est invalide ou inconnue.',
  'invalid_request': 'La demande d\'authentification est mal formée.',
  'unauthorized_client': 'Ce client n\'est pas autorisé à utiliser cette méthode d\'authentification.',
  'access_denied': 'Le serveur d\'autorisation a refusé la demande.',
  'unsupported_grant_type': 'Le type de subvention demandé n\'est pas pris en charge.',
  'server_error': 'Le serveur d\'autorisation a rencontré une erreur inattendue.'
};

/**
 * Obtient un message d'erreur convivial basé sur le code d'erreur
 * @param errorId Code d'erreur du corps de la réponse
 * @returns Message d'erreur convivial
 */
export function getErrorMessage(errorId: string | number | undefined): string {
  if (!errorId) return 'Erreur inconnue';
  const id = errorId.toString();
  return errorIdMessages[id] || `Erreur inconnue (Code: ${id})`;
}

/**
 * Obtient un message d'événement basé sur l'ID d'événement
 * @param eventId ID d'événement de l'en-tête de la réponse
 * @returns Message d'événement convivial
 */
export function getEventMessage(eventId: string | number | undefined): string {
  if (!eventId) return 'Événement inconnu';
  const id = eventId.toString();
  return eventIdMessages[id] || `Événement inconnu (Code: ${id})`;
}

/**
 * Obtient un message d'erreur OAuth basé sur le code d'erreur
 * @param errorCode Code d'erreur OAuth
 * @returns Message d'erreur OAuth convivial
 */
export function getOAuthErrorMessage(errorCode: string): string {
  return oauthErrorMessages[errorCode] || `Erreur d'authentification inconnue (Code: ${errorCode})`;
}

/**
 * Analyse la réponse d'erreur et extrait les informations pertinentes
 * @param error Objet d'erreur (généralement de Axios)
 * @returns Objet contenant les détails d'erreur formatés
 */
export function parseVivaError(error: any): {
  message: string;
  errorId?: string;
  eventId?: string;
  status?: number;
  details?: any;
} {
  // Valeurs par défaut
  let message = 'Erreur lors de la communication avec Viva Payments';
  let errorId: string | undefined;
  let eventId: string | undefined;
  let status: number | undefined;
  let details: any = undefined;

  // Si nous avons une réponse, extraire les informations utiles
  if (error.response) {
    status = error.response.status;
    details = error.response.data;
    
    // Extraire l'ID d'événement de l'en-tête
    eventId = error.response.headers?.['x-viva-eventid'];
    
    // Extraire l'ID d'erreur du corps si disponible
    if (error.response.data?.Eventid) {
      errorId = error.response.data.Eventid.toString();
      message = getErrorMessage(errorId);
    }
    // Gestion des erreurs OAuth
    else if (error.response.data?.error) {
      const oauthError = error.response.data.error;
      message = getOAuthErrorMessage(oauthError);
      details = { oauthError };
    }
    // Erreur avec un message standard
    else if (error.response.data?.message) {
      message = error.response.data.message;
    }
    
    // Si nous avons un eventId, ajouter cette information au message
    if (eventId) {
      const eventMessage = getEventMessage(eventId);
      message = `${message} (${eventMessage})`;
    }
  } 
  // Erreur de requête (pas de réponse)
  else if (error.request) {
    message = 'Aucune réponse reçue du serveur Viva Payments. Vérifiez votre connexion.';
    details = { request: 'La requête a été envoyée mais aucune réponse n\'a été reçue' };
  } 
  // Autre erreur
  else {
    message = error.message || 'Erreur inconnue avec Viva Payments';
  }

  return {
    message,
    errorId,
    eventId,
    status,
    details
  };
}

/**
 * Formate les détails d'erreur pour l'affichage utilisateur
 * @param error Objet d'erreur (généralement de Axios)
 * @returns Objet contenant une version utilisateur et une version technique de l'erreur
 */
export function formatVivaErrorForUser(error: any): {
  userMessage: string;
  technicalDetails: string;
} {
  const parsedError = parseVivaError(error);
  
  // Message convivial pour l'utilisateur
  let userMessage = parsedError.message;
  
  // Détails techniques pour les journaux ou le débogage
  const technicalParts = [
    `Erreur: ${parsedError.message}`,
    parsedError.status ? `Statut HTTP: ${parsedError.status}` : null,
    parsedError.errorId ? `ID d'erreur: ${parsedError.errorId}` : null,
    parsedError.eventId ? `ID d'événement: ${parsedError.eventId}` : null,
    parsedError.details ? `Détails: ${JSON.stringify(parsedError.details)}` : null
  ].filter(Boolean);
  
  const technicalDetails = technicalParts.join('\n');
  
  return {
    userMessage,
    technicalDetails
  };
}
