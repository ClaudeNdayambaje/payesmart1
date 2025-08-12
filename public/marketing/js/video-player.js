document.addEventListener('DOMContentLoaded', function() {
    // Récupérer les éléments vidéo et bouton
    const video = document.getElementById('payment-demo-video');
    const playButton = document.querySelector('.video-play-button');
    
    if (video && playButton) {
        // Ajouter un événement au clic sur le bouton de lecture
        playButton.addEventListener('click', function() {
            if (video.paused) {
                // Lancer la vidéo
                video.play()
                    .then(() => {
                        // Masquer le bouton de lecture quand la vidéo démarre
                        playButton.style.opacity = '0';
                        setTimeout(() => {
                            playButton.style.display = 'none';
                        }, 300);
                    })
                    .catch(error => {
                        console.error('Erreur lors de la lecture de la vidéo:', error);
                    });
            } else {
                // Mettre la vidéo en pause
                video.pause();
                // Afficher à nouveau le bouton de lecture
                playButton.style.display = 'flex';
                setTimeout(() => {
                    playButton.style.opacity = '1';
                }, 10);
            }
        });
        
        // Réafficher le bouton quand la vidéo se termine
        video.addEventListener('ended', function() {
            playButton.style.display = 'flex';
            setTimeout(() => {
                playButton.style.opacity = '1';
            }, 10);
        });
        
        // Réafficher le bouton quand la vidéo est mise en pause
        video.addEventListener('pause', function() {
            playButton.style.display = 'flex';
            setTimeout(() => {
                playButton.style.opacity = '1';
            }, 10);
        });
        
        // Masquer le bouton quand la vidéo est en lecture
        video.addEventListener('play', function() {
            playButton.style.opacity = '0';
            setTimeout(() => {
                playButton.style.display = 'none';
            }, 300);
        });
    }
});
