// Script pour les boutons "Voir plus" des fonctionnalités
document.addEventListener('DOMContentLoaded', function() {
    // Sélectionner tous les boutons de toggle
    const toggleButtons = document.querySelectorAll('.feature-toggle');
    
    // Ajouter un écouteur d'événement à chaque bouton
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Trouver le conteneur parent
            const featureContent = this.closest('.feature-content');
            
            // Trouver la div du texte complet
            const fullContent = featureContent.querySelector('.feature-full');
            
            // Vérifier si le contenu est déjà affiché
            const isExpanded = fullContent.classList.contains('show');
            
            // Alterner l'affichage
            if (isExpanded) {
                fullContent.classList.remove('show');
                this.textContent = 'Voir plus';
                this.classList.remove('active');
                
                // Faire défiler pour voir la carte complètement
                setTimeout(() => {
                    const card = this.closest('.feature-card');
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            } else {
                fullContent.classList.add('show');
                this.textContent = 'Voir moins';
                this.classList.add('active');
            }
        });
    });
});
