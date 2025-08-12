import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { getAccessToken } from '../services/authService.js';

// Charger les variables d'environnement à partir de .env.viva
dotenv.config({ path: path.resolve(process.cwd(), '.env.viva') });

// Déterminer les URL de base selon l'environnement
const isDevelopment = process.env.NODE_ENV !== 'production';
const API_BASE_URL = isDevelopment
  ? process.env.VIVA_API_BASE_URL_DEV
  : process.env.VIVA_API_BASE_URL_PROD;

/**
 * Crée une instance Axios avec l'URL de base de l'API Viva
 * @returns {Object} Instance Axios configurée
 */
const createApiClient = () => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json'
    }
  });
  
  return client;
};

/**
 * Effectue une requête GET authentifiée vers l'API Viva
 * @param {string} endpoint - Endpoint API (sans l'URL de base)
 * @param {Object} params - Paramètres de requête optionnels
 * @returns {Promise<Object>} Réponse de l'API
 */
export const get = async (endpoint, params = {}) => {
  try {
    const token = await getAccessToken();
    const client = createApiClient();
    
    const response = await client.get(endpoint, {
      params,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la requête GET ${endpoint}:`, error.message);
    throw error;
  }
};

/**
 * Effectue une requête POST authentifiée vers l'API Viva
 * @param {string} endpoint - Endpoint API (sans l'URL de base)
 * @param {Object} data - Données à envoyer
 * @returns {Promise<Object>} Réponse de l'API
 */
export const post = async (endpoint, data = {}) => {
  try {
    const token = await getAccessToken();
    const client = createApiClient();
    
    const response = await client.post(endpoint, data, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la requête POST ${endpoint}:`, error.message);
    throw error;
  }
};

/**
 * Effectue une requête DELETE authentifiée vers l'API Viva
 * @param {string} endpoint - Endpoint API (sans l'URL de base)
 * @param {Object} params - Paramètres de requête optionnels
 * @returns {Promise<Object>} Réponse de l'API
 */
export const del = async (endpoint, params = {}) => {
  try {
    const token = await getAccessToken();
    const client = createApiClient();
    
    const response = await client.delete(endpoint, {
      params,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la requête DELETE ${endpoint}:`, error.message);
    throw error;
  }
};

export default {
  get,
  post,
  del
};
