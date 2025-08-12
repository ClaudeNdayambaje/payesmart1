import React, { useState, useEffect } from 'react';
import { 
  Calendar, Plus, Edit, Trash2, Check, X, 
  AlertCircle, Tag, Timer
} from 'lucide-react';

// Type pour une période d'essai
interface TrialPeriod {
  id: string;
  name: string;
  days: number;
  minutes: number;
  isActive: boolean;
  createdAt: Date;
  lastModified?: Date;
  description?: string;
}

interface TrialPeriodsManagerProps {
  onSaveConfiguration: (config: any) => void;
  enableTrials?: boolean;
  initialConfig?: {
    enableTrials: boolean;
    activeTrialId: string;
    trialPeriods: TrialPeriod[];
  };
}

const TrialPeriodsManager: React.FC<TrialPeriodsManagerProps> = ({ onSaveConfiguration, initialConfig, enableTrials: enableTrialsProps = true }) => {
  // Valeurs par défaut pour les périodes d'essai
  const defaultTrialPeriods: TrialPeriod[] = [
    {
      id: '1',
      name: 'Essai standard',
      days: 14,
      minutes: 0,
      isActive: true,
      createdAt: new Date(),
      description: 'Période d\'essai standard de 14 jours'
    },
    {
      id: '2',
      name: 'Essai court',
      days: 7,
      minutes: 0,
      isActive: false,
      createdAt: new Date(),
      description: 'Période d\'essai courte de 7 jours'
    },
    {
      id: '3',
      name: 'Essai long',
      days: 30,
      minutes: 0,
      isActive: false,
      createdAt: new Date(),
      description: 'Période d\'essai longue de 30 jours'
    },
    {
      id: '4',
      name: 'Démo rapide',
      days: 0,
      minutes: 30,
      isActive: false,
      createdAt: new Date(),
      description: 'Démo rapide de 30 minutes'
    }
  ];
  
  // État pour les périodes d'essai
  const [trialPeriods, setTrialPeriods] = useState<TrialPeriod[]>(initialConfig?.trialPeriods || defaultTrialPeriods);

  // État pour le formulaire de création/édition
  const [showForm, setShowForm] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<TrialPeriod | null>(null);
  const [newPeriod, setNewPeriod] = useState<Partial<TrialPeriod>>({
    name: '',
    days: 0,
    minutes: 0,
    description: ''
  });

  // État pour la confirmation de suppression
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // État pour la configuration globale
  const [activeTrialId, setActiveTrialId] = useState<string>(initialConfig?.activeTrialId || '1');
  const [enableTrials] = useState(initialConfig?.enableTrials !== undefined ? initialConfig.enableTrials : enableTrialsProps);
  
  // Charger les données depuis localStorage au démarrage
  useEffect(() => {
    // Récupérer la liste des IDs supprimés
    let deletedIds: string[] = [];
    try {
      const deletedIdsStr = localStorage.getItem('deletedTrialPeriodIds');
      if (deletedIdsStr) {
        deletedIds = JSON.parse(deletedIdsStr);
      }
    } catch (e) {
      console.error('Erreur lors de la récupération des IDs supprimés:', e);
    }
    
    // Si initialConfig est fourni, l'utiliser (il vient probablement de Firestore)
    if (initialConfig) {
      // Filtrer les périodes supprimées
      const filteredPeriods = initialConfig.trialPeriods.filter((p: TrialPeriod) => !deletedIds.includes(p.id));
      setTrialPeriods(filteredPeriods);
      
      // Vérifier si l'ID actif est toujours valide
      const activeIdExists = filteredPeriods.some((p: TrialPeriod) => p.id === initialConfig.activeTrialId);
      setActiveTrialId(activeIdExists ? initialConfig.activeTrialId : (filteredPeriods[0]?.id || '1'));
      return;
    }
    
    // Sinon, essayer de charger depuis localStorage
    try {
      const savedConfig = localStorage.getItem('trialPeriodsConfig');
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        if (parsedConfig.trialPeriods && Array.isArray(parsedConfig.trialPeriods)) {
          // Filtrer les périodes supprimées
          const filteredPeriods = parsedConfig.trialPeriods.filter((p: any) => !deletedIds.includes(p.id));
          console.log('Chargement des périodes d\'essai depuis localStorage:', filteredPeriods);
          setTrialPeriods(filteredPeriods);
          
          // Vérifier si l'ID actif est toujours valide
          const activeIdExists = filteredPeriods.some((p: any) => p.id === parsedConfig.activeTrialId);
          setActiveTrialId(activeIdExists ? parsedConfig.activeTrialId : (filteredPeriods[0]?.id || '1'));
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la configuration depuis localStorage:', error);
    }
  }, [initialConfig]);

  // Statistiques pour les KPI
  const totalPeriods = trialPeriods.length;
  const activePeriod = trialPeriods.find(p => p.id === activeTrialId);
  const longestPeriod = [...trialPeriods].sort((a, b) => 
    (b.days * 1440 + b.minutes) - (a.days * 1440 + a.minutes)
  )[0];

  // État pour les notifications
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);

  // Afficher une notification temporaire
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000); // Disparaît après 5 secondes
  };

  // Gestionnaire pour activer une période d'essai
  const handleActivatePeriod = async (id: string) => {
    try {
      setActiveTrialId(id);
      
      // Mettre à jour les périodes pour s'assurer que la période active est marquée comme telle
      const updatedPeriods = trialPeriods.map(p => ({
        ...p,
        isActive: p.id === id
      }));
      
      // Mettre à jour l'état local
      setTrialPeriods(updatedPeriods);
      
      // Sauvegarder immédiatement la configuration avec la nouvelle période active
      const config = {
        enableTrials,
        activeTrialId: id,
        trialPeriods: updatedPeriods
      };
      
      await onSaveConfiguration(config);
      
      // Sauvegarder également dans le localStorage
      localStorage.setItem('trialPeriodsConfig', JSON.stringify(config));
      localStorage.setItem('activeTrialId', id);
      
      // Trouver le nom de la période activée pour le message
      const activatedPeriod = updatedPeriods.find(p => p.id === id);
      
      // Afficher un message de confirmation
      showNotification(`La période d'essai "${activatedPeriod?.name || 'sélectionnée'}" est maintenant active et sera appliquée aux nouveaux clients.`, 'success');
      
      // Rafraîchir la page pour s'assurer que les changements sont visibles
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Erreur lors de l\'activation de la période d\'essai:', error);
      showNotification('Erreur lors de l\'activation de la période d\'essai. Veuillez réessayer.', 'error');
    }
  };

  // Gestionnaire pour ouvrir le formulaire d'édition
  const handleEditPeriod = (period: TrialPeriod) => {
    setEditingPeriod(period);
    setNewPeriod({
      name: period.name,
      days: period.days,
      minutes: period.minutes,
      description: period.description
    });
    setShowForm(true);
  };

  // Gestionnaire pour ouvrir le formulaire de création
  const handleAddPeriod = () => {
    console.log('Ouverture du formulaire de création');
    setEditingPeriod(null);
    setNewPeriod({
      name: '',
      days: 14, // Valeur par défaut pour faciliter la création
      minutes: 0,
      description: ''
    });
    setShowForm(true);
  };

  // Gestionnaire pour sauvegarder une période
  const handleSavePeriod = async () => {
    console.log('Tentative de sauvegarde de la période:', newPeriod);
    if (!newPeriod.name) {
      showNotification('Le nom de la période est obligatoire', 'error');
      return;
    }

    try {
      let updatedTrialPeriods;

      if (editingPeriod) {
        // Mise à jour d'une période existante
        updatedTrialPeriods = trialPeriods.map(p => 
          p.id === editingPeriod.id 
            ? {
                ...p,
                name: newPeriod.name || p.name,
                days: newPeriod.days !== undefined ? newPeriod.days : p.days,
                minutes: newPeriod.minutes !== undefined ? newPeriod.minutes : p.minutes,
                description: newPeriod.description,
                lastModified: new Date()
              }
            : p
        );
        showNotification(`La période d'essai "${newPeriod.name}" a été mise à jour avec succès.`, 'success');
      } else {
        // Création d'une nouvelle période
        const newId = Date.now().toString();
        const currentDate = new Date();
        const newPeriodItem: TrialPeriod = {
          id: newId,
          name: newPeriod.name || 'Nouvelle période',
          days: typeof newPeriod.days === 'number' ? newPeriod.days : 14,
          minutes: typeof newPeriod.minutes === 'number' ? newPeriod.minutes : 0,
          isActive: false,
          createdAt: currentDate,
          lastModified: currentDate,
          description: newPeriod.description || ''
        };
        console.log('Nouvelle période créée:', newPeriodItem);
        updatedTrialPeriods = [...trialPeriods, newPeriodItem];
        showNotification(`La nouvelle période d'essai "${newPeriod.name}" a été créée avec succès.`, 'success');
      }

      // Mettre à jour l'état local
      setTrialPeriods(updatedTrialPeriods);
    
      // Sauvegarder dans Firestore via la fonction onSaveConfiguration
      try {
        // S'assurer qu'aucune valeur n'est undefined avant d'envoyer à Firestore
        const sanitizedTrialPeriods = updatedTrialPeriods.map(period => ({
          id: period.id || '',
          name: period.name || '',
          days: typeof period.days === 'number' ? period.days : 0,
          minutes: typeof period.minutes === 'number' ? period.minutes : 0,
          isActive: Boolean(period.isActive),
          createdAt: period.createdAt || new Date(),
          lastModified: period.lastModified || new Date(),
          description: period.description || ''
        }));
        
        const config = {
          enableTrials: Boolean(enableTrials),
          activeTrialId: activeTrialId || sanitizedTrialPeriods[0]?.id || '',
          trialPeriods: sanitizedTrialPeriods
        };
        
        console.log('Configuration à sauvegarder:', config);
        await onSaveConfiguration(config);
        
        // Sauvegarder également dans le localStorage pour plus de sécurité
        localStorage.setItem('trialPeriodsConfig', JSON.stringify(config));
      } catch (error) {
        console.error('Erreur lors de la sauvegarde de la période dans Firestore:', error);
        showNotification('Erreur lors de la sauvegarde. Veuillez réessayer.', 'error');
        throw error; // Propager l'erreur pour qu'elle soit attrapée par le bloc catch externe
      }
      
      // Fermer le formulaire et réinitialiser l'état d'édition
      setShowForm(false);
      setEditingPeriod(null);
      
      // Rafraîchir la page après la création d'une période d'essai
      if (!editingPeriod) {
        showNotification('Rafraîchissement de la page pour afficher la nouvelle période...', 'info');
        setTimeout(() => {
          window.location.reload();
        }, 1500); // Délai de 1,5 secondes pour permettre à l'utilisateur de voir la notification
      }
    } catch (error) {
      console.error('Erreur globale lors de la sauvegarde de la période:', error);
      showNotification('Une erreur est survenue. Veuillez réessayer.', 'error');
    }
  };

  // Gestionnaire pour supprimer une période
  const handleDeletePeriod = (id: string) => {
    setDeletingId(id);
  };

  // Confirmer la suppression
  const confirmDeletePeriod = async () => {
    if (!deletingId) return;

    const periodToDelete = trialPeriods.find(p => p.id === deletingId);
    if (!periodToDelete) {
      setDeletingId(null);
      return;
    }

    // Filtrer la période à supprimer
    const updatedTrialPeriods = trialPeriods.filter(p => p.id !== deletingId);
    
    // Déterminer le nouvel ID actif si nécessaire
    let newActiveId = activeTrialId;
    if (deletingId === activeTrialId && updatedTrialPeriods.length > 0) {
      newActiveId = updatedTrialPeriods[0].id;
      setActiveTrialId(newActiveId);
    }
    
    // Mettre à jour l'état local
    setTrialPeriods(updatedTrialPeriods);
    
    // Sauvegarder dans Firestore
    try {
      const config = {
        enableTrials,
        activeTrialId: newActiveId,
        trialPeriods: updatedTrialPeriods
      };
      
      // Sauvegarder d'abord dans Firestore
      await onSaveConfiguration(config);
      
      // Sauvegarder également dans le localStorage pour une persistance locale
      localStorage.setItem('trialPeriodsConfig', JSON.stringify(config));
      
      // Supprimer également les périodes d'essai par défaut du localStorage pour éviter qu'elles ne réapparaissent
      try {
        // Mettre à jour la liste des IDs supprimés dans le localStorage
        const deletedIdsStr = localStorage.getItem('deletedTrialPeriodIds') || '[]';
        const deletedIds = JSON.parse(deletedIdsStr);
        if (!deletedIds.includes(deletingId)) {
          deletedIds.push(deletingId);
          localStorage.setItem('deletedTrialPeriodIds', JSON.stringify(deletedIds));
        }
      } catch (e) {
        console.error('Erreur lors de la mise à jour des IDs supprimés:', e);
      }
      
      showNotification(`La période d'essai "${periodToDelete.name}" a été supprimée avec succès.`, 'success');
    } catch (error) {
      console.error('Erreur lors de la suppression de la période d\'essai:', error);
      showNotification('Erreur lors de la suppression. Veuillez réessayer.', 'error');
    }
    
    setDeletingId(null);
  };

  // La fonction handleSaveConfiguration a été supprimée car elle n'est plus utilisée

  // Formater la durée d'une période
  const formatDuration = (days: number, minutes: number) => {
    if (days > 0 && minutes > 0) {
      return `${days} jour${days > 1 ? 's' : ''} et ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else if (days > 0) {
      return `${days} jour${days > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      return 'Aucune durée';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Affichage des notifications */}
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 ${notification.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : notification.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-blue-50 text-blue-800 border border-blue-200'}`}>
          <div className="flex items-center">
            {notification.type === 'success' && (
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            )}
            {notification.type === 'error' && (
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            )}
            {notification.type === 'info' && (
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            )}
            <span>{notification.message}</span>
            <button 
              onClick={() => setNotification(null)} 
              className="ml-4 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      )}
      {/* Formulaire de création/édition */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingPeriod ? `Modifier "${editingPeriod.name}"` : 'Nouvelle période d\'essai'}
            </h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSavePeriod();
            }} className="space-y-4">
              <div>
                <label htmlFor="periodName" className="block text-sm font-medium text-gray-700">
                  Nom <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="periodName"
                  value={newPeriod.name}
                  onChange={(e) => setNewPeriod({...newPeriod, name: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Ex: Essai standard"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="periodDays" className="block text-sm font-medium text-gray-700">
                  Jours
                </label>
                <input
                  type="number"
                  id="periodDays"
                  value={newPeriod.days}
                  onChange={(e) => setNewPeriod({...newPeriod, days: parseInt(e.target.value) || 0})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  min="0"
                />
                <p className="mt-1 text-xs text-gray-500">La durée totale doit être supérieure à zéro (jours ou minutes)</p>
              </div>
              
              <div>
                <label htmlFor="periodMinutes" className="block text-sm font-medium text-gray-700">
                  Minutes (pour les tests rapides)
                </label>
                <input
                  type="number"
                  id="periodMinutes"
                  value={newPeriod.minutes}
                  onChange={(e) => setNewPeriod({...newPeriod, minutes: parseInt(e.target.value) || 0})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  min="0"
                />
              </div>
              
              <div>
                <label htmlFor="periodDescription" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="periodDescription"
                  value={newPeriod.description || ''}
                  onChange={(e) => setNewPeriod({...newPeriod, description: e.target.value})}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  rows={3}
                  placeholder="Description optionnelle"
                />
              </div>
            
              <div className="mt-5 sm:mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {editingPeriod ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <div className="p-6 bg-white border-b border-gray-200">
        <div className="mb-6">
          {/* Espace réservé pour d'autres contrôles si nécessaire */}
        </div>

        {/* Section KPI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border-2 border-indigo-300 flex items-center">
            <div className="rounded-full bg-indigo-100 p-3 mr-4">
              <Calendar className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">Période active</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  Actif
                </span>
              </div>
              <p className="text-xl font-bold text-gray-800">
                {activePeriod?.name || 'Aucune'}
              </p>
              <p className="text-xs text-indigo-600">
                {activePeriod ? formatDuration(activePeriod.days, activePeriod.minutes) : 'Non définie'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Cette période sera appliquée à tous les nouveaux clients
              </p>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex items-center">
            <div className="rounded-full bg-green-100 p-3 mr-4">
              <Tag className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Périodes configurées</p>
              <p className="text-xl font-bold text-gray-800">
                {totalPeriods}
              </p>
              <p className="text-xs text-green-600">
                {enableTrials ? 'Système actif' : 'Système inactif'}
              </p>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex items-center">
            <div className="rounded-full bg-purple-100 p-3 mr-4">
              <Timer className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Période la plus longue</p>
              <p className="text-xl font-bold text-gray-800">
                {longestPeriod?.name || 'Aucune'}
              </p>
              <p className="text-xs text-purple-600">
                {longestPeriod ? formatDuration(longestPeriod.days, longestPeriod.minutes) : 'Non définie'}
              </p>
            </div>
          </div>
        </div>

        {/* Préréglages rapides */}
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-700 mb-3">Préréglages rapides</h2>
          <div className="flex flex-wrap gap-2">
            {trialPeriods.map(period => (
              <button
                key={period.id}
                onClick={() => handleActivatePeriod(period.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  period.id === activeTrialId 
                    ? 'bg-[color:var(--color-primary)] text-white border-2 border-indigo-300' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {period.id === activeTrialId && (
                  <Check size={16} className="text-white" />
                )}
                {period.name} ({formatDuration(period.days, period.minutes)})
                {period.id === activeTrialId && (
                  <span className="ml-1 text-xs bg-white text-indigo-800 px-1.5 py-0.5 rounded-full">Actif</span>
                )}
              </button>
            ))}
            <button
              onClick={() => {
                console.log('Bouton Nouvelle période cliqué');
                handleAddPeriod();
              }}
              type="button"
              className="px-4 py-2 rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 text-sm font-medium flex items-center gap-1"
              data-component-name="TrialPeriodsManager"
            >
              <Plus size={16} />
              Nouvelle période
            </button>
          </div>
        </div>
      </div>

      {/* Liste des périodes d'essai */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-800">Toutes les périodes d'essai</h2>
            <button
              onClick={handleAddPeriod}
              className="bg-[color:var(--color-primary)] text-white px-3 py-1.5 rounded-lg hover:bg-[color:var(--color-primary-dark)] transition-colors flex items-center gap-1 text-sm"
            >
              <Plus size={16} />
              Ajouter
            </button>
          </div>
          
          <div className="divide-y divide-gray-200">
            {trialPeriods.map(period => (
              <div key={period.id} className="p-4 hover:bg-gray-50 flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-800">{period.name}</h3>
                    {period.id === activeTrialId && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                        Actif
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{formatDuration(period.days, period.minutes)}</p>
                  {period.description && (
                    <p className="text-xs text-gray-500 mt-1">{period.description}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {period.id !== activeTrialId && (
                    <button
                      onClick={() => handleActivatePeriod(period.id)}
                      className="p-1.5 text-gray-500 hover:text-green-600 rounded-full hover:bg-green-50"
                      title="Activer cette période"
                    >
                      <Check size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => handleEditPeriod(period)}
                    className="p-1.5 text-gray-500 hover:text-blue-600 rounded-full hover:bg-blue-50"
                    title="Modifier cette période"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDeletePeriod(period.id)}
                    className="p-1.5 text-gray-500 hover:text-red-600 rounded-full hover:bg-red-50"
                    title="Supprimer cette période"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            
            {trialPeriods.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p>Aucune période d'essai configurée</p>
                <button
                  onClick={handleAddPeriod}
                  className="mt-4 bg-[color:var(--color-primary)] text-white px-4 py-2 rounded-lg hover:bg-[color:var(--color-primary-dark)] transition-colors inline-flex items-center gap-2"
                >
                  <Plus size={16} />
                  Créer une période d'essai
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal pour créer/éditer une période */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">
                  {editingPeriod ? 'Modifier la période' : 'Nouvelle période d\'essai'}
                </h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la période *
                </label>
                <input
                  type="text"
                  value={newPeriod.name || ''}
                  onChange={(e) => setNewPeriod({...newPeriod, name: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ex: Essai standard"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jours
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newPeriod.days || 0}
                    onChange={(e) => setNewPeriod({...newPeriod, days: parseInt(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minutes
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newPeriod.minutes || 0}
                    onChange={(e) => setNewPeriod({...newPeriod, minutes: parseInt(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newPeriod.description || ''}
                  onChange={(e) => setNewPeriod({...newPeriod, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={3}
                  placeholder="Description optionnelle..."
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSavePeriod}
                disabled={!newPeriod.name}
                className="bg-[color:var(--color-primary)] text-white px-4 py-2 rounded-lg hover:bg-[color:var(--color-primary-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingPeriod ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {deletingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center mb-4 text-red-600">
              <AlertCircle className="h-6 w-6 mr-2" />
              <h3 className="text-lg font-medium">Confirmer la suppression</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Êtes-vous sûr de vouloir supprimer cette période d'essai ? Cette action est irréversible.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={confirmDeletePeriod}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrialPeriodsManager;
