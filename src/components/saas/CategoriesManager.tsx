import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { 
  getMarketingCategories
} from '../../services/marketingCategoryService';
import { 
  addCategory, 
  deleteCategory 
} from '../../services/categoryService';
import { Category } from '../../types';

// Fonction utilitaire pour formater les dates de manière sécurisée
const formatDate = (dateValue: any): string => {
  if (!dateValue) return 'Date inconnue';
  
  try {
    // Si c'est déjà une date
    if (dateValue instanceof Date) {
      return dateValue.toLocaleDateString();
    }
    
    // Si c'est une chaîne de caractères
    if (typeof dateValue === 'string') {
      return new Date(dateValue).toLocaleDateString();
    }
    
    // Si c'est un timestamp Firestore
    if (dateValue.toDate && typeof dateValue.toDate === 'function') {
      return dateValue.toDate().toLocaleDateString();
    }
    
    // Fallback
    return 'Date inconnue';
  } catch (error) {
    console.error('Erreur lors du formatage de la date:', error);
    return 'Date inconnue';
  }
};

// Fonction pour normaliser une catégorie et s'assurer que tous les champs sont sécurisés pour l'affichage
const normalizeCategoryForDisplay = (category: any): Category => {
  // Créer un objet de base avec les propriétés requises
  const normalizedCategory: any = {
    id: category.id || '',
    name: typeof category.name === 'string' ? category.name : '',
    businessId: category.businessId || '',
  };
  
  // Ajouter createdAt en vérifiant qu'il existe
  if (category.createdAt !== undefined) {
    normalizedCategory.createdAt = category.createdAt;
  } else {
    normalizedCategory.createdAt = null;
  }
  
  // Ajouter les champs optionnels
  if (category.description !== undefined) {
    normalizedCategory.description = category.description;
  }
  
  if (category.active !== undefined) {
    normalizedCategory.active = !!category.active;
  }
  
  // Retourner avec un casting explicite pour éviter les erreurs TypeScript
  return normalizedCategory as Category;
};

interface CategoriesManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onCategorySelect?: (category: string) => void;
}

const CategoriesManager: React.FC<CategoriesManagerProps> = ({ 
  isOpen, 
  onClose,
  onCategorySelect
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  // États pour la gestion du modal de confirmation de suppression
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{id: string, name: string} | null>(null);

  // Charger les catégories au montage du composant
  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  // Récupérer les catégories marketing depuis les accessoires existants
  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const fetchedCategories = await getMarketingCategories();
      console.log("📋 Catégories marketing récupérées:", fetchedCategories.length);
      
      // Normaliser chaque catégorie pour éviter les problèmes d'affichage
      const normalizedCategories = fetchedCategories.map((cat: any) => normalizeCategoryForDisplay(cat));
      setCategories(normalizedCategories);
    } catch (error) {
      console.error("❌ Erreur lors de la récupération des catégories marketing:", error);
      toast.error("Erreur lors du chargement des catégories");
    } finally {
      setIsLoading(false);
    }
  };

  // Ajouter une nouvelle catégorie
  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Le nom de la catégorie ne peut pas être vide");
      return;
    }

    setIsAdding(true);
    try {
      console.log("➕ Ajout d'une nouvelle catégorie:", newCategoryName.trim());
      
      // Vérifier si la catégorie existe déjà localement (insensible à la casse)
      const categoryExists = categories.some(
        cat => cat.name.toLowerCase() === newCategoryName.trim().toLowerCase()
      );
      
      if (categoryExists) {
        toast.error(`La catégorie "${newCategoryName.trim()}" existe déjà`);
        return;
      }
      
      // Ajouter la catégorie à Firestore
      // La fonction addCategory n'attend que le nom de la catégorie
      const newCategory = await addCategory(newCategoryName.trim());
      
      if (newCategory) {
        toast.success(`Catégorie "${newCategoryName.trim()}" ajoutée avec succès`);
        setNewCategoryName('');
        
        // Actualiser la liste des catégories en normalisant les données
        // Au lieu d'appeler fetchCategories() qui fait un nouvel appel à Firestore
        // On peut ajouter directement la catégorie normalisée à la liste existante
        const normalizedNewCategory = normalizeCategoryForDisplay(newCategory);
        setCategories(prevCategories => [...prevCategories, normalizedNewCategory].sort((a, b) => a.name.localeCompare(b.name)));
      } else {
        toast.error("Erreur lors de l'ajout de la catégorie");
      }
    } catch (error) {
      console.error("❌ Erreur lors de l'ajout de la catégorie:", error);
      toast.error("Erreur lors de l'ajout de la catégorie");
    } finally {
      setIsAdding(false);
    }
  };

  // Supprimer une catégorie
  // Ouvre le modal de confirmation avant de supprimer
  const openDeleteConfirm = (categoryId: string, categoryName: string) => {
    setCategoryToDelete({ id: categoryId, name: categoryName });
    setDeleteConfirmOpen(true);
  };
  
  // Ferme le modal de confirmation sans supprimer
  const closeDeleteConfirm = () => {
    setCategoryToDelete(null);
    setDeleteConfirmOpen(false);
  };
  
  // Fonction qui effectue réellement la suppression après confirmation
  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    
    const { id: categoryId, name: categoryName } = categoryToDelete;
    closeDeleteConfirm(); // Fermer le modal de confirmation
    
    const toastId = toast.loading(`Suppression de la catégorie "${categoryName}"...`);
    
    try {
      console.log(`🚮 Suppression de la catégorie: ${categoryName} (${categoryId})`);
      const success = await deleteCategory(categoryId);
      
      if (success) {
        toast.success(`Catégorie "${categoryName}" supprimée avec succès`, { id: toastId });
        // Actualiser la liste des catégories sans faire d'appel à Firestore
        setCategories(prevCategories => prevCategories.filter(cat => cat.id !== categoryId));
      } else {
        toast.error(`Erreur lors de la suppression de la catégorie "${categoryName}"`, { id: toastId });
      }
    } catch (error) {
      console.error(`❌ Erreur lors de la suppression de la catégorie ${categoryId}:`, error);
      toast.error(`Erreur lors de la suppression de la catégorie "${categoryName}"`, { id: toastId });
    }
  };

  // Sélectionner une catégorie (pour le modal accessoire)
  const handleSelectCategory = (categoryName: string) => {
    if (onCategorySelect && typeof categoryName === 'string') {
      // S'assurer que le nom est bien une chaîne
      onCategorySelect(categoryName);
      onClose();
    } else if (onCategorySelect) {
      // Fallback au cas où ce n'est pas une chaîne
      console.error("Le nom de catégorie n'est pas une chaîne valide:", categoryName);
      onCategorySelect("Catégorie non spécifiée");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Gestion des catégories</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <FiX size={24} />
          </button>
        </div>
        
        {/* Formulaire pour ajouter une nouvelle catégorie */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Ajouter une nouvelle catégorie</h3>
          <div className="flex">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-grow border border-gray-300 rounded-l-md px-3 py-2"
              placeholder="Nom de la catégorie"
            />
            <button
              onClick={handleAddCategory}
              disabled={isAdding || !newCategoryName.trim()}
              className={`px-4 py-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700 transition-colors flex items-center ${
                isAdding || !newCategoryName.trim() ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isAdding ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Ajout...
                </span>
              ) : (
                <span className="flex items-center">
                  <FiPlus size={16} className="mr-1" /> Ajouter
                </span>
              )}
            </button>
          </div>
        </div>
        
        {/* Liste des catégories existantes */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Catégories existantes</h3>
          
          {isLoading ? (
            <div className="flex justify-center my-8">
              <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucune catégorie disponible
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {categories.map((category) => (
                <li key={category.id} className="py-3 flex justify-between items-center">
                  <div className="flex-grow">
                    <span className="font-medium">
                      {typeof category.name === 'string' ? category.name : 'Nom inconnu'}
                    </span>
                    <span className="text-xs text-gray-500 ml-2">
                      {formatDate((category as any).createdAt)}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    {onCategorySelect && (
                      <button
                        onClick={() => handleSelectCategory(category.name)}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors text-sm"
                      >
                        Sélectionner
                      </button>
                    )}
                    <button
                      onClick={() => openDeleteConfirm(category.id, category.name)}
                      className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                      title={`Supprimer la catégorie ${category.name}`}
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      {/* Modal de confirmation de suppression */}
      {deleteConfirmOpen && categoryToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-auto shadow-xl">
            <h3 className="text-lg font-semibold mb-4">Confirmer la suppression</h3>
            <p className="mb-6">
              Êtes-vous sûr de vouloir supprimer la catégorie "{categoryToDelete.name}" ?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeDeleteConfirm}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteCategory}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesManager;
