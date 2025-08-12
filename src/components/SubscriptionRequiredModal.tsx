import React, { useEffect } from 'react';
import { X, AlertTriangle, Info, ArrowRight, Home, Calendar, Clock } from 'lucide-react';
import ReactDOM from 'react-dom';

interface SubscriptionRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  statusCode?: string;
  onSubscribe?: () => void;
  subscriptionEndDate?: Date;
}

const ModalContent: React.FC<SubscriptionRequiredModalProps> = ({
  isOpen,
  onClose,
  message,
  statusCode = 'no_subscription',
  onSubscribe,
  subscriptionEndDate
}) => {
  // Empêcher le défilement du corps lorsque le modal est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  console.log('Rendu du contenu du modal d\'abonnement:', { isOpen, message, statusCode });
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center p-4" 
         style={{ zIndex: 9999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 transform transition-all duration-300 scale-100" 
           onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          {/* En-tête avec icône et titre */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-red-50 p-3 rounded-full animate-pulse duration-2000">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-xl font-bold text-gray-800">
                  {statusCode === 'trial_expired' ? 'Période d\'essai expirée' : 'Abonnement requis'}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="bg-gray-100 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-full p-2 transition-colors duration-200 focus:outline-none"
            >
              <span className="sr-only">Fermer</span>
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Ligne de séparation élégante */}
          <div className="w-16 h-1 bg-red-500 mb-6 rounded-full"></div>
          
          {/* Message principal */}
          <div className="mb-6">
            <p className="text-gray-600 mb-4 leading-relaxed">
              {message}
            </p>
            
            {statusCode === 'no_subscription' && (
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Info className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700 font-medium">
                      Pour accéder au logiciel de caisse PayeSmart, vous devez disposer d'un abonnement actif.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {statusCode === 'trial_expired' && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Clock className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700 font-medium">
                      Votre période d'essai a pris fin. Pour continuer à utiliser toutes les fonctionnalités de PayeSmart, veuillez souscrire à un abonnement.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {statusCode === 'subscription_expired' && (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Calendar className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-amber-700 font-medium">
                      {subscriptionEndDate ? 
                        `Votre abonnement a expiré depuis le ${subscriptionEndDate.toLocaleDateString('fr-FR')}. Veuillez le renouveler pour continuer à utiliser l'application.` :
                        `Votre abonnement a expiré. Pour continuer à utiliser PayeSmart, veuillez renouveler votre abonnement.`
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {(statusCode === 'error' || !statusCode) && (
              <div className="bg-gray-50 border-l-4 border-gray-500 p-4 rounded-r-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Info className="h-5 w-5 text-gray-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-700 font-medium">
                      Pour accéder à votre compte, vous devez disposer d'un abonnement actif ou être en période d'essai.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Boutons d'action avec meilleur design */}
          <div className="flex flex-col sm:flex-row justify-end gap-4">
            <button
              type="button"
              className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-300"
              onClick={onClose}
            >
              Retour à la connexion
            </button>
            
            {onSubscribe && (
              <button
                type="button"
                className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-medium py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
                onClick={() => {
                  // Rediriger vers la page d'accueil si c'est une expiration de période d'essai
                  if (statusCode === 'trial_expired') {
                    window.location.href = '/';
                  } else {
                    onSubscribe();
                  }
                }}
              >
                <Home className="h-4 w-4" />
                {statusCode === 'subscription_expired' ? 'Renouveler mon abonnement' : 
                 statusCode === 'trial_expired' ? 'Voir les formules d\'abonnement' : 
                 'Voir les formules d\'abonnement'}
                <ArrowRight className="h-4 w-4 ml-1" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const SubscriptionRequiredModal: React.FC<SubscriptionRequiredModalProps> = (props) => {
  console.log('Appel du modal d\'abonnement avec props:', props);
  
  // Créer un élément div pour le portail si nécessaire
  useEffect(() => {
    let portalRoot = document.getElementById('subscription-modal-root');
    if (!portalRoot) {
      portalRoot = document.createElement('div');
      portalRoot.id = 'subscription-modal-root';
      document.body.appendChild(portalRoot);
    }
    
    return () => {
      const existingRoot = document.getElementById('subscription-modal-root');
      if (existingRoot && existingRoot.childNodes.length === 0) {
        document.body.removeChild(existingRoot);
      }
    };
  }, []);
  
  // Utiliser un portail pour rendre le modal directement dans le body
  const portalRoot = document.getElementById('subscription-modal-root');
  if (!portalRoot) return null;
  
  return ReactDOM.createPortal(
    <ModalContent {...props} />,
    portalRoot
  );
};

export default SubscriptionRequiredModal;
