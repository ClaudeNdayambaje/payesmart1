import React, { useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import './dark-mode-fix.css';

/**
 * Composant qui injecte des corrections CSS pour le mode sombre
 * et gère les problèmes de fond blanc persistants
 */
const ThemeFixes: React.FC = () => {
  const { theme } = useTheme();
  
  useEffect(() => {
    // Forcer l'application du thème à tous les éléments avec bg-white fixe
    const applyDarkModeOverrides = () => {
      if (theme === 'dark') {
        // Sélectionner tous les éléments avec un fond blanc qui ne changent pas en mode sombre
        document.querySelectorAll('tr, tbody, td, th').forEach(el => {
          // Vérifier si l'élément a un fond blanc explicite
          const style = window.getComputedStyle(el);
          if (style.backgroundColor === 'rgb(255, 255, 255)') {
            // Appliquer le fond sombre approprié
            el.setAttribute('style', 'background-color: var(--color-card-bg) !important');
          }
          
          // S'assurer que le texte est visible
          if (style.color === 'rgb(0, 0, 0)' || style.color === 'rgb(17, 24, 39)') {
            el.setAttribute('style', el.getAttribute('style') + '; color: var(--color-text) !important');
          }
        });
      }
    };

    // Appliquer immédiatement
    applyDarkModeOverrides();
    
    // Créer un observateur de mutations pour détecter les changements DOM
    const observer = new MutationObserver(applyDarkModeOverrides);
    
    // Observer tout le document pour les changements
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });
    
    return () => {
      observer.disconnect();
    };
  }, [theme]);
  
  return null; // Ce composant ne rend rien visuellement
};

export default ThemeFixes;
