// Script de correction des filtres de catégories d'accessoires
// Version: 1.1.0

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Correction des filtres de catégories activée');
    
    // Détecter la langue de la page
    const currentLang = document.documentElement.lang || 'fr';
    console.log(`📝 Langue détectée: ${currentLang}`);
    
    // Traductions
    const translations = {
        fr: {
            all: 'Tous',
            filterTitle: 'Filtrer par catégorie:',
            noCategories: 'Aucune catégorie trouvée',
            categories: {
                'scanner': 'Scanner',
                'imprimante-thermique': 'Imprimante Thermique',
                'tiroir-caisse': 'Tiroir-Caisse',
                'ecran': 'Ecran',
                'autre': 'Autre'
            }
        },
        nl: {
            all: 'Alle',
            filterTitle: 'Filteren op categorie:',
            noCategories: 'Geen categorieën gevonden',
            categories: {
                'scanner': 'Scanner',
                'imprimante-thermique': 'Thermische Printer',
                'tiroir-caisse': 'Kassalade',
                'ecran': 'Scherm',
                'autre': 'Andere'
            }
        },
        en: {
            all: 'All',
            filterTitle: 'Filter by category:',
            noCategories: 'No categories found',
            categories: {
                'scanner': 'Scanner',
                'imprimante-thermique': 'Thermal Printer',
                'tiroir-caisse': 'Cash Drawer',
                'ecran': 'Screen',
                'autre': 'Other'
            }
        }
    };
    
    // Utiliser les traductions de la langue actuelle ou français par défaut
    const t = translations[currentLang] || translations['fr'];

    // Fonction pour extraire les catégories directement depuis les cartes d'accessoires
    function extractCategoriesFromCards() {
        console.log('📊 Extraction des catégories depuis les cartes...');
        
        const accessoireCards = document.querySelectorAll('.accessoire-card');
        const uniqueCategories = new Set();
        const categoryMapping = {};
        
        // Extraire les catégories uniques des cartes existantes
        accessoireCards.forEach(card => {
            const categorySlug = card.getAttribute('data-category');
            if (categorySlug && categorySlug !== 'all') {
                // Récupérer le nom affiché de la catégorie depuis le badge
                const badge = card.querySelector('.accessoire-category-badge');
                const displayName = badge ? badge.textContent.trim() : categorySlug;
                
                uniqueCategories.add(categorySlug);
                categoryMapping[categorySlug] = displayName;
                
                console.log(`📝 Catégorie trouvée: ${displayName} (${categorySlug})`);
            }
        });
        
        return { uniqueCategories: [...uniqueCategories], categoryMapping };
    }
    
    // Fonction pour reconstruire les boutons de filtre
    function rebuildFilterButtons() {
        console.log('🔄 Reconstruction des boutons de filtre...');
        
        const categoryFilter = document.querySelector('.category-filter');
        if (!categoryFilter) {
            console.warn('⚠️ Conteneur de filtres non trouvé');
            return;
        }
        
        // Extraire les catégories des cartes
        const { uniqueCategories, categoryMapping } = extractCategoriesFromCards();
        
        // Vérifier si nous avons des catégories à afficher
        if (uniqueCategories.length === 0) {
            console.warn('⚠️ Aucune catégorie trouvée dans les cartes');
            return;
        }
        
        console.log(`✅ ${uniqueCategories.length} catégories uniques trouvées`);
        
        // Sauvegarder le bouton "Tous" s'il existe déjà
        const allButton = categoryFilter.querySelector('button[data-category="all"]');
        
        // Reconstruire les filtres
        categoryFilter.innerHTML = '';
        
        // Ajouter d'abord le bouton "Tous"/"Alle"/"All" selon la langue
        if (allButton) {
            // Mettre à jour le texte avec la bonne traduction
            allButton.textContent = t.all;
            categoryFilter.appendChild(allButton);
        } else {
            const newAllButton = document.createElement('button');
            newAllButton.classList.add('active');
            newAllButton.setAttribute('data-category', 'all');
            newAllButton.textContent = t.all; // Utiliser la traduction
            categoryFilter.appendChild(newAllButton);
        }
        
        // Ajouter un bouton pour chaque catégorie unique
        uniqueCategories.sort().forEach(categorySlug => {
            // Éviter de créer un bouton "all" dupliqué
            if (categorySlug === 'all') return;
            
            const button = document.createElement('button');
            button.setAttribute('data-category', categorySlug);
            
            // Utiliser la traduction de la catégorie selon la langue détectée
            let displayName;
            
            // Vérifier si nous avons une traduction pour cette catégorie
            if (t.categories && t.categories[categorySlug]) {
                displayName = t.categories[categorySlug];
                console.log(`🕊️ Traduction utilisée pour ${categorySlug}: ${displayName}`);
            } else {
                // Utiliser le nom d'affichage du mapping ou formater le slug
                displayName = categoryMapping[categorySlug] || 
                              categorySlug.replace(/-/g, ' ')
                                         .replace(/\b\w/g, l => l.toUpperCase());
                console.log(`⚠️ Pas de traduction pour ${categorySlug}, utilisation de: ${displayName}`);
            }
            
            button.textContent = displayName;
            categoryFilter.appendChild(button);
            console.log(`➡️ Bouton créé: ${displayName}`);
        });
        
        // Configurer le filtrage
        setupCategoryFilter();
        
        console.log('✅ Reconstruction des filtres terminée');
    }
    
    // Fonction pour configurer le filtrage par catégorie
    function setupCategoryFilter() {
        console.log('⚙️ Configuration du filtrage par catégorie...');
        
        const accessoireCards = document.querySelectorAll('.accessoire-card');
        const filterButtons = document.querySelectorAll('.category-filter button');
        
        if (!accessoireCards.length || !filterButtons.length) {
            console.warn('⚠️ Éléments requis non trouvés');
            return;
        }
        
        console.log(`📊 ${filterButtons.length} boutons de filtre, ${accessoireCards.length} cartes d'accessoires`);
        
        // Supprimer les gestionnaires d'événements existants (clonage)
        filterButtons.forEach(button => {
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
        });
        
        // Reconfigurer les gestionnaires d'événements
        document.querySelectorAll('.category-filter button').forEach(button => {
            button.addEventListener('click', function() {
                // Retirer la classe active de tous les boutons
                document.querySelectorAll('.category-filter button').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // Ajouter la classe active au bouton cliqué
                this.classList.add('active');
                
                const filterValue = this.getAttribute('data-category');
                console.log(`🔍 Filtrage par: ${filterValue}`);
                
                // Filtrer les cartes
                accessoireCards.forEach(card => {
                    const cardCategory = card.getAttribute('data-category');
                    
                    if (filterValue === 'all') {
                        // Forcer l'affichage de toutes les cartes
                        card.style.display = 'block';
                        card.style.visibility = 'visible';
                        card.style.opacity = '1';
                        card.classList.remove('filtered-out');
                        console.log(`✅ Carte affichée (all): ${card.querySelector('h3')?.textContent || 'Sans titre'}`);
                    } else if (cardCategory === filterValue) {
                        // Forcer l'affichage des cartes correspondant au filtre
                        card.style.display = 'block';
                        card.style.visibility = 'visible';
                        card.style.opacity = '1';
                        card.classList.remove('filtered-out');
                        console.log(`✅ Carte affichée (match): ${card.querySelector('h3')?.textContent || 'Sans titre'}`);
                    } else {
                        // Forcer le masquage complet des cartes non correspondantes
                        card.style.display = 'none';
                        card.style.visibility = 'hidden';
                        card.style.opacity = '0';
                        card.classList.add('filtered-out');
                        console.log(`❌ Carte masquée: ${card.querySelector('h3')?.textContent || 'Sans titre'}`);
                    }
                });
                
                // Vérifier visuellement les cartes après le filtrage
                setTimeout(() => {
                    accessoireCards.forEach(card => {
                        console.log(`État final: ${card.querySelector('h3')?.textContent || 'Sans titre'} - display=${window.getComputedStyle(card).display}`);
                    });
                }, 100);
            });
        });
        
        console.log('✅ Filtrage configuré avec succès');
    }
    
    // Observer les mutations DOM pour détecter les changements dans la grille d'accessoires
    function setupMutationObserver() {
        const accessoiresGrid = document.querySelector('.accessoires-grid');
        if (!accessoiresGrid) return;
        
        const observer = new MutationObserver(function(mutations) {
            let shouldRebuild = false;
            
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' && 
                    (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)) {
                    shouldRebuild = true;
                }
            });
            
            if (shouldRebuild) {
                console.log('🔄 Changement détecté dans les accessoires, reconstruction des filtres...');
                setTimeout(rebuildFilterButtons, 200);
            }
        });
        
        observer.observe(accessoiresGrid, { 
            childList: true,
            subtree: true
        });
        
        console.log('👁️ Observateur de mutations configuré');
    }
    
    // Fonction principale pour corriger les filtres de catégories
    function fixCategoryFilters() {
        console.log('🚀 Démarrage de la correction des filtres de catégories...');
        
        // Attendre que les accessoires soient chargés (assuré par accessoires-display.js)
        setTimeout(() => {
            rebuildFilterButtons();
            setupMutationObserver();
        }, 1000);
    }
    
    // Exécuter la correction
    fixCategoryFilters();
});
