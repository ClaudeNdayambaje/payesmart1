import React, { useState } from 'react';
import { updateSubscriptionPlanReferences } from '../utils/updateSubscriptionPlans';

const RepairSubscriptionsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; updatedCount?: number; error?: string } | null>(null);

  const handleRepairSubscriptions = async () => {
    try {
      setLoading(true);
      setResult(null);
      
      // Mettre à jour les références de plans d'abonnement
      const repairResult = await updateSubscriptionPlanReferences();
      setResult(repairResult);
    } catch (error: any) {
      console.error('Erreur lors de la réparation des abonnements:', error);
      setResult({ error: error.message || 'Une erreur inconnue est survenue' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Réparation des Abonnements</h1>
        
        <div className="mb-8">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Cet outil va mettre à jour tous les abonnements qui font référence à des plans d'abonnement supprimés.
            Il associera chaque abonnement à un plan existant approprié en fonction du prix et du type d'abonnement.
          </p>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700 dark:text-yellow-200">
                  <strong>Attention :</strong> Cette opération modifiera les données dans la base Firestore.
                  Assurez-vous d'avoir compris les changements qui seront effectués.
                </p>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleRepairSubscriptions}
            disabled={loading}
            className={`w-full md:w-auto px-6 py-3 rounded-md font-medium text-white ${
              loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            } transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
          >
            {loading ? 'Réparation en cours...' : 'Réparer les abonnements'}
          </button>
        </div>
        
        {result && (
          <div className={`rounded-md p-4 mb-6 ${
            result.error ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200' : 
            result.success ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-200' : ''
          }`}>
            {result.error ? (
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium">Erreur lors de la réparation</h3>
                  <p className="mt-2 text-sm">{result.error}</p>
                </div>
              </div>
            ) : result.success ? (
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium">Réparation terminée avec succès</h3>
                  <p className="mt-2 text-sm">
                    {result.updatedCount === 0 
                      ? "Aucun abonnement n'a nécessité de mise à jour."
                      : `${result.updatedCount} abonnement(s) ont été mis à jour avec succès.`
                    }
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        )}
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Étapes suivantes</h2>
          <ol className="list-decimal pl-5 space-y-2 text-gray-700 dark:text-gray-300">
            <li>Après avoir exécuté cet outil, vérifiez la page des abonnements pour vous assurer qu'ils s'affichent correctement.</li>
            <li>Si des problèmes persistent, vérifiez la console du navigateur pour voir les messages d'erreur détaillés.</li>
            <li>Vous pourriez avoir besoin de créer de nouveaux plans d'abonnement si aucun plan approprié n'existe pour remplacer les anciens plans supprimés.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default RepairSubscriptionsPage;
