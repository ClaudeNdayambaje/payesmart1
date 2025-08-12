import React, { useState, useEffect } from 'react';
import { SubscriptionPlan } from '../../types/saas';
import SubscriptionPlanForm from './SubscriptionPlanForm';
import { 
  getSubscriptionPlans, 
  addSubscriptionPlan, 
  updateSubscriptionPlan, 
  deleteSubscriptionPlan,
  initializeDefaultPlans
} from '../../services/subscriptionPlanService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Search, Plus, Eye, EyeOff, RefreshCw } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';

const SubscriptionPlansManager: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<SubscriptionPlan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [showPricingCards, setShowPricingCards] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Initialiser les plans par défaut s'ils n'existent pas
      await initializeDefaultPlans();
      
      // Récupérer tous les plans
      const plansData = await getSubscriptionPlans();
      setPlans(plansData);
      setFilteredPlans([]);
      setSearchTerm('');
    } catch (error) {
      console.error('Erreur lors de la récupération des plans:', error);
      setError('Impossible de charger les plans d\'abonnement. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = () => {
    if (searchTerm.trim() === '') {
      setFilteredPlans([]);
      return;
    }

    const results = plans.filter(plan => 
      plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.price.toString().includes(searchTerm) ||
      plan.features.some(feature => feature.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    setFilteredPlans(results);
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
      await deleteSubscriptionPlan(planId);
      setPlans(plans.filter(plan => plan.id !== planId));
    } catch (error) {
      console.error('Erreur lors de la suppression du plan:', error);
      setError('Impossible de supprimer le plan. Veuillez réessayer plus tard.');
    }
  };

  const handleSavePlan = async (planData: Omit<SubscriptionPlan, 'id'>) => {
    try {
      if (editingPlan) {
        // Mise à jour d'un plan existant
        await updateSubscriptionPlan(editingPlan.id, planData);
        setPlans(plans.map(plan => 
          plan.id === editingPlan.id ? { ...planData, id: editingPlan.id } : plan
        ));
      } else {
        // Ajout d'un nouveau plan
        const newPlan = await addSubscriptionPlan(planData);
        setPlans([...plans, newPlan]);
      }
      
      setShowForm(false);
      setEditingPlan(undefined);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du plan:', error);
      setError('Impossible d\'enregistrer le plan. Veuillez réessayer plus tard.');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPlan(undefined);
  };

  // Afficher les plans sous forme de cartes de prix
  const renderPricingCards = () => {
    return (
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-6">Aperçu des plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map(plan => (
            <div 
              key={plan.id} 
              className={`rounded-lg shadow-lg overflow-hidden ${plan.name === 'Pro' ? 'border-2 border-indigo-500' : 'border border-gray-200'}`}
            >
              {plan.name === 'Pro' && (
                <div className="bg-indigo-500 text-white text-center py-1 text-sm font-medium">
                  Recommandé
                </div>
              )}
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                
                <div className="mt-4">
                  <span className="text-3xl font-bold">{plan.price} €</span>
                  <span className="text-gray-500 text-sm">/{plan.billingCycle === 'monthly' ? 'mois' : plan.billingCycle === 'annually' ? 'an' : plan.billingCycle}</span>
                </div>
                
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-6">
                  <button
                    onClick={() => handleEditPlan(plan)}
                    className={`w-full py-2 px-4 rounded-md text-sm font-medium ${
                      plan.name === 'Pro' 
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Modifier ce plan
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const togglePricingCards = () => {
    setShowPricingCards(!showPricingCards);
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {showForm ? (
        <SubscriptionPlanForm 
          plan={editingPlan}
          onSave={handleSavePlan}
          onCancel={handleCancel}
        />
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <h2 className="text-xl font-bold text-gray-800">Plans d'abonnement</h2>
              
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="flex rounded-md overflow-hidden border border-gray-300 flex-grow md:flex-grow-0 md:w-64">
                  <Input
                    type="text"
                    placeholder="Rechercher un plan..."
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button 
                    variant="ghost" 
                    className="border-l rounded-none px-2" 
                    onClick={handleSearch}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                
                <Button
                  variant="outline"
                  className="gap-1 whitespace-nowrap"
                  onClick={fetchPlans}
                >
                  <RefreshCw className="h-4 w-4" />
                  Actualiser
                </Button>
                
                <Button 
                  className="gap-1 whitespace-nowrap"
                  onClick={handleAddPlan}
                >
                  <Plus className="h-4 w-4" />
                  Nouveau plan
                </Button>
                
                <Button
                  variant={showPricingCards ? "default" : "outline"}
                  className="gap-1 whitespace-nowrap"
                  onClick={togglePricingCards}
                >
                  {showPricingCards ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      Masquer aperçu
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      Voir aperçu
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {filteredPlans.length > 0 || searchTerm ? (
              <div className="mb-4">
                <p className="text-sm text-gray-500">
                  {filteredPlans.length} résultat(s) trouvé(s) pour "{searchTerm}"
                </p>
              </div>
            ) : null}
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Prix</TableHead>
                    <TableHead>Cycle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(filteredPlans.length > 0 ? filteredPlans : plans).map(plan => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{plan.description}</TableCell>
                      <TableCell>{plan.price} {plan.currency}</TableCell>
                      <TableCell>
                        {plan.billingCycle === 'monthly' ? 'Mensuel' : 
                         plan.billingCycle === 'annually' ? 'Annuel' : 
                         plan.billingCycle === 'quarterly' ? 'Trimestriel' : 
                         plan.billingCycle}
                      </TableCell>
                      <TableCell>
                        <Badge variant={plan.active ? "success" : "destructive"}>
                          {plan.active ? "Actif" : "Inactif"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditPlan(plan)}
                        >
                          Modifier
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeletePlan(plan.id)}
                        >
                          Supprimer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {plans.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                        Aucun plan d'abonnement trouvé. Créez-en un nouveau.
                      </TableCell>
                    </TableRow>
                  )}
                  {plans.length > 0 && filteredPlans.length === 0 && searchTerm && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                        Aucun résultat trouvé pour "{searchTerm}"
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          
          {plans.length > 0 && showPricingCards && renderPricingCards()}
        </>
      )}
    </div>
  );
};

export default SubscriptionPlansManager;
