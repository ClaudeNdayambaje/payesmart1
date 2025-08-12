// Script pour charger et afficher les produits marketing depuis Firestore
document.addEventListener('DOMContentLoaded', async function() {
    // Initialisation de Firebase (importé depuis le fichier d'initialisation existant)
    try {
        await loadMarketingProducts();
    } catch (error) {
        console.error('Erreur lors du chargement des produits marketing:', error);
    }
});

// Configuration Firebase (utilise la même configuration que les autres scripts)
async function initializeFirebase() {
    // Si Firebase est déjà initialisé, l'utiliser
    if (window.firebase && window.firebase.apps.length) {
        return window.firebase;
    }
    
    // Sinon attendre que la config globale soit disponible
    // (généralement chargée par un autre script)
    return new Promise((resolve, reject) => {
        const checkFirebase = setInterval(() => {
            if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0) {
                clearInterval(checkFirebase);
                resolve(firebase);
            }
        }, 100);
        
        // Timeout après 5 secondes
        setTimeout(() => {
            clearInterval(checkFirebase);
            reject(new Error("Firebase n'a pas été initialisé après 5 secondes"));
        }, 5000);
    });
}

// Fonction pour charger les produits marketing
async function loadMarketingProducts() {
    try {
        const firebase = await initializeFirebase();
        const db = firebase.firestore();
        
        // Référence à la collection des produits marketing (utilise la même collection que l'admin)
        const productsRef = db.collection('produits');
        
        // Récupérer uniquement les produits actifs
        const productsSnapshot = await productsRef.where('active', '==', true).get();
        
        if (productsSnapshot.empty) {
            console.log('Aucun produit marketing actif trouvé');
            return;
        }
        
        // Conteneur pour les produits dynamiques
        const productsGrid = document.querySelector('.produits-grid');
        
        if (!productsGrid) {
            console.error('Conteneur .produits-grid non trouvé');
            return;
        }
        
        // Vider le conteneur des produits dynamiques
        productsGrid.innerHTML = '';
        
        // Créer un élément pour chaque produit
        productsSnapshot.forEach(doc => {
            const productData = doc.data();
            
            // Créer le HTML pour le produit
            const productHTML = createProductHTML(productData);
            
            // Ajouter le produit au conteneur
            productsGrid.innerHTML += productHTML;
        });
        
        // Une fois tous les produits ajoutés, configurer les boutons vidéo
        setupVideoButtons();
        
        console.log('Produits marketing chargés avec succès');
    } catch (error) {
        console.error('Erreur lors du chargement des produits marketing:', error);
    }
}

// Fonction pour créer le HTML d'un produit
function createProductHTML(product) {
    // Validation des données requises
    if (!product.name || !product.description) {
        console.warn('Produit incomplet ignoré:', product);
        return '';
    }
    
    // Les caractéristiques principales ont été retirées
    let featuresHTML = '';
    
    // Les spécifications techniques ont été retirées
    let specsHTML = '';
    
    // Construire les boutons CTA si présents
    let buttonsHTML = '';
    if (product.buttonCTAs && product.buttonCTAs.length > 0) {
        buttonsHTML = `
            <div class="produit-buttons">
                ${product.buttonCTAs.map(button => {
                    const buttonClass = button.type === 'primary' ? 'btn-produit' : 'btn-produit-secondary';
                    return `<a href="${button.url}" class="${buttonClass}">${button.label}</a>`;
                }).join('')}
            </div>
        `;
    } else {
        // Bouton par défaut si aucun n'est défini
        buttonsHTML = `
            <div class="produit-buttons">
                <a href="#" class="btn-produit">En savoir plus</a>
            </div>
        `;
    }
    
    // Ajouter un bouton vidéo si une URL vidéo est présente ET que l'option d'affichage est activée
    // La propriété showVideoButton est true par défaut si non spécifiée
    if (product.videoUrl && product.videoUrl.trim() !== '' && product.showVideoButton !== false) {
        const videoId = `video-${product.name.toLowerCase().replace(/\s+/g, '-')}`;
        console.log(`Ajout d'un bouton vidéo pour ${product.name} avec URL: ${product.videoUrl} (showVideoButton: ${product.showVideoButton})`);
        buttonsHTML += `
            <a href="#" class="btn-produit-secondary btn-video" data-video-url="${product.videoUrl}"><i class="fas fa-play-circle"></i> Voir la vidéo</a>
        `;
    } else if (product.videoUrl && product.videoUrl.trim() !== '') {
        console.log(`Bouton vidéo désactivé pour ${product.name} (showVideoButton: ${product.showVideoButton})`);
    } else {
        console.log(`Pas d'URL vidéo pour ${product.name}`);
    }
    
    // Utiliser prioritairement les images Firebase, puis fallback sur images locales
    let imageUrlToUse = product.imageUrl; // Priorité aux images Firebase
    
    // Si pas d'image Firebase, essayer les images locales
    if (!imageUrlToUse || imageUrlToUse.trim() === '') {
        let productId = '';
        
        // Convertir le nom du produit en identifiant pour correspondre aux fichiers d'images
        if (product.name) {
            productId = product.name.toLowerCase()
                .replace(/sunmi\s+/i, '') // Enlever 'SUNMI' s'il est présent
                .replace(/\s+/g, '-')      // Remplacer les espaces par des tirets
                .replace(/[^a-z0-9-]/g, ''); // Garder seulement les lettres, chiffres et tirets
        }
        
        // Définir un mapping des noms de produits connus vers les fichiers d'images statiques
        const knownProducts = {
            't3pro': 'sunmi-t3pro-family-poster.png',
            't3pro-family': 'sunmi-t3pro-family-poster.png',
            'p3mix': 'sunmi-p3mix-poster.png',
            'p3': 'sunmi-p3-poster.png',
            'd3mini': 'sunmi-d3mini-poster.png',
            'cpad': 'sunmi-cpad-poster.png',
            'v3': 'sunmi-v3-poster.png',
            'm3': 'sunmi-m3-poster.png',
            'b3mini': 'sunmi-b3mini-poster.png',
            'b8pro': 'sunmi-b8pro-single-poster.png',
            'b8-pro': 'sunmi-b8pro-single-poster.png'
        };
        
        // Tentative de faire correspondre l'ID extrait avec les fichiers connus
        let matchFound = false;
        Object.keys(knownProducts).forEach(key => {
            if (productId.includes(key)) {
                imageUrlToUse = `img/produits/${knownProducts[key]}`;
                matchFound = true;
                console.log(`Image statique trouvée pour ${product.name}:`, imageUrlToUse);
            }
        });
        
        // Si aucune correspondance n'est trouvée, utiliser un placeholder
        if (!matchFound) {
            if (product.name) {
                const productName = encodeURIComponent(product.name);
                imageUrlToUse = `https://placehold.co/600x400/EEE/31343C?text=${productName}`;
            }
            console.log(`Aucune image trouvée pour ${product.name}, utilisation du fallback:`, imageUrlToUse);
        }
    } else {
        console.log(`Image Firebase utilisée pour ${product.name}:`, imageUrlToUse);
    }

    // Générer le HTML complet du produit
    return `
        <div class="produit-card dynamic-product" data-product-id="${product.id || ''}">
            <img src="${imageUrlToUse}" alt="${product.name}" class="produit-image" onerror="this.onerror=null; this.src='https://placehold.co/600x400/EEE/31343C?text=Image+non+disponible';">
            <div class="produit-info">
                <h3>${product.name}</h3>
                ${product.subtitle ? `<p class="produit-tagline">${product.subtitle}</p>` : ''}
                <p class="produit-description">${product.description}</p>
                
                ${featuresHTML}
                ${specsHTML}
                
                <div class="produit-actions">
                    ${buttonsHTML}
                </div>
            </div>
        </div>
    `;
}

// Configuration des boutons vidéo pour les produits dynamiques
function setupVideoButtons() {
    // Sélectionner tous les boutons vidéo des produits dynamiques
    const videoButtons = document.querySelectorAll('.dynamic-product .btn-video');
    console.log('Boutons vidéo trouvés:', videoButtons.length);
    
    videoButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const videoUrl = this.getAttribute('data-video-url');
            console.log('Ouverture de la vidéo:', videoUrl);
            
            // Vérifier si la modale vidéo existe déjà
            let videoModal = document.getElementById('videoModal');
            
            if (!videoModal) {
                // Si la modale n'existe pas, la créer
                videoModal = document.createElement('div');
                videoModal.id = 'videoModal';
                videoModal.className = 'video-modal';
                
                // Ajouter le contenu de la modale
                videoModal.innerHTML = `
                    <div class="video-modal-content">
                        <div class="video-modal-header">
                            <h3>Vidéo du produit</h3>
                            <button id="closeVideoModal" class="close-video"><i class="fas fa-times"></i></button>
                        </div>
                        <div id="videoWrapper" class="video-wrapper">
                            <div id="loadingIndicator" class="loading-indicator">
                                <div class="spinner"></div>
                                <p>Chargement de la vidéo...</p>
                            </div>
                        </div>
                    </div>
                `;
                
                // Ajouter la modale au corps du document
                document.body.appendChild(videoModal);
                
                // Configurer le bouton de fermeture
                document.getElementById('closeVideoModal').addEventListener('click', function() {
                    videoModal.classList.remove('active');
                    // Vider le conteneur vidéo
                    document.getElementById('videoWrapper').innerHTML = '';
                });
                
                // Fermer la modale en cliquant en dehors du contenu
                videoModal.addEventListener('click', function(e) {
                    if (e.target === videoModal) {
                        videoModal.classList.remove('active');
                        // Vider le conteneur vidéo
                        document.getElementById('videoWrapper').innerHTML = '';
                    }
                });
            }
            
            // Vider le conteneur vidéo existant
            const videoWrapper = document.getElementById('videoWrapper');
            videoWrapper.innerHTML = '';
            
            // Afficher l'indicateur de chargement
            const loadingIndicator = document.createElement('div');
            loadingIndicator.id = 'loadingIndicator';
            loadingIndicator.className = 'loading-indicator';
            loadingIndicator.innerHTML = `
                <div class="spinner"></div>
                <p>Chargement de la vidéo...</p>
            `;
            videoWrapper.appendChild(loadingIndicator);
            
            // Créer l'élément vidéo
            const videoPlayer = document.createElement('video');
            videoPlayer.className = 'video-player';
            videoPlayer.controls = true;
            videoPlayer.autoplay = true;
            videoPlayer.playsInline = true;
            videoPlayer.src = videoUrl;
            videoPlayer.style.width = '100%';
            videoPlayer.style.maxHeight = '80vh';
            videoPlayer.style.display = 'none'; // Caché pendant le chargement
            
            // Ajouter la vidéo au wrapper
            videoWrapper.appendChild(videoPlayer);
            
            // Gérer les événements vidéo
            videoPlayer.addEventListener('loadedmetadata', () => {
                console.log('Métadonnées vidéo chargées, durée:', videoPlayer.duration);
                // Masquer l'indicateur de chargement
                loadingIndicator.style.display = 'none';
                // Afficher la vidéo
                videoPlayer.style.display = 'block';
            });
            
            videoPlayer.addEventListener('canplay', () => {
                console.log('La vidéo peut être lue maintenant. Dimensions:', videoPlayer.videoWidth, 'x', videoPlayer.videoHeight);
                // Ajuster la taille de la vidéo si nécessaire
                const aspectRatio = videoPlayer.videoWidth / videoPlayer.videoHeight;
                if (aspectRatio > 1.77) { // format plus large que 16:9
                    videoPlayer.style.width = '100%';
                    videoPlayer.style.height = 'auto';
                } else {
                    videoPlayer.style.height = '70vh';
                    videoPlayer.style.width = 'auto';
                    videoPlayer.style.margin = '0 auto';
                }
            });
            
            videoPlayer.addEventListener('error', (e) => {
                console.error('Erreur de chargement vidéo:', e);
                loadingIndicator.innerHTML = `
                    <p class="error-message">Erreur lors du chargement de la vidéo.</p>
                `;
            });
            
            // Activer la modale
            videoModal.classList.add('active');
        });
    });
}
