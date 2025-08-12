import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { SubscriptionPlan } from '../../types/saas';
import StripeCheckoutButton from './StripeCheckoutButton';

interface ModernSubscriptionPlanCardProps {
  plan: SubscriptionPlan;
  isPopular?: boolean;
  onEditPlan?: (plan: SubscriptionPlan) => void;
  onDeletePlan?: (planId: string) => void;
  isAdmin?: boolean;
}

const ModernSubscriptionPlanCard: React.FC<ModernSubscriptionPlanCardProps> = ({
  plan,
  isPopular = false,
  onEditPlan,
  onDeletePlan,
  isAdmin = false
}) => {
  const { user } = useAuth();

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: plan.currency || 'EUR'
    }).format(amount);
  };

  const formatBillingCycle = (cycle: string): string => {
    switch (cycle) {
      case 'monthly':
        return '/mois';
      case 'yearly':
        return '/an';
      case 'quarterly':
        return '/trimestre';
      case 'biannually':
        return '/semestre';
      default:
        return '';
    }
  };

  return (
    <div className={`relative rounded-lg shadow-lg overflow-hidden border ${isPopular ? 'border-blue-500' : 'border-gray-200'} h-full flex flex-col`}>
      {isPopular && (
        <div className="absolute top-0 right-0 bg-blue-500 text-white px-4 py-1 text-sm font-semibold">
          Populaire
        </div>
      )}
      
      <div className={`px-6 py-8 ${isPopular ? 'bg-blue-50' : 'bg-white'}`}>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
        <p className="text-gray-600 mb-6 h-12 overflow-hidden">{plan.description}</p>
        
        <div className="flex items-baseline mb-8">
          <span className="text-4xl font-extrabold text-gray-900">{formatCurrency(plan.price)}</span>
          <span className="ml-1 text-xl text-gray-500">{formatBillingCycle(plan.billingCycle)}</span>
        </div>
        
        <div className="space-y-4">
          {plan.features && plan.features.map((feature, index) => (
            <div key={index} className="flex items-start">
              <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span className="text-gray-700">{feature}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="px-6 py-4 bg-gray-50 mt-auto">
        {isAdmin ? (
          <div className="flex space-x-2">
            <button
              onClick={() => onEditPlan && onEditPlan(plan)}
              className="flex-1 py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Modifier
            </button>
            <button
              onClick={() => onDeletePlan && onDeletePlan(plan.id)}
              className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Supprimer
            </button>
          </div>
        ) : (
          user ? (
            <StripeCheckoutButton
              userId={user.uid}
              plan={plan}
              buttonText="Choisir ce plan"
              buttonClassName="w-full py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            />
          ) : (
            <button
              className="w-full py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => {
                // Vérifier si on est dans un iframe
                const isInIframe = window !== window.parent;
                
                if (isInIframe) {
                  // Dans un iframe, envoyer un message au parent
                  window.parent.postMessage({
                    type: 'navigate',
                    url: window.location.origin + '/#/auth'
                  }, '*');
                } else {
                  // Navigation normale si on n'est pas dans un iframe
                  window.location.href = '/#/auth';
                }
              }}
            >
              Connectez-vous pour vous abonner
            </button>
          )
        )}
      </div>
    </div>
  );
};

export default ModernSubscriptionPlanCard;
