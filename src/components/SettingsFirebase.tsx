import React, { useState, useEffect, useRef } from 'react';
import { 
  Store, 
  Euro, 
  Printer, 
  Bell, 
  Shield, 
  Database, 
  Palette,
  Loader2,
  Check,
  Paintbrush,
  EyeIcon,
  CircleIcon
} from 'lucide-react';
import { getSettings, saveSettings, AppSettings, defaultSettings } from '../services/settingsService';
import { useTheme } from '../contexts/ThemeContext';

interface SettingsProps {
  onSave?: (settings: AppSettings) => void;
}

const SettingsFirebase: React.FC<SettingsProps> = ({ onSave }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'payment' | 'printer' | 'notifications' | 'security' | 'backup' | 'appearance'>('general');
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  // Utiliser le contexte de thème
  const { setTheme, updateColor } = useTheme();
  
  // Nous utilisons directement le ThemeEventBus pour appliquer les changements de thème
  
  // Référence pour les sélecteurs de couleur personnalisés (déplacé au niveau supérieur)
  const primaryColorRef = useRef<HTMLInputElement>(null);
  const secondaryColorRef = useRef<HTMLInputElement>(null);
  const accentColorRef = useRef<HTMLInputElement>(null);
  const backgroundColorRef = useRef<HTMLInputElement>(null);
  const textColorRef = useRef<HTMLInputElement>(null);
  const sidebarIconColorRef = useRef<HTMLInputElement>(null);

  // Charger les paramètres depuis Firebase au chargement du composant
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const loadedSettings = await getSettings();
        setSettings(loadedSettings);
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveStatus('idle');
      const success = await saveSettings(settings);
      
      if (success) {
        setSaveStatus('success');
        if (onSave) {
          onSave(settings);
        }
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
      
      // Réinitialiser le statut après 3 secondes
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    }
  };

  const handleChange = (section: keyof AppSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom du magasin
          </label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={settings.general.storeName}
            onChange={(e) => handleChange('general', 'storeName', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Adresse
          </label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={settings.general.address}
            onChange={(e) => handleChange('general', 'address', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Téléphone
          </label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={settings.general.phone}
            onChange={(e) => handleChange('general', 'phone', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={settings.general.email}
            onChange={(e) => handleChange('general', 'email', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Numéro de TVA
          </label>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={settings.general.vatNumber}
            onChange={(e) => handleChange('general', 'vatNumber', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Devise
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md"
            value={settings.general.currency}
            onChange={(e) => handleChange('general', 'currency', e.target.value)}
          >
            <option value="EUR">Euro (€)</option>
            <option value="USD">Dollar ($)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Langue
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md"
            value={settings.general.language}
            onChange={(e) => handleChange('general', 'language', e.target.value as 'fr' | 'en' | 'nl')}
          >
            <option value="fr">Français</option>
            <option value="en">Anglais</option>
            <option value="nl">Néerlandais</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Thème
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md"
            value={settings.general.theme}
            onChange={(e) => handleChange('general', 'theme', e.target.value as 'light' | 'dark' | 'system')}
          >
            <option value="light">Clair</option>
            <option value="dark">Sombre</option>
            <option value="system">Système</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderPaymentSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.payment.acceptedMethods.cash}
              onChange={(e) => handleChange('payment', 'acceptedMethods', {
                ...settings.payment.acceptedMethods,
                cash: e.target.checked
              })}
              className="h-4 w-4 text-indigo-600"
            />
            <span className="text-sm font-medium text-gray-700">Accepter les paiements en espèces</span>
          </label>
        </div>
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.payment.acceptedMethods.card}
              onChange={(e) => handleChange('payment', 'acceptedMethods', {
                ...settings.payment.acceptedMethods,
                card: e.target.checked
              })}
              className="h-4 w-4 text-indigo-600"
            />
            <span className="text-sm font-medium text-gray-700">Accepter les paiements par carte</span>
          </label>
        </div>
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.payment.acceptedMethods.contactless}
              onChange={(e) => handleChange('payment', 'acceptedMethods', {
                ...settings.payment.acceptedMethods,
                contactless: e.target.checked
              })}
              className="h-4 w-4 text-indigo-600"
            />
            <span className="text-sm font-medium text-gray-700">Accepter les paiements sans contact</span>
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Montant minimum pour carte (€)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={settings.payment.minimumCardAmount}
            onChange={(e) => handleChange('payment', 'minimumCardAmount', parseFloat(e.target.value))}
          />
        </div>
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.payment.roundCashAmounts}
              onChange={(e) => handleChange('payment', 'roundCashAmounts', e.target.checked)}
              className="h-4 w-4 text-indigo-600"
            />
            <span className="text-sm font-medium text-gray-700">Arrondir les montants en espèces</span>
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Méthode de paiement par défaut
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md"
            value={settings.payment.defaultMethod}
            onChange={(e) => handleChange('payment', 'defaultMethod', e.target.value as 'cash' | 'card')}
          >
            <option value="cash">Espèces</option>
            <option value="card">Carte</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => {
    // Vérifier si settings.appearance existe
    if (!settings.appearance) {
      console.error('settings.appearance est undefined dans renderAppearanceSettings');
      return <div>Chargement des paramètres d'apparence...</div>;
    }
    
    // S'assurer que customTheme existe
    if (!settings.appearance.customTheme) {
      settings.appearance.customTheme = {
        primary: '#4f46e5',
        secondary: '#10b981',
        accent: '#f59e0b',
        background: '#ffffff',
        text: '#1f2937',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
      };
    }
    
    // Thèmes prédéfinis - synchronisés avec ThemeContext
    const predefinedThemes = [
      { id: 'default', name: 'Défaut', colors: { 
        primary: '#4f46e5', 
        secondary: '#10b981', 
        accent: '#f59e0b', 
        background: '#ffffff', 
        text: '#1f2937',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
      }},
      { id: 'dark', name: 'Sombre', colors: { 
        primary: '#6366f1', 
        secondary: '#8b5cf6', 
        accent: '#ec4899', 
        background: '#1f2937', 
        text: '#f9fafb',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
      }},
      { id: 'light', name: 'Clair', colors: { 
        primary: '#3b82f6', 
        secondary: '#0ea5e9', 
        accent: '#14b8a6', 
        background: '#f9fafb', 
        text: '#111827',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
      }},
      { id: 'blue', name: 'Bleu', colors: { 
        primary: '#2563eb', 
        secondary: '#3b82f6', 
        accent: '#60a5fa', 
        background: '#eff6ff', 
        text: '#1e3a8a',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
      }},
      { id: 'green', name: 'Vert', colors: { 
        primary: '#059669', 
        secondary: '#10b981', 
        accent: '#34d399', 
        background: '#ecfdf5', 
        text: '#064e3b',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
      }},
      { id: 'purple', name: 'Violet', colors: { 
        primary: '#7c3aed', 
        secondary: '#8b5cf6', 
        accent: '#a78bfa', 
        background: '#f5f3ff', 
        text: '#4c1d95',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
      }},
      { id: 'orange', name: 'Orange', colors: { 
        primary: '#ea580c', 
        secondary: '#f97316', 
        accent: '#fb923c', 
        background: '#fff7ed', 
        text: '#7c2d12',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444'
      }},
      { id: 'custom', name: 'Personnalisé', colors: { 
        primary: settings.appearance.customTheme.primary || '#4f46e5', 
        secondary: settings.appearance.customTheme.secondary || '#10b981', 
        accent: settings.appearance.customTheme.accent || '#f59e0b', 
        background: settings.appearance.customTheme.background || '#ffffff', 
        text: settings.appearance.customTheme.text || '#1f2937',
        success: settings.appearance.customTheme.success || '#10b981',
        warning: settings.appearance.customTheme.warning || '#f59e0b',
        error: settings.appearance.customTheme.error || '#ef4444'
      }},
    ];

    // Utilisation des refs définis au niveau supérieur du composant
    
    // Fonction pour appliquer un thème prédéfini
    const applySelectedTheme = (themeId: string) => {
      console.log('Début applySelectedTheme avec themeId:', themeId);
      
      // Trouver le thème sélectionné dans les thèmes prédéfinis
      const theme = predefinedThemes.find(t => t.id === themeId);
      if (!theme) {
        console.error('Thème non trouvé:', themeId);
        return;
      }
      
      console.log('Thème sélectionné:', themeId, theme);
      
      // Vérifier si settings existe
      if (!settings) {
        console.error('settings est undefined dans applyTheme');
        return;
      }
      
      // Vérifier si settings.appearance existe
      if (!settings.appearance) {
        console.error('settings.appearance est undefined dans applyTheme');
        return;
      }
      
      // Créer une copie des paramètres pour les modifier
      const newSettings = {...settings};
      
      // Mettre à jour le thème sélectionné
      newSettings.appearance.selectedTheme = themeId as "default" | "light" | "dark" | "blue" | "green" | "purple" | "orange" | "custom";
      
      // Mettre à jour les paramètres dans l'état local
      setSettings(newSettings);
      
      // Utiliser le contexte de thème pour appliquer le thème
      setTheme(themeId);
    };
    
    // Cette fonction n'est plus nécessaire car nous utilisons maintenant le contexte de thème
    
    // Fonction pour mettre à jour une couleur personnalisée
    const updateCustomColor = (colorKey: string, value: string) => {
      const newSettings = {...settings};
      
      // Mettre à jour la couleur dans le thème personnalisé
      (newSettings.appearance.customTheme as any)[colorKey] = value;
      
      // Si on est en mode personnalisé, mettre aussi à jour les couleurs principales
      if (settings.appearance.selectedTheme === 'custom') {
        if (colorKey === 'primary') newSettings.appearance.primaryColor = value;
        if (colorKey === 'secondary') newSettings.appearance.secondaryColor = value;
        if (colorKey === 'accent') newSettings.appearance.accentColor = value;
        
        // Utiliser le contexte de thème pour mettre à jour la couleur
        updateColor(colorKey, value);
      }
      
      setSettings(newSettings);
      
      // Sauvegarder automatiquement les paramètres après un court délai pour éviter trop de requêtes
      const debounceTimer = setTimeout(() => {
        saveSettings(newSettings).then(success => {
          if (success && onSave) {
            onSave(newSettings);
          }
        }).catch(error => {
          console.error('Erreur lors de la sauvegarde automatique des couleurs:', error);
        });
      }, 500); // Délai de 500ms
      
      return () => clearTimeout(debounceTimer);
    };
    
    // Style pour la prévisualisation
    const previewStyle = {
      background: settings.appearance.customTheme.background,
      color: settings.appearance.customTheme.text,
    };
    
    const previewButtonStyle = {
      backgroundColor: settings.appearance.customTheme.primary,
      color: '#ffffff',
    };
    
    const previewSecondaryStyle = {
      backgroundColor: settings.appearance.customTheme.secondary,
      color: '#ffffff',
    };
    
    const previewAccentStyle = {
      backgroundColor: settings.appearance.customTheme.accent,
      color: '#ffffff',
    };
    
    return (
      <div className="space-y-8">
        {/* Section des thèmes prédéfinis */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Thèmes prédéfinis</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Sélectionnez un thème prédéfini ou créez votre propre thème personnalisé.</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {predefinedThemes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => applySelectedTheme(theme.id)}
                className={`p-4 rounded-lg border-2 transition-all ${settings.appearance.selectedTheme === theme.id ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="flex flex-col items-center space-y-3">
                  <div className="flex space-x-1">
                    <div className="w-5 h-5 rounded-full" style={{ backgroundColor: theme.colors.primary }}></div>
                    <div className="w-5 h-5 rounded-full" style={{ backgroundColor: theme.colors.secondary }}></div>
                    <div className="w-5 h-5 rounded-full" style={{ backgroundColor: theme.colors.accent }}></div>
                  </div>
                  <span className="text-sm font-medium">{theme.name}</span>
                  {settings.appearance.selectedTheme === theme.id && (
                    <Check className="h-4 w-4 text-indigo-500" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Section de personnalisation des couleurs */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Personnalisation des couleurs</h3>
            <button 
              onClick={() => applySelectedTheme('custom')}
              className="text-sm text-indigo-600 hover:text-indigo-500 flex items-center space-x-1"
            >
              <Paintbrush className="h-4 w-4" />
              <span>Activer le mode personnalisé</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Couleur principale
              </label>
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-full border border-gray-300 cursor-pointer flex items-center justify-center"
                  style={{ backgroundColor: settings.appearance.customTheme.primary }}
                  onClick={() => primaryColorRef.current?.click()}
                >
                  <input 
                    ref={primaryColorRef}
                    type="color" 
                    value={settings.appearance.customTheme.primary}
                    onChange={(e) => updateCustomColor('primary', e.target.value)}
                    className="sr-only"
                  />
                  <Paintbrush className="h-4 w-4 text-white opacity-70" />
                </div>
                <input 
                  type="text" 
                  value={settings.appearance.customTheme.primary}
                  onChange={(e) => updateCustomColor('primary', e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Couleur secondaire
              </label>
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-full border border-gray-300 cursor-pointer flex items-center justify-center"
                  style={{ backgroundColor: settings.appearance.customTheme.secondary }}
                  onClick={() => secondaryColorRef.current?.click()}
                >
                  <input 
                    ref={secondaryColorRef}
                    type="color" 
                    value={settings.appearance.customTheme.secondary}
                    onChange={(e) => updateCustomColor('secondary', e.target.value)}
                    className="sr-only"
                  />
                  <Paintbrush className="h-4 w-4 text-white opacity-70" />
                </div>
                <input 
                  type="text" 
                  value={settings.appearance.customTheme.secondary}
                  onChange={(e) => updateCustomColor('secondary', e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Couleur d'accent
              </label>
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-full border border-gray-300 cursor-pointer flex items-center justify-center"
                  style={{ backgroundColor: settings.appearance.customTheme.accent }}
                  onClick={() => accentColorRef.current?.click()}
                >
                  <input 
                    ref={accentColorRef}
                    type="color" 
                    value={settings.appearance.customTheme.accent}
                    onChange={(e) => updateCustomColor('accent', e.target.value)}
                    className="sr-only"
                  />
                  <Paintbrush className="h-4 w-4 text-white opacity-70" />
                </div>
                <input 
                  type="text" 
                  value={settings.appearance.customTheme.accent}
                  onChange={(e) => updateCustomColor('accent', e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Couleur d'arrière-plan
              </label>
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-full border border-gray-300 cursor-pointer flex items-center justify-center"
                  style={{ backgroundColor: settings.appearance.customTheme.background }}
                  onClick={() => backgroundColorRef.current?.click()}
                >
                  <input 
                    ref={backgroundColorRef}
                    type="color" 
                    value={settings.appearance.customTheme.background}
                    onChange={(e) => updateCustomColor('background', e.target.value)}
                    className="sr-only"
                  />
                  <Paintbrush className="h-4 w-4 opacity-70" style={{ color: settings.appearance.customTheme.text }} />
                </div>
                <input 
                  type="text" 
                  value={settings.appearance.customTheme.background}
                  onChange={(e) => updateCustomColor('background', e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Couleur du texte
              </label>
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-full border border-gray-300 cursor-pointer flex items-center justify-center"
                  style={{ backgroundColor: settings.appearance.customTheme.text }}
                  onClick={() => textColorRef.current?.click()}
                >
                  <input 
                    ref={textColorRef}
                    type="color" 
                    value={settings.appearance.customTheme.text}
                    onChange={(e) => updateCustomColor('text', e.target.value)}
                    className="sr-only"
                  />
                  <Paintbrush className="h-4 w-4 text-white opacity-70" />
                </div>
                <input 
                  type="text" 
                  value={settings.appearance.customTheme.text}
                  onChange={(e) => updateCustomColor('text', e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Couleur des icônes de la barre latérale
              </label>
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-full border border-gray-300 cursor-pointer flex items-center justify-center"
                  style={{ backgroundColor: settings.appearance.sidebarIconColor }}
                  onClick={() => sidebarIconColorRef.current?.click()}
                >
                  <input 
                    ref={sidebarIconColorRef}
                    type="color" 
                    value={settings.appearance.sidebarIconColor}
                    onChange={(e) => handleChange('appearance', 'sidebarIconColor', e.target.value)}
                    className="sr-only"
                  />
                  <Paintbrush className="h-4 w-4 text-white opacity-70" />
                </div>
                <input 
                  type="text" 
                  value={settings.appearance.sidebarIconColor}
                  onChange={(e) => handleChange('appearance', 'sidebarIconColor', e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Aperçu en temps réel */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Aperçu en temps réel</h3>
          <div 
            className="p-6 rounded-lg border border-gray-200 shadow-sm"
            style={previewStyle}
          >
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h4 style={{ color: settings.appearance.customTheme.text }} className="text-lg font-semibold">Aperçu du thème</h4>
                <div className="flex space-x-2">
                  <button className="p-2 rounded-full" style={{ backgroundColor: settings.appearance.customTheme.background, color: settings.appearance.customTheme.text, border: `1px solid ${settings.appearance.customTheme.text}` }}>
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button className="p-2 rounded-full" style={previewButtonStyle}>
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <button className="px-4 py-2 rounded-md" style={previewButtonStyle}>Bouton principal</button>
                <button className="px-4 py-2 rounded-md" style={previewSecondaryStyle}>Bouton secondaire</button>
                <button className="px-4 py-2 rounded-md" style={previewAccentStyle}>Bouton d'accent</button>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CircleIcon className="h-4 w-4" style={{ color: settings.appearance.customTheme.primary }} />
                  <span>Élément avec couleur principale</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CircleIcon className="h-4 w-4" style={{ color: settings.appearance.customTheme.secondary }} />
                  <span>Élément avec couleur secondaire</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CircleIcon className="h-4 w-4" style={{ color: settings.appearance.customTheme.accent }} />
                  <span>Élément avec couleur d'accent</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Section Limon Fertile - Options avancées */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Limon Fertile</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Options avancées pour personnaliser l'interface utilisateur.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rayon des bordures
              </label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={settings.appearance.borderRadius}
                onChange={(e) => handleChange('appearance', 'borderRadius', e.target.value as 'small' | 'medium' | 'large')}
              >
                <option value="small">Petit</option>
                <option value="medium">Moyen</option>
                <option value="large">Grand</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Densité de l'interface
              </label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={settings.appearance.density}
                onChange={(e) => handleChange('appearance', 'density', e.target.value as 'compact' | 'normal' | 'comfortable')}
              >
                <option value="compact">Compacte</option>
                <option value="normal">Normale</option>
                <option value="comfortable">Confortable</option>
              </select>
            </div>
            

            
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.appearance.showAnimations}
                  onChange={(e) => handleChange('appearance', 'showAnimations', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Afficher les animations</span>
              </label>
            </div>
            
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.appearance.customLogo}
                  onChange={(e) => handleChange('appearance', 'customLogo', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Utiliser un logo personnalisé</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPrinterSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.printer.autoPrint}
              onChange={(e) => handleChange('printer', 'autoPrint', e.target.checked)}
              className="h-4 w-4 text-indigo-600"
            />
            <span className="text-sm font-medium text-gray-700">Impression automatique</span>
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de copies
          </label>
          <input
            type="number"
            min="1"
            max="5"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={settings.printer.copies}
            onChange={(e) => handleChange('printer', 'copies', parseInt(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Format de papier
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md"
            value={settings.printer.format}
            onChange={(e) => handleChange('printer', 'format', e.target.value as 'A4' | 'A5' | '80mm' | '58mm')}
          >
            <option value="A4">A4</option>
            <option value="A5">A5</option>
            <option value="80mm">Thermique 80mm</option>
            <option value="58mm">Thermique 58mm</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Texte de pied de page
          </label>
          <textarea
            className="w-full p-2 border border-gray-300 rounded-md"
            value={settings.printer.footerText}
            onChange={(e) => handleChange('printer', 'footerText', e.target.value)}
            rows={3}
          />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex-1 p-6 overflow-auto flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-2 text-gray-600">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-screen w-full">
      <div className="w-full px-6 py-4 bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Paramètres</h1>
          <div className="flex items-center gap-3">
            {saveStatus === 'success' && (
              <span className="text-green-600 text-sm">Paramètres sauvegardés avec succès!</span>
            )}
            {saveStatus === 'error' && (
              <span className="text-red-600 text-sm">Erreur lors de la sauvegarde</span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className={`bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center gap-2 font-medium shadow-sm ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Sauvegarde en cours...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow h-full flex flex-col overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex overflow-x-auto">
              <button
                onClick={() => setActiveTab('general')}
                className={`py-4 px-6 font-medium text-sm border-b-2 whitespace-nowrap ${
                  activeTab === 'general'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex items-center space-x-2`}
              >
                <Store className="h-5 w-5" />
                <span>Général</span>
              </button>
              <button
                onClick={() => setActiveTab('payment')}
                className={`py-4 px-6 font-medium text-sm border-b-2 whitespace-nowrap ${
                  activeTab === 'payment'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex items-center space-x-2`}
              >
                <Euro className="h-5 w-5" />
                <span>Paiement</span>
              </button>
              <button
                onClick={() => setActiveTab('printer')}
                className={`py-4 px-6 font-medium text-sm border-b-2 whitespace-nowrap ${
                  activeTab === 'printer'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex items-center space-x-2`}
              >
                <Printer className="h-5 w-5" />
                <span>Imprimante</span>
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`py-4 px-6 font-medium text-sm border-b-2 whitespace-nowrap ${
                  activeTab === 'notifications'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex items-center space-x-2`}
              >
                <Bell className="h-5 w-5" />
                <span>Notifications</span>
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`py-4 px-6 font-medium text-sm border-b-2 whitespace-nowrap ${
                  activeTab === 'security'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex items-center space-x-2`}
              >
                <Shield className="h-5 w-5" />
                <span>Sécurité</span>
              </button>
              <button
                onClick={() => setActiveTab('backup')}
                className={`py-4 px-6 font-medium text-sm border-b-2 whitespace-nowrap ${
                  activeTab === 'backup'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex items-center space-x-2`}
              >
                <Database className="h-5 w-5" />
                <span>Sauvegarde</span>
              </button>
              <button
                onClick={() => setActiveTab('appearance')}
                className={`py-4 px-6 font-medium text-sm border-b-2 whitespace-nowrap ${
                  activeTab === 'appearance'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } flex items-center space-x-2`}
              >
                <Palette className="h-5 w-5" />
                <span>Apparence</span>
              </button>
            </nav>
          </div>

          <div className="p-6 flex-1 overflow-y-auto">
            {activeTab === 'general' && renderGeneralSettings()}
            {activeTab === 'payment' && renderPaymentSettings()}
            {activeTab === 'printer' && renderPrinterSettings()}
            {activeTab === 'notifications' && (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                Configuration des notifications en cours de développement
              </div>
            )}
            {activeTab === 'security' && (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                Configuration de la sécurité en cours de développement
              </div>
            )}
            {activeTab === 'backup' && (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                Configuration des sauvegardes en cours de développement
              </div>
            )}
            {activeTab === 'appearance' && renderAppearanceSettings()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsFirebase;
