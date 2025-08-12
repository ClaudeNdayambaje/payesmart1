import React from 'react';
import { AlertTriangle, PackageCheck, PackageX } from 'lucide-react';
import { Product } from '../types';

interface StockAlertProps {
  products: Product[];
  onClose: () => void;
}

const StockAlert: React.FC<StockAlertProps> = ({ products, onClose }) => {
  const lowStockProducts = products.filter(
    product => product.stock <= (product.lowStockThreshold || 0)
  );

  const outOfStockProducts = products.filter(
    product => product.stock === 0
  );

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="p-4 border-b bg-danger-light">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="theme-danger-text" size={20} />
            <h3 className="font-semibold text-gray-900">Alertes de stock</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {outOfStockProducts.length > 0 && (
          <div className="p-4 border-b">
            <div className="flex items-center gap-2 mb-3">
              <PackageX className="theme-danger-text" size={16} />
              <h4 className="font-medium text-gray-900">Produits en rupture</h4>
            </div>
            <div className="space-y-2">
              {outOfStockProducts.map(product => (
                <div
                  key={product.id}
                  className="flex justify-between items-center bg-danger-light p-2 rounded"
                >
                  <span className="text-sm font-medium">{product.name}</span>
                  <span className="text-sm theme-danger-text">Stock: 0</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {lowStockProducts.length > 0 && (
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <PackageCheck className="theme-warning-text" size={16} />
              <h4 className="font-medium text-gray-900">Stock faible</h4>
            </div>
            <div className="space-y-2">
              {lowStockProducts.map(product => (
                <div
                  key={product.id}
                  className="flex justify-between items-center bg-warning-light p-2 rounded"
                >
                  <span className="text-sm font-medium">{product.name}</span>
                  <div className="text-sm">
                    <span className="theme-warning-text">Stock: {product.stock}</span>
                    <span className="text-gray-500 ml-2">
                      (Min: {product.lowStockThreshold})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {lowStockProducts.length === 0 && outOfStockProducts.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            Aucune alerte de stock
          </div>
        )}
      </div>
    </div>
  );
};

export default StockAlert;