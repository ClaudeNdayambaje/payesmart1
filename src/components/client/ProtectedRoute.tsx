import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { auth } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { checkSubscriptionStatus, SubscriptionStatus } from '../../services/subscriptionVerificationService';
import SubscriptionExpiredModal from './SubscriptionExpiredModal';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/auth' 
}) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const location = useLocation();
  
  useEffect(() => {
    const checkAuth = async () => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setAuthenticated(true);
          
          try {
            // Vérifier le statut de l'abonnement ou de la période d'essai
            const status = await checkSubscriptionStatus(user.uid);
            console.log('Statut de l\'abonnement:', status);
            setSubscriptionStatus(status);
            
            // Afficher la modale si l'abonnement ou la période d'essai a expiré
            if (status.subscriptionExpired || status.trialExpired) {
              setShowExpiredModal(true);
            }
          } catch (error) {
            console.error('Erreur lors de la vérification du statut de l\'abonnement:', error);
          }
        } else {
          // Vérifier si une déconnexion admin est en cours
          const adminLogoutInProgress = localStorage.getItem('admin_logout_in_progress') === 'true';
          
          // Si une déconnexion admin est en cours, ne pas déclencher la redirection automatique
          // Le flag sera retiré lors du prochain chargement de page
          if (adminLogoutInProgress) {
            console.log('Déconnexion admin détectée - désactivation des redirections automatiques');
            // On garde l'état authentifié à true pour éviter la redirection
            setAuthenticated(true);
            // On nettoiera le flag après 2 secondes pour les futures déconnexions
            setTimeout(() => {
              localStorage.removeItem('admin_logout_in_progress');
            }, 2000);
          } else {
            // Comportement normal pour les autres cas
            setAuthenticated(false);
            setSubscriptionStatus(null);
          }
        }
        
        setLoading(false);
      });
      
      return unsubscribe;
    };
    
    const unsubscribe = checkAuth();
    return () => {
      // Nettoyer l'écouteur d'authentification
      unsubscribe.then(unsub => unsub && unsub());
    };
  }, []);
  
  // Gérer la fermeture de la modale d'expiration
  const handleCloseExpiredModal = () => {
    setShowExpiredModal(false);
    // Rediriger vers la page de connexion
    window.location.href = redirectTo;
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
          <p className="mt-4 text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }
  
  if (!authenticated) {
    // Rediriger vers la page de connexion avec l'emplacement actuel comme état
    // pour pouvoir rediriger l'utilisateur vers la page qu'il voulait visiter après la connexion
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }
  
  // Afficher la modale si l'abonnement ou la période d'essai a expiré
  if (showExpiredModal && subscriptionStatus) {
    return <SubscriptionExpiredModal 
      subscriptionStatus={subscriptionStatus} 
      onClose={handleCloseExpiredModal} 
    />;
  }
  
  // Si l'utilisateur est authentifié et a un abonnement actif ou est en période d'essai valide
  return <>{children}</>;
};

export default ProtectedRoute;
