/**
 * Gestion du header transparent de PayeSmart
 * Ce script détecte le défilement de la page et ajoute/supprime la classe 'scrolled'
 * au header pour créer un effet de transition entre transparent et semi-transparent
 */

document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('.header');
    
    // Vérifier que le header existe avant de continuer
    if (!header) return;
    
    // Fonction pour vérifier la position du défilement
    function checkScroll() {
        // Si on a défilé de plus de 50px, on ajoute la classe 'scrolled'
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
    
    // Vérifier dès le chargement (important si la page est rechargée en milieu de défilement)
    checkScroll();
    
    // Optimisation avec requestAnimationFrame pour de meilleures performances
    let ticking = false;
    window.addEventListener('scroll', function() {
        if (!ticking) {
            window.requestAnimationFrame(function() {
                checkScroll();
                ticking = false;
            });
            ticking = true;
        }
    });
    
    // S'assurer que tous les liens de navigation sont cliquables
    const navLinks = document.querySelectorAll('.main-nav a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Assurer que l'événement se propage correctement
            e.stopPropagation();
        });
    });
});
