import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { json, urlencoded } from 'express';
import fs from 'fs';
import path from 'path';
// Gestionnaire d'erreurs pour l'API Viva Payments intégré directement

// Mappage des codes d'erreur (Error IDs) du corps de la réponse
const errorIdMessages = {
  // Erreurs de transaction
  '1000': 'Transaction annulée par l\'utilisateur',
  '1001': 'Le SDK de paiement est occupé en ce moment',
  '1002': 'Il y a des transactions stockées qui doivent être annulées',
  '1003': 'Le terminal a expiré',
  '1004': 'Le terminal a refusé la transaction',
  '1006': 'Transaction refusée par le serveur',
  '1007': 'Refusé par la carte',
  '1008': 'Transaction non réversible',
  '1009': 'La transaction a échoué',
  '1010': 'Le remboursement a échoué',
  '1011': 'La transaction a été annulée',
  '1012': 'La transaction est en attente de vérification',
  '1013': 'Le paiement a été validé',
  '1014': 'La transaction n\'a pas été trouvée',
  '1015': 'Le terminal n\'est pas connecté',
  '1016': 'Un problème technique est survenu',
  
  // Erreurs d'authentification et d'autorisation
  '2000': 'Authentification invalide',
  '2001': 'Token expiré',
  '2002': 'Permissions insuffisantes',
  '2003': 'Identifiants incorrects',
  '2004': 'Service non disponible pour ce marchand',
  
  // Erreurs de validation des paramètres
  '3000': 'Paramètres de requête invalides',
  '3001': 'Montant invalide',
  '3002': 'Devise invalide',
  '3003': 'ID de terminal invalide',
  '3004': 'ID de transaction invalide',
  '3005': 'URL de callback invalide',
  
  // Erreurs système et techniques
  '4000': 'Erreur système',
  '4001': 'Service temporairement indisponible',
  '4002': 'Timeout de la requête',
  '4003': 'Conflit de données',
  '4004': 'Ressource non trouvée',
  '4005': 'Méthode non autorisée'
};

// Mappage des codes d'événement pour une meilleure compréhension
const eventIdMessages = {
  '100': 'Paiement initié',
  '101': 'Carte insérée dans le terminal',
  '102': 'Paiement en cours de traitement',
  '103': 'Paiement complété avec succès',
  '104': 'Paiement refusé',
  '105': 'Paiement annulé par l\'utilisateur',
  '106': 'Terminal déconnecté',
  '107': 'Erreur de communication avec le terminal',
  '108': 'Timeout de la transaction',
  '109': 'Attente de signature',
  '110': 'Impression du reçu en cours'
};

// Fonction pour analyser et extraire les informations d'erreur des réponses de l'API Viva
function parseVivaError(error) {
  // Initialiser un objet pour stocker les informations d'erreur
  const result = {
    statusCode: null,
    errorId: null,
    eventId: null,
    message: null,
    details: null
  };
  
  // Pas d'erreur ou erreur sans réponse
  if (!error || !error.response) {
    result.message = error?.message || 'Erreur inconnue';
    result.details = { request: "La requête a été envoyée mais aucune réponse n'a été reçue" };
    return result;
  }
  
  // Extraire le code HTTP
  result.statusCode = error.response.status;
  
  // Extraire les données de la réponse si elles existent
  const responseData = error.response.data;
  
  // Analyser les erreurs spécifiques de l'API Viva
  if (responseData) {
    // Si l'erreur contient un ID d'erreur spécifique de Viva
    if (responseData.errorId) {
      result.errorId = responseData.errorId;
      result.message = errorIdMessages[responseData.errorId] || 'Erreur inconnue de l\'API';
    }
    
    // Si l'erreur contient un ID d'événement
    if (responseData.eventId) {
      result.eventId = responseData.eventId;
    }
    
    // Pour les erreurs OAuth
    if (responseData.error) {
      result.message = `Erreur OAuth: ${responseData.error}`;
      if (responseData.error_description) {
        result.details = responseData.error_description;
      }
    }
    
    // Enregistrer les détails complets pour le débogage
    result.details = responseData;
  } else {
    // Si l'erreur ne contient pas de données structurées
    result.message = error.message || 'Erreur de serveur';
  }
  
  return result;
}

// Fonction pour formater les erreurs de manière conviviale pour l'utilisateur
function formatVivaErrorForUser(error) {
  // Analyser l'erreur pour extraire les informations pertinentes
  const parsedError = parseVivaError(error);
  
  // Message par défaut en cas d'erreur inconnue
  let userMessage = 'Une erreur est survenue lors du traitement de votre paiement. Veuillez réessayer.';
  let technicalDetails = { error: 'Erreur inconnue' };
  
  // Si nous avons une réponse avec un code d'état
  if (parsedError.statusCode) {
    // Personnaliser le message en fonction du code d'état HTTP
    switch (parsedError.statusCode) {
      case 400:
        // Si nous avons un ID d'erreur spécifique de Viva
        if (parsedError.errorId && errorIdMessages[parsedError.errorId]) {
          userMessage = errorIdMessages[parsedError.errorId];
        } else if (error.response?.data?.error === 'invalid_client') {
          userMessage = 'Erreur d\'authentification inconnue (Code: Erreur 400: Bad Request)';
          technicalDetails = {
            oauthError: 'Erreur 400: Bad Request'
          };
        } else {
          userMessage = 'Paramètres de requête invalides. Veuillez vérifier les informations saisies.';
        }
        break;
        
      case 401:
        userMessage = 'Session expirée ou non autorisée. Veuillez vous reconnecter.';
        break;
        
      case 403:
        userMessage = 'Vous n\'êtes pas autorisé à effectuer cette action.';
        break;
        
      case 404:
        userMessage = 'Service de paiement non disponible. Veuillez réessayer ultérieurement.';
        break;
        
      case 408:
      case 504:
        userMessage = 'La requête a pris trop de temps. Vérifiez votre connexion et réessayez.';
        break;
        
      case 500:
      case 502:
      case 503:
        userMessage = 'Le service de paiement est temporairement indisponible. Veuillez réessayer plus tard.';
        break;
        
      default:
        userMessage = `Erreur inattendue (Code: ${parsedError.statusCode}). Veuillez contacter le support.`;
    }
    
    // Ajouter des détails HTTP pour le débogage
    technicalDetails = {
      statusCode: parsedError.statusCode,
      statusText: error.response?.statusText,
      ...technicalDetails,
      ...parsedError.details
    };
  } else if (!error.response) {
    // Si aucune réponse n'a été reçue (problème réseau ou timeout)
    userMessage = 'Aucune réponse reçue du serveur Viva Payments. Vérifiez votre connexion.';
    technicalDetails = {
      request: "La requête a été envoyée mais aucune réponse n'a été reçue"
    };
  }
  
  // Ajouter des informations supplémentaires si nous avons un ID d'erreur ou d'événement
  if (parsedError.errorId) {
    technicalDetails.errorId = parsedError.errorId;
  }
  
  if (parsedError.eventId) {
    technicalDetails.eventId = parsedError.eventId;
    // Ajouter le message d'événement s'il existe
    if (eventIdMessages[parsedError.eventId]) {
      technicalDetails.eventDescription = eventIdMessages[parsedError.eventId];
    }
  }
  
  return { userMessage, technicalDetails };
}

// Middleware pour la gestion des erreurs de l'API Viva Payments
function createVivaErrorMiddleware() {
  return (err, req, res, next) => {
    console.error('Erreur dans le middleware Viva:', err);
    
    // Utiliser notre formateur d'erreur pour générer un message convivial
    const { userMessage, technicalDetails } = formatVivaErrorForUser(err);
    
    // Déterminer le code d'état HTTP approprié
    const statusCode = err.response?.status || 500;
    
    // Envoyer une réponse JSON avec le message d'erreur et les détails techniques
    res.status(statusCode).json({
      success: false,
      message: userMessage,
      technicalDetails: process.env.NODE_ENV === 'development' ? technicalDetails : undefined
    });
  };
}

// Charger les variables d'environnement depuis .env.viva
const envViva = dotenv.config({ path: '.env.viva' });

// Vérifier que les variables essentielles sont définies
console.log('Variables d\'environnement Viva Payments :');
console.log('VIVA_CLIENT_ID:', process.env.VIVA_CLIENT_ID ? 'Présent' : 'Manquant');
console.log('VIVA_CLIENT_SECRET:', process.env.VIVA_CLIENT_SECRET ? 'Présent' : 'Manquant');
console.log('VIVA_API_BASE_URL_DEV:', process.env.VIVA_API_BASE_URL_DEV);

// Configuration de l'environnement (développement par défaut)
const isDevelopment = process.env.NODE_ENV !== 'production';
const port = process.env.PORT || 3002;

// Configuration d'Express
const app = express();
app.use(cors());
app.use(json());
app.use(urlencoded({ extended: true }));

// ID du client et secret pour l'authentification OAuth2
const clientId = process.env.VIVA_CLIENT_ID;
const clientSecret = process.env.VIVA_CLIENT_SECRET;

// URL de base de l'API Viva Payments, différente selon l'environnement
const vivaApiBaseUrl = isDevelopment 
  ? process.env.VIVA_API_BASE_URL_DEV || 'https://demo-api.vivapayments.com'
  : process.env.VIVA_API_BASE_URL_PROD || 'https://api.vivapayments.com';

// Stockage temporaire des transactions pour les callbacks
const transactionStore = new Map();
let transactionSessionId = null;

// Route de test simple pour vérifier que le serveur fonctionne
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Serveur proxy Viva Payments opérationnel', 
    environment: isDevelopment ? 'development' : 'production',
    timestamp: new Date().toISOString()
  });
});

// Route pour obtenir un token d'accès
app.post('/api/viva/token', async (req, res, next) => {
  try {
    // Préparer les paramètres exacts selon la spécification OAuth2
    const tokenParams = new URLSearchParams();
    tokenParams.append('grant_type', 'client_credentials'); // Obligatoire, type de flux OAuth2
    tokenParams.append('client_id', clientId);
    tokenParams.append('client_secret', clientSecret);
    tokenParams.append('scope', 'urn:viva:payments:ecr:api'); // Scope spécifique pour les terminaux physiques
    
    // URL du service d'authentification
    const baseUrl = isDevelopment 
      ? process.env.VIVA_TOKEN_URL_DEV || 'https://demo-accounts.vivapayments.com/connect/token'
      : process.env.VIVA_TOKEN_URL_PROD || 'https://accounts.vivapayments.com/connect/token';
    
    // Utiliser l'authentification OAuth2 en envoyant les identifiants dans le corps de la requête
    // Cette méthode est recommandée pour l'API Viva Payments
    
    const tokenResponse = await axios.post(baseUrl, tokenParams, {
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      timeout: 15000
    });
    
    res.json(tokenResponse.data);
  } catch (error) {
    console.error('Erreur lors de l\'obtention du token:', error);
    next(error);
  }
});

// Route pour créer une transaction et communiquer avec un terminal physique
app.post('/api/viva/transactions', async (req, res, next) => {
  
  try {
    // Extraction des paramètres avec validation
    const { amount, merchantTrns, sessionId } = req.body;
    
    // Vérification des paramètres obligatoires
    if (!amount || !merchantTrns) {
      return res.status(400).json({ error: 'Les paramètres amount et merchantTrns sont requis' });
    }
    
    // Utiliser le sessionId fourni par le frontend ou en générer un nouveau
    transactionSessionId = sessionId || `session-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    // D'abord, obtenir le token selon la documentation OAuth2 standard
    // Note: Pour l'API Viva Cloud Terminal, les marchands doivent utiliser les identifiants POS API
    
    // Vérifier que les identifiants sont présents et afficher des informations de débogage
    console.log('ID Client utilisé:', clientId);
    // Afficher seulement les 4 premiers caractères du secret pour la sécurité
    console.log('Secret Client (4 premiers caractères):', clientSecret ? clientSecret.substring(0, 4) + '...' : 'Non défini');
    
    // Préparer les paramètres exacts selon la spécification OAuth2
    const tokenParams = new URLSearchParams();
    tokenParams.append('grant_type', 'client_credentials'); // Obligatoire, type de flux OAuth2
    tokenParams.append('client_id', clientId);
    tokenParams.append('client_secret', clientSecret);
    tokenParams.append('scope', 'urn:viva:payments:ecr:api'); // Scope spécifique pour les terminaux physiques
    
    // URL du service d'authentification
    const baseUrl = isDevelopment 
      ? process.env.VIVA_TOKEN_URL_DEV || 'https://demo-accounts.vivapayments.com/connect/token'
      : process.env.VIVA_TOKEN_URL_PROD || 'https://accounts.vivapayments.com/connect/token';
    
    // Utiliser l'authentification OAuth2 en envoyant les identifiants dans le corps de la requête
    // Cette méthode est recommandée pour l'API Viva Payments
    
    console.log('Tentative d\'authentification OAuth2 avec client_credentials...');
    console.log('Client ID utilisé:', clientId);
    console.log('URL d\'authentification:', baseUrl);
    console.log('Type de contenu: application/x-www-form-urlencoded');
    const tokenResponse = await axios.post(baseUrl, tokenParams, {
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      timeout: 15000
    });
    
    // Vérifier le contenu de la réponse pour le débogage
    console.log('Réponse du token reçue avec succès:', tokenResponse.status, tokenResponse.statusText);
    
    const token = tokenResponse.data.access_token;
    
    // Utiliser l'API EFT POS pour les terminaux physiques
    // https://developer.vivawallet.com/apis-for-point-of-sale/eft-pos-terminal-apps-api/#operations
    
    // Déterminer le terminal à utiliser (fourni dans la requête ou défini par défaut)
    const terminalId = req.body.terminalId || process.env.DEFAULT_TERMINAL_ID;
    
    if (!terminalId) {
      return res.status(400).json({ error: 'ID de terminal non spécifié' });
    }
    
    // Construire l'URL de l'API de terminal POS
    const apiUrl = `${vivaApiBaseUrl}/eft/v1/terminals/${terminalId}/transactions`;
    
    // Le montant doit être en centimes selon la documentation
    const amountInCents = Math.round(amount * 100);
    
    // Préparer la charge utile de la requête selon la documentation
    const payload = {
      transactionType: 'Sale', // Type de transaction: Sale, Refund, Cancel, etc.
      amount: amountInCents, // Montant en centimes
      merchantTrns: merchantTrns, // Référence marchand
      sourceTransactionId: null, // Requis seulement pour les remboursements
      currencyCode: 978, // Code ISO pour EUR (978)
      installments: 0, // 0 pour paiement complet
      softwareVersion: '1.0', // Version du logiciel client
      clientTransactionId: transactionSessionId, // ID unique pour cette transaction
      transactionDateTime: new Date().toISOString(), // Date et heure de la transaction
      callback: {
        url: `${req.protocol}://${req.get('host')}/api/viva/callback`, // URL de callback
        custom1: transactionSessionId, // Champ personnalisé pour identification
        custom2: '',
        custom3: ''
      }
    };
    
    console.log('Envoi de la requête à l\'API Viva Cloud Terminal. Payload:', payload);
    
    // Envoyer la requête à l'API de terminal POS
    const response = await axios.post(apiUrl, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // Timeout plus long pour les transactions
    });
    
    console.log('Réponse de l\'API Viva Cloud Terminal:', response.status, response.statusText);
    
    // Stocker temporairement la transaction pour le callback
    transactionStore.set(transactionSessionId, {
      amount: amountInCents,
      merchantTrns,
      status: 'pending',
      timestamp: new Date().toISOString()
    });
    
    // Renvoyer la réponse avec les informations pertinentes
    res.json({
      success: true,
      sessionId: transactionSessionId,
      transactionId: response.data.transactionId || null,
      message: 'Transaction initiée. Veuillez suivre les instructions sur le terminal.',
      terminalId,
      amount: amountInCents
    });
    
  } catch (error) {
    console.error('Erreur lors de la transaction:', error.message);
    
    // Afficher plus de détails sur l'erreur pour le débogage
    if (error.response) {
      console.error('Détails de l\'erreur de l\'API Viva:', error.response);
    }
    
    next(error);
  }
});

// Route pour recevoir les callbacks de l'API Viva
app.post('/api/viva/callback', (req, res) => {
  console.log('Callback reçu de l\'API Viva:', req.body);
  
  // Extraire l'ID de session du champ personnalisé
  const sessionId = req.body.custom1;
  
  if (sessionId && transactionStore.has(sessionId)) {
    // Mettre à jour le statut de la transaction
    const transaction = transactionStore.get(sessionId);
    transaction.status = req.body.statusText || req.body.status || 'complete';
    transaction.completedAt = new Date().toISOString();
    transaction.responseData = req.body;
    
    transactionStore.set(sessionId, transaction);
    
    console.log(`Transaction ${sessionId} mise à jour:`, transaction);
  } else {
    console.warn('Callback reçu pour une session inconnue:', sessionId);
  }
  
  // Toujours renvoyer un succès au callback Viva
  res.status(200).json({ success: true });
});

// Route pour vérifier le statut d'une transaction
app.get('/api/viva/transactions/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  
  if (transactionStore.has(sessionId)) {
    const transaction = transactionStore.get(sessionId);
    res.json({
      success: true,
      transaction
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Transaction non trouvée'
    });
  }
});

// Middleware de gestion des erreurs pour toutes les routes
app.use(createVivaErrorMiddleware());

// Démarrer le serveur
try {
  console.log(`Tentative de démarrage du serveur sur le port ${port}`);
  app.listen(port, () => {
    console.log(`Serveur proxy pour Viva Payments démarré avec succès sur le port ${port}`);
    console.log(`Mode: ${isDevelopment ? 'Développement' : 'Production'}`);
    console.log(`Client ID: ${clientId}`);
    console.log(`URL de l'API Viva Payments: ${vivaApiBaseUrl}`);
    console.log(`URL de test: http://localhost:${port}/api/test`);
  });
} catch (error) {
  console.error('Erreur lors du démarrage du serveur:', error);
  process.exit(1);
}
