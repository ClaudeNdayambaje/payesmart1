/**
 * Utilitaires pour vérifier l'état du réseau
 */

/**
 * Vérifie si l'utilisateur est connecté à Internet
 * @returns True si connecté, False sinon
 */
export const isOnline = (): boolean => {
  return navigator.onLine;
};

/**
 * Vérifie si l'utilisateur est connecté à Internet et renvoie un message approprié
 * @returns Un objet avec le statut et un message
 */
export const checkConnection = (): { online: boolean; message: string } => {
  const online = isOnline();
  
  return {
    online,
    message: online 
      ? 'Connexion Internet active'
      : 'Aucune connexion Internet détectée. Veuillez vérifier votre connexion et réessayer.'
  };
};

/**
 * Vérifie si l'API Firebase est accessible
 * @returns Promise avec le statut de la connexion à Firebase
 */
export const checkFirebaseConnection = async (): Promise<{ connected: boolean; message: string }> => {
  // Vérifier d'abord si nous sommes en ligne
  if (!isOnline()) {
    return {
      connected: false,
      message: 'Aucune connexion Internet détectée'
    };
  }
  
  try {
    // Tenter d'accéder à l'API Firebase (peut être remplacé par une vérification plus spécifique)
    await fetch('https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel', {
      method: 'OPTIONS',
      mode: 'no-cors' // Nécessaire car l'API ne permet pas les requêtes CORS normales
    });
    
    // Si nous arrivons ici, on suppose que la connexion est OK
    // Même si nous ne pouvons pas vérifier le code de statut (à cause de no-cors)
    return {
      connected: true,
      message: 'Connexion à Firebase établie'
    };
    
  } catch (error) {
    console.error('Erreur lors de la vérification de la connexion Firebase:', error);
    return {
      connected: false,
      message: 'Impossible de se connecter à Firebase. Vérifiez votre connexion Internet ou réessayez plus tard.'
    };
  }
};

/**
 * Vérifie périodiquement l'état de la connexion et déclenche un callback en cas de changement
 * @param callback Fonction à appeler lorsque l'état de la connexion change
 * @returns Fonction pour annuler l'écoute
 */
export const listenToConnectionChanges = (
  callback: (online: boolean) => void
): () => void => {
  // État initial
  let previousState = navigator.onLine;
  callback(previousState);
  
  // Gestionnaires d'événements
  const handleOnline = () => {
    if (!previousState) {
      previousState = true;
      callback(true);
    }
  };
  
  const handleOffline = () => {
    if (previousState) {
      previousState = false;
      callback(false);
    }
  };
  
  // Ajouter les écouteurs
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Fonction de nettoyage
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};
