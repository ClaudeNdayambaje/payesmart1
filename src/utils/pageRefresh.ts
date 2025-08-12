/**
 * Utilitaire pour gérer l'actualisation automatique de la page après la connexion
 * Cette fonction permet d'actualiser la page pour appliquer correctement les thèmes
 * et paramètres du nouvel utilisateur connecté
 */

/**
 * Actualise la page pour appliquer les thèmes et paramètres du nouvel utilisateur
 */
export const refreshPageAfterLogin = (): void => {
  console.log('Fonction de rechargement désactivée pour éviter les doubles mises à jour');
  
  // Ne rien faire pour éviter la double mise à jour
  // L'application du thème est déjà gérée par le composant EmployeeLogin
  
  // Ancien code - désactivé pour éviter les doubles rechargements:
  /*
  // Ajouter un petit délai pour laisser le temps aux données de se charger
  setTimeout(() => {
    if (typeof window !== 'undefined') {
      // Sauvegarder un indicateur dans sessionStorage pour indiquer que c'est un rafraîchissement post-connexion
      sessionStorage.setItem('justLoggedIn', 'true');
      
      // Enregistrer l'URL actuelle pour y revenir après le rafraîchissement
      const currentPath = window.location.hash;
      if (currentPath) {
        sessionStorage.setItem('returnToPath', currentPath);
      }
      
      // Actualiser la page
      window.location.reload();
    }
  }, 500);
  */
};

/**
 * Vérifie si l'utilisateur vient de se connecter et restaure le chemin si nécessaire
 * À appeler lors du chargement initial de l'application
 */
export const handlePostLoginNavigation = (): void => {
  if (typeof window !== 'undefined') {
    const justLoggedIn = sessionStorage.getItem('justLoggedIn');
    const returnToPath = sessionStorage.getItem('returnToPath');
    
    if (justLoggedIn === 'true') {
      // Nettoyer les indicateurs
      sessionStorage.removeItem('justLoggedIn');
      
      if (returnToPath) {
        sessionStorage.removeItem('returnToPath');
        // Si l'URL actuelle ne contient pas déjà le chemin, y naviguer
        if (window.location.hash !== returnToPath) {
          window.location.hash = returnToPath;
        }
      }
      
      console.log('Page actualisée après connexion, thèmes et paramètres appliqués');
    }
  }
};
