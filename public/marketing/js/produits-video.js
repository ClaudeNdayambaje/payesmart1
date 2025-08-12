// JavaScript pour la galerie de produits avec vidéos

document.addEventListener('DOMContentLoaded', function() {
    // Sélectionner tous les conteneurs vidéo
    const videoContainers = document.querySelectorAll('.video-container');
    
    // Ajouter un écouteur d'événement à chaque conteneur
    videoContainers.forEach(container => {
        const placeholder = container.querySelector('.video-placeholder');
        const video = container.querySelector('.produit-video');
        
        // Utiliser l'image poster de la vidéo comme arrière-plan du placeholder
        if (video && video.getAttribute('poster')) {
            placeholder.style.backgroundImage = `url(${video.getAttribute('poster')})`;
        }
        
        // Lorsqu'on clique sur le placeholder
        placeholder.addEventListener('click', function() {
            // Ajouter la classe pour activer la vidéo
            container.classList.add('js-video-active');
            
            // Vérification si la source vidéo est valide (pas un placeholder)
            const sourceUrl = video.querySelector('source').getAttribute('src');
            console.log('URL de la vidéo:', sourceUrl); // Débogage
            
            if (sourceUrl && sourceUrl !== '#' && !sourceUrl.endsWith('#')) {
                // Configurer les gestionnaires d'événements pour la vidéo
                video.addEventListener('error', function(e) {
                    console.error('Erreur de chargement vidéo:', e);
                    // Afficher un message d'erreur dans le conteneur
                    container.classList.add('js-video-error');
                });
                
                // Tester si la vidéo est chargée correctement
                video.addEventListener('loadedmetadata', function() {
                    console.log('Métadonnées vidéo chargées avec succès');
                });
                
                // Lancer la vidéo
                video.load(); // Force le rechargement
                video.play().catch(e => {
                    console.error('Erreur lors de la lecture:', e);
                });
            } else {
                // Afficher un message si la vidéo n'est pas disponible
                console.log('Vidéo non disponible pour le moment');
                
                // Afficher un message dans la vidéo
                const message = document.createElement('div');
                message.className = 'video-message';
                message.innerHTML = '<p>Vidéo de démonstration à venir prochainement</p>';
                container.appendChild(message);
            }
        });
        
        // Lorsque la vidéo se termine, réafficher le placeholder
        video.addEventListener('ended', function() {
            container.classList.remove('js-video-active');
            
            // Supprimer le message si présent
            const message = container.querySelector('.video-message');
            if (message) {
                message.remove();
            }
        });
    });
    
    // Animation au défilement pour les cartes de produits
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('produit-card-visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observer chaque carte de produit
    document.querySelectorAll('.produit-card').forEach(card => {
        card.classList.add('produit-card-hidden');
        observer.observe(card);
    });
});

// Styles additionnels pour l'animation
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
        .produit-card-hidden {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }
        
        .produit-card-visible {
            opacity: 1;
            transform: translateY(0);
        }
        
        .video-message {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            font-size: 18px;
            text-align: center;
            z-index: 3;
        }
    `;
    document.head.appendChild(style);
});
