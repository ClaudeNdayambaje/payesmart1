import React, { useState, useEffect, useMemo } from 'react';
import { Product, Promotion } from '../types';
import { updateProductPromotion, getExpiringPromotions } from '../services/promotionService';
import { getCurrentBusinessId } from '../services/businessService';
import { Plus, X, List, Percent, Tag, Clock, BarChart, Grid } from 'lucide-react';
import { format, isValid } from 'date-fns';

interface PromotionsManagerProps {
  products: Product[];
  onUpdateProduct: (productId: string, promotion: Promotion | undefined) => void;
  hasPermission: (permission: string) => boolean;
}

const PromotionsManager: React.FC<PromotionsManagerProps> = ({
  products,
  onUpdateProduct,
  hasPermission
}) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddPromotion, setShowAddPromotion] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [newPromotion, setNewPromotion] = useState<Partial<Promotion>>({
    type: 'percentage',
    value: 0,
    startDate: new Date(),
    endDate: new Date(),
    description: '',
    businessId: '',
  });
  
  // Récupérer le businessId au chargement du composant
  useEffect(() => {
    const fetchBusinessId = async () => {
      try {
        const businessId = await getCurrentBusinessId();
        console.log('BusinessId récupéré pour les promotions:', businessId);
        setNewPromotion(prev => ({ ...prev, businessId }));
      } catch (error) {
        console.error('Erreur lors de la récupération du businessId:', error);
      }
    };
    
    fetchBusinessId();
  }, []);

  // Force la vue en mode grille au chargement du composant
  useEffect(() => {
    // Supprime toute préférence stockée précédemment
    localStorage.removeItem('promotionsViewMode');
    // Force le mode grille
    setViewMode('grid');
  }, []);

  // Ajouter un état pour le produit sélectionné dans le modal d'ajout
  const [selectedProductForModal, setSelectedProductForModal] = useState<string>('');
  
  // Synchroniser selectedProduct avec selectedProductForModal
  useEffect(() => {
    if (selectedProduct) {
      // Si un produit est sélectionné, mettre à jour la valeur dans le modal
      setSelectedProductForModal(selectedProduct.id);
      console.log('Produit présélectionné dans le modal:', selectedProduct.name);
    }
  }, [selectedProduct]);

  // Filtrer et trier les produits
  const filteredProducts = useMemo(() => {
    // D'abord, filtrer selon la recherche
    let result = products.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // Si l'utilisateur est un caissier, ne montrer que les produits avec des promotions actives
    if (!hasPermission("promotions.add")) {
      const now = new Date();
      result = result.filter(product => 
        product.promotion && 
        product.promotion.startDate <= now && 
        product.promotion.endDate >= now
      );
    }
    
    return result;
  }, [products, searchQuery, hasPermission]);

  const [expiringPromotions, setExpiringPromotions] = useState<{ product: Product, promotion: Promotion, daysRemaining: number }[]>([]);

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

  // Fonction sécurisée pour formater les dates
  const formatDateSafely = (dateInput: any): string => {
    try {
      // Vérifier si la date est déjà un objet Date
      if (dateInput instanceof Date) {
        return isValid(dateInput) ? format(dateInput, 'dd/MM/yyyy') : 'Date invalide';
      }

      // Essayer de convertir en Date
      const date = new Date(dateInput);
      return isValid(date) ? format(date, 'dd/MM/yyyy') : 'Date invalide';
    } catch (error) {
      console.error('Erreur lors du formatage de la date:', error, dateInput);
      return 'Date invalide';
    }
  };

  // Calculer les KPI
  const kpiData = useMemo(() => {
    // Nombre total de produits avec promotions
    const productsWithPromotion = products.filter(product => product.promotion).length;
    
    // Pourcentage de produits en promotion
    const percentageWithPromotion = products.length > 0 
      ? (productsWithPromotion / products.length) * 100 
      : 0;
    
    // Nombre de promotions actives
    const activePromotions = products.filter(product => 
      product.promotion && 
      product.promotion.startDate <= new Date() && 
      product.promotion.endDate >= new Date()
    ).length;
    
    // Nombre de promotions qui expirent bientôt (dans les 7 jours)
    const soonExpiringPromotions = expiringPromotions.length;
    
    // Répartition par type de promotion
    const promotionTypeCount = {
      percentage: products.filter(product => product.promotion?.type === 'percentage').length,
      fixed: products.filter(product => product.promotion?.type === 'fixed').length,
      buyXgetY: products.filter(product => product.promotion?.type === 'buyXgetY').length
    };
    
    return {
      productsWithPromotion,
      percentageWithPromotion,
      activePromotions,
      soonExpiringPromotions,
      promotionTypeCount
    };
  }, [products, expiringPromotions]);

  // Charger les promotions qui expirent bientôt
  useEffect(() => {
    const loadExpiringPromotions = async () => {
      try {
        // Suppression de setLoading(true) pour éliminer l'effet visuel
        console.log('Chargement des promotions expirant bientôt...');
        const expiring = await getExpiringPromotions();
        console.log('Promotions expirant bientôt reçues:', expiring);
        setExpiringPromotions(expiring);
      } catch (error) {
        console.error('Erreur lors du chargement des promotions qui expirent bientôt:', error);
        // En cas d'erreur, définir un tableau vide pour éviter les erreurs d'affichage
        setExpiringPromotions([]); 
      }
      // Suppression du finally avec setLoading(false)
    };

    loadExpiringPromotions();
  }, [products]);

  const handleAddPromotion = async () => {
    try {
      console.log('Tentative d\'ajout de promotion:', newPromotion);
      
      // Utiliser le produit spécifiquement sélectionné dans le modal
      const productId = selectedProductForModal;
      
      if (!productId) {
        console.error('Aucun produit sélectionné');
        alert('Veuillez d\'abord sélectionner un produit');
        return;
      }
      
      // Trouver le produit correspondant à l'ID sélectionné
      const productToUpdate = products.find(p => p.id === productId);
      if (!productToUpdate) {
        console.error('Produit introuvable avec l\'ID:', productId);
        alert('Produit introuvable. Veuillez réessayer.');
        return;
      }
      
      // Mettre à jour la référence du produit sélectionné
      setSelectedProduct(productToUpdate);
      console.log('Produit sélectionné pour la promotion:', productToUpdate.name);
    
      if (!newPromotion.businessId) {
        console.error('BusinessId manquant');
        const businessId = await getCurrentBusinessId().catch(err => {
          console.error('Erreur lors de la récupération du businessId:', err);
          return 'business1'; // Valeur par défaut
        });
        newPromotion.businessId = businessId;
        console.log('BusinessId récupéré:', businessId);
      }
    
      console.log('Vérification de la promotion:', newPromotion);
      
      // Vérification en fonction du type de promotion
      if (newPromotion.type === 'buyXgetY') {
        // Pour les promotions "Achetez X + Y gratuit", vérifier buyQuantity et getFreeQuantity
        const buyQuantity = newPromotion.buyQuantity ? parseInt(String(newPromotion.buyQuantity), 10) : 0;
        const getFreeQuantity = newPromotion.getFreeQuantity ? parseInt(String(newPromotion.getFreeQuantity), 10) : 0;
        
        if (isNaN(buyQuantity) || buyQuantity <= 0 || isNaN(getFreeQuantity) || getFreeQuantity <= 0) {
          console.error('Quantités non valides pour promotion Achetez X + Y gratuit:', 
            buyQuantity, getFreeQuantity);
          alert('Veuillez entrer des quantités valides supérieures à zéro pour la promotion');
          return;
        }
        
        newPromotion.buyQuantity = buyQuantity;
        newPromotion.getFreeQuantity = getFreeQuantity;
        console.log('Promotion buyXgetY valide:', buyQuantity, getFreeQuantity);
        
        // Pour les promotions buyXgetY, on initialise value à 0
        newPromotion.value = 0;
      } else {
        // Pour les autres types de promotion (pourcentage, montant fixe), vérifier la valeur
        const value = newPromotion.value !== undefined ? 
          parseFloat(String(newPromotion.value).replace(',', '.')) : 0;
        
        console.log('Nouvelle valeur de promotion (raw):', newPromotion.value);
        console.log('Nouvelle valeur de promotion (parsed):', value);
        
        if (isNaN(value)) {
          console.error('Valeur de promotion non valide:', newPromotion.value);
          alert('Veuillez entrer une valeur numérique valide pour la promotion');
          return;
        }
        
        console.log('Vérification de la valeur:', value, typeof value);
        
        // Limiter la valeur selon le type
        if (newPromotion.type === 'percentage' && (value <= 0 || value > 100)) {
          console.error('Pourcentage non valide:', value);
          alert('Le pourcentage doit être compris entre 0 et 100');
          return;
        } else if (newPromotion.type === 'fixed' && value <= 0) {
          console.error('Montant fixe non valide:', value);
          alert('Le montant de la remise doit être supérieur à zéro');
          return;
        }
        
        console.log('Valeur de promotion validée:', value);
        newPromotion.value = value;
      }
      
      // Vérifier les dates
      if (!newPromotion.startDate || !newPromotion.endDate || 
          !isValid(new Date(newPromotion.startDate)) || !isValid(new Date(newPromotion.endDate))) {
        console.error('Dates non valides:', newPromotion.startDate, newPromotion.endDate);
        alert('Veuillez entrer des dates valides');
        return;
      }
      
      const startDate = new Date(newPromotion.startDate);
      const endDate = new Date(newPromotion.endDate);
      
      console.log('Ajout d\'une promotion:');
      console.log('- Date de début:', startDate);
      console.log('- Date de fin:', endDate);
      
      const promotion: Promotion = {
        id: crypto.randomUUID(),
        type: newPromotion.type as 'percentage' | 'fixed' | 'buyXgetY',
        value: newPromotion.value || 0,
        startDate: newPromotion.startDate || new Date(),
        endDate: newPromotion.endDate || new Date(),
        description: newPromotion.description || '',
        buyQuantity: newPromotion.buyQuantity,
        getFreeQuantity: newPromotion.getFreeQuantity,
        businessId: newPromotion.businessId || '', // Utilisation de l'opérateur || pour éviter undefined
      };

      // Mettre à jour dans Firebase - Utiliser directement productToUpdate
      console.log('Envoi de la promotion à Firebase:', promotion);
      const success = await updateProductPromotion(productToUpdate.id, promotion);
      console.log('Résultat de la mise à jour Firebase:', success);
      
      if (success) {
        // Mettre à jour l'état local via le callback parent
        onUpdateProduct(productToUpdate.id, promotion);
        console.log('Promotion ajoutée avec succès au produit:', productToUpdate.name);
        
        // Afficher le message de confirmation
        setConfirmationMessage(`Promotion ajoutée avec succès à ${productToUpdate.name}`);
        setShowConfirmation(true);
        
        // Fermer automatiquement le message après 3 secondes
        setTimeout(() => {
          setShowConfirmation(false);
        }, 3000);
      }
      
      // IMPORTANT: Fermer toujours le modal après tentative d'ajout
      setShowAddPromotion(false);
      // Réinitialiser selectedProduct pour s'assurer que le modal se ferme complètement
      setSelectedProduct(null);
      
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la promotion:', error);
      alert('Une erreur est survenue lors de l\'ajout de la promotion');
      // Fermer aussi le modal en cas d'erreur
      setShowAddPromotion(false);
      // Réinitialiser également selectedProduct en cas d'erreur
      setSelectedProduct(null);
    } finally {
      // Réinitialiser les champs du formulaire dans tous les cas
      getCurrentBusinessId().then(businessId => {
        setNewPromotion({
          type: 'percentage',
          value: 0,
          startDate: new Date(),
          endDate: new Date(),
          description: '',
          businessId: businessId,
        });
        // Réinitialiser le produit sélectionné dans le modal
        setSelectedProductForModal('');
      }).catch(error => {
        console.error('Erreur lors de la récupération du businessId:', error);
        setNewPromotion({
          type: 'percentage',
          value: 0,
          startDate: new Date(),
          endDate: new Date(),
          description: '',
          businessId: 'business1', // Valeur par défaut en cas d'erreur
        });
        // Réinitialiser le produit sélectionné dans le modal
        setSelectedProductForModal('');
      });
    }
  };
  

  const handleRemovePromotion = async (productId: string) => {
    try {
      const success = await updateProductPromotion(productId, undefined);
      if (success) {
        onUpdateProduct(productId, undefined);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la promotion:', error);
    }
  };

  const formatPromotionValue = (promotion: Promotion) => {
    switch (promotion.type) {
      case 'percentage':
        return `${promotion.value}% de réduction`;
      case 'fixed':
        return `${promotion.value.toFixed(2)}€ de réduction`;
      case 'buyXgetY':
        return `Achetez ${promotion.buyQuantity} + ${promotion.getFreeQuantity} gratuit`;
      default:
        return '';
    }
  };

  return (
    <div className="flex-1 p-6 overflow-auto">
      {/* Message de confirmation - Style amélioré */}
      {showConfirmation && (
        <div 
          className="fixed top-4 right-4 bg-green-600 text-white font-bold px-6 py-4 rounded-lg shadow-2xl z-50 flex items-center gap-3"
          style={{
            animation: 'fadeInOut 3s ease-in-out',
            opacity: 1
          }}
        >
          <svg className="w-6 h-6" fill="white" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-lg">{confirmationMessage}</span>
        </div>
      )}

      <div className="max-w-[2000px] mx-auto">
        {/* Indicateur de chargement supprimé */}
        
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gestion des promotions</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 dark:bg-gray-900 dark:text-white dark:placeholder-gray-400"
              />
            </div>
            <div className="flex gap-2 bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-800 shadow'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
                }`}
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-800 shadow'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
                }`}
              >
                <List size={20} />
              </button>
            </div>
            {hasPermission("promotions.create") && (
              <button
                onClick={() => setShowAddPromotion(true)}
                className="theme-primary text-white px-4 py-2 rounded-lg hover:opacity-80 flex items-center gap-2 dark:bg-blue-700 dark:hover:bg-blue-600"
              >
                <Plus size={20} />
                Nouvelle promotion
              </button>
            )}
          </div>
        </div>

        {/* KPI - Placés juste en dessous du titre */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* KPI 1: Nombre de produits en promotion */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-full bg-indigo-600">
                <Tag size={18} className="text-white" />
              </div>
              <h3 className="font-medium text-gray-700 dark:text-white text-sm">Produits en promotion</h3>
            </div>
            <p className="text-xl font-bold mb-1.5 dark:text-white">{formatNumber(kpiData.productsWithPromotion)}</p>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">{kpiData.percentageWithPromotion.toFixed(1)}% du catalogue</span>
            </div>
          </div>

          {/* KPI 2: Promotions actives */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-full bg-green-600">
                <Percent size={18} className="text-white" />
              </div>
              <h3 className="font-medium text-gray-700 dark:text-white text-sm">Promotions actives</h3>
            </div>
            <p className="text-xl font-bold mb-1.5 dark:text-white">{formatNumber(kpiData.activePromotions)}</p>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">En cours actuellement</span>
            </div>
          </div>

          {/* KPI 3: Promotions expirant bientôt */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-full bg-amber-500">
                <Clock size={18} className="text-white" />
              </div>
              <h3 className="font-medium text-gray-700 dark:text-white text-sm">Expirent bientôt</h3>
            </div>
            <p className="text-xl font-bold mb-1.5 dark:text-white">{formatNumber(kpiData.soonExpiringPromotions)}</p>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">Dans les 7 prochains jours</span>
            </div>
          </div>

          {/* KPI 4: Répartition par type */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-full bg-blue-600">
                <BarChart size={18} className="text-white" />
              </div>
              <h3 className="font-medium text-gray-700 dark:text-white text-sm">Type le plus utilisé</h3>
            </div>
            <p className="text-xl font-bold mb-1.5 dark:text-white">
              {Object.entries(kpiData.promotionTypeCount).sort((a, b) => b[1] - a[1])[0][0] === 'percentage' 
                ? 'Pourcentage' 
                : Object.entries(kpiData.promotionTypeCount).sort((a, b) => b[1] - a[1])[0][0] === 'fixed' 
                  ? 'Montant fixe' 
                  : 'Achetez X + Y gratuit'}
            </p>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatNumber(Object.entries(kpiData.promotionTypeCount).sort((a, b) => b[1] - a[1])[0][1])} promotions
              </span>
            </div>
          </div>
        </div>

        {/* Affichage selon le mode de vue */}
        {viewMode === 'list' ? (
          <>
            {filteredProducts.length > 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="px-4 py-2 text-left text-gray-700 dark:text-gray-200">Produit</th>
                      <th className="px-4 py-2 text-right text-gray-700 dark:text-gray-200">Prix</th>
                      <th className="px-4 py-2 text-gray-700 dark:text-gray-200">Promotion</th>
                      <th className="px-4 py-2 text-gray-700 dark:text-gray-200">Période</th>
                      <th className="px-4 py-2 text-center text-gray-700 dark:text-gray-200">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-3">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-10 h-10 object-cover rounded"
                            />
                            <span className="font-medium dark:text-white">{product.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right font-medium dark:text-gray-200">
                          {formatPrice(product.price)} €
                        </td>
                        <td className="px-4 py-2">
                          {product.promotion ? (
                            <div className="flex items-center">
                              <span
                                className={`px-2 py-1 rounded text-xs mr-2 ${
                                  product.promotion.startDate <= new Date() && product.promotion.endDate >= new Date()
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {product.promotion.startDate <= new Date() && product.promotion.endDate >= new Date() ? 'Active' : 'Inactive'}
                              </span>
                              <span className="font-medium dark:text-gray-200">
                                {formatPromotionValue(product.promotion)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">Aucune</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {product.promotion ? (
                            <span className="text-sm dark:text-gray-300">
                              {formatDateSafely(product.promotion.startDate)} -{' '}
                              {formatDateSafely(product.promotion.endDate)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {product.promotion ? (
                            hasPermission("promotions.delete") ? (
                              <button
                                onClick={() => handleRemovePromotion(product.id)}
                                className="p-1 theme-error-text hover:opacity-80"
                                title="Supprimer la promotion"
                              >
                                <X size={18} />
                              </button>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )
                          ) : (
                            hasPermission("promotions.add") && (
                              <button
                                onClick={() => setSelectedProduct(product)}
                                className="p-1 theme-primary-text hover:opacity-80"
                                title="Ajouter une promotion"
                              >
                                <Plus size={18} />
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mx-auto my-8 text-center">
                <div className="text-gray-400 mb-4">
                  <Percent className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-xl font-medium text-gray-800 mb-3">Aucune promotion trouvée</h3>
                <p className="text-gray-500 max-w-md mb-6">
                  {searchQuery 
                    ? "Aucun produit ne correspond à vos critères de recherche. Essayez de modifier votre recherche."
                    : "Vous n'avez pas encore créé de promotions. Commencez par ajouter une promotion à un produit."}
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-300">
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div>
                          <h3 className="font-medium text-gray-800 dark:text-white">{product.name}</h3>
                          <p className="text-gray-600 dark:text-gray-300 text-sm">{formatPrice(product.price)} €</p>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Promotion:</p>
                        {product.promotion ? (
                          <div>
                            <div className="flex items-center mb-1">
                              <span
                                className={`px-2 py-1 rounded text-xs mr-2 ${
                                  product.promotion.startDate <= new Date() && product.promotion.endDate >= new Date()
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {product.promotion.startDate <= new Date() && product.promotion.endDate >= new Date() ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <p className="font-medium text-gray-800 dark:text-white">{formatPromotionValue(product.promotion)}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {formatDateSafely(product.promotion.startDate)} -{' '}
                              {formatDateSafely(product.promotion.endDate)}
                            </p>
                          </div>
                        ) : (
                          <p className="text-gray-400 dark:text-gray-500">Aucune promotion</p>
                        )}
                      </div>
                      
                      <div className="border-t dark:border-gray-700 pt-3 flex justify-end">
                        {product.promotion ? (
                          hasPermission("promotions.delete") ? (
                            <button
                              onClick={() => handleRemovePromotion(product.id)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
                            >
                              <X size={16} />
                              <span>Supprimer</span>
                            </button>
                          ) : null
                        ) : (
                          hasPermission("promotions.add") && (
                            <button
                              onClick={() => setSelectedProduct(product)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
                            >
                              <Plus size={16} />
                              <span>Ajouter</span>
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mx-auto my-8 text-center">
                <div className="text-gray-400 mb-4">
                  <Percent className="h-16 w-16 mx-auto" />
                </div>
                <h3 className="text-xl font-medium text-gray-800 mb-3">Aucune promotion trouvée</h3>
                <p className="text-gray-500 max-w-md mb-6">
                  {searchQuery 
                    ? "Aucun produit ne correspond à vos critères de recherche. Essayez de modifier votre recherche."
                    : "Vous n'avez pas encore créé de promotions. Commencez par ajouter une promotion à un produit."}
                </p>
              </div>
            )}
          </>
        )}
        
        {/* Promotion Modal */}
        {(showAddPromotion || selectedProduct) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                <h2 className="text-xl font-semibold dark:text-white">
                  {selectedProduct ? `Promotion pour ${selectedProduct.name}` : 'Nouvelle promotion'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddPromotion(false);
                    setSelectedProduct(null);
                  }}
                  className="text-gray-500 dark:text-gray-400 hover:opacity-80 transition-opacity"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Produit</label>
                  <select
                    className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                    value={selectedProductForModal}
                    onChange={(e) => setSelectedProductForModal(e.target.value)}
                    required
                  >
                    <option value="">-- Sélectionnez un produit --</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.price.toFixed(2)}€)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type de promotion</label>
                  <select
                    className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                    value={newPromotion.type}
                    onChange={(e) => setNewPromotion({ ...newPromotion, type: e.target.value as any })}
                  >
                    <option value="percentage">Pourcentage</option>
                    <option value="fixed">Montant fixe</option>
                    <option value="buyXgetY">Achetez X + Y gratuit</option>
                  </select>
                </div>

                {newPromotion.type === 'buyXgetY' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Quantité à acheter
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newPromotion.buyQuantity || ''}
                        onChange={(e) =>
                          setNewPromotion({ ...newPromotion, buyQuantity: parseInt(e.target.value) })
                        }
                        className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Quantité offerte
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newPromotion.getFreeQuantity || ''}
                        onChange={(e) =>
                          setNewPromotion({ ...newPromotion, getFreeQuantity: parseInt(e.target.value) })
                        }
                        className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {newPromotion.type === 'percentage' ? 'Pourcentage' : 'Montant'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step={newPromotion.type === 'percentage' ? '1' : '0.01'}
                      value={newPromotion.value || ''}
                      onChange={(e) => {
                        // Si la chaîne est vide, on utilise undefined au lieu de 0 pour éviter
                        // que la valeur 0 soit considérée comme valide
                        const rawValue = e.target.value;
                        const value = rawValue === '' ? undefined : parseFloat(rawValue);
                        console.log('Nouvelle valeur de promotion (raw):', rawValue);
                        console.log('Nouvelle valeur de promotion (parsed):', value);
                        setNewPromotion({ ...newPromotion, value: value });
                      }}
                      className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                      placeholder={newPromotion.type === 'percentage' ? 'ex: 10' : 'ex: 5.99'}
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={newPromotion.description}
                    onChange={(e) =>
                      setNewPromotion({ ...newPromotion, description: e.target.value })
                    }
                    className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                    placeholder="Description de la promotion"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date de début
                    </label>
                    <input
                      type="date"
                      value={
                        newPromotion.startDate
                          ? format(new Date(newPromotion.startDate), 'yyyy-MM-dd')
                          : ''
                      }
                      onChange={(e) =>
                        setNewPromotion({ ...newPromotion, startDate: new Date(e.target.value) })
                      }
                      className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date de fin
                    </label>
                    <input
                      type="date"
                      value={
                        newPromotion.endDate
                          ? format(new Date(newPromotion.endDate), 'yyyy-MM-dd')
                          : ''
                      }
                      onChange={(e) =>
                        setNewPromotion({ ...newPromotion, endDate: new Date(e.target.value) })
                      }
                      className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-end">
                <button
                  onClick={handleAddPromotion}
                  className="theme-primary text-white px-6 py-2 rounded-lg hover:opacity-80 flex items-center gap-2 dark:bg-blue-700 dark:hover:bg-blue-600"
                >
                  <Plus size={20} />
                  Ajouter la promotion
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromotionsManager;