// Script pour afficher les accessoires depuis Firebase sur la page nos-accessoires.html
// Version: 2.0.0 - Harmonisé avec le script des produits, sans authentification anonyme

document.addEventListener('DOMContentLoaded', () => {
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
    
    // Configuration Firebase (identique à celle des produits)
    const firebaseConfig = {
        apiKey: "AIzaSyA1YCtMuV9XHstSVdiHfkODwvcMh9fGdqk",
        authDomain: "paysmart-admin.firebaseapp.com",
        projectId: "paysmart-admin",
        storageBucket: "paysmart-admin.appspot.com",
        messagingSenderId: "523481847092",
        appId: "1:523481847092:web:5f789e68ba9cd04c7a4d8c"
    };
    
    // Initialiser Firebase si ce n'est pas déjà fait
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    
    const db = firebase.firestore();
    const accessoiresCollection = db.collection('accessoires');
    
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
        
        // Charger les accessoires depuis Firestore directement (comme pour les produits)
        console.log('Chargement des accessoires depuis Firestore...');
        
        accessoiresCollection.get()
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
                    
                    const name = accessoire.name || 'Accessoire sans nom';
                    const description = accessoire.description || 'Aucune description disponible';
                    const category = accessoire.category || 'Autres';
                    
                    // Débogage pour vérifier les URLs d'images et de vidéos
                    console.log(`Accessoire ${name}: imageUrl=${accessoire.imageUrl}, videoUrl=${accessoire.videoUrl}`);
                    
                    // Vérifier si l'URL de l'image est valide
                    const hasValidImage = accessoire.imageUrl && typeof accessoire.imageUrl === 'string' && 
                                       (accessoire.imageUrl.startsWith('http') || accessoire.imageUrl.startsWith('data:image'));
                    
                    // Vérifier si l'URL de la vidéo est valide
                    const hasValidVideo = accessoire.videoUrl && typeof accessoire.videoUrl === 'string' && 
                                         accessoire.videoUrl.trim() !== '';
                    
                    accessoiresHTML += `
                        <div class="accessoire-card" data-category="${category}">
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
                
                // Supprimer l'overlay de chargement en cas d'erreur aussi
                const loadingOverlay = document.querySelector('.loading-overlay');
                if (loadingOverlay) {
                    loadingOverlay.remove();
                }
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
    
    // Collecter toutes les catégories uniques pour potentiellement générer les boutons
    const categories = new Set();
    accessoireCards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (category) categories.add(category);
    });
    
    // Configurer les gestionnaires d'événements pour les boutons de filtre
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Retirer la classe active de tous les boutons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Ajouter la classe active au bouton cliqué
            button.classList.add('active');
            
            // Récupérer la catégorie à filtrer
            const filterValue = button.getAttribute('data-filter');
            
            // Filtrer les cartes
            accessoireCards.forEach(card => {
                if (filterValue === 'tous' || card.getAttribute('data-category') === filterValue) {
                    card.style.display = 'block';
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
