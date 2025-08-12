// Script pour gérer les liens d'administration de manière dynamique
document.addEventListener('DOMContentLoaded', function() {
    // Fonction pour mettre à jour tous les liens d'administration
    function updateAdminLinks() {
        // Détecter si nous sommes sur Netlify ou en local
        const isNetlify = window.location.hostname.includes('netlify.app') || 
                         !window.location.hostname.includes('localhost');
        
        // Base URL pour les liens admin
        let baseUrl = '';
        
        if (isNetlify) {
            // Sur Netlify - utiliser l'URL de base du site actuel
            baseUrl = window.location.origin;
        } else {
            // En local - utiliser l'URL du serveur de développement React
            baseUrl = 'http://localhost:5173';
        }
        
        console.log('Environnement détecté :', isNetlify ? 'Production (Netlify)' : 'Développement local');
        console.log('URL de base pour les liens admin :', baseUrl);
        
        // Trouver tous les boutons d'administration
        const adminLinks = document.querySelectorAll('a[href*="/admin/"]');
        
        // Mettre à jour chaque lien
        adminLinks.forEach(link => {
            // Extraire le chemin relatif (après le /#/)
            let path = link.getAttribute('href');
            
            // Traitement spécial pour /admin/saas - ne pas modifier ce lien
            if (path === '/admin/saas' || path === '/#/admin/saas') {
                console.log('Lien admin/saas conservé tel quel:', path);
                return; // Passer au lien suivant sans modification
            }
            
            // Si le lien commence par "/" ou "/#/", le traiter comme un chemin relatif
            if (path.startsWith('/') || path.startsWith('/#/')) {
                // S'assurer que le chemin commence par '/#/'
                if (!path.startsWith('/#/')) {
                    path = '/#' + path;
                }
                
                // Construire l'URL complète
                const fullUrl = baseUrl + path;
                
                // Mettre à jour le lien
                link.setAttribute('href', fullUrl);
                console.log('Lien mis à jour:', path, '->', fullUrl);
            }
        });
    }
    
    // Exécuter la mise à jour des liens
    updateAdminLinks();
});
