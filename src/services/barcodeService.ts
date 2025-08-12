import { Product } from '../types';

// Fonction pour générer un code-barres simple pour un produit
export const generateSimpleBarcode = (product: Product): string => {
  // Si le produit a déjà un code-barres, on le retourne
  if (product.barcode) {
    return product.barcode;
  }
  
  // Utiliser un format simple: CAT-XXX où CAT est le préfixe de catégorie et XXX est un numéro séquentiel
  // Extraire les 3 premières lettres de la catégorie (ou moins si la catégorie est plus courte)
  const categoryPrefix = product.category.substring(0, 3).toUpperCase();
  
  // Extraire les chiffres de l'ID du produit ou utiliser un numéro séquentiel simple
  const numericPart = product.id.replace(/\D/g, '');
  const sequentialNumber = numericPart.length > 0 ? numericPart.substring(0, 3).padStart(3, '0') : '001';
  
  return `${categoryPrefix}-${sequentialNumber}`;
};

// Fonction pour générer un code-barres pour un nouveau produit (sans ID)
export const generateNewBarcode = (category: string, products: Product[]): string => {
  // Extraire les 3 premières lettres de la catégorie (ou moins si la catégorie est plus courte)
  const categoryPrefix = category.substring(0, 3).toUpperCase();
  
  // Trouver le numéro de séquence le plus élevé pour cette catégorie
  let maxSequence = 0;
  
  products.forEach(product => {
    if (product.barcode && product.barcode.startsWith(categoryPrefix)) {
      const parts = product.barcode.split('-');
      if (parts.length === 2) {
        const sequence = parseInt(parts[1], 10);
        if (!isNaN(sequence) && sequence > maxSequence) {
          maxSequence = sequence;
        }
      }
    }
  });
  
  // Incrémenter le numéro de séquence et le formater
  const nextSequence = (maxSequence + 1).toString().padStart(3, '0');
  
  return `${categoryPrefix}-${nextSequence}`;
};

// Fonction pour rechercher un produit par code-barres
export const findProductByBarcode = (barcode: string, products: Product[]): Product | null => {
  // D'abord, essayer de trouver par correspondance exacte avec l'ID
  let product = products.find(p => p.id === barcode);
  
  if (!product) {
    // Ensuite, essayer de trouver par le code-barres du produit
    product = products.find(p => p.barcode === barcode);
  }
  
  if (!product) {
    // Enfin, essayer de trouver par le code-barres simplifié
    product = products.find(p => generateSimpleBarcode(p) === barcode);
  }
  
  return product || null;
};

// Fonction pour valider un code-barres
export const isValidBarcode = (barcode: string): boolean => {
  // Implémentation simple pour vérifier si le code-barres est valide
  // Dans un cas réel, cela pourrait inclure des vérifications de somme de contrôle, etc.
  return barcode !== undefined && barcode !== null && barcode.length > 0;
};

// Fonction pour formater un code-barres (si nécessaire)
export const formatBarcode = (barcode: string): string => {
  // Nettoyer le code-barres (supprimer les espaces, etc.)
  return barcode.trim();
};

// Fonction pour extraire les informations d'un produit à partir d'un code-barres
export const extractProductInfoFromBarcode = (barcode: string, products: Product[]): Partial<Product> => {
  // Rechercher le produit correspondant au code-barres
  const product = findProductByBarcode(barcode, products);
  
  if (product) {
    // Si un produit est trouvé, retourner ses informations
    return {
      name: product.name,
      price: product.price,
      category: product.category,
      vatRate: product.vatRate,
      barcode: barcode,
      // Ne pas copier l'ID pour éviter les conflits
    };
  }
  
  // Si aucun produit n'est trouvé, retourner uniquement le code-barres
  return {
    barcode: barcode
  };
};

// Événements de lecture de code-barres
export const setupBarcodeScanner = (
  onBarcodeScanned: (barcode: string) => void
): (() => void) => {
  // Cette fonction gère les événements de clavier qui pourraient provenir d'un scanner de code-barres
  
  let barcodeBuffer = '';
  let lastKeyTime = 0;
  const BARCODE_DELAY = 50; // Délai maximal entre les caractères (en ms)

  const handleKeyDown = (event: KeyboardEvent) => {
    const currentTime = new Date().getTime();
    
    // Si le délai entre les touches est trop long, réinitialiser le buffer
    if (currentTime - lastKeyTime > BARCODE_DELAY && barcodeBuffer.length > 0) {
      barcodeBuffer = '';
    }
    
    lastKeyTime = currentTime;
    
    // Ignorer les touches de modification (Shift, Ctrl, Alt, etc.)
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    
    // Détecter la touche Entrée (fin de la lecture du code-barres)
    if (event.key === 'Enter' && barcodeBuffer.length > 0) {
      // Traiter le code-barres
      onBarcodeScanned(barcodeBuffer);
      barcodeBuffer = '';
      
      // Empêcher le comportement par défaut de la touche Entrée
      event.preventDefault();
      return;
    }
    
    // Ajouter le caractère au buffer si c'est un caractère imprimable
    if (event.key.length === 1) {
      barcodeBuffer += event.key;
    }
  };
  
  // Ajouter l'écouteur d'événements
  window.addEventListener('keydown', handleKeyDown);
  
  // Retourner une fonction pour nettoyer l'écouteur d'événements
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
  };
};
