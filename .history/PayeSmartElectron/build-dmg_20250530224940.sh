#!/bin/bash

# Script pour construire le fichier DMG d'installation PayeSmart
# Ce script génère un fichier DMG pour macOS

# Bannière
echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║       CRÉATION DU DMG PAYESMART                ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Chemin vers le projet
PROJECT_PATH="$(dirname "$(realpath "$0")")"
cd "$PROJECT_PATH"

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
  echo "❌ Node.js n'est pas installé. Veuillez l'installer pour continuer."
  exit 1
fi

# Vérifier si les dépendances sont installées
if [ ! -d "node_modules" ]; then
  echo "📦 Installation des dépendances..."
  npm install
fi

# Créer le dossier assets s'il n'existe pas
mkdir -p assets

# Vérifier si l'icône existe
if [ ! -f "assets/icon.icns" ]; then
  echo "🖼️ Création de l'icône pour macOS..."
  # Utiliser une image PNG comme source si disponible
  if [ -f "assets/logo.png" ]; then
    echo "⚠️ Aucun fichier icon.icns trouvé. Veuillez créer une icône .icns à partir du logo.png"
    echo "   Vous pouvez utiliser un outil comme iconutil ou un convertisseur en ligne"
    # Note: La création d'icônes .icns nécessite des outils spécifiques à macOS
    # Une solution manuelle est souvent préférable pour ce cas
  fi
fi

# Vérifier si l'arrière-plan du DMG existe
if [ ! -f "assets/dmg-background.png" ]; then
  echo "🖼️ Création de l'arrière-plan pour le DMG..."
  # Création d'un arrière-plan simple avec le logo
  if [ -f "assets/logo.png" ]; then
    echo "⚠️ Aucun fichier dmg-background.png trouvé. Utilisation d'un arrière-plan par défaut."
    # Copier le logo comme arrière-plan temporaire
    cp assets/logo.png assets/dmg-background.png
  fi
fi

# Nettoyer les builds précédents
echo "🧹 Nettoyage des builds précédents..."
rm -rf dist

# Construire l'application pour macOS
echo "🔨 Construction de l'application PayeSmartElectron pour macOS..."
echo "⏳ Cette opération peut prendre plusieurs minutes..."
npm run build:mac

# Vérifier si le build a réussi
if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Build terminé avec succès!"
  echo "📦 Le fichier DMG est disponible dans le dossier 'dist'"
  echo ""
  # Afficher le chemin complet vers le DMG
  DMG_PATH=$(find dist -name "*.dmg" | head -n 1)
  if [ -n "$DMG_PATH" ]; then
    echo "📄 Chemin vers le DMG: $PROJECT_PATH/$DMG_PATH"
    echo ""
    echo "Pour installer PayeSmart:"
    echo "1. Ouvrez le fichier DMG"
    echo "2. Glissez l'application PayeSmart dans le dossier Applications"
    echo "3. Éjectez le disque virtuel"
    echo ""
  fi
else
  echo "❌ Erreur lors de la construction du DMG. Vérifiez les erreurs ci-dessus."
fi
