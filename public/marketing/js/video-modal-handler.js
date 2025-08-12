/**
 * Gestionnaire de vidéos pour la page marketing/solutions.html
 * Ce script gère l'ouverture des vidéos dans une modale professionnelle
 */

// Variables globales pour la modale vidéo
let videoModalInstance = null;
let videoPlayerContainerInstance = null;
let videoLoadingInstance = null;

// Fonction pour configurer les gestionnaires d'événements pour les boutons vidéo
function setupVideoButtonHandlers() {
    // Sélectionner tous les boutons vidéo
    const videoButtons = document.querySelectorAll('.btn-video');
    
    // Vérifier s'il y a des boutons vidéo
    if (videoButtons.length === 0) {
        console.log('Aucun bouton vidéo trouvé sur cette page');
        return;
    }
    
    console.log(`${videoButtons.length} boutons vidéo trouvés et configurés`);
    
    // Créer la modale vidéo si elle n'existe pas déjà
    if (!videoModalInstance) {
        createVideoModal();
    }
    
    // Ajouter les gestionnaires d'événements à chaque bouton vidéo
    videoButtons.forEach(button => {
        // Éviter les doublons d'événements
        button.removeEventListener('click', handleVideoButtonClick);
        button.addEventListener('click', handleVideoButtonClick);
    });
}

// Gestionnaire d'événement pour le clic sur les boutons vidéo
function handleVideoButtonClick(event) {
    event.preventDefault();
    
    // Vérifier d'abord l'attribut data-video (nouveau format)
    let videoUrl = this.getAttribute('data-video');
    
    // Si non trouvé, essayer avec data-video-url (ancien format)
    if (!videoUrl) {
        videoUrl = this.getAttribute('data-video-url');
    }
    
    if (!videoUrl) {
        console.error('Aucune URL vidéo spécifiée pour ce bouton (attributs data-video ou data-video-url manquants)');
        return;
    }
    
    console.log('URL vidéo trouvée:', videoUrl);
    
    // Ouvrir la modale vidéo
    openVideoModalPlayer(videoUrl);
}

// Créer la modale vidéo
function createVideoModal() {
    // Vérifier si la modale existe déjà
    let existingModal = document.getElementById('video-modal-player');
    if (existingModal) {
        videoModalInstance = existingModal;
        videoPlayerContainerInstance = document.getElementById('video-player-container');
        videoLoadingInstance = document.getElementById('video-loading');
        return;
    }
    
    // Créer la modale
    const videoModal = document.createElement('div');
    videoModal.id = 'video-modal-player';
    videoModal.className = 'video-modal';
    
    // Structure de la modale
    videoModal.innerHTML = `
        <div class="video-modal-container">
            <div class="video-modal-content">
                <div class="video-modal-header">
                    <h3>Vidéo du produit</h3>
                    <button id="close-video-modal-player" aria-label="Fermer">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="video-modal-body">
                    <div class="video-container">
                        <div id="video-loading" class="video-loading">
                            <div class="spinner"></div>
                            <p>Chargement de la vidéo...</p>
                        </div>
                        <div id="video-player-container"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Ajouter la modale au document
    document.body.appendChild(videoModal);
    
    // Références aux éléments
    videoModalInstance = videoModal;
    videoPlayerContainerInstance = document.getElementById('video-player-container');
    videoLoadingInstance = document.getElementById('video-loading');
    
    // Gestionnaire pour fermer la modale
    document.getElementById('close-video-modal-player').addEventListener('click', () => {
        closeVideoModalPlayer();
    });
    
    // Fermer également en cliquant à l'extérieur
    videoModal.addEventListener('click', (event) => {
        if (event.target === videoModal) {
            closeVideoModalPlayer();
        }
    });
    
    // Ajouter du CSS pour la modale vidéo
    addVideoModalStyles();
}

// Ajouter les styles CSS pour la modale
function addVideoModalStyles() {
    if (document.getElementById('video-modal-player-styles')) return;
    
    const modalStyles = document.createElement('style');
    modalStyles.id = 'video-modal-player-styles';
    modalStyles.textContent = `
        .video-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.85);
            z-index: 9999;
            justify-content: center;
            align-items: center;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .video-modal.active {
            display: flex;
            opacity: 1;
        }
        
        .video-modal-container {
            width: 90%;
            max-width: 900px;
            position: relative;
        }
        
        .video-modal-content {
            background-color: #222;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
        }
        
        .video-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            background-color: #333;
            color: white;
        }
        
        .video-modal-header h3 {
            margin: 0;
            font-size: 18px;
        }
        
        .video-modal-header button {
            background: transparent;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 30px;
            height: 30px;
            transition: all 0.2s;
        }
        
        .video-modal-header button:hover {
            transform: scale(1.1);
            color: #ff8c00;
        }
        
        .video-modal-body {
            padding: 0;
        }
        
        .video-container {
            position: relative;
            width: 100%;
            padding-top: 56.25%; /* 16:9 aspect ratio */
            background-color: #000;
        }
        
        .video-loading {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: white;
            z-index: 2;
            background-color: rgba(0, 0, 0, 0.7);
        }
        
        .video-loading .spinner {
            width: 50px;
            height: 50px;
            border: 5px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: #ff8c00;
            animation: spin 1s linear infinite;
            margin-bottom: 15px;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        #video-player-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1;
        }
        
        .video-player {
            width: 100%;
            height: 100%;
            outline: none;
        }
    `;
    document.head.appendChild(modalStyles);
}

// Fonction pour ouvrir la modale et jouer la vidéo
function openVideoModalPlayer(videoUrl) {
    console.log('Ouverture de la vidéo:', videoUrl);
    
    // Vérifier que la modale est créée
    if (!videoModalInstance) {
        createVideoModal();
    }
    
    // Vérifier à nouveau après création
    if (!videoModalInstance || !videoPlayerContainerInstance) {
        console.error('Modale vidéo non disponible');
        return;
    }
    
    // Vider le conteneur de vidéo existant
    videoPlayerContainerInstance.innerHTML = '';
    
    // Afficher l'indicateur de chargement
    if (videoLoadingInstance) videoLoadingInstance.style.display = 'flex';
    
    // Créer l'élément vidéo
    const videoElement = document.createElement('video');
    videoElement.className = 'video-player';
    videoElement.controls = true;
    videoElement.autoplay = true;
    videoElement.playsInline = true;
    videoElement.src = videoUrl;
    
    // Gérer les événements de la vidéo
    videoElement.addEventListener('loadeddata', () => {
        // Cacher l'indicateur de chargement une fois la vidéo chargée
        if (videoLoadingInstance) videoLoadingInstance.style.display = 'none';
    });
    
    videoElement.addEventListener('error', (e) => {
        // Analyse détaillée de l'erreur
        const videoError = videoElement.error;
        let errorMessage = 'Erreur lors du chargement de la vidéo';
        let errorDetails = '';
        
        if (videoError) {
            console.error('Détails de l\'erreur vidéo:', videoError);
            
            // Codes d'erreur spécifiques aux éléments vidéo
            switch(videoError.code) {
                case 1: // MEDIA_ERR_ABORTED
                    errorDetails = 'La lecture a été interrompue par l\'utilisateur';
                    break;
                case 2: // MEDIA_ERR_NETWORK
                    errorDetails = 'Erreur réseau (CORS, accès refusé ou fichier introuvable)';
                    break;
                case 3: // MEDIA_ERR_DECODE
                    errorDetails = 'Erreur de décodage du format vidéo';
                    break;
                case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
                    errorDetails = 'Format vidéo non supporté ou URL incorrecte';
                    break;
                default:
                    errorDetails = 'Erreur inconnue';
            }
        }
        
        // Tenter une requête CORS pour vérifier l'accès
        fetch(videoUrl, { method: 'HEAD' })
            .then(response => {
                if (!response.ok) {
                    console.error(`Erreur HTTP: ${response.status} ${response.statusText}`);
                    errorDetails += ` (HTTP ${response.status})`;
                } else {
                    console.log('URL accessible mais problème avec le format vidéo ou CORS');
                }
            })
            .catch(fetchError => {
                console.error('Erreur lors de la vérification de l\'URL:', fetchError);
                errorDetails += ' - ' + fetchError.message;
            })
            .finally(() => {
                // Afficher l'erreur dans la modale avec l'URL pour débogage
                if (videoLoadingInstance) {
                    videoLoadingInstance.innerHTML = `
                        <div class="error-icon">
                            <i class="fas fa-exclamation-circle" style="font-size: 40px; color: #ff3333;"></i>
                        </div>
                        <p>Erreur lors du chargement de la vidéo. Veuillez réessayer ultérieurement.</p>
                        <p style="font-size: 12px; color: #aaa; max-width: 80%; overflow-wrap: break-word;">
                            Détails: ${errorDetails}<br>
                            URL: ${videoUrl.substring(0, 100)}${videoUrl.length > 100 ? '...' : ''}
                        </p>
                    `;
                }
            });
    });
    
    // Ajouter la vidéo au conteneur
    videoPlayerContainerInstance.appendChild(videoElement);
    
    // Afficher la modale
    videoModalInstance.classList.add('active');
    
    // Désactiver le défilement de la page
    document.body.style.overflow = 'hidden';
}

// Fonction pour fermer la modale vidéo
function closeVideoModalPlayer() {
    if (!videoModalInstance) return;
    
    // Masquer la modale
    videoModalInstance.classList.remove('active');
    
    // Réactiver le défilement de la page
    document.body.style.overflow = '';
    
    // Arrêter la vidéo en cours de lecture
    setTimeout(() => {
        if (videoPlayerContainerInstance) {
            videoPlayerContainerInstance.innerHTML = '';
        }
    }, 300); // Attendre que la transition de fermeture soit terminée
}
