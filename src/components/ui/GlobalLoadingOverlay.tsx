import React from 'react';
import { LoadingSpinner, SpinnerType } from './index';

interface GlobalLoadingOverlayProps {
  /**
   * Indique si le composant est visible
   */
  isVisible: boolean;
  
  /**
   * Type de spinner à afficher
   * @default 'pulse'
   */
  spinnerType?: SpinnerType;
  
  /**
   * Message à afficher
   * @default 'Chargement en cours...'
   */
  message?: string;
  
  /**
   * Délai avant d'afficher le spinner (ms)
   * @default 300
   */
  delay?: number;
  
  /**
   * Niveau de transparence du fond
   * @default 0.7
   */
  bgOpacity?: number;
}

/**
 * Composant de superposition de chargement global
 * Affiche un spinner et un message sur un fond semi-transparent
 */
const GlobalLoadingOverlay: React.FC<GlobalLoadingOverlayProps> = ({
  isVisible,
  spinnerType = 'pulse',
  message = 'Chargement en cours...',
  delay = 300,
  bgOpacity = 0.7
}) => {
  const [shouldRender, setShouldRender] = React.useState(false);
  
  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (isVisible) {
      // Attendre le délai spécifié avant d'afficher
      timeoutId = setTimeout(() => {
        setShouldRender(true);
      }, delay);
    } else {
      setShouldRender(false);
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isVisible, delay]);
  
  if (!shouldRender) return null;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: `rgba(47, 47, 47, ${bgOpacity})`, backdropFilter: 'blur(4px)' }}
    >
      <div className="text-center p-6 rounded-lg flex flex-col items-center">
        <LoadingSpinner 
          type={spinnerType} 
          size="xl" 
          label={message}
        />
      </div>
    </div>
  );
};

export default GlobalLoadingOverlay;
