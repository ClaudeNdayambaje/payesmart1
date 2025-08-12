import React, { useState, useRef, useEffect } from 'react';
import { Product } from '../types';
import { X, Package, Plus, Image as ImageIcon, Camera, Check, AlertCircle, Save } from 'lucide-react';

interface AddProductModalProps {
  onClose: () => void;
  onSubmit: (product: Omit<Product, 'id'>) => void;
  categories: string[];
}

const AddProductModal: React.FC<AddProductModalProps> = ({
  onClose,
  onSubmit,
  categories,
}) => {
  // Référence pour le drag & drop de l'image
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropAreaRef = useRef<HTMLDivElement>(null);
  
  // État pour les erreurs de validation
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // État pour le produit
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
  });
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!newProduct.name || !newProduct.price || !newProduct.category) return;
    onSubmit(newProduct);
    onClose();
  };

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

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'new') {
      setShowNewCategory(true);
    } else {
      setNewProduct({ ...newProduct, category: value });
    }
  };

  const handleAddNewCategory = () => {
    if (newCategory.trim()) {
      setNewProduct({ ...newProduct, category: newCategory.trim() });
      setShowNewCategory(false);
      setNewCategory('');
    }
  };

  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>, field: keyof typeof newProduct) => {
    const value = e.target.value === '' ? '0' : e.target.value;
    const numberValue = parseFloat(value);
    if (!isNaN(numberValue)) {
      setNewProduct({ ...newProduct, [field]: numberValue });
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'basic', label: 'Informations', icon: <Info size={18} /> },
    { id: 'pricing', label: 'Prix', icon: <DollarSign size={18} /> },
    { id: 'stock', label: 'Stock', icon: <Package size={18} /> },
    { id: 'supplier', label: 'Fournisseur', icon: <Truck size={18} /> },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Ajouter un produit</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="border-b">
          <div className="flex">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image du produit
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-indigo-500 transition-colors">
                        {imagePreview ? (
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-32 h-32 mx-auto object-cover rounded-lg"
                          />
                        ) : (
                          <div className="text-gray-500">
                            <ImageIcon className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm">Cliquez pour ajouter une image</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <input
                      type="url"
                      value={newProduct.image}
                      onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="Ou entrez une URL d'image"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du produit
                </label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Nom du produit"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie
                </label>
                {showNewCategory ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="flex-1 border rounded-lg px-3 py-2"
                      placeholder="Nouvelle catégorie"
                    />
                    <button
                      onClick={handleAddNewCategory}
                      className="theme-primary text-white px-4 py-2 rounded-lg hover:opacity-80"
                    >
                      <Plus size={20} />
                    </button>
                    <button
                      onClick={() => setShowNewCategory(false)}
                      className="bg-gray-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-300"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <select
                    value={newProduct.category}
                    onChange={handleCategoryChange}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                    <option value="new">+ Nouvelle catégorie</option>
                  </select>
                )}
              </div>
            </div>
          )}

          {activeTab === 'pricing' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={newProduct.price || ''}
                    onChange={(e) => handleNumberInput(e, 'price')}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    TVA
                  </label>
                  <select
                    value={newProduct.vatRate}
                    onChange={(e) => setNewProduct({ ...newProduct, vatRate: parseInt(e.target.value) as 6 | 12 | 21 })}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value={6}>6%</option>
                    <option value={12}>12%</option>
                    <option value={21}>21%</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stock' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock initial
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newProduct.stock || ''}
                    onChange={(e) => handleNumberInput(e, 'stock')}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seuil d'alerte
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newProduct.lowStockThreshold || ''}
                    onChange={(e) => handleNumberInput(e, 'lowStockThreshold')}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'supplier' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fournisseur
                </label>
                <input
                  type="text"
                  value={newProduct.supplier}
                  onChange={(e) => setNewProduct({ ...newProduct, supplier: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Nom du fournisseur"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantité de commande par défaut
                </label>
                <input
                  type="number"
                  min="0"
                  value={newProduct.orderQuantity || ''}
                  onChange={(e) => handleNumberInput(e, 'orderQuantity')}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
          <div className="flex gap-2">
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  activeTab === tab.id ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={!newProduct.name || !newProduct.price || !newProduct.category}
              className="theme-primary text-white px-6 py-2 rounded-lg hover:opacity-80 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Package size={20} />
              Ajouter le produit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddProductModal;