// Script pour la page Solutions

document.addEventListener('DOMContentLoaded', function() {
    // Vérification que le script s'exécute sur la bonne page
    const isSolutionsPage = document.querySelector('.solution-item, .comparison-table, .section-header');
    if (!isSolutionsPage) {
        // Cette page n'est probablement pas une page de solutions complète
        console.log('Script solutions.js chargé sur une page sans éléments de solutions');
        return;  // Ne pas continuer l'exécution si on n'est pas sur la bonne page
    }
    
    // Animation des éléments au scroll
    const fadeElements = document.querySelectorAll('.solution-item, .comparison-table, .section-header');
    
    // Ajouter la classe fade-in à tous les éléments à animer
    if (fadeElements.length > 0) {
        fadeElements.forEach(element => {
            if (element) element.classList.add('fade-in');
        });
    }
    
    // Fonction pour vérifier si un élément est visible dans la fenêtre
    function isElementInViewport(el) {
        // Vérification plus robuste que l'élément existe avant d'accéder à ses propriétés
        if (!el || typeof el !== 'object' || !(el instanceof Element)) {
            return false; // Retourne silencieusement false sans avertissement console
        }
        try {
            const rect = el.getBoundingClientRect();
            return (
                rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.8
            );
        } catch (e) {
            return false; // En cas d'erreur, retourner false silencieusement
        }
    }
    
    // Fonction pour animer les éléments visibles
    function handleScrollAnimation() {
        if (fadeElements.length === 0) return;
        
        fadeElements.forEach(element => {
            if (element && isElementInViewport(element) && !element.classList.contains('visible')) {
                element.classList.add('visible');
            }
        });
    }
    
    // Exécuter l'animation au chargement et au scroll
    handleScrollAnimation();
    window.addEventListener('scroll', handleScrollAnimation);
    
    // Animation des chiffres dans la section de comparaison
    const percentages = document.querySelectorAll('.comparison-result .percentage');
    let animated = false;
    
    function animatePercentages() {
        if (animated || percentages.length === 0) return;
        
        const comparisonSection = document.querySelector('.comparison-section');
        if (!comparisonSection || !isElementInViewport(comparisonSection)) return;
        
        animated = true;
        
        percentages.forEach(percentage => {
            if (!percentage) return;
            
            const targetValue = percentage.textContent || '0%';
            const isPositive = targetValue.includes('+');
            const numericValue = parseInt(targetValue.replace(/[^0-9]/g, '')) || 0;
            let currentValue = 0;
            
            percentage.textContent = isPositive ? '+0%' : '0%';
            
            const interval = setInterval(() => {
                if (currentValue >= numericValue) {
                    clearInterval(interval);
                    percentage.textContent = targetValue;
                    return;
                }
                
                currentValue += Math.ceil(numericValue / 30);
                if (currentValue > numericValue) currentValue = numericValue;
                
                percentage.textContent = isPositive ? `+${currentValue}%` : `-${currentValue}%`;
            }, 30);
        });
    }
    
    // Vérifier si la section de comparaison est visible au scroll
    if (document.querySelector('.comparison-section')) {
        window.addEventListener('scroll', animatePercentages);
    }
    
    // Effet de parallaxe sur les images
    const solutionImages = document.querySelectorAll('.solution-image');
    
    if (solutionImages.length > 0) {
        window.addEventListener('scroll', function() {
            solutionImages.forEach(image => {
                if (image && isElementInViewport(image)) {
                    const scrollPosition = window.scrollY;
                    const offset = scrollPosition * 0.05;
                    image.style.transform = `translateY(${offset}px)`;
                }
            });
        });
    }
    
    // Effet de survol sur les éléments de fonctionnalités
    const featureItems = document.querySelectorAll('.feature-item');
    
    featureItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            const icon = this.querySelector('.feature-icon');
            icon.style.transform = 'scale(1.1)';
            icon.style.background = 'rgba(79, 70, 229, 0.2)';
        });
        
        item.addEventListener('mouseleave', function() {
            const icon = this.querySelector('.feature-icon');
            icon.style.transform = 'scale(1)';
            icon.style.background = 'rgba(79, 70, 229, 0.1)';
        });
    });
});
