import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Product, SupplierOrder } from '../types';
import { 
  PackagePlus, X, Loader2, Search, 
  AlertCircle, ShoppingCart, Package, 
  ArrowRight, Info, Check, Filter,
  Edit
} from 'lucide-react';
import { addSupplierOrder, updateSupplierOrder, getSupplierOrderById } from '../services/supplierOrderService';

interface SupplierOrderModalProps {
  products: Product[];
  onClose: () => void;
  onOrderSubmit?: (order: SupplierOrder) => void;
  businessId: string;
  existingOrderId?: string; // ID de la commande à modifier (si mode édition)
  isEditMode?: boolean;    // Indique si on est en mode édition ou création
}

const SupplierOrderModal: React.FC<SupplierOrderModalProps> = ({ 
  products,
  onClose,
  onOrderSubmit,
  businessId,
  existingOrderId,
  isEditMode = false,
}) => {
  // États
  const [selectedProducts, setSelectedProducts] = useState<Record<string, number>>({});
  const [deliveryDate, setDeliveryDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'low-stock' | 'all'>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [existingOrder, setExistingOrder] = useState<SupplierOrder | null>(null);

  // Charger les données de la commande existante si on est en mode édition
  useEffect(() => {
    if (isEditMode && existingOrderId) {
      const fetchOrderData = async () => {
        try {
          setIsLoading(true);
          setError(null);
          
          console.log(`Chargement des détails de la commande: ${existingOrderId}`);
          const order = await getSupplierOrderById(existingOrderId);
          
          if (!order) {
            console.error(`Impossible de trouver la commande: ${existingOrderId}`);
            setError('Cette commande n\'existe pas ou a été supprimée.');
            return;
          }
          
          console.log('Commande chargée:', order);
          setExistingOrder(order);
          
          // Initialiser les produits sélectionnés
          const productMap: Record<string, number> = {};
          order.products.forEach(({ product, quantity }) => {
            productMap[product.id] = quantity;
          });
          setSelectedProducts(productMap);
          
          // Initialiser la date de livraison attendue
          if (order.expectedDeliveryDate) {
            setDeliveryDate(order.expectedDeliveryDate.toISOString().split('T')[0]);
          }
          
          // Passer à l'onglet "Tous les produits"
          setActiveTab('all');
          
        } catch (error) {
          console.error('Erreur lors du chargement de la commande:', error);
          setError('Une erreur est survenue lors du chargement des détails de la commande.');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchOrderData();
    }
  }, [isEditMode, existingOrderId]);

  // Mémoization des calculs
  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.stock <= (p.lowStockThreshold || 0));
  }, [products]);
  
  const suppliers = useMemo(() => {
    const uniqueSuppliers = new Set<string>();
    products.forEach(product => {
      if (product.supplier) {
        uniqueSuppliers.add(product.supplier);
      }
    });
    return Array.from(uniqueSuppliers).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    let productsToFilter = activeTab === 'low-stock' ? lowStockProducts : products;
    
    if (supplierFilter !== 'all') {
      productsToFilter = productsToFilter.filter(p => p.supplier === supplierFilter);
    }
      
    if (!query) return productsToFilter;
    
    return productsToFilter.filter(product => 
      product.name.toLowerCase().includes(query) || 
      (product.category?.toLowerCase().includes(query) ?? false) ||
      (product.supplier?.toLowerCase().includes(query) ?? false)
    );
  }, [products, lowStockProducts, searchQuery, activeTab, supplierFilter]);

  // Handlers
  const handleQuantityChange = useCallback((productId: string, quantity: number) => {
    setSelectedProducts(prev => ({
      ...prev,
      [productId]: Math.max(0, quantity),
    }));
  }, []);

  const selectAllLowStockProducts = useCallback(() => {
    const newSelectedProducts = { ...selectedProducts };
    
    lowStockProducts.forEach(product => {
      const recommendedQuantity = Math.max(
        (product.lowStockThreshold || 10) - product.stock,
        1
      );
      newSelectedProducts[product.id] = recommendedQuantity;
    });
    
    setSelectedProducts(newSelectedProducts);
  }, [lowStockProducts, selectedProducts]);

  const handleSubmit = async () => {
    console.log('=== Début de la soumission du formulaire de commande ===');
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);
      console.log(`Mode: ${isEditMode ? 'Édition' : 'Création'}`);
      
      // Vérifier si des produits sont sélectionnés
      console.log('Produits sélectionnés:', selectedProducts);
      const orderProducts = Object.entries(selectedProducts)
        .filter(([_, quantity]) => quantity > 0)
        .map(([productId, quantity]) => {
          console.log(`Traitement du produit: ${productId} avec quantité: ${quantity}`);
          const product = products.find(p => p.id === productId);
          if (!product) {
            console.error(`Produit non trouvé dans la liste des produits: ${productId}`);
            throw new Error(`Produit non trouvé: ${productId}`);
          }
          console.log(`Produit trouvé: ${product.name}`);
          return { product, quantity };
        });

      if (orderProducts.length === 0) {
        console.log('Aucun produit sélectionné');
        setError('Veuillez sélectionner au moins un produit avec une quantité supérieure à zéro.');
        setIsSubmitting(false);
        return;
      }
      
      // Préparer la commande
      console.log('Préparation de la commande');
      const totalAmount = orderProducts.reduce(
        (sum, { product, quantity }) => sum + product.price * quantity,
        0
      );
      
      const orderData = {
        businessId,
        products: orderProducts,
        status: existingOrder?.status || 'pending',
        orderDate: existingOrder?.orderDate || new Date(),
        expectedDeliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
        totalAmount,
      };
      
      console.log('Données de la commande:', orderData);
      
      let savedOrder: SupplierOrder;
      
      if (isEditMode && existingOrderId) {
        console.log(`Mise à jour de la commande existante: ${existingOrderId}`);
        const updatedOrder = await updateSupplierOrder(existingOrderId, orderData);
        
        if (!updatedOrder) {
          throw new Error('Impossible de mettre à jour la commande');
        }
        
        savedOrder = updatedOrder;
        console.log('Commande mise à jour avec succès:', savedOrder);
        setSuccessMessage('Commande mise à jour avec succès !');
      } else {
        console.log('Création d\'une nouvelle commande');
        savedOrder = await addSupplierOrder(orderData);
        console.log('Commande créée avec succès:', savedOrder);
        setSuccessMessage('Commande créée avec succès !');
      }
      
      if (onOrderSubmit) {
        console.log('Appel du callback onOrderSubmit');
        onOrderSubmit(savedOrder);
      }
      
      if (!isEditMode) {
        // Réinitialiser le formulaire en cas de création réussie
        setSelectedProducts({});
      }
      
      console.log('=== Fin de la soumission de la commande ===');
    } catch (error) {
      console.error(`Erreur lors de la ${isEditMode ? 'modification' : 'création'} de la commande:`, error);
      
      // Gérer différents types d'erreurs
      if (error instanceof Error) {
        setError(`Erreur: ${error.message}`);
      } else {
        setError(`Une erreur inattendue est survenue lors de la ${isEditMode ? 'modification' : 'création'} de la commande.`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };  

  // Calculs dérivés
  const selectedProductsCount = useMemo(() => 
    Object.values(selectedProducts).filter(q => q > 0).length,
    [selectedProducts]
  );
  
  const orderTotal = useMemo(() => 
    Object.entries(selectedProducts).reduce((total, [productId, quantity]) => {
      if (quantity <= 0) return total;
      const product = products.find(p => p.id === productId);
      return total + (product?.price || 0) * quantity;
    }, 0),
    [selectedProducts, products]
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gray-100 border-b sticky top-0 z-20">
        <div className="container mx-auto flex justify-between items-center p-4">
          <h2 className="text-xl font-bold flex items-center">
            {isEditMode ? (
              <>
                <Edit className="text-primary mr-2" /> 
                Modifier la Commande Fournisseur
              </>
            ) : (
              <>
                <PackagePlus className="text-primary mr-2" /> 
                Nouvelle Commande Fournisseur
              </>
            )}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 focus:outline-none"
            aria-label="Fermer la modal"
          >
            <X size={24} />
          </button>
        </div>
      </div>  
        {/* Body */}
        <div className="flex-1 overflow-auto p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Colonne de gauche - Détails de la commande */}
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                <Package size={18} className="theme-primary-text" />
                <span>Détails de la commande</span>
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="deliveryDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Date de livraison souhaitée
                  </label>
                  <div className="relative">
                    <input
                      id="deliveryDate"
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                    <Info size={12} />
                    <span>Date à laquelle vous attendez la livraison</span>
                  </p>
                </div>
                
                <div className="pt-3 border-t">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Produits sélectionnés:</span>
                    <span className="font-medium">{selectedProductsCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total estimé:</span>
                    <span className="font-semibold text-green-600">
                      {orderTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
          </div>
          
          {/* Colonne de droite - Produits */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={18} className="theme-primary-text" />
                  <span>Sélection des produits</span>
                </div>
                {activeTab === 'low-stock' && lowStockProducts.length > 0 && (
                  <button 
                    onClick={selectAllLowStockProducts}
                    className="text-xs theme-primary-text hover:underline flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100"
                    aria-label="Sélectionner tous les produits en stock faible"
                  >
                    <Check size={14} />
                    <span>Sélectionner tous les produits en stock faible</span>
                  </button>
                )}
              </h3>
              
              {/* Filtres et recherche */}
              <div className="flex flex-col md:flex-row gap-3 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Rechercher un produit..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="border rounded-lg pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      aria-label="Rechercher un produit"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <div className="relative">
                    <div className="flex items-center border rounded-lg overflow-hidden">
                      <button
                        className={`px-3 py-2 text-sm font-medium ${activeTab === 'low-stock' ? 'theme-primary-bg text-white' : 'bg-gray-100 text-gray-700'}`}
                        onClick={() => setActiveTab('low-stock')}
                        aria-label="Voir les produits en stock faible"
                      >
                        Stock faible ({lowStockProducts.length})
                      </button>
                      <button
                        className={`px-3 py-2 text-sm font-medium ${activeTab === 'all' ? 'theme-primary-bg text-white' : 'bg-gray-100 text-gray-700'}`}
                        onClick={() => setActiveTab('all')}
                        aria-label="Voir tous les produits"
                      >
                        Tous ({products.length})
                      </button>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="flex items-center border rounded-lg overflow-hidden">
                      <div className="px-2 py-2 bg-gray-100 text-gray-500 flex items-center">
                        <Filter size={14} />
                      </div>
                      <select
                        value={supplierFilter}
                        onChange={(e) => setSupplierFilter(e.target.value)}
                        className="px-2 py-2 text-sm focus:outline-none border-0"
                        aria-label="Filtrer par fournisseur"
                      >
                        <option value="all">Tous les fournisseurs</option>
                        {suppliers.map(supplier => (
                          <option key={supplier} value={supplier}>{supplier}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Liste des produits */}
              <div className="overflow-y-auto max-h-[40vh] border rounded-lg">
                {filteredProducts.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    Aucun produit ne correspond à vos critères
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Produit
                        </th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fournisseur
                        </th>
                        <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock
                        </th>
                        <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Prix
                        </th>
                        <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantité
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredProducts.map(product => {
                        const isLowStock = product.stock <= (product.lowStockThreshold || 0);
                        const recommendedQuantity = isLowStock 
                          ? Math.max((product.lowStockThreshold || 10) - product.stock, 1)
                          : 0;
                          
                        return (
                          <tr 
                            key={product.id} 
                            className={`hover:bg-gray-50 ${isLowStock ? 'bg-red-50' : ''}`}
                          >
                            <td className="px-3 py-2 whitespace-nowrap">
                              <div className="flex items-start">
                                <div className="ml-2">
                                  <div className="text-sm font-medium text-gray-900">
                                    {product.name}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {product.category}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{product.supplier || 'Non spécifié'}</div>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-right">
                              <div className={`text-sm ${isLowStock ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                                {product.stock} {isLowStock && <span>⚠️</span>}
                              </div>
                              {isLowStock && (
                                <div className="text-xs text-red-500">
                                  Seuil: {product.lowStockThreshold}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-right">
                              <div className="text-sm text-gray-900 font-medium">
                                {(product.price ?? 0).toFixed(2)} €
                              </div>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-right">
                              <div className="flex flex-col items-end">
                                <div className="flex items-center">
                                  <input
                                    type="number"
                                    min="0"
                                    value={selectedProducts[product.id] || 0}
                                    onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 0)}
                                    className="w-20 border rounded-lg px-2 py-1.5 text-right focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    aria-label={`Quantité pour ${product.name}`}
                                  />
                                  <span className="text-sm text-gray-500 w-12 ml-1">unités</span>
                                </div>
                                {isLowStock && recommendedQuantity > 0 && (
                                  <button 
                                    onClick={() => handleQuantityChange(product.id, recommendedQuantity)}
                                    className="text-xs theme-primary-text hover:theme-primary-text-dark mt-1 flex items-center gap-1"
                                    aria-label={`Suggérer quantité pour ${product.name}`}
                                  >
                                    <ArrowRight size={10} />
                                    Suggérer ({recommendedQuantity})
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* État de chargement */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-20">
            <div className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col items-center gap-4 shadow-lg max-w-md w-full mx-4">
              <Loader2 size={48} className="text-primary animate-spin" />
              <p className="text-gray-700">Chargement des détails de la commande...</p>
            </div>
          </div>
        )}

        {/* Message de succès */}
        {successMessage && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 flex flex-col items-center gap-4 shadow-lg max-w-md w-full mx-4">
              <div className="bg-green-100 rounded-full p-3">
                <Check size={32} className="text-green-600" />
              </div>
              <div className="text-center">
                <h3 className="font-medium text-green-800 text-xl">{successMessage}</h3>
                <p className="text-sm text-green-600 mt-1">
                  {isEditMode 
                    ? "Votre commande a été mise à jour avec succès" 
                    : "Votre commande a été enregistrée avec succès"}
                </p>
              </div>
              <button 
                onClick={onClose}
                className="mt-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                aria-label="Fermer la modal de succès"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
        
        {/* Footer */}
        <div className="p-4 border-t theme-primary-bg-light flex flex-col md:flex-row items-center justify-between gap-4 sticky bottom-0 bg-white shadow-md z-10">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className={`px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-100 transition-colors font-medium flex items-center gap-1 text-sm ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label="Annuler la commande"
            >
              <X size={16} />
              Annuler
            </button>
            
            <div className="text-sm text-gray-700">
              {selectedProductsCount > 0 ? (
                <span><b>{selectedProductsCount}</b> produit{selectedProductsCount > 1 ? 's' : ''} sélectionné{selectedProductsCount > 1 ? 's' : ''} • <b>{orderTotal.toFixed(2)} €</b></span>
              ) : (
                <span>Aucun produit sélectionné</span>
              )}
            </div>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedProductsCount === 0}
            className={`w-full md:w-auto bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 transition-colors text-base font-medium ${(isSubmitting || selectedProductsCount === 0) ? 'opacity-70 cursor-not-allowed' : 'shadow-md'}`}
            aria-label="Confirmer la commande"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <>
                {isEditMode ? (
                  <>
                    <Edit size={18} />
                    <span>Mettre à jour la commande</span>
                  </>
                ) : (
                  <>
                    <PackagePlus size={18} />
                    <span>Confirmer la commande</span>
                  </>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupplierOrderModal;