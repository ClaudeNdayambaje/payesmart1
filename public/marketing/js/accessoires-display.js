// Script pour afficher les accessoires depuis Firebase sur la page nos-accessoires.html
// Version: 2.0.0 - Harmonisé avec le script des produits, sans authentification anonyme

document.addEventListener('DOMContentLoaded', function() {
    console.log(`📱 Script d\'affichage des accessoires chargé`);
    
    // Fonction pour ajouter un produit au panier
    window.addToCart = function(productId, productName) {
        console.log(`🛒 Ajout au panier: ${productName} (ID: ${productId})`);
        
        // Feedback visuel pour l'utilisateur
        const feedbackText = {
            'fr': 'Ajouté au panier !',
            'nl': 'Toegevoegd aan winkelwagen!',
            'en': 'Added to cart!'
        }[currentLang] || 'Ajouté au panier !';
        
        // Afficher une notification
        const notification = document.createElement('div');
        notification.className = 'cart-notification';
        notification.innerHTML = `<i class="fas fa-check-circle"></i> ${feedbackText}`;
        document.body.appendChild(notification);
        
        // Animation d'apparition
        setTimeout(() => notification.classList.add('visible'), 100);
        
        // Disparition après 3 secondes
        setTimeout(() => {
            notification.classList.remove('visible');
            setTimeout(() => notification.remove(), 500);
        }, 3000);
        
        // TODO: Intégrer avec un vrai système de panier
        // Ici, nous pourrions ajouter le code pour gérer un panier réel
        // Par exemple, stockage en localStorage ou appel à une API
    };
    
    // Détecter la langue de la page
    const currentLang = document.documentElement.lang || 'fr';
    console.log(`📝 Langue détectée: ${currentLang}`);
    
    // Traductions pour le bouton "Tous"
    const allButtonText = {
        'fr': 'Tous',
        'nl': 'Alle',
        'en': 'All'
    };
    
    // Traductions des noms de catégories pour les badges et les filtres
    const categoryTranslations = {
        'fr': {
            'Scanner': 'Scanner',
            'Imprimante Thermique': 'Imprimante Thermique',
            'Tiroir-Caisse': 'Tiroir-Caisse',
            'Ecran': 'Ecran',
            'Autre': 'Autre',
            'Divers': 'Divers'
        },
        'nl': {
            'Scanner': 'Scanner',
            'Imprimante Thermique': 'Thermische Printer',
            'Tiroir-Caisse': 'Kassalade',
            'Ecran': 'Scherm',
            'Autre': 'Andere',
            'Divers': 'Diversen'
        },
        'en': {
            'Scanner': 'Scanner',
            'Imprimante Thermique': 'Thermal Printer',
            'Tiroir-Caisse': 'Cash Drawer',
            'Ecran': 'Screen',
            'Autre': 'Other',
            'Divers': 'Miscellaneous'
        }
    };
    
    // Fonction de traduction des noms de catégories
    function translateCategory(categoryName) {
        // Récupérer les traductions pour la langue actuelle
        const translations = categoryTranslations[currentLang] || categoryTranslations['fr'];
        
        // Retourner la traduction si elle existe, sinon le nom original
        return translations[categoryName] || categoryName;
    }
    
    // Obtenir le texte du bouton "Tous" selon la langue
    const allText = allButtonText[currentLang] || 'Tous';
    
    // Force le rafraîchissement complet de la page si demandé via paramètre URL
    if (new URLSearchParams(window.location.search).get('forceRefresh') === 'true') {
        console.log('Forçage du rafraîchissement des ressources...');
        const timestamp = new Date().getTime();
        const scripts = document.querySelectorAll('script[src]');
        scripts.forEach(script => {
            const currentSrc = script.getAttribute('src');
            if (currentSrc && !currentSrc.includes('firebase')) {
                script.setAttribute('src', `${currentSrc}?v=${timestamp}`);
            }
        });
    }
    
    // Configuration Firebase du projet logiciel-de-caisse-7e58e
    const firebaseConfig = {
        apiKey: "AIzaSyD-D2qvB1zQ3ta-31LuAvBawR_6KJHb07Y",
        authDomain: "logiciel-de-caisse-7e58e.firebaseapp.com",
        projectId: "logiciel-de-caisse-7e58e",
        storageBucket: "logiciel-de-caisse-7e58e.appspot.com",
        messagingSenderId: "845468395395",
        appId: "1:845468395395:web:4c4adddef147c29f0338b6"
    };
    
    // Initialiser Firebase si ce n'est pas déjà fait
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    
    const db = firebase.firestore();
    const accessoiresCollection = db.collection('accessoires');
    const categoriesCollection = db.collection('accessory_categories');
    
    // ID de l'entreprise à utiliser pour filtrer les accessoires et catégories
    // Utiliser une constante ou récupérer l'ID de l'entreprise depuis une variable globale ou localStorage
    const currentBusinessId = 'Hrk3nn1HVlcHOJ7InqK1'; // ID de l'entreprise PaySmart
    console.log('📌 Filtrage des accessoires pour businessId:', currentBusinessId);
    
    // Sélectionner le conteneur des accessoires
    const accessoiresContainer = document.querySelector('.accessoires-grid');
    
    // Si nous sommes sur la page des accessoires
    if (accessoiresContainer) {
        // Ne pas afficher d'indicateur de chargement qui perturbe l'expérience visuelle
        // Préserver le contenu original du conteneur jusqu'à ce que les accessoires soient chargés
        const originalContent = accessoiresContainer.innerHTML;
        
        // Préparer un div pour le chargement mais ne pas l'afficher immédiatement
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-overlay';
        loadingDiv.innerHTML = '<div class="loading-spinner-center"><i class="fas fa-spinner fa-spin"></i></div>';
        document.body.appendChild(loadingDiv);
        
        // Charger les catégories depuis Firestore
        console.log('Chargement des catégories d\'accessoires depuis Firestore...');
        
        // Charger les catégories d'abord pour les utiliser dans le filtre
        // Filtrer les catégories par businessId pour ne récupérer que celles de l'entreprise courante
        categoriesCollection.where('businessId', '==', currentBusinessId).get().then((categorySnapshot) => {
            const categories = [];
            console.log(`📁 Catégories récupérées: ${categorySnapshot.size}`);
            categorySnapshot.forEach((doc) => {
                const categoryData = doc.data();
                console.log(`Catégorie trouvée - ID: ${doc.id}, Données:`, categoryData);
                if (categoryData && typeof categoryData.name === 'string' && categoryData.name.trim() !== '') {
                    categories.push({
                        id: doc.id,
                        name: categoryData.name.trim()
                    });
                }
            });
            
            console.log(`${categories.length} catégories trouvées:`, categories.map(c => c.name).join(', '));
            
            // Créer un mapping d'ID à nom de catégorie pour une recherche efficace
            const categoryIdToName = {};
            categories.forEach(cat => {
                categoryIdToName[cat.id] = cat.name;
            });
            
            // Mettre à jour les boutons de filtre avec les catégories disponibles
            const categoryFilter = document.querySelector('.category-filter');
            if (categoryFilter) {
                // Garder uniquement le bouton 'Tous'/'Alle'/'All' selon la langue
                categoryFilter.innerHTML = `<button class="active" data-category="all">${allText}</button>`;
                
                // Ajouter un bouton pour chaque catégorie
                categories.forEach(category => {
                    const slug = category.name.toLowerCase()
                        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Enlever les accents
                        .replace(/[^\w\s-]/g, '') // Enlever les caractères spéciaux
                        .replace(/\s+/g, '-'); // Remplacer les espaces par des tirets
                        
                    const button = document.createElement('button');
                    button.setAttribute('data-category', slug);
                    button.textContent = category.name;
                    categoryFilter.appendChild(button);
                });
            }
            
            // Log pour indiquer le nombre de catégories après filtrage
            console.log('Catégories chargées et filtrées avec succès:', categories.length);
            
            // Charger les accessoires depuis Firestore directement (comme pour les produits)
            console.log('Chargement des accessoires depuis Firestore...');
        
        accessoiresCollection.where('businessId', '==', currentBusinessId).get()
            .then((querySnapshot) => {
                console.log(`Nombre total d'accessoires récupérés: ${querySnapshot.size}`);
                
                // Déclarer les tableaux pour stocker les accessoires avant utilisation
                const accessoires = [];
                const accessoiresInactifs = [];
                
                // Si la collection est vide, afficher un message
                if (querySnapshot.empty) {
                    console.log('⚠️ Collection accessoires vide');
                    accessoiresContainer.innerHTML = '<p class="no-items">Aucun accessoire disponible pour le moment.</p>';
                    return;
                }
                
                // Traiter les accessoires réels trouvés
                console.log('✅ Accessoires trouvés dans Firestore, traitement en cours...');
                
                // Traitement simplifié des accessoires récupérés
                console.log('🔄 Début du traitement des accessoires...');
                
                querySnapshot.forEach((doc) => {
                    const accessoire = doc.data();
                    accessoire.id = doc.id;
                    
                    console.log(`📋 Accessoire trouvé: ${accessoire.name} (ID: ${doc.id})`);
                    console.log(`   - BusinessID: ${accessoire.businessId}`);
                    console.log(`   - Active: ${accessoire.active} (${typeof accessoire.active})`);
                    
                    // Vérifier si l'accessoire doit être inclus (businessId correct et actif)
                    const hasCorrectBusinessId = accessoire.businessId === currentBusinessId;
                    const isActiveAccessory = accessoire.active === true || accessoire.active === 'true' || accessoire.active === 1;
                    
                    if (hasCorrectBusinessId && isActiveAccessory) {
                        console.log(`✅ Accessoire accepté: ${accessoire.name}`);
                        accessoires.push(accessoire);
                    } else {
                        console.log(`❌ Accessoire rejeté: ${accessoire.name} - BusinessId: ${hasCorrectBusinessId}, Actif: ${isActiveAccessory}`);
                        accessoiresInactifs.push(accessoire.name || 'Sans nom');
                    }
                });
                
                console.log(` Accessoires traités: ${accessoires.length} acceptés, ${accessoiresInactifs.length} rejetés`);
                
                // Afficher directement les accessoires récupérés
                console.log(` Prêt à afficher ${accessoires.length} accessoires`);
                
                // Si aucun accessoire trouvé, afficher un message
                if (accessoires.length === 0) {
                    console.warn(' Aucun accessoire trouvé');
                    accessoiresContainer.innerHTML = '<p class="no-items">Aucun accessoire disponible pour le moment.</p>';
                    return;
                }
                
                // Utiliser directement les accessoires filtrés lors du traitement initial
                const filteredAccessoires = accessoires;
                
                // Trier les accessoires par nom
                console.log(' Tri des accessoires par nom...');
                filteredAccessoires.sort((a, b) => {
                    const nameA = a.name || '';
                    const nameB = b.name || '';
                    return nameA.localeCompare(nameB);
                });
                
                // Générer le HTML pour les accessoires filtrés
                let accessoiresHTML = '';
                
                // Utiliser les accessoires FILTRÉS pour l'affichage
                filteredAccessoires.forEach(accessoire => {
                    // Extraction des données de l'accessoire
                    let name = accessoire.name || 'Accessoire sans nom';
                    let description = accessoire.description || 'Aucune description disponible';
                    const category = accessoire.category || 'autre';
                    
                    // Appliquer les traductions néerlandaises si on est sur la version NL
                    if (typeof isNLVersion === 'function' && isNLVersion()) {
                        if (typeof translateToNL === 'function') {
                            name = translateToNL(name, 'accessoryNames') || name;
                            description = translateToNL(description, 'accessoryDescriptions') || description;
                        }
                    }
                    
                    // Déterminer le nom de la catégorie
                    let categoryName = 'Divers'; // Valeur par défaut
                    
                    // Essayer de trouver par ID d'abord (si category est un ID)
                    if (categoryIdToName[category]) {
                        categoryName = categoryIdToName[category];
                        console.log(`📂 Catégorie trouvée par ID: ${category} => ${categoryName}`);
                    } else {
                        // Essayer de trouver par nom (insensible à la casse)
                        const matchedCategory = categories.find(cat => 
                            cat.name.toLowerCase() === (category?.toLowerCase() || '')
                        );
                        if (matchedCategory) {
                            categoryName = matchedCategory.name;
                            console.log(`📂 Catégorie trouvée par nom: ${category} => ${categoryName}`);
                        } else {
                            // Si la catégorie n'est pas trouvée, utiliser la valeur brute si disponible
                            // ou la catégorie par défaut 'Autre'
                            categoryName = category || 'Autre';
                            console.log(`📂 Catégorie non reconnue, utilisation de: ${categoryName}`);
                        }
                    }
                    
                    // Slug de la catégorie pour le filtrage CSS
                    const categorySlug = category.toLowerCase()
                        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Enlever les accents
                        .replace(/[^\w\s-]/g, '') // Enlever les caractères spéciaux
                        .replace(/\s+/g, '-'); // Remplacer les espaces par des tirets
                    
                    // Débogage pour vérifier les URLs d'images et de vidéos
                    console.log(`Accessoire ${name}: imageUrl=${accessoire.imageUrl}, videoUrl=${accessoire.videoUrl}`);
                    
                    // Vérifier si l'URL de l'image est valide
                    const hasValidImage = accessoire.imageUrl && typeof accessoire.imageUrl === 'string' && 
                                       (accessoire.imageUrl.startsWith('http') || accessoire.imageUrl.startsWith('data:image'));
                    
                    // Vérifier si l'URL de la vidéo est valide
                    const hasValidVideo = accessoire.videoUrl && typeof accessoire.videoUrl === 'string' && 
                                         accessoire.videoUrl.trim() !== '';
                    
                    // Déterminer le badge de catégorie à afficher
                    // Convertir le nom de catégorie en slug valide pour le filtrage (enlever accents, espaces, etc.)
                    const generateSlug = (text) => {
                        return (text || '')
                            .toLowerCase()
                            .normalize('NFD')
                            .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
                            .replace(/[^a-z0-9]/g, '-')      // Remplacer caractères non alphanumériques par des tirets
                            .replace(/-+/g, '-')             // Remplacer séquences de tirets par un seul
                            .replace(/^-|-$/g, '');          // Supprimer tirets début/fin
                    };
                    
                    // Générer le slug à partir du nom de catégorie
                    const displayCategorySlug = generateSlug(categoryName) || 'autre';
                    const displayCategory = displayCategorySlug;
                    
                    // Traduire le nom de la catégorie selon la langue de la page
                    const displayCategoryLabel = translateCategory(categoryName);
                    
                    console.log(`🏷️ Catégorie finale: Nom=${displayCategoryLabel} (traduit depuis ${categoryName}), Slug=${displayCategory}`);
                    
                    // Traduction du bouton "Ajouter au panier" selon la langue
                    const addToCartText = {
                        'fr': 'Ajouter au panier',
                        'nl': 'Toevoegen aan winkelwagen',
                        'en': 'Add to cart'
                    }[currentLang] || 'Ajouter au panier';
                    
                    accessoiresHTML += `
                        <div class="accessoire-card" data-category="${displayCategorySlug}">
                            <div class="accessoire-category-badge">${displayCategoryLabel}</div>
                            <div class="accessoire-image">
                                ${hasValidImage ? 
                                   `<img src="${accessoire.imageUrl}" alt="${name}" onerror="this.onerror=null; this.src='images/placeholder-product.jpg';">` : 
                                   `<div class="placeholder-image"><i data-lucide="camera-off"></i></div>`}
                                
                                ${hasValidVideo ? 
                                   `<button class="video-button" onclick="openVideoModal('${accessoire.videoUrl}', '${name}')" aria-label="Voir la vidéo">
                                      <i class="fas fa-play"></i>
                                    </button>` : ''}
                            </div>
                            <div class="accessoire-info">
                                <h3>${name}</h3>
                                <p class="accessoire-subtitle"><i class="fas fa-tag" style="margin-right: 5px;"></i>${displayCategoryLabel}</p>
                                <p class="accessoire-description">${description}</p>
                                <button class="add-to-cart-btn" onclick="addToCart('${accessoire.id || ''}', '${name.replace(/'/g, "\\'")}')"><i class="fas fa-shopping-cart"></i> ${addToCartText}</button>
                            </div>
                        </div>
                    `;
                });
                
                // Injecter le HTML généré dans le conteneur
                accessoiresContainer.innerHTML = accessoiresHTML;
                
                // Initialiser les icônes Lucide
                if (window.lucide) {
                    lucide.createIcons();
                }
                
                // Activer le filtrage par catégorie
                setupCategoryFilter();
                
                // Supprimer l'overlay de chargement
                const loadingOverlay = document.querySelector('.loading-overlay');
                if (loadingOverlay) {
                    loadingOverlay.remove();
                }
            })
            .catch((error) => {
                console.error("Erreur lors du chargement des accessoires:", error);
                accessoiresContainer.innerHTML = '<div class="error-message">Une erreur est survenue lors du chargement des accessoires. Veuillez réessayer ultérieurement.</div>';
                
                // Supprimer l'overlay de chargement en cas d'erreur aussi
                const loadingOverlay = document.querySelector('.loading-overlay');
                if (loadingOverlay) {
                    loadingOverlay.remove();
                }
            });
        }).catch((error) => {
            console.error("Erreur lors du chargement des catégories:", error);
            // Continuer avec les catégories codées en dur si erreur
            console.log('Utilisation des catégories par défaut suite à une erreur');
            
            // Charger les accessoires même si les catégories ont échoué
            accessoiresCollection.where('businessId', '==', currentBusinessId).get()
                .then((querySnapshot) => {
                    console.log(`Nombre total d'accessoires récupérés: ${querySnapshot.size}`);
                    
                    if (querySnapshot.empty) {
                        accessoiresContainer.innerHTML = '<p class="no-items">Aucun accessoire disponible pour le moment.</p>';
                        return;
                    }
                    
                    // Récupérer tous les accessoires actifs (filtrage strict)
                    const accessoires = [];
                    const accessoiresInactifs = [];
                    
                    querySnapshot.forEach((doc) => {
                        const accessoire = { id: doc.id, ...doc.data() };
                        
                        // Log pour le débogage - voir tous les accessoires et leur statut
                        console.log(`Accessoire: ${accessoire.name}, ID: ${accessoire.id}, Statut actif:`, accessoire.active);
                        
                        // FILTRAGE STRICT: un accessoire est considéré actif UNIQUEMENT si active === true (explicitement)
                        if (accessoire.active === true) {
                            accessoires.push(accessoire);
                        } else {
                            accessoiresInactifs.push(accessoire.name || 'Accessoire sans nom');
                        }
                    });
                    
                    console.log(`Accessoires inactifs filtrés (${accessoiresInactifs.length}): ${accessoiresInactifs.join(', ')}`);
                    
                    // Si aucun accessoire actif, afficher un message
                    if (accessoires.length === 0) {
                        accessoiresContainer.innerHTML = '<p class="no-items">Aucun accessoire actif disponible pour le moment.</p>';
                        return;
                    }
                    
                    // Trier par catégorie puis par nom
                    accessoires.sort((a, b) => {
                        if (a.category === b.category) {
                            return a.name.localeCompare(b.name);
                        }
                        return a.category.localeCompare(b.category);
                    });
                    
                    // Générer le HTML pour chaque accessoire
                    let accessoiresHTML = '';
                    
                    accessoires.forEach((accessoire) => {
                        if (!accessoire) {
                            console.warn('Accessoire non défini détecté et ignoré');
                            return; // Ignorer les accessoires non définis
                        }
                        
                        let name = accessoire.name || 'Accessoire sans nom';
                        let description = accessoire.description || 'Aucune description disponible';
                        const category = accessoire.category || 'Autres';
                        
                        // Appliquer les traductions néerlandaises si on est sur la version NL
                        if (typeof isNLVersion === 'function' && isNLVersion()) {
                            if (typeof translateToNL === 'function') {
                                name = translateToNL(name, 'accessoryNames') || name;
                                description = translateToNL(description, 'accessoryDescriptions') || description;
                            }
                        }
                        
                        // Créer un slug pour la catégorie pour le filtrage
                        const categorySlug = category.toLowerCase()
                            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Enlever les accents
                            .replace(/[^\w\s-]/g, '') // Enlever les caractères spéciaux
                            .replace(/\s+/g, '-'); // Remplacer les espaces par des tirets
                        
                        // Débogage pour vérifier les URLs d'images et de vidéos
                        console.log(`Accessoire ${name}: imageUrl=${accessoire.imageUrl}, videoUrl=${accessoire.videoUrl}`);
                        
                        // Vérifier si l'URL de l'image est valide
                        const hasValidImage = accessoire.imageUrl && typeof accessoire.imageUrl === 'string' && 
                                           (accessoire.imageUrl.startsWith('http') || accessoire.imageUrl.startsWith('data:image'));
                        
                        // Vérifier si l'URL de la vidéo est valide
                        const hasValidVideo = accessoire.videoUrl && typeof accessoire.videoUrl === 'string' && 
                                              accessoire.videoUrl.trim() !== '';
                        
                        accessoiresHTML += `
                            <div class="accessoire-card" data-category="${categorySlug}">
                                <div class="accessoire-image">
                                    ${hasValidImage ? 
                                      `<img src="${accessoire.imageUrl}" alt="${name}" onerror="this.onerror=null; this.src='images/placeholder-product.jpg';">` : 
                                      `<div class="placeholder-image"><i data-lucide="camera-off"></i></div>`}
                                    
                                    ${hasValidVideo ? 
                                      `<button class="video-button" onclick="openVideoModal('${accessoire.videoUrl}', '${name}')" aria-label="Voir la vidéo">
                                         <i class="fas fa-play"></i>
                                       </button>` : ''}
                                </div>
                                <div class="accessoire-info">
                                    <h3>${name}</h3>
                                    <p class="accessoire-description">${description}</p>
                                </div>
                            </div>
                        `;
                    });
                    
                    // Injecter le HTML généré dans le conteneur
                    accessoiresContainer.innerHTML = accessoiresHTML;
                    
                    // Initialiser les icônes Lucide
                    if (window.lucide) {
                        lucide.createIcons();
                    }
                    
                    // Activer le filtrage par catégorie
                    setupCategoryFilter();
                    
                    // Supprimer l'overlay de chargement
                    const loadingOverlay = document.querySelector('.loading-overlay');
                    if (loadingOverlay) {
                        loadingOverlay.remove();
                    }
                })
                .catch((error) => {
                    console.error("Erreur lors du chargement des accessoires:", error);
                    accessoiresContainer.innerHTML = '<div class="error-message">Une erreur est survenue lors du chargement des accessoires. Veuillez réessayer ultérieurement.</div>';
                    
                    const loadingOverlay = document.querySelector('.loading-overlay');
                    if (loadingOverlay) {
                        loadingOverlay.remove();
                    }
                });
        });
    }
});

// Fonction pour ouvrir une modale avec une vidéo
function openVideoModal(videoUrl, title) {
    // Créer les éléments de la modale
    const modal = document.createElement('div');
    modal.className = 'video-modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${title || 'Vidéo'}</h3>
                <button class="close-button" onclick="closeVideoModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="video-container">
                    ${videoUrl.includes('youtube') || videoUrl.includes('youtu.be') ? 
                      `<iframe src="${getYoutubeEmbedUrl(videoUrl)}" frameborder="0" allowfullscreen></iframe>` :
                      `<video controls><source src="${videoUrl}" type="video/mp4">Votre navigateur ne prend pas en charge la lecture vidéo.</video>`}
                </div>
            </div>
        </div>
    `;
    
    // Ajouter à la page
    document.body.appendChild(modal);
    
    // Attendre un instant puis afficher avec transition
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
    
    // Ajouter un gestionnaire pour la touche Echap
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeVideoModal();
        }
    }, { once: true });
}

// Fonction pour fermer la modale vidéo
function closeVideoModal() {
    const modal = document.querySelector('.video-modal');
    if (modal) {
        // Animation de fermeture
        modal.classList.remove('active');
        
        // Supprimer après la transition
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// Fonction pour extraire l'URL d'intégration YouTube
function getYoutubeEmbedUrl(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    
    if (match && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}?autoplay=1`;
    }
    
    return url; // Retourner l'URL originale si elle ne correspond pas
}

// Configuration du filtrage par catégorie
function setupCategoryFilter() {
    const accessoireCards = document.querySelectorAll('.accessoire-card');
    const filterButtons = document.querySelectorAll('.category-filter button');
    
    // Si pas de boutons de filtre, ne rien faire
    if (!filterButtons.length) return;
    
    // Configurer les gestionnaires d'événements pour les boutons de filtre
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Retirer la classe active de tous les boutons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Ajouter la classe active au bouton cliqué
            button.classList.add('active');
            
            // Récupérer la catégorie à filtrer (utilisons data-category comme dans le HTML)
            const filterValue = button.getAttribute('data-category');
            
            // Filtrer les cartes
            accessoireCards.forEach(card => {
                if (filterValue === 'all') {
                    card.style.display = 'block';
                    console.log(' Affichage de tous les accessoires');
                    console.log('🔍 Affichage de tous les accessoires');
                } else {
                    const cardCategory = card.getAttribute('data-category');
                    console.log(`🔍 Vérification carte: catégorie=${cardCategory}, filtre=${filterValue}`);
                    if (cardCategory === filterValue) {
                        card.style.display = 'block';
                        console.log(`✅ Accessoire affiché: ${card.querySelector('h3')?.textContent || 'Sans nom'}`);
                    } else {
                        card.style.display = 'none';
                        console.log(`❌ Accessoire masqué: ${card.querySelector('h3')?.textContent || 'Sans nom'}`);
                    }
                }
            });
            
            // Vérifier s'il y a des accessoires visibles dans la catégorie sélectionnée
            const visibleCards = [...accessoireCards].filter(card => card.style.display !== 'none');
            console.log(`🔢 Nombre d'accessoires visibles: ${visibleCards.length}`);
            
            // Afficher un message si aucun accessoire n'est visible dans la catégorie
            const noItemsMessage = accessoiresContainer.querySelector('.no-items-in-category');
            if (visibleCards.length === 0 && filterValue !== 'all') {
                if (!noItemsMessage) {
                    const message = document.createElement('p');
                    message.className = 'no-items-in-category';
                    message.textContent = `Aucun accessoire disponible dans cette catégorie pour le moment.`;
                    accessoiresContainer.appendChild(message);
                }
            } else if (noItemsMessage) {
                noItemsMessage.remove();
            }
        });
    });
    
    // Activer le filtre "Tous" par défaut
    const allFilter = document.querySelector('.category-filter button[data-category="all"]');
    if (allFilter) {
        allFilter.classList.add('active');
    }
}
// Ajouter les styles CSS pour la modale vidéo et les animations
const style = document.createElement('style');
style.textContent = `
    /* Styles pour la modale vidéo */
    .video-modal {
        display: flex;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.8);
        z-index: 1000;
        justify-content: center;
        align-items: center;
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    .video-modal.active {
        opacity: 1;
    }
    
    .modal-content {
        background-color: white;
        border-radius: 8px;
        width: 90%;
        max-width: 800px;
        max-height: 90vh;
        overflow: hidden;
        transform: scale(0.9);
        transition: transform 0.3s ease;
    }
    
    .video-modal.active .modal-content {
        transform: scale(1);
    }
    
    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        border-bottom: 1px solid #eee;
    }
    
    .modal-header h3 {
        margin: 0;
        color: #333;
    }
    
    .close-button {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
    }
    
    .modal-body {
        padding: 20px;
    }
    
    .video-container {
        position: relative;
        width: 100%;
        padding-bottom: 56.25%; /* Ratio 16:9 */
    }
    
    .video-container iframe,
    .video-container video {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 4px;
    }
    
    /* Styles pour le bouton vidéo sur les cartes */
    .video-button {
        position: absolute;
        top: 10px;
        right: 10px;
        background-color: rgba(0, 0, 0, 0.7);
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        transition: background-color 0.2s;
    }
    
    .video-button i {
        color: white;
        font-size: 20px;
    }
    
    .video-button:hover {
        background-color: rgba(0, 0, 0, 0.9);
    }
    
    /* Spinner de chargement */
    .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(255, 255, 255, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }
    
    .loading-spinner-center {
        font-size: 2rem;
        color: #4a90e2;
    }
    
    /* Style pour les accessoires indisponibles */
    .placeholder-image {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        background-color: #f0f0f0;
        color: #999;
        font-size: 2rem;
    }
`;

document.head.appendChild(style);
