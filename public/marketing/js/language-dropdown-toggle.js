/**
 * Gestionnaire de clic pour le sélecteur de langue
 * Ajoute le comportement de basculement (toggle) au clic pour la version desktop
 */
document.addEventListener('DOMContentLoaded', function() {
    // Sélecteur pour le bouton de langue et le menu déroulant
    const languageSelectors = document.querySelectorAll('.language-selector');
    
    // Ajouter un événement de clic à chaque sélecteur de langue
    languageSelectors.forEach(selector => {
        const button = selector.querySelector('.language-button');
        const dropdown = selector.querySelector('.language-dropdown');
        
        // Au clic sur le bouton de langue
        if (button) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Vérifie si on est en version desktop (> 768px)
                if (window.innerWidth > 768) {
                    // Bascule la classe active sur le menu déroulant
                    dropdown.classList.toggle('active');
                    
                    // Ferme le menu si on clique ailleurs sur la page
                    const closeDropdown = function(event) {
                        if (!selector.contains(event.target)) {
                            dropdown.classList.remove('active');
                            document.removeEventListener('click', closeDropdown);
                        }
                    };
                    
                    // Ajoute l'événement de clic global seulement si le menu est ouvert
                    if (dropdown.classList.contains('active')) {
                        // Timeout pour éviter que l'événement soit déclenché immédiatement
                        setTimeout(() => {
                            document.addEventListener('click', closeDropdown);
                        }, 0);
                    }
                }
            });
        }
    });
    
    // Ajuste le comportement lors du redimensionnement de la fenêtre
    window.addEventListener('resize', function() {
        const dropdowns = document.querySelectorAll('.language-dropdown');
        
        // Si la fenêtre passe en mode mobile, retire la classe active
        // pour éviter les conflits avec le comportement :hover
        if (window.innerWidth <= 768) {
            dropdowns.forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        }
    });
});
