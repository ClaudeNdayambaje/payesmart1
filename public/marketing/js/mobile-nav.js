/**
 * Script de gestion de la barre de navigation mobile professionnelle
 * Gère l'interaction pour le menu hamburger, le sélecteur de langue et les animations
 * PayeSmart - Version 1.0 - Août 2025
 */

document.addEventListener('DOMContentLoaded', function() {
    // Éléments de la barre de navigation mobile
    const mobileMenuButton = document.querySelector('.mobile-menu-button');
    const mobileNavMenu = document.querySelector('.mobile-nav-menu');
    const mobileLangButton = document.querySelector('.mobile-language-button');
    const mobileLangDropdown = document.querySelector('.mobile-language-dropdown');
    const body = document.body;
    
    // Gestion du menu hamburger
    if (mobileMenuButton && mobileNavMenu) {
        mobileMenuButton.addEventListener('click', function() {
            this.classList.toggle('active');
            mobileNavMenu.classList.toggle('active');
            
            // Empêche le défilement du corps lorsque le menu est ouvert
            if (mobileNavMenu.classList.contains('active')) {
                body.style.overflow = 'hidden';
            } else {
                body.style.overflow = '';
            }
        });
        
        // Fermeture du menu lors du clic sur un lien
        const mobileNavLinks = mobileNavMenu.querySelectorAll('a');
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileMenuButton.classList.remove('active');
                mobileNavMenu.classList.remove('active');
                body.style.overflow = '';
            });
        });
    }
    
    // Gestion du sélecteur de langue
    if (mobileLangButton && mobileLangDropdown) {
        mobileLangButton.addEventListener('click', function(e) {
            e.stopPropagation();
            mobileLangDropdown.classList.toggle('active');
        });
        
        // Options de langue
        const langOptions = document.querySelectorAll('.mobile-language-option');
        langOptions.forEach(option => {
            option.addEventListener('click', function(e) {
                e.preventDefault();
                const selectedLang = this.getAttribute('data-lang');
                const langText = selectedLang.toUpperCase();
                
                // Mise à jour du texte du bouton
                mobileLangButton.innerHTML = langText + ' <i class="fas fa-chevron-down"></i>';
                
                // Mise à jour de la classe active
                langOptions.forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');
                
                // Navigation vers la page correspondante (si ce n'est pas la page actuelle)
                if (!this.classList.contains('current')) {
                    window.location.href = this.getAttribute('href');
                }
                
                // Fermeture du dropdown
                mobileLangDropdown.classList.remove('active');
            });
        });
        
        // Fermeture du dropdown lors d'un clic ailleurs
        document.addEventListener('click', function(e) {
            if (!mobileLangButton.contains(e.target)) {
                mobileLangDropdown.classList.remove('active');
            }
        });
    }
    
    // Gestion du comportement du scroll
    let lastScrollTop = 0;
    const mobileNavBar = document.querySelector('.mobile-nav-bar');
    
    if (mobileNavBar) {
        window.addEventListener('scroll', function() {
            let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            // Détermine la direction du défilement
            if (scrollTop > lastScrollTop && scrollTop > 60) {
                // Défilement vers le bas et non au sommet
                mobileNavBar.classList.add('nav-hidden');
            } else {
                // Défilement vers le haut ou au sommet
                mobileNavBar.classList.remove('nav-hidden');
            }
            
            // Ajoute une classe 'scrolled' pour changer l'apparence au défilement
            if (scrollTop > 30) {
                mobileNavBar.classList.add('scrolled');
            } else {
                mobileNavBar.classList.remove('scrolled');
            }
            
            lastScrollTop = scrollTop;
        });
    }
    
    // Fonction pour adapter la hauteur du menu mobile lors du redimensionnement
    function adjustMobileMenuHeight() {
        if (mobileNavMenu) {
            const windowHeight = window.innerHeight;
            const mobileNavBarHeight = mobileNavBar ? mobileNavBar.offsetHeight : 60;
            mobileNavMenu.style.maxHeight = (windowHeight - mobileNavBarHeight) + 'px';
        }
    }
    
    // Ajustement initial et lors du redimensionnement
    adjustMobileMenuHeight();
    window.addEventListener('resize', adjustMobileMenuHeight);
});
