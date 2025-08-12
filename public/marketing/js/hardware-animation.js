// Animation pour la section "Matériel compatible"

document.addEventListener('DOMContentLoaded', function() {
    // Observer pour détecter quand les éléments apparaissent dans le viewport
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // Si l'élément est visible
            if (entry.isIntersecting) {
                // Récupérer le délai d'animation depuis l'attribut data-aos-delay
                const delay = entry.target.getAttribute('data-aos-delay') || 0;
                
                // Ajouter la classe visible avec le délai approprié
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, delay);
                
                // Arrêter d'observer une fois l'animation appliquée
                observer.unobserve(entry.target);
            }
        });
    }, {
        root: null, // viewport
        threshold: 0.1, // déclencher quand 10% de l'élément est visible
        rootMargin: '0px'
    });

    // Observer toutes les cartes matériel
    document.querySelectorAll('.hardware-card').forEach(card => {
        observer.observe(card);
    });
    
    // Ajout d'effet hover amélioré
    const hardwareCards = document.querySelectorAll('.hardware-card');
    
    hardwareCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
            this.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.15)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
        });
    });
});
