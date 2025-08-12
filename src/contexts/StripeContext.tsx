import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { getStripePromise } from '../services/stripeService';
import { useLocation } from 'react-router-dom';

interface StripeContextType {
  // Ajoute ici des fonctions ou des états spécifiques à Stripe si nécessaire
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

export const useStripe = (): StripeContextType => {
  const context = useContext(StripeContext);
  if (context === undefined) {
    throw new Error('useStripe doit être utilisé à l\'intérieur d\'un StripeProvider');
  }
  return context;
};

interface StripeProviderProps {
  children: ReactNode;
}

export const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  // Utilise le hook useLocation pour détecter la page actuelle
  const location = useLocation();
  const [shouldLoadStripe, setShouldLoadStripe] = useState(false);
  
  // Vérifier si nous sommes sur une page d'authentification
  useEffect(() => {
    // Ne pas charger Stripe sur les pages d'authentification
    const isAuthPage = location.pathname === '/auth' || 
                       location.hash === '#/auth' ||
                       location.pathname === '/login' ||
                       location.hash === '#/login' ||
                       location.pathname === '/register' ||
                       location.hash === '#/register';
    
    setShouldLoadStripe(!isAuthPage);
  }, [location]);

  const value: StripeContextType = {
    // Ajoute ici des valeurs ou des fonctions à exposer
  };

  // Rendu conditionnel - ne charge Stripe que si nécessaire
  if (shouldLoadStripe) {
    return (
      <StripeContext.Provider value={value}>
        <Elements stripe={getStripePromise()}>
          {children}
        </Elements>
      </StripeContext.Provider>
    );
  }
  
  // Rendu sans Stripe pour les pages d'authentification
  return (
    <StripeContext.Provider value={value}>
      {children}
    </StripeContext.Provider>
  );
};

export default StripeProvider;
