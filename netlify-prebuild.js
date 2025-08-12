/**
 * Script de pré-build pour résoudre les problèmes de modules sur Netlify
 * Ce script est exécuté avant le processus de build de Netlify
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Récupérer l'emplacement du fichier actuel avec ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Démarrage du script de pré-build pour Netlify...');

// Fonction pour créer un fichier avec un contenu spécifique
function createFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fichier créé avec succès: ${filePath}`);
  } catch (error) {
    console.error(`❌ Erreur lors de la création du fichier ${filePath}:`, error);
  }
}

// Vérifier si le dossier public existe, sinon le créer
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  console.log('📁 Dossier public créé');
}

// Créer un fichier .nojekyll pour éviter le traitement Jekyll sur Netlify
createFile(path.join(__dirname, '.nojekyll'), '');

// Créer un fichier de remplacement pour axios
const axiosContent = `
// Module de remplacement pour axios
export default window.axios;
export const create = window.axios.create;
export const get = window.axios.get;
export const post = window.axios.post;
export const put = window.axios.put;
export const patch = window.axios.patch;
export const deleteRequest = window.axios.delete; // Renommé car 'delete' est un mot-clé réservé
export const all = window.axios.all;
export const spread = window.axios.spread;
export const isAxiosError = window.axios.isAxiosError;
export const AxiosError = window.axios.AxiosError;
export const Cancel = window.axios.Cancel;
export const CancelToken = window.axios.CancelToken;
export const isCancel = window.axios.isCancel;
export const VERSION = window.axios.VERSION;
export const toFormData = window.axios.toFormData;
export const AxiosHeaders = window.axios.AxiosHeaders;
export const HttpStatusCode = window.axios.HttpStatusCode;
export const formToJSON = window.axios.formToJSON;
export const mergeConfig = window.axios.mergeConfig;
`;

// Créer le fichier axios.js dans le dossier src
const axiosFilePath = path.join(__dirname, 'src', 'axios.js');
createFile(axiosFilePath, axiosContent);

// Créer un .env.production pour Vite
const envContent = `
# Généré automatiquement par le script de pré-build Netlify
VITE_DISABLE_CHUNKS=true
`;

createFile(path.join(__dirname, '.env.production'), envContent);

console.log('🎉 Script de pré-build Netlify terminé avec succès');
