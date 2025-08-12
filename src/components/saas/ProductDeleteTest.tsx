import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { doc, deleteDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

/**
 * Interface pour les produits
 */
interface Product {
  id: string;
  name?: string;
  price?: number;
  category?: string;
  imageUrl?: string;
}

/**
 * Composant de test spécifique pour diagnostiquer les problèmes de suppression
 */
const ProductDeleteTest: React.FC = () => {
  const [productId, setProductId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Charger la liste des produits au chargement du composant
  useEffect(() => {
    loadProducts();
  }, []);

  // Fonction pour charger les produits depuis Firestore
  const loadProducts = async () => {
    setIsLoading(true);
    addLog('🔍 Recherche des produits dans la collection "produits"...');
    
    try {
      const productsCollection = collection(db, 'produits');
      const productsSnapshot = await getDocs(productsCollection);
      
      if (productsSnapshot.empty) {
        addLog('⚠️ Aucun produit trouvé dans la collection');
        setProducts([]);
        setIsLoading(false);
        return;
      }
      
      const productsList: Product[] = [];
      productsSnapshot.forEach(doc => {
        const data = doc.data();
        productsList.push({
          id: doc.id,
          name: data.name || 'Sans nom',
          price: data.price,
          category: data.category,
          imageUrl: data.imageUrl
        });
      });
      
      addLog(`✅ ${productsList.length} produits trouvés`);
      setProducts(productsList);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      addLog(`❌ Erreur lors du chargement des produits: ${errorMessage}`);
      toast.error(`Erreur lors du chargement des produits: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour sélectionner un produit
  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setProductId(product.id);
    addLog(`🔎 Produit sélectionné: ${product.name} (ID: ${product.id})`);
  };
  
  // Ajouter des logs pour le débogage
  const addLog = (message: string) => {
    setLogs(prevLogs => [...prevLogs, `${new Date().toISOString().slice(11, 19)} - ${message}`]);
    console.log(message);
  };

  // Fonction de suppression directe utilisant Firebase
  const deleteProduct = async () => {
    if (!productId.trim()) {
      toast.error('Veuillez entrer un ID de produit valide');
      return;
    }

    setIsDeleting(true);
    setStatus('Suppression en cours...');
    addLog(`🚀 Démarrage de la suppression pour l'ID: ${productId}`);

    try {
      // Vérifier si le produit existe
      addLog(`🔍 Vérification de l'existence du document...`);
      const productRef = doc(db, 'produits', productId);
      const productSnap = await getDoc(productRef);

      if (!productSnap.exists()) {
        addLog(`⚠️ Le produit avec l'ID ${productId} n'existe pas`);
        setStatus(`Le produit avec l'ID ${productId} n'existe pas`);
        toast.error(`Le produit n'existe pas`);
        setIsDeleting(false);
        return;
      }

      // Produit trouvé, procéder à la suppression
      const productData = productSnap.data();
      addLog(`✅ Produit trouvé: ${JSON.stringify(productData?.name || 'Sans nom')}`);

      // Suppression directe avec Firestore
      addLog(`⚡ Exécution de la commande deleteDoc...`);
      await deleteDoc(productRef);
      
      // Vérification post-suppression
      const checkSnap = await getDoc(productRef);
      
      if (!checkSnap.exists()) {
        addLog(`🎉 Produit supprimé avec succès!`);
        setStatus('Suppression réussie!');
        toast.success('Produit supprimé avec succès');
      } else {
        addLog(`❌ Le produit existe encore après la suppression`);
        setStatus('Échec de la suppression - le produit existe toujours');
        toast.error('Échec de la suppression');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      addLog(`❌ ERREUR: ${errorMessage}`);
      if (error instanceof Error && error.stack) {
        addLog(`📜 Stack: ${error.stack.split('\n').slice(0, 3).join(' | ')}`);
      }
      setStatus(`Erreur: ${errorMessage}`);
      toast.error(`Erreur lors de la suppression: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Fonction pour vider les logs
  const clearLogs = () => {
    setLogs([]);
    setStatus('');
  };

  return (
    <div className="space-y-6">
      {/* Liste des produits disponibles */}
      <div>
        <h3 className="text-md font-medium text-gray-800 mb-2">Produits disponibles:</h3>
        <div className="border rounded-md overflow-hidden">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Chargement des produits...</div>
          ) : products.length === 0 ? (
            <div className="p-4 text-center text-gray-500">Aucun produit disponible</div>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prix
                    </th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Catégorie
                    </th>
                    <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr 
                      key={product.id} 
                      className={`hover:bg-red-50 ${selectedProduct?.id === product.id ? 'bg-red-50' : ''}`}
                    >
                      <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                        <span className="font-mono">{product.id.substring(0, 12)}...</span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm">
                        {product.name || 'Sans nom'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm">
                        {product.price ? `${product.price} €` : '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm">
                        {product.category || '-'}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-right">
                        <button 
                          onClick={() => handleProductSelect(product)}
                          className="text-red-600 hover:text-red-800 text-xs font-medium"
                        >
                          Sélectionner
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Section de suppression */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-md font-medium text-gray-800 mb-2">Supprimer un produit:</h3>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            name="productId"
            id="productId"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
            placeholder="ID du produit à supprimer"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            readOnly={selectedProduct !== null}
          />
          <button
            onClick={deleteProduct}
            disabled={!productId.trim() || isDeleting}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              !productId.trim() || isDeleting
                ? 'bg-red-300 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
            }`}
          >
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
        <div className="mt-2 text-sm text-gray-500">{status}</div>
      </div>
      
      {/* Logs de débogage */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex justify-between items-center">
          <h3 className="text-md font-medium text-gray-800">Logs de débogage:</h3>
          <button 
            onClick={clearLogs} 
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Effacer les logs
          </button>
        </div>
        <div className="mt-2 max-h-60 overflow-y-auto bg-gray-50 p-2 rounded text-xs font-mono">
          {logs.length === 0 ? (
            <div className="text-gray-400">Aucun log disponible</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-6 text-sm text-gray-600">
        <p>
          <strong>Instructions:</strong> Entrez l'ID du produit que vous souhaitez supprimer et cliquez sur le bouton "Supprimer".
          Les logs de débogage s'afficheront ci-dessus pour vous aider à diagnostiquer les problèmes.
        </p>
      </div>
    </div>
  );
};

export default ProductDeleteTest;
