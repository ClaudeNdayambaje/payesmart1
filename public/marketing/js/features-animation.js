// Script pour l'animation des cartes de fonctionnalités

document.addEventListener('DOMContentLoaded', function() {
    // Fonction pour vérifier si un élément est visible dans la fenêtre
    function isElementInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }

    // Fonction pour animer les éléments au scroll
    function handleScrollAnimation() {
        const featureCards = document.querySelectorAll('.feature-card');
        
        featureCards.forEach(card => {
            if (isElementInViewport(card)) {
                // Récupérer le délai d'animation depuis l'attribut data-aos-delay
                const delay = card.getAttribute('data-aos-delay') || 0;
                
                // Appliquer l'animation avec le délai
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, delay);
            }
        });
    }

    // Exécuter une fois au chargement
    handleScrollAnimation();
    
    // Puis à chaque défilement
    window.addEventListener('scroll', handleScrollAnimation);
});
