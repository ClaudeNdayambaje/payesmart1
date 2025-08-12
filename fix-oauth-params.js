/**
 * Script de correction pour l'authentification OAuth2 avec Viva Payments
 * Ce script ajoute les identifiants client manquants dans la requête d'authentification
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtenir le répertoire actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Démarrage de la correction des paramètres OAuth2...');

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

// Correction du fichier server.js
const serverJsPath = path.join(__dirname, 'server.js');
let serverContent = readFile(serverJsPath);

// Recherche de toutes les occurrences de la préparation des paramètres OAuth2
const oauthParamsPattern = /const tokenParams = new URLSearchParams\(\);\s+tokenParams\.append\('grant_type', 'client_credentials'\);\s+tokenParams\.append\('scope', 'urn:viva:payments:ecr:api'\);/g;

// Remplacement par la version correcte incluant les identifiants client
const correctedParams = `const tokenParams = new URLSearchParams();
    tokenParams.append('grant_type', 'client_credentials');
    tokenParams.append('client_id', clientId);
    tokenParams.append('client_secret', clientSecret);
    tokenParams.append('scope', 'urn:viva:payments:ecr:api');`;

// Appliquer la correction
const correctedContent = serverContent.replace(oauthParamsPattern, correctedParams);

// Vérifier si des corrections ont été apportées
if (correctedContent === serverContent) {
  console.log('\nAucune correction n\'a été nécessaire. Le fichier server.js est déjà à jour ou le motif recherché n\'a pas été trouvé.');
  console.log('Vérifiez manuellement que les paramètres client_id et client_secret sont bien inclus dans la requête OAuth2.');
  process.exit(0);
}

// Écrire le contenu corrigé dans server.js
writeFile(serverJsPath, correctedContent);

console.log('\nCorrection des paramètres OAuth2 terminée avec succès !');
console.log('\nVérifiez que les paramètres client_id et client_secret sont maintenant inclus dans la requête OAuth2.');
console.log('Redémarrez le serveur avec la commande "node server.js" pour appliquer les changements.');
