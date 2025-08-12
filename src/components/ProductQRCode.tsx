import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Product } from '../types';
import { generateSimpleBarcode } from '../services/barcodeService';

interface ProductQRCodeProps {
  product: Product;
  size?: number;
  includeDetails?: boolean;
}

const ProductQRCode: React.FC<ProductQRCodeProps> = ({ 
  product, 
  size = 128, 
  includeDetails = true 
}) => {
  // Générer un code-barres simplifié pour le produit
  const simpleBarcode = generateSimpleBarcode(product);
  
  // Créer un objet avec les informations essentielles du produit
  const productData = {
    id: product.id,
    name: product.name,
    price: product.price,
    barcode: simpleBarcode // Utiliser le code-barres simplifié
  };

  // Convertir l'objet en chaîne JSON pour le code QR
  const qrValue = JSON.stringify(productData);

  return (
    <div className="flex flex-col items-center">
      <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
        <QRCodeSVG 
          value={qrValue} 
          size={size} 
          level="M" // Niveau de correction d'erreur (L, M, Q, H)
          includeMargin={true}
          bgColor="#FFFFFF"
          fgColor="#000000"
        />
      </div>
      
      {includeDetails && (
        <div className="mt-2 text-center">
          <p className="font-medium text-gray-800 dark:text-gray-200">{product.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{product.price.toFixed(2)} €</p>
          <p className="text-base font-bold text-indigo-600 dark:text-indigo-400 mt-1">{simpleBarcode}</p>
        </div>
      )}
    </div>
  );
};

export default ProductQRCode;
