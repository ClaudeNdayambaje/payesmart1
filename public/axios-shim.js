
// Ce script résout les problèmes d'importation d'Axios sur Netlify
/* eslint-disable */
window.addEventListener('DOMContentLoaded', function() {
  console.log('[AXIOS SHIM] Initialisation');
  
  if (typeof window !== 'undefined' && window.axios) {
    const axiosModule = window.axios;
    
    // Rendre Axios disponible pour les importations ESM
    if (typeof window.define === 'function' && window.define.amd) {
      window.define('axios', [], function() {
        return axiosModule;
      });
    }
    
    // Rendre Axios disponible pour Node.js/CommonJS
    if (typeof window.module !== 'undefined' && window.module.exports) {
      window.module.exports = axiosModule;
    }
    
    console.log('[AXIOS SHIM] Installé avec succès');
  } else {
    console.warn('[AXIOS SHIM] Axios non trouvé dans window');
  }
});
