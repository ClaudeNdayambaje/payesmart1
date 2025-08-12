/**
 * Système de gestion multilingue pour PayeSmart
 * Gère la détection de langue, la sélection et la redirection
 */

document.addEventListener('DOMContentLoaded', function() {
    // Configuration des langues disponibles
    const availableLanguages = ['fr', 'nl', 'en'];
    const defaultLanguage = 'fr';
    
    // Obtenir la langue actuelle depuis l'URL
    const getCurrentLanguage = () => {
        // Analyser tous les segments du chemin pour trouver une correspondance de langue
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        
        // Parcourir tous les segments pour trouver une langue valide
        for (const part of pathParts) {
            if (availableLanguages.includes(part)) {
                return part;
            }
        }
        
        return null;
    };
    
    // Détecter la langue du navigateur
    const detectBrowserLanguage = () => {
        const browserLang = navigator.language.split('-')[0];
        return availableLanguages.includes(browserLang) ? browserLang : defaultLanguage;
    };
    
    // Obtenir la langue préférée (stockée ou détectée)
    const getPreferredLanguage = () => {
        return localStorage.getItem('paysmart-language') || detectBrowserLanguage();
    };
    
    // Sauvegarder la langue préférée
    const savePreferredLanguage = (lang) => {
        localStorage.setItem('paysmart-language', lang);
    };
    
    // Construire l'URL pour une langue donnée
    const buildLanguageUrl = (lang) => {
        // Déterminer le nom de fichier actuel
        let fileName = 'index.html';
        const pathSegments = window.location.pathname.split('/');
        const lastSegment = pathSegments[pathSegments.length - 1];
        
        if (lastSegment && lastSegment.includes('.html')) {
            fileName = lastSegment;
        }
        
        // Déterminer la langue actuelle pour construire le chemin relatif correct
        const currentLang = getCurrentLanguage();
        
        if (currentLang) {
            // Nous sommes dans un dossier de langue, utiliser des chemins relatifs
            if (lang === currentLang) {
                // Même langue, rester sur la même page
                return fileName;
            } else {
                // Langue différente, naviguer vers le dossier de langue approprié
                return `../${lang}/${fileName}`;
            }
        } else {
            // Nous sommes à la racine, naviguer vers le dossier de langue
            return `${lang}/${fileName}`;
        }
    };
    
    // Rediriger vers l'URL avec la langue spécifiée
    const redirectToLanguage = (lang) => {
        const targetUrl = buildLanguageUrl(lang);
        window.location.href = targetUrl;
    };
    
    // Mettre à jour l'affichage du sélecteur de langue
    const updateLanguageSelector = (currentLang) => {
        // Mettre à jour le bouton principal
        const langButton = document.querySelector('.language-button');
        if (langButton) {
            langButton.innerHTML = currentLang.toUpperCase() + ' <i class="fas fa-chevron-down"></i>';
        }
        
        // Mettre à jour la classe active dans le menu déroulant
        const langOptions = document.querySelectorAll('.language-option');
        langOptions.forEach(option => {
            const optionLang = option.getAttribute('data-lang');
            if (optionLang === currentLang) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    };
    
    // Initialisation du sélecteur de langue
    const initLanguageSwitcher = () => {
        const currentLang = getCurrentLanguage() || getPreferredLanguage();
        
        // Mettre à jour l'affichage du sélecteur
        updateLanguageSelector(currentLang);
        
        // Ajouter les événements de clic sur les options de langue
        const langOptions = document.querySelectorAll('.language-option');
        langOptions.forEach(option => {
            option.addEventListener('click', function(e) {
                e.preventDefault();
                const selectedLang = this.getAttribute('data-lang');
                savePreferredLanguage(selectedLang);
                redirectToLanguage(selectedLang);
            });
        });
        
        // Mise à jour des attributs hreflang pour le SEO
        updateHreflangTags();
    };
    
    // Mise à jour des balises hreflang pour le SEO
    const updateHreflangTags = () => {
        // Supprimer les anciennes balises hreflang
        document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove());
        
        // Créer de nouvelles balises hreflang pour chaque langue
        const currentPath = window.location.pathname;
        const currentLang = getCurrentLanguage();
        const baseUrl = window.location.origin;
        const head = document.querySelector('head');
        
        availableLanguages.forEach(lang => {
            const link = document.createElement('link');
            link.rel = 'alternate';
            link.hreflang = lang;
            
            // Construire l'URL complète pour cette langue
            let langPath;
            if (currentLang) {
                langPath = currentPath.replace(`/${currentLang}/`, `/${lang}/`);
            } else {
                const fileName = currentPath.split('/').pop() || 'index.html';
                langPath = `/${lang}/${fileName}`;
            }
            
            link.href = baseUrl + langPath;
            head.appendChild(link);
        });
        
        // Ajouter une balise hreflang x-default
        const defaultLink = document.createElement('link');
        defaultLink.rel = 'alternate';
        defaultLink.hreflang = 'x-default';
        defaultLink.href = baseUrl + `/fr/index.html`;
        head.appendChild(defaultLink);
    };
    
    // Redirection initiale si nécessaire (première visite)
    const handleInitialRedirection = () => {
        const currentLang = getCurrentLanguage();
        const preferredLang = getPreferredLanguage();
        
        // Si nous sommes déjà sur une page avec préfixe de langue, ne pas rediriger
        if (currentLang) {
            return false;
        }
        
        // Ne pas rediriger si nous sommes sur la page d'index principale
        // ou si nous sommes sur une route spéciale (comme l'application)
        const path = window.location.pathname;
        if (path === '/' || path.endsWith('/index.html') || path.includes('/#/')) {
            return false;
        }
        
        // Dans les autres cas, rediriger vers la langue préférée
        savePreferredLanguage(preferredLang);
        redirectToLanguage(preferredLang);
        return true; // Indique qu'une redirection a été initiée
    };
    
    // Exécution initiale
    if (!handleInitialRedirection()) {
        // Seulement si nous n'avons pas redirigé
        initLanguageSwitcher();
    }
});
