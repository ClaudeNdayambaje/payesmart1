/**
 * PayeSmart - Améliorations de responsivité pour la page Accessoires
 * Optimise l'expérience utilisateur sur les appareils mobiles et tablettes
 * Version 1.0
 */

document.addEventListener('DOMContentLoaded', function() {
    // Optimisation des filtres de catégories sur mobile
    function optimizeFiltersForMobile() {
        const filterContainer = document.querySelector('.category-filter');
        if (!filterContainer) return;
        
        // Détection des appareils à écran tactile
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        if (isTouchDevice && window.innerWidth <= 768) {
            // Ajouter une indication visuelle de défilement horizontal
            const scrollIndicator = document.createElement('div');
            scrollIndicator.className = 'scroll-indicator';
            scrollIndicator.innerHTML = '<span>◄</span><span>►</span>';
            scrollIndicator.style.cssText = `
                position: absolute;
                bottom: -20px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 12px;
                color: #999;
                opacity: 0.7;
                display: flex;
                gap: 10px;
            `;
            
            // Ajouter l'indicateur après le conteneur de filtres
            filterContainer.style.position = 'relative';
            filterContainer.parentNode.insertBefore(scrollIndicator, filterContainer.nextSibling);
            
            // Masquer l'indicateur après un délai
            setTimeout(() => {
                scrollIndicator.style.opacity = '0';
                scrollIndicator.style.transition = 'opacity 0.5s';
                
                // Supprimer l'élément après la transition
                setTimeout(() => {
                    scrollIndicator.remove();
                }, 500);
            }, 3000);
        }
    }
    
    // Optimisation de l'affichage des images
    function optimizeImagesForMobile() {
        const accessoireImages = document.querySelectorAll('.accessoire-image img');
        
        accessoireImages.forEach(img => {
            // S'assurer que l'image est complètement chargée avant d'appliquer des styles
            img.onload = function() {
                // Vérifier le ratio de l'image
                const imgRatio = img.naturalWidth / img.naturalHeight;
                
                if (imgRatio > 1.5) {
                    // Image très large, ajuster le position
                    img.style.objectPosition = 'center';
                } else if (imgRatio < 0.7) {
                    // Image très haute, ajuster le position
                    img.style.objectPosition = 'center top';
                }
            };
            
            // Pour les images déjà chargées
            if (img.complete) {
                img.onload();
            }
        });
    }
    
    // Amélioration de l'expérience de clic sur mobile
    function enhanceMobileClickExperience() {
        const accessoireCards = document.querySelectorAll('.accessoire-card');
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        if (isTouchDevice) {
            accessoireCards.forEach(card => {
                // Ajouter un feedback tactile
                card.addEventListener('touchstart', function() {
                    this.style.transform = 'scale(0.98)';
                    this.style.transition = 'transform 0.1s';
                });
                
                card.addEventListener('touchend', function() {
                    this.style.transform = '';
                });
                
                // Empêcher les clics fantômes
                card.addEventListener('touchmove', function(e) {
                    e.preventDefault();
                }, { passive: false });
            });
        }
    }
    
    // Gestion de l'orientation de l'écran
    function handleOrientationChange() {
        const accessoiresGrid = document.querySelector('.accessoires-grid');
        
        window.addEventListener('orientationchange', function() {
            // Petite animation pour indiquer le rechargement de la mise en page
            if (accessoiresGrid) {
                accessoiresGrid.style.opacity = '0.8';
                accessoiresGrid.style.transition = 'opacity 0.3s';
                
                setTimeout(() => {
                    accessoiresGrid.style.opacity = '1';
                }, 300);
            }
        });
    }
    
    // Initialiser les optimisations
    optimizeFiltersForMobile();
    optimizeImagesForMobile();
    enhanceMobileClickExperience();
    handleOrientationChange();
    
    // Réexécuter les optimisations si la taille de la fenêtre change
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            optimizeFiltersForMobile();
            optimizeImagesForMobile();
        }, 250);
    });
});
