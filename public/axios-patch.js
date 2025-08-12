// Script de contournement pour les problèmes d'importation d'Axios
(function() {
  // S'exécute avant que le reste de l'application se charge
  window.addEventListener('DOMContentLoaded', function() {
    console.log('[AXIOS PATCH] Initialisation du patch Axios');
    
    // Créer un faux module Axios pour intercepter les importations
    const fakeModule = {
      create: function(config) {
        console.log('[AXIOS PATCH] Axios.create appelé avec config:', config);
        return window.axios.create(config);
      },
      get: window.axios.get,
      post: window.axios.post,
      put: window.axios.put,
      delete: window.axios.delete,
      patch: window.axios.patch,
      interceptors: window.axios.interceptors,
      defaults: window.axios.defaults,
      // Autres méthodes/propriétés importantes d'Axios
      all: window.axios.all,
      spread: window.axios.spread,
      isAxiosError: window.axios.isAxiosError
    };
    
    // Remplacer le module Axios dans le système d'import
    const originalImport = window.importShim || window.import;
    if (originalImport) {
      // Remplacer la fonction d'importation pour intercepter les importations d'Axios
      window.importShim = function(specifier, ...args) {
        if (specifier === 'axios') {
          console.log('[AXIOS PATCH] Interception de l\'importation d\'Axios');
          return Promise.resolve(fakeModule);
        }
        return originalImport.call(this, specifier, ...args);
      };
    }
    
    // Rendre Axios disponible au niveau global
    window.axiosInstance = window.axios;
    
    console.log('[AXIOS PATCH] Patch Axios installé avec succès');
  });
})();
