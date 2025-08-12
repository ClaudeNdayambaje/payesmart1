import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

// Charger les variables d'environnement à partir de .env.viva
dotenv.config({ path: path.resolve(process.cwd(), '.env.viva') });

// Cache pour le token
let tokenCache = {
  token: null,
  expiryTime: null
};

/**
 * Obtient un token d'accès OAuth2 pour l'API Viva Payments
 * @returns {Promise<string>} Token d'accès
 */
export async function getAccessToken() {
  // Vérifier si le token en cache est encore valide (avec une marge de 5 minutes)
  const now = Date.now();
  if (tokenCache.token && tokenCache.expiryTime && tokenCache.expiryTime > now + 5 * 60 * 1000) {
    console.log('Utilisation du token en cache');
    return tokenCache.token;
  }

  // Configuration
  const clientId = process.env.VIVA_CLIENT_ID;
  const clientSecret = process.env.VIVA_CLIENT_SECRET;
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  const tokenUrl = isDevelopment
    ? process.env.VIVA_TOKEN_URL_DEV
    : process.env.VIVA_TOKEN_URL_PROD;

  try {
    console.log('Demande d\'un nouveau token...');
    
    // Préparer l'authentification Basic
    const authString = `${clientId}:${clientSecret}`;
    const authBase64 = Buffer.from(authString).toString('base64');
    
    // Préparer les paramètres
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('scope', 'urn:viva:payments:ecr:api');
    
    // Effectuer la requête
    const response = await axios.post(tokenUrl, params, {
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authBase64}`
      },
      timeout: 15000
    });
    
    // Mettre en cache le token
    const { access_token, expires_in } = response.data;
    tokenCache = {
      token: access_token,
      expiryTime: now + (expires_in * 1000) // expires_in est en secondes
    };
    
    console.log('Nouveau token obtenu avec succès');
    return access_token;
  } catch (error) {
    console.error('Erreur lors de l\'obtention du token:', error.message);
    if (error.response) {
      console.error('Détails:', error.response.data);
    }
    throw error;
  }
}

/**
 * Réinitialise le cache du token
 */
export function resetTokenCache() {
  tokenCache = {
    token: null,
    expiryTime: null
  };
  console.log('Cache du token réinitialisé');
}

export default {
  getAccessToken,
  resetTokenCache
};
