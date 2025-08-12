import React, { useState } from 'react';
import { updateExistingClientsTrialPeriods } from '../../services/trialPeriodService';
import { RefreshCw } from 'lucide-react';

/**
 * Bouton permettant de mettre à jour les périodes d'essai des clients existants
 * en fonction de la période active sélectionnée
 */
const UpdateTrialPeriodsButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedCount, setUpdatedCount] = useState(0);

  const handleUpdateTrialPeriods = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Appeler la fonction pour mettre à jour les périodes d'essai
      const count = await updateExistingClientsTrialPeriods();
      
      setUpdatedCount(count);
      setSuccess(true);
      
      // Recharger la page après 2 secondes pour voir les changements
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error('Erreur lors de la mise à jour des périodes d\'essai:', err);
      setError('Une erreur est survenue lors de la mise à jour des périodes d\'essai');
    } finally {
      setLoading(false);
    }
  };

  // La fonction handleCloseSnackbar n'est plus nécessaire car nous n'utilisons plus les composants Snackbar

  return (
    <div className="mb-4">
      <button
        className={`flex items-center justify-center px-4 py-2 rounded-md text-white font-medium transition-all duration-200 ${loading ? 'bg-green-500 opacity-70 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
        onClick={handleUpdateTrialPeriods}
        disabled={loading}
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Mise à jour en cours...</span>
          </>
        ) : (
          <>
            <RefreshCw size={18} className="mr-2" />
            <span>Appliquer la période active à tous les clients</span>
          </>
        )}
      </button>
      
      {success && (
        <div className="mt-4 p-3 bg-green-100 border border-green-200 text-green-800 rounded-md flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>{updatedCount} clients ont été mis à jour avec succès ! La page va se recharger automatiquement.</span>
        </div>
      )}
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-200 text-red-800 rounded-md flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
          <span>{error}</span>
        </div>
      )}
      
      <p className="text-sm text-gray-600 mt-2">
        Ce bouton permet d'appliquer la période d'essai active à tous les clients existants en période d'essai.
      </p>
    </div>
  );
};

export default UpdateTrialPeriodsButton;
