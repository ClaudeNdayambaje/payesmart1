import React, { useState, useMemo, useEffect } from 'react';
import { Product } from '../types';
import { 
  Search, AlertTriangle, Edit, History, Plus, List, Grid, FileUp, Tag, Trash2, CheckSquare, Square, X, Eye, QrCode, Package, Euro, ShoppingBag, AlertCircle, MoreVertical, ChevronDown
} from 'lucide-react';
import NewProductForm from './NewProductForm';
import EditProductForm from './EditProductForm';
import ImportProductsModal from './ImportProductsModal';
import CategoriesManager from './CategoriesManager';
import ProductDetailsModal from './ProductDetailsModal';
import ConfirmationModal from './ConfirmationModal';

interface StockManagerProps {
  products: Product[];
  onUpdateProduct: (productId: string, updates: Partial<Product>) => void;
  onShowMovementModal: (product: Product) => void;
  onShowHistoryModal: (product: Product) => void;
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onDeleteProduct?: (productId: string) => void;
  onDeleteMultipleProducts?: (productIds: string[]) => void;
  categories: string[];
  onAddCategory: (category: string) => void;
  onUpdateCategory: (oldCategory: string, newCategory: string) => void;
  onDeleteCategory: (category: string) => void;
  onViewChange?: (view: string) => void;
  hasPermission: (permission: string) => boolean;
}

const StockManager: React.FC<StockManagerProps> = ({
  products,
  onUpdateProduct,
  onShowMovementModal,
  onShowHistoryModal,
  onAddProduct,
  onDeleteProduct,
  onDeleteMultipleProducts,
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onViewChange,
  hasPermission
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list'); // Mode liste par défaut
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [showLowStockPanel, setShowLowStockPanel] = useState(false);
  const [selectedProductForDetails, setSelectedProductForDetails] = useState<Product | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null); // Pour gérer l'état du menu déroulant
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [productToDeleteData, setProductToDeleteData] = useState<{id: string, name: string} | null>(null);

  // Filtrer les produits en fonction de la recherche et de la catégorie sélectionnée
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // Produits avec stock faible, triés par priorité (stock le plus bas d'abord)
  const lowStockProducts = useMemo(() => {
    return products
      .filter(product => product.stock <= (product.lowStockThreshold || 0))
      .sort((a, b) => {
        // Priorité 1: Rupture de stock
        if (a.stock === 0 && b.stock !== 0) return -1;
        if (a.stock !== 0 && b.stock === 0) return 1;

        // Priorité 2: Pourcentage par rapport au seuil
        const aPercentage = a.lowStockThreshold ? a.stock / a.lowStockThreshold : 0;
        const bPercentage = b.lowStockThreshold ? b.stock / b.lowStockThreshold : 0;

        return aPercentage - bPercentage;
      });
  }, [products]);

  const handleAddProduct = (product: Omit<Product, 'id'>) => {
    // Si la catégorie n'existe pas encore, l'ajouter
    if (!categories.includes(product.category)) {
      onAddCategory(product.category);
    }
    onAddProduct(product);
  };

  const handleEditProduct = (productId: string, updates: Partial<Product>) => {
    onUpdateProduct(productId, updates);
    setShowEditModal(false);
    setEditingProduct(null);
  };

  const openEditModal = (product: Product, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setEditingProduct(product);
    setShowEditModal(true);
  };

  // La fonction handleDeleteProduct a été remplacée par la gestion directe dans les handlers d'événements

  const confirmDeleteProduct = () => {
    if (productToDelete && onDeleteProduct) {
      onDeleteProduct(productToDelete);
      setShowDeleteConfirmModal(false);
      setProductToDelete(null);
    }
  };

  const handleToggleSelectionMode = () => {
    const newSelectionMode = !isSelectionMode;
    setIsSelectionMode(newSelectionMode);

    // Toujours réinitialiser la sélection quand on change de mode
    setSelectedProducts([]);
  };

  const handleToggleProductSelection = (productId: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const handleSelectAllProducts = () => {
    // Si tous les produits filtrés sont déjà sélectionnés, on désélectionne tout
    const allFilteredProductIds = filteredProducts.map(p => p.id);
    const allSelected = allFilteredProductIds.length > 0 &&
                       allFilteredProductIds.every(id => selectedProducts.includes(id));

    if (allSelected) {
      // Désélectionner tous les produits
      setSelectedProducts([]);
    } else {
      // Sélectionner tous les produits filtrés
      setSelectedProducts(allFilteredProductIds);
    }
  };

  const handleDeleteSelectedProducts = () => {
    if (selectedProducts.length > 0 && onDeleteMultipleProducts) {
      onDeleteMultipleProducts(selectedProducts);
      setSelectedProducts([]);
      setIsSelectionMode(false);
    }
  };

  // Désactiver le mode sélection si aucun produit n'est disponible
  useEffect(() => {
    if (filteredProducts.length === 0 && isSelectionMode) {
      setIsSelectionMode(false);
      setSelectedProducts([]);
    }
  }, [filteredProducts.length, isSelectionMode]);

  const handleImportProducts = (products: Omit<Product, 'id'>[]) => {
    // Collecter toutes les nouvelles catégories
    const newCategories = new Set<string>();

    products.forEach(product => {
      if (product.category && !categories.includes(product.category)) {
        newCategories.add(product.category);
      }
      onAddProduct(product);
    });

    // Mettre à jour les catégories
    if (newCategories.size > 0) {
      // Ajouter chaque nouvelle catégorie
      Array.from(newCategories).forEach(category => {
        onAddCategory(category);
      });
    }
  };

  // Calculer le nombre de produits par catégorie
  const productsInCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach(product => {
      if (product.category) {
        counts[product.category] = (counts[product.category] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  // Calculer les KPI
  const kpiData = useMemo(() => {
    // Nombre total de produits
    const totalProducts = products.length;

    // Valeur totale du stock
    const totalStockValue = products.reduce((sum, product) =>
      sum + (product.price * product.stock), 0);

    // Nombre de produits en rupture de stock
    const outOfStockProducts = products.filter(product => product.stock <= 0).length;

    // Nombre de produits avec stock faible (moins de 5 unités)
    const lowStockProducts = products.filter(product => product.stock > 0 && product.stock < 5).length;

    return {
      totalProducts,
      totalStockValue,
      outOfStockProducts,
      lowStockProducts
    };
  }, [products]);

  // Fonction pour formater les nombres avec des espaces entre les milliers
  const formatNumber = (num: number | undefined): string => {
    if (num === undefined) return "0";
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  // Fonction pour formater les prix avec 2 décimales et des espaces entre les milliers
  const formatPrice = (price: number): string => {
    // Formater avec 2 décimales
    const priceWithDecimals = price.toFixed(2);
    // Séparer la partie entière et décimale
    const [intPart, decPart] = priceWithDecimals.split('.');
    // Formater la partie entière avec des espaces
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    // Recombiner avec la partie décimale
    return `${formattedInt},${decPart}`;
  };

  // Les boutons d'édition sont toujours affichés pour les utilisateurs ayant la permission d'accéder à l'inventaire

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-[2000px] mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gestion des stocks</h1>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto sm:ml-auto">
            {/* Barre de recherche et filtres */}
            <div className="flex flex-col md:flex-row gap-3 w-full sm:w-auto">
              <div className="relative min-w-[180px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[color:var(--color-text-secondary)]" size={18} />
                <input
                  type="text"
                  placeholder="Rechercher un produit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
                />
              </div>
              <div className="relative">
                <select
                  className="appearance-none w-full min-w-[180px] pl-3 pr-10 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
                  value={selectedCategory || ""}
                  onChange={(e) => setSelectedCategory(e.target.value || null)}
                >
                  <option value="">Toutes les catégories</option>
                  {categories.map((category, index) => {
                    // Normaliser la catégorie pour s'assurer qu'elle est une chaîne
                    const categoryValue = typeof category === 'object' && category !== null && 'name' in category 
                      ? category.name 
                      : String(category);
                      
                    return (
                      <option key={index} value={categoryValue}>{categoryValue}</option>
                    );
                  })}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" size={16} />
              </div>
            </div>
            
            {/* Boutons d'affichage et d'actions */}
            <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-700 shadow'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
                }`}
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-700 shadow'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
                }`}
              >
                <List size={20} />
              </button>
              {hasPermission("inventory_management") && (
                <button
                  onClick={handleToggleSelectionMode}
                  className={`p-2 rounded ${
                    isSelectionMode
                      ? 'bg-white dark:bg-gray-700 shadow'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
                  }`}
                  title="Mode de sélection"
                >
                  <CheckSquare size={20} />
                </button>
              )}
              {hasPermission("inventory_management") && (
                <button
                  onClick={() => onViewChange && onViewChange('qrcodes')}
                  className={`p-2 rounded text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white`}
                  title="Codes QR"
                >
                  <QrCode size={20} />
                </button>
              )}
              {hasPermission("inventory_management") && (
                <button
                  onClick={() => setShowImportModal(true)}
                  className={`p-2 rounded text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white`}
                  title="Importer"
                >
                  <FileUp size={20} />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {isSelectionMode ? (
                <>
                  <button
                    onClick={handleSelectAllProducts}
                    className="theme-secondary text-white px-4 py-2 rounded-lg hover:opacity-80 flex items-center gap-2"
                  >
                    {filteredProducts.length > 0 && filteredProducts.every(p => selectedProducts.includes(p.id)) ? 
                      <Square size={20} /> : <CheckSquare size={20} />}
                    {filteredProducts.length > 0 && filteredProducts.every(p => selectedProducts.includes(p.id)) ? 
                      'Désélectionner tout' : 'Sélectionner tout'}
                  </button>
                  {hasPermission("inventory_management") && (
                    <button
                      onClick={handleDeleteSelectedProducts}
                      disabled={selectedProducts.length === 0}
                      className={`px-4 py-2 rounded-lg ${
                        selectedProducts.length === 0 
                          ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                          : 'theme-danger text-white hover:opacity-80'
                      }`}
                    >
                      <Trash2 size={20} />
                      Supprimer ({selectedProducts.length})
                    </button>
                  )}
                  <button
                    onClick={handleToggleSelectionMode}
                    className="theme-secondary text-white px-4 py-2 rounded-lg hover:opacity-80 flex items-center gap-2"
                  >
                    <X size={20} />
                    Annuler
                  </button>
                </>
              ) : (
                <>
                  {hasPermission("inventory_management") && (
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="theme-primary text-white px-4 py-2 rounded-lg hover:opacity-80 flex items-center gap-2"
                    >
                      <Plus size={20} />
                      Ajouter un produit
                    </button>
                  )}

                  {hasPermission("inventory_management") && (
                    <button
                      onClick={() => setShowCategoriesModal(true)}
                      className="theme-warning text-white px-4 py-2 rounded-lg hover:opacity-80 flex items-center gap-2"
                    >
                      <Tag size={20} />
                      Catégories
                    </button>
                  )}

                </>
              )}
            </div>
          </div>
        </div>

        {/* Section des KPI */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* KPI 1: Nombre total de produits */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-full bg-blue-600">
                <Package size={18} className="text-white" />
              </div>
              <h3 className="font-medium text-gray-700 dark:text-white text-sm">Nombre total de produits</h3>
            </div>
            <p className="text-xl font-bold mb-1.5 dark:text-white">{formatNumber(kpiData.totalProducts)}</p>
          </div>

          {/* KPI 2: Valeur totale du stock */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-full bg-green-600">
                <Euro size={18} className="text-white" />
              </div>
              <h3 className="font-medium text-gray-700 dark:text-white text-sm">Valeur totale du stock</h3>
            </div>
            <p className="text-xl font-bold mb-1.5 dark:text-white">{formatPrice(kpiData.totalStockValue)} €</p>
          </div>

          {/* KPI 3: Produits en rupture de stock */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-full bg-red-600">
                <AlertCircle size={18} className="text-white" />
              </div>
              <h3 className="font-medium text-gray-700 dark:text-white text-sm">Produits en rupture</h3>
            </div>
            <p className="text-xl font-bold mb-1.5 dark:text-white">{formatNumber(kpiData.outOfStockProducts)}</p>
          </div>
          
          {/* KPI 4: Produits avec stock faible */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-all duration-300 hover:shadow-lg cursor-pointer relative overflow-hidden"
               onClick={() => setShowLowStockPanel(prev => !prev)}>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-full bg-yellow-500">
                <AlertTriangle size={18} className="text-white" />
              </div>
              <h3 className="font-medium text-gray-700 dark:text-white text-sm">Stock faible (&lt; 5)</h3>
            </div>
            <p className="text-xl font-bold mb-1.5 dark:text-white">{formatNumber(kpiData.lowStockProducts)}</p>
            {kpiData.lowStockProducts > 0 && (
              <div 
                className="absolute bottom-0 left-0 right-0 h-1 bg-amber-200 dark:bg-amber-700"
                style={{ 
                  width: `${Math.min(100, (kpiData.lowStockProducts / kpiData.totalProducts) * 100)}%`
                }}
              ></div>
            )}
          </div>
        </div>

        {/* Panneau des produits à faible stock */}
        {showLowStockPanel && lowStockProducts.length > 0 && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/30 p-4 border border-amber-200 dark:border-amber-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800 dark:text-gray-200 flex items-center">
                <AlertTriangle className="text-amber-500 mr-2" size={20} />
                Produits à réapprovisionner ({lowStockProducts.length})
              </h3>
              <button 
                onClick={() => setShowLowStockPanel(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-amber-50 dark:bg-amber-900/20">
                    <th className="px-4 py-2 text-left text-amber-800 dark:text-amber-300 font-medium">Produit</th>
                    <th className="px-4 py-2 text-center text-amber-800 dark:text-amber-300 font-medium">Statut</th>
                    <th className="px-4 py-2 text-right text-amber-800 dark:text-amber-300 font-medium">Stock actuel</th>
                    <th className="px-4 py-2 text-right text-amber-800 dark:text-amber-300 font-medium">Seuil d'alerte</th>
                    <th className="px-4 py-2 text-center text-amber-800 dark:text-amber-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map(product => (
                    <tr key={product.id} className="border-t border-amber-100 dark:border-amber-800/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                          <div>
                            <p className="font-medium text-gray-800 dark:text-gray-200">{product.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{product.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm ${
                          product.stock === 0
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200'
                        }`}>
                          {product.stock === 0 ? 'Rupture de stock' : 'Stock faible'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-red-600 dark:text-red-400">
                        {formatNumber(product.stock)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                        {formatNumber(product.lowStockThreshold)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => onShowMovementModal(product)}
                            className="p-1 bg-amber-50 dark:bg-amber-900/30 rounded-md text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-800/50"
                            title="Ajuster le stock"
                          >
                            <AlertTriangle size={18} />
                          </button>
                          <button
                            onClick={() => openEditModal(product)}
                            className="p-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-md text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-800/50"
                            title="Modifier le produit"
                          >
                            <Edit size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}



        {viewMode === 'grid' ? (
          <>
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border ${isSelectionMode && selectedProducts.includes(product.id) ? 'border-primary ring-2 ring-primary' : 'border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300 cursor-pointer'}`}
                    onClick={isSelectionMode ? () => handleToggleProductSelection(product.id) : () => setSelectedProductForDetails(product)}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      {isSelectionMode && (
                        <div className="absolute top-2 left-2">
                          {selectedProducts.includes(product.id) ? 
                            <CheckSquare size={22} className="text-gray-700" /> : 
                            <Square size={22} className="text-gray-400" />}
                        </div>
                      )}
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate text-gray-800 dark:text-gray-200">{product.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{product.category}</p>
                      </div>
                      {product.stock <= (product.lowStockThreshold || 0) && (
                        <div className="absolute top-2 right-2 flex items-center">
                          <div className="relative">
                            <div className="animate-ping absolute h-5 w-5 rounded-full theme-danger-light opacity-75"></div>
                            <AlertTriangle className="relative text-red-500 z-10" size={20} />
                          </div>
                          <span className="ml-1 text-xs font-medium text-red-600 dark:text-red-300 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full">
                            {product.stock === 0 ? "Rupture" : "Stock faible"}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Stock actuel</span>
                        <span className={`font-medium ${
                          product.stock <= (product.lowStockThreshold || 0)
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-gray-900 dark:text-gray-200'
                        }`}>
                          {formatNumber(product.stock)} unités
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Prix unitaire</span>
                        <span className={`text-gray-900 dark:text-gray-200`}>
                          {formatPrice(product.price)} €
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {!isSelectionMode && (
                          <>
                            <button
                              onClick={() => setSelectedProductForDetails(product)}
                              className="flex-1 min-w-[70px] flex items-center justify-center gap-1 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-xs sm:text-sm"
                            >
                              <Eye size={16} />
                              <span className="truncate">Voir les détails</span>
                            </button>
                            <button
                              onClick={() => onShowHistoryModal(product)}
                              className="flex-1 min-w-[70px] flex items-center justify-center gap-1 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-xs sm:text-sm"
                            >
                              <History size={16} />
                              <span className="truncate">Historique</span>
                            </button>
                          </>
                        )}
                        {hasPermission("edit_product") && (
                          <button
                            onClick={() => openEditModal(product)}
                            className="flex-1 min-w-[70px] flex items-center justify-center gap-1 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-xs sm:text-sm"
                          >
                            <Edit size={16} />
                            <span className="truncate">Modifier</span>
                          </button>
                        )}
                        {hasPermission("adjust_stock") && (
                          <button
                            onClick={() => onShowMovementModal(product)}
                            className="flex-1 min-w-[70px] flex items-center justify-center gap-1 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-xs sm:text-sm"
                          >
                            <ShoppingBag size={16} />
                            <span className="truncate">Ajuster</span>
                          </button>
                        )}
                        {hasPermission("delete_product") && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onDeleteProduct) onDeleteProduct(product.id);
                            }}
                            className="flex-1 min-w-[70px] flex items-center justify-center gap-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 py-2 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-xs sm:text-sm"
                          >
                            <Trash2 size={16} />
                            <span className="truncate">Supprimer</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-6 bg-white rounded-lg shadow-sm mx-auto my-8 text-center">
                <div className="text-gray-400 mb-4">
                  <Package className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-xl font-medium text-gray-800 mb-3">Aucun produit trouvé</h3>
                <p className="text-gray-500 max-w-md mb-6">
                  {searchQuery || selectedCategory 
                    ? "Aucun produit ne correspond à vos critères de recherche. Essayez de modifier vos filtres."
                    : "Vous n'avez pas encore ajouté de produits à votre inventaire. Commencez par ajouter votre premier produit."}
                </p>
                {!searchQuery && !selectedCategory && (
                  <button 
                    onClick={() => setShowAddModal(true)}
                    className="theme-primary text-white px-6 py-2.5 rounded-lg hover:opacity-80 transition-colors font-medium flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Ajouter un produit
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {filteredProducts.length > 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      {isSelectionMode && (
                        <th className="px-4 py-2 text-center w-10">
                          <div className="flex justify-center">
                            <button onClick={handleSelectAllProducts}>
                              {selectedProducts.length === filteredProducts.length ? 
                                <CheckSquare size={20} className="theme-primary-text" /> : 
                                <Square size={20} className="text-gray-400" />}
                            </button>
                          </div>
                        </th>
                      )}
                      <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Produit</th>
                      <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Catégorie</th>
                      <th className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">Prix</th>
                      <th className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">Stock</th>
                      <th className="px-4 py-2 text-right text-gray-700 dark:text-gray-300">Seuil</th>
                      <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-300">Fournisseur</th>
                      <th className="px-4 py-2 text-center text-gray-700 dark:text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(product => (
                      <tr 
                      key={product.id} 
                      className={`border-t dark:border-gray-700 ${isSelectionMode && selectedProducts.includes(product.id) ? 'bg-primary-light dark:bg-primary-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer'}`}
                      onClick={isSelectionMode ? () => handleToggleProductSelection(product.id) : () => setSelectedProductForDetails(product)}
                    >
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-3">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded"
                            />
                            <div>
                              <p className="font-medium text-gray-800 dark:text-gray-200">{product.name}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{product.category}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-gray-600 max-w-[120px]">
                          <div className="truncate">{product.category}</div>
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-gray-800 dark:text-gray-200">{formatPrice(product.price)} €</td>
                        <td className="px-4 py-2 text-right">
                          {product.stock <= (product.lowStockThreshold || 0) ? (
                            <div className="flex items-center justify-end">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm ${
                                product.stock === 0
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                              }`}>
                                {product.stock === 0 ? 'Rupture' : formatNumber(product.stock)}
                              </span>
                              <div className="relative ml-2">
                                <div className="animate-ping absolute h-3 w-3 rounded-full bg-red-400 opacity-75"></div>
                                <AlertTriangle className="relative text-red-500 dark:text-red-400 z-10" size={16} />
                              </div>
                            </div>
                          ) : (
                            <span className="font-medium text-gray-900 dark:text-gray-300">
                              {formatNumber(product.stock)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">
                          {formatNumber(product.lowStockThreshold)}
                        </td>
                        <td className="px-4 py-2 text-gray-600 dark:text-gray-400 max-w-[120px]">
                          <div className="truncate">{product.supplier || '-'}</div>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex justify-center relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(openDropdownId === product.id ? null : product.id);
                              }}
                              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                              title="Options"
                            >
                              <MoreVertical size={18} />
                            </button>
                            {/* Menu déroulant */}
                            {openDropdownId === product.id && (
                              <div 
                                ref={(el) => {
                                  if (el) {
                                    const rect = el.getBoundingClientRect();
                                    const windowHeight = window.innerHeight;
                                    
                                    // Si le menu dépasse le bas de l'écran
                                    if (rect.bottom > windowHeight - 50) {
                                      // Positionner vers le haut
                                      el.style.bottom = '2.5rem'; // 40px au-dessus du bouton
                                      el.style.top = 'auto';
                                    }
                                  }
                                }}
                                className="absolute right-0 mt-2 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50 w-48"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="py-1">
                                  {/* Voir détails */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedProductForDetails(product);
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                  >
                                    <Eye size={16} className="text-blue-500 dark:text-blue-400" />
                                    <span>Voir les détails</span>
                                  </button>
                                  
                                  {/* Historique */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onShowHistoryModal(product);
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                  >
                                    <History size={16} className="text-gray-600 dark:text-gray-400" />
                                    <span>Historique</span>
                                  </button>
                                  
                                  {/* Modifier */}
                                  {hasPermission("edit_product") && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openEditModal(product, e);
                                        setOpenDropdownId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                      <Edit size={16} className="text-indigo-500 dark:text-indigo-400" />
                                      <span>Modifier</span>
                                    </button>
                                  )}
                                  
                                  {/* Ajuster stock */}
                                  {hasPermission("adjust_stock") && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onShowMovementModal(product);
                                        setOpenDropdownId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                    >
                                      <ShoppingBag size={16} className="text-amber-500 dark:text-amber-400" />
                                      <span>Ajuster le stock</span>
                                    </button>
                                  )}
                                  
                                  {/* Supprimer */}
                                  {hasPermission("delete_product") && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setProductToDeleteData({ id: product.id, name: product.name });
                                        setShowDeleteConfirmation(true);
                                        setOpenDropdownId(null);
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                    >
                                      <Trash2 size={16} className="text-red-500 dark:text-red-400" />
                                      <span>Supprimer</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-6 bg-white rounded-lg shadow-sm mx-auto my-8 text-center">
                <div className="text-gray-400 mb-4">
                  <Package className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-xl font-medium text-gray-800 mb-3">Aucun produit trouvé</h3>
                <p className="text-gray-500 max-w-md mb-6">
                  {searchQuery || selectedCategory 
                    ? "Aucun produit ne correspond à vos critères de recherche. Essayez de modifier vos filtres."
                    : "Vous n'avez pas encore ajouté de produits à votre inventaire. Commencez par ajouter votre premier produit."}
                </p>
                {!searchQuery && !selectedCategory && (
                  <button 
                    onClick={() => setShowAddModal(true)}
                    className="theme-primary text-white px-6 py-2.5 rounded-lg hover:opacity-80 transition-colors font-medium flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Ajouter un produit
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Confirmer la suppression</h2>
            <p className="mb-6">Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setProductToDelete(null);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
              >
                Annuler
              </button>
              <button
                onClick={confirmDeleteProduct}
                className="px-4 py-2 bg-red-500 dark:bg-red-600 text-white rounded-lg hover:bg-red-600 dark:hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <NewProductForm
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddProduct}
          categories={categories}
          onAddCategory={onAddCategory}
          products={products}
        />
      )}

      {showImportModal && (
        <ImportProductsModal
          onClose={() => setShowImportModal(false)}
          onImport={handleImportProducts}
          existingCategories={categories}
        />
      )}
      
      {showCategoriesModal && (
        <CategoriesManager
          categories={categories}
          onAddCategory={onAddCategory}
          onDeleteCategory={onDeleteCategory}
          onUpdateCategory={onUpdateCategory}
          onClose={() => setShowCategoriesModal(false)}
          productsInCategories={productsInCategories}
        />
      )}
      
      {showEditModal && editingProduct && (
        <EditProductForm
          product={editingProduct}
          onClose={() => {
            setShowEditModal(false);
            setEditingProduct(null);
          }}
          onSubmit={handleEditProduct}
          categories={categories}
          onAddCategory={onAddCategory}
          products={products}
        />
      )}

      {/* Modal de détails du produit */}
      {selectedProductForDetails && (
        <ProductDetailsModal
          product={selectedProductForDetails}
          onClose={() => setSelectedProductForDetails(null)}
        />
      )}
      
      {/* Modal de confirmation de suppression */}
      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        title="Confirmation de suppression"
        message={productToDeleteData ? `Souhaitez-vous vraiment supprimer ${productToDeleteData.name} ?` : ""}
        confirmLabel="Suppression"
        cancelLabel="Annuler"
        onConfirm={() => {
          if (productToDeleteData && onDeleteProduct) {
            onDeleteProduct(productToDeleteData.id);
          }
          setShowDeleteConfirmation(false);
          setProductToDeleteData(null);
        }}
        onCancel={() => {
          setShowDeleteConfirmation(false);
          setProductToDeleteData(null);
        }}
      />
    </div>
  );
};

export default StockManager;