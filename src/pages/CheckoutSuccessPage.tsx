import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const CheckoutSuccessPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Extraire l'ID de session de l'URL
    const queryParams = new URLSearchParams(location.search);
    const sessionId = queryParams.get('session_id');
    
    // Dans une implémentation réelle, nous vérifirions la session Stripe ici
    // Pour l'instant, nous simulons simplement un délai
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [location]);

  const handleContinue = () => {
    navigate('/admin/saas');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
        {loading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            <p className="mt-4 text-lg text-gray-700">Vérification du paiement...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="rounded-full bg-green-100 p-3">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Paiement réussi !</h2>
            <p className="mt-2 text-center text-gray-700">
              Merci pour votre abonnement. Votre compte a été activé avec succès.
            </p>
            <div className="mt-6">
              <button
                onClick={handleContinue}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Continuer vers votre compte
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutSuccessPage;
