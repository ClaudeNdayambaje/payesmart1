// Script pour générer des images d'interface pour les différents niveaux de tarif
document.addEventListener('DOMContentLoaded', function() {
    // Fonction pour générer une image d'interface
    function generateInterfaceImage(canvasId, type) {
        const canvas = document.createElement('canvas');
        canvas.width = 600;
        canvas.height = 360;
        canvas.id = canvasId;
        
        const ctx = canvas.getContext('2d');
        
        // Fond
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, 600, 360);
        
        // En-tête
        ctx.fillStyle = '#4338ca';
        ctx.fillRect(0, 0, 600, 50);
        
        // Logo
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Inter, sans-serif';
        ctx.fillText('PayeSmart', 20, 30);
        
        // Barre de navigation
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(150, 0, 100, 50);
        
        // Icônes de navigation
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.arc(500 + i * 25, 25, 8, 0, Math.PI * 2);
            ctx.fill();
        }
        
        if (type === 'starter') {
            drawStarterInterface(ctx);
        } else if (type === 'pro') {
            drawProInterface(ctx);
        } else if (type === 'enterprise') {
            drawEnterpriseInterface(ctx);
        }
        
        // Convertir le canvas en image
        const imageDataURL = canvas.toDataURL('image/jpeg', 0.8);
        
        // Créer un lien pour télécharger l'image
        const link = document.createElement('a');
        link.href = imageDataURL;
        link.download = `interface-${type}.jpg`;
        link.textContent = `Télécharger l'image ${type}`;
        link.style.display = 'block';
        link.style.margin = '10px';
        
        // Ajouter le canvas et le lien au document
        document.body.appendChild(canvas);
        document.body.appendChild(link);
    }
    
    function drawStarterInterface(ctx) {
        // Barre latérale
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(0, 50, 150, 310);
        
        // Menu latéral
        ctx.fillStyle = '#64748b';
        ctx.font = '14px Inter, sans-serif';
        const menuItems = ['Ventes', 'Produits', 'Clients', 'Rapports'];
        menuItems.forEach((item, i) => {
            ctx.fillText(item, 20, 80 + i * 30);
        });
        
        // Titre de la page
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 18px Inter, sans-serif';
        ctx.fillText('Tableau de bord - Version Starter', 170, 80);
        
        // Cartes de statistiques
        for (let i = 0; i < 2; i++) {
            ctx.fillStyle = 'white';
            ctx.fillRect(170 + i * 210, 100, 190, 80);
            ctx.strokeStyle = '#e2e8f0';
            ctx.strokeRect(170 + i * 210, 100, 190, 80);
            
            ctx.fillStyle = '#64748b';
            ctx.font = '14px Inter, sans-serif';
            ctx.fillText(i === 0 ? 'Ventes du jour' : 'Produits populaires', 180 + i * 210, 120);
            
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 24px Inter, sans-serif';
            ctx.fillText(i === 0 ? '127 €' : 'Top 3', 180 + i * 210, 150);
        }
        
        // Liste des transactions récentes
        ctx.fillStyle = 'white';
        ctx.fillRect(170, 200, 410, 140);
        ctx.strokeStyle = '#e2e8f0';
        ctx.strokeRect(170, 200, 410, 140);
        
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.fillText('Transactions récentes', 190, 225);
        
        // Lignes de tableau
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(190, 240, 370, 1);
        
        // Données du tableau
        const transactions = [
            { time: '10:23', amount: '42,50 €', status: 'Complété' },
            { time: '09:45', amount: '15,00 €', status: 'Complété' },
            { time: '09:12', amount: '78,25 €', status: 'Complété' }
        ];
        
        transactions.forEach((tx, i) => {
            ctx.fillStyle = '#64748b';
            ctx.font = '14px Inter, sans-serif';
            ctx.fillText(tx.time, 190, 260 + i * 25);
            ctx.fillText(tx.amount, 290, 260 + i * 25);
            
            ctx.fillStyle = '#10b981';
            ctx.fillText(tx.status, 390, 260 + i * 25);
        });
    }
    
    function drawProInterface(ctx) {
        // Barre latérale
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 50, 150, 310);
        
        // Menu latéral
        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px Inter, sans-serif';
        const menuItems = ['Tableau de bord', 'Ventes', 'Produits', 'Clients', 'Promotions', 'Rapports', 'Paramètres'];
        menuItems.forEach((item, i) => {
            if (i === 0) {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 65 + i * 30, 150, 30);
                ctx.fillStyle = '#4338ca';
                ctx.fillText(item, 20, 85 + i * 30);
            } else {
                ctx.fillStyle = '#94a3b8';
                ctx.fillText(item, 20, 85 + i * 30);
            }
        });
        
        // Titre de la page
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 18px Inter, sans-serif';
        ctx.fillText('Tableau de bord - Version Pro', 170, 80);
        
        // Cartes de statistiques
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = 'white';
            ctx.fillRect(170 + i * 140, 100, 130, 80);
            ctx.strokeStyle = '#e2e8f0';
            ctx.strokeRect(170 + i * 140, 100, 130, 80);
            
            ctx.fillStyle = '#64748b';
            ctx.font = '14px Inter, sans-serif';
            let title, value;
            if (i === 0) {
                title = 'Ventes du jour';
                value = '1 275 €';
            } else if (i === 1) {
                title = 'Clients';
                value = '24';
            } else {
                title = 'Panier moyen';
                value = '53,12 €';
            }
            ctx.fillText(title, 180 + i * 140, 120);
            
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 18px Inter, sans-serif';
            ctx.fillText(value, 180 + i * 140, 150);
        }
        
        // Graphique
        ctx.fillStyle = 'white';
        ctx.fillRect(170, 200, 250, 140);
        ctx.strokeStyle = '#e2e8f0';
        ctx.strokeRect(170, 200, 250, 140);
        
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.fillText('Ventes hebdomadaires', 190, 225);
        
        // Barres du graphique
        const barColors = ['#4338ca', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff', '#eef2ff'];
        for (let i = 0; i < 7; i++) {
            const height = 30 + Math.random() * 70;
            ctx.fillStyle = barColors[i];
            ctx.fillRect(190 + i * 30, 320 - height, 20, height);
        }
        
        // Liste des produits populaires
        ctx.fillStyle = 'white';
        ctx.fillRect(430, 200, 150, 140);
        ctx.strokeStyle = '#e2e8f0';
        ctx.strokeRect(430, 200, 150, 140);
        
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.fillText('Top produits', 450, 225);
        
        // Produits
        const products = ['Café', 'Sandwich', 'Salade', 'Dessert'];
        products.forEach((product, i) => {
            ctx.fillStyle = '#64748b';
            ctx.font = '14px Inter, sans-serif';
            ctx.fillText(product, 450, 255 + i * 25);
            
            ctx.fillStyle = '#4338ca';
            ctx.fillText((100 - i * 15) + ' ventes', 520, 255 + i * 25);
        });
    }
    
    function drawEnterpriseInterface(ctx) {
        // Barre latérale
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 50, 150, 310);
        
        // Menu latéral
        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px Inter, sans-serif';
        const menuItems = ['Tableau de bord', 'Ventes', 'Produits', 'Clients', 'Promotions', 'Magasins', 'Employés', 'Rapports', 'API', 'Paramètres'];
        menuItems.forEach((item, i) => {
            if (i === 0) {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 65 + i * 28, 150, 28);
                ctx.fillStyle = '#4338ca';
                ctx.fillText(item, 20, 85 + i * 28);
            } else {
                ctx.fillStyle = '#94a3b8';
                ctx.fillText(item, 20, 85 + i * 28);
            }
        });
        
        // Titre de la page
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 18px Inter, sans-serif';
        ctx.fillText('Tableau de bord - Version Enterprise', 170, 80);
        
        // Sélecteur de magasin
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(450, 65, 130, 30);
        ctx.fillStyle = '#0f172a';
        ctx.font = '14px Inter, sans-serif';
        ctx.fillText('Tous les magasins ▼', 460, 85);
        
        // Cartes de statistiques
        for (let i = 0; i < 4; i++) {
            ctx.fillStyle = 'white';
            ctx.fillRect(170 + (i % 2) * 215, 100 + Math.floor(i / 2) * 90, 205, 80);
            ctx.strokeStyle = '#e2e8f0';
            ctx.strokeRect(170 + (i % 2) * 215, 100 + Math.floor(i / 2) * 90, 205, 80);
            
            ctx.fillStyle = '#64748b';
            ctx.font = '14px Inter, sans-serif';
            let title, value;
            if (i === 0) {
                title = 'Ventes du jour';
                value = '12 750 €';
            } else if (i === 1) {
                title = 'Clients';
                value = '243';
            } else if (i === 2) {
                title = 'Panier moyen';
                value = '52,47 €';
            } else {
                title = 'Croissance';
                value = '+15,3%';
            }
            ctx.fillText(title, 180 + (i % 2) * 215, 120 + Math.floor(i / 2) * 90);
            
            ctx.fillStyle = i === 3 ? '#10b981' : '#0f172a';
            ctx.font = 'bold 18px Inter, sans-serif';
            ctx.fillText(value, 180 + (i % 2) * 215, 150 + Math.floor(i / 2) * 90);
        }
        
        // Graphique avancé
        ctx.fillStyle = 'white';
        ctx.fillRect(170, 280, 410, 60);
        ctx.strokeStyle = '#e2e8f0';
        ctx.strokeRect(170, 280, 410, 60);
        
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.fillText('Performance par magasin', 190, 300);
        
        // Barres horizontales du graphique
        const storeColors = ['#4338ca', '#6366f1', '#818cf8'];
        const storeNames = ['Paris', 'Lyon', 'Marseille'];
        
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = storeColors[i];
            const width = 100 + Math.random() * 200;
            ctx.fillRect(190, 310 + i * 8, width, 6);
            
            ctx.fillStyle = '#64748b';
            ctx.font = '12px Inter, sans-serif';
            ctx.fillText(storeNames[i], 400, 315 + i * 8);
        }
    }
    
    // Générer les images pour chaque niveau de tarif
    generateInterfaceImage('starter-interface', 'starter');
    generateInterfaceImage('pro-interface', 'pro');
    generateInterfaceImage('enterprise-interface', 'enterprise');
});
