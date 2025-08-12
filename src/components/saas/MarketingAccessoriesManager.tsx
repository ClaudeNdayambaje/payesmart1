import React, { useState, useEffect } from 'react';
import { 
  getMarketingAccessories, 
  updateMarketingAccessory, 
  deleteMarketingAccessory,
  MarketingAccessory 
} from '../../services/marketingAccessoriesService';
import { toast } from 'react-hot-toast';

/**
 * Composant pour la gestion des accessoires marketing
 */
const MarketingAccessoriesManager: React.FC = () => {
  const [accessories, setAccessories] = useState<MarketingAccessory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // États pour les modaux qui seront implémentés plus tard - commentés car non utilisés actuellement
  // Nous les décommentons dès que les modaux seront implémentés
  // const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  // const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // const [editingAccessory, setEditingAccessory] = useState<MarketingAccessory | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Charger les accessoires au chargement du composant
  useEffect(() => {
    fetchAccessories();
  }, []);
  
  // Fonction pour récupérer les accessoires depuis Firestore
  const fetchAccessories = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const accessoriesList = await getMarketingAccessories();
      setAccessories(accessoriesList);
    } catch (err) {
      setError('Erreur lors du chargement des accessoires marketing');
      console.error('Erreur lors du chargement des accessoires marketing:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Filtre les accessoires en fonction du terme de recherche
  const filteredAccessories = accessories.filter(accessory => 
    accessory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    accessory.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    accessory.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Handler pour ouvrir le modal d'ajout (sera implémenté plus tard)
  const handleAddClick = () => {
    // Fonctionnalité commentée jusqu'à l'implémentation des modaux
    // setEditingAccessory(null);
    // setIsAddModalOpen(true);
    console.log('Ajout d\'un accessoire marketing - Fonctionnalité à implémenter');
    toast('La fonctionnalité d\'ajout d\'accessoires sera disponible prochainement');
  };
  
  // Handler pour ouvrir le modal d'édition (sera implémenté plus tard)
  const handleEditClick = (accessory: MarketingAccessory) => {
    // Fonctionnalité commentée jusqu'à l'implémentation des modaux
    // setEditingAccessory(accessory);
    // setIsEditModalOpen(true);
    console.log('Modification de l\'accessoire:', accessory.id);
    toast('La fonctionnalité de modification d\'accessoires sera disponible prochainement');
  };
  
  // Handler pour supprimer un accessoire
  const handleDeleteClick = async (accessoryId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet accessoire ? Cette action est irréversible.')) {
      try {
        const success = await deleteMarketingAccessory(accessoryId);
        
        if (success) {
          toast.success('Accessoire supprimé avec succès');
          fetchAccessories(); // Rafraîchir la liste
        } else {
          toast.error('Erreur lors de la suppression de l\'accessoire');
        }
      } catch (err) {
        toast.error('Erreur lors de la suppression de l\'accessoire');
        console.error('Erreur lors de la suppression de l\'accessoire:', err);
      }
    }
  };
  
  // Handler pour basculer l'état actif d'un accessoire
  const handleToggleActive = async (accessory: MarketingAccessory) => {
    try {
      // Déterminer l'état actuel (converti en booléen)
      const isCurrentlyActive = typeof accessory.active === 'string'
        ? ['true', 'actif', 'actifs', 'active', 'disponible', 'oui', 'yes', '1'].includes(accessory.active.toLowerCase())
        : !!accessory.active;
      
      // Toujours enregistrer un booléen true/false dans Firestore pour la cohérence
      const success = await updateMarketingAccessory(accessory.id, { 
        active: !isCurrentlyActive,
        // S'assurer que l'accessoire a toujours un businessId
        businessId: accessory.businessId || 'Hrk3nn1HVlcHOJ7InqK1'
      });
      
      if (success) {
        toast.success(`Accessoire ${!isCurrentlyActive ? 'activé' : 'désactivé'} avec succès`);
        fetchAccessories(); // Rafraîchir la liste
      } else {
        toast.error(`Erreur lors de ${!isCurrentlyActive ? 'l\'activation' : 'la désactivation'} de l'accessoire`);
      }
    } catch (err) {
      toast.error(`Erreur lors de la mise à jour de l'accessoire`);
      console.error('Erreur lors de la mise à jour de l\'accessoire:', err);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-indigo-800">Gestion des Accessoires Marketing</h1>
        <button
          onClick={handleAddClick}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
        >
          Ajouter un accessoire
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Rechercher un accessoire..."
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Affichage des erreurs */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Chargement */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : filteredAccessories.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {searchTerm ? 'Aucun accessoire ne correspond à votre recherche' : 'Aucun accessoire disponible'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAccessories.map((accessory) => (
                <tr key={accessory.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {accessory.imageUrl ? (
                      <img 
                        src={accessory.imageUrl} 
                        alt={accessory.name} 
                        className="h-12 w-12 object-cover rounded-md"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-gray-200 rounded-md flex items-center justify-center">
                        <span className="text-gray-400">N/A</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{accessory.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{accessory.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{accessory.price} €</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{accessory.stock || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span 
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        // Vérifier si l'accessoire est actif, quelle que soit la forme du champ
                        (typeof accessory.active === 'string'
                          ? ['true', 'actif', 'actifs', 'active', 'disponible', 'oui', 'yes', '1'].includes(accessory.active.toLowerCase())
                          : !!accessory.active)
                        ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {(typeof accessory.active === 'string'
                        ? ['true', 'actif', 'actifs', 'active', 'disponible', 'oui', 'yes', '1'].includes(accessory.active.toLowerCase())
                        : !!accessory.active) 
                        ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEditClick(accessory)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleToggleActive(accessory)}
                      className={`${
                        (typeof accessory.active === 'string'
                        ? ['true', 'actif', 'actifs', 'active', 'disponible', 'oui', 'yes', '1'].includes(accessory.active.toLowerCase())
                        : !!accessory.active) 
                        ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                      } mr-4`}
                    >
                      {(typeof accessory.active === 'string'
                        ? ['true', 'actif', 'actifs', 'active', 'disponible', 'oui', 'yes', '1'].includes(accessory.active.toLowerCase())
                        : !!accessory.active) 
                        ? 'Désactiver' : 'Activer'}
                    </button>
                    <button
                      onClick={() => handleDeleteClick(accessory.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Ici, nous ajouterons plus tard les composants modaux pour l'ajout et l'édition */}
      
    </div>
  );
};

export default MarketingAccessoriesManager;
