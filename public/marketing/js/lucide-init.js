// Script d'initialisation pour les icônes Lucide
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier si lucide est disponible
    if (typeof lucide !== 'undefined') {
        // Initialiser les icônes Lucide
        setTimeout(function() {
            lucide.createIcons();
            console.log('Lucide icons initialized successfully');
        }, 100);
    } else {
        console.error('Lucide library not loaded');
        // Charger dynamiquement la bibliothèque Lucide si elle n'est pas disponible
        var script = document.createElement('script');
        script.src = 'https://unpkg.com/lucide@0.344.0/dist/umd/lucide.min.js';
        script.onload = function() {
            setTimeout(function() {
                lucide.createIcons();
                console.log('Lucide icons initialized after dynamic loading');
            }, 100);
        };
        document.head.appendChild(script);
    }
});

// Initialiser à nouveau après un court délai pour s'assurer que tous les éléments sont chargés
setTimeout(function() {
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
        console.log('Lucide icons re-initialized after delay');
    }
}, 500);
