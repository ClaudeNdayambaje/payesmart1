import React, { useState, useEffect } from 'react';
import { TrialConfig, getTrialConfig, updateTrialConfig } from '../../services/trialConfigService';
import { auth, db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Save, RefreshCw, Users, Calendar, Clock, Info, AlertTriangle, Check } from 'lucide-react';
import { Client } from '../../types/saas';

const SAAS_CLIENTS_COLLECTION = 'saas_clients';

const EnhancedTrialConfigManager: React.FC = () => {
  const [config, setConfig] = useState<TrialConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [trialClients, setTrialClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'stats' | 'help'>('config');
  const [presets, setPresets] = useState<{ label: string; days: number; minutes: number }[]>([
    { label: 'Essai standard (14 jours)', days: 14, minutes: 0 },
    { label: 'Essai court (7 jours)', days: 7, minutes: 0 },
    { label: 'Essai long (30 jours)', days: 30, minutes: 0 },
    { label: 'Démo rapide (30 minutes)', days: 0, minutes: 30 },
    { label: 'Test (5 minutes)', days: 0, minutes: 5 },
  ]);

  useEffect(() => {
    loadTrialConfig();
    loadTrialClients();
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

  const loadTrialClients = async () => {
    try {
      setLoadingClients(true);
      
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      
      // Récupérer les clients en période d'essai
      const clientsQuery = query(
        collection(db, SAAS_CLIENTS_COLLECTION),
        where('isInTrial', '==', true)
      );
      
      const snapshot = await getDocs(clientsQuery);
      const now = Date.now();
      
      const clients = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Client))
        .filter(client => client.trialEndDate && client.trialEndDate > now);
      
      setTrialClients(clients);
    } catch (error) {
      console.error('Erreur lors du chargement des clients en essai:', error);
    } finally {
      setLoadingClients(false);
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

  const applyPreset = (preset: { days: number; minutes: number }) => {
    if (!config) return;
    
    setConfig({
      ...config,
      trialDurationDays: preset.days,
      trialDurationMinutes: preset.minutes
    });
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <div className="flex items-center justify-center h-40">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          <span className="ml-2 text-lg">Chargement de la configuration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* En-tête avec onglets */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
              activeTab === 'config'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Configuration
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('stats')}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
              activeTab === 'stats'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Clients en essai ({trialClients.length})
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('help')}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
              activeTab === 'help'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <Info className="w-5 h-5 mr-2" />
              Aide
            </div>
          </button>
        </nav>
      </div>
      
      {/* Contenu principal */}
      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-start">
            <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md flex items-start">
            <Check className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}
        
        {activeTab === 'config' && config && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Configuration des Périodes d'Essai</h2>
            
            {/* Préréglages rapides */}
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Préréglages rapides</h3>
              <div className="flex flex-wrap gap-2">
                {presets.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => applyPreset(preset)}
                    className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Durée d'essai (jours)
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <input
                      type="number"
                      min="0"
                      value={config.trialDurationDays}
                      onChange={(e) => handleInputChange('trialDurationDays', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Nombre de jours pour la période d'essai
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Durée d'essai (minutes)
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <input
                      type="number"
                      min="0"
                      value={config.trialDurationMinutes}
                      onChange={(e) => handleInputChange('trialDurationMinutes', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Clock className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    Minutes additionnelles (utile pour les tests)
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-indigo-50 rounded-md border border-indigo-100">
                  <h3 className="font-medium text-indigo-800 mb-2">Résumé de la configuration</h3>
                  <p className="text-indigo-700 mb-1">
                    Durée totale d'essai: <span className="font-semibold">
                      {config.trialDurationDays > 0 && `${config.trialDurationDays} jour(s)`}
                      {config.trialDurationDays > 0 && config.trialDurationMinutes > 0 && ' et '}
                      {config.trialDurationMinutes > 0 && `${config.trialDurationMinutes} minute(s)`}
                      {config.trialDurationDays === 0 && config.trialDurationMinutes === 0 && 'Aucune période d\'essai'}
                    </span>
                  </p>
                  <p className="text-indigo-700 mb-1">
                    État: <span className={`font-semibold ${config.isActive ? 'text-green-600' : 'text-red-600'}`}>
                      {config.isActive ? 'Activé' : 'Désactivé'}
                    </span>
                  </p>
                  <p className="text-indigo-700 mb-1">
                    Dernière mise à jour: <span className="font-semibold">
                      {new Date(config.updatedAt).toLocaleString('fr-FR')}
                    </span>
                  </p>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={config.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                    Activer les périodes d'essai
                  </label>
                </div>
                
                <div className="mt-4">
                  <button
                    onClick={handleSaveConfig}
                    disabled={saving}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Enregistrer la configuration
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Clients en Période d'Essai</h2>
            
            {loadingClients ? (
              <div className="flex items-center justify-center h-40">
                <RefreshCw className="w-6 h-6 text-indigo-600 animate-spin" />
                <span className="ml-2">Chargement des clients...</span>
              </div>
            ) : trialClients.length === 0 ? (
              <div className="bg-gray-50 p-6 text-center rounded-md border border-gray-200">
                <p className="text-gray-500">Aucun client en période d'essai actuellement.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Début d'essai
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fin d'essai
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Jours restants
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {trialClients.map((client) => {
                      const now = Date.now();
                      const endDate = client.trialEndDate || 0;
                      const daysRemaining = Math.ceil((endDate - now) / (24 * 60 * 60 * 1000));
                      
                      return (
                        <tr key={client.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{client.businessName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{client.contactName}</div>
                            <div className="text-sm text-gray-500">{client.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {client.trialStartDate ? new Date(client.trialStartDate).toLocaleDateString('fr-FR') : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {client.trialEndDate ? new Date(client.trialEndDate).toLocaleDateString('fr-FR') : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              daysRemaining <= 1 ? 'bg-red-100 text-red-800' : 
                              daysRemaining <= 3 ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-green-100 text-green-800'
                            }`}>
                              {daysRemaining} jour{daysRemaining > 1 ? 's' : ''}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'help' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Aide - Gestion des Périodes d'Essai</h2>
            
            <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
              <h3 className="text-lg font-medium text-blue-800 mb-2">Comment configurer les périodes d'essai</h3>
              <p className="text-blue-700 mb-2">
                La configuration des périodes d'essai vous permet de définir la durée pendant laquelle vos clients peuvent utiliser PayeSmart gratuitement avant de souscrire à un abonnement.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="border-l-4 border-indigo-500 pl-4">
                <h3 className="font-medium text-gray-900">Durée en jours</h3>
                <p className="text-gray-600">
                  Définissez le nombre de jours pour la période d'essai standard. La valeur recommandée est de 14 jours.
                </p>
              </div>
              
              <div className="border-l-4 border-indigo-500 pl-4">
                <h3 className="font-medium text-gray-900">Durée en minutes</h3>
                <p className="text-gray-600">
                  Pour les tests rapides, vous pouvez définir une durée en minutes. Cela est particulièrement utile pour vérifier que le système de notification d'expiration fonctionne correctement.
                </p>
              </div>
              
              <div className="border-l-4 border-indigo-500 pl-4">
                <h3 className="font-medium text-gray-900">Activation/Désactivation</h3>
                <p className="text-gray-600">
                  Vous pouvez activer ou désactiver complètement le système de périodes d'essai. Si désactivé, les nouveaux clients devront souscrire directement à un abonnement.
                </p>
              </div>
              
              <div className="border-l-4 border-indigo-500 pl-4">
                <h3 className="font-medium text-gray-900">Préréglages rapides</h3>
                <p className="text-gray-600">
                  Utilisez les préréglages pour appliquer rapidement des configurations courantes sans avoir à saisir manuellement les valeurs.
                </p>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-md border border-yellow-100">
              <h3 className="text-lg font-medium text-yellow-800 mb-2">Remarques importantes</h3>
              <ul className="list-disc pl-5 text-yellow-700 space-y-1">
                <li>La modification de la durée d'essai n'affecte que les nouveaux clients. Les clients existants conservent leur durée d'essai initiale.</li>
                <li>Pour modifier la période d'essai d'un client existant, utilisez l'onglet "Essais gratuits" dans le menu principal.</li>
                <li>Les notifications d'expiration sont envoyées automatiquement 3 jours et 1 jour avant la fin de la période d'essai.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedTrialConfigManager;
