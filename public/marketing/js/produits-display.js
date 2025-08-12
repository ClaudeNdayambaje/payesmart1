// Script pour afficher les produits depuis Firebase sur la page solutions.html

// Version: 1.0.1 - Solution anti-cache pour le filtre des produits inactifs
document.addEventListener('DOMContentLoaded', () => {
    // Force le rafraîchissement complet de la page si demandé via paramètre URL
    if (new URLSearchParams(window.location.search).get('forceRefresh') === 'true') {
        console.log('Forçage du rafraîchissement des ressources...');
        const timestamp = new Date().getTime();
        const scripts = document.querySelectorAll('script[src]');
        scripts.forEach(script => {
            const currentSrc = script.getAttribute('src');
            if (currentSrc && !currentSrc.includes('firebase')) {
                script.setAttribute('src', `${currentSrc}?v=${timestamp}`);
            }
        });
    }
    // Configuration Firebase (identique à celle de admin.js)
    const firebaseConfig = {
        apiKey: "AIzaSyA1YCtMuV9XHstSVdiHfkODwvcMh9fGdqk",
        authDomain: "paysmart-admin.firebaseapp.com",
        projectId: "paysmart-admin",
        storageBucket: "paysmart-admin.appspot.com",
        messagingSenderId: "523481847092",
        appId: "1:523481847092:web:5f789e68ba9cd04c7a4d8c"
    };
    
    // Vérifier si Firebase est disponible
    if (typeof firebase === 'undefined' || !firebase.apps) {
        console.error(t.firebase_error);
        return;
    }
    
    // Initialiser Firebase si ce n'est pas déjà fait
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    
    const db = firebase.firestore();
    const produitsCollection = db.collection('produits');
    
    // Sélectionner le conteneur des produits
    const produitsContainer = document.querySelector('.produits-grid');
    
    // Si nous sommes sur la page des solutions/produits
    if (produitsContainer) {
        // Ne pas afficher d'indicateur de chargement qui perturbe l'expérience visuelle
        // Préserver le contenu original du conteneur jusqu'à ce que les produits soient chargés
        const originalContent = produitsContainer.innerHTML;
        
        // Préparer un div pour le chargement mais ne pas l'afficher immédiatement
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-overlay';
        loadingDiv.innerHTML = '<div class="loading-spinner-center"><i class="fas fa-spinner fa-spin"></i></div>';
        loadingDiv.style.display = 'none';
        
        // Ajouter à la page mais caché
        document.body.appendChild(loadingDiv);
        
        // Charger les produits depuis Firestore
        console.log('Chargement des produits depuis Firestore...');
        produitsCollection.get()
            .then((querySnapshot) => {
                console.log(`Nombre total de produits récupérés: ${querySnapshot.size}`);
                if (querySnapshot.empty) {
                    produitsContainer.innerHTML = '<p class="no-items">Aucun produit disponible pour le moment.</p>';
                    return;
                }
                
                let produitsHTML = '';
                
                // Trier les produits par catégorie
                const produits = [];
                const produitsInactifs = [];
                
                querySnapshot.forEach((doc) => {
                    const produit = { id: doc.id, ...doc.data() };
                    
                    // Log pour le débogage - voir tous les produits et leur statut
                    console.log(`Produit: ${produit.name}, ID: ${produit.id}, Statut actif:`, produit.active);
                    console.log('Données complètes du produit:', JSON.stringify(produit));
                    
                    // FILTRAGE STRICT: un produit est considéré actif UNIQUEMENT si active === true (explicitement)
                    // Les produits avec active=false ou active=undefined/null sont considérés inactifs
                    if (produit.active === true) {
                        produits.push(produit);
                    } else {
                        produitsInactifs.push(produit.name);
                    }
                });
                
                // Log des produits filtrés
                console.log(`Produits actifs (${produits.length}): ${produits.map(p => p.name).join(', ')}`);
                console.log(`Produits inactifs filtrés (${produitsInactifs.length}): ${produitsInactifs.join(', ')}`);
                
                // Si aucun produit actif, afficher un message
                if (produits.length === 0) {
                    produitsContainer.innerHTML = '<p class="no-items">Aucun produit actif disponible pour le moment.</p>';
                    return;
                }
                
                // Trier par catégorie puis par nom
                produits.sort((a, b) => {
                    if (a.category === b.category) {
                        return a.name.localeCompare(b.name);
                    }
                    return a.category.localeCompare(b.category);
                });
                
                // Regrouper les produits par catégorie
                const produitsParCategorie = {};
                produits.forEach(produit => {
                    if (!produit) return; // Ignorer les produits non définis
                    
                    const category = produit.category || 'non-classé';
                    if (!produitsParCategorie[category]) {
                        produitsParCategorie[category] = [];
                    }
                    produitsParCategorie[category].push(produit);
                });
                
                // Parcourir chaque catégorie et afficher les produits
                let categorieIndex = 0;
                for (const [categorie, produitsDeCetteCategorie] of Object.entries(produitsParCategorie)) {
                    let categorieTranslated = categorie;
                    
                    // Appliquer la traduction de la catégorie si nécessaire
                    if (typeof isNLVersion === 'function' && isNLVersion()) {
                        categorieTranslated = translateToNL(categorie, 'categories') || categorie;
                    }
                    
                    // Ajouter un titre de section pour cette catégorie
                    produitsHTML += `
                        <div class="categorie-section">
                            <h2 class="categorie-titre">${categorieTranslated}</h2>
                            <div class="categorie-divider"></div>
                        </div>
                    `;
                    
                    // Générer le HTML pour chaque produit de cette catégorie
                    produitsDeCetteCategorie.forEach((produit, indexDansCatégorie) => {
                        if (!produit) {
                            console.warn('Produit non défini détecté et ignoré');
                            return; // Ignorer les produits non définis
                        }
                        
                        // S'assurer que toutes les propriétés existent
                        let name = produit.name || 'Produit sans nom';
                        let description = produit.description || 'Description non disponible';
                        let category = produit.category || 'non-classé';
                        const price = produit.price || 'N/A';
                        let tagline = produit.subtitle || produit.tagline || 'Solution professionnelle pour votre commerce';
                        
                        // Appliquer les traductions néerlandaises si on est sur la version NL
                        if (typeof isNLVersion === 'function' && isNLVersion()) {
                            console.log(`[TRADUCTION] Produit ${name}:`);
                            console.log(`[TRADUCTION] - Tagline original: "${tagline}"`);
                            console.log(`[TRADUCTION] - Description original: "${description.substring(0, 50)}..."`);
                            
                            const originalName = name;
                            const originalTagline = tagline;
                            const originalDescription = description;
                            
                            name = translateToNL(name, 'productNames') || name;
                            description = translateToNL(description, 'productDescriptions') || description;
                            tagline = translateToNL(tagline, 'productSubtitles') || tagline;
                            
                            console.log(`[TRADUCTION] - Tagline traduit: "${tagline}"`);
                            console.log(`[TRADUCTION] - Description traduite: "${description.substring(0, 50)}..."`);
                            console.log(`[TRADUCTION] - Traduction appliquée: ${originalTagline !== tagline || originalDescription !== description}`);
                        }
                        
                        // Alterner le style avec image à gauche ou à droite
                        // Index global pour l'alternance: nombre de produits dans les catégories précédentes + index dans cette catégorie
                        const globalIndex = indexDansCatégorie + categorieIndex;
                        const isReverse = globalIndex % 2 !== 0 ? 'reverse' : '';
                        
                        // Débogage pour vérifier les URLs d'images et de vidéos
                        console.log(`Produit ${name}: imageUrl=${produit.imageUrl}, videoUrl=${produit.videoUrl}`);
                        
                        // Vérifier si l'URL de l'image est valide (non undefined, non null, et commence par http)
                        const hasValidImage = produit.imageUrl && typeof produit.imageUrl === 'string' && 
                                           (produit.imageUrl.startsWith('http') || produit.imageUrl.startsWith('data:image'));
                        
                        // Vérifier si l'URL de la vidéo est valide
                        const hasValidVideo = produit.videoUrl && typeof produit.videoUrl === 'string' && 
                                           (produit.videoUrl.startsWith('http') || produit.videoUrl.startsWith('data:video'));
                                            
                        produitsHTML += `
                            <div class="produit-simple ${isReverse}" data-category="${category}">
                                ${hasValidImage 
                                    ? `<img src="${produit.imageUrl}" alt="${name}" class="produit-image" onerror="this.onerror=null; this.src='images/placeholder-product.jpg'; console.error('Erreur de chargement d\'image pour ${name}');">` 
                                    : `<div class="produit-image placeholder-container"><i class="placeholder" data-lucide="monitor"></i><p>Image non disponible</p></div>`}
                                
                                <div class="produit-info">
                                    <h3>${name}</h3>
                                    <p class="produit-tagline">${tagline}</p>
                                    <p class="produit-description">${description}</p>
                                    
                                    <!-- Les sections caractéristiques et prix ont été supprimées -->
                                    
                                    <div class="produit-actions">
                                        <a href="contact.html" class="btn btn-primary">${typeof isNLVersion === 'function' && isNLVersion() ? 'Vraag een offerte aan' : 'Demander un devis'}</a>
                                        ${hasValidVideo ? `<a href="#" class="btn-video" data-video="${produit.videoUrl}"><i class="fas fa-play-circle"></i> ${typeof isNLVersion === 'function' && isNLVersion() ? 'Bekijk video' : 'Voir la vidéo'}</a>` : ''}
                                    </div>
                                </div>
                            </div>
                        `;
                    });
                    
                    // Mettre à jour l'index pour la prochaine catégorie
                    categorieIndex += produitsDeCetteCategorie.length;
                }
                
                // Ajouter le HTML final au conteneur sans transition visible
                produitsContainer.innerHTML = produitsHTML;
                
                // Initialiser les icônes Lucide
                if (window.lucide) {
                    lucide.createIcons();
                }
                
                // Configurer les gestionnaires d'événements pour les boutons vidéo
                setupVideoButtonHandlers();
                
                // Supprimer l'overlay de chargement s'il existe
                const loadingOverlay = document.querySelector('.loading-overlay');
                if (loadingOverlay) {
                    loadingOverlay.remove();
                }
            })
            .catch((error) => {
                console.error("Erreur lors du chargement des produits:", error);
                produitsContainer.innerHTML = '<div class="error-message">Une erreur est survenue lors du chargement des produits. Veuillez réessayer ultérieurement.</div>';
                
                // Supprimer l'overlay de chargement en cas d'erreur aussi
                const loadingOverlay = document.querySelector('.loading-overlay');
                if (loadingOverlay) {
                    loadingOverlay.remove();
                }
            });
    }
});
