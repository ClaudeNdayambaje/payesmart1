document.addEventListener('DOMContentLoaded', function() {
    console.log('Débogage des filtres - Démarrage');
    
    // Débogage des boutons de filtre
    const buttons = [...document.querySelectorAll('.category-filter button')];
    console.log('Débogage filtres - Boutons:', buttons.map(b => ({
        filter: b.getAttribute('data-filter'),
        text: b.textContent.trim()
    })));
    
    // Débogage des cartes d'accessoires
    const cards = [...document.querySelectorAll('.accessoire-card')];
    console.log('Débogage filtres - Cartes:', cards.map(c => ({
        category: c.getAttribute('data-category'),
        display: c.style.display
    })));
    
    // Ajouter des écouteurs d'événements pour monitorer les clics sur les filtres
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            const filterValue = this.getAttribute('data-filter');
            console.log(`Filtre cliqué: ${filterValue}`);
            
            // Vérifier quelles cartes correspondent à ce filtre
            setTimeout(() => {
                const visibleCards = [...document.querySelectorAll('.accessoire-card')]
                    .filter(card => card.style.display !== 'none');
                
                console.log(`Cartes visibles après filtre "${filterValue}": ${visibleCards.length}`);
                console.log('Catégories des cartes visibles:', visibleCards.map(c => c.getAttribute('data-category')));
                
                // Vérifier explicitement chaque carte pour voir si elle devrait être visible
                cards.forEach(card => {
                    const cardCategory = card.getAttribute('data-category');
                    const shouldBeVisible = filterValue === 'tous' || cardCategory === filterValue;
                    console.log(`Carte ${cardCategory}: devrait être ${shouldBeVisible ? 'visible' : 'cachée'}, est ${card.style.display !== 'none' ? 'visible' : 'cachée'}`);
                });
            }, 100);
        });
    });
});
