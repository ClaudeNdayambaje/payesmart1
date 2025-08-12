import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSubscriptionPlanById } from '../services/subscriptionPlanService';
import { useAuth } from '../hooks/useAuth';
import { createSubscriptionCheckoutSession } from '../services/stripeService';
import { SubscriptionPlan } from '../types/saas';

const SubscriptionCheckoutPage: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const fetchPlan = async () => {
      if (!planId) {
        setError('ID du plan non fourni');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const fetchedPlan = await getSubscriptionPlanById(planId);
        if (!fetchedPlan) {
          setError('Plan non trouvé');
        } else {
          setPlan(fetchedPlan);
          
          // Si l'utilisateur est connecté, rediriger automatiquement vers Stripe
          if (user) {
            redirectToStripe(fetchedPlan);
          }
        }
      } catch (err: any) {
        console.error('Erreur lors de la récupération du plan:', err);
        setError(`Impossible de récupérer les détails du plan: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [planId, user]);

  const redirectToStripe = async (selectedPlan: SubscriptionPlan) => {
    if (!user) {
      navigate('/auth', { state: { redirectTo: `/subscribe/${planId}` } });
      return;
    }

    try {
      setRedirecting(true);
      
      // Générer des URLs de succès et d'annulation basées sur l'environnement actuel
      const baseUrl = window.location.origin;
      const successUrl = `${baseUrl}/#/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${baseUrl}/#/checkout/canceled`;
      
      // Créer une session de paiement Stripe
      const { url } = await createSubscriptionCheckoutSession(
        user.uid, 
        selectedPlan.id,
        successUrl,
        cancelUrl
      );
      
      // Rediriger vers la page de paiement Stripe
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('URL de session de paiement non générée');
      }
    } catch (err: any) {
      console.error('Erreur lors de la redirection vers Stripe:', err);
      setError(`Impossible de procéder au paiement: ${err.message}`);
      setRedirecting(false);
    }
  };

  const handleLogin = () => {
    navigate('/auth', { state: { redirectTo: `/subscribe/${planId}` } });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <div className="text-red-500 text-xl mb-4">⚠️ Erreur</div>
          <p className="text-gray-700">{error}</p>
          <button 
            onClick={() => navigate('/plans')} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retour aux plans
          </button>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="text-center p-8 bg-white rounded-lg shadow-md max-w-md">
          <p className="text-gray-700">Plan non trouvé</p>
          <button 
            onClick={() => navigate('/plans')} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Voir tous les plans
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="px-6 py-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
            S'abonner au plan {plan.name}
          </h2>
          
          <div className="mb-6">
            <div className="flex justify-center mb-6">
              <span className="text-4xl font-extrabold">{plan.price.toFixed(2)} €</span>
              <span className="text-xl text-gray-500 self-end mb-1 ml-1">/{plan.billingCycle === 'monthly' ? 'mois' : 'an'}</span>
            </div>
            
            <p className="text-center text-gray-600 mb-6">{plan.description}</p>
            
            <div className="space-y-3 mb-8">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
          
          {user ? (
            <button
              onClick={() => redirectToStripe(plan)}
              disabled={redirecting}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150"
            >
              {redirecting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Redirection vers Stripe...
                </span>
              ) : (
                'Procéder au paiement'
              )}
            </button>
          ) : (
            <div className="space-y-4">
              <p className="text-center text-gray-700">Connectez-vous pour vous abonner</p>
              <button
                onClick={handleLogin}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150"
              >
                Se connecter
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCheckoutPage;
