/**
 * Script de correction pour tous les liens du site
 * Ce script corrige tous les liens pour s'assurer qu'ils utilisent les chemins corrects
 */
document.addEventListener('DOMContentLoaded', function() {
    // Déterminer le chemin de base selon l'URL actuelle
    const currentPath = window.location.pathname;
    const isInSubfolder = currentPath.includes('/fr/') || currentPath.includes('/en/') || currentPath.includes('/nl/');
    const prefix = isInSubfolder ? '../' : '';
    
    // Fonction pour corriger un lien en fonction de sa cible
    function fixLink(link, href) {
        // Ne pas modifier les liens qui commencent par # (ancres) ou contiennent :// (URLs absolues)
        if (href.startsWith('#') || href.includes('://') || href.startsWith('/')) {
            return href;
        }
        
        // Si nous sommes dans un sous-dossier et que le lien ne contient pas déjà ../
        if (isInSubfolder && !href.startsWith('../')) {
            // Liens vers des pages de contenu standard (solutions, about, contact, etc.)
            if (href === 'solutions.html' || 
                href === 'nos-accessoires.html' || 
                href === 'about.html' || 
                href === 'contact.html' || 
                href === 'admin.html') {
                return '../' + href;
            }
        }
        
        return href;
    }
    
    // Corriger tous les liens dans le menu de navigation et le pied de page
    const allLinks = document.querySelectorAll('nav a, footer a');
    allLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href) {
            const newHref = fixLink(link, href);
            if (newHref !== href) {
                link.setAttribute('href', newHref);
                console.log(`Lien corrigé: ${href} -> ${newHref}`);
            }
        }
    });
    
    console.log('Script de correction de liens activé');
});
