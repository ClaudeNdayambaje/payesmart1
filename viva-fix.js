// Script de correction pour l'authentification Viva Payments
// Ce script modifie la méthode d'authentification pour utiliser client_id et client_secret
// dans le corps de la requête au lieu de l'en-tête Basic Auth

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtenir le répertoire actuel en utilisant ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chemin vers le fichier server.js
const serverFilePath = path.join(__dirname, 'server.js');

// Lire le contenu du fichier
console.log('Lecture du fichier server.js...');
let content = fs.readFileSync(serverFilePath, 'utf8');

// Remplacer la méthode d'authentification dans la route /api/viva/token
console.log('Correction de la méthode d\'authentification dans la route /api/viva/token...');
content = content.replace(
  /const params = new URLSearchParams\(\);\s+params\.append\('grant_type', 'client_credentials'\);\s+params\.append\('scope', 'urn:viva:payments:ecr:api'\);/g,
  `const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('scope', 'urn:viva:payments:ecr:api');`
);

// Remplacer la méthode d'authentification Basic Auth par client_id/client_secret dans le corps
console.log('Suppression de l\'authentification Basic...');
content = content.replace(
  /const authString = `\${clientId}:\${clientSecret}`;\s+const authBase64 = Buffer\.from\(authString\)\.toString\('base64'\);/g,
  `// Nous utilisons maintenant client_id et client_secret dans le corps de la requête`
);

// Supprimer l'en-tête Authorization de toutes les requêtes
console.log('Mise à jour des en-têtes de requête...');
content = content.replace(
  /'Authorization': `Basic \${authBase64}`/g,
  "// Pas d'en-tête Authorization car les identifiants sont dans le corps"
);

// Faire la même chose pour la route de transactions
console.log('Correction de la méthode d\'authentification dans la route de transactions...');
content = content.replace(
  /const tokenParams = new URLSearchParams\(\);\s+tokenParams\.append\('grant_type', 'client_credentials'\);\s+tokenParams\.append\('scope', 'urn:viva:payments:ecr:api'\);/g,
  `const tokenParams = new URLSearchParams();
    tokenParams.append('grant_type', 'client_credentials');
    tokenParams.append('client_id', clientId);
    tokenParams.append('client_secret', clientSecret);
    tokenParams.append('scope', 'urn:viva:payments:ecr:api');`
);

// Écrire le contenu modifié dans le fichier
console.log('Écriture des modifications dans server.js...');
fs.writeFileSync(serverFilePath, content, 'utf8');

console.log('Correction terminée ! Redémarrez le serveur pour appliquer les modifications.');
