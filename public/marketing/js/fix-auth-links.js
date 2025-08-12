// Script pour corriger les liens d'authentification sur Netlify
document.addEventListener('DOMContentLoaded', function() {
    // Détecter si nous sommes sur Netlify ou en local
    const isNetlify = window.location.hostname.includes('netlify.app') || 
                     !window.location.hostname.includes('localhost');
    
    // Base URL pour les liens auth
    let authBaseUrl = '';
    
    if (isNetlify) {
        // Sur Netlify - utiliser l'URL de base du site actuel
        authBaseUrl = window.location.origin;
    } else {
        // En local - utiliser localhost:3002 (serveur d'authentification)
        authBaseUrl = 'http://localhost:3002';
    }
    
    console.log('Environnement détecté :', isNetlify ? 'Production (Netlify)' : 'Développement local');
    console.log('URL de base pour les liens auth :', authBaseUrl);
    
    // Trouver tous les liens d'authentification (contenant #/auth)
    const authLinks = document.querySelectorAll('a[href*="/#/auth"], a[href*="localhost:3002/#/auth"]');
    
    // Mettre à jour chaque lien
    authLinks.forEach(link => {
        // Obtenir l'URL actuelle
        const currentHref = link.getAttribute('href');
        
        // Extraire le chemin d'authentification (/auth ou /auth?register=true)
        let authPath = '';
        
        if (currentHref.includes('/#/auth')) {
            // Format /#/auth ou /#/auth?register=true
            authPath = currentHref.substring(currentHref.indexOf('/#/auth'));
        } else if (currentHref.includes('localhost:3002/#/auth')) {
            // Format http://localhost:3002/#/auth ou http://localhost:3002/#/auth?register=true
            authPath = currentHref.substring(currentHref.indexOf('/#/auth'));
        }
        
        if (authPath) {
            // Construire la nouvelle URL
            const newHref = isNetlify ? authPath : authBaseUrl + authPath;
            
            // Mettre à jour le lien
            link.setAttribute('href', newHref);
            console.log('Lien auth mis à jour :', currentHref, '->', newHref);
        }
    });
});
