// Script pour corriger le chargement des vidéos Firebase Storage
document.addEventListener('DOMContentLoaded', function() {
    // Attendre un petit délai pour s'assurer que produits-video.js a fait son travail
    setTimeout(() => {
        // Sélectionner toutes les vidéos de produits
        const productVideos = document.querySelectorAll('.produit-video');
        
        if (productVideos.length > 0) {
            console.log(`${productVideos.length} vidéos Firebase à corriger sur la page`);
            
            productVideos.forEach((video, index) => {
                // Récupérer l'élément source
                const sourceElement = video.querySelector('source');
                
                if (sourceElement && sourceElement.src.includes('firebasestorage.googleapis.com')) {
                    console.log(`Correction de la vidéo Firebase ${index + 1}: ${sourceElement.src}`);
                    
                    // Fonction pour vérifier si une URL est accessible
                    function checkUrlExists(url) {
                        return new Promise((resolve) => {
                            const img = new Image();
                            img.onload = () => resolve(true);
                            img.onerror = () => resolve(false);
                            img.src = url;
                        });
                    }
                    
                    // Supprimer le token de l'URL s'il existe car il peut causer des problèmes
                    let cleanedUrl = sourceElement.src;
                    if (cleanedUrl.includes('&token=')) {
                        cleanedUrl = cleanedUrl.split('&token=')[0];
                        console.log(`URL nettoyée: ${cleanedUrl}`);
                    }
                    
                    // Ajouter un timestamp aléatoire pour éviter la mise en cache
                    const cacheBuster = Math.floor(Math.random() * 1000000);
                    cleanedUrl = cleanedUrl.includes('?') 
                        ? `${cleanedUrl}&_=${cacheBuster}` 
                        : `${cleanedUrl}?_=${cacheBuster}`;
                    
                    // Mettre à jour l'URL source
                    sourceElement.src = cleanedUrl;
                    
                    // Forcer le rechargement de la vidéo
                    video.load();
                    
                    // Ajouter des gestionnaires d'événements pour le débogage
                    video.addEventListener('loadeddata', () => {
                        console.log(`Vidéo ${index + 1} chargée avec succès`);
                    });
                    
                    video.addEventListener('error', (e) => {
                        console.error(`Erreur lors du chargement de la vidéo ${index + 1}:`, e);
                    });
                    
                    // Mise en place d'un clic direct sur la vidéo
                    const container = video.closest('.video-container');
                    if (container) {
                        container.addEventListener('click', function() {
                            if (video.paused) {
                                video.play().catch(e => {
                                    // Essayer de charger à nouveau en cas d'échec
                                    console.log('Tentative de rechargement après erreur');
                                    video.load();
                                    setTimeout(() => video.play().catch(console.error), 100);
                                });
                            } else {
                                video.pause();
                            }
                        });
                    }
                }
            });
            
            // Simple solution pour détecter et résoudre les problèmes CORS
            function fixCORSErrors() {
                productVideos.forEach((video) => {
                    const source = video.querySelector('source');
                    if (source && !source.hasAttribute('crossorigin')) {
                        source.setAttribute('crossorigin', 'anonymous');
                        video.load(); // Recharger après correction
                    }
                });
            }
            
            // Appliquer les corrections CORS après un court délai
            setTimeout(fixCORSErrors, 500);
        }
    }, 1000); // Attendre 1 seconde pour être sûr que les autres scripts sont chargés
});
