document.addEventListener('DOMContentLoaded', function() {
    // Créer l'overlay de lightbox
    const lightboxOverlay = document.createElement('div');
    lightboxOverlay.className = 'lightbox-overlay';
    
    const lightboxContent = document.createElement('div');
    lightboxContent.className = 'lightbox-content';
    
    const lightboxImage = document.createElement('img');
    const lightboxCaption = document.createElement('div');
    lightboxCaption.className = 'lightbox-caption';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'lightbox-close';
    closeButton.innerHTML = '&times;';
    closeButton.setAttribute('aria-label', 'Fermer');
    
    lightboxContent.appendChild(closeButton);
    lightboxContent.appendChild(lightboxImage);
    lightboxContent.appendChild(lightboxCaption);
    lightboxOverlay.appendChild(lightboxContent);
    
    document.body.appendChild(lightboxOverlay);
    
    // Fonction pour ouvrir la lightbox
    function openLightbox(src, alt) {
        lightboxImage.src = src;
        lightboxCaption.textContent = alt;
        lightboxOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Empêcher le défilement
    }
    
    // Fonction pour fermer la lightbox
    function closeLightbox() {
        lightboxOverlay.classList.remove('active');
        document.body.style.overflow = ''; // Restaurer le défilement
    }
    
    // Ajouter des écouteurs d'événements à toutes les images cliquables
    document.querySelectorAll('.lightbox-image').forEach(image => {
        image.addEventListener('click', function() {
            openLightbox(this.src, this.alt);
        });
    });
    
    // Fermer la lightbox en cliquant sur le bouton de fermeture
    closeButton.addEventListener('click', closeLightbox);
    
    // Fermer la lightbox en cliquant sur l'overlay
    lightboxOverlay.addEventListener('click', function(e) {
        if (e.target === lightboxOverlay) {
            closeLightbox();
        }
    });
    
    // Fermer la lightbox avec la touche Echap
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && lightboxOverlay.classList.contains('active')) {
            closeLightbox();
        }
    });
});
