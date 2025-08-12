import React, { useState, useEffect } from 'react';
import { Product, StockMovement } from '../types';
import { X, ArrowUp, Package, ShoppingCart, RotateCcw, AlertTriangle, ClipboardCheck, Loader } from 'lucide-react';
import { format } from 'date-fns';
import { getStockMovementsByProduct } from '../services/stockService';

interface StockHistoryModalProps {
  product: Product;
  movements?: StockMovement[];
  onClose: () => void;
}

const StockHistoryModal: React.FC<StockHistoryModalProps> = ({
  product,
  movements: initialMovements,
  onClose,
}) => {
  const [movements, setMovements] = useState<StockMovement[]>(initialMovements || []);
  const [loading, setLoading] = useState<boolean>(!initialMovements);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Si nous n'avons pas de mouvements initiaux, charger depuis Firebase
    if (!initialMovements) {
      const loadMovements = async () => {
        try {
          setLoading(true);
          const movementsData = await getStockMovementsByProduct(product.id);
          setMovements(movementsData);
          setError(null);
        } catch (err) {
          console.error('Erreur lors du chargement des mouvements de stock:', err);
          setError('Impossible de charger l\'historique des mouvements de stock. Veuillez réessayer.');
        } finally {
          setLoading(false);
        }
      };
      
      loadMovements();
    }
  }, [product.id, initialMovements]);
  const getMovementIcon = (type: StockMovement['type']) => {
    switch (type) {
      case 'adjustment':
        return <Package className="theme-info-text" size={20} />;
      case 'sale':
        return <ShoppingCart className="theme-success-text" size={20} />;
      case 'return':
        return <RotateCcw className="theme-secondary-text" size={20} />;
      case 'reception':
        return <ArrowUp className="theme-primary-text" size={20} />;
      case 'loss':
        return <AlertTriangle className="theme-danger-text" size={20} />;
      case 'inventory':
        return <ClipboardCheck className="text-gray-600" size={20} />;
      default:
        return null;
    }
  };

  const getMovementDescription = (movement: StockMovement) => {
    switch (movement.type) {
      case 'adjustment':
        return 'Ajustement manuel';
      case 'sale':
        return 'Vente';
      case 'return':
        return 'Retour';
      case 'reception':
        return 'Réception';
      case 'loss':
        return 'Perte/Casse';
      case 'inventory':
        return 'Inventaire';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-xl font-semibold">Historique des mouvements</h2>
            <p className="text-gray-600">{product.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Loader className="animate-spin theme-primary-text mr-2" size={24} />
              <span className="text-gray-600">Chargement de l'historique...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 theme-danger-text">
              <AlertTriangle className="mx-auto mb-2" size={24} />
              {error}
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">Aucun mouvement</p>
              <p className="text-sm">
                Il n'y a pas encore eu de mouvement de stock pour ce produit
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {movements
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map(movement => (
                <div
                  key={movement.id}
                  className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
                >
                  {getMovementIcon(movement.type)}
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">
                          {getMovementDescription(movement)}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {format(new Date(movement.timestamp), 'dd/MM/yyyy HH:mm')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${
                          movement.quantity >= 0 ? 'theme-success-text' : 'theme-danger-text'
                        }`}>
                          {movement.quantity >= 0 ? '+' : ''}{movement.quantity}
                        </p>
                        <p className="text-sm text-gray-500">
                          Stock: {movement.newStock}
                        </p>
                      </div>
                    </div>
                    {movement.reason && (
                      <p className="text-sm text-gray-600 mt-2">
                        Raison: {movement.reason}
                      </p>
                    )}
                    {movement.reference && (
                      <p className="text-sm text-gray-600">
                        Réf: {movement.reference}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockHistoryModal;