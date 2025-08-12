// Script de débogage pour capturer les erreurs JavaScript
(function() {
  // Enregistrer les erreurs originales
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;
  
  // Stocker les erreurs capturées
  window.capturedErrors = [];
  window.capturedWarnings = [];
  window.capturedLogs = [];
  
  // Surcharger console.error
  console.error = function() {
    // Appeler la fonction originale
    originalConsoleError.apply(console, arguments);
    
    // Stocker l'erreur
    const errorArgs = Array.from(arguments).map(arg => {
      if (arg instanceof Error) {
        return {
          message: arg.message,
          stack: arg.stack,
          name: arg.name
        };
      }
      return arg;
    });
    
    window.capturedErrors.push({
      timestamp: new Date().toISOString(),
      args: errorArgs
    });
    
    // Afficher un message dans un élément div sur la page
    updateDebugDisplay();
  };
  
  // Surcharger console.warn
  console.warn = function() {
    // Appeler la fonction originale
    originalConsoleWarn.apply(console, arguments);
    
    // Stocker l'avertissement
    const warnArgs = Array.from(arguments);
    window.capturedWarnings.push({
      timestamp: new Date().toISOString(),
      args: warnArgs
    });
    
    // Mettre à jour l'affichage de débogage
    updateDebugDisplay();
  };
  
  // Surcharger console.log pour les logs importants
  console.log = function() {
    // Appeler la fonction originale
    originalConsoleLog.apply(console, arguments);
    
    // Stocker le log
    const logArgs = Array.from(arguments);
    window.capturedLogs.push({
      timestamp: new Date().toISOString(),
      args: logArgs
    });
    
    // Limiter à 100 logs maximum pour éviter de surcharger la mémoire
    if (window.capturedLogs.length > 100) {
      window.capturedLogs.shift();
    }
    
    // Ne pas mettre à jour l'affichage pour les logs (trop nombreux)
  };
  
  // Intercepter les erreurs non capturées
  window.addEventListener('error', function(event) {
    window.capturedErrors.push({
      timestamp: new Date().toISOString(),
      type: 'uncaught',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error ? {
        message: event.error.message,
        stack: event.error.stack,
        name: event.error.name
      } : null
    });
    
    updateDebugDisplay();
    
    // Ne pas empêcher le comportement par défaut
    return false;
  });
  
  // Intercepter les rejets de promesses non gérés
  window.addEventListener('unhandledrejection', function(event) {
    window.capturedErrors.push({
      timestamp: new Date().toISOString(),
      type: 'unhandledrejection',
      reason: event.reason instanceof Error ? {
        message: event.reason.message,
        stack: event.reason.stack,
        name: event.reason.name
      } : event.reason
    });
    
    updateDebugDisplay();
    
    // Ne pas empêcher le comportement par défaut
    return false;
  });
  
  // Fonction pour mettre à jour l'affichage de débogage
  function updateDebugDisplay() {
    // Créer l'élément de débogage s'il n'existe pas
    let debugEl = document.getElementById('js-debug-display');
    if (!debugEl) {
      debugEl = document.createElement('div');
      debugEl.id = 'js-debug-display';
      debugEl.style.position = 'fixed';
      debugEl.style.bottom = '10px';
      debugEl.style.right = '10px';
      debugEl.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      debugEl.style.color = '#ff5555';
      debugEl.style.padding = '10px';
      debugEl.style.borderRadius = '5px';
      debugEl.style.maxWidth = '80%';
      debugEl.style.maxHeight = '200px';
      debugEl.style.overflow = 'auto';
      debugEl.style.zIndex = '9999';
      debugEl.style.fontSize = '12px';
      debugEl.style.fontFamily = 'monospace';
      document.body.appendChild(debugEl);
    }
    
    // Afficher les dernières erreurs
    const errorCount = window.capturedErrors.length;
    const warningCount = window.capturedWarnings.length;
    
    let html = `<strong>Erreurs JavaScript (${errorCount})</strong><br>`;
    
    if (errorCount > 0) {
      // Afficher les 3 dernières erreurs
      const recentErrors = window.capturedErrors.slice(-3);
      html += recentErrors.map((error, index) => {
        const errorMsg = error.type === 'uncaught' 
          ? `${error.message} at ${error.filename}:${error.lineno}:${error.colno}`
          : error.type === 'unhandledrejection'
            ? `Unhandled rejection: ${error.reason.message || JSON.stringify(error.reason)}`
            : Array.isArray(error.args) 
              ? error.args.map(arg => JSON.stringify(arg)).join(', ')
              : JSON.stringify(error.args);
        
        return `${index + 1}. ${errorMsg}`;
      }).join('<br>');
    } else {
      html += 'Aucune erreur détectée';
    }
    
    html += `<br><br><strong>Avertissements (${warningCount})</strong><br>`;
    
    if (warningCount > 0) {
      // Afficher les 3 derniers avertissements
      const recentWarnings = window.capturedWarnings.slice(-3);
      html += recentWarnings.map((warning, index) => {
        const warnMsg = Array.isArray(warning.args) 
          ? warning.args.map(arg => JSON.stringify(arg)).join(', ')
          : JSON.stringify(warning.args);
        
        return `${index + 1}. ${warnMsg}`;
      }).join('<br>');
    } else {
      html += 'Aucun avertissement détecté';
    }
    
    debugEl.innerHTML = html;
  }
  
  // Initialiser l'affichage
  window.setTimeout(updateDebugDisplay, 1000);
  
  console.log('Script de débogage JavaScript chargé');
})();
