import React, { useState, useRef, useEffect } from 'react';
import { Product } from '../types';
import { X, Save, Camera, Check, AlertCircle, QrCode, Scan } from 'lucide-react';
import { generateNewBarcode, setupBarcodeScanner, extractProductInfoFromBarcode } from '../services/barcodeService';

interface NewProductFormProps {
  onClose: () => void;
  onSubmit: (product: Omit<Product, 'id'>) => void;
  categories: string[];
  onAddCategory?: (category: string) => void;
  products: Product[];
}

const NewProductForm: React.FC<NewProductFormProps> = ({
  onClose,
  onSubmit,
  categories,
  onAddCategory,
  products,
}) => {
  // Références pour le drag & drop
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  
  // Générer un code-barres par défaut basé sur la catégorie sélectionnée
  const generateDefaultBarcode = (category: string) => {
    if (!category) return '';
    return generateNewBarcode(category, products);
  };

  // États pour le formulaire
  const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({
    name: '',
    price: 0,
    stock: 0,
    category: categories[0] || '',
    image: '',
    lowStockThreshold: 10,
    vatRate: 21,
    supplier: '',
    orderQuantity: 0,
    barcode: categories[0] ? generateNewBarcode(categories[0], products) : '',
    businessId: 'business1', // Valeur par défaut, sera remplacée par le service productService
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!newProduct.name.trim()) {
      newErrors.name = 'Le nom du produit est requis';
    }
    
    if (newProduct.price <= 0) {
      newErrors.price = 'Le prix doit être supérieur à 0';
    }
    
    if (!newProduct.category) {
      newErrors.category = 'La catégorie est requise';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Gestion de l'upload d'image
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setImagePreview(imageUrl);
        setNewProduct({ ...newProduct, image: imageUrl });
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
        const productInfo = extractProductInfoFromBarcode(barcode, products);
        
        // Mettre à jour le formulaire avec les informations extraites
        setNewProduct(prev => ({
          ...prev,
          ...productInfo,
          // Conserver les valeurs existantes si elles ne sont pas dans productInfo
          name: productInfo.name || prev.name,
          price: productInfo.price !== undefined ? productInfo.price : prev.price,
          category: productInfo.category || prev.category,
          vatRate: productInfo.vatRate || prev.vatRate,
          barcode: barcode
        }));
        
        // Afficher un message de succès si des informations ont été trouvées
        if (productInfo.name) {
          // Mettre en évidence les champs remplis automatiquement
          // Vous pourriez ajouter une animation ou un effet visuel ici
        }
        
        setIsScanning(false); // Désactiver le mode scan après avoir scanné un code
      });
      
      return () => {
        cleanupScanner(); // Nettoyer l'écouteur d'événements lorsque le composant est démonté
      };
    }
  }, [isScanning, newProduct, products]);
  
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
          setNewProduct({ ...newProduct, image: imageUrl });
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
  }, [newProduct]);
  
  // Gestion des catégories
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'new') {
      setShowNewCategory(true);
    } else {
      // Générer un nouveau code-barres basé sur la nouvelle catégorie
      const newBarcode = generateNewBarcode(value, products);
      setNewProduct({ ...newProduct, category: value, barcode: newBarcode });
    }
  };
  
  const handleAddNewCategory = () => {
    if (newCategory.trim()) {
      const trimmedCategory = newCategory.trim();
      // Générer un nouveau code-barres basé sur la nouvelle catégorie
      const newBarcode = generateNewBarcode(trimmedCategory, products);
      
      // Mettre à jour le produit avec la nouvelle catégorie et le nouveau code-barres
      setNewProduct({ ...newProduct, category: trimmedCategory, barcode: newBarcode });
      
      // Ajouter la catégorie à la liste des catégories dans le composant parent
      if (onAddCategory && !categories.includes(trimmedCategory)) {
        onAddCategory(trimmedCategory);
      }
      
      // Réinitialiser l'état
      setNewCategory('');
      setShowNewCategory(false);
    }
  };
  
  // Gestion des champs numériques
  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof newProduct) => {
    const value = e.target.value === '' ? '0' : e.target.value;
    const numberValue = parseFloat(value);
    if (!isNaN(numberValue)) {
      setNewProduct({ ...newProduct, [field]: numberValue });
    }
  };
  
  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Début de la soumission du formulaire de produit');
    console.log('Données du produit à créer:', JSON.stringify(newProduct, null, 2));
    
    // Vérification de la présence du businessId
    if (!newProduct.businessId || newProduct.businessId === 'business1') {
      console.warn('Attention: businessId non spécifié ou valeur par défaut utilisée:', newProduct.businessId);
    }
    
    if (validateForm()) {
      console.log('Validation du formulaire réussie, envoi des données au composant parent');
      onSubmit(newProduct);
      console.log('Fermeture du formulaire après soumission');
      onClose();
    } else {
      console.error('Validation du formulaire échouée, formulaire non soumis');
      console.log('Erreurs de validation:', errors);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden p-6 text-left align-middle transition-all">
        <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Ajouter un nouveau produit</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Colonne gauche */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                          setNewProduct({ ...newProduct, image: '' });
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48">
                      <Camera className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-3" />
                      <p className="text-gray-500 dark:text-gray-400 mb-2">Glissez une image ici ou cliquez pour parcourir</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">PNG, JPG ou GIF jusqu'à 5MB</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nom du produit <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className={`w-full border ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400`}
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Catégorie <span className="text-red-500">*</span>
                </label>
                {showNewCategory ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Nouvelle catégorie"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddNewCategory}
                      className="bg-indigo-600 text-white px-3 py-2 rounded-md hover:bg-indigo-700 transition-colors"
                    >
                      <Check size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewCategory(false)}
                      className="bg-gray-200 text-gray-600 px-3 py-2 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <select
                    value={newProduct.category}
                    onChange={handleCategoryChange}
                    className={`w-full border ${errors.category ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 dark:text-white`}
                  >
                    <option value="" disabled>Sélectionnez une catégorie</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                    <option value="new">+ Nouvelle catégorie</option>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prix <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={newProduct.price || ''}
                      onChange={(e) => handleNumberInput(e, 'price')}
                      className={`w-full border ${errors.price ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md pl-4 pr-10 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400`}
                      placeholder="0.00"
                    />
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">€</span>
                  </div>
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-500 flex items-center">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.price}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    TVA
                  </label>
                  <select
                    value={newProduct.vatRate}
                    onChange={(e) => setNewProduct({ ...newProduct, vatRate: parseInt(e.target.value) as 6 | 12 | 21 })}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 bg-white"
                  >
                    <option value={6}>6%</option>
                    <option value={12}>12%</option>
                    <option value={21}>21%</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Stock initial
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newProduct.stock || ''}
                    onChange={(e) => handleNumberInput(e, 'stock')}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Seuil d'alerte
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newProduct.lowStockThreshold || ''}
                    onChange={(e) => handleNumberInput(e, 'lowStockThreshold')}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Fournisseur
                </label>
                <input
                  type="text"
                  value={newProduct.supplier}
                  onChange={(e) => setNewProduct({ ...newProduct, supplier: e.target.value })}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  placeholder="Nom du fournisseur"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quantité de commande par défaut
                </label>
                <input
                  type="number"
                  min="0"
                  value={newProduct.orderQuantity || ''}
                  onChange={(e) => handleNumberInput(e, 'orderQuantity')}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                />
              </div>
              
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <QrCode size={16} className="mr-2" />
                  Code-barres
                </label>
                <div className="flex">
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    value={newProduct.barcode || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, barcode: e.target.value })}
                    className={`flex-1 border border-gray-300 dark:border-gray-600 rounded-l-lg px-4 py-3 focus:outline-none focus:ring-2 ${isScanning ? 'ring-2 ring-red-500 border-red-500' : 'focus:ring-indigo-500'} dark:bg-gray-700 dark:text-white`}
                    placeholder={isScanning ? 'Scannez un code-barres...' : 'Code-barres du produit'}
                  />
                  <button
                    type="button"
                    onClick={() => setIsScanning(!isScanning)}
                    className={`px-4 py-3 ${isScanning ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800' : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800'} transition-colors`}
                    title={isScanning ? 'Annuler le scan' : 'Scanner un code-barres'}
                  >
                    <Scan size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewProduct({ ...newProduct, barcode: generateDefaultBarcode(newProduct.category) })}
                    className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-4 py-3 rounded-r-lg hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
                    title="Générer un code-barres automatiquement"
                  >
                    <QrCode size={20} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {isScanning ? 
                    'Mode scan actif : utilisez un scanner de code-barres pour remplir automatiquement les informations du produit.' : 
                    'Le code-barres sera généré automatiquement si vous n\'en spécifiez pas un. Vous pouvez aussi scanner un code existant pour récupérer les informations du produit.'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-5 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-transparent border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2 font-medium"
            >
              <Save size={18} />
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProductForm;
