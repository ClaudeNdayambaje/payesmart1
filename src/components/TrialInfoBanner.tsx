import React, { useState, useEffect } from 'react';
import { getRemainingTrialTime } from '../services/trialConfigService';
import { Clock, AlertTriangle } from 'lucide-react';

interface TrialInfoBannerProps {
  businessId?: string;
  trialEndDate?: number;
}

const TrialInfoBanner: React.FC<TrialInfoBannerProps> = ({ businessId, trialEndDate }) => {
  const [remainingTime, setRemainingTime] = useState<{ days: number, hours: number, minutes: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const loadRemainingTime = async () => {
      try {
        // Si aucun businessId n'est fourni, essayer de le récupérer du localStorage
        const effectiveBusinessId = businessId || localStorage.getItem('businessId');
        
        if (!effectiveBusinessId) {
          console.log('Aucun identifiant d\'entreprise disponible pour afficher la période d\'essai');
          setLoading(false);
          return;
        }
        
        const time = await getRemainingTrialTime(effectiveBusinessId, trialEndDate);
        setRemainingTime(time);
        setError(null);
      } catch (error) {
        console.error('Erreur lors du chargement du temps restant:', error);
        setError('Impossible de charger les informations de période d\'essai');
      } finally {
        setLoading(false);
      }
    };

    loadRemainingTime();

    // Rafraîchir toutes les minutes
    const interval = window.setInterval(loadRemainingTime, 60 * 1000);
    setRefreshInterval(interval);

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [businessId, trialEndDate]);

  if (loading) {
    return null;
  }

  if (error || !remainingTime) {
    return null;
  }

  const { days, hours, minutes } = remainingTime;
  const totalMinutes = days * 24 * 60 + hours * 60 + minutes;

  // Pas d'affichage si la période d'essai est terminée
  if (totalMinutes <= 0) {
    return null;
  }

  // Formater le temps restant de manière concise
  const getTimeDisplay = () => {
    if (days > 0) {
      return `${days}j ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // Déterminer le style en fonction du temps restant
  const getStatusColor = () => {
    if (days === 0) {
      if (hours < 24) {
        if (hours < 1) {
          return {
            text: 'text-red-600',
            bg: 'bg-red-50',
            border: 'border-red-200'
          };
        }
        return {
          text: 'text-orange-500',
          bg: 'bg-orange-50',
          border: 'border-orange-200'
        };
      }
    }
    return {
      text: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200'
    };
  };

  const statusStyle = getStatusColor();

  // Affichage intégré au centre tout en bas de l'interface
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
      <div 
        className={`flex items-center ${statusStyle.bg} ${statusStyle.text} border-x ${statusStyle.border} border-t rounded-t-md py-1 px-3 shadow-md cursor-pointer`}
        onClick={() => setShowDetails(!showDetails)}
        onMouseEnter={() => setShowDetails(true)}
        onMouseLeave={() => setShowDetails(false)}
      >
        <Clock className="w-3.5 h-3.5 mr-1.5" />
        <span className="text-xs font-medium whitespace-nowrap">
          Version d'essai: {getTimeDisplay()} restant
        </span>
        
        {/* Détails au survol */}
        {showDetails && (
          <div className="absolute bottom-full mb-1 bg-white rounded-md shadow-lg p-3 border border-gray-200 min-w-[220px] text-left z-50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                {days === 0 && hours < 1 ? (
                  <AlertTriangle className={`w-4 h-4 mr-2 ${statusStyle.text}`} />
                ) : (
                  <Clock className={`w-4 h-4 mr-2 ${statusStyle.text}`} />
                )}
                <span className="font-medium text-gray-800">Version d'essai</span>
              </div>
              {days === 0 && hours < 24 && (
                <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                  {hours < 1 ? 'Expire bientôt' : 'Moins de 24h'}
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-2 my-2">
              <div className={`${statusStyle.bg} p-2 rounded text-center`}>
                <div className="text-lg font-bold">{days}</div>
                <div className="text-xs">jour{days > 1 ? 's' : ''}</div>
              </div>
              <div className={`${statusStyle.bg} p-2 rounded text-center`}>
                <div className="text-lg font-bold">{hours}</div>
                <div className="text-xs">heure{hours > 1 ? 's' : ''}</div>
              </div>
              <div className={`${statusStyle.bg} p-2 rounded text-center`}>
                <div className="text-lg font-bold">{minutes}</div>
                <div className="text-xs">minute{minutes > 1 ? 's' : ''}</div>
              </div>
            </div>
            
            <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xs text-gray-500">
                Besoin de plus de temps?
              </span>
              <a 
                href="#" 
                className="text-xs font-medium text-blue-600 hover:text-blue-800"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open('https://payesmart.com/pricing', '_blank');
                }}
              >
                Voir les abonnements
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrialInfoBanner;
