// Script pour la page de contact

document.addEventListener('DOMContentLoaded', function() {
    // Gestion du formulaire de contact
    const contactForm = document.getElementById('contactForm');
    const formSuccess = document.getElementById('formSuccess');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Simuler l'envoi du formulaire
            setTimeout(function() {
                // Afficher le message de succès
                formSuccess.classList.add('active');
                
                // Réinitialiser le formulaire
                contactForm.reset();
                
                // Masquer le message de succès après 5 secondes
                setTimeout(function() {
                    formSuccess.classList.remove('active');
                }, 5000);
            }, 1000);
        });
    }
    
    // Gestion des questions fréquentes
    const faqItems = document.querySelectorAll('.faq-item');
    
    if (faqItems.length > 0) {
        faqItems.forEach(function(item) {
            const question = item.querySelector('.faq-question');
            
            question.addEventListener('click', function() {
                // Fermer toutes les autres questions
                faqItems.forEach(function(otherItem) {
                    if (otherItem !== item && otherItem.classList.contains('active')) {
                        otherItem.classList.remove('active');
                    }
                });
                
                // Ouvrir/fermer la question actuelle
                item.classList.toggle('active');
            });
        });
        
        // Ouvrir la première question par défaut
        faqItems[0].classList.add('active');
    }
});
