#!/bin/bash

# PayeSmart Autonome
# Application autonome qui lance PayeSmart sans dépendance visible aux navigateurs

# Définition des variables
PAYESMART_PATH="/Users/claudendayambaje/Documents/Logiciel-Caisse8-main"
TEMP_LOG_FILE="/tmp/payesmart-server.log"
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
NOTIFICATION_TITLE="PayeSmart"

# Fonction pour afficher une notification
show_notification() {
    osascript -e "display notification \"$1\" with title \"$NOTIFICATION_TITLE\""
}

# Fonction de nettoyage lors de la fermeture
cleanup() {
    echo "Nettoyage en cours..."
    pkill -f "npm run dev" > /dev/null 2>&1
    exit 0
}

# Capturer les signaux pour un arrêt propre
trap cleanup SIGINT SIGTERM

# Vérifier que les répertoires existent
if [ ! -d "$PAYESMART_PATH" ]; then
    show_notification "Erreur: Répertoire PayeSmart introuvable"
    exit 1
fi

# Vérifier que Chrome est installé
if [ ! -f "$CHROME_PATH" ]; then
    show_notification "Erreur: Google Chrome est requis pour PayeSmart"
    exit 1
fi

# Afficher une notification de démarrage
show_notification "Démarrage de PayeSmart en cours..."

# Démarrer le serveur en arrière-plan
echo "Démarrage du serveur PayeSmart..."
cd "$PAYESMART_PATH" && npm run dev > "$TEMP_LOG_FILE" 2>&1 &
SERVER_PID=$!

# Attendre que le serveur soit prêt
echo "Attente du démarrage du serveur..."
MAX_WAIT=90 # Augmentation du temps d'attente maximal
WAIT_COUNT=0
SERVER_URL=""

# Vérifier l'état du processus serveur
if ! ps -p $SERVER_PID > /dev/null; then
    show_notification "Erreur: Le serveur n'a pas pu démarrer"
    cat "$TEMP_LOG_FILE"
    exit 1
fi

while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    if grep -q "Local:" "$TEMP_LOG_FILE"; then
        SERVER_URL=$(grep -oE "http://localhost:[0-9]+" "$TEMP_LOG_FILE" | head -n 1)
        break
    fi
    sleep 1
    WAIT_COUNT=$((WAIT_COUNT + 1))
    echo -n "."
    
    # Vérifier à nouveau l'état du processus
    if ! ps -p $SERVER_PID > /dev/null; then
        show_notification "Erreur: Le serveur s'est arrêté de façon inattendue"
        cat "$TEMP_LOG_FILE"
        exit 1
    fi
done

# Vérifier si le serveur est prêt
if [ -z "$SERVER_URL" ]; then
    show_notification "Erreur: Délai d'attente du serveur dépassé"
    cleanup
    exit 1
fi

echo "Serveur PayeSmart démarré: $SERVER_URL"
show_notification "Serveur démarré. Lancement de l'interface..."

# Lancer Chrome en mode application (sans interface navigateur)
"$CHROME_PATH" --app="$SERVER_URL" \
    --window-size=1280,800 \
    --user-data-dir=/tmp/payesmart-chrome \
    --no-first-run \
    --no-default-browser-check \
    --disable-translate > /dev/null 2>&1 &
CHROME_PID=$!

# Attendre que Chrome soit fermé
wait $CHROME_PID

# Nettoyage final
cleanup
