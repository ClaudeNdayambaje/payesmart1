import React, { useState, useEffect } from 'react';
import { TrialConfig, getTrialConfig, updateTrialConfig } from '../../services/trialConfigService';
import { auth } from '../../firebase';
import { Save, RefreshCw } from 'lucide-react';

const TrialConfigManager: React.FC = () => {
  const [config, setConfig] = useState<TrialConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadTrialConfig();
  }, []);

  const loadTrialConfig = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Utiliser l'utilisateur actuellement connecté via Firebase Auth
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        setError('Vous devez être connecté pour accéder à cette fonctionnalité.');
        setLoading(false);
        return;
      }
      
      const businessId = currentUser.uid;
      console.log('Chargement de la configuration pour l\'entreprise:', businessId);
      
      const trialConfig = await getTrialConfig(businessId);
      
      if (trialConfig) {
        console.log('Configuration chargée avec succès:', trialConfig);
        setConfig(trialConfig);
      } else {
        console.error('Impossible de charger la configuration d\'essai');
        setError('Impossible de charger la configuration d\'essai.');
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la configuration d\'essai:', error);
      setError('Erreur lors du chargement de la configuration. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError('Vous devez être connecté pour effectuer cette action.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Validation des valeurs
      if (config.trialDurationDays < 0 || config.trialDurationMinutes < 0) {
        setError('Les durées ne peuvent pas être négatives.');
        setSaving(false);
        return;
      }

      const updated = await updateTrialConfig({
        ...config,
        businessId: currentUser.uid
      });

      if (updated) {
        setSuccess('Configuration d\'essai mise à jour avec succès !');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Erreur lors de la mise à jour de la configuration.');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la configuration d\'essai:', error);
      setError('Erreur lors de la sauvegarde. Veuillez réessayer.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof TrialConfig, value: any) => {
    if (!config) return;

    setConfig({
      ...config,
      [field]: field === 'trialDurationDays' || field === 'trialDurationMinutes' 
        ? parseInt(value) || 0 
        : value
    });
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <div className="flex items-center justify-center h-40">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <span className="ml-2 text-lg">Chargement de la configuration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Configuration des Périodes d'Essai</h2>
      
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
      
      {config && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Durée d'essai (jours)
              </label>
              <input
                type="number"
                min="0"
                value={config.trialDurationDays}
                onChange={(e) => handleInputChange('trialDurationDays', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="mt-1 text-sm text-gray-500">
                Nombre de jours pour la période d'essai
              </p>
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Durée d'essai (minutes)
              </label>
              <input
                type="number"
                min="0"
                value={config.trialDurationMinutes}
                onChange={(e) => handleInputChange('trialDurationMinutes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="mt-1 text-sm text-gray-500">
                Minutes additionnelles (utile pour les tests)
              </p>
            </div>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={config.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Activer les périodes d'essai
            </label>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrialConfigManager;
