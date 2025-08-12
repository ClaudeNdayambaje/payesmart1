import React from 'react';
import { Product } from '../types';
import { X, Tag, Package, DollarSign, Percent, ShoppingCart, AlertTriangle, Truck, QrCode, BarChart } from 'lucide-react';
import { generateSimpleBarcode } from '../services/barcodeService';
import { QRCodeSVG } from 'qrcode.react';

interface ProductDetailsModalProps {
  product: Product;
  onClose: () => void;
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ product, onClose }) => {
  // Formater le prix avec 2 décimales et des espaces entre les milliers
  const formatPrice = (price: number): string => {
    return price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  // Formater les nombres avec des espaces entre les milliers
  const formatNumber = (num: number | undefined): string => {
    if (num === undefined) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  // Déterminer la classe CSS pour le statut du stock
  const getStockStatusClass = (): string => {
    if (product.stock <= 0) {
      return 'bg-red-100 text-red-700 font-bold';
    } else if (product.stock <= (product.lowStockThreshold || 5)) {
      return 'bg-amber-100 text-amber-700 font-bold';
    } else {
      return 'bg-green-100 text-green-700';
    }
  };
  
  // Vérifier si le stock est inférieur ou égal au seuil d'alerte
  const isLowStock = product.stock <= (product.lowStockThreshold || 5);
  
  // Vérifier si le stock est épuisé
  const isOutOfStock = product.stock <= 0;

  // Générer le code-barres du produit
  const barcode = product.barcode || generateSimpleBarcode(product);
  
  // Générer les données pour le QR code
  const qrCodeData = JSON.stringify({
    id: product.id,
    name: product.name,
    price: product.price,
    barcode: barcode
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-2 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-slideIn">
        {/* En-tête */}
        <div className="flex justify-between items-center p-3 theme-primary text-white">
          <h2 className="text-xl font-bold flex items-center">
            <Package className="mr-2" size={20} />
            Détails du produit
          </h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenu principal */}
        <div className="flex flex-1 overflow-hidden">
          {/* Image du produit */}
          <div className="w-2/5 p-4 flex items-center justify-center bg-white dark:bg-gray-800">
            <div className="w-full h-full flex items-center justify-center">
              {product.image ? (
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="max-w-full max-h-[300px] object-contain"
                />
              ) : (
                <Package size={100} className="text-gray-300 dark:text-gray-600" />
              )}
            </div>
          </div>
          
          {/* Informations du produit */}
          <div className="w-3/5 p-4 bg-white dark:bg-gray-800 border-l border-gray-100 dark:border-gray-700 overflow-y-auto">
            {/* Nom du produit */}
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">{product.name}</h3>
            
            {/* Informations principales */}
            <div className="space-y-3">
              <div className="flex items-center">
                <Tag className="text-gray-500 mr-2" size={16} />
                <span className="text-gray-700 dark:text-gray-300">Catégorie: <span className="font-medium">{product.category}</span></span>
              </div>
              
              <div className="flex items-center">
                <DollarSign className="theme-success-text mr-2" size={16} />
                <span className="text-gray-700 dark:text-gray-300">Prix: <span className="font-medium theme-success-text">{formatPrice(product.price)} €</span></span>
              </div>
              
              <div className="flex items-center">
                <Percent className="text-gray-500 mr-2" size={16} />
                <span className="text-gray-700 dark:text-gray-300">TVA: <span className="font-medium">{product.vatRate}%</span></span>
              </div>
              
              {/* Informations de stock */}
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <ShoppingCart className={`${isOutOfStock ? 'theme-danger-text' : isLowStock ? 'theme-warning-text' : 'theme-success-text'} mr-2`} size={16} />
                    <span className="text-gray-700 dark:text-gray-300">Stock:</span>
                  </div>
                  <div className="flex items-center">
                    <span className={`px-3 py-1 rounded-full font-medium ${getStockStatusClass()}`}>
                      {formatNumber(product.stock)}
                      {isOutOfStock && ' (Rupture)'}
                      {!isOutOfStock && isLowStock && ' (Faible)'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <AlertTriangle className={`${isLowStock ? 'text-amber-500' : 'text-gray-500'} mr-2`} size={16} />
                    <span className="text-gray-700 dark:text-gray-300">Seuil d'alerte:</span>
                  </div>
                  <span className={`${isLowStock ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-700'} px-3 py-1 rounded-full font-medium`}>
                    {formatNumber(product.lowStockThreshold)}
                  </span>
                </div>
                
                {product.supplier && (
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Truck className="text-gray-500 mr-2" size={16} />
                      <span className="text-gray-700 dark:text-gray-300">Fournisseur:</span>
                    </div>
                    <span className="font-medium dark:text-gray-300">{product.supplier}</span>
                  </div>
                )}
              </div>
              
              {/* Codes d'identification */}
              <div className="pt-3 border-t border-gray-200 relative">
                <div className="flex mb-3">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">Codes d'identification</h4>
                    
                    <div className="flex items-center mb-3">
                      <QrCode className="text-gray-500 mr-2" size={16} />
                      <span className="text-gray-700">Code-barres: <span className="font-mono font-medium text-[#4f46e5]">{barcode}</span></span>
                    </div>
                    
                    <div className="flex items-center">
                      <BarChart className="text-gray-500 mr-2" size={16} />
                      <span className="text-gray-700">ID: <span className="font-mono font-medium text-[#10b981] text-sm">{product.id}</span></span>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 ml-4 self-start">
                    <div className="bg-white p-2 rounded-lg border border-gray-200">
                      <QRCodeSVG value={qrCodeData} size={90} fgColor="#000000" bgColor="#ffffff" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Promotion (si présente) */}
              {product.promotion && (
                <div className="pt-3 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                    <Percent className="text-gray-500 mr-2" size={16} />
                    Promotion en cours
                  </h4>
                  
                  <div className="bg-red-50 p-2 rounded-lg border border-[#ef4444]/20">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-700">Type:</span>
                      <span className="font-medium">
                        {product.promotion.type === 'percentage' ? 'Pourcentage' : 
                         product.promotion.type === 'fixed' ? 'Montant fixe' : 
                         'Achetez X, obtenez Y'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-700">Valeur:</span>
                      <span className="font-medium theme-danger-text">
                        {product.promotion.type === 'percentage' ? `${product.promotion.value}%` : 
                         product.promotion.type === 'fixed' ? `${formatPrice(product.promotion.value)} €` : 
                         `${product.promotion.buyQuantity}+${product.promotion.getFreeQuantity}`}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-700">Période:</span>
                      <span className="font-medium">
                        {new Date(product.promotion.startDate).toLocaleDateString()} - {new Date(product.promotion.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pied de page */}
        <div className="p-3 border-t border-gray-200 flex justify-end bg-gray-50">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-[#4f46e5] text-white rounded-md hover:bg-[#4338ca] transition-colors shadow-sm flex items-center text-sm"
          >
            <X size={16} className="mr-2" />
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsModal;
