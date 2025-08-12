/**
 * PAYESMART - AFFICHAGE PROFESSIONNEL DES ACCESSOIRES
 * Script optimisé pour une présentation professionnelle des cartes d'accessoires
 * Version: 2.1.0
 */

document.addEventListener('DOMContentLoaded', () => {
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
    
    // Sélectionner le conteneur des accessoires
    const accessoiresContainer = document.querySelector('.accessoires-grid');
    
    // Vérifier si nous sommes sur la page des accessoires
    if (accessoiresContainer) {
        // Créer l'overlay de chargement avec animation et texte
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-overlay';
        loadingDiv.innerHTML = `
            <div class="loading-spinner-center">
                <i class="fas fa-spinner fa-spin"></i>
                <span class="loading-text">Chargement de vos accessoires...</span>
            </div>
        `;
        document.body.appendChild(loadingDiv);
        
        console.log('Chargement des accessoires depuis Firestore...');
        
        // Récupérer tous les accessoires actifs
        accessoiresCollection.get()
            .then((querySnapshot) => {
                console.log(`Nombre total d'accessoires récupérés: ${querySnapshot.size}`);
                
                if (querySnapshot.empty) {
                    accessoiresContainer.innerHTML = '<p class="no-items">Aucun accessoire disponible pour le moment.</p>';
                    return;
                }
                
                // Traitement des accessoires
                const accessoires = [];
                const accessoiresInactifs = [];
                
                querySnapshot.forEach((doc) => {
                    const accessoire = { id: doc.id, ...doc.data() };
                    
                    // Filtrage strict: un accessoire est considéré actif UNIQUEMENT si active === true
                    if (accessoire.active === true) {
                        accessoires.push(accessoire);
                    } else {
                        accessoiresInactifs.push(accessoire.name || 'Accessoire sans nom');
                    }
                });
                
                console.log(`${accessoires.length} accessoires actifs chargés, ${accessoiresInactifs.length} inactifs filtrés`);
                
                // Si aucun accessoire actif, afficher un message
                if (accessoires.length === 0) {
                    accessoiresContainer.innerHTML = '<p class="no-items">Aucun accessoire disponible pour le moment.</p>';
                    return;
                }
                
                // Trier les accessoires par catégorie
                accessoires.sort((a, b) => {
                    // Ordre personnalisé pour les catégories
                    const order = {
                        'impression': 1,
                        'paiement': 2,
                        'affichage': 3,
                        'reseau': 4,
                        'divers': 5
                    };
                    
                    const orderA = order[a.category] || 99;
                    const orderB = order[b.category] || 99;
                    
                    if (orderA !== orderB) {
                        return orderA - orderB;
                    }
                    
                    // Si même catégorie, trier par nom
                    return a.name.localeCompare(b.name);
                });
                
                // Fonction pour normaliser les catégories en valeurs de filtrage
                const normalizeCategoryForFilter = (categoryName) => {
                    return categoryName.toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/\s+/g, '-');
                };
                
                // Définir les icônes pour chaque catégorie - SYNCHRO avec dynamic-categories.js
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
                    'support': 'stand'
                };
                
                // Fonction pour obtenir l'icône appropriée pour une catégorie
                const getCategoryIcon = (categoryName) => {
                    const normalizedName = categoryName.toLowerCase();
                    
                    // Parcourir les clés du dictionnaire categoryIcons
                    for (const key in categoryIcons) {
                        // Si le nom de catégorie contient la clé
                        if (normalizedName.includes(key)) {
                            return categoryIcons[key];
                        }
                    }
                    
                    // Catégorie par défaut si aucune correspondance n'est trouvée
                    return 'package';
                };
                
                // Générer le HTML pour chaque accessoire avec une structure professionnelle
                let accessoiresHTML = '';
                let currentCategory = '';
                let delay = 0;
                
                accessoires.forEach((accessoire) => {
                    if (!accessoire) {
                        console.warn('Accessoire non défini détecté et ignoré');
                        return;
                    }
                    
                    // Extraction des données de l'accessoire
                    const name = accessoire.name || 'Accessoire sans nom';
                    const description = accessoire.description || 'Aucune description disponible';
                    const category = accessoire.category || 'divers';
                    const prix = accessoire.prix || 'Prix sur demande';
                    const features = accessoire.features || [];
                    const isNew = accessoire.isNew === true;
                    const compatibility = accessoire.compatibility || 'Compatible avec tous les systèmes PayeSmart';
                    
                    // Si c'est une nouvelle catégorie, ajouter un séparateur (pour une première version, on le désactive)
                    // if (category !== currentCategory) {
                    //     accessoiresHTML += `
                    //         <div class="category-separator">
                    //             <h2>${getCategoryLabel(category)}</h2>
                    //         </div>
                    //     `;
                    //     currentCategory = category;
                    // }
                    
                    // Vérification de la validité de l'image
                    const hasValidImage = accessoire.imageUrl && typeof accessoire.imageUrl === 'string' && 
                                         (accessoire.imageUrl.startsWith('http') || accessoire.imageUrl.startsWith('data:image'));
                    
                    // Vérification de la validité de la vidéo
                    const hasValidVideo = accessoire.videoUrl && typeof accessoire.videoUrl === 'string' && 
                                         accessoire.videoUrl.trim() !== '';
                    
                    // Création de la carte avec style pro
                    // Normaliser la catégorie pour le filtrage
                    const normalizedCategory = normalizeCategoryForFilter(getCategoryLabel(category));
                    
                    accessoiresHTML += `
                        <div class="accessoire-card" data-category="${normalizedCategory}" data-id="${accessoire.id}" style="animation-delay: ${delay}ms">
                            <!-- Image de l'accessoire -->
                            <div class="accessoire-image">
                                ${hasValidImage ? 
                                    `<img src="${accessoire.imageUrl}" alt="${name}" loading="lazy" onerror="this.onerror=null; this.src='img/placeholder-accessoire.jpg';">` : 
                                    `<div class="placeholder-image"><i data-lucide="${categoryIcons[category] || 'package'}"></i></div>`
                                }
                                
                                <!-- Badge Nouveau si applicable -->
                                ${isNew ? '<span class="new-badge">Nouveau</span>' : ''}
                                
                                <!-- Bouton vidéo si disponible -->
                                ${hasValidVideo ? 
                                    `<button class="video-button" onclick="openVideoModal('${accessoire.videoUrl}', '${name.replace(/'/g, "\\'")}')">
                                        <i data-lucide="play" style="width: 20px; height: 20px;"></i>
                                    </button>` : 
                                    ''
                                }
                            </div>
                            
                            <!-- Détails de l'accessoire -->
                            <div class="accessoire-details">
                                <h3>${name}</h3>
                                <p class="accessoire-subtitle"><i class="fas fa-tag" style="margin-right: 5px;"></i>${getCategoryLabel(category)}</p>
                                <p class="accessoire-description">${description}</p>
                                <button class="voir-plus-btn" data-accessoire-id="${accessoire.id}">
                                    <span class="voir-plus-text">Voir plus</span>
                                    <i class="fas fa-chevron-down"></i>
                                </button>
                                
                                <!-- Badges de fonctionnalités -->
                                ${features.length > 0 ? 
                                    `<div class="accessoire-features">
                                        ${features.map(feature => `
                                            <span class="accessoire-feature-badge">
                                                <i data-lucide="check-circle" style="width: 14px; height: 14px; margin-right: 4px;"></i>
                                                ${feature}
                                            </span>
                                        `).join('')}
                                    </div>` : 
                                    ''
                                }
                                

                            </div>
                        </div>
                    `;
                    
                    // Incrémenter le délai pour l'animation d'apparition séquentielle
                    delay += 50;
                });
                
                // Injecter le HTML généré dans le conteneur
                accessoiresContainer.innerHTML = accessoiresHTML;
                
                // Initialiser les icônes Lucide
                if (window.lucide) {
                    lucide.createIcons();
                }
                
                // Configuration des filtres
                setupCategoryFilter();
                
                // Supprimer l'overlay de chargement
                setTimeout(() => {
                    const loadingOverlay = document.querySelector('.loading-overlay');
                    if (loadingOverlay) {
                        loadingOverlay.classList.add('fade-out');
                        setTimeout(() => loadingOverlay.remove(), 500);
                    }
                }, 500);
            })
            .catch((error) => {
                console.error("Erreur lors du chargement des accessoires:", error);
                accessoiresContainer.innerHTML = `
                    <div class="error-message">
                        <i data-lucide="alert-triangle" style="width: 24px; height: 24px; margin-bottom: 10px;"></i>
                        <p>Impossible de charger les accessoires.</p>
                        <p class="error-details">Veuillez réessayer ultérieurement ou contacter le support.</p>
                    </div>
                `;
                
                // Supprimer l'overlay de chargement en cas d'erreur
                const loadingOverlay = document.querySelector('.loading-overlay');
                if (loadingOverlay) {
                    loadingOverlay.remove();
                }
            });
    }
    
    // Fonction pour associer les catégories spécifiques aux catégories génériques de filtrage
    function getCategoryLabel(category) {
        // Catégories spécifiques vers catégories génériques
        const specificToGeneric = {
            // Impression
            'imprimante': 'impression',
            'imprimante thermique': 'impression',
            'imprimante ticket': 'impression',
            
            // Scanner - séparé de l'impression
            'scanner': 'scanner',
            'scan': 'scanner',
            
            // Paiement
            'terminal de paiement': 'Paiement',
            'tiroir-caisse': 'Paiement',
            'tiroir caisse': 'Paiement',
            'caisse': 'Paiement',
            
            // Affichage
            'cran': 'Affichage',
            'écran': 'Affichage',
            'affichage client': 'Affichage',
            'afficheur': 'Affichage',
            
            // Réseau
            'reseau': 'Réseau',
            'réseau': 'Réseau',
            'wifi': 'Réseau',
            'routeur': 'Réseau',
            'switch': 'Réseau'
        };
        
        // Les catégories génériques directes sont aussi acceptées
        const genericCategories = {
            'impression': 'impression',
            'paiement': 'paiement',
            'affichage': 'affichage',
            'reseau': 'reseau',
            'réseau': 'reseau',
            'divers': 'divers',
            'scanner': 'scanner',
            'tiroir': 'tiroir',
            'caisse': 'paiement'
        };
        
        // Convertir en minuscules pour la recherche non sensible à la casse
        const normalizedCategory = category ? category.toLowerCase() : '';
        
        // Chercher d'abord dans les catégories spécifiques
        for (const [specific, generic] of Object.entries(specificToGeneric)) {
            if (normalizedCategory.includes(specific.toLowerCase())) {
                return generic;
            }
        }
        
        // Ensuite chercher dans les catégories génériques
        if (normalizedCategory in genericCategories) {
            return genericCategories[normalizedCategory];
        }
        
        // Par défaut
        return 'Divers';
    }
});

// Fonction pour ouvrir une modale avec une vidéo
function openVideoModal(videoUrl, title) {
    // Créer la modale si elle n'existe pas déjà
    let modal = document.querySelector('.video-modal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'video-modal';
        document.body.appendChild(modal);
    }
    
    // Contenu de la modale
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="close-button" onclick="closeVideoModal()">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="video-container">
                    ${isYoutubeUrl(videoUrl) ? 
                        `<iframe src="${getYoutubeEmbedUrl(videoUrl)}" frameborder="0" allowfullscreen></iframe>` : 
                        `<video src="${videoUrl}" controls></video>`
                    }
                </div>
            </div>
        </div>
    `;
    
    // Afficher la modale avec une animation
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);
    
    // Initialiser les icônes Lucide
    if (window.lucide) {
        lucide.createIcons();
    }
    
    // Empêcher le défilement du body
    document.body.style.overflow = 'hidden';
    
    // Ajouter un gestionnaire d'événement pour fermer la modale en cliquant à l'extérieur
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeVideoModal();
        }
    });
    
    // Ajouter un gestionnaire d'événement pour fermer avec la touche Escape
    document.addEventListener('keydown', closeOnEscape);
}

// Fonction pour fermer la modale vidéo
function closeVideoModal() {
    const modal = document.querySelector('.video-modal');
    
    if (modal) {
        // Animation de fermeture
        modal.classList.remove('active');
        
        // Supprimer après l'animation
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = '';
            document.removeEventListener('keydown', closeOnEscape);
        }, 300);
    }
}

// Gestionnaire d'événement pour fermer avec Escape
function closeOnEscape(e) {
    if (e.key === 'Escape') {
        closeVideoModal();
    }
}

// Fonction pour vérifier si c'est une URL YouTube
function isYoutubeUrl(url) {
    return url.includes('youtube.com') || url.includes('youtu.be');
}

// Fonction pour extraire l'URL d'intégration YouTube
function getYoutubeEmbedUrl(url) {
    let videoId;
    
    if (url.includes('youtube.com/watch')) {
        videoId = new URL(url).searchParams.get('v');
    } else if (url.includes('youtu.be')) {
        videoId = url.split('/').pop();
    } else {
        return url; // Retourner l'URL telle quelle si ce n'est pas une URL YouTube reconnue
    }
    
    return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
}

// Configuration du filtrage par catégorie
function setupCategoryFilter() {
    const filterButtons = document.querySelectorAll('.category-filter button');
    const accessoireCards = document.querySelectorAll('.accessoire-card');
    
    // Convertir les attributs data-filter "all" en "tous" pour compatibilité
    filterButtons.forEach(button => {
        if (button.getAttribute('data-filter') === 'all') {
            button.setAttribute('data-filter', 'tous');
        }
    });
    
    // Ajouter des écouteurs d'événements à chaque bouton
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Retirer la classe active de tous les boutons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Ajouter la classe active au bouton cliqué
            button.classList.add('active');
            
            // Récupérer la catégorie à filtrer
            const filterValue = button.getAttribute('data-filter');
            
            // Animation sur les cartes
            let delay = 0;
            
            // Filtrer les cartes
            accessoireCards.forEach(card => {
                // Appliquer un délai unique à chaque carte
                card.style.animationDelay = `${delay}ms`;
                
                if (filterValue === 'tous' || card.getAttribute('data-category') === filterValue) {
                    card.style.display = 'block';
                    // Réinitialiser l'animation
                    card.style.animation = 'none';
                    card.offsetHeight; // Force reflow
                    card.style.animation = `cardAppear 0.5s forwards ${delay}ms`;
                    delay += 50;
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
    
    // Activer le filtre "Tous" par défaut
    const allFilter = document.querySelector('.category-filter button[data-filter="tous"]');
    if (allFilter) {
        allFilter.classList.add('active');
    }
}

// Vérifier si le style a déjà été ajouté pour éviter les doublons
if (!document.querySelector('#fade-overlay-styles')) {
    const fadeStyle = document.createElement('style');
    fadeStyle.id = 'fade-overlay-styles';
    fadeStyle.textContent = `
        .loading-overlay {
            transition: opacity 0.5s ease;
        }
        
        .loading-overlay.fade-out {
            opacity: 0;
        }
        
        .error-message {
            text-align: center;
            padding: 40px;
            background-color: #fff5f5;
            border-radius: 10px;
            color: #e53e3e;
            margin: 20px auto;
            max-width: 600px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .error-message p {
            margin: 5px 0;
        }
        
        .error-details {
            font-size: 0.9rem;
            opacity: 0.8;
        }
        
        .no-items {
            text-align: center;
            padding: 40px;
            color: var(--text-secondary);
            font-size: 1.2rem;
        }
    `;
    document.head.appendChild(fadeStyle);
}

// L'ajout a déjà été fait plus haut avec vérification d'existence

// Créer une image de placeholder pour les accessoires sans image
const createPlaceholderImage = () => {
    // Vérifier si l'image placeholder existe déjà
    if (!document.querySelector('img[src="img/placeholder-accessoire.jpg"]')) {
        const placeholderImg = new Image();
        placeholderImg.src = "img/placeholder-accessoire.jpg";
        placeholderImg.style.display = "none";
        document.body.appendChild(placeholderImg);
    }
};
