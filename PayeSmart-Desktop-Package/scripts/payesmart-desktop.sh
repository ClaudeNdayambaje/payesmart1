#!/bin/bash

# PayeSmart Desktop - Version Optimisée
# Ce script lance PayeSmart dans une fenêtre Chrome en mode application
# pour offrir une expérience proche d'une application desktop native

# Configuration
PAYESMART_PATH="/Users/claudendayambaje/Documents/Logiciel-Caisse8-main"

# Fonction pour afficher un message avec une barre de progression
show_progress() {
  local message=$1
  local duration=$2
  echo -n "$message "
  for i in $(seq 1 $duration); do
    echo -n "."
    sleep 1
  done
  echo ""
}

# Bannière
echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║              PAYESMART DESKTOP                ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# Vérifier si le chemin existe
if [ ! -d "$PAYESMART_PATH" ]; then
  echo "❌ ERREUR: Le chemin vers PayeSmart n'existe pas: $PAYESMART_PATH"
  exit 1
fi

# Nettoyer l'environnement
echo "🧹 Nettoyage de l'environnement..."
pkill -f "vite.*dev" >/dev/null 2>&1 || true
pkill -f "Google Chrome.*--app=http://localhost" >/dev/null 2>&1 || true
sleep 1

# Créer un fichier temporaire pour capturer la sortie
TEMP_LOG_FILE=$(mktemp)

# Démarrer le serveur de développement
echo "🚀 Démarrage du serveur de développement PayeSmart..."
cd "$PAYESMART_PATH" && npm run dev > "$TEMP_LOG_FILE" 2>&1 &
VITE_PID=$!

# Attendre que le serveur démarre et détecter le port
show_progress "⏳ Initialisation du serveur" 5

# Trouver le port dans le fichier de log
PORT=""
for i in {1..10}; do
  if grep -q "Local:.*http://localhost:[0-9]\+" "$TEMP_LOG_FILE"; then
    PORT=$(grep -o "Local:.*http://localhost:[0-9]\+" "$TEMP_LOG_FILE" | grep -o '[0-9]\+' | tail -1)
    break
  fi
  sleep 1
done

# Vérifier si le port a été détecté
if [ -z "$PORT" ]; then
  echo "⚠️ Impossible de détecter automatiquement le port. Analyse du fichier log:"
  cat "$TEMP_LOG_FILE"
  echo "⚠️ Tentative avec le port 3000 par défaut..."
  PORT=3000
fi

# URL complète
APP_URL="http://localhost:$PORT"
echo "✅ Application prête sur: $APP_URL"

# Attendre encore quelques secondes
show_progress "🔄 Préparation de l'interface" 3

# Lancer Chrome en mode application avec une fenêtre optimisée
echo "🖥️ Lancement de PayeSmart Desktop..."
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --app="$APP_URL" \
  --window-size=1280,800 \
  --window-position=center \
  --user-data-dir="/tmp/payesmart-desktop-profile" \
  --no-first-run \
  --disable-extensions \
  --disable-translate \
  --autoplay-policy=no-user-gesture-required \
  --disable-features=TranslateUI \
  --disable-popup-blocking \
  >/dev/null 2>&1 &
CHROME_PID=$!

echo "⭐ PayeSmart Desktop est lancé!"
echo "📝 Pour quitter l'application, fermez la fenêtre et appuyez sur Ctrl+C dans ce terminal"

# Nettoyer à la sortie
function cleanup() {
  echo "👋 Fermeture de PayeSmart Desktop..."
  kill $VITE_PID 2>/dev/null || true
  kill $CHROME_PID 2>/dev/null || true
  rm -f "$TEMP_LOG_FILE"
  exit 0
}

trap cleanup INT TERM EXIT

# Attendre que le processus serveur se termine
wait $VITE_PID
