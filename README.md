# Logiciel de Caisse

Application de gestion de caisse et de stocks pour les commerces de détail.

## Fonctionnalités

- Gestion des ventes et des transactions
- Gestion des stocks et des produits
- Gestion des promotions
- Gestion des fournisseurs
- Tableau de bord avec statistiques
- Importation et exportation de données

## Installation

```bash
# Installer les dépendances
npm install

# Lancer l'application en mode développement
npm run dev

# Construire l'application pour la production
npm run build
```

## Guide d'utilisation

### Importation de produits

L'application permet d'importer des produits à partir de fichiers CSV ou Excel (XLSX/XLS). Pour utiliser cette fonctionnalité :

1. Accédez à la page "Gestion des stocks"
2. Cliquez sur le bouton "Importer" en haut à droite
3. Téléchargez un modèle CSV ou Excel si nécessaire
4. Glissez-déposez votre fichier ou cliquez pour sélectionner un fichier
5. Vérifiez l'aperçu des produits importés
6. Cliquez sur "Importer X produits" pour finaliser l'importation

#### Format du fichier d'importation

Le fichier d'importation doit contenir au minimum les colonnes suivantes :
- `name` (obligatoire) : Nom du produit
- `price` (obligatoire) : Prix du produit

Colonnes optionnelles :
- `stock` : Quantité en stock (défaut: 0)
- `category` : Catégorie du produit (défaut: "Non catégorisé")
- `image` : URL de l'image du produit
- `lowStockThreshold` : Seuil d'alerte de stock bas (défaut: 10)
- `vatRate` : Taux de TVA (6, 12 ou 21, défaut: 21)
- `supplier` : Nom du fournisseur
- `orderQuantity` : Quantité à commander (défaut: 0)

### Gestion des promotions

L'application permet également de gérer les promotions sur les produits. Les promotions sont synchronisées avec Firebase pour assurer leur persistance.

## Développement

### Structure du projet

- `/src` : Code source de l'application
  - `/components` : Composants React
  - `/services` : Services pour interagir avec Firebase
  - `/types` : Types TypeScript
  - `/utils` : Fonctions utilitaires

### Technologies utilisées

- React
- TypeScript
- Vite
- Firebase
- Tailwind CSS
- XLSX (pour l'importation Excel)
- PapaParse (pour l'importation CSV)
