import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getCurrentBusinessId } from './businessService';

// Clés utilisées pour le cache localStorage
const SETTINGS_CACHE_KEY = 'cachedSettings';
const LAST_SETTINGS_KEY = 'lastSettings';
const STORE_NAME_KEY = 'currentStoreName';

/**
 * Efface complètement le cache des paramètres dans localStorage
 */
export const resetSettingsCache = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem(SETTINGS_CACHE_KEY);
    localStorage.removeItem(LAST_SETTINGS_KEY);
    localStorage.removeItem(STORE_NAME_KEY);
    console.log('Cache des paramètres complètement effacé');
  }
};

/**
 * Enregistre les paramètres dans le localStorage pour un accès rapide
 */
export const loadSettingsToLocalStorage = (settings: AppSettings) => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      // Enregistrer les paramètres complets
      localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(settings));
      
      // Enregistrer le nom du magasin séparément pour un accès rapide
      if (settings.general && settings.general.storeName) {
        localStorage.setItem(STORE_NAME_KEY, settings.general.storeName);
        console.log('Nom du magasin enregistré dans localStorage:', settings.general.storeName);
      }
      
      // Enregistrer la date du dernier chargement
      localStorage.setItem(LAST_SETTINGS_KEY, new Date().toISOString());
    } catch (e) {
      console.error('Erreur lors de l\'enregistrement des paramètres dans localStorage:', e);
    }
  }
};

// Type pour les paramètres de l'application
export interface AppSettings {
  general: {
    storeName: string;
    address: string;
    phone: string;
    email: string;
    vatNumber: string;
    theme: 'light' | 'dark' | 'system';
    language: 'fr' | 'en' | 'nl';
    currency: 'EUR' | 'USD';
    timezone: string;
  };
  payment: {
    acceptedMethods: {
      cash: boolean;
      card: boolean;
      contactless: boolean;
    };
    minimumCardAmount: number;
    roundCashAmounts: boolean;
    defaultMethod: 'cash' | 'card';
  };
  printer: {
    autoPrint: boolean;
    copies: number;
    format: 'A4' | 'A5' | '80mm' | '58mm';
    footerText: string;
  };
  notifications: {
    stockAlerts: boolean;
    newOrders: boolean;
    orderStatusChanges: boolean;
    employeeLogins: boolean;
    dailyReports: boolean;
  };
  security: {
    requirePin: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
    twoFactorAuth: boolean;
  };
  backup: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'manual';
    location: 'cloud' | 'local';
    retention: number;
  };
  appearance: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    borderRadius: 'small' | 'medium' | 'large';
    density: 'compact' | 'normal' | 'comfortable';
    showAnimations: boolean;
    customLogo: boolean;
    selectedTheme: 'default' | 'dark' | 'light' | 'blue' | 'green' | 'purple' | 'orange' | 'black' | 'darkgray' | 'red' | 'navyblue' | 'darkgreen' | 'burgundy' | 'teal' | 'slate' | 'chocolate' | 'indigo' | 'crimson' | 'charcoal' | 'custom';
    sidebarIconColor: string;
    customTheme: {
      background: string;
      text: string;
      primary: string;
      secondary: string;
      accent: string;
      success: string;
      warning: string;
      error: string;
    };
  };
}

// Paramètres par défaut
export const defaultSettings: AppSettings = {
  general: {
    storeName: 'Night Shop',
    address: '123 Rue de Bruxelles, 1000 Bruxelles',
    phone: '+32 2 123 45 67',
    email: 'contact@nightshop.be',
    vatNumber: 'BE0123456789',
    theme: 'light',
    language: 'fr',
    currency: 'EUR',
    timezone: 'Europe/Brussels',
  },
  payment: {
    acceptedMethods: {
      cash: true,
      card: true,
      contactless: true,
    },
    minimumCardAmount: 5,
    roundCashAmounts: true,
    defaultMethod: 'cash',
  },
  printer: {
    autoPrint: true,
    copies: 1,
    format: '80mm',
    footerText: 'Merci pour votre visite !',
  },
  notifications: {
    stockAlerts: true,
    newOrders: true,
    orderStatusChanges: true,
    employeeLogins: false,
    dailyReports: true,
  },
  security: {
    requirePin: true,
    sessionTimeout: 30,
    maxLoginAttempts: 3,
    twoFactorAuth: false,
  },
  backup: {
    frequency: 'daily',
    location: 'cloud',
    retention: 30,
  },
  appearance: {
    primaryColor: '#4f46e5',
    secondaryColor: '#10b981',
    accentColor: '#f59e0b',
    borderRadius: 'medium',
    density: 'normal',
    showAnimations: true,
    customLogo: false,
    selectedTheme: 'default',
    sidebarIconColor: '#ffffff',
    customTheme: {
      background: '#ffffff',
      text: '#1f2937',
      primary: '#4f46e5',
      secondary: '#10b981',
      accent: '#f59e0b',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444'
    }
  }
};

// ID de la collection pour les paramètres
const SETTINGS_COLLECTION = 'settings';

/**
 * Récupère les paramètres de l'application depuis Firestore
 * Force toujours une récupération fraîche des données pour éviter les problèmes de cache
 */
export const getSettings = async (): Promise<AppSettings> => {
  try {
    // Nettoyer tout cache local qui pourrait exister
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('cachedSettings');
      localStorage.removeItem('lastSettings');
    }
    
    // Récupérer l'ID de l'entreprise actuelle
    const businessId = await getCurrentBusinessId();
    console.log('ID de l\'entreprise récupéré pour les paramètres:', businessId);
    
    if (!businessId) {
      console.error('Impossible de récupérer l\'ID de l\'entreprise');
      return defaultSettings;
    }
    
    // Utiliser l'ID de l'entreprise comme ID du document
    const settingsRef = doc(db, SETTINGS_COLLECTION, businessId);
    
    // Forcer une récupération fraîche depuis le serveur (sans utiliser le cache)
    const settingsSnap = await getDoc(settingsRef);
    
    if (settingsSnap.exists()) {
      const settings = settingsSnap.data() as AppSettings;
      console.log('Paramètres récupérés depuis Firestore:', settings);
      return settings;
    } else {
      // Si les paramètres n'existent pas encore, vérifier si des informations de compte sont disponibles
      let customSettings = { ...defaultSettings };
      
      // Vérifier si des informations de compte sont disponibles dans le localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        const newAccountInfo = localStorage.getItem('newAccountInfo');
        if (newAccountInfo) {
          try {
            const parsedInfo = JSON.parse(newAccountInfo);
            
            // Mettre à jour les paramètres avec les informations du compte
            if (parsedInfo.businessName) {
              customSettings.general.storeName = parsedInfo.businessName;
            }
            
            if (parsedInfo.email) {
              customSettings.general.email = parsedInfo.email;
            }
            
            // Ajouter d'autres informations si disponibles
            // Par exemple, si le numéro de téléphone est disponible dans les informations du compte
            // customSettings.general.phone = parsedInfo.phone || customSettings.general.phone;
            
            console.log('Paramètres personnalisés créés à partir des informations du compte:', customSettings);
          } catch (e) {
            console.error('Erreur lors de la récupération des informations du nouveau compte:', e);
          }
        }
      }
      
      // Récupérer les informations de l'entreprise depuis Firestore
      try {
        const businessRef = doc(db, 'businesses', businessId);
        const businessSnap = await getDoc(businessRef);
        
        if (businessSnap.exists()) {
          const businessData = businessSnap.data();
          
          // Mettre à jour les paramètres avec les informations de l'entreprise
          if (businessData.businessName) {
            customSettings.general.storeName = businessData.businessName;
          }
          
          if (businessData.email) {
            customSettings.general.email = businessData.email;
          }
          
          if (businessData.phone) {
            customSettings.general.phone = businessData.phone;
          }
          
          console.log('Paramètres personnalisés créés à partir des informations de l\'entreprise:', customSettings);
        }
      } catch (e) {
        console.error('Erreur lors de la récupération des informations de l\'entreprise:', e);
      }
      
      // Sauvegarder les paramètres personnalisés
      console.log('Création des paramètres personnalisés pour l\'entreprise:', businessId);
      await setDoc(settingsRef, customSettings);
      return customSettings;
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des paramètres:', error);
    return defaultSettings;
  }
};

/**
 * Sauvegarde les paramètres de l'application dans Firestore
 */
export const saveSettings = async (settings: AppSettings): Promise<boolean> => {
  try {
    // Récupérer l'ID de l'entreprise actuelle
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      console.error('Impossible de récupérer l\'ID de l\'entreprise');
      return false;
    }
    
    // Utiliser l'ID de l'entreprise comme ID du document
    const settingsRef = doc(db, SETTINGS_COLLECTION, businessId);
    await setDoc(settingsRef, settings);
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des paramètres:', error);
    return false;
  }
};

/**
 * Met à jour une section spécifique des paramètres
 */
export const updateSettingsSection = async <K extends keyof AppSettings>(
  section: K,
  data: AppSettings[K]
): Promise<boolean> => {
  try {
    // Récupérer l'ID de l'entreprise actuelle
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
      console.error('Impossible de récupérer l\'ID de l\'entreprise');
      return false;
    }
    
    // Utiliser l'ID de l'entreprise comme ID du document
    const settingsRef = doc(db, SETTINGS_COLLECTION, businessId);
    await updateDoc(settingsRef, { [section]: data });
    return true;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de la section ${section}:`, error);
    return false;
  }
};
