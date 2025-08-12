import React, { useState } from 'react';
import { synchronizeTrialStatus } from '../../services/saasClientService';

interface SyncTrialStatusButtonProps {
  onSyncComplete?: () => void;
  className?: string;
}

/**
 * Bouton permettant de synchroniser les statuts d'essai entre les collections businesses et saas_clients
 */
const SyncTrialStatusButton: React.FC<SyncTrialStatusButtonProps> = ({ 
  onSyncComplete,
  className = ''
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    visible: boolean;
  }>({ visible: false });

  const handleSync = async () => {
    try {
      setLoading(true);
      setResult({ visible: false });
      
      // Appeler la fonction de synchronisation
      const syncResult = await synchronizeTrialStatus();
      
      // Afficher le résultat
      setResult({
        success: syncResult.success,
        message: syncResult.message,
        visible: true
      });
      
      // Déclencher le callback si fourni
      if (onSyncComplete) {
        onSyncComplete();
      }
      
      // Masquer le message après 5 secondes
      setTimeout(() => {
        setResult(prev => ({ ...prev, visible: false }));
      }, 5000);
    } catch (error) {
      setResult({
        success: false,
        message: `Erreur: ${error instanceof Error ? error.message : String(error)}`,
        visible: true
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleSync}
        disabled={loading}
        className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
          loading 
            ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
            : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
        } ${className}`}
        title="Synchroniser les statuts d'essai entre les systèmes"
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Synchronisation...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Synchroniser les périodes d'essai
          </>
        )}
      </button>
      
      {/* Message de résultat */}
      {result.visible && (
        <div className={`absolute mt-2 p-3 rounded-md shadow-lg w-64 z-10 text-sm ${
          result.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex">
            {result.success ? (
              <svg className="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            )}
            <p>{result.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncTrialStatusButton;
