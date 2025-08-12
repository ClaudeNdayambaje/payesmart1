import React, { useState } from 'react';
import { db } from '../../firebase';
import { doc, deleteDoc, getDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

interface DeleteProductButtonProps {
  productId: string;
  onSuccess?: () => void;
}

/**
 * Bouton de suppression dédié pour les produits marketing
 * Utilise la même méthode que le composant de test qui fonctionne correctement
 */
const DeleteProductButton: React.FC<DeleteProductButtonProps> = ({ productId, onSuccess }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!productId || productId.trim() === '') {
      toast.error('ID de produit invalide');
      return;
    }

    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.')) {
      try {
        setIsDeleting(true);
        const toastId = toast.loading('Suppression en cours...');
        
        console.log(`🗑️ Suppression du produit démarrée, ID: ${productId}`);
        
        try {
          // Vérifier si le produit existe
          console.log(`🔍 Vérification de l'existence du document...`);
          const productRef = doc(db, 'produits', productId);
          const productSnap = await getDoc(productRef);
          
          if (!productSnap.exists()) {
            console.log(`⚠️ Le produit avec l'ID ${productId} n'existe pas`);
            toast.error(`Le produit n'existe pas`, { id: toastId });
            setIsDeleting(false);
            return;
          }
          
          // Produit trouvé, procéder à la suppression
          const productData = productSnap.data();
          console.log(`✅ Produit trouvé: ${JSON.stringify(productData?.name || 'Sans nom')}`);
          
          // Suppression directe avec Firestore
          console.log(`⚡ Exécution de la commande deleteDoc...`);
          await deleteDoc(productRef);
          
          // Vérification post-suppression
          const checkSnap = await getDoc(productRef);
          
          if (!checkSnap.exists()) {
            console.log(`🎉 Produit supprimé avec succès!`);
            toast.success('Produit supprimé avec succès', { id: toastId });
            
            // Appeler le callback de réussite si fourni
            if (onSuccess) {
              onSuccess();
            }
          } else {
            console.log(`❌ Le produit existe encore après la suppression`);
            toast.error('Échec de la suppression - le produit existe toujours', { id: toastId });
          }
        } catch (err) {
          console.error('❌ Erreur lors de la suppression:', err);
          toast.error(`Erreur lors de la suppression: ${err instanceof Error ? err.message : 'Erreur inconnue'}`, { id: toastId });
        } finally {
          setIsDeleting(false);
        }
      } catch (err) {
        console.error('❌ Exception générale:', err);
        toast.error(`Erreur: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
        setIsDeleting(false);
      }
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className={`text-white font-bold px-4 py-2 rounded shadow ${
        isDeleting 
          ? 'bg-red-300 cursor-not-allowed' 
          : 'bg-red-500 hover:bg-red-700'
      }`}
      type="button"
      aria-label="Supprimer le produit"
    >
      {isDeleting ? 'Suppression...' : 'Supprimer'}
    </button>
  );
};

export default DeleteProductButton;
