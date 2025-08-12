import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import ExactProductDelete from './ExactProductDelete';

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
 * Page dédiée à la suppression de produits
 * Utilise le composant ExactProductDelete qui est une copie exacte de la logique de test
 */
const ProductDeletePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Charger la liste des produits
  useEffect(() => {
    loadProducts();
  }, [refreshTrigger]);

  // Fonction pour charger les produits depuis Firestore
  const loadProducts = async () => {
    setIsLoading(true);
    console.log('🔍 Chargement des produits...');
    
    try {
      const productsCollection = collection(db, 'produits');
      const productsSnapshot = await getDocs(productsCollection);
      
      if (productsSnapshot.empty) {
        console.log('⚠️ Aucun produit trouvé dans la collection');
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
      
      console.log(`✅ ${productsList.length} produits trouvés`);
      setProducts(productsList);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      console.log(`❌ Erreur lors du chargement des produits: ${errorMessage}`);
      toast.error(`Erreur lors du chargement des produits: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Rafraîchir la liste des produits
  const refreshProducts = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">Page de Suppression de Produits</h1>
      <p className="text-gray-600 mb-4 text-center">
        Cette page est dédiée au test de suppression de produits, avec exactement le même code que dans le test qui fonctionne.
      </p>
      
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Liste des produits</h2>
        <button
          onClick={refreshProducts}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          disabled={isLoading}
        >
          {isLoading ? 'Chargement...' : '🔄 Rafraîchir'}
        </button>
      </div>
      
      {isLoading ? (
        <p className="text-center my-6">Chargement des produits...</p>
      ) : (
        <>
          {products.length === 0 ? (
            <p className="text-center my-6">Aucun produit disponible</p>
          ) : (
            <table className="min-w-full bg-white border border-gray-300 rounded">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left">ID (court)</th>
                  <th className="px-4 py-2 text-left">Nom</th>
                  <th className="px-4 py-2 text-left">Prix</th>
                  <th className="px-4 py-2 text-left">Catégorie</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id} className="border-t border-gray-300">
                    <td className="px-4 py-2 font-mono text-sm">
                      {product.id.substring(0, 8)}...
                    </td>
                    <td className="px-4 py-2">{product.name || 'Sans nom'}</td>
                    <td className="px-4 py-2">{product.price ? `${product.price} €` : '-'}</td>
                    <td className="px-4 py-2">{product.category || '-'}</td>
                    <td className="px-4 py-2">
                      <ExactProductDelete
                        productId={product.id}
                        onSuccess={refreshProducts}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
      
      <div className="mt-6 p-4 border border-gray-300 rounded bg-gray-50">
        <h3 className="font-bold mb-2">Instructions :</h3>
        <ol className="list-decimal ml-6">
          <li className="mb-1">Cliquez sur "Supprimer Produit" à côté du produit que vous souhaitez supprimer</li>
          <li className="mb-1">Confirmez la suppression dans la boîte de dialogue</li>
          <li className="mb-1">Attendez que le processus de suppression se termine</li>
          <li className="mb-1">Vérifiez que le produit est supprimé de la liste</li>
        </ol>
      </div>
      
      <div className="mt-4 text-center">
        <button
          onClick={() => window.history.back()}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          Retour
        </button>
      </div>
    </div>
  );
};

export default ProductDeletePage;
