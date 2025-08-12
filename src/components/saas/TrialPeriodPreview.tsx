import React, { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';

interface TrialPeriodPreviewProps {
  days: number;
  minutes: number;
  className?: string;
}

const TrialPeriodPreview: React.FC<TrialPeriodPreviewProps> = ({ days, minutes, className = '' }) => {
  const [startDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  
  // Calculer la date de fin en fonction des jours et minutes
  useEffect(() => {
    const newEndDate = new Date(startDate);
    newEndDate.setDate(newEndDate.getDate() + days);
    newEndDate.setMinutes(newEndDate.getMinutes() + minutes);
    setEndDate(newEndDate);
  }, [days, minutes, startDate]);
  
  // Formater les dates pour l'affichage
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  const formatDateTime = (date: Date): string => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Calculer la durée totale en texte
  const getDurationText = (): string => {
    if (days > 0 && minutes > 0) {
      return `${days} jour${days > 1 ? 's' : ''} et ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else if (days > 0) {
      return `${days} jour${days > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      return 'Aucune durée';
    }
  };
  
  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <h3 className="text-sm font-medium text-blue-800 mb-2">Prévisualisation de la période d'essai</h3>
      
      <div className="grid grid-cols-1 gap-3">
        <div className="flex items-center">
          <div className="bg-blue-100 rounded-full p-2 mr-3">
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-blue-600">Durée</p>
            <p className="text-sm font-medium">{getDurationText()}</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="bg-blue-100 rounded-full p-2 mr-3">
            <Calendar className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-blue-600">Date de début</p>
            <p className="text-sm font-medium">{formatDate(startDate)}</p>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="bg-blue-100 rounded-full p-2 mr-3">
            <Calendar className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-blue-600">Date de fin</p>
            <p className="text-sm font-medium">
              {minutes > 0 ? formatDateTime(endDate) : formatDate(endDate)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialPeriodPreview;
