import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Loader2, Pencil, Trash2, Plus, Save, X, Image } from 'lucide-react';

interface Accessory {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  stock: number;
  isAvailable: boolean;
}

const AccessoriesManager: React.FC = () => {
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAccessory, setEditingAccessory] = useState<Partial<Accessory> | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchAccessories();
  }, []);

  const fetchAccessories = async () => {
    setLoading(true);
    try {
      const accessoriesCollection = collection(db, 'accessories');
      const accessoriesSnapshot = await getDocs(accessoriesCollection);
      const accessoriesList = accessoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Accessory[];
      
      setAccessories(accessoriesList);
      setErrorMessage(null);
    } catch (error) {
      console.error('Erreur lors du chargement des accessoires:', error);
      setErrorMessage('Erreur lors du chargement des accessoires. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingAccessory({
      name: '',
      description: '',
      price: 0,
      imageUrl: '',
      category: '',
      stock: 0,
      isAvailable: true
    });
    setIsAdding(true);
  };

  const handleEdit = (accessory: Accessory) => {
    setEditingAccessory({ ...accessory });
    setIsAdding(false);
  };

  const handleCancel = () => {
    setEditingAccessory(null);
    setErrorMessage(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (editingAccessory) {
      if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        setEditingAccessory({
          ...editingAccessory,
          [name]: checked
        });
      } else if (name === 'price' || name === 'stock') {
        setEditingAccessory({
          ...editingAccessory,
          [name]: parseFloat(value) || 0
        });
      } else {
        setEditingAccessory({
          ...editingAccessory,
          [name]: value
        });
      }
    }
  };

  const handleSave = async () => {
    if (!editingAccessory || !editingAccessory.name || !editingAccessory.description) {
      setErrorMessage('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    try {
      if (isAdding) {
        // Ajouter un nouvel accessoire
        const accessoryData = {
          ...editingAccessory,
          createdAt: new Date()
        };
        
        await addDoc(collection(db, 'accessories'), accessoryData);
        setSuccessMessage('Accessoire ajouté avec succès !');
      } else if (editingAccessory.id) {
        // Modifier un accessoire existant
        const accessoryRef = doc(db, 'accessories', editingAccessory.id);
        const { id, ...accessoryData } = editingAccessory;
        
        await updateDoc(accessoryRef, {
          ...accessoryData,
          updatedAt: new Date()
        });
        
        setSuccessMessage('Accessoire mis à jour avec succès !');
      }

      // Rafraîchir la liste
      fetchAccessories();
      
      // Réinitialiser le formulaire
      setEditingAccessory(null);
      
      // Masquer le message de succès après quelques secondes
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'accessoire:', error);
      setErrorMessage('Erreur lors de l\'enregistrement. Veuillez réessayer.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet accessoire ?')) {
      try {
        await deleteDoc(doc(db, 'accessories', id));
        setAccessories(accessories.filter(accessory => accessory.id !== id));
        setSuccessMessage('Accessoire supprimé avec succès !');
        
        // Masquer le message de succès après quelques secondes
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'accessoire:', error);
        setErrorMessage('Erreur lors de la suppression. Veuillez réessayer.');
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Gestion des Accessoires</h2>
        <button
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
        >
          <Plus size={16} />
          Ajouter un accessoire
        </button>
      </div>

      {errorMessage && (
        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Loader2 className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Save className="h-5 w-5 text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
        </div>
      ) : (
        <>
          {editingAccessory ? (
            <div className="bg-gray-50 p-4 rounded-md mb-6">
              <h3 className="text-lg font-medium mb-4">
                {isAdding ? 'Ajouter un accessoire' : 'Modifier un accessoire'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editingAccessory.name || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catégorie
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={editingAccessory.category || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix (€) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={editingAccessory.price || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={editingAccessory.stock || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL de l'image
                  </label>
                  <input
                    type="text"
                    name="imageUrl"
                    value={editingAccessory.imageUrl || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={editingAccessory.description || ''}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  ></textarea>
                </div>
                
                <div className="col-span-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isAvailable"
                      checked={editingAccessory.isAvailable || false}
                      onChange={(e) => {
                        if (editingAccessory) {
                          setEditingAccessory({
                            ...editingAccessory,
                            isAvailable: e.target.checked
                          });
                        }
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Disponible à la vente</span>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2"
                >
                  <X size={16} />
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors duration-200 flex items-center gap-2"
                >
                  <Save size={16} />
                  Enregistrer
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {accessories.length > 0 ? (
                    accessories.map((accessory) => (
                      <tr key={accessory.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {accessory.imageUrl ? (
                            <img 
                              src={accessory.imageUrl} 
                              alt={accessory.name}
                              className="h-10 w-10 object-cover rounded-md"
                            />
                          ) : (
                            <div className="h-10 w-10 bg-gray-100 flex items-center justify-center rounded-md">
                              <Image size={16} className="text-gray-400" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{accessory.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{accessory.category || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{accessory.price.toFixed(2)} €</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{accessory.stock}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {accessory.isAvailable ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Disponible
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Indisponible
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEdit(accessory)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(accessory.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                        Aucun accessoire trouvé. Cliquez sur "Ajouter un accessoire" pour commencer.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AccessoriesManager;
