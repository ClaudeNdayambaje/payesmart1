import React, { useState, useMemo, useEffect } from 'react';
import { Product } from '../types';
import { AlertTriangle, Package, Percent, Tag, X, Trash2 } from 'lucide-react';
import { normalizePromotion } from '../services/promotionService';
import { onEvent } from '../services/eventService';

interface ProductGridProps {
  products: Product[];
  onProductSelect: (product: Product) => void;
  onDeleteProduct?: (productId: string) => void;
  searchQuery: string;
  categories?: string[];
  isManagementMode?: boolean; // Indique si nous sommes en mode gestion (true) ou en mode caisse (false)
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, onProductSelect, onDeleteProduct, searchQuery, categories: propCategories }) => {
  // Détection automatique du contexte d'utilisation (interface caisse vs page produits)
  const [isCashRegisterInterface, setIsCashRegisterInterface] = useState<boolean>(false);
  
  useEffect(() => {
    // Détecte si nous sommes dans l'interface caisse en vérifiant la présence d'éléments spécifiques
    const cashRegisterElements = document.querySelector('#main-content-area h1');
    if (cashRegisterElements) {
      const title = cashRegisterElements.textContent || '';
      setIsCashRegisterInterface(title.includes('Caisse'));
    }
  }, []);
  // Initialiser avec la catégorie "Tout" par défaut
  const [selectedCategory, setSelectedCategory] = useState<string | null>('Tout');
  // État local pour les produits, initialisé avec les props
  const [localProducts, setLocalProducts] = useState<Product[]>(products);

  // Mettre à jour les produits locaux lorsque les props changent
  useEffect(() => {
    setLocalProducts(products);
  }, [products]);

  // Écouter les événements de mise à jour du stock
  useEffect(() => {
    // Fonction pour mettre à jour un produit spécifique lorsque son stock change
    const handleStockUpdate = (payload: any) => {
      if (!payload || !payload.productId) return;
      
      console.log('Mise à jour du stock détectée:', payload);
      
      setLocalProducts(currentProducts => 
        currentProducts.map(product => 
          product.id === payload.productId 
            ? { ...product, stock: payload.newStock }
            : product
        )
      );
    };
    
    // S'abonner à l'événement stockUpdated
    const unsubscribe = onEvent('stockUpdated', handleStockUpdate);
    
    // Se désabonner lors du démontage du composant
    return () => {
      unsubscribe();
    };
  }, []);

  // Utiliser les catégories passées en props si disponibles, sinon extraire des produits
  const allCategories = propCategories || [...new Set(localProducts.map(p => p.category))];
  
  // S'assurer que toutes les catégories sont des chaînes de caractères
  const normalizedCategories = allCategories.map(cat => {
    if (typeof cat === 'object' && cat !== null && 'name' in cat) {
      return cat.name; // Si c'est un objet avec une propriété name, utiliser cette propriété
    }
    return String(cat); // Sinon, convertir en chaîne de caractères
  });
  
  // Ajouter la catégorie "Tout" au début de la liste
  const categories = ['Tout', ...normalizedCategories.filter(cat => cat !== 'Tout')];

  const filteredProducts = useMemo(() => {
    return localProducts.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || selectedCategory === 'Tout' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, localProducts]);

  // Les catégories sont toujours affichées
  const [animation, setAnimation] = useState('');
  
  useEffect(() => {
    setAnimation('animate-fadeIn');
    return () => setAnimation('');
  }, []);

  const isPromotionActive = (promotion: any) => {
    if (!promotion) return false;
    
    // Normaliser la promotion pour assurer le bon format des dates
    const normalizedPromotion = normalizePromotion(promotion);
    if (!normalizedPromotion) return false;
    
    const today = new Date();
    return today >= normalizedPromotion.startDate && today <= normalizedPromotion.endDate;
  };

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col gap-2 mb-2">
        
        {/* Affichage des catégories */}
        <div className="animate-slideDown w-full">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Tag size={18} />
              <span>Catégories</span>
            </h3>
            {selectedCategory && (
              <button 
                onClick={() => setSelectedCategory(null)}
                className="text-xs theme-primary-text hover:theme-primary-text-dark flex items-center gap-1"
              >
                <X size={14} />
                Réinitialiser
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category, index) => {
              // S'assurer que la catégorie est une chaîne de caractères
              const categoryText = typeof category === 'object' && category !== null && 'name' in category 
                ? category.name 
                : String(category);
                
              return (
                <button
                  key={index} // Utiliser l'index comme clé pour éviter les doublons ou les problèmes avec des objets
                  onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    category === selectedCategory
                      ? 'theme-primary text-white dark:bg-[#f6941c] dark:text-white font-bold shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {categoryText}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grille de produits */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ${animation}`}>
        {filteredProducts.length === 0 ? (
          <div className="col-span-full py-8 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Aucun produit trouvé</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Essayez de modifier votre recherche ou de sélectionner une autre catégorie.
            </p>
          </div>
        ) : (
          filteredProducts.map(product => {
            // Vérifier si la promotion existe ET si elle est active
            const hasPromotion = product.promotion !== undefined && isPromotionActive(product.promotion);
            const isLowStock = product.stock <= (product.lowStockThreshold || 5);
            
            return (
              <div
                key={product.id}
                className={`relative group overflow-hidden rounded-xl ${
                  product.stock === 0 
                    ? 'bg-gray-200 dark:bg-gray-700' 
                    : 'bg-white dark:bg-gray-800'
                } shadow-md hover:shadow-lg transition-all duration-300 ${
                  product.stock === 0 ? 'opacity-90 cursor-not-allowed' : 'cursor-pointer'
                }`}
                onClick={(e) => {
                  // Ne pas déclencher si on clique sur le bouton de suppression
                  if (e.target instanceof HTMLElement && 
                      (e.target.closest('.delete-button') || e.target.classList.contains('delete-button'))) {
                    return;
                  }
                  product.stock > 0 && onProductSelect(product);
                }}
                role="button"
                tabIndex={0}
                aria-disabled={product.stock === 0}
              >
                {/* Bouton de suppression (n'apparaît que si onDeleteProduct est fourni ET nous ne sommes PAS dans l'interface caisse) */}
                {onDeleteProduct && !isCashRegisterInterface && (
                  <div className="absolute top-2 left-2 z-30">
                    <button 
                      className="delete-button bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProduct(product.id);
                      }}
                      aria-label="Supprimer le produit"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
                
                {/* Badges */}
                <div className="absolute top-2 right-2 flex flex-col gap-1 z-30">
                  {hasPromotion && (
                    <div className="theme-success text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                      <Percent size={12} />
                      <span className="hidden sm:inline">Promo</span>
                    </div>
                  )}
                  {isLowStock && product.stock > 0 && (
                    <div className="relative">
                      <div className="animate-pulse absolute inset-0 theme-warning rounded-md opacity-50"></div>
                      <div className="theme-warning text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm relative z-10">
                        <AlertTriangle size={12} />
                        <span className="hidden sm:inline">Stock faible</span>
                      </div>
                    </div>
                  )}
                  {product.stock === 0 && (
                    <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm animate-pulse">
                      <X size={12} />
                      <span className="sm:inline">Rupture</span>
                    </div>
                  )}
                </div>
                
                {/* Image avec effet de zoom au survol et espace élégant */}
                <div className="relative overflow-hidden h-32 sm:h-40 p-2 pt-3 z-10">
                  <div className="absolute inset-2 top-3 rounded-lg theme-primary-dark bg-opacity-30 opacity-0 group-hover:opacity-100 transition-opacity z-1"></div>
                  {product.stock === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <div className="bg-red-600 bg-opacity-90 text-white px-3 py-1 rounded-lg font-bold transform -rotate-12 shadow-lg">
                        RUPTURE DE STOCK
                      </div>
                    </div>
                  )}
                  <div className="h-full w-full rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-700 shadow-inner">
                    <img
                      src={product.image}
                      alt={product.name}
                      className={`w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-110 pointer-events-none ${
                        product.stock === 0 ? 'opacity-70 grayscale' : ''
                      }`}
                    />
                  </div>
                </div>
                
                {/* Contenu */}
                <div className="px-3 pb-3 pt-0">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 group-hover:theme-primary-text transition-colors line-clamp-2 text-sm sm:text-base">{product.name}</h3>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2">
                    <div className="flex flex-col">
                      <p className="theme-primary-text dark:text-[#f6941c] font-bold text-base sm:text-lg">{product.price.toFixed(2)} €</p>
                      <span className="text-xs text-gray-500 dark:text-gray-400">TVA {product.vatRate}%</span>
                    </div>
                    {isLowStock ? (
                      <div className="theme-warning-light theme-warning-text px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
                        <AlertTriangle size={10} />
                        Stock: {product.stock}
                      </div>
                    ) : (
                      <div className="theme-primary-light theme-primary-text px-2 py-1 rounded-md text-xs font-medium">
                        Stock: {product.stock}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ProductGrid;