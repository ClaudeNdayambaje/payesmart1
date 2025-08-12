// Script pour remplacer les icônes Lucide par des icônes Font Awesome
document.addEventListener('DOMContentLoaded', function() {
    // Remplacer les icônes Lucide par des icônes Font Awesome équivalentes
    const iconMappings = {
        'check-circle': 'fas fa-check-circle',
        'check': 'fas fa-check',
        'shopping-cart': 'fas fa-shopping-cart',
        'package': 'fas fa-box',
        'users': 'fas fa-users',
        'bar-chart-3': 'fas fa-chart-bar',
        'tag': 'fas fa-tag',
        'truck': 'fas fa-truck',
        'mail': 'fas fa-envelope',
        'phone': 'fas fa-phone',
        'map-pin': 'fas fa-map-marker-alt',
        'user': 'fas fa-user',
        'facebook': 'fab fa-facebook-f',
        'twitter': 'fab fa-twitter',
        'linkedin': 'fab fa-linkedin-in',
        'instagram': 'fab fa-instagram'
    };

    // Remplacer toutes les icônes Lucide par des icônes Font Awesome
    document.querySelectorAll('[data-lucide]').forEach(function(element) {
        const iconName = element.getAttribute('data-lucide');
        const faClass = iconMappings[iconName] || 'fas fa-' + iconName;
        
        // Créer un nouvel élément i avec la classe Font Awesome
        const faIcon = document.createElement('i');
        faIcon.className = faClass;
        
        // Remplacer l'élément Lucide par l'élément Font Awesome
        element.parentNode.replaceChild(faIcon, element);
    });

    console.log('Icônes remplacées avec succès');
});
