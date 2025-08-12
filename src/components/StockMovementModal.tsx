import React, { useState } from 'react';
import { Product, StockAdjustment } from '../types';
import { X, AlertTriangle } from 'lucide-react';

interface StockMovementModalProps {
  product: Product;
  onClose: () => void;
  onSubmit: (adjustment: StockAdjustment) => void;
}

const StockMovementModal: React.FC<StockMovementModalProps> = ({
  product,
  onClose,
  onSubmit,
}) => {
  const [quantity, setQuantity] = useState<number>(0);
  const [type, setType] = useState<'adjustment' | 'loss' | 'inventory'>('adjustment');
  const [reason, setReason] = useState<string>('');

  const handleSubmit = () => {
    if (!quantity || !reason) return;

    onSubmit({
      productId: product.id,
      quantity,
      type,
      reason,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Ajustement de stock</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <h3 className="font-medium mb-2">{product.name}</h3>
            <p className="text-sm text-gray-600">Stock actuel: {product.stock} unités</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type d'ajustement
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as StockAdjustment['type'])}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="adjustment">Ajustement manuel</option>
              <option value="loss">Perte/Casse</option>
              <option value="inventory">Inventaire</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantité
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity(prev => prev - 1)}
                className="px-3 py-1 border rounded-lg hover:bg-gray-100"
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="flex-1 border rounded-lg px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              />
              <button
                onClick={() => setQuantity(prev => prev + 1)}
                className="px-3 py-1 border rounded-lg hover:bg-gray-100"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Raison
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
              rows={3}
              placeholder="Expliquez la raison de cet ajustement..."
            />
          </div>

          {quantity < 0 && product.stock + quantity < 0 && (
            <div className="flex items-center gap-2 theme-danger-text bg-danger-light p-3 rounded-lg">
              <AlertTriangle size={20} />
              <p className="text-sm">
                Attention: Cette opération mettra le stock en négatif.
              </p>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 rounded-lg"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!quantity || !reason}
            className="theme-primary text-white px-6 py-2 rounded-lg hover:opacity-80 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Valider
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockMovementModal;