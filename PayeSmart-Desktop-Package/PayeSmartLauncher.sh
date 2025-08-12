#!/bin/bash
# Script de lancement pour PayeSmart Desktop
# Version ultra-robuste sans affichage de terminal

# Chemins absolus
SCRIPT_PATH="/Users/claudendayambaje/Documents/Logiciel-Caisse8-main/PayeSmart-Desktop-Package/scripts/payesmart-desktop.sh"
LOG_FILE="/tmp/payesmart-launcher.log"

# Définir le PATH pour inclure npm
export PATH="$PATH:/usr/local/bin:/opt/homebrew/bin:$HOME/.nvm/versions/node/v18.18.0/bin:$HOME/.nvm/versions/node/v16.20.0/bin:/usr/local/share/npm/bin"

# Vérification des permissions
if [ ! -x "$SCRIPT_PATH" ]; then
  chmod +x "$SCRIPT_PATH"
fi

# Exécution du script en arrière-plan, sans terminal
nohup bash "$SCRIPT_PATH" > "$LOG_FILE" 2>&1 &

# Notification (optionnelle via AppleScript)
osascript -e 'display notification "PayeSmart Desktop est en cours de démarrage" with title "PayeSmart" subtitle "Veuillez patienter..." sound name "Glass"'

exit 0
