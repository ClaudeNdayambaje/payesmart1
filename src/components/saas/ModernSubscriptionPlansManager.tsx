import React, { useState, useEffect } from 'react';
import { SubscriptionPlan } from '../../types/saas';
import { 
  getSubscriptionPlans, 
  addSubscriptionPlan, 
  updateSubscriptionPlan, 
  deleteSubscriptionPlan,
  initializeDefaultPlans
} from '../../services/subscriptionPlanService';
import SubscriptionPlanForm from './SubscriptionPlanForm';

const ModernSubscriptionPlansManager: React.FC = () => {
  // États
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | undefined>(undefined);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showPricingCards, setShowPricingCards] = useState(false);

  // Statistiques
  const [totalPlans, setTotalPlans] = useState(0);
  const [activePlans, setActivePlans] = useState(0);
  const [averagePrice, setAveragePrice] = useState(0);
  const [mostPopularPlan, setMostPopularPlan] = useState<string>('');

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    if (plans.length > 0) {
      calculateStats();
    }
  }, [plans]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Initialiser les plans par défaut s'ils n'existent pas
      await initializeDefaultPlans();
      
      // Récupérer tous les plans
      const plansData = await getSubscriptionPlans();
      setPlans(plansData);
    } catch (error) {
      console.error('Erreur lors de la récupération des plans:', error);
      setError('Impossible de charger les plans d\'abonnement. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour réinitialiser tous les plans (utile si les plans ont une structure incorrecte)
  const resetAllPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 1. Récupérer tous les plans existants
      const existingPlans = await getSubscriptionPlans();
      
      // 2. Supprimer tous les plans existants
      for (const plan of existingPlans) {
        await deleteSubscriptionPlan(plan.id);
      }
      
      // 3. Réinitialiser les plans par défaut
      await initializeDefaultPlans();
      
      // 4. Récupérer les nouveaux plans
      const newPlans = await getSubscriptionPlans();
      setPlans(newPlans);
      
      // Message de succès
      alert('Les plans d\'abonnement ont été réinitialisés avec succès.');
    } catch (error) {
      console.error('Erreur lors de la réinitialisation des plans:', error);
      setError('Impossible de réinitialiser les plans d\'abonnement. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    // Nombre total de plans
    setTotalPlans(plans.length);
    
    // Nombre de plans actifs
    const activePlansCount = plans.filter(plan => plan.active).length;
    setActivePlans(activePlansCount);
    
    // Prix moyen
    const totalPrice = plans.reduce((total, plan) => total + plan.price, 0);
    setAveragePrice(totalPrice / plans.length || 0);
    
    // Plan le plus populaire (à implémenter avec des données réelles ultérieurement)
    if (plans.length > 0) {
      // Pour l'instant, on choisit le plan avec le prix le plus élevé comme "plus populaire"
      const mostPopular = plans.reduce((prev, current) => 
        (prev.price > current.price) ? prev : current
      );
      setMostPopularPlan(mostPopular.name);
    }
  };

  const handleAddPlan = () => {
    setEditingPlan(undefined);
    setShowForm(true);
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setShowForm(true);
  };

  const handleDeletePlan = async (planId: string) => {
    try {
      setLoading(true);
      console.log(`Tentative de suppression du plan avec l'ID: ${planId}`);
      
      // Désactiver d'abord le plan avant de le supprimer (approche progressive)
      try {
        const planToDelete = plans.find(p => p.id === planId);
        if (planToDelete && planToDelete.active) {
          // Désactiver le plan avant de le supprimer peut aider à éviter certains problèmes
          await updateSubscriptionPlan(planId, { active: false });
          console.log(`Le plan ${planId} a été désactivé avant suppression`);
        }
      } catch (deactivateError) {
        console.warn('Erreur lors de la désactivation du plan avant suppression:', deactivateError);
        // Continuer avec la suppression même si la désactivation échoue
      }
      
      // Supprimer le plan
      await deleteSubscriptionPlan(planId);
      console.log(`Plan ${planId} supprimé avec succès`);
      
      // Mettre à jour l'interface utilisateur
      setPlans(plans.filter(plan => plan.id !== planId));
      setDeleteConfirmation(null);
      
      // Afficher un message de succès
      alert('Le plan a été supprimé avec succès.');
    } catch (error) {
      console.error('Erreur lors de la suppression du plan:', error);
      setError('Impossible de supprimer le plan. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async (plan: Omit<SubscriptionPlan, "id"> & { id?: string }) => {
    try {
      let savedPlan: SubscriptionPlan;
      
      if (editingPlan && plan.id) {
        // Mise à jour d'un plan existant
        const planId = plan.id;
        const planData = { ...plan };
        delete planData.id; // Supprimer l'ID pour éviter les erreurs
        
        await updateSubscriptionPlan(planId, planData as Partial<SubscriptionPlan>);
        
        // Récupérer le plan mis à jour
        savedPlan = {
          ...plan,
          updatedAt: Date.now()
        } as SubscriptionPlan;
        
        setPlans(plans.map(p => p.id === savedPlan.id ? savedPlan : p));
      } else {
        // Ajout d'un nouveau plan
        const newPlanData = { ...plan } as Omit<SubscriptionPlan, "id">;
        if ('id' in newPlanData) {
          delete (newPlanData as any).id;
        }
        
        savedPlan = await addSubscriptionPlan(newPlanData);
        setPlans([...plans, savedPlan]);
      }
      
      setShowForm(false);
      setEditingPlan(undefined);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du plan:', error);
      setError('Impossible d\'enregistrer le plan. Veuillez réessayer plus tard.');
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingPlan(undefined);
  };

  const getBillingCycleText = (cycle: string): string => {
    switch (cycle) {
      case 'monthly': return 'Mensuel';
      case 'quarterly': return 'Trimestriel';
      case 'biannually': return 'Semestriel';
      case 'annually': return 'Annuel';
      default: return cycle;
    }
  };

  // Filtrer les plans en fonction de la recherche et du filtre actif
  const filteredPlans = plans.filter(plan => {
    const matchesSearch = plan.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          plan.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeFilter === 'all') return matchesSearch;
    if (activeFilter === 'active') return matchesSearch && plan.active;
    if (activeFilter === 'inactive') return matchesSearch && !plan.active;
    
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* En-tête avec titre et bouton d'ajout */}
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Titre à gauche */}
          <div className="md:w-1/4 w-full">
            <h1 className="text-2xl font-bold text-gray-900">Plans d'abonnement</h1>
            <p className="text-gray-600 mt-1">Gérez les offres d'abonnement disponibles pour vos clients</p>
          </div>
          
          {/* Barre de recherche centrée */}
          <div className="flex justify-center items-center md:w-1/3 w-full">
            <div className="relative w-full max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Rechercher un plan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* Filtres et boutons à droite */}
          <div className="flex flex-col md:flex-row items-center gap-3 md:w-auto justify-end">
            <button
              onClick={resetAllPlans}
              className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md text-sm font-medium transition-colors shadow-sm flex items-center gap-1"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Réinitialiser
            </button>
            <div className="flex space-x-2">
              <button
                className={`px-3 py-2 text-xs font-medium rounded-md ${
                  activeFilter === 'all' 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setActiveFilter('all')}
              >
                Tous
              </button>
              <button
                className={`px-3 py-2 text-xs font-medium rounded-md ${
                  activeFilter === 'active' 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setActiveFilter('active')}
              >
                Actifs
              </button>
              <button
                className={`px-3 py-2 text-xs font-medium rounded-md ${
                  activeFilter === 'inactive' 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setActiveFilter('inactive')}
              >
                Inactifs
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Ajouter un plan
              </button>
              
              <button
                onClick={() => setShowPricingCards(!showPricingCards)}
                className={`flex items-center gap-1 px-3 py-1.5 ${showPricingCards ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-600 hover:bg-gray-700'} text-white rounded-md text-sm font-medium transition-colors shadow-sm`}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={showPricingCards ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7" : "M15 12a3 3 0 11-6 0 3 3 0 016 0z"} />
                  {showPricingCards ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  )}
                </svg>
                {showPricingCards ? 'Masquer aperçu' : 'Voir aperçu'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques des plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total des plans */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="rounded-full bg-blue-100 p-3 mr-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total des plans</p>
              <p className="text-2xl font-bold text-gray-900">{totalPlans}</p>
            </div>
          </div>
        </div>

        {/* Plans actifs */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="rounded-full bg-green-100 p-3 mr-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Plans actifs</p>
              <p className="text-2xl font-bold text-gray-900">{activePlans}</p>
            </div>
          </div>
        </div>

        {/* Prix moyen */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="rounded-full bg-purple-100 p-3 mr-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Prix moyen</p>
              <p className="text-2xl font-bold text-gray-900">{averagePrice.toFixed(2)} €</p>
            </div>
          </div>
        </div>

        {/* Plan le plus populaire */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="rounded-full bg-yellow-100 p-3 mr-4">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Plan populaire</p>
              <p className="text-lg font-bold text-gray-900 truncate max-w-[150px]">{mostPopularPlan}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Affichage des plans */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">
            <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2 text-gray-600">Chargement des plans...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <svg className="h-12 w-12 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p className="mt-2 text-red-600">{error}</p>
            <button 
              onClick={fetchPlans}
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Réessayer
            </button>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="h-16 w-16 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">Aucun plan trouvé</h3>
            <p className="mt-1 text-gray-500">
              {searchTerm ? 'Aucun plan ne correspond à votre recherche.' : 'Commencez par ajouter un plan d\'abonnement.'}
            </p>
            <button 
              onClick={handleAddPlan}
              className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium inline-flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Ajouter un plan
            </button>
          </div>
        ) : (
          <div>
            {/* Table des plans */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prix
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cycle
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fonctionnalités
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPlans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                            {plan.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{plan.name}</div>
                            <div className="text-sm text-gray-500 max-w-xs truncate">{plan.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">{plan.price.toFixed(2)} €</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{getBillingCycleText(plan.billingCycle)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          plan.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {plan.active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <ul className="list-disc list-inside">
                            {plan.features.slice(0, 2).map((feature, index) => (
                              <li key={index} className="truncate max-w-[200px]">{feature}</li>
                            ))}
                            {plan.features.length > 2 && (
                              <li className="text-indigo-600">+{plan.features.length - 2} autres</li>
                            )}
                          </ul>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditPlan(plan)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Modifier
                        </button>
                        {deleteConfirmation === plan.id ? (
                          <>
                            <button
                              onClick={() => handleDeletePlan(plan.id)}
                              className="text-red-600 hover:text-red-900 mr-2"
                            >
                              Confirmer
                            </button>
                            <button
                              onClick={() => setDeleteConfirmation(null)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              Annuler
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmation(plan.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Supprimer
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Aperçu des plans */}
      {showPricingCards && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-6">Aperçu des plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.filter(plan => plan.active).map((plan) => (
            <div key={plan.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="bg-indigo-600 text-white p-6">
                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{plan.price.toFixed(2)} €</span>
                  <span className="text-indigo-200">/{plan.billingCycle === 'monthly' ? 'mois' : 
                                                    plan.billingCycle === 'quarterly' ? 'trimestre' : 
                                                    plan.billingCycle === 'biannually' ? 'semestre' : 'an'}</span>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-6">{plan.description}</p>
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className="w-full mt-8 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md transition-colors duration-300">
                  Sélectionner ce plan
                </button>
              </div>
            </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulaire de plan */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">
                  {editingPlan ? 'Modifier le plan' : 'Ajouter un plan'}
                </h2>
                <button 
                  onClick={handleCancelForm}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              <SubscriptionPlanForm 
                plan={editingPlan} 
                onSave={handleSavePlan} 
                onCancel={handleCancelForm} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernSubscriptionPlansManager;
