import React from 'react';
import { Loader2 } from 'lucide-react';
import './LoadingSpinner.css';

export type SpinnerType = 'circle' | 'pulse' | 'bars' | 'dots' | 'progress';
export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface LoadingSpinnerProps {
  /**
   * Type du spinner
   * @default 'circle'
   */
  type?: SpinnerType;
  
  /**
   * Taille du spinner
   * @default 'md'
   */
  size?: SpinnerSize;
  
  /**
   * Couleur personnalisée (remplace la couleur par défaut)
   */
  color?: string;
  
  /**
   * Texte à afficher sous le spinner
   */
  label?: string;
  
  /**
   * Indique si le spinner doit être centré dans son conteneur
   * @default false
   */
  centered?: boolean;
  
  /**
   * Indique si le spinner est dans un bouton
   * @default false
   */
  inButton?: boolean;
  
  /**
   * Indique si le spinner doit être en plein écran avec un fond semi-transparent
   * @default false
   */
  fullScreen?: boolean;
  
  /**
   * Classes CSS additionnelles
   */
  className?: string;
}

/**
 * Composant de spinner de chargement avec plusieurs variantes
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  type = 'circle',
  size = 'md',
  color,
  label,
  centered = false,
  inButton = false,
  fullScreen = false,
  className = '',
}) => {
  // Définir les classes CSS en fonction des props
  const sizeClasses = {
    xs: 'spinner-xs',
    sm: 'spinner-sm',
    md: 'spinner-md',
    lg: 'spinner-lg',
    xl: 'spinner-xl',
  };
  
  // Style personnalisé si une couleur est fournie
  const customStyle = color ? { '--spinner-color': color } as React.CSSProperties : {};
  
  // Générer le spinner en fonction du type
  const renderSpinner = () => {
    switch (type) {
      case 'circle':
        return <div className={`spinner-circle ${sizeClasses[size]}`} style={customStyle} />;
      
      case 'pulse':
        return <div className={`spinner-pulse ${sizeClasses[size]}`} style={customStyle} />;
      
      case 'bars':
        return (
          <div className={`spinner-bars ${sizeClasses[size]}`} style={customStyle}>
            <div className="spinner-bar"></div>
            <div className="spinner-bar"></div>
            <div className="spinner-bar"></div>
            <div className="spinner-bar"></div>
          </div>
        );
      
      case 'dots':
        return (
          <div className={`spinner-dots ${sizeClasses[size]}`} style={customStyle}>
            <div className="spinner-dot"></div>
            <div className="spinner-dot"></div>
            <div className="spinner-dot"></div>
          </div>
        );
      
      case 'progress':
        return (
          <div className="progress-container" style={customStyle}>
            <div className="progress-bar"></div>
          </div>
        );
      
      default:
        // Fallback à l'icône Loader2 de Lucide
        return <Loader2 className={`animate-spin ${sizeClasses[size]}`} style={customStyle} />;
    }
  };
  
  // Composant bouton avec spinner intégré
  if (inButton) {
    return (
      <div className="spinner-mini" style={customStyle}></div>
    );
  }
  
  // Spinner en plein écran avec fond semi-transparent
  if (fullScreen) {
    return (
      <div className="spinner-fullscreen">
        <div className="spinner-overlay">
          <div className="spinner-container">
            {renderSpinner()}
            {label && <p className="spinner-label">{label}</p>}
          </div>
        </div>
      </div>
    );
  }
  
  // Spinner standard
  const containerClasses = `
    ${centered ? 'spinner-centered' : ''}
    ${className}
  `;
  
  return (
    <div className={containerClasses.trim()}>
      <div className="spinner-container">
        {renderSpinner()}
        {label && <p className="spinner-label">{label}</p>}
      </div>
    </div>
  );
};

export default LoadingSpinner;
