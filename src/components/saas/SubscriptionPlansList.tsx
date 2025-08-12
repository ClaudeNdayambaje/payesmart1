import React, { useState, useEffect } from 'react';
import { SubscriptionPlan } from '../../types/saas';

interface SubscriptionPlansListProps {
  plans: SubscriptionPlan[];
  onEditPlan: (plan: SubscriptionPlan) => void;
  onAddPlan: () => void;
  onDeletePlan: (planId: string) => void;
}

const SubscriptionPlansList: React.FC<SubscriptionPlansListProps> = ({ 
  plans, 
  onEditPlan, 
  onAddPlan,
  onDeletePlan
}) => {
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);

  const getBillingCycleText = (cycle: string): string => {
    switch (cycle) {
      case 'monthly': return 'Mensuel';
      case 'quarterly': return 'Trimestriel';
      case 'biannually': return 'Semestriel';
      case 'annually': return 'Annuel';
      default: return cycle;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Plans d'abonnement</h2>
        <button 
          onClick={onAddPlan}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Ajouter un plan
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Aucun plan d'abonnement disponible.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cycle</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {plans.map(plan => (
                <tr key={plan.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{plan.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{plan.description.substring(0, 50)}{plan.description.length > 50 ? '...' : ''}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{plan.price} €</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{getBillingCycleText(plan.billingCycle)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${plan.isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                      {plan.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => onEditPlan(plan)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      Modifier
                    </button>
                    {deleteConfirmation === plan.id ? (
                      <>
                        <button 
                          onClick={() => {
                            onDeletePlan(plan.id);
                            setDeleteConfirmation(null);
                          }}
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
      )}
    </div>
  );
};

export default SubscriptionPlansList;
