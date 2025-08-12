import React, { useState } from 'react';
import { db } from '../../firebase';
import { doc, deleteDoc, getDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '../ui/ConfirmationModal';

// Importer la constante de la collection
const PRODUCTS_COLLECTION = 'produits';

interface ExactProductDeleteProps {
  productId: string;
  onSuccess?: () => void;
}

/**
 * Cette implémentation reprend EXACTEMENT le même code que dans ProductDeleteTest
 * qui fonctionne correctement. Aucune modification n'a été faite à la logique.
 */
const ExactProductDelete: React.FC<ExactProductDeleteProps> = ({ productId, onSuccess }) => {
  const [isDeleting, setIsDeleting] = useState(false);

  // États pour la gestion de la modale
  const [showModal, setShowModal] = useState(false);
  
  // Fonction pour afficher la modale de confirmation
  const handleDeleteClick = (e: React.MouseEvent) => {
    console.log('Début handleDeleteClick - ID du produit:', productId);
    // Arrêter la propagation de l'événement
    e.stopPropagation();
    e.preventDefault();
    console.log('Event propagation arrêtée');
    
    if (!productId || productId.trim() === '') {
      console.error('ID de produit invalide ou vide');
      toast.error('ID de produit invalide');
      return;
    }
    
    setShowModal(true);
    console.log('Modale de confirmation affichée');
  };
  
  // Fonction pour annuler la suppression
  const handleCancelDelete = () => {
    console.log('Suppression annulée par l\'utilisateur');
    setShowModal(false);
  };
  
  // Fonction pour confirmer la suppression
  const handleConfirmDelete = () => {
    console.log('Confirmation acceptée, appel de executeDelete');
    setShowModal(false);
    executeDelete();
  };
  

  
  // Fonction qui effectue réellement la suppression
  const executeDelete = async () => {
    console.log('Début executeDelete - ID du produit:', productId);
    setIsDeleting(true);
    console.log(`🚀 Démarrage de la suppression pour l'ID: ${productId}`);
    console.log('Collection Firestore utilisée:', PRODUCTS_COLLECTION);

    try {
      const productDocRef = doc(db, PRODUCTS_COLLECTION, productId);
      
      // Vérifier que le document existe avant de le supprimer
      const docSnap = await getDoc(productDocRef);
      if (!docSnap.exists()) {
        console.error(`Le produit avec l'ID ${productId} n'existe pas.`);
        toast.error(`Le produit avec l'ID ${productId} n'existe pas.`);
        return;
      }

      // Supprimer le document
      await deleteDoc(productDocRef);
      console.log(`Produit avec l'ID ${productId} supprimé avec succès.`);
      toast.success(`Produit supprimé avec succès !`);
      toast.success('Produit supprimé avec succès');
      
      // Appeler la fonction de rappel pour rafraîchir la liste
      if (onSuccess) {
        console.log('Appel du callback onSuccess pour rafraîchir la liste');
        onSuccess();
      } else {
        console.warn('Aucun callback onSuccess fourni');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du produit:', error);
      console.error('Détails de l\'erreur:', JSON.stringify(error, null, 2));
      toast.error(`Erreur lors de la suppression: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      console.log('Fin de la tentative de suppression, réinitialisation de isDeleting');
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="bg-red-600 hover:bg-red-800 text-white py-1.5 px-4 rounded transition duration-300 ease-in-out z-10"
        onClick={handleDeleteClick}
        disabled={isDeleting}
        data-testid="delete-product-button"
        data-product-id={productId}
      >
        {isDeleting ? "Suppression..." : "Supprimer Produit"}
      </button>
      
      {showModal && (
        <ConfirmationModal
          isOpen={showModal}
          title="Confirmation de suppression"
          message={<>
            Voulez-vous vraiment supprimer ce produit ?<br/>
            Cette action est irréversible.
          </>}
          confirmText="Supprimer"
          cancelText="Annuler"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </>
  );
};

export default ExactProductDelete;
