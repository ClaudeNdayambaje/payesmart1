// Script dédié à la redirection vers la page d'administration
document.addEventListener('DOMContentLoaded', function() {
    // Désactiver les gestionnaires d'événements personnalisés pour permettre aux liens HTML de fonctionner
    // directement avec les URLs complètes que nous avons définis
    
    // Note: On laisse ce code en commentaire en cas de besoin futur
    /*
    const adminButton = document.querySelector('.btn-admin');
    if (adminButton) {
        console.log('Bouton d\'administration trouvé, mais laissé avec son comportement par défaut');
        // On ne fait rien pour laisser le lien HTML fonctionner normalement
    }
    */
    
    console.log('La redirection est maintenant gérée directement par les liens HTML avec des URLs complètes');
    
    // Gestion du bouton de déconnexion
    const logoutButton = document.querySelector('.btn-logout');
    if (logoutButton) {
        console.log('Bouton de déconnexion trouvé, configuration de la redirection...');
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            // Construction de l'URL absolue
            const baseUrl = window.location.origin;
            const logoutUrl = baseUrl + '/#/auth/logout';
            
            console.log('Déconnexion et redirection vers:', logoutUrl);
            
            // Déconnexion et redirection
            window.location.href = logoutUrl;
            return false;
        });
    }
});
