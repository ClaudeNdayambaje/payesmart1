import React, { useState, useEffect } from 'react';
import { Client, SubscriptionPlan } from '../../types/saas';
import { getSubscriptionPlans } from '../../services/subscriptionPlanService';
import { convertTrialToSubscription, extendTrialPeriod } from '../../services/trialManagementService';

interface TrialConversionModalProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onConversionSuccess: () => void;
}

const TrialConversionModal: React.FC<TrialConversionModalProps> = ({ 
  client, 
  isOpen, 
  onClose, 
  onConversionSuccess 
}) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [extensionDays, setExtensionDays] = useState<number>(7);
  const [mode, setMode] = useState<'convert' | 'extend'>('convert');

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
    }
  }, [isOpen]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const plansData = await getSubscriptionPlans();
      // Correction: Utiliser plan.active au lieu de plan.isActive pour être cohérent avec la structure des données
      setPlans(plansData.filter(plan => plan.active));
      console.log('Plans disponibles:', plansData);
      if (plansData.length > 0 && plansData.filter(plan => plan.active).length > 0) {
        // Sélectionner le premier plan actif
        const activePlans = plansData.filter(plan => plan.active);
        setSelectedPlanId(activePlans[0].id);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des plans:', error);
      setError('Impossible de charger les plans d\'abonnement.');
    } finally {
      setLoading(false);
    }
  };

  const handleConversion = async () => {
    if (!selectedPlanId) {
      setError('Veuillez sélectionner un plan d\'abonnement.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await convertTrialToSubscription(client?.id, selectedPlanId);
      if (result) {
        setSuccess('Conversion réussie ! Le client est maintenant abonné.');
        setTimeout(() => {
          onConversionSuccess();
          onClose();
        }, 2000);
      } else {
        setError('Échec de la conversion. Veuillez réessayer.');
      }
    } catch (error) {
      console.error('Erreur lors de la conversion:', error);
      setError('Une erreur est survenue lors de la conversion.');
    } finally {
      setLoading(false);
    }
  };

  const handleExtension = async () => {
    if (extensionDays <= 0) {
      setError('Veuillez entrer un nombre de jours valide.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await extendTrialPeriod(client?.id, extensionDays);
      if (result) {
        setSuccess(`Période d'essai prolongée de ${extensionDays} jours avec succès !`);
        setTimeout(() => {
          onConversionSuccess();
          onClose();
        }, 2000);
      } else {
        setError('Échec de la prolongation. Veuillez réessayer.');
      }
    } catch (error) {
      console.error('Erreur lors de la prolongation:', error);
      setError('Une erreur est survenue lors de la prolongation.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            {mode === 'convert' ? 'Convertir l\'essai en abonnement' : 'Prolonger la période d\'essai'}
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <p className="text-gray-600 mb-2">
            Client: <span className="font-semibold">{client?.businessName}</span>
          </p>
          <p className="text-gray-600 mb-4">
            Contact: {client?.contactName} ({client?.email})
          </p>

          <div className="flex space-x-2 mb-6">
            <button
              className={`px-4 py-2 rounded-md ${mode === 'convert' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}
              onClick={() => setMode('convert')}
            >
              Convertir en abonnement
            </button>
            <button
              className={`px-4 py-2 rounded-md ${mode === 'extend' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}
              onClick={() => setMode('extend')}
            >
              Prolonger l'essai
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
            {success}
          </div>
        )}

        {mode === 'convert' ? (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sélectionner un plan d'abonnement
              </label>
              {loading ? (
                <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
              ) : (
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - {plan.price}€/{plan.billingCycle}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="mt-6">
              <button
                onClick={handleConversion}
                disabled={loading || !selectedPlanId}
                className={`w-full py-2 px-4 rounded-md ${
                  loading || !selectedPlanId
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {loading ? 'Conversion en cours...' : 'Convertir en abonnement payant'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de jours supplémentaires
              </label>
              <input
                type="number"
                value={extensionDays}
                onChange={(e) => setExtensionDays(parseInt(e.target.value))}
                min="1"
                max="90"
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="mt-6">
              <button
                onClick={handleExtension}
                disabled={loading || extensionDays <= 0}
                className={`w-full py-2 px-4 rounded-md ${
                  loading || extensionDays <= 0
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {loading ? 'Prolongation en cours...' : `Prolonger de ${extensionDays} jours`}
              </button>
            </div>
          </div>
        )}

        <div className="mt-4">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default TrialConversionModal;
