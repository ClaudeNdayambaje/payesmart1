// Fonction de déconnexion
function logout() {
    // Rediriger vers la page d'authentification avec un paramètre de déconnexion
    window.location.href = '/auth?logout=true';
}

// Exposer la fonction logout globalement
window.logout = logout;

document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    
    if (mobileMenuToggle && mainNav) {
        mobileMenuToggle.addEventListener('click', function() {
            mainNav.classList.toggle('active');
            const bars = document.querySelectorAll('.bar');
            bars.forEach(bar => bar.classList.toggle('active'));
        });
    }
    
    // Pricing Toggle - compatible avec l'ancien et le nouveau design
    const pricingToggle = document.getElementById('pricing-toggle');
    // Essayer de trouver soit l'ancien grid soit le nouveau container
    const pricingGrid = document.querySelector('.pricing-grid') || document.querySelector('.pricing-cards-container');
    
    if (pricingToggle && pricingGrid) {
        pricingToggle.addEventListener('change', function() {
            const monthlyPrices = document.querySelectorAll('.amount.monthly');
            const annualPrices = document.querySelectorAll('.amount.annual');
            
            monthlyPrices.forEach(price => {
                price.style.display = pricingToggle.checked ? 'none' : 'inline';
            });
            
            annualPrices.forEach(price => {
                price.style.display = pricingToggle.checked ? 'inline' : 'none';
            });
        });
    } else if (pricingToggle) {
        console.log('Toggle trouvé mais pas de container - probablement nouveau design avec toggle séparé');
    } else if (pricingGrid) {
        console.log('Container trouvé mais pas de toggle - probablement nouveau design');
    }
    
    // Testimonial Slider
    const testimonialSlider = document.querySelector('.testimonials-slider');
    const prevButton = document.querySelector('.testimonial-prev');
    const nextButton = document.querySelector('.testimonial-next');
    
    if (testimonialSlider && prevButton && nextButton) {
        const slideWidth = 380; // Width of testimonial card + gap
        
        prevButton.addEventListener('click', function() {
            testimonialSlider.scrollBy({
                left: -slideWidth,
                behavior: 'smooth'
            });
        });
        
        nextButton.addEventListener('click', function() {
            testimonialSlider.scrollBy({
                left: slideWidth,
                behavior: 'smooth'
            });
        });
    }
    
    // Smooth Scrolling for Anchor Links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    
    anchorLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                if (mainNav && mainNav.classList.contains('active')) {
                    mainNav.classList.remove('active');
                    document.querySelectorAll('.bar').forEach(bar => bar.classList.remove('active'));
                }
            }
        });
    });
    
    // Header Scroll Effect
    const header = document.querySelector('.header');
    
    // Fonction pour gérer l'effet de défilement
    function handleHeaderScroll() {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }
    
    // Forcer l'état initial transparent au chargement
    header.classList.remove('scrolled');
    
    // Ajouter l'écouteur d'événement pour le défilement
    window.addEventListener('scroll', handleHeaderScroll);
    
    // Form Submission Handler
    const contactForm = document.querySelector('.contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Here you would typically handle form submission with AJAX
            // For now, let's just show a success message
            const formGroups = contactForm.querySelectorAll('.form-group');
            const formButtons = contactForm.querySelectorAll('button');
            
            formGroups.forEach(group => {
                group.style.display = 'none';
            });
            
            formButtons.forEach(button => {
                button.style.display = 'none';
            });
            
            const successMessage = document.createElement('div');
            successMessage.classList.add('success-message');
            successMessage.innerHTML = `
                <div class="text-center">
                    <i class="fas fa-check-circle" style="font-size: 48px; color: var(--primary-color); margin-bottom: 16px;"></i>
                    <h3>Message envoyé avec succès!</h3>
                    <p>Nous vous répondrons dans les plus brefs délais.</p>
                </div>
            `;
            
            contactForm.appendChild(successMessage);
        });
    }
    
    // Video Play Button
    const videoPlayButton = document.querySelector('.video-play-button');
    
    if (videoPlayButton) {
        videoPlayButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Here you would typically handle video playback
            // For a simple demo, let's just change the button appearance
            this.innerHTML = '<i class="fas fa-pause"></i>';
            this.classList.add('playing');
            
            // You could also replace the image with an actual video player
            // const videoContainer = this.closest('.demo-video');
            // const videoImage = videoContainer.querySelector('img');
            // videoImage.style.display = 'none';
            // const videoPlayer = document.createElement('video');
            // videoPlayer.src = 'video/demo.mp4';
            // videoPlayer.controls = true;
            // videoPlayer.autoplay = true;
            // videoContainer.appendChild(videoPlayer);
        });
    }
    
    // Create placeholder mockup image
    createPlaceholderMockup();
});

// Function to create placeholder mockup image if not available
function createPlaceholderMockup() {
    const mockupImg = document.querySelector('.dashboard-image');
    
    if (mockupImg && mockupImg.naturalWidth === 0) {
        // Image not loaded, create a canvas placeholder
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 400;
        canvas.className = 'dashboard-image';
        
        const ctx = canvas.getContext('2d');
        
        // Background
        ctx.fillStyle = '#f5f7ff';
        ctx.fillRect(0, 0, 600, 400);
        
        // Header
        ctx.fillStyle = '#4338ca';
        ctx.fillRect(0, 0, 600, 60);
        
        // Side nav
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(0, 60, 150, 340);
        
        // Content area - graph
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(170, 80, 410, 120);
        
        // Graph lines
        ctx.strokeStyle = '#a5b4fc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(190, 150);
        ctx.lineTo(220, 120);
        ctx.lineTo(270, 140);
        ctx.lineTo(320, 100);
        ctx.lineTo(370, 130);
        ctx.lineTo(420, 90);
        ctx.lineTo(470, 110);
        ctx.lineTo(520, 95);
        ctx.stroke();
        
        // Content cards
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(170, 220, 200, 80);
        ctx.fillRect(380, 220, 200, 80);
        ctx.fillRect(170, 320, 200, 80);
        ctx.fillRect(380, 320, 200, 80);
        
        // Text placeholders
        ctx.fillStyle = '#6b7280';
        ctx.fillRect(190, 240, 120, 10);
        ctx.fillRect(190, 260, 80, 10);
        ctx.fillRect(400, 240, 120, 10);
        ctx.fillRect(400, 260, 80, 10);
        ctx.fillRect(190, 340, 120, 10);
        ctx.fillRect(190, 360, 80, 10);
        ctx.fillRect(400, 340, 120, 10);
        ctx.fillRect(400, 360, 80, 10);
        
        // Replace image with canvas
        mockupImg.parentNode.replaceChild(canvas, mockupImg);
    }
    
    // Do the same for feature-detail image
    const featureImg = document.querySelector('.feature-detail-image img');
    
    if (featureImg && featureImg.naturalWidth === 0) {
        const canvas = document.createElement('canvas');
        canvas.width = 500;
        canvas.height = 300;
        
        const ctx = canvas.getContext('2d');
        
        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 500, 300);
        
        // Header
        ctx.fillStyle = '#4338ca';
        ctx.fillRect(0, 0, 500, 50);
        
        // Content
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(20, 70, 460, 50);
        ctx.fillRect(20, 140, 460, 50);
        ctx.fillRect(20, 210, 460, 50);
        
        // Replace image with canvas
        featureImg.parentNode.replaceChild(canvas, featureImg);
    }
    
    // Create placeholder testimonial avatars
    document.querySelectorAll('.testimonial-avatar').forEach((avatar, index) => {
        if (avatar.naturalWidth === 0) {
            const canvas = document.createElement('canvas');
            canvas.width = 50;
            canvas.height = 50;
            canvas.className = 'testimonial-avatar';
            
            const ctx = canvas.getContext('2d');
            
            // Background
            const colors = ['#4338ca', '#6366f1', '#a855f7'];
            ctx.fillStyle = colors[index % colors.length];
            ctx.fillRect(0, 0, 50, 50);
            
            // Circle
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(25, 20, 10, 0, Math.PI * 2);
            ctx.fill();
            
            // Body
            ctx.beginPath();
            ctx.arc(25, 60, 20, 0, Math.PI * 2);
            ctx.fill();
            
            // Replace image with canvas
            avatar.parentNode.replaceChild(canvas, avatar);
        }
    });
    
    // Create placeholder for demo video
    const demoImg = document.querySelector('.demo-video img');
    
    if (demoImg && demoImg.naturalWidth === 0) {
        const canvas = document.createElement('canvas');
        canvas.width = 500;
        canvas.height = 300;
        
        const ctx = canvas.getContext('2d');
        
        // Background
        ctx.fillStyle = '#111827';
        ctx.fillRect(0, 0, 500, 300);
        
        // PayeSmart Logo text
        ctx.font = 'bold 24px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.fillText('PayeSmart', 250, 130);
        
        ctx.font = '16px Arial';
        ctx.fillText('Cliquez pour voir la démo', 250, 160);
        
        // Replace image with canvas
        demoImg.parentNode.replaceChild(canvas, demoImg);
    }
}
