#!/bin/bash

echo "Début du script post-build pour PayeSmart..."

# Copier le fichier _redirects dans le dossier de build
echo "Copie du fichier _redirects..."
cp ./public/_redirects ./dist/

# Assurer que les fichiers marketing sont correctement copiés
echo "Copie des fichiers du site web marketing..."
mkdir -p ./dist/marketing
cp -r ./public/marketing/* ./dist/marketing/

# Copier le logo et autres ressources statiques
echo "Copie des ressources statiques..."
cp -r ./public/logo.png ./dist/ 2>/dev/null || :
cp -r ./public/logo2.png ./dist/ 2>/dev/null || :
cp -r ./public/logo25.png ./dist/ 2>/dev/null || :
cp -r ./public/img ./dist/ 2>/dev/null || :

# Vérifier que le fichier index.html est présent dans le dossier de build
echo "Vérification du fichier index.html..."
if [ ! -f ./dist/index.html ]; then
  echo "ERREUR: index.html non trouvé dans le dossier de build!"
else
  echo "index.html présent dans le dossier de build."
fi

# Créer un fichier de vérification pour Netlify
echo "Création d'un fichier de vérification..."
echo "PayeSmart - Site web et application déployés avec succès le $(date)" > ./dist/deploy-info.txt

echo "Script post-build exécuté avec succès!"
