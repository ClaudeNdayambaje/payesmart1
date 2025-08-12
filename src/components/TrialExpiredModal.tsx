import React from 'react';
import { Button } from './ui/button';
import { AlertTriangle, ArrowRight, Home } from 'lucide-react';

interface TrialExpiredModalProps {
  expiryDate?: Date;
  onClose: () => void;
}

const TrialExpiredModal: React.FC<TrialExpiredModalProps> = ({ 
  expiryDate, 
  onClose 
}) => {
  // Formater la date d'expiration si elle existe
  const formattedDate = expiryDate 
    ? new Date(expiryDate).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    : '';

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 mx-4 border border-gray-100 transform transition-all duration-300 scale-100">
        <div className="text-center">
          {/* Icône d'avertissement avec animation subtile */}
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-50 mb-6 animate-pulse duration-2000">
            <AlertTriangle className="h-10 w-10 text-red-500" />
          </div>
          
          {/* Titre avec style amélioré */}
          <h3 className="text-2xl font-bold text-gray-800 mb-3">Période d'essai expirée</h3>
          
          {/* Ligne de séparation élégante */}
          <div className="w-16 h-1 bg-red-500 mx-auto mb-4 rounded-full"></div>
          
          {/* Message avec meilleure typographie */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            Votre période d'essai a pris fin.
            <br />
            Pour continuer à utiliser toutes les fonctionnalités de PayeSmart,
            veuillez souscrire à l'une de nos formules d'abonnement.
          </p>
          
          {/* Date d'expiration avec style amélioré */}
          {formattedDate && (
            <div className="bg-gray-50 py-3 px-4 rounded-lg mb-6 inline-block">
              <p className="text-sm text-gray-600">
                Date d'expiration: <span className="font-bold text-gray-800">{formattedDate}</span>
              </p>
            </div>
          )}
          
          {/* Boutons d'action avec meilleur design */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-2">
            <Button 
              onClick={() => window.location.href = '/'}
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-medium py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Home className="h-4 w-4" />
              Voir les formules d'abonnement
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            
            <Button 
              onClick={onClose}
              className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-300"
            >
              Retour à la connexion
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialExpiredModal;
