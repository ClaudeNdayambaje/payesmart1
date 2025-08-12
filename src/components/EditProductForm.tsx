import React, { useState, useRef, useEffect } from 'react';
import { Product } from '../types';
import { X, Save, Camera, Check, AlertCircle, QrCode, Scan } from 'lucide-react';
import { generateNewBarcode, setupBarcodeScanner, extractProductInfoFromBarcode } from '../services/barcodeService';

interface EditProductFormProps {
  product: Product;
  onClose: () => void;
  onSubmit: (productId: string, updates: Partial<Product>) => void;
  categories: string[];
  onAddCategory: (category: string) => void;
  products?: Product[];
}

const EditProductForm: React.FC<EditProductFormProps> = ({
  product,
  onClose,
  onSubmit,
  categories,
  onAddCategory,
  products = [],
}) => {
  const [editedProduct, setEditedProduct] = useState<Product>({ ...product });
  const [newCategory, setNewCategory] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(product.image || null);
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  // Références pour le drag & drop
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Générer un code-barres par défaut basé sur la catégorie sélectionnée
  const generateDefaultBarcode = (category: string) => {
    if (!category) return '';
    return generateNewBarcode(category, [product, ...products]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'price' || name === 'stock' || name === 'lowStockThreshold' || name === 'orderQuantity') {
      setEditedProduct({
        ...editedProduct,
        [name]: value === '' ? '' : Number(value),
      });
    } else if (name === 'vatRate') {
      setEditedProduct({
        ...editedProduct,
        vatRate: Number(value) as 6 | 12 | 21,
      });
    } else if (name === 'category') {
      // Si la catégorie change et qu'il n'y a pas de code-barres, générer un nouveau code-barres
      if (!editedProduct.barcode) {
        const newBarcode = generateNewBarcode(value, [product, ...products]);
        setEditedProduct({
          ...editedProduct,
          category: value,
          barcode: newBarcode
        });
      } else {
        setEditedProduct({
          ...editedProduct,
          category: value
        });
      }
    } else {
      setEditedProduct({
        ...editedProduct,
        [name]: value,
      });
    }
  };
  
  // Gestion de l'upload d'image
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setImagePreview(imageUrl);
        setEditedProduct({ ...editedProduct, image: imageUrl });
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Configuration du scanner de code-barres
  useEffect(() => {
    if (isScanning) {
      // Mettre le focus sur le champ de code-barres
      if (barcodeInputRef.current) {
        barcodeInputRef.current.focus();
      }
      
      // Configurer le scanner de code-barres
      const cleanupScanner = setupBarcodeScanner((barcode) => {
        // Extraire les informations du produit à partir du code-barres
        const productInfo = extractProductInfoFromBarcode(barcode, [product, ...products]);
        
        // Mettre à jour le formulaire avec les informations extraites
        // Pour l'édition, nous sommes plus prudents et ne remplaçons que le code-barres par défaut
        // L'utilisateur peut choisir de mettre à jour les autres champs manuellement
        setEditedProduct(prev => ({
          ...prev,
          barcode: barcode
        }));
        
        // Si des informations supplémentaires ont été trouvées, afficher un message
        if (productInfo.name && productInfo.name !== editedProduct.name) {
          // Afficher une alerte ou un message indiquant que des informations supplémentaires sont disponibles
          alert(`Informations trouvées pour ce code-barres:\n\nNom: ${productInfo.name}\nPrix: ${productInfo.price}\nCatégorie: ${productInfo.category}\n\nVoulez-vous utiliser ces informations?`);
          
          // Si l'utilisateur confirme, mettre à jour tous les champs
          if (window.confirm('Voulez-vous utiliser ces informations pour mettre à jour le produit?')) {
            setEditedProduct(prev => ({
              ...prev,
              name: productInfo.name || prev.name,
              price: productInfo.price !== undefined ? productInfo.price : prev.price,
              category: productInfo.category || prev.category,
              vatRate: productInfo.vatRate || prev.vatRate,
              barcode: barcode
            }));
          }
        }
        
        setIsScanning(false); // Désactiver le mode scan après avoir scanné un code
      });
      
      return () => {
        cleanupScanner(); // Nettoyer l'écouteur d'événements lorsque le composant est démonté
      };
    }
  }, [isScanning, editedProduct, product, products]);
  
  // Gestion du drag & drop
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    };
    
    const handleDragLeave = () => {
      setIsDragging(false);
    };
    
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      
      if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
          const imageUrl = reader.result as string;
          setImagePreview(imageUrl);
          setEditedProduct({ ...editedProduct, image: imageUrl });
        };
        reader.readAsDataURL(file);
      }
    };
    
    const dropArea = dropAreaRef.current;
    if (dropArea) {
      dropArea.addEventListener('dragover', handleDragOver);
      dropArea.addEventListener('dragleave', handleDragLeave);
      dropArea.addEventListener('drop', handleDrop);
      
      return () => {
        dropArea.removeEventListener('dragover', handleDragOver);
        dropArea.removeEventListener('dragleave', handleDragLeave);
        dropArea.removeEventListener('drop', handleDrop);
      };
    }
  }, []);

  const handleAddNewCategory = () => {
    if (newCategory.trim()) {
      onAddCategory(newCategory.trim());
      setEditedProduct({ ...editedProduct, category: newCategory.trim() });
      setShowNewCategory(false);
      setNewCategory('');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!editedProduct.name.trim()) {
      newErrors.name = 'Le nom du produit est requis';
    }
    
    if (!editedProduct.price && editedProduct.price !== 0) {
      newErrors.price = 'Le prix est requis';
    } else if (editedProduct.price < 0) {
      newErrors.price = 'Le prix ne peut pas être négatif';
    }
    
    if (!editedProduct.stock && editedProduct.stock !== 0) {
      newErrors.stock = 'Le stock est requis';
    }
    
    if (!editedProduct.category) {
      newErrors.category = 'La catégorie est requise';
    }
    
    if (editedProduct.lowStockThreshold && editedProduct.lowStockThreshold < 0) {
      newErrors.lowStockThreshold = 'Le seuil de stock bas ne peut pas être négatif';
    }
    
    if (editedProduct.orderQuantity && editedProduct.orderQuantity < 0) {
      newErrors.orderQuantity = 'La quantité de commande ne peut pas être négative';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Créer un objet avec seulement les champs modifiés
      const updates: Partial<Product> = {};
      
      // Comparer chaque champ pour ne soumettre que ceux qui ont changé
      Object.keys(editedProduct).forEach((key) => {
        const typedKey = key as keyof Product;
        if (JSON.stringify(editedProduct[typedKey]) !== JSON.stringify(product[typedKey])) {
          // Utiliser une assertion de type pour éviter l'erreur de type
          updates[typedKey] = editedProduct[typedKey] as any;
        }
      });
      
      if (Object.keys(updates).length > 0) {
        onSubmit(product.id, updates);
      }
      
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Modifier le produit</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Colonne gauche */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image du produit
                </label>
                <div 
                  ref={dropAreaRef}
                  className={`border-2 ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-dashed border-gray-300'} rounded-xl p-6 text-center transition-all cursor-pointer hover:border-indigo-500 hover:bg-indigo-50`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Aperçu"
                        className="w-full h-48 object-contain mx-auto rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setImagePreview(null);
                          setEditedProduct({ ...editedProduct, image: '' });
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48">
                      <Camera className="w-12 h-12 text-gray-400 mb-3" />
                      <p className="text-gray-500 mb-2">Glissez une image ici ou cliquez pour parcourir</p>
                      <p className="text-xs text-gray-400">PNG, JPG ou GIF jusqu'à 5MB</p>
                    </div>
                  )}
                </div>
              </div>
          
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du produit <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editedProduct.name}
                  onChange={(e) => setEditedProduct({ ...editedProduct, name: e.target.value })}
                  className={`w-full border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                  placeholder="Nom du produit"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.name}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie <span className="text-red-500">*</span>
                </label>
                {showNewCategory ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Nouvelle catégorie"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddNewCategory}
                      className="bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <Check size={20} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewCategory(false)}
                      className="bg-gray-200 text-gray-600 px-4 py-3 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <select
                    value={editedProduct.category}
                    onChange={(e) => setEditedProduct({ ...editedProduct, category: e.target.value })}
                    className={`w-full border ${errors.category ? 'border-red-500' : 'border-gray-300'} rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white`}
                  >
                    <option value="" disabled>Sélectionnez une catégorie</option>
                    {categories.map((category, index) => {
                      // Normaliser les catégories pour extraire le nom si c'est un objet
                      const categoryValue = typeof category === 'object' && category !== null && 'name' in category
                        ? category.name
                        : String(category);
                      
                      return (
                        <option key={index} value={categoryValue}>
                          {categoryValue}
                        </option>
                      );
                    })}
                    <option value="new" onClick={() => setShowNewCategory(true)}>+ Nouvelle catégorie</option>
                  </select>
                )}
                {errors.category && (
                  <p className="mt-1 text-sm text-red-500 flex items-center">
                    <AlertCircle size={14} className="mr-1" />
                    {errors.category}
                  </p>
                )}
              </div>
            </div>
          
            {/* Colonne droite */}
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editedProduct.price || ''}
                      onChange={(e) => handleChange({
                        target: { name: 'price', value: e.target.value }
                      } as React.ChangeEvent<HTMLInputElement>)}
                      className={`w-full border ${errors.price ? 'border-red-500' : 'border-gray-300'} rounded-lg pl-4 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                      placeholder="0.00"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
                  </div>
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.price}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    TVA
                  </label>
                  <select
                    value={editedProduct.vatRate}
                    onChange={(e) => setEditedProduct({ ...editedProduct, vatRate: parseInt(e.target.value) as 6 | 12 | 21 })}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value={6}>6%</option>
                    <option value={12}>12%</option>
                    <option value={21}>21%</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock initial
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editedProduct.stock || ''}
                    onChange={(e) => handleChange({
                      target: { name: 'stock', value: e.target.value }
                    } as React.ChangeEvent<HTMLInputElement>)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seuil d'alerte
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editedProduct.lowStockThreshold || ''}
                    onChange={(e) => handleChange({
                      target: { name: 'lowStockThreshold', value: e.target.value }
                    } as React.ChangeEvent<HTMLInputElement>)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fournisseur
                </label>
                <input
                  type="text"
                  value={editedProduct.supplier || ''}
                  onChange={(e) => setEditedProduct({ ...editedProduct, supplier: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nom du fournisseur"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantité de commande par défaut
                </label>
                <input
                  type="number"
                  min="0"
                  value={editedProduct.orderQuantity || ''}
                  onChange={(e) => handleChange({
                    target: { name: 'orderQuantity', value: e.target.value }
                  } as React.ChangeEvent<HTMLInputElement>)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <QrCode size={16} className="mr-2" />
                  Code-barres
                </label>
                <div className="flex">
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={editedProduct.barcode || ''}
                    onChange={(e) => setEditedProduct({ ...editedProduct, barcode: e.target.value })}
                    className={`flex-1 border border-gray-300 rounded-l-lg px-4 py-3 focus:outline-none focus:ring-2 ${isScanning ? 'ring-2 ring-red-500 border-red-500' : 'focus:ring-indigo-500'}`}
                    placeholder={isScanning ? 'Scannez un code-barres...' : 'Code-barres du produit'}
                  />
                  <button
                    type="button"
                    onClick={() => setIsScanning(!isScanning)}
                    className={`px-4 py-3 ${isScanning ? 'theme-danger-light theme-danger-text hover:opacity-80' : 'theme-info-light theme-info-text hover:opacity-80'} transition-colors`}
                    title={isScanning ? 'Annuler le scan' : 'Scanner un code-barres'}
                  >
                    <Scan size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditedProduct({ ...editedProduct, barcode: generateDefaultBarcode(editedProduct.category) })}
                    className="theme-primary-light theme-primary-text px-4 py-3 rounded-r-lg hover:opacity-80 transition-colors"
                    title="Générer un code-barres automatiquement"
                  >
                    <QrCode size={20} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {isScanning ? 
                    'Mode scan actif : utilisez un scanner de code-barres pour remplir automatiquement les informations du produit.' : 
                    'Vous pouvez générer un nouveau code-barres, scanner un code existant pour récupérer des informations, ou conserver l\'actuel.'}
                </p>
              </div>
            </div>
          
          </div>
          
          <div className="mt-8 pt-5 border-t flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="theme-primary text-white px-6 py-3 rounded-lg hover:opacity-80 transition-colors flex items-center gap-2"
            >
              <Save size={20} />
              Enregistrer le produit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductForm;
