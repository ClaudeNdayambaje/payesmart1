/**
 * Script de test pour l'authentification Viva Payments
 * Ce script teste différentes méthodes d'authentification
 */
import axios from 'axios';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtenir le répertoire actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Charger les variables d'environnement depuis .env.viva
dotenv.config({ path: path.join(__dirname, '.env.viva') });

const clientId = process.env.VIVA_CLIENT_ID;
const clientSecret = process.env.VIVA_CLIENT_SECRET;
const isDevelopment = process.env.NODE_ENV !== 'production';

console.log('=== Test d\'authentification Viva Payments ===');
console.log('Mode:', isDevelopment ? 'Développement (démo)' : 'Production');
console.log('Client ID:', clientId);
console.log('Client Secret (4 premiers caractères):', clientSecret ? clientSecret.substring(0, 4) + '...' : 'Non défini');

// URL du service d'authentification
const baseUrl = isDevelopment 
  ? process.env.VIVA_TOKEN_URL_DEV || 'https://demo-accounts.vivapayments.com/connect/token'
  : process.env.VIVA_TOKEN_URL_PROD || 'https://accounts.vivapayments.com/connect/token';

console.log('URL d\'authentification:', baseUrl);

// Test 1: Authentification avec identifiants dans le corps
async function testBodyAuth() {
  console.log('\n=== Test 1: Authentification avec identifiants dans le corps ===');
  
  try {
    const tokenParams = new URLSearchParams();
    tokenParams.append('grant_type', 'client_credentials');
    tokenParams.append('client_id', clientId);
    tokenParams.append('client_secret', clientSecret);
    tokenParams.append('scope', 'urn:viva:payments:ecr:api');
    
    console.log('Paramètres de la requête:', tokenParams.toString());
    
    const response = await axios.post(baseUrl, tokenParams, {
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      timeout: 15000
    });
    
    console.log('Réponse:', response.status, response.statusText);
    console.log('Token reçu:', response.data.access_token ? 'Oui (succès)' : 'Non');
    
    return true;
  } catch (error) {
    console.error('Erreur:', error.message);
    if (error.response) {
      console.error('Statut de l\'erreur:', error.response.status);
      console.error('Détails de l\'erreur:', error.response.data);
    }
    
    return false;
  }
}

// Test 2: Authentification avec Basic Auth dans l'en-tête
async function testBasicAuth() {
  console.log('\n=== Test 2: Authentification avec Basic Auth dans l\'en-tête ===');
  
  try {
    const tokenParams = new URLSearchParams();
    tokenParams.append('grant_type', 'client_credentials');
    tokenParams.append('scope', 'urn:viva:payments:ecr:api');
    
    // Encoder les identifiants en Base64 pour Basic Auth
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    console.log('Paramètres de la requête:', tokenParams.toString());
    console.log('En-tête Authorization: Basic [encodé en Base64]');
    
    const response = await axios.post(baseUrl, tokenParams, {
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      timeout: 15000
    });
    
    console.log('Réponse:', response.status, response.statusText);
    console.log('Token reçu:', response.data.access_token ? 'Oui (succès)' : 'Non');
    
    return true;
  } catch (error) {
    console.error('Erreur:', error.message);
    if (error.response) {
      console.error('Statut de l\'erreur:', error.response.status);
      console.error('Détails de l\'erreur:', error.response.data);
    }
    
    return false;
  }
}

// Exécuter les tests
async function runTests() {
  console.log('\nDémarrage des tests...\n');
  
  const bodyAuthSuccess = await testBodyAuth();
  const basicAuthSuccess = await testBasicAuth();
  
  console.log('\n=== Résultats des tests ===');
  console.log('Test 1 (Auth dans le corps):', bodyAuthSuccess ? 'SUCCÈS' : 'ÉCHEC');
  console.log('Test 2 (Basic Auth dans l\'en-tête):', basicAuthSuccess ? 'SUCCÈS' : 'ÉCHEC');
  
  if (!bodyAuthSuccess && !basicAuthSuccess) {
    console.log('\nAucune méthode d\'authentification n\'a fonctionné. Vérifiez vos identifiants dans le portail Viva Payments.');
    console.log('Assurez-vous que votre compte a les permissions nécessaires pour l\'API Cloud Terminal.');
  } else {
    console.log('\nUn test a réussi! Utilisez la méthode d\'authentification qui a fonctionné dans votre application.');
  }
}

runTests();
