import React from 'react';
import { db } from '../../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

interface DirectProductDeleteProps {
  productId: string;
  onSuccess?: () => void;
}

/**
 * Version ultra simplifiée du composant de suppression
 * Cette version utilise l'approche la plus directe possible pour résoudre le problème
 */
const DirectProductDelete: React.FC<DirectProductDeleteProps> = ({ productId, onSuccess }) => {
  
  const handleDelete = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!productId || productId.trim() === '') {
      toast.error('ID de produit invalide');
      return;
    }
    
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.')) {
      return;
    }
    
    // Afficher un toast de chargement
    const toastId = toast.loading('Suppression en cours...');
    
    try {
      console.log(`🧨 SUPPRESSION DIRECTE: tentative sur l'ID ${productId}`);
      
      // Suppression directe et minimale sans aucune autre opération
      const productRef = doc(db, 'produits', productId);
      await deleteDoc(productRef);
      
      console.log(`✅ SUPPRESSION DIRECTE: réussie pour l'ID ${productId}`);
      toast.success('Produit supprimé avec succès', { id: toastId });
      
      // Appeler le callback de succès si fourni
      if (typeof onSuccess === 'function') {
        console.log('🔄 Déclenchement du rafraîchissement des produits');
        onSuccess();
      }
      
    } catch (error) {
      console.error('❌ ERREUR SUPPRESSION DIRECTE:', error);
      toast.error(`Erreur lors de la suppression: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, { id: toastId });
    }
  };
  
  return (
    <button
      onClick={handleDelete}
      className="text-white bg-red-600 hover:bg-red-800 font-bold px-3 py-1 rounded text-sm"
      type="button"
    >
      🗑️ Suppr
    </button>
  );
};

export default DirectProductDelete;
