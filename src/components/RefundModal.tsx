import React, { useState } from 'react';
import { X, AlertCircle, Check } from 'lucide-react';
import { Sale, CartItem } from '../types';

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
  onRefund: (saleId: string, refundItems: CartItem[], refundMethod: 'cash' | 'card', fullRefund: boolean) => Promise<void>;
}

const RefundModal: React.FC<RefundModalProps> = ({ isOpen, onClose, sale, onRefund }) => {
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});
  const [refundMethod, setRefundMethod] = useState<'cash' | 'card'>(sale?.paymentMethod || 'cash');
  const [fullRefund, setFullRefund] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Réinitialiser l'état quand la modale s'ouvre avec une nouvelle vente
  React.useEffect(() => {
    if (isOpen && sale) {
      const initialSelectedItems: Record<string, boolean> = {};
      sale.items.forEach(item => {
        initialSelectedItems[item.product.id] = true;
      });
      setSelectedItems(initialSelectedItems);
      setRefundMethod(sale.paymentMethod);
      setFullRefund(true);
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, sale]);

  if (!isOpen || !sale) return null;

  // Calculer le montant total du remboursement
  const calculateRefundAmount = () => {
    if (fullRefund) return sale.total;
    
    return sale.items.reduce((total, item) => {
      if (selectedItems[item.product.id]) {
        return total + (item.product.price * item.quantity);
      }
      return total;
    }, 0);
  };

  // Obtenir les éléments sélectionnés pour le remboursement
  const getSelectedItems = () => {
    if (fullRefund) return sale.items;
    
    return sale.items.filter(item => selectedItems[item.product.id]);
  };

  // Formater les montants en euros
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  // Gérer le remboursement
  const handleRefund = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      
      const itemsToRefund = getSelectedItems();
      
      if (itemsToRefund.length === 0) {
        setError('Veuillez sélectionner au moins un article à rembourser');
        setIsProcessing(false);
        return;
      }
      
      await onRefund(sale.id, itemsToRefund, refundMethod, fullRefund);
      setSuccess(true);
      
      // Fermer la modale après 2 secondes
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError('Une erreur est survenue lors du remboursement. Veuillez réessayer.');
      console.error('Erreur de remboursement:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Remboursement - Ticket #{sale.receiptNumber}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
          {success ? (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-lg font-medium text-center text-gray-900 dark:text-white">
                Remboursement effectué avec succès
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type de remboursement
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={fullRefund}
                      onChange={() => setFullRefund(true)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Remboursement total
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!fullRefund}
                      onChange={() => setFullRefund(false)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Remboursement partiel
                    </span>
                  </label>
                </div>
              </div>

              {!fullRefund && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sélectionnez les articles à rembourser
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-2">
                    {sale.items.map((item) => (
                      <label
                        key={item.product.id}
                        className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
                      >
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={!!selectedItems[item.product.id]}
                            onChange={() => {
                              setSelectedItems({
                                ...selectedItems,
                                [item.product.id]: !selectedItems[item.product.id],
                              });
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            {item.quantity}x {item.product.name}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(item.product.price * item.quantity)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Méthode de remboursement
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="cash"
                      checked={refundMethod === 'cash'}
                      onChange={() => setRefundMethod('cash')}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Espèces
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="card"
                      checked={refundMethod === 'card'}
                      onChange={() => setRefundMethod('card')}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Carte bancaire
                    </span>
                  </label>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Montant à rembourser:
                  </span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatCurrency(calculateRefundAmount())}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
            >
              Annuler
            </button>
            <button
              onClick={handleRefund}
              disabled={isProcessing}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Traitement...' : 'Confirmer le remboursement'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RefundModal;
