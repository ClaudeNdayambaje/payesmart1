import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { getSettings, loadSettingsToLocalStorage } from '../services/settingsService';
import { themeEventBus } from '../ThemeEventBus';

/**
 * Hook personnalisé pour synchroniser les paramètres utilisateur avec le thème
 * Ce hook s'assure que les paramètres sont rechargés à chaque changement d'utilisateur
 */
export const useSettingsSync = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Si l'utilisateur change, recharger les paramètres
    if (user) {
      console.log('Changement d\'utilisateur détecté, rechargement des paramètres...');
      
      // Recharger les paramètres depuis Firestore
      getSettings().then(settings => {
        // Mettre à jour le cache local
        loadSettingsToLocalStorage(settings);
        
        // Appliquer le thème sélectionné
        if (settings.appearance && settings.appearance.selectedTheme) {
          console.log('Application du thème:', settings.appearance.selectedTheme);
          
          // Utiliser le bus d'événements pour mettre à jour le thème
          const predefinedThemes = {
            default: { primary: '#4f46e5', secondary: '#10b981', accent: '#f59e0b', background: '#ffffff', text: '#1f2937', success: '#10b981', warning: '#f59e0b', error: '#ef4444' },
            red: { primary: '#dc2626', secondary: '#b91c1c', accent: '#ef4444', background: '#ffffff', text: '#111827', success: '#10b981', warning: '#f59e0b', error: '#ef4444' },
            purple: { primary: '#7c3aed', secondary: '#8b5cf6', accent: '#a78bfa', background: '#ffffff', text: '#1f2937', success: '#10b981', warning: '#f59e0b', error: '#ef4444' }
          };
          
          // Récupérer les couleurs du thème
          const themeId = settings.appearance.selectedTheme;
          const colors = predefinedThemes[themeId as keyof typeof predefinedThemes] || predefinedThemes.default;
          
          // Forcer une mise à jour du thème
          themeEventBus.publish(themeId, colors, true);
        }
      }).catch(error => {
        console.error('Erreur lors du rechargement des paramètres:', error);
      });
    }
  }, [user]); // Se déclenche à chaque changement d'utilisateur
};
