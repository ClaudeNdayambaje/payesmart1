import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { themeEventBus } from '../ThemeEventBus';
import { getSettings } from '../services/settingsService';

/**
 * Composant qui garantit la persistance du thème lors des changements de route
 * Ce composant force l'application du thème actuel lors des changements de page
 */
const ThemePersistence: React.FC = () => {
  const location = useLocation();

  // Fonction pour forcer le rechargement du thème à partir des paramètres
  const forceSyncTheme = async () => {
    console.log('ThemePersistence: Synchronisation forcée du thème lors du changement de route', location.pathname);
    
    try {
      // Récupérer les paramètres actuels
      const settings = await getSettings();
      
      // Vérifier si les paramètres d'apparence sont disponibles
      if (settings.appearance && settings.appearance.selectedTheme) {
        console.log('ThemePersistence: Thème trouvé dans les paramètres', settings.appearance.selectedTheme);
        
        // Récupérer le thème et les couleurs
        const themeId = settings.appearance.selectedTheme;
        
        // Définir les thèmes prédéfinis
        const predefinedThemes = {
          default: { primary: '#4f46e5', secondary: '#10b981', accent: '#f59e0b', background: '#ffffff', text: '#1f2937', success: '#10b981', warning: '#f59e0b', error: '#ef4444' },
          red: { primary: '#dc2626', secondary: '#b91c1c', accent: '#ef4444', background: '#ffffff', text: '#111827', success: '#10b981', warning: '#f59e0b', error: '#ef4444' },
          purple: { primary: '#7c3aed', secondary: '#8b5cf6', accent: '#a78bfa', background: '#ffffff', text: '#1f2937', success: '#10b981', warning: '#f59e0b', error: '#ef4444' },
          blue: { primary: '#2563eb', secondary: '#3b82f6', accent: '#60a5fa', background: '#ffffff', text: '#1f2937', success: '#10b981', warning: '#f59e0b', error: '#ef4444' },
          green: { primary: '#059669', secondary: '#10b981', accent: '#34d399', background: '#ffffff', text: '#1f2937', success: '#10b981', warning: '#f59e0b', error: '#ef4444' },
          orange: { primary: '#d97706', secondary: '#f59e0b', accent: '#fbbf24', background: '#ffffff', text: '#1f2937', success: '#10b981', warning: '#f59e0b', error: '#ef4444' },
          black: { primary: '#111827', secondary: '#374151', accent: '#4b5563', background: '#ffffff', text: '#1f2937', success: '#10b981', warning: '#f59e0b', error: '#ef4444' },
          darkgray: { primary: '#4b5563', secondary: '#6b7280', accent: '#9ca3af', background: '#ffffff', text: '#1f2937', success: '#10b981', warning: '#f59e0b', error: '#ef4444' },
          navyblue: { primary: '#1e3a8a', secondary: '#1d4ed8', accent: '#3b82f6', background: '#ffffff', text: '#1f2937', success: '#10b981', warning: '#f59e0b', error: '#ef4444' },
          darkgreen: { primary: '#065f46', secondary: '#047857', accent: '#10b981', background: '#ffffff', text: '#1f2937', success: '#10b981', warning: '#f59e0b', error: '#ef4444' },
          teal: { primary: '#0f766e', secondary: '#14b8a6', accent: '#2dd4bf', background: '#ffffff', text: '#1f2937', success: '#10b981', warning: '#f59e0b', error: '#ef4444' },
          burgundy: { primary: '#9f1239', secondary: '#be123c', accent: '#e11d48', background: '#ffffff', text: '#1f2937', success: '#10b981', warning: '#f59e0b', error: '#ef4444' },
          indigo: { primary: '#4338ca', secondary: '#4f46e5', accent: '#6366f1', background: '#ffffff', text: '#1f2937', success: '#10b981', warning: '#f59e0b', error: '#ef4444' },
          crimson: { primary: '#be123c', secondary: '#e11d48', accent: '#f43f5e', background: '#ffffff', text: '#1f2937', success: '#10b981', warning: '#f59e0b', error: '#ef4444' },
          light: { primary: '#6366f1', secondary: '#10b981', accent: '#f59e0b', background: '#ffffff', text: '#1f2937', success: '#10b981', warning: '#f59e0b', error: '#ef4444' },
          dark: { primary: '#6366f1', secondary: '#10b981', accent: '#f59e0b', background: '#111827', text: '#f9fafb', success: '#10b981', warning: '#f59e0b', error: '#ef4444' }
        };
        
        // Récupérer les couleurs du thème
        const colors = predefinedThemes[themeId as keyof typeof predefinedThemes] || predefinedThemes.default;
        
        // Forcer une mise à jour du thème
        console.log('ThemePersistence: Publication forcée du thème', themeId);
        themeEventBus.publish(themeId, colors, true);

        // Dispatch d'un événement personnalisé pour s'assurer que tous les composants sont mis à jour
        const event = new CustomEvent('forceThemeUpdate', { 
          detail: { theme: themeId, colors } 
        });
        document.dispatchEvent(event);
      }
    } catch (error) {
      console.error('ThemePersistence: Erreur lors de la synchronisation du thème', error);
    }
  };

  // S'exécuter à chaque changement de route
  useEffect(() => {
    console.log('ThemePersistence: Changement de route détecté', location.pathname);
    
    // Délai court pour s'assurer que le DOM est prêt
    const timer = setTimeout(() => {
      forceSyncTheme();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [location.pathname]);

  // Ce composant ne rend rien visuellement
  return null;
};

export default ThemePersistence;
