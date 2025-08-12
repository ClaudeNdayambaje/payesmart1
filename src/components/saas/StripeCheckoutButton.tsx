import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSubscriptionCheckoutSession } from '../../services/stripeService';
import { SubscriptionPlan } from '../../types/saas';

interface StripeCheckoutButtonProps {
  userId: string;
  plan: SubscriptionPlan;
  buttonText?: string;
  buttonClassName?: string;
  onError?: (error: Error) => void;
  onSuccess?: () => void;
}

const StripeCheckoutButton: React.FC<StripeCheckoutButtonProps> = ({
  userId,
  plan,
  buttonText = 'S\'abonner',
  buttonClassName = 'bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700',
  onError,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleClick = async () => {
    try {
      setLoading(true);
      
      // Générer des URLs de succès et d'annulation basées sur l'environnement actuel
      const baseUrl = window.location.origin;
      const successUrl = `${baseUrl}/#/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${baseUrl}/#/checkout/canceled`;
      
      // Créer une session de paiement Stripe
      const { url } = await createSubscriptionCheckoutSession(
        userId, 
        plan.id,
        successUrl,
        cancelUrl
      );
      
      // Rediriger vers la page de paiement Stripe
      if (url) {
        window.location.href = url;
        if (onSuccess) onSuccess();
      } else {
        throw new Error('URL de session de paiement non générée');
      }
    } catch (error: any) {
      console.error('Erreur lors de la création de la session de paiement:', error);
      if (onError) onError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={buttonClassName}
      disabled={loading}
    >
      {loading ? (
        <span className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Traitement en cours...
        </span>
      ) : (
        buttonText
      )}
    </button>
  );
};

export default StripeCheckoutButton;
