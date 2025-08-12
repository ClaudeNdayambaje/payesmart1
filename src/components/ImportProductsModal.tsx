import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, FileText, AlertCircle, Check } from 'lucide-react';
import { Product } from '../types';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

interface ImportProductsModalProps {
  onClose: () => void;
  onImport: (products: Omit<Product, 'id'>[]) => void;
  existingCategories: string[];
}

type ImportStatus = 'idle' | 'processing' | 'success' | 'error';

const ImportProductsModal: React.FC<ImportProductsModalProps> = ({
  onClose,
  onImport,
  existingCategories,
}) => {
  const [importedProducts, setImportedProducts] = useState<Omit<Product, 'id'>[]>([]);
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [error, setError] = useState<string>('');
  // Nous n'avons pas besoin de suivre le type de fichier pour l'instant
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newCategories, setNewCategories] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');

  // Fonction pour traiter les données importées
  const processImportedData = (data: any[]): Omit<Product, 'id'>[] => {
    const newProducts: Omit<Product, 'id'>[] = [];
    const foundCategories = new Set<string>(existingCategories);
    
    try {
      data.forEach((row, index) => {
        // Ignorer les lignes vides ou les en-têtes
        if (Object.values(row).filter(Boolean).length === 0) {
          return;
        }
        
        // Vérifier si les colonnes requises existent
        if (!row.name || !row.price) {
          throw new Error(`Ligne ${index + 1}: Les colonnes 'name' et 'price' sont requises`);
        }
        
        // Créer un nouveau produit
        const newProduct: Omit<Product, 'id'> = {
          name: row.name.toString().trim(),
          price: parseFloat(row.price) || 0,
          stock: parseInt(row.stock) || 0,
          category: row.category?.toString().trim() || 'Non catégorisé',
          image: row.image || '',
          lowStockThreshold: parseInt(row.lowStockThreshold) || 10,
          vatRate: parseInt(row.vatRate) === 6 ? 6 : parseInt(row.vatRate) === 12 ? 12 : 21,
          supplier: row.supplier?.toString().trim() || '',
          orderQuantity: parseInt(row.orderQuantity) || 0,
          businessId: '', // Sera défini par l'application lors de l'importation
        };
        
        // Ajouter la catégorie à la liste des nouvelles catégories si elle n'existe pas déjà
        if (newProduct.category && !foundCategories.has(newProduct.category)) {
          foundCategories.add(newProduct.category);
          setNewCategories(prev => [...prev, newProduct.category]);
        }
        
        newProducts.push(newProduct);
      });
      
      return newProducts;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Une erreur s'est produite lors du traitement des données");
      }
      setStatus('error');
      return [];
    }
  };

  // Fonction pour gérer l'importation CSV
  const handleCsvImport = (file: File) => {
    setStatus('processing');
    setError('');
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError(`Erreur lors de l'analyse du CSV: ${results.errors[0].message}`);
          setStatus('error');
          return;
        }
        
        const products = processImportedData(results.data);
        if (products.length > 0) {
          setImportedProducts(products);
          setStatus('success');
        } else if (status !== 'error') {
          setError('Aucun produit valide trouvé dans le fichier');
          setStatus('error');
        }
      },
      error: (err) => {
        setError(`Erreur lors de l'analyse du CSV: ${err.message}`);
        setStatus('error');
      }
    });
  };

  // Fonction pour gérer l'importation Excel
  const handleExcelImport = (file: File) => {
    setStatus('processing');
    setError('');
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error('Impossible de lire le fichier');
        }
        
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const products = processImportedData(jsonData);
        if (products.length > 0) {
          setImportedProducts(products);
          setStatus('success');
        } else if (status !== 'error') {
          setError('Aucun produit valide trouvé dans le fichier');
          setStatus('error');
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(`Erreur lors de l'analyse du fichier Excel: ${err.message}`);
        } else {
          setError("Erreur lors de l'analyse du fichier Excel");
        }
        setStatus('error');
      }
    };
    
    reader.onerror = () => {
      setError('Erreur lors de la lecture du fichier');
      setStatus('error');
    };
    
    reader.readAsBinaryString(file);
  };

  // Fonction pour gérer le changement de fichier
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setFileName(file.name);
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'csv') {
      handleCsvImport(file);
    } else if (['xlsx', 'xls'].includes(fileExtension || '')) {
      handleExcelImport(file);
    } else {
      setError('Format de fichier non pris en charge. Veuillez utiliser CSV ou Excel (.xlsx/.xls)');
      setStatus('error');
    }
  };

  // Fonction pour finaliser l'importation
  const handleImport = () => {
    if (importedProducts.length > 0) {
      onImport(importedProducts);
      onClose();
    }
  };

  // Fonction pour télécharger un modèle
  const downloadTemplate = (type: 'csv' | 'excel') => {
    const headers = ['name', 'price', 'stock', 'category', 'image', 'lowStockThreshold', 'vatRate', 'supplier', 'orderQuantity'];
    const sampleData = [
      {
        name: 'Exemple Produit 1',
        price: 9.99,
        stock: 50,
        category: 'Boissons',
        image: '',
        lowStockThreshold: 10,
        vatRate: 21,
        supplier: 'Fournisseur A',
        orderQuantity: 20
      },
      {
        name: 'Exemple Produit 2',
        price: 5.99,
        stock: 30,
        category: 'Snacks',
        image: '',
        lowStockThreshold: 5,
        vatRate: 6,
        supplier: 'Fournisseur B',
        orderQuantity: 10
      }
    ];
    
    if (type === 'csv') {
      const csv = Papa.unparse({
        fields: headers,
        data: sampleData
      });
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'modele_import_produits.csv';
      link.click();
    } else {
      const worksheet = XLSX.utils.json_to_sheet(sampleData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Produits');
      XLSX.writeFile(workbook, 'modele_import_produits.xlsx');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Importer des produits</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6">
          {status === 'idle' && (
            <>
              <div className="mb-6 text-center">
                <p className="text-gray-600 mb-4">
                  Importez vos produits à partir d'un fichier CSV ou Excel. 
                  Assurez-vous que votre fichier contient au minimum les colonnes <strong>name</strong> et <strong>price</strong>.
                </p>
                
                <div className="flex justify-center gap-4 mb-8">
                  <button
                    onClick={() => downloadTemplate('csv')}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <FileText size={20} />
                    Télécharger modèle CSV
                  </button>
                  <button
                    onClick={() => downloadTemplate('excel')}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <FileSpreadsheet size={20} />
                    Télécharger modèle Excel
                  </button>
                </div>
              </div>
              
              <div 
                className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Glissez votre fichier ici ou cliquez pour parcourir
                </p>
                <p className="text-sm text-gray-500">
                  Formats acceptés: CSV, Excel (.xlsx, .xls)
                </p>
              </div>
            </>
          )}
          
          {status === 'processing' && (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-lg font-medium text-gray-700">Traitement en cours...</p>
              <p className="text-sm text-gray-500">Analyse du fichier {fileName}</p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="text-center py-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <AlertCircle className="text-red-500 mt-0.5 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="text-red-800 font-medium text-left">Erreur lors de l'importation</h3>
                    <p className="text-red-700 text-sm text-left">{error}</p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => {
                  setStatus('idle');
                  setError('');
                  setFileName('');
                }}
                className="px-6 py-3 theme-primary text-white rounded-lg hover:opacity-80 transition-colors"
              >
                Réessayer
              </button>
            </div>
          )}
          
          {status === 'success' && (
            <div className="py-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <Check className="text-green-500 mr-3 flex-shrink-0" size={20} />
                  <div>
                    <h3 className="text-green-800 font-medium">Fichier analysé avec succès</h3>
                    <p className="text-green-700 text-sm">
                      {importedProducts.length} produits prêts à être importés
                    </p>
                  </div>
                </div>
              </div>
              
              {newCategories.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium text-gray-700 mb-2">Nouvelles catégories détectées:</h3>
                  <div className="flex flex-wrap gap-2">
                    {newCategories.map(category => (
                      <span key={category} className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
                        {category}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="font-medium text-gray-700 mb-2">Aperçu des produits:</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Nom</th>
                        <th className="px-4 py-2 text-left">Catégorie</th>
                        <th className="px-4 py-2 text-right">Prix</th>
                        <th className="px-4 py-2 text-right">Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importedProducts.slice(0, 5).map((product, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2">{product.name}</td>
                          <td className="px-4 py-2">{product.category}</td>
                          <td className="px-4 py-2 text-right">{product.price.toFixed(2)} €</td>
                          <td className="px-4 py-2 text-right">{product.stock}</td>
                        </tr>
                      ))}
                      {importedProducts.length > 5 && (
                        <tr className="border-t">
                          <td colSpan={4} className="px-4 py-2 text-center text-gray-500">
                            + {importedProducts.length - 5} autres produits
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-5 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          
          {status === 'success' && (
            <button
              onClick={handleImport}
              className="theme-primary text-white px-6 py-3 rounded-lg hover:opacity-80 transition-colors flex items-center gap-2"
            >
              <Upload size={20} />
              Importer {importedProducts.length} produits
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportProductsModal;
