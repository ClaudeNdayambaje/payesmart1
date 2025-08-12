import React from 'react';
import { useNavigate } from 'react-router-dom';

const CheckoutCanceledPage: React.FC = () => {
  const navigate = useNavigate();

  const handleReturnToPlans = () => {
    navigate('/admin/saas?tab=plans');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8">
        <div className="flex flex-col items-center">
          <div className="rounded-full bg-yellow-100 p-3">
            <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Paiement annulé</h2>
          <p className="mt-2 text-center text-gray-700">
            Vous avez annulé le processus de paiement. Aucuns frais n'ont été prélevés.
          </p>
          <div className="mt-6">
            <button
              onClick={handleReturnToPlans}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Retourner aux plans d'abonnement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutCanceledPage;
