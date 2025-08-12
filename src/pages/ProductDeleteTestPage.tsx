import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

interface Product {
  id: string;
  name?: string;
  price?: number;
  description?: string;
  imageUrl?: string;
  active?: boolean;
}

/**
 * Page de test dédiée à la suppression de produits
 * Cette page est complètement isolée et indépendante
 */
const ProductDeleteTestPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Ajouter un log
  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setLogs(prevLogs => [logMessage, ...prevLogs]);
  };

  // Charger les produits
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    addLog('🔍 Chargement des produits...');

    try {
      const productsCollection = collection(db, 'produits');
      const productsSnapshot = await getDocs(productsCollection);
      
      const productsList: Product[] = [];
      productsSnapshot.forEach(doc => {
        const data = doc.data();
        productsList.push({
          id: doc.id,
          name: data.name || 'Sans nom',
          price: data.price,
          description: data.description,
          imageUrl: data.imageUrl,
          active: data.active
        });
      });
      
      addLog(`✅ ${productsList.length} produits trouvés`);
      setProducts(productsList);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      addLog(`❌ Erreur lors du chargement des produits: ${errorMessage}`);
      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction pour supprimer un produit
  const deleteProduct = async () => {
    if (!selectedProductId || selectedProductId.trim() === '') {
      toast.error('Aucun produit sélectionné');
      return;
    }
    
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      return;
    }

    setIsDeleting(true);
    addLog(`🚀 Démarrage de la suppression pour l'ID: ${selectedProductId}`);

    try {
      // Vérifier si le produit existe
      addLog(`🔍 Vérification de l'existence du document...`);
      const productRef = doc(db, 'produits', selectedProductId);
      const productSnap = await getDoc(productRef);

      if (!productSnap.exists()) {
        addLog(`⚠️ Le produit avec l'ID ${selectedProductId} n'existe pas`);
        toast.error(`Le produit n'existe pas`);
        setIsDeleting(false);
        return;
      }

      // Produit trouvé, procéder à la suppression
      const productData = productSnap.data();
      addLog(`✅ Produit trouvé: ${productData?.name || 'Sans nom'}`);

      // Suppression directe avec Firestore
      addLog(`⚡ Exécution de la commande deleteDoc...`);
      await deleteDoc(productRef);
      
      // Vérification post-suppression
      const checkSnap = await getDoc(productRef);
      
      if (!checkSnap.exists()) {
        addLog(`🎉 Produit supprimé avec succès!`);
        toast.success('Produit supprimé avec succès');
        loadProducts(); // Recharger la liste
        setSelectedProductId('');
      } else {
        addLog(`❌ Le produit existe encore après la suppression`);
        toast.error('Échec de la suppression - le produit existe toujours');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      addLog(`❌ ERREUR: ${errorMessage}`);
      if (error instanceof Error && error.stack) {
        addLog(`📜 Stack: ${error.stack.split('\n').slice(0, 3).join(' | ')}`);
      }
      toast.error(`Erreur lors de la suppression: ${errorMessage}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Test de Suppression de Produits</h1>
      
      <div className="mb-6 p-4 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Sélection et Suppression</h2>
        
        <div className="flex items-center mb-4">
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="flex-grow p-2 border rounded mr-2"
            disabled={isLoading || isDeleting}
          >
            <option value="">-- Sélectionnez un produit --</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>
                {product.name || 'Sans nom'} (ID: {product.id.substring(0, 8)}...)
              </option>
            ))}
          </select>
          
          <button
            onClick={deleteProduct}
            disabled={!selectedProductId || isDeleting}
            className={`px-4 py-2 font-bold rounded ${
              !selectedProductId || isDeleting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </button>
        </div>
        
        <button
          onClick={loadProducts}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-blue-500 text-white font-bold rounded hover:bg-blue-700"
        >
          {isLoading ? 'Chargement...' : 'Rafraîchir la liste des produits'}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Liste des produits */}
        <div className="bg-white rounded shadow p-4">
          <h2 className="text-xl font-semibold mb-4">Liste des produits ({products.length})</h2>
          
          {products.length === 0 ? (
            <p className="text-gray-500 italic">Aucun produit trouvé</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">ID (court)</th>
                    <th className="px-4 py-2 text-left">Nom</th>
                    <th className="px-4 py-2 text-left">Prix</th>
                    <th className="px-4 py-2 text-left">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id} className="border-b">
                      <td className="px-4 py-2 font-mono text-sm">{product.id.substring(0, 8)}...</td>
                      <td className="px-4 py-2">{product.name || 'Sans nom'}</td>
                      <td className="px-4 py-2">{product.price ? `${product.price} €` : '-'}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-block px-2 py-1 rounded text-xs ${
                          product.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Logs */}
        <div className="bg-white rounded shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Logs</h2>
            <button
              onClick={() => setLogs([])}
              className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
            >
              Effacer
            </button>
          </div>
          
          <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm h-96 overflow-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">Aucun log pour le moment...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <a href="#/admin/saas" className="text-blue-500 hover:underline">
          Retour à l'administration
        </a>
      </div>
    </div>
  );
};

export default ProductDeleteTestPage;
