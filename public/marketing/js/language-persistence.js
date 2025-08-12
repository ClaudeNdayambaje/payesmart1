/**
 * Système de persistance de langue pour PayeSmart
 * Assure la cohérence des choix linguistiques sur l'ensemble du site
 */

document.addEventListener('DOMContentLoaded', function() {
    // Configuration des langues disponibles
    const availableLanguages = ['fr', 'nl', 'en'];
    const defaultLanguage = 'fr';
    
    // Fonction pour extraire la langue actuelle de l'URL
    function getCurrentLanguage() {
        const path = window.location.pathname;
        
        // Vérifier si nous sommes dans un dossier de langue
        if (path.includes('/fr/')) return 'fr';
        if (path.includes('/nl/')) return 'nl';
        if (path.includes('/en/')) return 'en';
        
        // Si nous ne sommes pas dans un dossier de langue spécifique,
        // vérifier si la page actuelle est déjà dans une langue spécifique
        if (document.documentElement.lang) {
            const htmlLang = document.documentElement.lang.toLowerCase();
            if (availableLanguages.includes(htmlLang)) {
                return htmlLang;
            }
        }
        
        return defaultLanguage;
    }
    
    // Sauvegarder la langue préférée
    function saveLanguage(lang) {
        if (availableLanguages.includes(lang)) {
            localStorage.setItem('paysmart-language', lang);
            console.log('Langue sauvegardée:', lang);
        }
    }
    
    // Récupérer la langue préférée (stockée ou du navigateur)
    function getPreferredLanguage() {
        // Vérifier d'abord dans localStorage
        const storedLang = localStorage.getItem('paysmart-language');
        if (storedLang && availableLanguages.includes(storedLang)) {
            return storedLang;
        }
        
        // Sinon utiliser la langue du navigateur
        const browserLang = navigator.language.split('-')[0];
        return availableLanguages.includes(browserLang) ? browserLang : defaultLanguage;
    }
    
    // Mettre à jour l'affichage du sélecteur de langue
    function updateLanguageSelector() {
        const currentLang = getCurrentLanguage();
        
        // Mettre à jour le bouton du sélecteur de langue
        const langButton = document.querySelector('.language-button');
        if (langButton) {
            let buttonText;
            switch(currentLang) {
                case 'fr': buttonText = 'FR'; break;
                case 'nl': buttonText = 'NL'; break;
                case 'en': buttonText = 'EN'; break;
                default: buttonText = currentLang.toUpperCase(); break;
            }
            
            langButton.innerHTML = buttonText + ' <i class="fas fa-chevron-down"></i>';
        }
        
        // Marquer l'option active dans le menu déroulant
        const langOptions = document.querySelectorAll('.language-option');
        langOptions.forEach(option => {
            const optionLang = option.getAttribute('data-lang');
            option.classList.toggle('active', optionLang === currentLang);
        });
    }
    
    // Gérer les clics sur les options de langue
    function setupLanguageOptions() {
        const langOptions = document.querySelectorAll('.language-option');
        langOptions.forEach(option => {
            option.addEventListener('click', function(e) {
                e.preventDefault();
                const selectedLang = this.getAttribute('data-lang');
                
                // Marquer ce changement comme volontaire pour éviter la redirection automatique
                sessionStorage.setItem('paysmart-voluntary-change', 'true');
                
                // Sauvegarder la nouvelle langue préférée
                saveLanguage(selectedLang);
                
                // Rediriger vers la page dans la langue sélectionnée
                window.location.href = this.getAttribute('href');
            });
        });
    }
    
    // Fonction pour rediriger vers la langue préférée
    function redirectToPreferredLanguage() {
        const savedLang = getPreferredLanguage();
        const currentLang = getCurrentLanguage();
        
        // Si l'utilisateur a une langue sauvegardée différente de la langue actuelle
        if (savedLang && savedLang !== currentLang) {
            const currentPath = window.location.pathname;
            
            // Extraire le chemin sans la langue
            let pathWithoutLang = currentPath;
            if (currentPath.startsWith('/fr/')) {
                pathWithoutLang = currentPath.substring(3);
            } else if (currentPath.startsWith('/nl/')) {
                pathWithoutLang = currentPath.substring(3);
            } else if (currentPath.startsWith('/en/')) {
                pathWithoutLang = currentPath.substring(3);
            }
            
            // Construire la nouvelle URL avec la langue préférée
            let newPath;
            if (savedLang === 'fr') {
                newPath = '/fr' + pathWithoutLang;
            } else if (savedLang === 'nl') {
                newPath = '/nl' + pathWithoutLang;
            } else if (savedLang === 'en') {
                newPath = '/en' + pathWithoutLang;
            }
            
            // Rediriger si le nouveau chemin est différent
            if (newPath && newPath !== currentPath) {
                console.log('Redirection vers la langue préférée:', savedLang, 'de', currentPath, 'vers', newPath);
                window.location.href = newPath;
                return true; // Indique qu'une redirection a eu lieu
            }
        }
        return false; // Aucune redirection
    }
    
    // Initialisation
    function init() {
        const currentLang = getCurrentLanguage();
        const savedLang = getPreferredLanguage();
        
        // Si l'utilisateur a une langue sauvegardée différente de la langue actuelle,
        // et que ce n'est pas un changement volontaire récent, rediriger
        const isVoluntaryChange = sessionStorage.getItem('paysmart-voluntary-change');
        
        if (savedLang && savedLang !== currentLang && !isVoluntaryChange) {
            // Rediriger vers la langue préférée sauvegardée
            const redirected = redirectToPreferredLanguage();
            if (redirected) {
                return; // Arrêter l'initialisation, la redirection va charger une nouvelle page
            }
        }
        
        // Nettoyer le marqueur de changement volontaire après utilisation
        sessionStorage.removeItem('paysmart-voluntary-change');
        
        // Initialisation normale
        updateLanguageSelector();
        setupLanguageOptions();
        
        // Sauvegarder la langue actuelle pour les navigations futures
        saveLanguage(currentLang);
    }
    
    init();
});
