/**
 * PAYESMART - AMÉLIORATIONS RESPONSIVES JAVASCRIPT
 * Fonctionnalités avancées pour une expérience mobile optimale
 */

(function() {
    'use strict';

    // ===================================================================
    // 1. DÉTECTION D'APPAREIL ET VARIABLES GLOBALES
    // ===================================================================
    
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTablet = /iPad|Android(?=.*\b(tablet|pad)\b)/i.test(navigator.userAgent);
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    let isMenuOpen = false;
    let scrollPosition = 0;

    // ===================================================================
    // 2. GESTION DU MENU MOBILE
    // ===================================================================
    
    function initMobileMenu() {
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        const mainNav = document.querySelector('.main-nav');
        const navLinks = document.querySelectorAll('.main-nav a');
        const body = document.body;

        if (!mobileToggle || !mainNav) return;

        // Toggle du menu mobile
        mobileToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            isMenuOpen = !isMenuOpen;
            
            if (isMenuOpen) {
                mainNav.classList.add('active');
                mobileToggle.classList.add('active');
                body.classList.add('menu-open');
                scrollPosition = window.pageYOffset;
                body.style.top = `-${scrollPosition}px`;
                body.style.position = 'fixed';
                body.style.width = '100%';
            } else {
                closeMenu();
            }
        });

        // Fermer le menu en cliquant sur un lien
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 991) {
                    closeMenu();
                }
            });
        });

        // Fermer le menu en cliquant à l'extérieur
        document.addEventListener('click', function(e) {
            if (isMenuOpen && !mainNav.contains(e.target) && !mobileToggle.contains(e.target)) {
                closeMenu();
            }
        });

        // Fermer le menu avec la touche Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && isMenuOpen) {
                closeMenu();
            }
        });

        function closeMenu() {
            isMenuOpen = false;
            mainNav.classList.remove('active');
            mobileToggle.classList.remove('active');
            body.classList.remove('menu-open');
            body.style.position = '';
            body.style.top = '';
            body.style.width = '';
            window.scrollTo(0, scrollPosition);
        }
    }

    // ===================================================================
    // 3. GESTION DU HEADER RESPONSIVE
    // ===================================================================
    
    function initResponsiveHeader() {
        const header = document.querySelector('.header');
        if (!header) return;

        let lastScrollTop = 0;
        let ticking = false;

        function updateHeader() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // Ajouter classe scrolled
            if (scrollTop > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }

            // Auto-hide sur mobile lors du scroll vers le bas
            if (window.innerWidth <= 767) {
                if (scrollTop > lastScrollTop && scrollTop > 100) {
                    header.style.transform = 'translateY(-100%)';
                } else {
                    header.style.transform = 'translateY(0)';
                }
            } else {
                header.style.transform = 'translateY(0)';
            }

            lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
            ticking = false;
        }

        function requestTick() {
            if (!ticking) {
                requestAnimationFrame(updateHeader);
                ticking = true;
            }
        }

        window.addEventListener('scroll', requestTick, { passive: true });
    }

    // ===================================================================
    // 4. OPTIMISATION DES IMAGES RESPONSIVE
    // ===================================================================
    
    function initResponsiveImages() {
        // Lazy loading pour les images
        const images = document.querySelectorAll('img[loading="lazy"]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.classList.add('loaded');
                        observer.unobserve(img);
                    }
                });
            });

            images.forEach(img => imageObserver.observe(img));
        }

        // Adaptation des images selon la taille d'écran
        function adaptImages() {
            const heroImages = document.querySelectorAll('.hero-image img, .feature-image img');
            
            heroImages.forEach(img => {
                if (window.innerWidth <= 767) {
                    img.style.maxWidth = '90%';
                    img.style.margin = '0 auto';
                    img.style.display = 'block';
                } else {
                    img.style.maxWidth = '';
                    img.style.margin = '';
                    img.style.display = '';
                }
            });
        }

        adaptImages();
        window.addEventListener('resize', debounce(adaptImages, 250));
    }

    // ===================================================================
    // 5. GESTION DES FORMULAIRES RESPONSIVE
    // ===================================================================
    
    function initResponsiveForms() {
        const forms = document.querySelectorAll('form');
        
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, textarea, select');
            
            inputs.forEach(input => {
                // Prévenir le zoom sur iOS
                if (isMobile && input.type !== 'file') {
                    input.style.fontSize = '16px';
                }

                // Améliorer l'UX tactile
                if (isTouch) {
                    input.addEventListener('focus', function() {
                        this.style.transform = 'scale(1.02)';
                        this.style.transition = 'transform 0.2s ease';
                    });

                    input.addEventListener('blur', function() {
                        this.style.transform = 'scale(1)';
                    });
                }
            });
        });
    }

    // ===================================================================
    // 6. OPTIMISATION DES ANIMATIONS POUR MOBILE
    // ===================================================================
    
    function initResponsiveAnimations() {
        // Désactiver les animations complexes sur mobile pour les performances
        if (isMobile || window.innerWidth <= 767) {
            const style = document.createElement('style');
            style.textContent = `
                .feature-card:hover,
                .pricing-card:hover,
                .hardware-card:hover {
                    transform: none !important;
                }
                
                .animate-float,
                .animate-float-delay {
                    animation: none !important;
                }
                
                * {
                    transition-duration: 0.2s !important;
                }
            `;
            document.head.appendChild(style);
        }

        // Animations d'apparition au scroll
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        const animateElements = document.querySelectorAll('.feature-card, .pricing-card, .hardware-card');
        animateElements.forEach(el => {
            // Ne pas manipuler l'opacité et la transformation directement en style
            // Utiliser des classes CSS pour contrôler l'apparence
            el.classList.add('pre-animation');
            observer.observe(el);
            
            // Supprimer toute transition qui pourrait affecter l'ombre
            el.style.transition = 'none';
            
            // Force le navigateur à appliquer le style immédiatement
            void el.offsetWidth;
            
            // Rétablir la transition pour les animations
            setTimeout(() => {
                el.style.transition = 'transform 0.4s ease';
            }, 10);
        });

        // Style pour l'animation d'apparition et persistance des ombres
        const animationStyle = document.createElement('style');
        animationStyle.textContent = `
            /* Styles pré-animation */
            .pre-animation {
                opacity: 0;
                transform: translateY(30px);
            }
            
            /* Animation d'entrée */
            .animate-in {
                opacity: 1 !important;
                transform: translateY(0) !important;
            }
            
            /* Styles d'ombre persistants pour toutes les cartes */
            .hardware-card {
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1), 0 12px 28px rgba(0, 0, 0, 0.2) !important;
            }
            
            .hardware-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 12px 28px rgba(0, 0, 0, 0.2), 0 8px 20px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1) !important;
            }
            
            .pricing-card, .feature-card {
                box-shadow: 0 5px 30px rgba(0, 0, 0, 0.1) !important;
            }
            
            .pricing-card:hover, .feature-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15) !important;
            }
        `;
        document.head.appendChild(animationStyle);
    }

    // ===================================================================
    // 7. GESTION DES ÉVÉNEMENTS DE REDIMENSIONNEMENT
    // ===================================================================
    
    function initResizeHandler() {
        function handleResize() {
            const newWidth = window.innerWidth;
            const newHeight = window.innerHeight;

            // Fermer le menu mobile si on passe en desktop
            if (newWidth > 991 && isMenuOpen) {
                const mainNav = document.querySelector('.main-nav');
                const mobileToggle = document.querySelector('.mobile-menu-toggle');
                const body = document.body;

                if (mainNav && mobileToggle) {
                    isMenuOpen = false;
                    mainNav.classList.remove('active');
                    mobileToggle.classList.remove('active');
                    body.classList.remove('menu-open');
                    body.style.position = '';
                    body.style.top = '';
                    body.style.width = '';
                }
            }

            // Ajuster les grilles responsives
            adjustGrids();

            // Mettre à jour les variables globales
            windowWidth = newWidth;
            windowHeight = newHeight;
        }

        window.addEventListener('resize', debounce(handleResize, 250));
    }

    // ===================================================================
    // 8. AJUSTEMENT DYNAMIQUE DES GRILLES
    // ===================================================================
    
    function adjustGrids() {
        const grids = document.querySelectorAll('.features-grid, .pricing-grid, .hardware-grid');
        
        grids.forEach(grid => {
            const width = window.innerWidth;
            
            if (width <= 479) {
                grid.style.gridTemplateColumns = '1fr';
            } else if (width <= 767) {
                grid.style.gridTemplateColumns = '1fr';
            } else if (width <= 991) {
                grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
            } else {
                grid.style.gridTemplateColumns = '';
            }
        });
    }

    // ===================================================================
    // 9. OPTIMISATION DES PERFORMANCES
    // ===================================================================
    
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // ===================================================================
    // 10. DÉTECTION ET ADAPTATION AUTOMATIQUE
    // ===================================================================
    
    function initAutoAdaptation() {
        // Détecter l'orientation
        function handleOrientationChange() {
            setTimeout(() => {
                adjustGrids();
                
                // Forcer un reflow pour corriger les problèmes d'affichage
                document.body.style.display = 'none';
                document.body.offsetHeight; // Trigger reflow
                document.body.style.display = '';
            }, 100);
        }

        window.addEventListener('orientationchange', handleOrientationChange);
        
        // Détecter les changements de viewport sur mobile
        if (isMobile) {
            let viewportHeight = window.innerHeight;
            
            window.addEventListener('resize', () => {
                const newHeight = window.innerHeight;
                const heightDiff = Math.abs(newHeight - viewportHeight);
                
                // Si la différence est significative (clavier virtuel)
                if (heightDiff > 150) {
                    document.body.classList.add('keyboard-open');
                } else {
                    document.body.classList.remove('keyboard-open');
                }
                
                viewportHeight = newHeight;
            });
        }
    }

    // ===================================================================
    // 11. AMÉLIORATION DE L'ACCESSIBILITÉ TACTILE
    // ===================================================================
    
    function initTouchEnhancements() {
        if (!isTouch) return;

        // Améliorer les zones tactiles
        const touchElements = document.querySelectorAll('button, .btn, a[role="button"]');
        
        touchElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            
            // S'assurer que les éléments tactiles font au moins 44px
            if (rect.height < 44) {
                element.style.minHeight = '44px';
                element.style.display = 'flex';
                element.style.alignItems = 'center';
                element.style.justifyContent = 'center';
            }
            
            if (rect.width < 44) {
                element.style.minWidth = '44px';
            }
        });

        // Feedback tactile
        touchElements.forEach(element => {
            element.addEventListener('touchstart', function() {
                this.style.opacity = '0.7';
            }, { passive: true });

            element.addEventListener('touchend', function() {
                this.style.opacity = '';
            }, { passive: true });

            element.addEventListener('touchcancel', function() {
                this.style.opacity = '';
            }, { passive: true });
        });
    }

    // ===================================================================
    // 12. INITIALISATION PRINCIPALE
    // ===================================================================
    
    function init() {
        // Attendre que le DOM soit chargé
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        // Ajouter des classes CSS pour la détection d'appareil
        document.documentElement.classList.add(
            isMobile ? 'is-mobile' : 'is-desktop',
            isTablet ? 'is-tablet' : 'is-not-tablet',
            isTouch ? 'is-touch' : 'is-no-touch'
        );

        // Initialiser tous les modules
        initMobileMenu();
        initResponsiveHeader();
        initResponsiveImages();
        initResponsiveForms();
        initResponsiveAnimations();
        initResizeHandler();
        initAutoAdaptation();
        initTouchEnhancements();

        // Ajustement initial
        adjustGrids();

        console.log('PayeSmart - Améliorations responsives initialisées');
    }

    // Démarrer l'initialisation
    init();

    // Exposer certaines fonctions globalement si nécessaire
    window.PayeSmartResponsive = {
        isMobile,
        isTablet,
        isTouch,
        adjustGrids,
        debounce,
        throttle
    };

})();
