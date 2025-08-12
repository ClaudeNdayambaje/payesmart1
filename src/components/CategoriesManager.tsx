import React, { useState, useCallback } from 'react';
import { X, Plus, Trash2, Edit, Check } from 'lucide-react';

interface CategoriesManagerProps {
  categories: any[]; // Peut être des chaînes ou des objets avec une propriété 'name'
  onAddCategory: (category: string) => void;
  onDeleteCategory: (category: string) => void;
  onUpdateCategory: (oldCategory: string, newCategory: string) => void;
  onClose: () => void;
  productsInCategories: Record<string, number>;
}

const CategoriesManager: React.FC<CategoriesManagerProps> = ({
  categories,
  onAddCategory,
  onDeleteCategory,
  onUpdateCategory,
  onClose,
  productsInCategories,
}) => {
  // Fonction utilitaire pour normaliser les catégories (extraire le nom si c'est un objet)
  const getCategoryText = useCallback((category: any): string => {
    return typeof category === 'object' && category !== null && 'name' in category
      ? category.name
      : String(category);
  }, []);
  
  // Fonction pour vérifier si une catégorie existe déjà (en comparant les noms normalisés)
  const categoryExists = useCallback((categoryName: string): boolean => {
    return categories.some(cat => getCategoryText(cat).toLowerCase() === categoryName.toLowerCase());
  }, [categories, getCategoryText]);
  const [newCategory, setNewCategory] = useState('');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editedCategoryName, setEditedCategoryName] = useState('');
  const [error, setError] = useState('');

  const handleAddCategory = () => {
    const trimmedCategory = newCategory.trim();
    
    if (!trimmedCategory) {
      setError('Le nom de la catégorie ne peut pas être vide');
      return;
    }
    
    if (categoryExists(trimmedCategory)) {
      setError('Cette catégorie existe déjà');
      return;
    }
    
    onAddCategory(trimmedCategory);
    setNewCategory('');
    setError('');
  };

  const handleStartEditing = (category: any) => {
    setEditingCategory(category);
    setEditedCategoryName(getCategoryText(category));
    setError('');
  };

  const handleSaveEdit = () => {
    const trimmedCategory = editedCategoryName.trim();
    
    if (!trimmedCategory) {
      setError('Le nom de la catégorie ne peut pas être vide');
      return;
    }
    
    if (categoryExists(trimmedCategory) && trimmedCategory !== getCategoryText(editingCategory)) {
      setError('Cette catégorie existe déjà');
      return;
    }
    
    if (editingCategory) {
      onUpdateCategory(editingCategory, trimmedCategory);
      setEditingCategory(null);
      setError('');
    }
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setError('');
  };

  const handleDeleteCategory = (category: any) => {
    onDeleteCategory(getCategoryText(category));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Gestion des catégories</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Nouvelle catégorie"
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={handleAddCategory}
                className="theme-primary text-white px-4 py-2 rounded-lg hover:opacity-80 transition-colors flex items-center gap-2"
              >
                <Plus size={20} />
                Ajouter
              </button>
            </div>
            {error && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
          </div>
          
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Catégorie</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">Produits</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-4 text-center text-gray-500 dark:text-gray-400">
                      Aucune catégorie disponible
                    </td>
                  </tr>
                ) : (
                  categories.map((category, index) => {
                    const categoryText = getCategoryText(category);
                    return (
                    <tr key={index} className="border-t border-gray-200 dark:border-gray-700 dark:text-gray-300">
                      <td className="px-4 py-3">
                        {editingCategory === category ? (
                          <input
                            type="text"
                            value={editedCategoryName}
                            onChange={(e) => setEditedCategoryName(e.target.value)}
                            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                            autoFocus
                          />
                        ) : (
                          categoryText
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {productsInCategories[categoryText] || 0}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {editingCategory === category ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={handleSaveEdit}
                              className="theme-success-text hover:opacity-80 transition-colors p-1"
                              title="Enregistrer"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-1"
                              title="Annuler"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleStartEditing(category)}
                              className="theme-info-text hover:opacity-80 transition-colors p-1"
                              title="Modifier"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(category)}
                              className={`${
                                productsInCategories[categoryText] ? 'text-gray-400 cursor-not-allowed' : 'theme-danger-text hover:opacity-80'
                              } transition-colors p-1`}
                              disabled={productsInCategories[categoryText] > 0}
                              title={productsInCategories[categoryText] ? "Impossible de supprimer une catégorie contenant des produits" : "Supprimer"}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            <p>Note: Les catégories contenant des produits ne peuvent pas être supprimées.</p>
          </div>
        </div>
        
        <div className="p-5 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoriesManager;
