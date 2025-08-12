import React, { useEffect, useState } from 'react';
import { checkSubscriptionStatus } from '../services/subscriptionVerificationService';
import { AlertTriangle } from 'lucide-react';

const TrialExpiredBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    const checkTrialStatus = async () => {
      try {
        // Récupérer l'ID de l'entreprise depuis le localStorage
        const businessId = localStorage.getItem('businessId');
        
        if (businessId) {
          // Vérifier le statut de l'abonnement
          const status = await checkSubscriptionStatus(businessId);
          console.log('Statut de la période d\'essai:', status);
          
          // Si la période d'essai est expirée, afficher la bannière
          if (status.trialExpired) {
            setMessage('Votre période d\'essai a expiré. Veuillez contacter le support pour activer votre abonnement.');
            setShowBanner(true);
          } else if (status.subscriptionExpired) {
            setMessage('Votre abonnement a expiré. Veuillez le renouveler pour continuer à utiliser l\'application.');
            setShowBanner(true);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de la période d\'essai:', error);
      }
    };
    
    checkTrialStatus();
  }, []);
  
  if (!showBanner) return null;
  
  return (
    <div className="bg-red-600 text-white p-3 flex items-center justify-center">
      <AlertTriangle className="mr-2 h-5 w-5" />
      <p className="text-sm font-medium">{message}</p>
      <button 
        className="ml-4 bg-white text-red-600 px-3 py-1 rounded-md text-xs font-medium"
        onClick={() => window.location.href = '/auth?action=plans'}
      >
        Voir les abonnements
      </button>
    </div>
  );
};

export default TrialExpiredBanner;
