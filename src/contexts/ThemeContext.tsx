import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSettings, saveSettings } from '../services/settingsService';
import { themeEventBus } from '../ThemeEventBus';

// Interface pour le contexte de thème
interface ThemeContextType {
  theme: 'default' | 'dark' | 'light' | 'blue' | 'green' | 'purple' | 'orange' | 'black' | 'darkgray' | 'red' | 'navyblue' | 'custom' | 'darkgreen' | 'burgundy' | 'teal' | 'slate' | 'chocolate' | 'indigo' | 'crimson' | 'charcoal';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    success: string;
    warning: string;
    error: string;
  };
  setTheme: (theme: 'default' | 'dark' | 'light' | 'blue' | 'green' | 'purple' | 'orange' | 'black' | 'darkgray' | 'red' | 'navyblue' | 'custom' | 'darkgreen' | 'burgundy' | 'teal' | 'slate' | 'chocolate' | 'indigo' | 'crimson' | 'charcoal') => void;
  updateColor: (key: string, value: string) => void;
  applyTheme: (themeId: 'default' | 'dark' | 'light' | 'blue' | 'green' | 'purple' | 'orange' | 'black' | 'darkgray' | 'red' | 'navyblue' | 'custom' | 'darkgreen' | 'burgundy' | 'teal' | 'slate' | 'chocolate' | 'indigo' | 'crimson' | 'charcoal') => void;
}

// Thèmes prédéfinis
const predefinedThemes = {
  default: {
    primary: '#4f46e5',
    secondary: '#10b981',
    accent: '#f59e0b',
    background: '#ffffff',
    text: '#1f2937',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  },
  dark: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#ec4899',
    background: '#1f2937',
    text: '#f9fafb',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  },
  light: {
    primary: '#3b82f6',
    secondary: '#0ea5e9',
    accent: '#14b8a6',
    background: '#f9fafb',
    text: '#111827',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  },
  blue: {
    primary: '#2563eb',
    secondary: '#3b82f6',
    accent: '#60a5fa',
    background: '#ffffff',
    text: '#1f2937',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  },
  green: {
    primary: '#059669',
    secondary: '#10b981',
    accent: '#34d399',
    background: '#ffffff',
    text: '#1f2937',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  },
  purple: {
    primary: '#7c3aed',
    secondary: '#8b5cf6',
    accent: '#a78bfa',
    background: '#ffffff',
    text: '#1f2937',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  },
  orange: {
    primary: '#ea580c',
    secondary: '#f97316',
    accent: '#fb923c',
    background: '#ffffff',
    text: '#1f2937',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  },
  black: {
    primary: '#000000',
    secondary: '#333333',
    accent: '#666666',
    background: '#ffffff',
    text: '#000000',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  },
  darkgray: {
    primary: '#1f2937',
    secondary: '#374151',
    accent: '#4b5563',
    background: '#f9fafb',
    text: '#111827',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  },
  red: {
    primary: '#dc2626',
    secondary: '#b91c1c',
    accent: '#ef4444',
    background: '#ffffff',
    text: '#111827',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  },
  navyblue: {
    primary: '#1e3a8a',
    secondary: '#1e40af',
    accent: '#3b82f6',
    background: '#f8fafc',
    text: '#0f172a',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  },
  // Nouvelles combinaisons de couleurs contrastées
  darkgreen: {
    primary: '#1f2937', // Gris foncé pour la barre latérale
    secondary: '#059669', // Vert émeraude pour les boutons et accents
    accent: '#10b981',
    background: '#ffffff',
    text: '#111827',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  },
  burgundy: {
    primary: '#7f1d1d', // Bordeaux foncé
    secondary: '#4ade80', // Vert clair
    accent: '#86efac',
    background: '#ffffff',
    text: '#111827',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  },
  teal: {
    primary: '#0f766e', // Bleu-vert foncé
    secondary: '#f472b6', // Rose
    accent: '#f9a8d4',
    background: '#f8fafc',
    text: '#0f172a',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  },
  slate: {
    primary: '#475569', // Gris ardoise
    secondary: '#f97316', // Orange vif
    accent: '#fb923c',
    background: '#f8fafc',
    text: '#0f172a',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  },
  chocolate: {
    primary: '#78350f', // Marron chocolat
    secondary: '#3b82f6', // Bleu
    accent: '#60a5fa',
    background: '#ffffff',
    text: '#111827',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  },
  indigo: {
    primary: '#4338ca', // Indigo
    secondary: '#f59e0b', // Jaune orangé
    accent: '#fbbf24',
    background: '#ffffff',
    text: '#111827',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  },
  crimson: {
    primary: '#9f1239', // Rouge cramoisi
    secondary: '#0ea5e9', // Bleu ciel
    accent: '#38bdf8',
    background: '#ffffff',
    text: '#111827',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  },
  charcoal: {
    primary: '#27272a', // Gris charbon
    secondary: '#a855f7', // Violet
    accent: '#c084fc',
    background: '#f8fafc',
    text: '#0f172a',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444'
  }
};

// Création du contexte
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Hook personnalisé pour utiliser le contexte
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme doit être utilisé à l\'intérieur d\'un ThemeProvider');
  }
  return context;
};

// Fournisseur de contexte
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<'default' | 'dark' | 'light' | 'blue' | 'green' | 'purple' | 'orange' | 'black' | 'darkgray' | 'red' | 'navyblue' | 'custom' | 'darkgreen' | 'burgundy' | 'teal' | 'slate' | 'chocolate' | 'indigo' | 'crimson' | 'charcoal'>('default');
  const [colors, setColors] = useState(predefinedThemes.default);
  const [isInitialized, setIsInitialized] = useState(false);

  // Charger les paramètres de thème au démarrage
  useEffect(() => {
    const loadThemeSettings = async () => {
      try {
        // En mode développement, utiliser directement l'ID par défaut si nécessaire
        let settings;
        try {
          // Récupérer les paramètres
          settings = await getSettings();
        } catch (error) {
          console.warn('Erreur lors de la récupération des paramètres:', error);
          // En mode développement, continuer avec les paramètres par défaut
          if (process.env.NODE_ENV === 'development') {
            console.log('Mode développement: utilisation des paramètres par défaut');
            setColors(predefinedThemes.default);
            setThemeState('default');
            applyColorsToDocument(predefinedThemes.default);
            setIsInitialized(true);
            return;
          } else {
            // En production, propager l'erreur
            throw error;
          }
        }
        
        // Vérifier si settings existe
        if (!settings) {
          console.error('settings est undefined');
          // Utiliser le thème par défaut
          setColors(predefinedThemes.default);
          setThemeState('default');
          applyColorsToDocument(predefinedThemes.default);
          setIsInitialized(true);
          return;
        }
        
        // Vérifier si settings.appearance existe
        if (!settings.appearance) {
          console.error('settings.appearance est undefined');
          // Utiliser le thème par défaut
          setColors(predefinedThemes.default);
          setThemeState('default');
          applyColorsToDocument(predefinedThemes.default);
          setIsInitialized(true);
          return;
        }
        
        // Vérifier si selectedTheme existe
        const selectedTheme = settings.appearance.selectedTheme || 'default';
        
        if (selectedTheme === 'custom' && settings.appearance.customTheme) {
          // Vérifier si customTheme est complet
          if (!settings.appearance.customTheme.primary || 
              !settings.appearance.customTheme.secondary || 
              !settings.appearance.customTheme.accent) {
            console.warn('customTheme incomplet, utilisation du thème par défaut');
            setColors(predefinedThemes.default);
            setThemeState('default');
            applyColorsToDocument(predefinedThemes.default);
          } else {
            // Utiliser les couleurs personnalisées
            setColors(settings.appearance.customTheme);
            applyColorsToDocument(settings.appearance.customTheme);
          }
        } else if (predefinedThemes[selectedTheme as keyof typeof predefinedThemes]) {
          // Utiliser un thème prédéfini
          setColors(predefinedThemes[selectedTheme as keyof typeof predefinedThemes]);
          applyColorsToDocument(predefinedThemes[selectedTheme as keyof typeof predefinedThemes]);
        } else {
          // Fallback sur le thème par défaut
          setColors(predefinedThemes.default);
          applyColorsToDocument(predefinedThemes.default);
        }
        
        setThemeState(selectedTheme);
        setIsInitialized(true);
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres de thème:', error);
        setIsInitialized(true);
      }
    };

    loadThemeSettings();
  }, []);

  // Appliquer les couleurs au document (variables CSS)
  const applyColorsToDocument = (colorSet: any) => {
    // Vérifier si colorSet existe
    if (!colorSet) {
      console.error('colorSet est undefined dans applyColorsToDocument');
      return;
    }
    
    console.log('ThemeContext.applyColorsToDocument appelé avec:', colorSet);
    
    const root = document.documentElement;
    const body = document.body;
    
    // Définir les variables CSS pour les couleurs
    if (colorSet.primary) root.style.setProperty('--color-primary', colorSet.primary);
    if (colorSet.secondary) root.style.setProperty('--color-secondary', colorSet.secondary);
    if (colorSet.accent) root.style.setProperty('--color-accent', colorSet.accent);
    if (colorSet.background) root.style.setProperty('--color-background', colorSet.background);
    if (colorSet.text) root.style.setProperty('--color-text', colorSet.text);
    if (colorSet.success) root.style.setProperty('--color-success', colorSet.success);
    if (colorSet.warning) root.style.setProperty('--color-warning', colorSet.warning);
    if (colorSet.error) root.style.setProperty('--color-error', colorSet.error);
    
    // Stocker la couleur secondaire pour le mode sombre dans une propriété CSS dédiée
    // Cette couleur sera utilisée par les classes CSS en mode sombre
    if (colorSet.secondary) root.style.setProperty('--color-secondary-dark', colorSet.secondary);
    
    // Définir des variables supplémentaires pour l'interface
    if (colorSet.background) {
      const isDark = isColorDark(colorSet.background);
      // Couleurs de fond alternatives pour les cartes, formulaires, etc.
      root.style.setProperty('--color-background-alt', isDark ? lightenColor(colorSet.background, 10) : darkenColor(colorSet.background, 5));
      root.style.setProperty('--color-card-bg', isDark ? lightenColor(colorSet.background, 15) : '#ffffff');
      root.style.setProperty('--color-border', isDark ? lightenColor(colorSet.background, 20) : darkenColor(colorSet.background, 10));
    }
    
    if (colorSet.text) {
      // Variantes de texte pour différents niveaux d'importance
      root.style.setProperty('--color-text-secondary', adjustOpacity(colorSet.text, 0.7));
      root.style.setProperty('--color-text-tertiary', adjustOpacity(colorSet.text, 0.5));
    }
    
    // Couleurs pour les états des boutons
    if (colorSet.primary) {
      root.style.setProperty('--color-primary-hover', darkenColor(colorSet.primary, 10));
      root.style.setProperty('--color-primary-active', darkenColor(colorSet.primary, 15));
      
      // Couleur du texte sur fond primaire (pour la barre latérale)
      const primaryIsDark = isColorDark(colorSet.primary);
      root.style.setProperty('--color-text-on-primary', primaryIsDark ? '#ffffff' : '#000000');
    }
    
    // Couleur des icônes de la barre latérale (depuis les paramètres)
    // Si la couleur est fournie directement dans colorSet (lors d'un changement de thème)
    if (colorSet.sidebarIconColor) {
      root.style.setProperty('--color-sidebar-icon', colorSet.sidebarIconColor);
      // Ajouter la variable pour l'effet de survol des icônes
      root.style.setProperty('--color-sidebar-icon-hover', lightenColor(colorSet.sidebarIconColor, 20));
    } else {
      // Utiliser une valeur par défaut pour commencer
      const isDarkPrimary = colorSet.primary ? isColorDark(colorSet.primary) : false;
      const defaultIconColor = isDarkPrimary ? '#ffffff' : '#000000';
      root.style.setProperty('--color-sidebar-icon', defaultIconColor);
      root.style.setProperty('--color-sidebar-icon-hover', isDarkPrimary ? '#ffffff' : '#333333');
      
      // Puis mettre à jour depuis les paramètres si disponible
      getSettings().then(settings => {
        if (settings?.appearance?.sidebarIconColor) {
          root.style.setProperty('--color-sidebar-icon', settings.appearance.sidebarIconColor);
          root.style.setProperty('--color-sidebar-icon-hover', lightenColor(settings.appearance.sidebarIconColor, 20));
        }
      }).catch(error => {
        console.error('Erreur lors de la récupération de la couleur des icônes de la barre latérale:', error);
      });
    }
    
    if (colorSet.secondary) {
      root.style.setProperty('--color-secondary-hover', darkenColor(colorSet.secondary, 10));
      root.style.setProperty('--color-secondary-active', darkenColor(colorSet.secondary, 15));
    }
    
    // Couleurs pour les boutons de danger (déconnexion, suppression, etc.)
    const dangerColor = '#e53e3e'; // Rouge par défaut
    root.style.setProperty('--color-danger', dangerColor);
    root.style.setProperty('--color-danger-hover', darkenColor(dangerColor, 10));
    
    // Couleur pour les overlays (modales, menus mobiles, etc.)
    root.style.setProperty('--color-overlay', 'rgba(0, 0, 0, 0.5)');
    
    // Extraire les composantes RGB pour les utiliser avec la transparence
    Object.entries(colorSet).forEach(([key, value]) => {
      if (typeof value === 'string' && (value as string).startsWith('#')) {
        try {
          const r = parseInt((value as string).substring(1, 3), 16);
          const g = parseInt((value as string).substring(3, 5), 16);
          const b = parseInt((value as string).substring(5, 7), 16);
          root.style.setProperty(`--color-${key}-rgb`, `${r}, ${g}, ${b}`);
        } catch (e) {
          console.warn(`Impossible d'extraire les composantes RGB de ${value}`);
        }
      }
    });
    
    // Nettoyer les classes de thème précédentes
    root.classList.remove('dark', 'theme-dark', 'theme-light', 'theme-blue', 'theme-green', 'theme-purple', 'theme-orange', 'theme-default');
    body.classList.remove('dark', 'theme-dark', 'theme-light', 'theme-blue', 'theme-green', 'theme-purple', 'theme-orange', 'theme-default');
    
    // Appliquer le mode sombre/clair en fonction de la couleur d'arrière-plan
    if (colorSet.background) {
      const isDark = isColorDark(colorSet.background);
      if (isDark) {
        // Ajouter à la fois 'dark' et 'theme-dark' pour assurer la compatibilité avec tous les composants
        root.classList.add('dark', 'theme-dark');
        body.classList.add('dark', 'theme-dark');
        
        // Ajouter également les classes au conteneur principal de l'application
        const mainContainer = document.getElementById('main-app-container');
        if (mainContainer) {
          mainContainer.classList.add('dark', 'theme-dark');
          mainContainer.classList.remove('theme-light', 'theme-blue', 'theme-green', 'theme-purple', 'theme-orange', 'theme-default');
        }
        
        // Ajouter les classes à la barre latérale
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
          sidebar.classList.add('dark', 'theme-dark');
          sidebar.classList.remove('theme-light', 'theme-blue', 'theme-green', 'theme-purple', 'theme-orange', 'theme-default');
        }
        
        // Ajouter les classes à d'autres conteneurs potentiels
        const contentContainers = document.querySelectorAll('.content-background, .card-background, .app-background');
        contentContainers.forEach(container => {
          if (container instanceof HTMLElement) {
            container.classList.add('dark', 'theme-dark');
            container.classList.remove('theme-light', 'theme-blue', 'theme-green', 'theme-purple', 'theme-orange', 'theme-default');
          }
        });
      } else {
        // Ajouter la classe de thème appropriée
        const currentTheme = theme || 'default';
        const themeClass = `theme-${currentTheme}`;
        
        root.classList.add(themeClass);
        body.classList.add(themeClass);
        
        // Ajouter également la classe au conteneur principal de l'application
        const mainContainer = document.getElementById('main-app-container');
        if (mainContainer) {
          mainContainer.classList.add(themeClass);
          mainContainer.classList.remove('dark', 'theme-dark');
        }
        
        // Ajouter la classe à la barre latérale
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
          sidebar.classList.add(themeClass);
          sidebar.classList.remove('dark', 'theme-dark');
        }
        
        // Supprimer les classes sombres des autres conteneurs
        const contentContainers = document.querySelectorAll('.content-background, .card-background, .app-background');
        contentContainers.forEach(container => {
          if (container instanceof HTMLElement) {
            container.classList.add(themeClass);
            container.classList.remove('dark', 'theme-dark');
          }
        });
      }
    }
    
    // Forcer un rafraîchissement des styles en déclenchant un reflow
    void document.body.offsetHeight;
    
    // Déclencher un événement personnalisé pour informer les composants du changement de thème
    const event = new CustomEvent('themeapplied', {
      detail: { theme, colors: colorSet, timestamp: Date.now() }
    });
    document.dispatchEvent(event);
  };

  // Vérifier si une couleur est sombre
  const isColorDark = (color: string): boolean => {
    // Convertir la couleur hexadécimale en RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Calculer la luminosité (formule standard)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Si la luminance est inférieure à 0.5, la couleur est considérée comme sombre
    return luminance < 0.5;
  };
  
  // Éclaircir une couleur d'un certain pourcentage
  const lightenColor = (color: string, percent: number): string => {
    // Convertir la couleur hexadécimale en RGB
    const hex = color.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    
    // Éclaircir chaque composante
    r = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)));
    g = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)));
    b = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)));
    
    // Convertir en hexadécimal
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };
  
  // Assombrir une couleur d'un certain pourcentage
  const darkenColor = (color: string, percent: number): string => {
    // Convertir la couleur hexadécimale en RGB
    const hex = color.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    
    // Assombrir chaque composante
    r = Math.max(0, Math.floor(r * (1 - percent / 100)));
    g = Math.max(0, Math.floor(g * (1 - percent / 100)));
    b = Math.max(0, Math.floor(b * (1 - percent / 100)));
    
    // Convertir en hexadécimal
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };
  
  // Ajuster l'opacité d'une couleur
  const adjustOpacity = (color: string, opacity: number): string => {
    // Convertir la couleur hexadécimale en RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Retourner une couleur RGBA
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Fonction pour définir le thème
  const setTheme = async (themeId: 'default' | 'dark' | 'light' | 'blue' | 'green' | 'purple' | 'orange' | 'black' | 'darkgray' | 'red' | 'navyblue' | 'custom' | 'darkgreen' | 'burgundy' | 'teal' | 'slate' | 'chocolate' | 'indigo' | 'crimson' | 'charcoal') => {
    try {
      console.log('ThemeContext.setTheme appelé avec:', themeId);
      
      const settings = await getSettings();
      
      // Mettre à jour les paramètres
      settings.appearance.selectedTheme = themeId as any;
      
      let newColors;
      
      // Si c'est un thème prédéfini, mettre à jour les couleurs principales
      if (themeId !== 'custom' && predefinedThemes[themeId as keyof typeof predefinedThemes]) {
        const themeColors = predefinedThemes[themeId as keyof typeof predefinedThemes];
        settings.appearance.primaryColor = themeColors.primary;
        settings.appearance.secondaryColor = themeColors.secondary;
        settings.appearance.accentColor = themeColors.accent;
        
        // Définir la couleur des icônes de la barre latérale pour les thèmes prédéfinis
        // Par défaut, utiliser le blanc pour les thèmes foncés et le noir pour les thèmes clairs
        const isDarkTheme = isColorDark(themeColors.primary);
        settings.appearance.sidebarIconColor = isDarkTheme ? '#ffffff' : '#000000';
        
        // Mettre à jour les couleurs personnalisées pour la cohérence
        settings.appearance.customTheme.primary = themeColors.primary;
        settings.appearance.customTheme.secondary = themeColors.secondary;
        settings.appearance.customTheme.accent = themeColors.accent;
        settings.appearance.customTheme.background = themeColors.background;
        settings.appearance.customTheme.text = themeColors.text;
        
        // Ajouter la couleur des icônes de la barre latérale à l'objet themeColors
        const extendedThemeColors = {
          ...themeColors,
          sidebarIconColor: settings.appearance.sidebarIconColor
        };
        
        setColors(extendedThemeColors);
        applyColorsToDocument(extendedThemeColors);
        newColors = extendedThemeColors;
      } else if (themeId === 'custom') {
        // Utiliser les couleurs personnalisées
        const extendedCustomTheme = {
          ...settings.appearance.customTheme,
          sidebarIconColor: settings.appearance.sidebarIconColor
        };
        
        newColors = extendedCustomTheme;
        setColors(extendedCustomTheme);
        applyColorsToDocument(extendedCustomTheme);
      }
      
      // Publier le changement de thème via le ThemeEventBus
      if (newColors) {
        console.log('Publication du changement de thème via ThemeEventBus:', themeId, newColors);
        themeEventBus.publish(themeId, newColors);
        
        // Déclencher un événement DOM pour compatibilité
        const event = new CustomEvent('themechange', {
          detail: { theme: themeId, colors: newColors, version: Date.now() }
        });
        document.dispatchEvent(event);
      }
      
      // Sauvegarder les paramètres
      await saveSettings(settings);
      
      // Mettre à jour l'état local
      setThemeState(themeId);
      
    } catch (error) {
      console.error('Erreur lors de la définition du thème:', error);
    }
  };

  // Fonction pour mettre à jour une couleur spécifique
  const updateColor = async (key: string, value: string) => {
    try {
      console.log('ThemeContext.updateColor appelé avec:', key, value);
      
      const settings = await getSettings();
      
      // Mettre à jour la couleur dans le thème personnalisé
      (settings.appearance.customTheme as any)[key] = value;
      
      // Mettre à jour les couleurs principales indépendamment du thème actuel
      if (key === 'primary') settings.appearance.primaryColor = value;
      if (key === 'secondary') settings.appearance.secondaryColor = value;
      if (key === 'accent') settings.appearance.accentColor = value;
      if (key === 'sidebarIconColor') settings.appearance.sidebarIconColor = value;
      
      // Mettre à jour les couleurs locales
      const updatedColors = { ...colors, [key]: value };
      setColors(updatedColors);
      
      // Appliquer les changements au document immédiatement
      applyColorsToDocument(updatedColors);
      
      // Si le thème n'est pas en mode personnalisé, basculer vers le thème personnalisé
      if (settings.appearance.selectedTheme !== 'custom') {
        settings.appearance.selectedTheme = 'custom';
        setThemeState('custom');
      }
      
      // Mettre à jour spécifiquement les éléments de la barre latérale
      if (key === 'primary' || key === 'sidebarIconColor') {
        const sidebar = document.querySelector('.sidebar') as HTMLElement;
        if (sidebar) {
          // Réinitialiser les classes de thème
          sidebar.classList.remove('dark', 'theme-light', 'theme-blue', 'theme-green', 'theme-purple', 'theme-orange', 'theme-default');
          sidebar.classList.add('theme-custom');
          
          // Appliquer directement les styles CSS
          if (key === 'primary') {
            sidebar.style.backgroundColor = value;
          }
          
          // Mettre à jour la couleur des icônes de la barre latérale
          if (key === 'sidebarIconColor' || key === 'primary') {
            const sidebarIcons = sidebar.querySelectorAll('.sidebar-icon');
            const iconColor = key === 'sidebarIconColor' ? value : settings.appearance.sidebarIconColor;
            sidebarIcons.forEach((icon: Element) => {
              (icon as HTMLElement).style.color = iconColor;
            });
          }
        }
      }
      
      // Publier le changement de couleur via le ThemeEventBus
      console.log('Publication du changement de couleur via ThemeEventBus:', 'custom', updatedColors);
      themeEventBus.publish('custom', updatedColors);
      
      // Déclencher un événement DOM pour compatibilité
      const event = new CustomEvent('themechange', {
        detail: { theme: 'custom', colors: updatedColors, version: Date.now() }
      });
      document.dispatchEvent(event);
      
      // Sauvegarder les paramètres
      await saveSettings(settings);
      
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la couleur:', error);
    }
  };

  // Fonction pour appliquer un thème
  const applyTheme = async (themeId: 'default' | 'dark' | 'light' | 'blue' | 'green' | 'purple' | 'orange' | 'black' | 'darkgray' | 'red' | 'navyblue' | 'custom' | 'darkgreen' | 'burgundy' | 'teal' | 'slate' | 'chocolate' | 'indigo' | 'crimson' | 'charcoal') => {
    try {
      const settings = await getSettings();
      
      // Mettre à jour le thème sélectionné
      settings.appearance.selectedTheme = themeId as any;
      
      let newColors;
      
      if (themeId === 'custom') {
        // Utiliser les couleurs personnalisées existantes
        newColors = settings.appearance.customTheme;
        setColors(newColors);
        applyColorsToDocument(newColors);
      } else if (predefinedThemes[themeId as keyof typeof predefinedThemes]) {
        // Utiliser un thème prédéfini
        const themeColors = predefinedThemes[themeId as keyof typeof predefinedThemes];
        
        // Mettre à jour les couleurs principales
        settings.appearance.primaryColor = themeColors.primary;
        settings.appearance.secondaryColor = themeColors.secondary;
        settings.appearance.accentColor = themeColors.accent;
        
        // Mettre à jour les couleurs personnalisées pour la cohérence
        settings.appearance.customTheme.primary = themeColors.primary;
        settings.appearance.customTheme.secondary = themeColors.secondary;
        settings.appearance.customTheme.accent = themeColors.accent;
        settings.appearance.customTheme.background = themeColors.background;
        settings.appearance.customTheme.text = themeColors.text;
        
        newColors = themeColors;
        setColors(newColors);
        applyColorsToDocument(newColors);
      }
      
      // Publier le changement de thème via le ThemeEventBus
      if (newColors) {
        console.log('Publication du changement de thème via ThemeEventBus (applyTheme):', themeId, newColors);
        themeEventBus.publish(themeId, newColors);
      }
      
      // Sauvegarder les paramètres
      await saveSettings(settings);
      
      // Mettre à jour l'état local
      setThemeState(themeId);
      
    } catch (error) {
      console.error('Erreur lors de l\'application du thème:', error);
    }
  };

  // Ne rendre les enfants que lorsque le thème est initialisé
  if (!isInitialized) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>;
  }

  return (
    <ThemeContext.Provider value={{ theme, colors, setTheme, updateColor, applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
