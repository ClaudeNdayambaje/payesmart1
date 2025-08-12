import React, { useState, useEffect } from 'react';
import { 
  getAccessories, 
  addAccessory, 
  updateAccessory, 
  Accessory, 
  deleteAccessory,
  generateSignedUrl,
  refreshAccessoryVideoUrl
} from '../../services/accessoiresService';
import { toast } from 'react-hot-toast';
import AccessoryModal from './AccessoryModal';
import CategoriesManager from './CategoriesManager';
import { FiVideo, FiX, FiRefreshCw, FiEdit, FiTrash2, FiPlusCircle, FiList } from 'react-icons/fi';

/**
 * Composant pour la gestion des accessoires marketing
 */
const AccessoriesMarketingManager: React.FC = () => {
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAccessoryModal, setShowAccessoryModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAccessory, setSelectedAccessory] = useState<Accessory | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // État pour le gestionnaire de catégories
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  
  // États pour la modale vidéo
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>('');
  
  // Référence pour contrôler la throttling du chargement
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const FETCH_COOLDOWN_MS = 2000; // Délai minimal entre deux chargements (2 secondes)
  
  // Charger les accessoires au chargement du composant
  useEffect(() => {
    // Premier chargement au montage du composant
    fetchAccessories(true);
  }, []);
  
  // Fonction pour récupérer les accessoires depuis Firestore
  const fetchAccessories = async (forceRefresh = false) => {
    // Vérification du throttling pour éviter les rechargements trop fréquents
    const now = Date.now();
    if (!forceRefresh && now - lastFetchTime < FETCH_COOLDOWN_MS) {
      console.log('Ignorer la demande de rechargement trop fréquente');
      return;
    }
    
    // Màj de l'heure du dernier chargement
    setLastFetchTime(now);

    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Récupération des accessoires de Firestore...');
      // Vider le cache de données
      if (window.caches) {
        try {
          console.log('🧹 Tentative de nettoyage du cache...');
          caches.keys().then(names => {
            names.forEach(name => {
              caches.delete(name);
              console.log(`🗑️ Cache '${name}' supprimé`);
            });
          });
        } catch (cacheError) {
          console.warn('⚠️ Erreur lors du nettoyage du cache:', cacheError);
        }
      }
      
      const fetchedAccessories = await getAccessories();
      console.log('✅ Accessoires récupérés:', fetchedAccessories.length);
      
      // Ajout d'un timestamp aux URLs des images pour éviter le cache
      const accessoriesWithFreshUrls = fetchedAccessories.map(acc => ({
        ...acc,
        imageUrl: acc.imageUrl && !acc.imageUrl.includes('placehold.co') ? 
          `${acc.imageUrl}${acc.imageUrl.includes('?') ? '&' : '?'}t=${Date.now()}` : 
          acc.imageUrl
      }));
      
      setAccessories(accessoriesWithFreshUrls);
    } catch (error) {
      setError('Erreur lors du chargement des accessoires');
      console.error('❌ Erreur lors de la récupération des accessoires:', error);
      toast.error('Erreur lors du chargement des accessoires');
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
  
  // Handler pour éditer un accessoire
  const handleEditClick = (accessory: Accessory) => {
    setSelectedAccessory(accessory);
    setIsEditing(true);
    setShowAccessoryModal(true);
  };
  
  // Fonction pour générer une URL signée avant d'afficher la vidéo
  const handleVideoClick = async (videoUrl: string) => {
    if (videoUrl) {
      try {
        // Générer une URL signée si nécessaire
        const signedUrl = await generateSignedUrl(videoUrl);
        if (signedUrl) {
          setCurrentVideoUrl(signedUrl);
          setShowVideoModal(true);
        } else {
          toast.error('Impossible de générer l\'URL de la vidéo');
        }
      } catch (error) {
        console.error('Erreur lors de la génération de l\'URL signée:', error);
        toast.error('Erreur de chargement de la vidéo');
      }
    } else {
      toast.error('Aucune vidéo disponible pour cet accessoire');
    }
  };
  
  // Fonction pour actualiser l'URL vidéo d'un accessoire spécifique
  const handleRefreshVideoUrl = async (accessoryId: string, videoUrl: string) => {
    if (!videoUrl) {
      toast.error('Pas d\'URL vidéo à actualiser');
      return;
    }
    
    const toastId = toast.loading('Actualisation de l\'URL vidéo...');
    
    try {
      const success = await refreshAccessoryVideoUrl(accessoryId);
      
      if (success) {
        toast.success('URL vidéo actualisée avec succès', {
          id: toastId
        });
        // Actualiser les données pour afficher la nouvelle URL
        fetchAccessories();
      } else {
        toast.error('Erreur lors de l\'actualisation de l\'URL vidéo', {
          id: toastId
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'actualisation de l\'URL vidéo:', error);
      toast.error('Erreur lors de l\'actualisation de l\'URL vidéo', {
        id: toastId
      });
    }
  };

  // Handler pour basculer l'état actif d'un accessoire
  const handleToggleActive = async (accessory: Accessory) => {
    const newActiveState = !accessory.active;
    const toastId = toast.loading(newActiveState ? 'Activation en cours...' : 'Désactivation en cours...');
    
    try {
      const success = await updateAccessory(accessory.id, { active: newActiveState });
      
      if (success) {
        toast.success(newActiveState ? 'Accessoire activé' : 'Accessoire désactivé', { id: toastId });
        // Mettre à jour la liste locale sans rechargement complet
        setAccessories(accessories.map(p => p.id === accessory.id ? { ...p, active: newActiveState } : p));
      } else {
        toast.error('Erreur lors du changement d\'état', { id: toastId });
      }
    } catch (error) {
      console.error('Erreur lors du changement d\'état:', error);
      toast.error('Erreur lors du changement d\'état', { id: toastId });
    }
  };

  // Handler pour basculer l'état de disponibilité d'un accessoire
  const handleToggleAvailability = async (accessory: Accessory) => {
    const newAvailabilityState = !accessory.availability;
    const toastId = toast.loading(newAvailabilityState ? 'Mise en disponibilité...' : 'Mise en indisponibilité...');
    
    try {
      const success = await updateAccessory(accessory.id, { availability: newAvailabilityState });
      
      if (success) {
        toast.success(newAvailabilityState ? 'Accessoire disponible' : 'Accessoire indisponible', { id: toastId });
        // Mettre à jour la liste locale sans rechargement complet
        setAccessories(accessories.map(p => p.id === accessory.id ? { ...p, availability: newAvailabilityState } : p));
      } else {
        toast.error('Erreur lors du changement de disponibilité', { id: toastId });
      }
    } catch (error) {
      console.error('Erreur lors du changement de disponibilité:', error);
      toast.error('Erreur lors du changement de disponibilité', { id: toastId });
    }
  };

  // Handler pour sauvegarder un accessoire (ajout ou modification)
  const handleSaveAccessory = async (accessoryData: Partial<Accessory>): Promise<boolean> => {
    console.log("🔄 handleSaveAccessory appelé avec les données:", accessoryData);
    try {
      if (isEditing && selectedAccessory) {
        // Mise à jour d'un accessoire existant
        console.log(`📝 Mise à jour de l'accessoire ID: ${selectedAccessory.id}`);
        console.log(`🖼️ URL de l'image à enregistrer: ${accessoryData.imageUrl}`);
        
        // Forcer l'utilisation de la nouvelle URL d'image pour éviter les problèmes de cache
        const updatedData = {
          ...accessoryData,
          imageUrl: `${accessoryData.imageUrl}${accessoryData.imageUrl?.includes('?') ? '&' : '?'}t=${Date.now()}`
        };
        
        console.log(`🔄 URL d'image modifiée avec timestamp: ${updatedData.imageUrl}`);
        
        const success = await updateAccessory(selectedAccessory.id, updatedData);
        if (success) {
          console.log("✅ Mise à jour réussie de l'accessoire");
          // Rechargement après un délai pour laisser Firestore se synchroniser
          setTimeout(() => fetchAccessories(), 500);
        } else {
          console.error("❌ Échec de la mise à jour de l'accessoire");
        }
        return success;
      } else {
        // Ajout d'un nouvel accessoire
        console.log("➕ Ajout d'un nouvel accessoire");
        const newAccessory = await addAccessory(accessoryData as Omit<Accessory, 'id'>);
        if (newAccessory) {
          console.log("✅ Ajout réussi de l'accessoire avec ID:", newAccessory.id);
          // Rechargement après un délai pour laisser Firestore se synchroniser
          setTimeout(() => fetchAccessories(), 500);
          return true;
        }
        console.error("❌ Échec de l'ajout de l'accessoire");
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement de l\'accessoire:', error);
      return false;
    }
  };

  // Handler pour supprimer un accessoire
  const handleDeleteAccessory = async (accessoryId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet accessoire ? Cette action est irréversible.')) {
      return;
    }
    
    const toastId = toast.loading('Suppression de l\'accessoire...');
    
    try {
      const success = await deleteAccessory(accessoryId);
      
      if (success) {
        toast.success('Accessoire supprimé avec succès', { id: toastId });
        // Actualiser la liste des accessoires
        fetchAccessories();
      } else {
        toast.error('Erreur lors de la suppression de l\'accessoire', { id: toastId });
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'accessoire:', error);
      toast.error('Erreur lors de la suppression de l\'accessoire', { id: toastId });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Gestion des Accessoires</h2>
        <div className="flex space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher..."
              className="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowCategoriesModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center"
            title="Gérer les catégories d'accessoires"
          >
            <FiList className="mr-2" />
            Gérer les catégories
          </button>
          <button
            onClick={() => {
              setSelectedAccessory(null);
              setIsEditing(false);
              setShowAccessoryModal(true);
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center"
          >
            <FiPlusCircle className="mr-2" />
            Ajouter un accessoire
          </button>
        </div>
      </div>
      
      <div className="mb-6 flex items-center">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher un accessoire..."
          className="border border-gray-300 rounded-md px-4 py-2 w-64 mr-4"
        />
        <button
          onClick={() => fetchAccessories(true)}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md"
        >
          Actualiser la liste
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vidéo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAccessories.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    {searchTerm ? 'Aucun accessoire ne correspond à votre recherche' : 'Aucun accessoire disponible'}
                  </td>
                </tr>
              ) : (
                filteredAccessories.map((accessory) => (
                  <tr key={accessory.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {accessory.imageUrl ? (
                        <img
                          src={`${accessory.imageUrl}${accessory.imageUrl.includes('?') ? '&' : '?'}t=${Date.now()}`}
                          alt={accessory.name}
                          className="h-12 w-12 object-cover rounded-md"
                          loading="eager"
                          onError={(e) => {
                            console.log(`❌ Erreur de chargement d'image pour: ${accessory.name}`);
                            (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/EEE/31343C?text=N/A';
                          }}
                        />
                      ) : (
                        <div className="h-12 w-12 bg-gray-200 rounded-md flex items-center justify-center">
                          <span className="text-gray-500">N/A</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {accessory.videoUrl ? (
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleVideoClick(accessory.videoUrl || '')}
                            className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                            title="Voir la vidéo"
                          >
                            <FiVideo size={16} />
                          </button>
                          <button
                            onClick={() => handleRefreshVideoUrl(accessory.id, accessory.videoUrl || '')}
                            className="flex items-center justify-center h-8 w-8 rounded-full bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors"
                            title="Actualiser l'URL vidéo (générer URL signée)"
                          >
                            <FiRefreshCw size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400">Aucune vidéo</div>
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
                      <div className="text-sm text-gray-500">{accessory.stock || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <span 
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            accessory.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {accessory.active ? 'Actif' : 'Inactif'}
                        </span>
                        <span 
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            accessory.availability ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {accessory.availability ? 'Disponible' : 'Indisponible'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditClick(accessory)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Modifier"
                        >
                          <FiEdit size={18} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(accessory)}
                          className={`${
                            accessory.active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                          }`}
                          title={accessory.active ? 'Désactiver' : 'Activer'}
                        >
                          {accessory.active ? '🔴' : '🟢'}
                        </button>
                        <button
                          onClick={() => handleToggleAvailability(accessory)}
                          className={`${
                            accessory.availability ? 'text-yellow-600 hover:text-yellow-900' : 'text-blue-600 hover:text-blue-900'
                          }`}
                          title={accessory.availability ? 'Marquer comme indisponible' : 'Marquer comme disponible'}
                        >
                          {accessory.availability ? '📦' : '✓'}
                        </button>
                        <button
                          onClick={() => handleDeleteAccessory(accessory.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Supprimer"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal pour ajouter/éditer un accessoire */}
      {showAccessoryModal && (
        <AccessoryModal
          isOpen={showAccessoryModal}
          onClose={() => setShowAccessoryModal(false)}
          onSave={handleSaveAccessory}
          accessory={selectedAccessory}
          isEdit={isEditing}
        />
      )}

      {/* Modal pour visualiser la vidéo */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-3xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Vidéo de l'accessoire</h3>
              <button 
                onClick={() => setShowVideoModal(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="flex-grow overflow-auto">
              {currentVideoUrl && (
                <video 
                  src={currentVideoUrl} 
                  controls 
                  autoPlay 
                  className="w-full h-auto max-h-[70vh] rounded-lg"
                >
                  Votre navigateur ne prend pas en charge la lecture de vidéos.
                </video>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Modal pour gérer les catégories */}
      <CategoriesManager
        isOpen={showCategoriesModal}
        onClose={() => {
          setShowCategoriesModal(false);
          // Rafraîchir les accessoires après modification des catégories
          fetchAccessories(true);
        }}
      />
    </div>
  );
};

export default AccessoriesMarketingManager;
