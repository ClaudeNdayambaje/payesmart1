import React from 'react';
import { formatDate, formatDateTime } from '../../utils/dateUtils';

interface DateDisplayProps {
  timestamp: number;
  showTime?: boolean;
  className?: string;
  placeholder?: string;
}

/**
 * Composant pour afficher une date formatée
 * 
 * @param timestamp - Timestamp à afficher (en millisecondes)
 * @param showTime - Si true, affiche également l'heure
 * @param className - Classes CSS additionnelles
 * @param placeholder - Texte à afficher si la date est invalide
 */
const DateDisplay: React.FC<DateDisplayProps> = ({
  timestamp,
  showTime = false,
  className = '',
  placeholder = '-'
}) => {
  if (!timestamp) {
    return <span className={className}>{placeholder}</span>;
  }

  try {
    const formattedDate = showTime 
      ? formatDateTime(timestamp)
      : formatDate(timestamp);
    
    return <span className={className}>{formattedDate}</span>;
  } catch (error) {
    console.error('Erreur lors du formatage de la date:', error);
    return <span className={className}>{placeholder}</span>;
  }
};

export default DateDisplay;
