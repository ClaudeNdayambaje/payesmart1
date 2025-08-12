#!/bin/bash
# Script pour télécharger des images de caisse avec caissier et client

# Créer le dossier s'il n'existe pas
mkdir -p public/marketing/img/backgrounds

# Télécharger une image de caissier avec client
curl -o public/marketing/img/backgrounds/cashier-customer.jpg "https://images.unsplash.com/photo-1556741533-6e6a62bd8b49?q=80&w=2670&auto=format&fit=crop"

# Télécharger une alternative de caisse enregistreuse avec client
curl -o public/marketing/img/backgrounds/paying-customer.jpg "https://images.unsplash.com/photo-1556740749-887f6717d7e4?q=80&w=2670&auto=format&fit=crop"

# Télécharger une image de paiement par carte
curl -o public/marketing/img/backgrounds/card-payment.jpg "https://images.unsplash.com/photo-1556740758-90de374c12ad?q=80&w=2670&auto=format&fit=crop"

echo "Images de caisse et paiement téléchargées avec succès !"
