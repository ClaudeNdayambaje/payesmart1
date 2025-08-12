import React from 'react';

interface LogoSelectorProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Composant pour afficher le logo approprié selon le contexte (clair ou sombre)
 */
const LogoSelector: React.FC<LogoSelectorProps> = ({ 
  variant = 'dark', 
  size = 'md',
  className = ''
}) => {
  // Déterminer la source du logo en fonction de la variante
  const logoSrc = variant === 'light' ? '/logo.png' : '/logo2.png';
  
  // Déterminer la taille du logo
  const sizeClass = {
    sm: 'h-8 w-auto',
    md: 'h-12 w-auto',
    lg: 'h-16 w-auto'
  }[size];
  
  return (
    <img 
      src={logoSrc} 
      alt="Logo PayeSmart" 
      className={`${sizeClass} ${className}`}
      onError={(e) => {
        // Fallback si le logo n'existe pas
        (e.target as HTMLImageElement).style.display = 'none';
      }}
    />
  );
};

export default LogoSelector;
