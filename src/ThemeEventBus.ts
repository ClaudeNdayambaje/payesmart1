/**
 * Bus d'événements centralisé pour la gestion des thèmes
 * Cette approche permet de synchroniser les changements de thème
 * entre les différents composants sans dépendre uniquement du contexte React
 */

// Activer le mode débogage pour voir les logs détaillés
const DEBUG = true;

type ThemeListener = (theme: string, colors: any) => void;

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  success: string;
  warning: string;
  error: string;
  [key: string]: string;
}

class ThemeEventBus {
  private listeners: ThemeListener[] = [];
  private lastTheme: string = '';
  private lastColors: ThemeColors | null = null;
  private debugId = 0;

  constructor() {
    if (DEBUG) {
      console.log('ThemeEventBus: Initialisation');
      // Écouter les événements DOM pour débogage
      document.addEventListener('themechange', (e: any) => {
        console.log('ThemeEventBus: Événement DOM themechange détecté', e.detail);
      });
      document.addEventListener('forceThemeUpdate', (e: any) => {
        console.log('ThemeEventBus: Événement DOM forceThemeUpdate détecté', e.detail);
        // Republier le thème actuel pour forcer une mise à jour
        if (this.lastTheme && this.lastColors) {
          this.publish(this.lastTheme, this.lastColors, true);
        } else {
          console.warn('ThemeEventBus: Impossible de forcer la mise à jour - pas de thème actuel');
        }
      });
    }
  }

  /**
   * Ajouter un écouteur pour les changements de thème
   */
  public subscribe(listener: ThemeListener): () => void {
    const id = ++this.debugId;
    if (DEBUG) console.log(`ThemeEventBus: Nouvel abonnement #${id}, total: ${this.listeners.length + 1}`);
    
    this.listeners.push(listener);
    
    // Informer immédiatement l'écouteur du thème actuel s'il existe
    if (this.lastTheme && this.lastColors) {
      if (DEBUG) console.log(`ThemeEventBus: Envoi du thème actuel au nouvel abonnement #${id}`, this.lastTheme);
      try {
        listener(this.lastTheme, this.lastColors);
      } catch (error) {
        console.error(`ThemeEventBus: Erreur lors de l'initialisation de l'abonnement #${id}:`, error);
      }
    } else if (DEBUG) {
      console.log(`ThemeEventBus: Pas de thème initial disponible pour l'abonnement #${id}`);
    }
    
    // Retourner une fonction pour se désabonner
    return () => {
      if (DEBUG) console.log(`ThemeEventBus: Désabonnement #${id}`);
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Publier un changement de thème
   */
  public publish(theme: string, colors: ThemeColors, forceUpdate: boolean = false): void {
    if (!theme) {
      console.error('ThemeEventBus: Tentative de publication avec un thème vide');
      return;
    }
    
    if (!colors) {
      console.error('ThemeEventBus: Tentative de publication avec des couleurs vides');
      return;
    }
    
    if (DEBUG) {
      console.log(`ThemeEventBus: Publication du thème '${theme}'`, {
        colors,
        listeners: this.listeners.length,
        forceUpdate
      });
    }
    
    this.lastTheme = theme;
    this.lastColors = colors;
    
    // Vérifier que les couleurs principales sont définies
    const requiredColors = ['primary', 'secondary', 'background', 'text'];
    const missingColors = requiredColors.filter(color => !colors[color]);
    
    if (missingColors.length > 0) {
      console.warn(`ThemeEventBus: Couleurs manquantes dans le thème: ${missingColors.join(', ')}`);
    }
    
    // Déclencher un événement DOM pour compatibilité
    const event = new CustomEvent('themechange', {
      detail: { theme, colors, version: Date.now(), forceUpdate }
    });
    document.dispatchEvent(event);
    
    // Déclencher un événement themeapplied pour indiquer que le thème a été appliqué
    const appliedEvent = new CustomEvent('themeapplied', {
      detail: { theme, timestamp: Date.now(), forceUpdate }
    });
    document.dispatchEvent(appliedEvent);
    
    // Informer tous les écouteurs
    this.listeners.forEach((listener, index) => {
      try {
        if (DEBUG) console.log(`ThemeEventBus: Notification de l'écouteur #${index + 1}`);
        listener(theme, colors);
      } catch (error) {
        console.error(`ThemeEventBus: Erreur lors de la notification de l'écouteur #${index + 1}:`, error);
      }
    });
    
    if (DEBUG) console.log('ThemeEventBus: Publication terminée');
  }
  
  /**
   * Récupérer le thème actuel
   */
  public getCurrentTheme(): { theme: string, colors: ThemeColors } | null {
    if (!this.lastTheme || !this.lastColors) return null;
    return { theme: this.lastTheme, colors: this.lastColors };
  }
  
  /**
   * Vérifier l'état du bus d'événements
   */
  public debug(): void {
    console.log('ThemeEventBus: État actuel', {
      thème: this.lastTheme,
      couleurs: this.lastColors,
      abonnements: this.listeners.length
    });
    
    // Vérifier les variables CSS
    const root = document.documentElement;
    const cssVars = {
      primary: root.style.getPropertyValue('--color-primary'),
      secondary: root.style.getPropertyValue('--color-secondary'),
      background: root.style.getPropertyValue('--color-background'),
      text: root.style.getPropertyValue('--color-text')
    };
    
    console.log('ThemeEventBus: Variables CSS actuelles', cssVars);
  }
}

// Singleton pour partager l'instance entre les différents modules
export const themeEventBus = new ThemeEventBus();
