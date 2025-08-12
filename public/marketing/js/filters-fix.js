// Script de correction des filtres pour la page nos-accessoires.html
// Version 1.0.0

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Script de correction des filtres chargé');
    
    // Fonction pour configurer correctement les filtres de catégories
    function fixCategoryFilters() {
        console.log('🔧 Initialisation de la correction des filtres...');
        
        // 1. Sélectionner les éléments du DOM
        const categoryFilter = document.querySelector('.category-filter');
        const accessoireCards = document.querySelectorAll('.accessoire-card');
        
        // Si pas de filtre ou pas de cartes, arrêter
        if (!categoryFilter || accessoireCards.length === 0) {
            console.log('⚠️ Éléments requis non trouvés, impossible de corriger les filtres');
            return;
        }
        
        console.log(`📊 Trouvé ${accessoireCards.length} cartes d'accessoires`);
        
        // 2. Vérifier et fixer les attributs des cartes d'accessoires
        accessoireCards.forEach(card => {
            // Assurer que chaque carte a un attribut data-category
            if (!card.getAttribute('data-category')) {
                // Essayer de récupérer depuis data-filter si disponible
                const filterAttr = card.getAttribute('data-filter');
                if (filterAttr) {
                    card.setAttribute('data-category', filterAttr);
                    console.log(`🔄 Carte corrigée: data-filter → data-category = ${filterAttr}`);
                } else {
                    // Attribuer une catégorie par défaut
                    card.setAttribute('data-category', 'autre');
                    console.log('🔄 Carte sans catégorie corrigée: data-category = autre');
                }
            }
        });
        
        // 3. Vérifier et créer les boutons de filtre si nécessaires
        const filterButtons = categoryFilter.querySelectorAll('button');
        if (filterButtons.length === 0) {
            console.log('⚠️ Aucun bouton de filtre trouvé, création des boutons...');
            
            // Créer le bouton "Tous"
            const allButton = document.createElement('button');
            allButton.classList.add('active');
            allButton.setAttribute('data-category', 'all');
            allButton.textContent = 'Tous';
            categoryFilter.appendChild(allButton);
            
            // Collecter toutes les catégories uniques des cartes
            const categories = new Set();
            accessoireCards.forEach(card => {
                const category = card.getAttribute('data-category');
                if (category && category !== 'all') {
                    categories.add(category);
                }
            });
            
            // Créer un bouton pour chaque catégorie
            categories.forEach(category => {
                const button = document.createElement('button');
                button.setAttribute('data-category', category);
                
                // Convertir le slug en texte plus lisible
                let displayName = category.replace(/-/g, ' ');
                displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
                
                button.textContent = displayName;
                categoryFilter.appendChild(button);
                console.log(`➕ Bouton créé: ${displayName}`);
            });
        } else {
            console.log(`📊 Trouvé ${filterButtons.length} boutons de filtre existants`);
            
            // Assurer que chaque bouton a data-category (pas data-filter)
            filterButtons.forEach(button => {
                if (!button.getAttribute('data-category')) {
                    const filterAttr = button.getAttribute('data-filter');
                    if (filterAttr) {
                        button.setAttribute('data-category', filterAttr);
                        console.log(`🔄 Bouton corrigé: data-filter → data-category = ${filterAttr}`);
                    }
                }
            });
        }
        
        // 4. Configurer les gestionnaires d'événements pour les boutons
        const updatedButtons = categoryFilter.querySelectorAll('button');
        updatedButtons.forEach(button => {
            // Supprimer d'abord les gestionnaires existants pour éviter les doublons
            button.replaceWith(button.cloneNode(true));
        });
        
        // Reconfigurer avec des gestionnaires frais
        const freshButtons = categoryFilter.querySelectorAll('button');
        freshButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                console.log(`🖱️ Clic sur le bouton: ${this.textContent}`);
                
                // Mettre à jour la classe active
                freshButtons.forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Récupérer la valeur du filtre
                const filterValue = this.getAttribute('data-category');
                console.log(`🔍 Filtrage par catégorie: ${filterValue}`);
                
                // Ajouter une classe au body pour les styles CSS
                document.body.classList.add('js-filters-active');
                
                // Filtrer les cartes
                accessoireCards.forEach(card => {
                    const cardCategory = card.getAttribute('data-category');
                    
                    if (filterValue === 'all') {
                        card.style.display = 'block';
                        card.classList.add('visible');
                        console.log(`✅ Accessoire affiché (all): ${card.querySelector('h3')?.textContent || 'Sans titre'}`);
                    } else if (cardCategory === filterValue) {
                        card.style.display = 'block';
                        card.classList.add('visible');
                        console.log(`✅ Accessoire affiché (match): ${card.querySelector('h3')?.textContent || 'Sans titre'}`);
                    } else {
                        card.style.display = 'none';
                        card.classList.remove('visible');
                        console.log(`❌ Accessoire masqué: ${card.querySelector('h3')?.textContent || 'Sans titre'}`);
                    }
                });
            });
        });
        
        // 5. Déclencher le filtre "Tous" par défaut pour s'assurer que tout est visible au départ
        const allButton = categoryFilter.querySelector('button[data-category="all"]');
        if (allButton) {
            console.log('🔄 Activation du filtre "Tous" par défaut');
            allButton.click();
        }
        
        console.log('✅ Correction des filtres terminée avec succès');
    }
    
    // Exécuter la fonction de correction après un court délai pour s'assurer que tout est chargé
    setTimeout(fixCategoryFilters, 500);
    
    // Réexécuter si le DOM change significativement (comme après le chargement des accessoires)
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && 
                (mutation.target.classList.contains('accessoires-grid') || 
                 mutation.target.classList.contains('category-filter'))) {
                console.log('🔄 Changement détecté dans le DOM, réapplication de la correction des filtres');
                setTimeout(fixCategoryFilters, 200);
            }
        });
    });
    
    // Observer les changements dans la grille d'accessoires et les filtres
    const accessoiresGrid = document.querySelector('.accessoires-grid');
    const categoryFilter = document.querySelector('.category-filter');
    
    if (accessoiresGrid) {
        observer.observe(accessoiresGrid, { childList: true, subtree: true });
    }
    
    if (categoryFilter) {
        observer.observe(categoryFilter, { childList: true, subtree: true });
    }
});
