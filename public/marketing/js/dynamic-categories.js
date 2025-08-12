/**
 * PAYESMART - CATÉGORIES D'ACCESSOIRES DYNAMIQUES
 * Script permettant de charger dynamiquement les catégories d'accessoires depuis Firestore
 * Version: 1.2.0 - Correction du système de filtrage et mapping des catégories
 * Date: 2025-07-24 - Force cache refresh
 */

document.addEventListener('DOMContentLoaded', () => {
    // Vérifier si nous sommes sur la page des accessoires
    const categoriesContainer = document.getElementById('dynamic-category-filters');
    if (!categoriesContainer) return;

    console.log('Initialisation du chargement dynamique des catégories...');

    // Vérifier si Firebase est déjà initialisé
    if (typeof firebase === 'undefined') {
        console.error('Firebase n\'est pas initialisé. Impossible de charger les catégories.');
        return;
    }

    const db = firebase.firestore();
    const ACCESSORY_CATEGORIES_COLLECTION = 'accessory_categories';
    
    // Créer un indicateur de chargement
    const loadingIndicator = document.createElement('span');
    loadingIndicator.className = 'categories-loading';
    loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Chargement des catégories...';
    categoriesContainer.appendChild(loadingIndicator);

    // Bouton "Tous" qui existe déjà et doit rester
    const allButton = categoriesContainer.querySelector('button[data-filter="all"]');

    // Fonction pour charger les catégories
    const loadCategories = async () => {
        try {
            console.log('Début du chargement des catégories...');
            
            // Supprimer l'indicateur de chargement
            if (loadingIndicator) {
                loadingIndicator.remove();
            }
            
            // Réinitialiser complètement le conteneur des filtres
            // Garder uniquement le bouton "Tous"
            while (categoriesContainer.children.length > 1) {
                categoriesContainer.removeChild(categoriesContainer.lastChild);
            }
            
            // Vérifier que le bouton "Tous" existe toujours, sinon le créer
            if (categoriesContainer.children.length === 0) {
                const tousButton = document.createElement('button');
                tousButton.classList.add('active');
                tousButton.setAttribute('data-filter', 'tous');
                tousButton.textContent = 'Tous';
                categoriesContainer.appendChild(tousButton);
            }

            // Définir le businessId pour filtrer les données (identique à celui utilisé dans accessoires-display.js)
            const businessId = 'Hrk3nn1HVlcHOJ7InqK1';
            
            // Charger dynamiquement les catégories depuis Firestore avec filtrage par businessId
            console.log(`Chargement des catégories depuis Firestore avec businessId: ${businessId}`);
            
            const categoriesRef = db.collection(ACCESSORY_CATEGORIES_COLLECTION);
            const categoriesQuery = categoriesRef.where("businessId", "==", businessId);
            
            // Récupérer les catégories depuis Firestore
            const categoriesSnapshot = await categoriesQuery.get();
            
            // Vérifier s'il y a des catégories
            if (categoriesSnapshot.empty) {
                console.log('Aucune catégorie trouvée dans Firestore, utilisation des catégories par défaut');
                // Utiliser des catégories par défaut en cas d'absence de données
                const defaultCategories = [
                    { name: 'Imprimante thermique', filterValue: 'imprimante-thermique' },
                    { name: 'Scanner', filterValue: 'scanner' },
                    { name: 'Tiroir-caisse', filterValue: 'tiroir-caisse' }
                ];
                
                // Ajouter les catégories par défaut
                defaultCategories.forEach(category => {
                    addCategoryButton(category.name, category.filterValue);
                });
            } else {
                console.log(`${categoriesSnapshot.size} catégories trouvées dans Firestore`);
                
                // Fonction pour normaliser les catégories en valeurs de filtrage
            const normalizeCategoryForFilter = (categoryName) => {
                if (!categoryName) return 'divers';
                
                // Normaliser les catégories pour éviter les problèmes de filtrage
                const lowerCaseCategory = categoryName.toLowerCase();
                
                // Mappings spécifiques pour certaines catégories
                if (lowerCaseCategory.includes('imprimante') || lowerCaseCategory.includes('impression')) return 'imprimante-thermique';
                if (lowerCaseCategory.includes('tiroir') || lowerCaseCategory.includes('caisse')) return 'tiroir-caisse';
                if (lowerCaseCategory.includes('scanner') || lowerCaseCategory.includes('scan')) return 'scanner';
                if (lowerCaseCategory.includes('paiement') || lowerCaseCategory.includes('carte')) return 'paiement';
                if (lowerCaseCategory.includes('affichage') || lowerCaseCategory.includes('moniteur') || lowerCaseCategory.includes('écran')) return 'affichage';
                if (lowerCaseCategory.includes('réseau') || lowerCaseCategory.includes('reseau') || lowerCaseCategory.includes('wifi')) return 'reseau';
                
                // Par défaut, retourner une version normalisée de la catégorie (sans espaces, tirets, etc.)
                return lowerCaseCategory.replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
            };
                
            // Transformer les données Firestore en tableau
                const categories = [];
                categoriesSnapshot.forEach(doc => {
                    const data = doc.data();
                    // Normaliser le nom pour le filterValue
                    const filterValue = normalizeCategoryForFilter(data.name);
                    categories.push({
                        id: doc.id,
                        name: data.name,
                        filterValue: filterValue
                    });
                });
                
                // Trier les catégories par nom
                categories.sort((a, b) => a.name.localeCompare(b.name));
                
                // Ajouter chaque catégorie comme bouton de filtre
                categories.forEach(category => {
                    addCategoryButton(category.name, category.filterValue);
                });
            }
            
            // Fonction pour ajouter un bouton de catégorie
            function addCategoryButton(name, filterValue) {
                // Vérifier que ce bouton n'existe pas déjà
                const existingButton = Array.from(categoriesContainer.children)
                    .find(button => button.getAttribute('data-filter') === filterValue);
                
                if (!existingButton) {
                    // Créer le bouton
                    const button = document.createElement('button');
                    button.setAttribute('data-filter', filterValue);
                    button.textContent = name;
                    
                    // Ajouter le bouton
                    categoriesContainer.appendChild(button);
                    
                    console.log(`Catégorie ajoutée: ${name}, Filtre: ${filterValue}`);
                } else {
                    console.log(`Catégorie déjà existante: ${name}`);
                }
            }
            
            console.log('Catégories fixes chargées avec succès');
            
            /* Désactivé pour éviter les doublons
            // Récupérer les catégories depuis Firestore
            const categoriesCollection = db.collection(ACCESSORY_CATEGORIES_COLLECTION);
            let q = categoriesCollection.where("type", "==", "accessory").where("active", "==", true);
            
            const snapshot = await q.get();
            */
            
            // Réinitialiser les écouteurs d'événements sur les boutons de filtre
            // setupFilterButtons(); // Remplacé par initializeFiltering
            setTimeout(() => {
                console.log('Initialisation du filtrage après chargement des catégories');
                initializeFiltering();
            }, 500);
            
            console.log('Catégories chargées avec succès');
        } catch (error) {
            console.error('Erreur lors du chargement des catégories:', error);
            
            if (loadingIndicator) {
                loadingIndicator.innerHTML = '<span style="color: red;">Erreur de chargement des catégories</span>';
                setTimeout(() => loadingIndicator.remove(), 3000);
            }
        }
    };

    // Définir les icônes spécifiques pour chaque catégorie
    const categoryIcons = {
        'impression': 'printer',
        'paiement': 'credit-card',
        'affichage': 'monitor',
        'reseau': 'wifi',
        'réseau': 'wifi',
        'divers': 'package',
        'scanner': 'scan-line',
        'lecteur': 'hard-drive',
        'tiroir': 'archive',
        'terminal': 'terminal',
        'support': 'stand',
        // Ajouter d'autres catégories selon les besoins
        // Catégorie par défaut si aucune correspondance n'est trouvée
        'default': 'package'
    };

    // Fonction pour obtenir l'icône appropriée pour une catégorie
    const getCategoryIcon = (categoryName) => {
        const normalizedName = categoryName.toLowerCase();
        
        // Parcourir les clés du dictionnaire categoryIcons
        for (const key in categoryIcons) {
            // Si le nom de catégorie contient la clé (par ex. 'impression 3d' contient 'impression')
            if (normalizedName.includes(key)) {
                return categoryIcons[key];
            }
        }
        
        // Catégorie par défaut si aucune correspondance n'est trouvée
        return categoryIcons.default;
    };

    // Correspondance entre les boutons de filtrage et les catégories des accessoires
    // C'est cette correspondance qui détermine quels produits sont affichés pour chaque bouton
    const categoryMapping = {
        // Bouton "imprimante-thermique" affiche les accessoires ayant la catégorie "impression"
        'imprimante-thermique': ['impression'],
        
        // Bouton "scanner" affiche les accessoires ayant la catégorie "scanner"
        'scanner': ['scanner'],
        
        // Bouton "tiroir-caisse" affiche les accessoires ayant les catégories "paiement", "tiroir", "caisse"
        'tiroir-caisse': ['paiement', 'tiroir', 'caisse']
    };
    
    // Ajouter une fonction pour déboguer les cartes accessoires
    const debugAccessoireCards = () => {
        const cards = document.querySelectorAll('.accessoire-card');
        console.log('=== Débogage des cartes accessoires ===');
        cards.forEach(card => {
            console.log(`Carte: ID=${card.getAttribute('data-id')}, Catégorie=${card.getAttribute('data-category')}`);
        });
    };
    
    // Exécuter le débogage après le chargement
    setTimeout(debugAccessoireCards, 3000);
    
    // Ajouter des logs pour déboguer les mappings
    console.log('Mappings des catégories:', categoryMapping);
    
    // Version simplifiée qui utilise une approche différente pour la filtration
    const updateAccessoryCardCategories = (categoryName, filterValue) => {
        // Nous n'avons pas besoin de cette fonction car les cartes sont déjà créées
        // avec leurs attributs data-category normalisés
        console.log(`Mise à jour de filtres - ajout de la catégorie: ${categoryName} (${filterValue})`);
    };
    
    // Fonction pour initialiser le filtrage des accessoires
    const initializeFiltering = () => {
        console.log('Initialisation du système de filtrage');
        // Récupérer toutes les cartes d'accessoires
        const accessoireCards = document.querySelectorAll('.accessoire-card');
        console.log(`Nombre de cartes d'accessoires trouvées: ${accessoireCards.length}`);
        
        // Récupérer tous les boutons de filtre
        const filterButtons = document.querySelectorAll('.category-filter button');
        
        // Pour chaque bouton, ajouter un écouteur d'événement
        filterButtons.forEach(button => {
            button.addEventListener('click', function() {
                // Supprimer la classe 'active' de tous les boutons
                filterButtons.forEach(btn => btn.classList.remove('active'));
                
                // Ajouter la classe 'active' au bouton cliqué
                this.classList.add('active');
                
                // Récupérer la valeur de filtre du bouton cliqué
                const filterValue = this.getAttribute('data-filter');
                console.log(`Filtrage par: ${filterValue}`);
                
                // Variable pour le délai d'animation
                let delay = 0;
                
                // Afficher ou masquer les cartes en fonction du filtre
                accessoireCards.forEach(card => {
                    const cardCategory = card.getAttribute('data-category');
                    console.log(`Carte: category=${cardCategory}, filter=${filterValue}`);
                    
                    // Réinitialiser l'animation
                    card.style.animation = 'none';
                    card.offsetHeight; // Force reflow
                    
                    // Logique de filtrage basée sur le mapping de catégories
                    // Ne pas redéclarer cardCategory car il est déjà déclaré plus haut
                    
                    // Si "Tous" est sélectionné, afficher toutes les cartes
                    if (filterValue === 'tous') {
                        card.style.display = 'block';
                        card.style.animation = `cardAppear 0.5s forwards ${delay}ms`;
                        delay += 50;
                    } 
                    // Pour les autres filtres, vérifier si la catégorie de la carte correspond à l'une des catégories associées au filtre
                    else if (categoryMapping[filterValue] && 
                             categoryMapping[filterValue].includes(cardCategory)) {
                        console.log(`MATCH: La carte ${cardCategory} correspond au filtre ${filterValue}`);
                        card.style.display = 'block';
                        card.style.animation = `cardAppear 0.5s forwards ${delay}ms`;
                        delay += 50;
                    } 
                    // Si aucune correspondance, cacher la carte
                    else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    };

    // L'ancienne fonction setupCategoryFiltering a été remplacée par initializeFiltering
    // pour un meilleur fonctionnement du filtrage avec les catégories dynamiques

    // Charger les catégories
    loadCategories();
});
