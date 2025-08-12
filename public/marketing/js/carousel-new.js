/**
 * Carrousel d'images en plein écran - NOUVELLE VERSION
 * Transition automatique entre plusieurs images d'arrière-plan
 * avec effet de fondu fluide et messages spécifiques à chaque slide
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initialisation du nouveau carrousel de transition - v2.1');
    
    // Configuration du carrousel avec toutes les possibilités de chemins d'images
    const carouselConfig = {
        transitionInterval: 5000, // Intervalle de transition en millisecondes (5 secondes)
        fadeTime: 1500,          // Durée de l'effet de fondu en millisecondes (1.5 secondes)
        slides: [
            // Vos images originales avec multiples chemins alternatifs
            {
                paths: [
                    '/marketing/img/backgrounds/service-client-caisse.jpg',
                    '/img/backgrounds/service-client-caisse.jpg', 
                    'img/backgrounds/service-client-caisse.jpg',
                    './img/backgrounds/service-client-caisse.jpg',
                    '../img/backgrounds/service-client-caisse.jpg',
                    'https://claudendayambaje.netlify.app/img/backgrounds/service-client-caisse.jpg',
                    'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?ixlib=rb-1.2.1&auto=format&fit=crop&w=1470&q=80'
                ]
            },
            {
                paths: [
                    '/marketing/img/backgrounds/paiement-sans-contact.jpg',
                    '/img/backgrounds/paiement-sans-contact.jpg',
                    'img/backgrounds/paiement-sans-contact.jpg',
                    './img/backgrounds/paiement-sans-contact.jpg',
                    '../img/backgrounds/paiement-sans-contact.jpg',
                    'https://claudendayambaje.netlify.app/img/backgrounds/paiement-sans-contact.jpg',
                    'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?ixlib=rb-1.2.1&auto=format&fit=crop&w=1470&q=80'
                ]
            },
            {
                paths: [
                    '/marketing/img/backgrounds/analyse-ventes-temps-reel.jpg',
                    '/img/backgrounds/analyse-ventes-temps-reel.jpg',
                    'img/backgrounds/analyse-ventes-temps-reel.jpg',
                    './img/backgrounds/analyse-ventes-temps-reel.jpg',
                    '../img/backgrounds/analyse-ventes-temps-reel.jpg',
                    'https://claudendayambaje.netlify.app/img/backgrounds/analyse-ventes-temps-reel.jpg',
                    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=1470&q=80'
                ]
            },
            {
                paths: [
                    '/marketing/img/backgrounds/gestion-inventaire-employes.jpg',
                    '/img/backgrounds/gestion-inventaire-employes.jpg',
                    'img/backgrounds/gestion-inventaire-employes.jpg',
                    './img/backgrounds/gestion-inventaire-employes.jpg',
                    '../img/backgrounds/gestion-inventaire-employes.jpg',
                    'https://claudendayambaje.netlify.app/img/backgrounds/gestion-inventaire-employes.jpg',
                    'https://images.unsplash.com/photo-1551135049-8a33b5883817?ixlib=rb-1.2.1&auto=format&fit=crop&w=1470&q=80'
                ]
            },
            {
                paths: [
                    '/marketing/img/backgrounds/experience-client-moderne.jpg',
                    '/img/backgrounds/experience-client-moderne.jpg',
                    'img/backgrounds/experience-client-moderne.jpg',
                    './img/backgrounds/experience-client-moderne.jpg',
                    '../img/backgrounds/experience-client-moderne.jpg',
                    'https://claudendayambaje.netlify.app/img/backgrounds/experience-client-moderne.jpg',
                    'https://images.unsplash.com/photo-1563986768609-322da13575f3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1470&q=80'
                ]
            }
        ]
    };
    
    // Détecter l'environnement (local ou production/Netlify)
    const isProduction = !window.location.hostname.includes('localhost') && 
                      !window.location.hostname.includes('127.0.0.1') && 
                      !window.location.hostname.match(/^192\.168\./) && 
                      !window.location.hostname.match(/^10\./); 
                      
    console.log(`Détection de l'environnement: ${isProduction ? 'Production/Netlify' : 'Développement local'}`);
    
    // Fonction pour tester si une image existe
    function imageExists(url, callback) {
        const img = new Image();
        img.onload = function() { callback(true); };
        img.onerror = function() { callback(false); };
        img.src = url;
    }
    
    // Réorganisation des chemins pour essayer d'abord ceux adaptés à l'environnement
    carouselConfig.slides.forEach(slide => {
        // Prioritiser les chemins selon l'environnement
        if (isProduction) {
            // En production, essayer d'abord les chemins relatifs et absolus sans '/marketing'
            slide.paths = [
                ...slide.paths.filter(p => !p.includes('/marketing/') && !p.startsWith('http')),
                ...slide.paths.filter(p => p.includes('/marketing/')),
                ...slide.paths.filter(p => p.startsWith('http'))
            ];
        } else {
            // En local, prioritiser les chemins qui incluent /marketing/
            slide.paths = [
                ...slide.paths.filter(p => p.includes('/marketing/')),
                ...slide.paths.filter(p => !p.includes('/marketing/') && !p.startsWith('http')),
                ...slide.paths.filter(p => p.startsWith('http'))
            ];
        }
        console.log(`Environnement: ${isProduction ? 'Production' : 'Local'}, chemins d'images prioritisés`);
    });

    // Variables globales
    let currentSlide = 0;
    let slideInterval = null;
    let slideIndicators = [];
    let isTransitioning = false; // Variable pour suivre si une transition est en cours
    let createdSlides = [];      // Liste des références aux slides créés pour un meilleur contrôle
    
    // Sélection des éléments existants (avec fallback)
    // On cherche d'abord avec les classes standard
    let heroSection = document.querySelector('.hero-parallax');
    let heroBackground = document.querySelector('.hero-background');
    
    // Si on ne trouve pas les éléments standard, on essaie d'autres sélecteurs possibles
    if (!heroSection) {
        // Recherche d'alternatives possibles
        heroSection = document.querySelector('.hero') || 
                     document.querySelector('.hero-section') || 
                     document.querySelector('.banner-section');
        console.log('Utilisation d\'un sélecteur alternatif pour heroSection:', heroSection);
    }
    
    // Si on ne trouve toujours pas heroSection, créons-le
    if (!heroSection) {
        console.log('Création des éléments du carrousel qui n\'ont pas été trouvés');
        // Nous sommes probablement en environnement de production avec une structure HTML différente
        // Créons les éléments nécessaires dans la première section
        const firstSection = document.querySelector('section');
        if (firstSection) {
            // Ajouter les classes nécessaires
            firstSection.classList.add('hero-parallax');
            heroSection = firstSection;
            
            console.log('Element heroSection créé avec succès dans la première section');
        } else {
            console.error('Impossible de trouver une section pour placer le carrousel');
            return;
        }
    }
    
    // Si heroBackground n'existe pas, on le crée
    if (!heroBackground) {
        heroBackground = document.createElement('div');
        heroBackground.className = 'hero-background';
        // Insérer heroBackground comme premier enfant de heroSection
        heroSection.insertBefore(heroBackground, heroSection.firstChild);
        console.log('Element heroBackground créé et inséré');
    }
    
    // Configurer la section héro
    heroSection.style.minHeight = '650px'; // Augmentation de la hauteur minimale
    heroSection.style.position = 'relative';
    
    // Configurer l'arrière-plan
    heroBackground.style.display = 'block';
    heroBackground.style.position = 'absolute';
    heroBackground.style.top = '0';
    heroBackground.style.left = '0';
    heroBackground.style.width = '100%';
    heroBackground.style.height = '100%';
    heroBackground.style.zIndex = '-1';
    
    // Création des slides avec système complet de chemins multiples
    function createSlides() {
        // Vider l'arrière-plan existant et le tableau de référence
        heroBackground.innerHTML = '';
        createdSlides = [];
        
        // Créer les slides dans l'élément hero-background
        carouselConfig.slides.forEach((slideConfig, index) => {
            // Création du slide
            const slide = document.createElement('div');
            slide.className = 'carousel-slide';
            slide.id = `carousel-slide-${index}`; // ID unique pour chaque slide
            
            // Fonction récursive pour essayer chaque chemin d'image séquentiellement
            function tryNextPath(pathIndex) {
                // Si on a épuisé tous les chemins, utiliser un fond de couleur
                if (pathIndex >= slideConfig.paths.length) {
                    console.error(`Aucun chemin d'image fonctionnel pour le slide ${index}`);
                    slide.style.backgroundColor = '#f0f0f0';
                    return;
                }
                
                const currentPath = slideConfig.paths[pathIndex];
                console.log(`Slide ${index}: Essai du chemin ${pathIndex + 1}/${slideConfig.paths.length}: ${currentPath}`);
                
                const img = new Image();
                
                img.onload = function() {
                    console.log(`SUCCÈS: Image chargée: ${currentPath}`);
                    slide.style.backgroundImage = `url(${currentPath})`;
                    // Ajouter une classe pour montrer que l'image est chargée
                    slide.classList.add('image-loaded');
                };
                
                img.onerror = function() {
                    console.warn(`ÉCHEC: Image non disponible: ${currentPath}`);
                    // Essayer le chemin suivant
                    tryNextPath(pathIndex + 1);
                };
                
                img.src = currentPath;
            }
            
            // Commencer avec le premier chemin
            tryNextPath(0);
            
            // Appliquer les styles pour un positionnement et une transition propres
            slide.style.position = 'absolute';
            slide.style.top = '0';
            slide.style.left = '0';
            slide.style.width = '100%';
            slide.style.height = '100%';
            slide.style.backgroundSize = 'cover';
            slide.style.backgroundPosition = 'center center';
            slide.style.backgroundRepeat = 'no-repeat';
            slide.style.objectFit = 'cover';
            
            // Cacher tous les slides sauf le premier
            if (index === 0) {
                slide.classList.add('active');
                slide.style.opacity = '1';
                slide.style.visibility = 'visible';
                slide.style.display = 'block';
            } else {
                slide.style.opacity = '0';
                slide.style.visibility = 'hidden';
                slide.style.display = 'none'; 
            }
            
            // Transition douce uniquement pour l'opacité
            slide.style.transition = `opacity ${carouselConfig.fadeTime}ms ease-in-out`;
            slide.style.zIndex = '0';
            
            // Ajouter le slide au DOM
            heroBackground.appendChild(slide);
            
            // Conserver la référence du slide
            createdSlides.push(slide);
        });
        
        return createdSlides;
    }
    
    // Création des indicateurs
    function createIndicators() {
        // Créer le conteneur d'indicateurs s'il n'existe pas déjà
        let indicators = document.querySelector('.carousel-indicators');
        if (!indicators) {
            indicators = document.createElement('div');
            indicators.className = 'carousel-indicators';
            heroSection.appendChild(indicators);
        }
        
        // Vider le conteneur
        indicators.innerHTML = '';
        
        // Créer les indicateurs pour chaque slide
        carouselConfig.slides.forEach((slideConfig, index) => {
            // Création de l'indicateur
            const indicator = document.createElement('div');
            indicator.className = 'carousel-indicator';
            indicator.dataset.slideIndex = index;
            indicator.setAttribute('role', 'button');
            indicator.setAttribute('aria-label', `Slide ${index + 1}`);
            indicator.setAttribute('tabindex', '0');
            
            // Ajouter la classe active pour le premier indicateur
            if (index === 0) {
                indicator.classList.add('active');
            }
            
            // Ajouter un écouteur d'événement click
            indicator.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Indicateur cliqué:', index);
                goToSlide(index);
            });
            
            // Ajouter un écouteur pour la navigation au clavier
            indicator.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    goToSlide(index);
                }
            });
            
            // Ajouter l'indicateur au conteneur
            indicators.appendChild(indicator);
            
            // Ajouter à notre tableau d'indicateurs
            slideIndicators.push(indicator);
        });
        
        // Pause au survol des indicateurs
        indicators.addEventListener('mouseenter', function() {
            pauseSlideshow();
        });
        
        indicators.addEventListener('mouseleave', function() {
            resumeSlideshow();
        });
        
        return slideIndicators;
    }
    
    // Fonction pour aller à un slide spécifique avec isolation complète des transitions
    function goToSlide(index) {
        console.log('Changement vers slide:', index);
        
        // Vérifier que l'index est valide
        if (index < 0 || index >= carouselConfig.slides.length) {
            console.error('Index de slide invalide:', index);
            return;
        }
        
        // Si on clique sur le slide actif, ajouter un effet visuel et ne rien faire d'autre
        if (currentSlide === index) {
            const activeIndicator = slideIndicators[index];
            activeIndicator.classList.remove('pulse');
            void activeIndicator.offsetWidth; // Forcer un reflow
            activeIndicator.classList.add('pulse');
            setTimeout(() => {
                activeIndicator.classList.remove('pulse');
            }, 500);
            return;
        }
        
        // Bloquer les transitions multiples
        if (isTransitioning) {
            console.log('Transition déjà en cours, requête ignorée.');
            return;
        }
        
        // NOUVELLE APPROCHE : On travaille directement avec les références des slides
        // pour un contrôle précis et éviter les sélecteurs qui pourraient attraper des éléments inattendus
        
        // Activer le flag de transition
        isTransitioning = true;
        
        // Mettre à jour les indicateurs immédiatement
        slideIndicators[currentSlide].classList.remove('active');
        slideIndicators[index].classList.add('active');
        
        // Récupérer les slides actuels par leur référence directe
        const currentSlideElement = createdSlides[currentSlide];
        const nextSlideElement = createdSlides[index];
        
        // ÉTAPE 1 : PRÉPARATION - ISOLER LES DEUX SLIDES CONCERNÉS
        // S'assurer que tous les autres slides sont complètement cachés
        // et ne peuvent pas interférer avec la transition
        createdSlides.forEach((slide, i) => {
            if (i !== currentSlide && i !== index) {
                // Triple vérification pour s'assurer qu'ils sont vraiment invisibles
                slide.style.opacity = '0';
                slide.style.visibility = 'hidden';
                slide.style.display = 'none';
                slide.classList.remove('active');
            }
        });
        
        // ÉTAPE 2 : PRÉPARER LE NOUVEAU SLIDE SANS LE MONTRER
        // Le slide suivant est préparé mais complètement transparent
        nextSlideElement.style.display = 'block';
        nextSlideElement.style.visibility = 'visible';
        nextSlideElement.style.opacity = '0';
        
        // Attendre une microseconde pour s'assurer que le navigateur a appliqué ces changements
        setTimeout(() => {
            // ÉTAPE 3 : TRANSITION FLUIDE - ACTIVER LA TRANSITION
            // Faire disparaitre le slide actuel et apparaitre le nouveau
            currentSlideElement.style.opacity = '0';
            nextSlideElement.style.opacity = '1';
            nextSlideElement.classList.add('active');

            // Mettre à jour le contenu du héros avec le nouvel index
            // On passe explicitement l'index cible pour éviter le décalage
            updateHeroText(index);
            
            // ÉTAPE 4 : NETTOYAGE - UNE FOIS LA TRANSITION TERMINÉE
            setTimeout(() => {
                // Cacher complètement l'ancien slide
                currentSlideElement.style.visibility = 'hidden';
                currentSlideElement.style.display = 'none';
                currentSlideElement.classList.remove('active');
                
                // Mettre à jour l'index du slide actuel
                currentSlide = index;
                
                // Libérer le verrou de transition
                isTransitioning = false;
                console.log('Transition terminée parfaitement, slide actif:', currentSlide);
            }, carouselConfig.fadeTime + 100); // Attendre un peu plus que la durée de transition
        }, 20); // Court délai pour s'assurer que les styles ont été appliqués
        
        // Réinitialiser l'intervalle
        resetInterval();
    }
    
    // Fonction pour passer au slide suivant
    function nextSlide() {
        console.log('Passage au slide suivant');
        let nextIndex = currentSlide + 1;
        if (nextIndex >= carouselConfig.slides.length) {
            nextIndex = 0;
        }
        goToSlide(nextIndex);
    }
    
    // Fonction pour mettre à jour le texte du héros
    function updateHeroText(slideIndex) {
        // Sélectionner le div hero-text
        const heroText = document.querySelector('.hero-text.text-left');
        if (!heroText) {
            console.error('Element hero-text introuvable');
            return;
        }
        
        // Utiliser l'index fourni ou l'index actuel si non spécifié
        const targetIndex = typeof slideIndex === 'number' ? slideIndex : currentSlide;
        
        // Détection de la langue actuelle - amélioration de la détection
        let currentLang = 'fr';
        const pathname = window.location.pathname.toLowerCase();
        
        if (pathname.includes('/nl/') || pathname.includes('/nl') || document.documentElement.lang === 'nl') {
            currentLang = 'nl';
        } else if (pathname.includes('/en/') || pathname.includes('/en') || document.documentElement.lang === 'en') {
            currentLang = 'en';
        }
        
        console.log('Langue détectée:', currentLang, 'depuis URL:', pathname);
            
        // Contenus pour chaque slide en français
        const frHeroContents = [
            `<h1 class="two-line-title">La solution <span class="text-highlight">tout-en-un</span><br>pensée pour votre commerce</h1>
             <p class="two-line-subtitle">PayeSmart, l'écosystème de caisse tout-en-un<br>Encaissez, gérez, analysez… le tout, sans effort.</p>
             <div class="hero-buttons">
                <a href="#pricing" class="btn btn-primary">Voir les forfaits</a>
                <a href="/#/auth?register=true" class="btn btn-secondary">Essai gratuit</a>
             </div>`,
             
            `<h1 class="two-line-title">Paiements <span class="text-highlight">sécurisés</span><br>et flexibles</h1>
             <p class="two-line-subtitle">Acceptez tous les moyens de paiement<br>avec une sécurité de pointe.</p>
             <div class="hero-buttons">
                <a href="#features" class="btn btn-primary">Fonctionnalités</a>
                <a href="/#/auth?register=true" class="btn btn-secondary">Essai gratuit</a>
             </div>`,
             
            `<h1 class="two-line-title">Analyses <span class="text-highlight">détaillées</span><br>en temps réel</h1>
             <p class="two-line-subtitle">Prenez des décisions éclairées grâce à<br>des statistiques complètes et actualisées.</p>
             <div class="hero-buttons">
                <a href="contact.html" class="btn btn-secondary">Démonstration</a>
             </div>`,
             
            `<h1 class="two-line-title">Gestion <span class="text-highlight">simplifiée</span><br>de votre commerce</h1>
             <p class="two-line-subtitle">Inventaire, personnel, commandes...<br>Tout est centralisé dans une seule interface.</p>
             <div class="hero-buttons">
                <a href="#pricing" class="btn btn-primary">Voir les forfaits</a>
                <a href="contact.html" class="btn btn-secondary">Démonstration</a>
             </div>`,
             
            `<h1 class="two-line-title">Expérience <span class="text-highlight">client</span><br>moderne et fluide</h1>
             <p class="two-line-subtitle">Offrez une expérience d'achat mémorable<br>et fidélisez votre clientèle.</p>
             <div class="hero-buttons">
                <a href="about.html" class="btn btn-primary">À propos</a>
                <a href="contact.html" class="btn btn-secondary">Nous contacter</a>
             </div>`
        ];
        
        // Contenus pour chaque slide en néerlandais
        const nlHeroContents = [
            `<h1 class="two-line-title">De <span class="text-highlight">alles-in-één</span><br>oplossing voor uw<br>bedrijf</h1>
             <p class="two-line-subtitle">PayeSmart, het alles-in-één kassasysteem<br>Verkopen, beheren, analyseren... allemaal zonder moeite.</p>
             <div class="hero-buttons">
                <a href="#pricing" class="btn btn-primary">Bekijk pakketten</a>
                <a href="/#/auth?register=true" class="btn btn-secondary">Gratis proefversie</a>
             </div>`,
             
            `<h1 class="two-line-title">Veilige en <span class="text-highlight">flexibele</span><br>betalingen</h1>
             <p class="two-line-subtitle">Accepteer alle betaalmethoden<br>met topbeveiliging.</p>
             <div class="hero-buttons">
                <a href="#features" class="btn btn-primary">Functies</a>
                <a href="/#/auth?register=true" class="btn btn-secondary">Gratis proefversie</a>
             </div>`,
             
            `<h1 class="two-line-title">Gedetailleerde <span class="text-highlight">analyses</span><br>in realtime</h1>
             <p class="two-line-subtitle">Neem weloverwogen beslissingen dankzij<br>complete en actuele statistieken.</p>
             <div class="hero-buttons">
                <a href="contact.html" class="btn btn-secondary">Demonstratie</a>
             </div>`,
             
            `<h1 class="two-line-title">Vereenvoudigd <span class="text-highlight">beheer</span><br>van uw bedrijf</h1>
             <p class="two-line-subtitle">Voorraad, personeel, bestellingen...<br>Alles is gecentraliseerd in één interface.</p>
             <div class="hero-buttons">
                <a href="#pricing" class="btn btn-primary">Bekijk pakketten</a>
                <a href="contact.html" class="btn btn-secondary">Demonstratie</a>
             </div>`,
             
            `<h1 class="two-line-title">Moderne en vlotte <span class="text-highlight">klant</span><br>ervaring</h1>
             <p class="two-line-subtitle">Bied een gedenkwaardige winkelervaring<br>en bind uw klanten aan u.</p>
             <div class="hero-buttons">
                <a href="about.html" class="btn btn-primary">Over Ons</a>
                <a href="contact.html" class="btn btn-secondary">Contact</a>
             </div>`
        ];
        
        // Contenus pour chaque slide en anglais (placeholder pour une future mise à jour)
        const enHeroContents = frHeroContents; // Utilisation du français comme fallback
        
        // Forcer la langue néerlandaise pour le debugging - À RETIRER APRÈS TEST
        // currentLang = 'nl';
        
        // Sélection du contenu en fonction de la langue
        let heroContents;
        switch(currentLang) {
            case 'nl':
                heroContents = nlHeroContents;
                console.log('Utilisation du contenu néerlandais');
                break;
            case 'en':
                heroContents = enHeroContents;
                console.log('Utilisation du contenu anglais');
                break;
            default:
                heroContents = frHeroContents;
                console.log('Utilisation du contenu français');
                break;
        }
        
        // S'assurer que nous avons suffisamment de contenus
        if (targetIndex >= heroContents.length) {
            console.error('Pas assez de contenus pour ce slide:', targetIndex);
            return;
        }
        
        // Mettre à jour le contenu avec un effet de fade
        heroText.style.opacity = 0;
        setTimeout(() => {
            heroText.innerHTML = heroContents[targetIndex];
            heroText.style.opacity = 1;
            console.log('Texte mis à jour pour le slide:', targetIndex, 'langue:', currentLang, 'contenu:', heroContents[targetIndex].substring(0, 50) + '...');
        }, 300);
    }
    
    // Fonction pour réinitialiser l'intervalle du carrousel
    function resetInterval() {
        if (slideInterval) {
            clearInterval(slideInterval);
        }
        slideInterval = setInterval(nextSlide, carouselConfig.transitionInterval);
    }
    
    // Fonction pour mettre en pause le diaporama
    function pauseSlideshow() {
        console.log('Diaporama en pause');
        if (slideInterval) {
            clearInterval(slideInterval);
            slideInterval = null;
        }
    }
    
    // Fonction pour reprendre le diaporama
    function resumeSlideshow() {
        console.log('Reprise du diaporama');
        if (!slideInterval) {
            resetInterval();
        }
    }
    
    // Fonction d'initialisation principale
    function initCarousel() {
        console.log('Démarrage de l\'initialisation du carrousel...');
        
        // Créer les slides
        const slides = createSlides();
        console.log('Slides créés:', slides.length);
        
        // Créer les indicateurs
        const indicators = createIndicators();
        console.log('Indicateurs créés:', indicators.length);
        
        // Mettre à jour le texte du héros
        updateHeroText();
        
        // Démarrer la rotation automatique des slides
        resetInterval();
        
        console.log('Carrousel initialisé avec succès!');
        
        // Forcer un premier changement de slide après 3 secondes pour vérifier
        setTimeout(() => {
            console.log('Test de changement automatique...');
            nextSlide();
        }, 3000);
    }
    
    // Démarrer le carrousel avec un petit délai
    setTimeout(initCarousel, 500);
});
