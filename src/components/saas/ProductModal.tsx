import React, { useState, useEffect } from 'react';
import { MarketingProduct } from '../../services/marketingProductsService';
import { toast } from 'react-hot-toast';
import { storage } from '../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Partial<MarketingProduct>) => Promise<boolean>;
  product: MarketingProduct | null;
  isEdit: boolean;
}

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSave, product, isEdit }) => {
  const [formData, setFormData] = useState<Partial<MarketingProduct>>({
    name: '',
    description: '',
    price: 0,
    category: '',
    imageUrl: '',
    active: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Remplir le formulaire avec les données du produit lors de l'édition
  useEffect(() => {
    if (product && isEdit) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || 0,
        category: product.category || '',
        imageUrl: product.imageUrl || '',
        active: typeof product.active === 'boolean' ? product.active : true,
      });
      
      if (product.imageUrl) {
        setImagePreview(product.imageUrl);
      }
    } else {
      // Réinitialiser le formulaire pour un nouveau produit
      setFormData({
        name: '',
        description: '',
        price: 0,
        category: '',
        imageUrl: '',
        active: true,
      });
      setImagePreview(null);
      setImageFile(null);
    }
    
    setErrors({});
  }, [product, isEdit, isOpen]);

  if (!isOpen) return null;

  // Gérer les changements dans les champs du formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : type === 'number' 
          ? parseFloat(value) 
          : value
    }));
    
    // Effacer les erreurs pour ce champ
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Gérer le téléchargement d'image
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('L\'image ne doit pas dépasser 2MB');
        return;
      }
      
      setImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Valider le formulaire avant soumission
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Le nom du produit est requis';
    }
    
    if (!formData.description?.trim()) {
      newErrors.description = 'La description est requise';
    }
    
    if (typeof formData.price !== 'number' || formData.price <= 0) {
      newErrors.price = 'Le prix doit être un nombre positif';
    }
    
    if (!formData.category?.trim()) {
      newErrors.category = 'La catégorie est requise';
    }
    
    if (!formData.imageUrl?.trim() && !imageFile && !isEdit) {
      newErrors.image = 'Une image est requise';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumettre le formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      let finalImageUrl = formData.imageUrl || '';
      
      // Si un nouveau fichier image a été sélectionné, on l'upload vers Firebase Storage
      if (imageFile) {
        try {
          // Créer une référence unique pour l'image dans Storage
          const storageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
          
          // Télécharger l'image vers Firebase Storage
          const uploadResult = await uploadBytes(storageRef, imageFile);
          
          // Obtenir l'URL de téléchargement de l'image
          finalImageUrl = await getDownloadURL(uploadResult.ref);
          
          console.log('Image téléchargée avec succès:', finalImageUrl);
        } catch (uploadError) {
          console.error('Erreur lors du téléchargement de l\'image:', uploadError);
          toast.error('Erreur lors du téléchargement de l\'image');
          setIsLoading(false);
          return;
        }
      }
      
      const productData = {
        ...formData,
        imageUrl: finalImageUrl // Stocker uniquement l'URL dans Firestore
      };
      
      const success = await onSave(productData);
      
      if (success) {
        toast.success(`Produit ${isEdit ? 'modifié' : 'ajouté'} avec succès`);
        onClose();
      } else {
        toast.error(`Erreur lors de ${isEdit ? 'la modification' : 'l\'ajout'} du produit`);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du produit:', error);
      toast.error(`Une erreur est survenue: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-indigo-800">
            {isEdit ? 'Modifier le produit' : 'Ajouter un nouveau produit'}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Nom du produit */}
            <div className="col-span-2 md:col-span-1">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nom du produit *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                disabled={isLoading}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>
            
            {/* Catégorie */}
            <div className="col-span-2 md:col-span-1">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Catégorie *
              </label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${errors.category ? 'border-red-500' : 'border-gray-300'}`}
                disabled={isLoading}
              />
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
            </div>
            
            {/* Prix */}
            <div className="col-span-2 md:col-span-1">
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Prix (€) *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
                disabled={isLoading}
              />
              {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
            </div>
            
            {/* Statut */}
            <div className="col-span-2 md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  name="active"
                  checked={formData.active}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  disabled={isLoading}
                />
                <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
                  Produit actif
                </label>
              </div>
            </div>
            
            {/* Description */}
            <div className="col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className={`w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                disabled={isLoading}
              ></textarea>
              {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>
            
            {/* Image */}
            <div className="col-span-2">
              <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                Image du produit {!isEdit && '*'}
              </label>
              <div className="flex items-center">
                <input
                  type="file"
                  id="image"
                  name="image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={isLoading}
                />
                <label
                  htmlFor="image"
                  className="cursor-pointer bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-4 py-2 rounded-md border border-indigo-300 transition-colors"
                >
                  {imageFile || imagePreview ? 'Changer d\'image' : 'Sélectionner une image'}
                </label>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setImageFile(null);
                      setFormData(prev => ({ ...prev, imageUrl: '' }));
                    }}
                    className="ml-2 text-red-500 hover:text-red-700"
                    disabled={isLoading}
                  >
                    Supprimer
                  </button>
                )}
              </div>
              {errors.image && <p className="mt-1 text-sm text-red-600">{errors.image}</p>}
              
              {imagePreview && (
                <div className="mt-3">
                  <img 
                    src={imagePreview} 
                    alt="Prévisualisation" 
                    className="h-32 object-contain rounded-md border border-gray-300" 
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="mr-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              disabled={isLoading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center"
              disabled={isLoading}
            >
              {isLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isEdit ? 'Mettre à jour' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
