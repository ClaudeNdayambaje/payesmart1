#!/bin/bash

# Déterminer le chemin du script
PAYESMART_DIR="$HOME/Documents/PayeSmart-Desktop"

# Vérifier si le dossier existe, sinon utiliser le dossier Applications
if [ ! -d "$PAYESMART_DIR" ]; then
  # L'installation n'a pas été effectuée correctement, utiliser le chemin relatif
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  PARENT_DIR="$(dirname "$(dirname "$(dirname "$SCRIPT_DIR")")")"
  
  # Afficher un message d'erreur
  osascript -e 'display dialog "Le dossier PayeSmart-Desktop est introuvable. Veuillez réinstaller l'"'"'application." buttons {"OK"} default button "OK" with icon stop with title "Erreur PayeSmart Desktop"'
  exit 1
fi

# Exécuter le script desktop
osascript -e 'tell application "Terminal" to do script "cd '"$PAYESMART_DIR"' && ./payesmart-desktop.sh"'
