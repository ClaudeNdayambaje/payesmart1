// Script principal pour PayeSmart Electron
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const Store = require('electron-store');

// Importer le service de connectivité
const connectivityService = require('./src/connectivity-service');

// Activer l'API remote pour la communication entre les processus
require('@electron/remote/main').initialize();

// Configuration du stockage local
const store = new Store({
  name: 'payesmart-settings',
  defaults: {
    theme: 'light',
    offlineMode: false,
    lastLogin: null,
    rememberUser: false,
    appMode: 'online'
  }
});

// Variable pour stocker la référence à la fenêtre principale
let mainWindow;

// État de l'application
let appState = {
  isOffline: store.get('offlineMode', false),
  pendingTransactions: 0,
  retryCount: 0,
  connectionCheckInterval: null
};

function createWindow() {
  console.log('Création de la fenêtre PayeSmart');
  
  // Création de la fenêtre principale avec les paramètres appropriés
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 700,
    show: false, // Ne pas afficher immédiatement pour éviter le flash blanc
    webPreferences: {
      preload: path.join(__dirname, 'src', 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: true
    },
    icon: path.join(__dirname, 'src', 'icon', 'icon.png')
  });

  // Activer l'API remote pour cette fenêtre
  require('@electron/remote/main').enable(mainWindow.webContents);

  // Charger la page de démarrage (interface principale de PayeSmart)
  mainWindow.loadFile(path.join(__dirname, 'src', 'app', 'index.html'));
  
  // En cas d'erreur de chargement, revenir à la page de diagnostic
  mainWindow.webContents.on('did-fail-load', () => {
    console.log('Échec du chargement de l\'interface principale, tentative de chargement de la page d\'erreur');
    mainWindow.loadFile(path.join(__dirname, 'src', 'error.html'));
  });

  // Afficher les outils de développement en mode développement
  if (isDev) {
    mainWindow.webContents.openDevTools();
    console.log('Mode développement activé');
  }

  // Afficher la fenêtre une fois chargée pour éviter le flash blanc
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Gestion de la fermeture de la fenêtre
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Lancement de l'application quand Electron est prêt
app.whenReady().then(() => {
  createWindow();
  setupIpcHandlers();
  startConnectionMonitoring();
});

// Quitter quand toutes les fenêtres sont fermées, sauf sur macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Sur macOS, recréer une fenêtre quand l'icône du dock est cliquée
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('Erreur non capturée:', error);
  // Envoyer une notification à la fenêtre principale si disponible
  if (mainWindow) {
    mainWindow.webContents.send('error', {
      type: 'uncaught',
      message: error.message,
      stack: error.stack
    });
  }
});

// Configuration des gestionnaires d'événements IPC pour les communications entre processus
function setupIpcHandlers() {
  // Gestionnaires pour l'API globale
  ipcMain.handle('app:get-connection-status', async () => {
    return new Promise(resolve => {
      connectivityService.checkConnectivity(isConnected => {
        // Ne pas changer l'état offline si ce mode a été activé manuellement
        if (appState.isOffline && store.get('offlineMode', false)) {
          resolve({ isOffline: true, pendingCount: appState.pendingTransactions });
        } else {
          appState.isOffline = !isConnected;
          resolve({ isOffline: appState.isOffline, pendingCount: appState.pendingTransactions });
        }
      });
    });
  });
  
  ipcMain.handle('app:toggle-connection-mode', async () => {
    // Basculer entre le mode en ligne et hors ligne
    appState.isOffline = !appState.isOffline;
    store.set('offlineMode', appState.isOffline);
    
    // Notifier tous les renderers du changement d'état
    if (mainWindow) {
      mainWindow.webContents.send('connection-status-changed', { 
        isOffline: appState.isOffline, 
        pendingCount: appState.pendingTransactions 
      });
    }
    
    return appState.isOffline;
  });
  
  ipcMain.handle('app:is-offline-mode', async () => {
    return appState.isOffline;
  });
  
  ipcMain.handle('app:get-pending-transactions-count', async () => {
    // Cette fonction devrait venir d'un service qui gère les transactions locales
    // Pour l'exemple, nous retournons la valeur stockée dans l'état
    return appState.pendingTransactions;
  });
  
  // Gestionnaire pour l'authentification Firebase
  ipcMain.handle('app:firebase-authenticate', async (event, email, password) => {
    // Avant de tenter l'authentification, vérifier la connexion Internet
    return new Promise(resolve => {
      connectivityService.checkConnectivity(isConnected => {
        if (!isConnected && !appState.isOffline) {
          // Connexion perdue mais pas en mode hors ligne
          resolve({ success: false, error: 'Aucune connexion Internet disponible', code: 'no-internet' });
        } else if (appState.isOffline) {
          // Mode hors ligne activé, vérifier les identifiants locaux
          // Ici, implémenter la logique d'authentification locale
          resolve({ success: true, mode: 'offline', message: 'Connecté en mode hors ligne' });
        } else {
          // Tentative d'authentification en ligne (à implémenter avec Firebase)
          // Pour le moment, simuler une authentification réussie
          resolve({ success: true, mode: 'online', message: 'Connecté avec succès' });
        }
      });
    });
  });
  
  // Gestionnaire pour la synchronisation des données hors ligne
  ipcMain.handle('app:sync-offline-data', async () => {
    // Vérifier d'abord si une connexion est disponible
    return new Promise(resolve => {
      connectivityService.checkConnectivity(isConnected => {
        if (!isConnected) {
          resolve({ success: false, error: 'Aucune connexion Internet disponible' });
          return;
        }
        
        // Logique de synchronisation à implémenter
        // Simuler une synchronisation réussie pour l'instant
        setTimeout(() => {
          appState.pendingTransactions = 0;
          appState.isOffline = false;
          store.set('offlineMode', false);
          
          // Notifier les renderers du changement
          if (mainWindow) {
            mainWindow.webContents.send('connection-status-changed', { 
              isOffline: false, 
              pendingCount: 0 
            });
          }
          
          resolve({ success: true, count: 5, message: 'Synchronisation réussie' });
        }, 1500);
      });
    });
  });

  // Gestionnaire pour charger l'interface
  ipcMain.handle('app:load-interface', async (event, mode) => {
    // Logique pour charger l'interface appropriée (en ligne/hors ligne)
    // Ici, vous pourriez rediriger vers une page différente ou charger des composants différents
    // Pour l'exemple, nous retournons simplement le mode
    store.set('appMode', mode);
    return { mode, timestamp: Date.now() };
  });
}

// Démarrer la surveillance de la connexion
function startConnectionMonitoring() {
  // Vérifier immédiatement la connexion au démarrage
  connectivityService.checkConnectivity(isConnected => {
    console.log(`État initial de la connexion: ${isConnected ? 'connecté' : 'déconnecté'}`);
    
    // Ne pas modifier l'état offline si ce mode a été activé manuellement
    if (!store.get('offlineMode', false)) {
      appState.isOffline = !isConnected;
      
      // Notifier la fenêtre principale si elle existe déjà
      if (mainWindow) {
        mainWindow.webContents.send('connection-status-changed', { 
          isOffline: appState.isOffline, 
          pendingCount: appState.pendingTransactions 
        });
      }
    }
  });
  
  // Vérifier périodiquement la connexion
  appState.connectionCheckInterval = setInterval(() => {
    connectivityService.checkConnectivity(isConnected => {
      // Ne pas modifier l'état offline si ce mode a été activé manuellement
      if (!store.get('offlineMode', false)) {
        const previousState = appState.isOffline;
        appState.isOffline = !isConnected;
        
        // Si l'état a changé, notifier la fenêtre principale
        if (previousState !== appState.isOffline && mainWindow) {
          console.log(`État de la connexion modifié: ${appState.isOffline ? 'déconnecté' : 'connecté'}`);
          mainWindow.webContents.send('connection-status-changed', { 
            isOffline: appState.isOffline, 
            pendingCount: appState.pendingTransactions 
          });
        }
      }
    });
  }, connectivityService.CONFIG.checkInterval);
}
