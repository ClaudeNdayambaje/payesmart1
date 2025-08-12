import React, { useState, useMemo, useEffect } from 'react';
import { Product } from '../types';
import { Search, AlertTriangle, Loader2 } from 'lucide-react';
import { getProducts } from '../services/productService';
import { getCategories } from '../services/categoryService';

interface ProductGridProps {
  onProductSelect: (product: Product) => void;
}

const ProductGridFirebase: React.FC<ProductGridProps> = ({ onProductSelect }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les produits et catégories depuis Firebase
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Charger les produits
        const productsData = await getProducts();
        setProducts(productsData);
        
        // Extraire les catégories uniques
        const uniqueCategories = [...new Set(productsData.map(p => p.category))];
        setCategories(uniqueCategories);
      } catch (err) {
        console.error('Erreur lors du chargement des produits:', err);
        setError('Impossible de charger les produits. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory, products]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-2 text-gray-600">Chargement des produits...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-500">
          <AlertTriangle className="h-8 w-8 mx-auto" />
          <p className="mt-2">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher des produits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap ${
              !selectedCategory ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Tout
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                selectedCategory === category ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredProducts.map(product => (
          <div
            key={product.id}
            onClick={() => onProductSelect(product)}
            className="bg-white rounded-lg shadow overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="relative h-32 bg-gray-100">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  Pas d'image
                </div>
              )}
              {product.promotion && (
                <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-1 m-1 rounded">
                  {product.promotion.type === 'percentage' && `-${product.promotion.value}%`}
                  {product.promotion.type === 'fixed' && `-${product.promotion.value}€`}
                  {product.promotion.type === 'buyXgetY' && `${product.promotion.buyQuantity}+${product.promotion.getFreeQuantity}`}
                </div>
              )}
              {product.stock <= (product.lowStockThreshold || 10) && (
                <div className="absolute bottom-0 left-0 bg-amber-500 text-white text-xs px-2 py-1 m-1 rounded flex items-center">
                  <AlertTriangle size={12} className="mr-1" />
                  Stock bas
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
              <div className="flex justify-between items-center mt-1">
                <span className="text-indigo-600 font-bold">{product.price.toFixed(2)}€</span>
                <span className="text-gray-500 text-sm">Stock: {product.stock}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          Aucun produit ne correspond à votre recherche
        </div>
      )}
    </div>
  );
};

export default ProductGridFirebase;
