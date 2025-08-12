/**
 * Script pour s'assurer que les indicateurs du carrousel hero sont bien visibles
 * Version améliorée avec force d'affichage et styles inline
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log("Début de l'initialisation des indicateurs");
    
    // Exécution immédiate + retard pour s'assurer que tous les éléments sont chargés
    createIndicators();
    
    setTimeout(function() {
        createIndicators();
    }, 500);
    
    // Exécuter à nouveau après 1.5 secondes pour s'assurer
    setTimeout(function() {
        createIndicators();
    }, 1500);
    
    function createIndicators() {
        console.log("Création/vérification des indicateurs");
        
        // Sélectionner la section hero
        const heroSection = document.querySelector('.hero-parallax');
        if (!heroSection) {
            console.error("Section hero non trouvée");
            return;
        }
        
        // Supprimer les indicateurs existants pour éviter les doublons
        const existingIndicators = heroSection.querySelector('.carousel-indicators');
        if (existingIndicators) {
            existingIndicators.remove();
        }
        
        console.log("Création des indicateurs de carrousel");
        
        // Créer le conteneur d'indicateurs avec style inline pour visibilité forcée
        const indicators = document.createElement('div');
        indicators.className = 'carousel-indicators';
        
        // Appliquer des styles inline pour un design épuré sans arrière-plan avec centrage parfait
        indicators.style.cssText = `
            display: flex !important;
            justify-content: center !important;
            position: absolute !important;
            bottom: 20px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            margin: 0 !important;
            gap: 12px !important;
            z-index: 90 !important; /* Réduit pour passer sous le menu principal */
            width: auto !important;
            text-align: center !important;
            padding: 5px !important;
            background-color: transparent !important;
            max-width: fit-content !important;
        `;
        
        // Nombre d'images dans le slider (basé sur carousel-fix.js)
        const slidesCount = 5;
        
        // Ajouter les indicateurs
        for (let i = 0; i < slidesCount; i++) {
            const indicator = document.createElement('div');
            indicator.className = 'carousel-indicator';
            if (i === 0) indicator.classList.add('active');
            
            // Appliquer les mêmes styles que les indicateurs de la section "Une solution complète pour votre commerce"
            indicator.style.cssText = `
                width: ${i === 0 ? '40px' : '30px'} !important;
                height: 6px !important;
                border-radius: 3px !important;
                background: ${i === 0 ? '#F7941D' : 'rgba(255, 255, 255, 0.3)'} !important;
                cursor: pointer !important;
                transition: all 0.3s ease !important;
                display: inline-block !important;
                margin: 0 !important;
                transform: ${i === 0 ? 'scale(1.1)' : 'scale(1)'} !important;
            `;
            
            // Ajouter un attribut data pour identifier le slide
            indicator.setAttribute('data-slide-index', i);
            
            // Ajouter l'indicateur au conteneur
            indicators.appendChild(indicator);
            
            // Ajouter un événement click pour changer de slide
            indicator.addEventListener('click', function() {
                // Mettre à jour la classe active sur les indicateurs
                document.querySelectorAll('.carousel-indicator').forEach((ind, index) => {
                    ind.classList.remove('active');
                    ind.style.background = 'rgba(255, 255, 255, 0.3)';
                    ind.style.width = '30px';
                    ind.style.transform = 'scale(1)';
                });
                this.classList.add('active');
                this.style.background = '#F7941D';
                this.style.width = '40px';
                this.style.transform = 'scale(1.1)';
                
                // Déclencher un événement personnalisé pour le changement de slide
                const event = new CustomEvent('slideChange', { 
                    detail: { slideIndex: i }
                });
                document.dispatchEvent(event);
            });
        }
        
        // Ajouter les indicateurs à la section hero
        heroSection.appendChild(indicators);
        
        console.log("Indicateurs de carrousel ajoutés avec succès");
    }
});
