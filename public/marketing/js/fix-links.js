/**
 * Script de correction des liens - Version améliorée
 * Ce script gère les liens relatifs et les convertit en chemins absolus si nécessaire
 */
document.addEventListener('DOMContentLoaded', function() {
    // Fonction utilitaire pour vérifier si on est dans un dossier de langue
    function isInLanguageFolder() {
        const pathSegments = window.location.pathname.split('/').filter(Boolean);
        return ['fr', 'en', 'nl'].includes(pathSegments[0]) || 
               (pathSegments.length > 1 && ['fr', 'en', 'nl'].includes(pathSegments[1]));
    }
    
    // Fonction pour normaliser un chemin
    function normalizePath(path) {
        // Supprimer les segments vides et traiter les '..' et '.'
        const segments = path.split('/').filter(segment => segment !== '.');
        const result = [];
        
        for (const segment of segments) {
            if (segment === '..') {
                result.pop();
            } else if (segment) {
                result.push(segment);
            }
        }
        
        return '/' + result.join('/');
    }
    
    // Fonction pour corriger un lien
    function fixLink(link) {
        try {
            const href = link.getAttribute('href');
            
            // Ne pas modifier les liens de navigation principale et sélecteur de langue
            if (link.closest('.main-nav') || link.closest('.language-dropdown')) {
                return; // Laisser les liens de navigation intacts
            }
            
            // Ne pas modifier les liens vides, ancres, mails, téléphones ou URLs absolues
            if (!href || 
                href.startsWith('#') || 
                href.startsWith('mailto:') || 
                href.startsWith('tel:') || 
                href.startsWith('http') || 
                href.startsWith('//') ||
                href.startsWith('data:') ||
                href.startsWith('javascript:')) {
                return;
            }
            
            // Si le lien commence par un slash, il est déjà absolu par rapport à la racine
            if (href.startsWith('/')) {
                // Vérifier si le lien pointe vers une ressource existante
                const fullPath = normalizePath(href);
                link.setAttribute('href', fullPath);
                return;
            }
            
            // Pour les liens relatifs
            const isInLangFolder = isInLanguageFolder();
            let newHref = href;
            
            // Si on est dans un dossier de langue et que le lien ne commence pas par ../
            if (isInLangFolder && !href.startsWith('../')) {
                // Vérifier si le fichier existe à cet emplacement
                const testPath = normalizePath(window.location.pathname + '/../' + href);
                
                // Essayer d'accéder à la ressource
                fetch(testPath, { method: 'HEAD' })
                    .then(response => {
                        if (response.ok) {
                            link.setAttribute('href', '../' + href);
                            console.log(`Lien corrigé (niveau supérieur): ${href} -> ../${href}`);
                        }
                    })
                    .catch(() => {
                        // Si la ressource n'existe pas, essayer sans le préfixe
                        fetch(href, { method: 'HEAD' })
                            .then(response => {
                                if (response.ok) {
                                    link.setAttribute('href', href);
                                    console.log(`Lien conservé: ${href}`);
                                }
                            })
                            .catch(console.error);
                    });
            }
        } catch (error) {
            console.error('Erreur lors de la correction du lien:', error);
        }
    }
    
    // Fonction pour corriger tous les liens de la page
    function fixAllLinks() {
        const allLinks = document.querySelectorAll('a[href]');
        allLinks.forEach(link => {
            // Corriger immédiatement
            fixLink(link);
        });
    }
    
    // Corriger les liens au chargement de la page
    fixAllLinks();
    
    // Corriger également les liens ajoutés dynamiquement
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) { // ELEMENT_NODE
                        if (node.matches('a[href]')) {
                            fixLink(node);
                        }
                        node.querySelectorAll('a[href]').forEach(fixLink);
                    }
                });
            }
        });
    });
    
    // Observer les changements dans le DOM
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Gestionnaire pour les clics sur les liens
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a[href]');
        if (!link) return;
        
        const href = link.getAttribute('href');
        
        // Ne pas intercepter les liens spéciaux
        if (!href || 
            href.startsWith('#') || 
            href.startsWith('mailto:') || 
            href.startsWith('tel:') || 
            href.startsWith('http') || 
            href.startsWith('//') ||
            href.startsWith('data:') ||
            href.startsWith('javascript:')) {
            return;
        }
        
        // Ne pas intercepter les liens de navigation principale pour éviter les problèmes de langue
        if (link.closest('.main-nav') || link.closest('.language-dropdown')) {
            return; // Laisser le comportement par défaut
        }
        
        // Empêcher le comportement par défaut et forcer la navigation pour les autres liens
        e.preventDefault();
        window.location.href = link.href;
    });
    
    console.log('Script de correction des liens activé');
});
