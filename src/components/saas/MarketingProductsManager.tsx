import React, { useState, useEffect } from 'react';
import { 
  getMarketingProducts, 
  addMarketingProduct, 
  updateMarketingProduct, 
  MarketingProduct, 
  generateSignedUrl,
  refreshProductVideoUrl
} from '../../services/marketingProductsService';
import { toast } from 'react-hot-toast';
import ProductModalSimple from './ProductModalSimple';
import ExactProductDelete from './ExactProductDelete';
import { FiVideo, FiX, FiRefreshCw } from 'react-icons/fi';

/**
 * Composant pour la gestion des produits marketing
 */
const MarketingProductsManager: React.FC = () => {
  const [products, setProducts] = useState<MarketingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MarketingProduct | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // États pour la modale vidéo
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string>('');
  
  // Référence pour contrôler la throttling du chargement
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const FETCH_COOLDOWN_MS = 2000; // Délai minimal entre deux chargements (2 secondes)
  
  // Charger les produits au chargement du composant
  useEffect(() => {
    // Premier chargement au montage du composant
    fetchProducts(true);
  }, []);
  
  // Fonction pour récupérer les produits depuis Firestore
  const fetchProducts = async (forceRefresh = false) => {
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
      console.log('Début du chargement des produits marketing...');
      const productsList = await getMarketingProducts();
      console.log(`${productsList.length} produits marketing chargés`); 
      setProducts(productsList);
    } catch (err) {
      setError('Erreur lors du chargement des produits marketing');
      console.error('Erreur lors du chargement des produits marketing:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Filtre les produits en fonction du terme de recherche
  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Handler pour éditer un produit
  const handleEditClick = (product: MarketingProduct) => {
    setSelectedProduct(product);
    setIsEditing(true);
    setShowProductModal(true);
  };
  
  // Handler pour supprimer un produit dans l'interface d'Administration SaaS
  // La fonction handleDeleteClick a été remplacée par le composant DeleteProductButton

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
      toast.error('Aucune vidéo disponible pour ce produit');
    }
  };
  
  // Fonction pour actualiser l'URL vidéo d'un produit spécifique
  const handleRefreshVideoUrl = async (productId: string, videoUrl: string) => {
    if (!videoUrl) {
      toast.error('Ce produit n\'a pas de vidéo à actualiser');
      return;
    }
    
    try {
      toast.loading('Actualisation de l\'URL vidéo en cours...');
      const success = await refreshProductVideoUrl(productId);
      toast.dismiss();
      
      if (success) {
        toast.success('URL vidéo actualisée avec succès');
        fetchProducts(); // Rafraîchir la liste des produits
      } else {
        toast.error('Impossible d\'actualiser l\'URL vidéo');
      }
    } catch (error) {
      toast.dismiss();
      console.error('Erreur lors de l\'actualisation de l\'URL vidéo:', error);
      toast.error('Erreur lors de l\'actualisation de l\'URL vidéo');
    }
  };
  
  // Fonction pour actualiser toutes les URL vidéo des produits
  const refreshAllVideoUrls = async () => {
    try {
      toast.loading('Actualisation de toutes les URL vidéo en cours...');
      let refreshCount = 0;
      let failCount = 0;
      
      // Filtrer uniquement les produits avec une URL vidéo
      const productsWithVideo = products.filter(p => p.videoUrl);
      
      if (productsWithVideo.length === 0) {
        toast.dismiss();
        toast.success('Aucun produit avec vidéo à actualiser'); // Changé de info à success pour corriger l'erreur de lint
        return;
      }
      
      // Actualiser chaque URL vidéo
      await Promise.all(
        productsWithVideo.map(async (product) => {
          const success = await refreshProductVideoUrl(product.id);
          if (success) {
            refreshCount++;
          } else {
            failCount++;
          }
        })
      );
      
      toast.dismiss();
      if (failCount === 0) {
        toast.success(`${refreshCount} URL vidéo actualisées avec succès`);
      } else {
        toast.success(`${refreshCount} URL vidéo actualisées, ${failCount} échecs`);
      }
      
      fetchProducts(); // Rafraîchir la liste
    } catch (error) {
      toast.dismiss();
      console.error('Erreur lors de l\'actualisation des URL vidéo:', error);
      toast.error('Erreur lors de l\'actualisation des URL vidéo');
    }
  };

  // Handler pour basculer l'état actif d'un produit
  const handleToggleActive = async (product: MarketingProduct) => {
    try {
      await updateMarketingProduct(product.id, { active: !product.active });
      toast.success(`Produit ${product.active ? 'désactivé' : 'activé'} avec succès`);
      fetchProducts();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du produit:', error);
      toast.error('Erreur lors de la mise à jour du produit');
    }
  };
  
  // La fonction de suppression directe a été retirée et remplacée par le composant ExactProductDelete

  // Handler pour sauvegarder un produit (ajout ou modification)
  const handleSaveProduct = async (productData: Partial<MarketingProduct>): Promise<boolean> => {
    try {
      if (isEditing && selectedProduct) {
        // Mise à jour d'un produit existant
        const success = await updateMarketingProduct(selectedProduct.id, productData);
        if (success) {
          fetchProducts(); // Rafraîchir la liste
          return true;
        }
        return false;
      } else {
        // Ajout d'un nouveau produit
        const newProduct = await addMarketingProduct(productData as Omit<MarketingProduct, 'id'>);
        if (newProduct) {
          // Si un objet produit est retourné, l'ajout a réussi
          fetchProducts(); // Rafraîchir la liste
          return true;
        }
        return false;
      }
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du produit:', err);
      return false;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Produits marketing</h2>
          <p className="text-sm text-gray-600">Gérez vos produits et services marketing</p>
        </div>
        
        <div className="flex gap-3">
          {/* Bouton pour ajouter un nouveau produit */}
          <button
            onClick={() => {
              setSelectedProduct(null);
              setIsEditing(false);
              setShowProductModal(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded flex items-center"
          >
            <span className="mr-1">+</span> Ajouter un produit
          </button>
          
          {/* Bouton pour actualiser toutes les URL vidéo */}
          <button
            onClick={refreshAllVideoUrls}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded flex items-center"
            title="Actualiser toutes les URL vidéo pour garantir leur accès"
          >
            <FiRefreshCw className="mr-2" /> Actualiser les URL vidéo
          </button>
        </div>
      </div>
      
      {/* Les sections de test ont été supprimées */}
      
      {/* Barre de recherche */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Rechercher un produit..."
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
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {searchTerm ? 'Aucun produit ne correspond à votre recherche' : 'Aucun produit disponible'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vidéo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="h-12 w-12 object-cover rounded-md"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-gray-200 rounded-md flex items-center justify-center">
                        <span className="text-gray-400">N/A</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.videoUrl ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleVideoClick(product.videoUrl || '')}
                          className="flex items-center justify-center h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
                          title="Voir la vidéo"
                        >
                          <FiVideo size={16} />
                        </button>
                        <button
                          onClick={() => handleRefreshVideoUrl(product.id, product.videoUrl || '')}
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
                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{product.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{product.price} €</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span 
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {product.active ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEditClick(product)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleToggleActive(product)}
                      className={`${
                        product.active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                      } mr-4`}
                    >
                      {product.active ? 'Désactiver' : 'Activer'}
                    </button>
                    <ExactProductDelete 
                      productId={product.id} 
                      onSuccess={fetchProducts} 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal pour ajouter/éditer un produit */}
      {showProductModal && (
        <ProductModalSimple
          isOpen={showProductModal}
          onClose={() => setShowProductModal(false)}
          onSave={handleSaveProduct}
          product={selectedProduct}
          isEdit={isEditing}
        />
      )}

      {/* Modal pour visualiser la vidéo */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-3xl w-full max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Vidéo du produit</h3>
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
    </div>
  );
};

export default MarketingProductsManager;
