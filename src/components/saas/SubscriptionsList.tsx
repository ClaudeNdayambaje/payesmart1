import React, { useState, useEffect } from 'react';
import { Subscription, SubscriptionPlan } from '../../types/saas';
import { Business } from '../../types';
import { getSubscriptions } from '../../services/subscriptionService';
import { getSubscriptionPlans } from '../../services/subscriptionPlanService';
import { getAllBusinesses } from '../../services/getAllBusinesses';

interface SubscriptionsListProps {
  onEditSubscription: (subscription: Subscription) => void;
  onAddSubscription: () => void;
  onCancelSubscription: (subscriptionId: string) => void;
  refreshTrigger?: number; // Déclencheur pour rafraîchir la liste
}

const SubscriptionsList: React.FC<SubscriptionsListProps> = ({
  onEditSubscription,
  onAddSubscription,
  onCancelSubscription,
  refreshTrigger = 0
}) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [businesses, setBusinesses] = useState<Record<string, Business>>({});
  const [plans, setPlans] = useState<Record<string, SubscriptionPlan>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cancelConfirmation, setCancelConfirmation] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Récupérer les abonnements
        const subscriptionsData = await getSubscriptions();
        setSubscriptions(subscriptionsData);

        // Récupérer les entreprises (vrais clients PayeSmart)
        const businessesData = await getAllBusinesses();
        const businessesMap: Record<string, Business> = {};
        businessesData.forEach(business => {
          businessesMap[business.id] = business;
        });
        setBusinesses(businessesMap);

        // Récupérer les plans d'abonnement
        const plansData = await getSubscriptionPlans();
        const plansMap: Record<string, SubscriptionPlan> = {};
        plansData.forEach(plan => {
          plansMap[plan.id] = plan;
        });
        setPlans(plansMap);
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
        setError('Impossible de charger les abonnements. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshTrigger]); // Rafraîchir lorsque refreshTrigger change

  // Filtrer les abonnements par terme de recherche
  const filteredSubscriptions = subscriptions.filter(subscription => {
    const business = businesses[subscription.clientId];
    const plan = plans[subscription.planId];
    
    if (!business || !plan) return false;
    
    return (
      business.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${business.ownerFirstName} ${business.ownerLastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Formater la date
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Obtenir la classe CSS pour le statut
  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'expired':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Obtenir le texte du statut
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'cancelled':
        return 'Annulé';
      case 'expired':
        return 'Expiré';
      case 'pending':
        return 'En attente';
      default:
        return status;
    }
  };

  // Calculer le temps restant
  const getRemainingTime = (endDate: number): string => {
    const now = Date.now();
    const diffTime = endDate - now;
    
    if (diffTime <= 0) {
      return 'Expiré';
    }
    
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 30) {
      const diffMonths = Math.floor(diffDays / 30);
      return `${diffMonths} mois`;
    }
    
    return `${diffDays} jours`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Gestion des Abonnements</h2>
        <button 
          onClick={onAddSubscription}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Ajouter un abonnement
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Rechercher un abonnement..."
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : filteredSubscriptions.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {searchTerm ? 'Aucun abonnement ne correspond à votre recherche.' : 'Aucun abonnement enregistré.'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubscriptions.map(subscription => {
                const business = businesses[subscription.clientId];
                const plan = plans[subscription.planId];
                
                if (!business || !plan) return null;
                
                return (
                  <tr key={subscription.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{business.businessName}</div>
                      <div className="text-xs text-gray-500">{business.ownerFirstName} {business.ownerLastName}</div>
                      <div className="text-xs text-gray-500 italic">{business.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{plan.name}</div>
                      <div className="text-xs text-gray-500">{plan.price} € / {plan.billingCycle === 'monthly' ? 'mois' : plan.billingCycle}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(subscription.startDate)} - {formatDate(subscription.endDate)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Reste: {getRemainingTime(subscription.endDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadgeClass(subscription.status)}`}>
                        {getStatusText(subscription.status)}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {subscription.autoRenew ? 'Renouvellement auto' : 'Sans renouvellement'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => onEditSubscription(subscription)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Modifier
                      </button>
                      {subscription.status === 'active' && (
                        cancelConfirmation === subscription.id ? (
                          <>
                            <button 
                              onClick={() => {
                                onCancelSubscription(subscription.id);
                                setCancelConfirmation(null);
                              }}
                              className="text-red-600 hover:text-red-900 mr-2"
                            >
                              Confirmer
                            </button>
                            <button 
                              onClick={() => setCancelConfirmation(null)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              Annuler
                            </button>
                          </>
                        ) : (
                          <button 
                            onClick={() => setCancelConfirmation(subscription.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Résilier
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SubscriptionsList;
