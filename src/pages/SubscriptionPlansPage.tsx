import React, { useEffect, useState } from 'react';
import { getSubscriptionPlans } from '../services/subscriptionPlanService';
import ModernSubscriptionPlanCard from '../components/saas/ModernSubscriptionPlanCard';
import { SubscriptionPlan } from '../types/saas';
import { useAuth } from '../hooks/useAuth';

const SubscriptionPlansPage: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Utilisé pour vérifier si l'utilisateur est connecté pour personnaliser l'expérience
  const { user } = useAuth();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const fetchedPlans = await getSubscriptionPlans();
        
        // Filtrer les plans actifs uniquement pour les utilisateurs non-admin
        const activePlans = fetchedPlans.filter((plan: SubscriptionPlan) => plan.active);
        setPlans(activePlans);
      } catch (err: any) {
        console.error('Erreur lors de la récupération des plans:', err);
        setError('Impossible de charger les plans d\'abonnement. Veuillez réessayer plus tard.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

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
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <div className="text-red-500 text-xl mb-4">⚠️ Erreur</div>
          <p className="text-gray-700">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Nos plans d'abonnement
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Choisissez le plan qui correspond le mieux à vos besoins
          </p>
        </div>

        {plans.length === 0 ? (
          <div className="text-center p-8 bg-white rounded-lg shadow-md">
            <p className="text-gray-700">Aucun plan d'abonnement disponible pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <ModernSubscriptionPlanCard 
                key={plan.id} 
                plan={plan}
                isPopular={index === 1} // Le deuxième plan est marqué comme "populaire"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionPlansPage;
