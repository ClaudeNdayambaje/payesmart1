/**
 * PAYESMART - FONCTIONNALITÉ VOIR PLUS
 * Script pour gérer l'affichage des descriptions d'accessoires
 * Version 1.0
 */

document.addEventListener('DOMContentLoaded', () => {
    // Fonction pour initialiser les boutons "Voir plus"
    function initVoirPlusButtons() {
        // Sélectionner tous les boutons "Voir plus"
        const voirPlusButtons = document.querySelectorAll('.voir-plus-btn');
        
        // Ajouter un écouteur d'événements à chaque bouton
        voirPlusButtons.forEach(button => {
            button.addEventListener('click', function(event) {
                // Éviter la propagation de l'événement
                event.preventDefault();
                event.stopPropagation();
                
                // Trouver la description correspondante (qui est un élément frère du bouton, dans le même parent)
                const description = this.parentNode.querySelector('.accessoire-description');
                
                // Toggle de la classe pour afficher/masquer la description
                description.classList.toggle('visible');
                
                // Toggle de la classe active sur le bouton
                this.classList.toggle('active');
                
                // Changer le texte du bouton
                const textSpan = this.querySelector('.voir-plus-text');
                if (description.classList.contains('visible')) {
                    textSpan.textContent = 'Masquer';
                } else {
                    textSpan.textContent = 'Voir plus';
                }
            });
        });
    }
    
    // Observer les changements dans le DOM pour détecter quand les accessoires sont chargés
    const observeDOM = (function() {
        const MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
        
        return function(obj, callback) {
            if (!obj || obj.nodeType !== 1) return;
            
            // Créer un observateur de mutations
            const mutationObserver = new MutationObserver(callback);
            
            // Observer les modifications d'enfants
            mutationObserver.observe(obj, { childList: true, subtree: true });
            
            return mutationObserver;
        };
    })();
    
    // Sélectionner le conteneur des accessoires
    const accessoiresContainer = document.querySelector('.accessoires-grid');
    
    // Si le conteneur existe, observer les changements
    if (accessoiresContainer) {
        // Observer les mutations pour détecter quand les cartes sont ajoutées
        observeDOM(accessoiresContainer, function(mutations) {
            // Vérifier si des boutons "Voir plus" ont été ajoutés
            const voirPlusButtons = document.querySelectorAll('.voir-plus-btn');
            if (voirPlusButtons.length > 0) {
                // Initialiser les boutons
                initVoirPlusButtons();
                // Arrêter l'observation une fois que les boutons sont initialisés
                this.disconnect();
            }
        });
    }
    
    // Au cas où les accessoires sont déjà chargés lors du chargement de la page
    setTimeout(function() {
        const voirPlusButtons = document.querySelectorAll('.voir-plus-btn');
        if (voirPlusButtons.length > 0) {
            initVoirPlusButtons();
        }
    }, 500);
});
