#!/bin/bash
# Script pour télécharger une image d'arrière-plan pour la page d'accueil

# Créer le dossier s'il n'existe pas
mkdir -p public/marketing/img/backgrounds

# Télécharger une image d'arrière-plan de haute qualité - une scène de commerce moderne
curl -o public/marketing/img/backgrounds/modern-payment-background.jpg "https://images.unsplash.com/photo-1556740749-887f6717d7e4?q=80&w=2670&auto=format&fit=crop"

# Télécharger une image alternative de caisse
curl -o public/marketing/img/backgrounds/cash-register-background.jpg "https://images.unsplash.com/photo-1556742393-d75f468bfcb0?q=80&w=2670&auto=format&fit=crop"

# Télécharger une image professionnelle de commerce de détail
curl -o public/marketing/img/backgrounds/retail-business.jpg "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=2670&auto=format&fit=crop"

echo "Images téléchargées avec succès !"
