// Configuration Firebase pour les vidéos
document.addEventListener('DOMContentLoaded', function() {
    // Référence vers la vidéo de démonstration de paiement
    const paymentVideo = document.getElementById('payment-demo-video');
    
    // Référence aux éléments pour les vidéos des produits
    setupProductVideos();
    
    if (paymentVideo) {
        // Remplacer l'URL locale par l'URL Firebase
        // URL Firebase réelle pour la vidéo payment-demo.mp4
        const firebaseVideoUrl = 'https://firebasestorage.googleapis.com/v0/b/logiciel-de-caisse-7e58e.appspot.com/o/payment-demo.mp4?alt=media';
        
        // Créer un nouvel élément source pour la vidéo
        const videoSource = document.querySelector('#payment-demo-video source') || document.createElement('source');
        videoSource.src = firebaseVideoUrl;
        videoSource.type = 'video/mp4';
        
        if (!document.querySelector('#payment-demo-video source')) {
            paymentVideo.appendChild(videoSource);
        }
        
        console.log('Vidéo chargée depuis Firebase Storage');
        
        // Gestion du bouton de lecture alternatif
        const playButton = document.querySelector('.video-play-button');
        if (playButton) {
            playButton.addEventListener('click', function() {
                if (paymentVideo.paused) {
                    paymentVideo.play();
                    playButton.style.opacity = "0";
                } else {
                    paymentVideo.pause();
                    playButton.style.opacity = "1";
                }
            });
            
            // Masquer le bouton de lecture lorsque la vidéo est en cours de lecture
            paymentVideo.addEventListener('play', function() {
                playButton.style.opacity = "0";
            });
            
            // Afficher le bouton de lecture lorsque la vidéo est en pause
            paymentVideo.addEventListener('pause', function() {
                playButton.style.opacity = "1";
            });
        }
        
        paymentVideo.src = firebaseVideoUrl;
        
        paymentVideo.addEventListener('error', function(e) {
            console.error('Erreur de chargement de la vidéo:', e);
            
            // En cas d'erreur, revenir à la vidéo locale ou afficher un message
            const errorMsg = document.createElement('div');
            errorMsg.className = 'video-error';
            errorMsg.textContent = 'La vidéo n\'est pas disponible pour le moment.';
            
            // Remplacer la vidéo par le message d'erreur
            paymentVideo.parentNode.replaceChild(errorMsg, paymentVideo);
        });
        
        paymentVideo.addEventListener('loadeddata', function() {
            console.log('Vidéo chargée avec succès');
            // Mettre à jour l'interface si nécessaire une fois la vidéo chargée
        });
    }
    
    // Fonction pour configurer les vidéos des produits
    function setupProductVideos() {
        // Vérifier si nous sommes sur une page avec des produits
        const produitsGrid = document.querySelector('.produits-grid');
        
        if (!produitsGrid) return;
        
        // Créer la modal vidéo si elle n'existe pas déjà
        let videoModal = document.getElementById('video-modal');
        if (!videoModal) {
            videoModal = document.createElement('div');
            videoModal.id = 'video-modal';
            videoModal.className = 'modal';
            videoModal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <span class="close-video-modal">&times;</span>
                        <h3>Vidéo du produit</h3>
                    </div>
                    <div class="modal-body">
                        <video id="video-player" controls>
                            <source src="" type="video/mp4">
                            Votre navigateur ne prend pas en charge la lecture vidéo.
                        </video>
                    </div>
                </div>
            `;
            document.body.appendChild(videoModal);
            
            // Fermer la modal en cliquant sur le bouton de fermeture
            const closeBtn = videoModal.querySelector('.close-video-modal');
            closeBtn.addEventListener('click', () => {
                closeVideoModal();
            });
            
            // Fermer la modal en cliquant en dehors du contenu
            window.addEventListener('click', (e) => {
                if (e.target === videoModal) {
                    closeVideoModal();
                }
            });
            
            // Ajouter le CSS pour la modal
            const styleElement = document.createElement('style');
            styleElement.textContent = `
                .modal {
                    display: none;
                    position: fixed;
                    z-index: 1000;
                    left: 0;
                    top: 0;
                    width: 100%;
                    height: 100%;
                    overflow: auto;
                    background-color: rgba(0, 0, 0, 0.8);
                }
                
                .modal-content {
                    background-color: #222;
                    margin: 5% auto;
                    padding: 20px;
                    border-radius: 8px;
                    width: 80%;
                    max-width: 800px;
                }
                
                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid #444;
                    padding-bottom: 10px;
                    margin-bottom: 15px;
                }
                
                .modal-header h3 {
                    color: white;
                    margin: 0;
                }
                
                .close-video-modal {
                    color: #aaa;
                    font-size: 28px;
                    font-weight: bold;
                    cursor: pointer;
                }
                
                .close-video-modal:hover {
                    color: white;
                }
                
                #video-player {
                    width: 100%;
                    max-height: 70vh;
                    background-color: black;
                }
            `;
            document.head.appendChild(styleElement);
        }
        
        // Délégation d'événements pour les boutons "Voir la vidéo"
        produitsGrid.addEventListener('click', (e) => {
            // Vérifier si c'est un bouton "Voir la vidéo" qui a été cliqué
            if (e.target.classList.contains('voir-video') || 
                e.target.closest('.voir-video')) {
                
                e.preventDefault();
                
                // Récupérer le bouton cliqué
                const videoButton = e.target.classList.contains('voir-video') ? 
                                   e.target : 
                                   e.target.closest('.voir-video');
                
                // Récupérer l'URL de la vidéo depuis l'attribut data-video
                const videoUrl = videoButton.dataset.video;
                
                // Débogage
                console.log('Ouverture de la vidéo:', videoUrl);
                
                if (videoUrl) {
                    // Définir l'URL de la vidéo
                    const videoPlayer = document.getElementById('video-player');
                    if (videoPlayer) {
                        const source = videoPlayer.querySelector('source');
                        if (source) {
                            source.setAttribute('src', videoUrl);
                            videoPlayer.load(); // Recharger la vidéo avec la nouvelle source
                        }
                        // Afficher la modal
                        showVideoModal();
                    }
                } else {
                    console.error('URL de vidéo non trouvée dans le bouton');
                }
            }
        });
    }
    
    // Fonctions pour gérer le modal vidéo
    function showVideoModal() {
        const modal = document.getElementById('video-modal');
        if (modal) {
            modal.style.display = 'block';
        }
    }
    
    function closeVideoModal() {
        const modal = document.getElementById('video-modal');
        if (modal) {
            modal.style.display = 'none';
            
            // Arrêter la vidéo lors de la fermeture du modal
            const video = document.getElementById('video-player');
            if (video) {
                video.pause();
                video.currentTime = 0;
            }
        }
    }
});
