#!/bin/bash

# Détecter le répertoire où se trouve le script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_NAME="PayeSmart"

echo "🔧 Installation de PayeSmart Desktop..."

# Copier l'application dans le dossier Applications
echo "📂 Copie de l'application dans le dossier Applications..."
cp -R "$SCRIPT_DIR/$APP_NAME.app" /Applications/
chmod -R 755 "/Applications/$APP_NAME.app"

# Créer un dossier PayeSmart dans le dossier Documents
PAYESMART_DIR="$HOME/Documents/PayeSmart-Desktop"
mkdir -p "$PAYESMART_DIR"

# Copier les scripts nécessaires
echo "📄 Configuration des scripts..."
cp -R "$SCRIPT_DIR/scripts/" "$PAYESMART_DIR/"
chmod -R 755 "$PAYESMART_DIR"

# Demander si l'utilisateur souhaite ajouter l'icône au Dock
echo ""
echo "Voulez-vous ajouter PayeSmart au Dock ? (o/n)"
read -r add_to_dock

if [[ "$add_to_dock" == "o" || "$add_to_dock" == "O" || "$add_to_dock" == "oui" ]]; then
  echo "🔗 Ajout de PayeSmart au Dock..."
  defaults write com.apple.dock persistent-apps -array-add "<dict><key>tile-data</key><dict><key>file-data</key><dict><key>_CFURLString</key><string>/Applications/$APP_NAME.app</string><key>_CFURLStringType</key><integer>0</integer></dict></dict></dict>"
  killall Dock
fi

echo ""
echo "✅ PayeSmart Desktop a été installé avec succès!"
echo "📱 L'application est disponible dans votre dossier Applications."
echo "📂 Les scripts sont disponibles dans: $PAYESMART_DIR"
echo ""
echo "👉 Pour lancer PayeSmart Desktop, ouvrez l'application depuis votre dossier Applications."
echo ""
echo "Appuyez sur une touche pour terminer l'installation..."
read -n 1
