// Script de correction pour la popup et les boutons CTA
document.addEventListener('DOMContentLoaded', function() {
    // Fonction pour corriger l'affichage des boutons CTA
    function fixPopupCTA() {
        console.log("Script de correction popup lancé");
        
        // Sélection des éléments
        const popupOverlay = document.getElementById('featuresPopupOverlay');
        const ctaButtons = document.querySelector('.cta-buttons');
        
        if (popupOverlay && ctaButtons) {
            console.log("Éléments trouvés, application des corrections");
            
            // Force l'application des styles directement 
            ctaButtons.style.display = 'flex';
            ctaButtons.style.flexDirection = 'row';
            ctaButtons.style.gap = '15px';
            ctaButtons.style.justifyContent = 'center';
            ctaButtons.style.flexWrap = 'nowrap';
            
            // Forcer l'overflow visible pour le conteneur
            const popupContainer = document.getElementById('featuresPopupContainer');
            if (popupContainer) {
                popupContainer.style.overflow = 'visible';
            }
            
            // Corrige le CTA pour qu'il ne soit pas sticky
            const featuresCta = document.querySelector('.features-cta');
            if (featuresCta) {
                featuresCta.style.position = 'relative';
                featuresCta.style.bottom = 'auto';
                featuresCta.style.left = 'auto';
                featuresCta.style.boxShadow = 'none';
                featuresCta.style.zIndex = '1';
            }
            
            // Force l'état des boutons CTA
            const ctaBtns = document.querySelectorAll('.cta-btn');
            ctaBtns.forEach(btn => {
                btn.style.flex = '0 1 auto';
                btn.style.minWidth = '160px';
            });
            
            console.log("Corrections appliquées");
        } else {
            console.log("Éléments non trouvés");
        }
    }
    
    // Exécuter la correction immédiatement
    fixPopupCTA();
    
    // Exécuter également après un court délai pour s'assurer que tout est chargé
    setTimeout(fixPopupCTA, 500);
});
