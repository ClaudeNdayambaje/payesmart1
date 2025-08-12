import React, { useState } from 'react';
import ProductQRCode from './ProductQRCode';
import { Product } from '../types';
import { Printer, Search, Filter, Download } from 'lucide-react';

interface QRCodeGeneratorProps {
  products: Product[];
  onViewChange?: (view: 'pos' | 'history' | 'orders' | 'promotions' | 'employees' | 'stock' | 'reports' | 'settings' | 'loyalty' | 'qrcodes') => void;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ products, onViewChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [qrSize, setQrSize] = useState(128);
  
  // Extraire toutes les catégories uniques des produits
  const categories = Array.from(new Set(products.map(product => product.category)));
  
  // Filtrer les produits en fonction de la recherche et de la catégorie
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         product.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === '' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Fonction pour imprimer les codes QR
  const handlePrint = () => {
    window.print();
  };

  // Fonction pour exporter les codes QR en PDF
  const handleExportPDF = () => {
    // Cette fonctionnalité nécessiterait une bibliothèque supplémentaire comme jsPDF
    alert('Fonctionnalité d\'exportation PDF à implémenter');
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Générateur de Codes QR
          </h1>
          <button
            onClick={() => onViewChange && onViewChange('stock')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            <span>Retour</span>
          </button>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Générez et imprimez des codes QR pour tous vos produits. Ces codes peuvent être scannés pour ajouter rapidement des produits au panier.
        </p>
        
        {/* Contrôles et filtres */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              <Filter size={18} />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
            >
              <option value="">Toutes les catégories</option>
              {categories.map((category, index) => (
                <option key={index} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center">
              <span className="mr-2 text-gray-700 dark:text-gray-300">Taille:</span>
              <input
                type="range"
                min="64"
                max="200"
                value={qrSize}
                onChange={(e) => setQrSize(parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <span className="ml-2 text-gray-700 dark:text-gray-300">{qrSize}px</span>
            </div>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 theme-primary text-white rounded-lg hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-opacity-50"
          >
            <Printer size={18} />
            <span>Imprimer</span>
          </button>
          
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 theme-secondary text-white rounded-lg hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-opacity-50"
          >
            <Download size={18} />
            <span>Exporter en PDF</span>
          </button>
        </div>
      </div>
      
      {/* Grille de codes QR */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 print:grid-cols-3">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <div key={product.id} className="print:break-inside-avoid">
              <ProductQRCode product={product} size={qrSize} />
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
            Aucun produit trouvé avec les filtres actuels.
          </div>
        )}
      </div>
      
      {/* Styles pour l'impression */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container, .print-container * {
            visibility: visible;
          }
          .no-print {
            display: none;
          }
          @page {
            size: A4;
            margin: 10mm;
          }
        }
      `}} />
    </div>
  );
};

export default QRCodeGenerator;
