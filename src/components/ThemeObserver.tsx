import React, { useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

// Fonction utilitaire pour déterminer si une couleur est sombre
const isColorDark = (color: string): boolean => {
  // Convertir les couleurs hexadécimales en RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculer la luminosité perçue
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
};

// Fonction utilitaire pour éclaircir une couleur
const lightenColor = (color: string, amount: number): string => {
  // Convertir les couleurs hexadécimales en RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Éclaircir les valeurs RGB
  const newR = Math.min(255, r + amount * 2.55);
  const newG = Math.min(255, g + amount * 2.55);
  const newB = Math.min(255, b + amount * 2.55);
  
  // Reconvertir en hexadécimal
  return `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;
};

// Fonction utilitaire pour assombrir une couleur
const darkenColor = (color: string, amount: number): string => {
  // Convertir les couleurs hexadécimales en RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Assombrir les valeurs RGB
  const newR = Math.max(0, r - amount * 2.55);
  const newG = Math.max(0, g - amount * 2.55);
  const newB = Math.max(0, b - amount * 2.55);
  
  // Reconvertir en hexadécimal
  return `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;
};

// Interface pour les props
interface ThemeObserverProps {
  excludeLoginPage?: boolean;
}

/**
 * Composant amélioré du ThemeObserver
 * Ce composant applique les couleurs du thème et écoute les événements de mise à jour forcée
 */
const ThemeObserver: React.FC<ThemeObserverProps> = ({ excludeLoginPage = false }) => {
  const { theme, colors } = useTheme();
  
  // Utilisation de excludeLoginPage pour conditionnellement appliquer le thème
  // Cette vérification empêche l'application du thème sur la page de connexion si demandé
  useEffect(() => {
    // Si on exclut la page de connexion et qu'on est sur la page de connexion, ne pas appliquer le thème
    if (excludeLoginPage && window.location.pathname.includes('/login')) {
      console.log('ThemeObserver: Page de connexion exclue, thème non appliqué');
      return;
    }
  }, [excludeLoginPage]);

  // Fonction pour appliquer les couleurs complètes au document
  const applyColorsToDocument = (colorSet: any) => {
    console.log('ThemeObserver: Application des couleurs au document', colorSet);
    
    const rootElement = document.documentElement;
    const bodyElement = document.body;
    
    // Nettoyer les anciennes classes de thème
    const themeClasses = ['dark', 'theme-default', 'theme-light', 'theme-blue', 'theme-green', 'theme-purple', 'theme-orange', 'theme-custom', 'theme-black', 'theme-darkgray', 'theme-red', 'theme-navyblue', 'theme-darkgreen', 'theme-burgundy', 'theme-teal', 'theme-slate', 'theme-chocolate', 'theme-indigo', 'theme-crimson', 'theme-charcoal'];
    
    themeClasses.forEach(cls => {
      rootElement.classList.remove(cls);
      bodyElement.classList.remove(cls);
    });

    // Appliquer la classe du thème actuel
    if (theme === 'dark') {
      rootElement.classList.add('dark');
      bodyElement.classList.add('dark');
    } else {
      const themeClass = `theme-${theme}`;
      rootElement.classList.add(themeClass);
      bodyElement.classList.add(themeClass);
    }

    // Appliquer les couleurs de base
    if (colorSet.primary) rootElement.style.setProperty('--color-primary', colorSet.primary);
    if (colorSet.secondary) rootElement.style.setProperty('--color-secondary', colorSet.secondary);
    if (colorSet.accent) rootElement.style.setProperty('--color-accent', colorSet.accent);
    if (colorSet.background) rootElement.style.setProperty('--color-background', colorSet.background);
    if (colorSet.text) rootElement.style.setProperty('--color-text', colorSet.text);
    if (colorSet.success) rootElement.style.setProperty('--color-success', colorSet.success);
    if (colorSet.warning) rootElement.style.setProperty('--color-warning', colorSet.warning);
    if (colorSet.error) rootElement.style.setProperty('--color-error', colorSet.error);
    
    // Appliquer des variantes de couleurs pour l'interface
    if (colorSet.primary) {
      rootElement.style.setProperty('--color-primary-light', lightenColor(colorSet.primary, 10));
      rootElement.style.setProperty('--color-primary-lighter', lightenColor(colorSet.primary, 20));
      rootElement.style.setProperty('--color-primary-dark', darkenColor(colorSet.primary, 10));
      
      // Couleur du texte sur fond primaire (pour la barre latérale)
      const primaryIsDark = isColorDark(colorSet.primary);
      rootElement.style.setProperty('--color-text-on-primary', primaryIsDark ? '#ffffff' : '#000000');
      rootElement.style.setProperty('--color-sidebar-text', primaryIsDark ? '#ffffff' : '#000000');
      
      // S'assurer que la barre latérale a la bonne couleur de fond
      document.querySelectorAll('.sidebar, .sidebar-container').forEach((sidebar: Element) => {
        if (sidebar instanceof HTMLElement) {
          sidebar.style.backgroundColor = colorSet.primary;
          sidebar.style.color = primaryIsDark ? '#ffffff' : '#000000';
        }
      });
      
      // Appliquer la couleur aux items de la barre latérale
      document.querySelectorAll('.sidebar-item, .sidebar-link').forEach((item: Element) => {
        if (item instanceof HTMLElement) {
          item.style.color = primaryIsDark ? '#ffffff' : '#000000';
        }
      });
    }
    
    if (colorSet.secondary) {
      rootElement.style.setProperty('--color-secondary-light', lightenColor(colorSet.secondary, 10));
      rootElement.style.setProperty('--color-secondary-lighter', lightenColor(colorSet.secondary, 20));
      rootElement.style.setProperty('--color-secondary-dark', darkenColor(colorSet.secondary, 10));
    }
    
    if (colorSet.background) {
      const isDark = isColorDark(colorSet.background);
      // Couleurs de fond alternatives pour les cartes, formulaires, etc.
      rootElement.style.setProperty('--color-background-alt', isDark ? lightenColor(colorSet.background, 10) : darkenColor(colorSet.background, 5));
      rootElement.style.setProperty('--color-card-bg', isDark ? lightenColor(colorSet.background, 15) : '#ffffff');
      rootElement.style.setProperty('--color-border', isDark ? lightenColor(colorSet.background, 20) : darkenColor(colorSet.background, 10));
    }
    
    // Forcer un reflow pour s'assurer que les styles sont appliqués
    void document.documentElement.offsetHeight;
  };

  // Fonction spécifique pour appliquer les styles à la barre latérale
  const applySidebarStyles = (colorSet: any) => {
    if (!colorSet?.primary) return;
    
    console.log('ThemeObserver: Application des styles de la barre latérale');
    const primaryIsDark = isColorDark(colorSet.primary);
    const textColor = primaryIsDark ? '#ffffff' : '#000000';
    
    // Sélecteurs pour la barre latérale
    const sidebarSelectors = [
      '.sidebar', '.sidebar-container', '.sidebar-wrapper', '.sidebar-content',
      '.side-nav', '.side-menu', '.app-sidebar', '#sidebar'
    ];
    
    // Sélecteurs pour les éléments de la barre latérale
    const sidebarItemSelectors = [
      '.sidebar-item', '.sidebar-link', '.sidebar-menu-item', '.sidebar-button',
      '.sidebar a', '.sidebar button', '.side-nav-item', '.side-menu-item'
    ];
    
    // Appliquer le style à tous les éléments qui correspondent aux sélecteurs
    sidebarSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach((element: Element) => {
        if (element instanceof HTMLElement) {
          element.style.backgroundColor = colorSet.primary;
          element.style.color = textColor;
        }
      });
    });
    
    sidebarItemSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach((element: Element) => {
        if (element instanceof HTMLElement) {
          element.style.color = textColor;
        }
      });
    });
    
    // Appliquer également aux icônes de la barre latérale
    document.querySelectorAll('.sidebar-icon, .sidebar svg, .sidebar-item svg, .sidebar-link svg').forEach((element: Element) => {
      if (element instanceof SVGElement) {
        element.style.fill = textColor;
        element.style.color = textColor;
      }
    });
  };

  // Appliquer les couleurs au chargement du composant
  useEffect(() => {
    // Vérifier si on doit exclure la page de connexion
    if (excludeLoginPage && window.location.pathname.includes('/login')) {
      console.log('ThemeObserver: Page de connexion détectée, thème non appliqué');
      return;
    }
    
    try {
      if (colors) {
        applyColorsToDocument(colors);
        applySidebarStyles(colors); // Appliquer également les styles de la barre latérale
      }
    } catch (error) {
      console.error('Erreur dans ThemeObserver lors de l\'application initiale des couleurs:', error);
    }
  }, [theme, colors, excludeLoginPage]);
  
  // Écouter l'événement forceThemeUpdate pour mettre à jour le thème à la demande
  useEffect(() => {
    const handleForceThemeUpdate = (event: Event) => {
      try {
        console.log('ThemeObserver: Événement forceThemeUpdate reçu');
        
        // Extraction des données de l'événement si disponibles
        const customEvent = event as CustomEvent;
        if (customEvent.detail && customEvent.detail.theme) {
          console.log('ThemeObserver: Détail du thème reçu:', customEvent.detail.theme);
        }
        
        // Appliquer les couleurs du thème actuel immédiatement
        if (colors) {
          console.log('ThemeObserver: Application forcée des couleurs');
          applyColorsToDocument(colors);
          
          // Appliquer plusieurs fois avec des intervalles croissants
          // pour s'assurer que tout est correctement appliqué même pour les composants
          // qui se chargent tardivement ou les changements de route
          const intervals = [100, 300, 600];
          
          intervals.forEach((delay, index) => {
            setTimeout(() => {
              console.log(`ThemeObserver: Application différée des couleurs (${index + 1}/${intervals.length})`);
              applyColorsToDocument(colors);
              
              // S'assurer que la barre latérale est correctement stylée après chaque application
              applySidebarStyles(colors);
              
              // Émettre un événement après la dernière application
              if (index === intervals.length - 1) {
                const themeAppliedEvent = new CustomEvent('themeFullyApplied', {
                  detail: { success: true }
                });
                document.dispatchEvent(themeAppliedEvent);
                console.log('ThemeObserver: Événement themeFullyApplied émis');
              }
            }, delay);
          });
        }
      } catch (error) {
        console.error('ThemeObserver: Erreur lors du traitement de l\'événement forceThemeUpdate:', error);
      }
    };
    
    // Écouter l'événement forceThemeUpdate
    document.addEventListener('forceThemeUpdate', handleForceThemeUpdate);
    
    // Appliquer le thème immédiatement et à nouveau après un court délai
    if (colors) {
      applyColorsToDocument(colors);
      
      // Application différée pour s'assurer que les styles sont bien appliqués
      // même lorsque certains composants sont chargés tardivement
      setTimeout(() => {
        applyColorsToDocument(colors);
      }, 200);
    }
    
    // Nettoyer l'écouteur à la destruction du composant
    return () => {
      document.removeEventListener('forceThemeUpdate', handleForceThemeUpdate);
    };
  }, [colors]);

  // Ce composant ne rend rien visuellement
  return null;
};

export default ThemeObserver;
