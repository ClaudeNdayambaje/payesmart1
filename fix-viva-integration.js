/**
 * Script de correction pour l'intégration Viva Payments
 * Ce script unifie et corrige tous les problèmes identifiés dans l'intégration
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtenir le répertoire actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Démarrage de la correction de l\'intégration Viva Payments...');

// Fonction pour lire un fichier
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Erreur lors de la lecture du fichier ${filePath}:`, error);
    process.exit(1);
  }
}

// Fonction pour écrire dans un fichier
function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fichier ${filePath} mis à jour avec succès.`);
  } catch (error) {
    console.error(`Erreur lors de l'écriture dans le fichier ${filePath}:`, error);
    process.exit(1);
  }
}

// Désactiver les fichiers redondants
const filesToRename = [
  'server-viva-payments.js',
  'utils/vivaErrorHandler.js'
];

filesToRename.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    fs.renameSync(filePath, `${filePath}.bak`);
    console.log(`Fichier ${file} renommé en ${file}.bak`);
  }
});

// Mise à jour du fichier .env.viva
const envVivaPath = path.join(__dirname, '.env.viva');
if (fs.existsSync(envVivaPath)) {
  let envContent = readFile(envVivaPath);
  envContent = envContent.replace(/PORT=3001/g, 'PORT=3002');
  writeFile(envVivaPath, envContent);
  console.log('Fichier .env.viva mis à jour pour utiliser le port 3002.');
}

// Mise à jour du fichier server.js
const serverJsPath = path.join(__dirname, 'server.js');
let serverContent = readFile(serverJsPath);

// 1. Correction des imports
serverContent = serverContent.replace(
  /import \{ parseVivaError, formatVivaErrorForUser, createVivaErrorMiddleware \} from '\.\/utils\/vivaErrorHandler\.js';/g,
  '// Gestionnaire d\'erreurs intégré directement dans ce fichier'
);

// 2. Correction de l'authentification dans les routes
const authPatterns = [
  {
    search: /const tokenParams = new URLSearchParams\(\);\s+tokenParams\.append\('grant_type', 'client_credentials'\);\s+tokenParams\.append\('scope', 'urn:viva:payments:ecr:api'\);/g,
    replace: `const tokenParams = new URLSearchParams();
    tokenParams.append('grant_type', 'client_credentials');
    tokenParams.append('client_id', clientId);
    tokenParams.append('client_secret', clientSecret);
    tokenParams.append('scope', 'urn:viva:payments:ecr:api');`
  },
  {
    search: /\/\/ Utiliser l'authentification Basic standard pour OAuth2[\s\S]*?\/\/ Nous utilisons maintenant client_id et client_secret dans le corps de la requête/g,
    replace: `// Utiliser l'authentification OAuth2 en envoyant les identifiants dans le corps de la requête
    // Cette méthode est recommandée pour l'API Viva Payments`
  },
  {
    search: /'Content-Type': 'application\/x-www-form-urlencoded',\s+\/\/ Pas d'en-tête Authorization car les identifiants sont dans le corps/g,
    replace: `'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'`
  }
];

// Appliquer toutes les corrections d'authentification
authPatterns.forEach(({ search, replace }) => {
  serverContent = serverContent.replace(search, replace);
});

// Correction des URLs d'API
serverContent = serverContent.replace(
  /const baseUrl = isDevelopment\s+\? 'https:\/\/demo-accounts\.vivapayments\.com\/connect\/token'\s+: 'https:\/\/accounts\.vivapayments\.com\/connect\/token';/g,
  `const baseUrl = isDevelopment 
      ? process.env.VIVA_TOKEN_URL_DEV || 'https://demo-accounts.vivapayments.com/connect/token'
      : process.env.VIVA_TOKEN_URL_PROD || 'https://accounts.vivapayments.com/connect/token';`
);

// Ajout de logs détaillés pour le débogage
serverContent = serverContent.replace(
  /console\.log\('Tentative d\\'authentification OAuth2 avec client_credentials\.\.\.'\);/g,
  `console.log('Tentative d\\'authentification OAuth2 avec client_credentials...');
    console.log('Client ID utilisé:', clientId);
    console.log('URL d\\'authentification:', baseUrl);
    console.log('Type de contenu: application/x-www-form-urlencoded');`
);

// Écrire le contenu mis à jour dans server.js
writeFile(serverJsPath, serverContent);

console.log('\nCorrection de l\'intégration Viva Payments terminée avec succès !');
console.log('\nÉtapes suivantes :');
console.log('1. Vérifiez vos identifiants client dans le portail développeur Viva Payments');
console.log('2. Redémarrez le serveur avec la commande "node server.js"');
console.log('3. Testez l\'API avec un petit montant (minimum 30 centimes)');
console.log('\nSi l\'erreur persiste, contactez le support Viva Payments pour vérifier vos identifiants.');
