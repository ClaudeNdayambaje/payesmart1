import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Settings as SettingsIcon, 
  Store, 
  Euro, 
  Receipt, 
  Bell, 
  Shield, 
  CreditCard, 
  Printer, 
  Database, 
  Globe, 
  Moon, 
  Sun,
  Upload,
  Download,
  Palette,
  LayoutGrid,
  Sliders,
  Loader2
} from 'lucide-react';
// import VivaClientConfigSection from './viva/VivaClientConfigSection';

// Composant temporaire pour remplacer VivaClientConfigSection pendant la maintenance
const TemporaryVivaConfig: React.FC = () => {
  return (
    <div className="p-4 border rounded bg-gray-50">
      <h3 className="text-lg font-medium">Configuration Viva (temporairement désactivée)</h3>
      <p className="text-sm text-gray-600 mt-2">La configuration Viva est temporairement indisponible pendant la maintenance.</p>
    </div>
  );
};
import { getSettings, saveSettings, AppSettings, defaultSettings } from '../services/settingsService';

interface SettingsProps {
  onSave?: (settings: AppSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ onSave }) => {
  const { setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'general' | 'payment' | 'printer' | 'notifications' | 'security' | 'backup' | 'appearance'>('general');
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
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
  


  const handleSave = () => {
    // Sauvegarder les paramètres
    saveSettings(settings)
      .then(() => {
        setSaveStatus('success');
        // Appeler le callback onSave si défini
        if (onSave) {
          onSave(settings);
        }
      })
      .catch(() => {
        setSaveStatus('error');
      })
      .finally(() => {
        setSaving(false);
        // Réinitialiser le statut après 3 secondes
        setTimeout(() => setSaveStatus('idle'), 3000);
      });
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Nom du magasin
          </label>
          <input
            type="text"
            value={settings.general.storeName}
            onChange={(e) => setSettings({
              ...settings,
              general: { ...settings.general, storeName: e.target.value }
            })}
            className="w-full border dark:border-gray-700 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Numéro de TVA
          </label>
          <input
            type="text"
            value={settings.general.vatNumber}
            onChange={(e) => setSettings({
              ...settings,
              general: { ...settings.general, vatNumber: e.target.value }
            })}
            className="w-full border dark:border-gray-700 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 dark:text-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
          Adresse
        </label>
        <input
          type="text"
          value={settings.general.address}
          onChange={(e) => setSettings({
            ...settings,
            general: { ...settings.general, address: e.target.value }
          })}
          className="w-full border dark:border-gray-700 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 dark:text-white"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Téléphone
          </label>
          <input
            type="tel"
            value={settings.general.phone}
            onChange={(e) => setSettings({
              ...settings,
              general: { ...settings.general, phone: e.target.value }
            })}
            className="w-full border dark:border-gray-700 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Email
          </label>
          <input
            type="email"
            value={settings.general.email}
            onChange={(e) => setSettings({
              ...settings,
              general: { ...settings.general, email: e.target.value }
            })}
            className="w-full border dark:border-gray-700 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 dark:text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Thème
          </label>
          <select
            value={settings.general.theme}
            onChange={(e) => setSettings({
              ...settings,
              general: { ...settings.general, theme: e.target.value as 'light' | 'dark' | 'system' }
            })}
            className="w-full border dark:border-gray-700 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 dark:text-white appearance-none"
          >
            <option value="light">Clair</option>
            <option value="dark">Sombre</option>
            <option value="system">Système</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Langue
          </label>
          <select
            value={settings.general.language}
            onChange={(e) => setSettings({
              ...settings,
              general: { ...settings.general, language: e.target.value as 'fr' | 'nl' | 'en' }
            })}
            className="w-full border dark:border-gray-700 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 dark:text-white appearance-none"
          >
            <option value="fr">Français</option>
            <option value="nl">Nederlands</option>
            <option value="en">English</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Fuseau horaire
          </label>
          <select
            value={settings.general.timezone}
            onChange={(e) => setSettings({
              ...settings,
              general: { ...settings.general, timezone: e.target.value }
            })}
            className="w-full border dark:border-gray-700 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 dark:text-white appearance-none"
          >
            <option value="Europe/Brussels">Europe/Bruxelles</option>
            <option value="Europe/Paris">Europe/Paris</option>
            <option value="Europe/Amsterdam">Europe/Amsterdam</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderPaymentSettings = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium mb-3">Méthodes de paiement acceptées</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.payment.acceptCash}
              onChange={(e) => setSettings({
                ...settings,
                payment: { ...settings.payment, acceptCash: e.target.checked }
              })}
              className="rounded"
              style={{
                accentColor: 'var(--color-primary)',
                outline: '2px solid var(--color-primary)',
                boxShadow: '0 0 0 2px var(--color-primary-light, #b3c7fa)'
              }}
            />
            <span>Espèces</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.payment.acceptCard}
              onChange={(e) => setSettings({
                ...settings,
                payment: { ...settings.payment, acceptCard: e.target.checked }
              })}
              className="rounded"
              style={{
                accentColor: 'var(--color-primary)',
                outline: '2px solid var(--color-primary)',
                boxShadow: '0 0 0 2px var(--color-primary-light, #b3c7fa)'
              }}
            />
            <span>Carte bancaire</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.payment.acceptContactless}
              onChange={(e) => setSettings({
                ...settings,
                payment: { ...settings.payment, acceptContactless: e.target.checked }
              })}
              className="rounded"
              style={{
                accentColor: 'var(--color-primary)',
                outline: '2px solid var(--color-primary)',
                boxShadow: '0 0 0 2px var(--color-primary-light, #b3c7fa)'
              }}
            />
            <span>Paiement sans contact</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Montant minimum carte
          </label>
          <div className="flex items-center">
            <input
              type="number"
              value={settings.payment.minCardAmount}
              onChange={(e) => setSettings({
                ...settings,
                payment: { ...settings.payment, minCardAmount: parseFloat(e.target.value) }
              })}
              className="w-full border rounded-lg px-3 py-2"
            />
            <span className="ml-2">€</span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Méthode par défaut
          </label>
          <select
            value={settings.payment.defaultPaymentMethod}
            onChange={(e) => setSettings({
              ...settings,
              payment: { ...settings.payment, defaultPaymentMethod: e.target.value as 'cash' | 'card' }
            })}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="cash">Espèces</option>
            <option value="card">Carte</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.payment.roundCashAmounts}
            onChange={(e) => setSettings({
              ...settings,
              payment: { ...settings.payment, roundCashAmounts: e.target.checked }
            })}
            className="rounded"
            style={{
              accentColor: 'var(--color-primary)',
              outline: '2px solid var(--color-primary)',
              boxShadow: '0 0 0 2px var(--color-primary-light, #b3c7fa)'
            }}
          />
          <span>Arrondir les montants en espèces</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.payment.showChangeCalculator}
            onChange={(e) => setSettings({
              ...settings,
              payment: { ...settings.payment, showChangeCalculator: e.target.checked }
            })}
            className="rounded"
            style={{
              accentColor: 'var(--color-primary)',
              outline: '2px solid var(--color-primary)',
              boxShadow: '0 0 0 2px var(--color-primary-light, #b3c7fa)'
            }}
          />
          <span>Afficher la calculatrice de monnaie</span>
        </label>
      </div>

      {/* Section de configuration Viva Payments */}
      <div className="mt-8 border-t pt-6">
        <h3 className="font-medium text-lg mb-4">Configuration Viva Payments</h3>
        <p className="text-sm text-gray-500 mb-4">
          Configurez vos identifiants Viva Payments pour activer les paiements par carte dans votre point de vente.
        </p>
        <TemporaryVivaConfig />
      </div>
    </div>
  );

  const renderPrinterSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
          <h3 className="font-medium text-gray-900 dark:text-gray-100">Impression automatique</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Imprimer automatiquement les tickets après chaque vente
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.printer.enabled}
            onChange={(e) => setSettings({
              ...settings,
              printer: { ...settings.printer, enabled: e.target.checked }
            })}
            className="sr-only peer"
            style={{
              accentColor: 'var(--color-primary)',
              outline: '2px solid var(--color-primary)',
              boxShadow: '0 0 0 2px var(--color-primary-light, #b3c7fa)'
            }}
          />
          <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 dark:peer-checked:bg-indigo-500"></div>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Nombre de copies
          </label>
          <input
            type="number"
            min="1"
            value={settings.printer.copies}
            onChange={(e) => setSettings({
              ...settings,
              printer: { ...settings.printer, copies: parseInt(e.target.value) }
            })}
            className="w-full border dark:border-gray-700 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Format
          </label>
          <select
            value={settings.printer.format}
            onChange={(e) => setSettings({
              ...settings,
              printer: { ...settings.printer, format: e.target.value }
            })}
            className="w-full border dark:border-gray-700 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-800 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 dark:text-white appearance-none"
          >
            <option value="A4">A4</option>
            <option value="A5">A5</option>
            <option value="80mm">80mm</option>
            <option value="58mm">58mm</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nom de l'imprimante
        </label>
        <input
          type="text"
          value={settings.printer.printerName}
          onChange={(e) => setSettings({
            ...settings,
            printer: { ...settings.printer, printerName: e.target.value }
          })}
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Texte de bas de page
        </label>
        <textarea
          value={settings.printer.footerText}
          onChange={(e) => setSettings({
            ...settings,
            printer: { ...settings.printer, footerText: e.target.value }
          })}
          className="w-full border rounded-lg px-3 py-2 h-24"
        />
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.printer.showLogo}
            onChange={(e) => setSettings({
              ...settings,
              printer: { ...settings.printer, showLogo: e.target.checked }
            })}
            className="rounded"
            style={{
              accentColor: 'var(--color-primary)',
              outline: '2px solid var(--color-primary)',
              boxShadow: '0 0 0 2px var(--color-primary-light, #b3c7fa)'
            }}
          />
          <span>Afficher le logo sur les tickets</span>
        </label>
      </div>

      <div className="mt-4">
        <button
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          onClick={() => {
            // Logique pour imprimer un ticket de test
          }}
        >
          <Printer size={16} />
          Imprimer un ticket de test
        </button>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium mb-3">Alertes de stock</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.notifications.lowStock}
              onChange={(e) => setSettings({
                ...settings,
                notifications: { ...settings.notifications, lowStock: e.target.checked }
              })}
              className="rounded"
              style={{
                accentColor: 'var(--color-primary)',
                outline: '2px solid var(--color-primary)',
                boxShadow: '0 0 0 2px var(--color-primary-light, #b3c7fa)'
              }}
            />
            <span>Activer les alertes de stock bas</span>
          </label>
          <div className="pl-6">
            <label className="block text-sm text-gray-700 mb-1">
              Seuil d'alerte
            </label>
            <input
              type="number"
              min="0"
              value={settings.notifications.lowStockThreshold}
              onChange={(e) => setSettings({
                ...settings,
                notifications: { ...settings.notifications, lowStockThreshold: parseInt(e.target.value) }
              })}
              className="w-32 border rounded-lg px-3 py-2"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.notifications.newOrders}
            onChange={(e) => setSettings({
              ...settings,
              notifications: { ...settings.notifications, newOrders: e.target.checked }
            })}
            className="rounded"
            style={{
              accentColor: 'var(--color-primary)',
              outline: '2px solid var(--color-primary)',
              boxShadow: '0 0 0 2px var(--color-primary-light, #b3c7fa)'
            }}
          />
          <span>Nouvelles commandes fournisseurs</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.notifications.orderStatus}
            onChange={(e) => setSettings({
              ...settings,
              notifications: { ...settings.notifications, orderStatus: e.target.checked }
            })}
            className="rounded"
            style={{
              accentColor: 'var(--color-primary)',
              outline: '2px solid var(--color-primary)',
              boxShadow: '0 0 0 2px var(--color-primary-light, #b3c7fa)'
            }}
          />
          <span>Changements de statut des commandes</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.notifications.employeeLogin}
            onChange={(e) => setSettings({
              ...settings,
              notifications: { ...settings.notifications, employeeLogin: e.target.checked }
            })}
            className="rounded"
            style={{
              accentColor: 'var(--color-primary)',
              outline: '2px solid var(--color-primary)',
              boxShadow: '0 0 0 2px var(--color-primary-light, #b3c7fa)'
            }}
          />
          <span>Connexions des employés</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.notifications.dailyReport}
            onChange={(e) => setSettings({
              ...settings,
              notifications: { ...settings.notifications, dailyReport: e.target.checked }
            })}
            className="rounded"
            style={{
              accentColor: 'var(--color-primary)',
              outline: '2px solid var(--color-primary)',
              boxShadow: '0 0 0 2px var(--color-primary-light, #b3c7fa)'
            }}
          />
          <span>Rapport quotidien</span>
        </label>
      </div>

      <div className="border-t pt-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.notifications.emailNotifications}
            onChange={(e) => setSettings({
              ...settings,
              notifications: { ...settings.notifications, emailNotifications: e.target.checked }
            })}
            className="rounded"
            style={{
              accentColor: 'var(--color-primary)',
              outline: '2px solid var(--color-primary)',
              boxShadow: '0 0 0 2px var(--color-primary-light, #b3c7fa)'
            }}
          />
          <span>Recevoir les notifications par email</span>
        </label>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium mb-3">Protection par code PIN</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.security.requirePinForRefunds}
              onChange={(e) => setSettings({
                ...settings,
                security: { ...settings.security, requirePinForRefunds: e.target.checked }
              })}
              className="rounded"
              style={{
                accentColor: 'var(--color-primary)',
                outline: '2px solid var(--color-primary)',
                boxShadow: '0 0 0 2px var(--color-primary-light, #b3c7fa)'
              }}
            />
            <span>Remboursements</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.security.requirePinForDiscounts}
              onChange={(e) => setSettings({
                ...settings,
                security: { ...settings.security, requirePinForDiscounts: e.target.checked }
              })}
              className="rounded"
              style={{
                accentColor: 'var(--color-primary)',
                outline: '2px solid var(--color-primary)',
                boxShadow: '0 0 0 2px var(--color-primary-light, #b3c7fa)'
              }}
            />
            <span>Remises</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.security.requirePinForVoid}
              onChange={(e) => setSettings({
                ...settings,
                security: { ...settings.security, requirePinForVoid: e.target.checked }
              })}
              className="rounded"
              style={{
                accentColor: 'var(--color-primary)',
                outline: '2px solid var(--color-primary)',
                boxShadow: '0 0 0 2px var(--color-primary-light, #b3c7fa)'
              }}
            />
            <span>Annulation de tickets</span>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expiration du mot de passe (jours)
          </label>
          <input
            type="number"
            min="0"
            value={settings.security.passwordExpiration}
            onChange={(e) => setSettings({
              ...settings,
              security: { ...settings.security, passwordExpiration: parseInt(e.target.value) }
            })}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tentatives de connexion max.
          </label>
          <input
            type="number"
            min="1"
            value={settings.security.maxLoginAttempts}
            onChange={(e) => setSettings({
              ...settings,
              security: { ...settings.security, maxLoginAttempts: parseInt(e.target.value) }
            })}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Délai d'inactivité (minutes)
        </label>
        <input
          type="number"
          min="1"
          value={settings.security.sessionTimeout}
          onChange={(e) => setSettings({
            ...settings,
            security: { ...settings.security, sessionTimeout: parseInt(e.target.value) }
          })}
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      <div className="border-t pt-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.security.twoFactorAuth}
            onChange={(e) => setSettings({
              ...settings,
              security: { ...settings.security, twoFactorAuth: e.target.checked }
            })}
            className="rounded"
            style={{
              accentColor: 'var(--color-primary)',
              outline: '2px solid var(--color-primary)',
              boxShadow: '0 0 0 2px var(--color-primary-light, #b3c7fa)'
            }}
          />
          <span>Activer l'authentification à deux facteurs</span>
        </label>
      </div>
    </div>
  );

  const renderBackupSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
        <div>
          <h3 className="font-medium">Sauvegarde automatique</h3>
          <p className="text-sm text-gray-500">
            Dernière sauvegarde: {new Date(settings.backup.lastBackup).toLocaleDateString('fr-FR', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.backup.autoBackup}
            onChange={(e) => setSettings({
              ...settings,
              backup: { ...settings.backup, autoBackup: e.target.checked }
            })}
            className="sr-only peer"
            style={{
              accentColor: 'var(--color-primary)',
              outline: '2px solid var(--color-primary)',
              boxShadow: '0 0 0 2px var(--color-primary-light, #b3c7fa)'
            }}
          />
          <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 dark:peer-checked:bg-indigo-500"></div>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fréquence
          </label>
          <select
            value={settings.backup.backupFrequency}
            onChange={(e) => setSettings({
              ...settings,
              backup: { ...settings.backup, backupFrequency: e.target.value as 'daily' | 'weekly' | 'monthly' }
            })}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="daily">Quotidienne</option>
            <option value="weekly">Hebdomadaire</option>
            <option value="monthly">Mensuelle</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Emplacement
          </label>
          <select
            value={settings.backup.backupLocation}
            onChange={(e) => setSettings({
              ...settings,
              backup: { ...settings.backup, backupLocation: e.target.value as 'local' | 'cloud' }
            })}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="local">Stockage local</option>
            <option value="cloud">Cloud</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre de sauvegardes à conserver
        </label>
        <input
          type="number"
          min="1"
          value={settings.backup.keepBackups}
          onChange={(e) => setSettings({
            ...settings,
            backup: { ...settings.backup, keepBackups: parseInt(e.target.value) }
          })}
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.backup.includeImages}
            onChange={(e) => setSettings({
              ...settings,
              backup: { ...settings.backup, includeImages: e.target.checked }
            })}
            className="rounded"
            style={{
              accentColor: 'var(--color-primary)',
              outline: '2px solid var(--color-primary)',
              boxShadow: '0 0 0 2px var(--color-primary-light, #b3c7fa)'
            }}
          />
          <span>Inclure les images des produits</span>
        </label>
      </div>

      <div className="flex gap-3 mt-4">
        <button
          style={{
            backgroundColor: 'var(--color-primary)',
            color: 'white !important',
          }}
          onMouseOver={e => {
            e.currentTarget.style.backgroundColor = 'var(--color-primary-dark)';
            e.currentTarget.style.color = 'white';
          }}
          onMouseOut={e => {
            e.currentTarget.style.backgroundColor = 'var(--color-primary)';
            e.currentTarget.style.color = 'white';
          }}
          className="px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-colors duration-200"
          onClick={() => {
            // Logique pour déclencher une sauvegarde manuelle
            setSettings({
              ...settings,
              backup: { ...settings.backup, lastBackup: new Date().toISOString() }
            });
          }}
        >
          <Download size={16} style={{ color: 'white' }} />
          <span style={{ color: 'white' }}>Sauvegarder maintenant</span>
        </button>
        <button
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2"
          onClick={() => {
            // Logique pour restaurer une sauvegarde
          }}
        >
          <Upload size={16} />
          Restaurer une sauvegarde
        </button>
      </div>
    </div>
  );

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      {/* Sélection du thème */}
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-3 text-gray-800 dark:text-gray-200">Thème</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* Option Mode Clair */}
          <div 
            onClick={async () => {
              if (saving) return; // Éviter les clics multiples
              try {
                setSaving(true);
                // Mettre à jour l'état local
                const updatedSettings = {
                  ...settings,
                  general: { ...settings.general, theme: 'light' },
                  appearance: { ...settings.appearance, selectedTheme: 'light' }
                };
                setSettings(updatedSettings);
                
                // Appliquer immédiatement le thème via le contexte
                setTheme('light');
                
                // Sauvegarder les modifications dans Firebase immédiatement
                await saveSettings(updatedSettings);
                setSaveStatus('success');
              } catch (error) {
                console.error('Erreur lors du changement de thème:', error);
                setSaveStatus('error');
              } finally {
                setSaving(false);
                setTimeout(() => setSaveStatus('idle'), 3000);
              }
            }}  
            className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-all ${settings.appearance.selectedTheme === 'light' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
          >
            <Sun size={32} className={settings.appearance.selectedTheme === 'light' ? 'text-indigo-600' : 'text-gray-500 dark:text-gray-400'} />
            <span className={`mt-2 ${settings.appearance.selectedTheme === 'light' ? 'font-medium text-indigo-600' : 'text-gray-700 dark:text-gray-300'}`}>Mode Clair</span>
          </div>
          
          {/* Option Mode Sombre */}
          <div 
            onClick={async () => {
              if (saving) return; // Éviter les clics multiples
              try {
                setSaving(true);
                // Mettre à jour l'état local
                const updatedSettings = {
                  ...settings,
                  general: { ...settings.general, theme: 'dark' },
                  appearance: { ...settings.appearance, selectedTheme: 'dark' }
                };
                setSettings(updatedSettings);
                
                // Appliquer immédiatement le thème via le contexte
                setTheme('dark');
                
                // Sauvegarder les modifications dans Firebase immédiatement
                await saveSettings(updatedSettings);
                setSaveStatus('success');
              } catch (error) {
                console.error('Erreur lors du changement de thème:', error);
                setSaveStatus('error');
              } finally {
                setSaving(false);
                setTimeout(() => setSaveStatus('idle'), 3000);
              }
            }}  
            className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-all ${settings.appearance.selectedTheme === 'dark' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
          >
            <Moon size={32} className={settings.appearance.selectedTheme === 'dark' ? 'text-indigo-600' : 'text-gray-500 dark:text-gray-400'} />
            <span className={`mt-2 ${settings.appearance.selectedTheme === 'dark' ? 'font-medium text-indigo-600' : 'text-gray-700 dark:text-gray-300'}`}>Mode Sombre</span>
          </div>
        </div>
        
        <h3 className="text-lg font-medium mb-3 text-gray-800 dark:text-gray-200">Thèmes de couleurs</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Thème Bleu */}
          <div 
            onClick={async () => {
              if (saving) return; // Éviter les clics multiples
              try {
                setSaving(true);
                // Mettre à jour l'état local
                const updatedSettings = {
                  ...settings,
                  appearance: { ...settings.appearance, selectedTheme: 'blue' }
                };
                setSettings(updatedSettings);
                
                // Appliquer immédiatement le thème
                setTheme('blue');
                
                // Sauvegarder les modifications dans Firebase immédiatement
                await saveSettings(updatedSettings);
                setSaveStatus('success');
              } catch (error) {
                console.error('Erreur lors du changement de thème:', error);
                setSaveStatus('error');
              } finally {
                setSaving(false);
                setTimeout(() => setSaveStatus('idle'), 3000);
              }
            }}  
            className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-all ${settings.appearance.selectedTheme === 'blue' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            style={{ borderColor: settings.appearance.selectedTheme === 'blue' ? '#2563eb' : '' }}
          >
            <div className="w-8 h-8 rounded-full" style={{ backgroundColor: '#2563eb' }}></div>
            <span className={`mt-2 ${settings.appearance.selectedTheme === 'blue' ? 'font-medium' : 'text-gray-700 dark:text-gray-300'}`}>Bleu</span>
          </div>
          
          {/* Thème Vert */}
          <div 
            onClick={async () => {
              if (saving) return; // Éviter les clics multiples
              try {
                setSaving(true);
                // Mettre à jour l'état local
                const updatedSettings = {
                  ...settings,
                  appearance: { ...settings.appearance, selectedTheme: 'green' }
                };
                setSettings(updatedSettings);
                
                // Appliquer immédiatement le thème
                setTheme('green');
                
                // Sauvegarder les modifications dans Firebase immédiatement
                await saveSettings(updatedSettings);
                setSaveStatus('success');
              } catch (error) {
                console.error('Erreur lors du changement de thème:', error);
                setSaveStatus('error');
              } finally {
                setSaving(false);
                setTimeout(() => setSaveStatus('idle'), 3000);
              }
            }}  
            className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-all ${settings.appearance.selectedTheme === 'green' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            style={{ borderColor: settings.appearance.selectedTheme === 'green' ? '#059669' : '' }}
          >
            <div className="w-8 h-8 rounded-full" style={{ backgroundColor: '#059669' }}></div>
            <span className={`mt-2 ${settings.appearance.selectedTheme === 'green' ? 'font-medium' : 'text-gray-700 dark:text-gray-300'}`}>Vert</span>
          </div>
          
          {/* Thème Violet */}
          <div 
            onClick={async () => {
              if (saving) return; // Éviter les clics multiples
              try {
                setSaving(true);
                // Mettre à jour l'état local
                const updatedSettings = {
                  ...settings,
                  appearance: { ...settings.appearance, selectedTheme: 'purple' }
                };
                setSettings(updatedSettings);
                
                // Appliquer immédiatement le thème
                setTheme('purple');
                
                // Sauvegarder les modifications dans Firebase immédiatement
                await saveSettings(updatedSettings);
                setSaveStatus('success');
              } catch (error) {
                console.error('Erreur lors du changement de thème:', error);
                setSaveStatus('error');
              } finally {
                setSaving(false);
                setTimeout(() => setSaveStatus('idle'), 3000);
              }
            }}  
            className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-all ${settings.appearance.selectedTheme === 'purple' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            style={{ borderColor: settings.appearance.selectedTheme === 'purple' ? '#7c3aed' : '' }}
          >
            <div className="w-8 h-8 rounded-full" style={{ backgroundColor: '#7c3aed' }}></div>
            <span className={`mt-2 ${settings.appearance.selectedTheme === 'purple' ? 'font-medium' : 'text-gray-700 dark:text-gray-300'}`}>Violet</span>
          </div>
          
          {/* Thème Orange */}
          <div 
            onClick={async () => {
              if (saving) return; // Éviter les clics multiples
              try {
                setSaving(true);
                // Mettre à jour l'état local
                const updatedSettings = {
                  ...settings,
                  appearance: { ...settings.appearance, selectedTheme: 'orange' }
                };
                setSettings(updatedSettings);
                
                // Appliquer immédiatement le thème
                setTheme('orange');
                
                // Sauvegarder les modifications dans Firebase immédiatement
                await saveSettings(updatedSettings);
                setSaveStatus('success');
              } catch (error) {
                console.error('Erreur lors du changement de thème:', error);
                setSaveStatus('error');
              } finally {
                setSaving(false);
                setTimeout(() => setSaveStatus('idle'), 3000);
              }
            }}  
            className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-all ${settings.appearance.selectedTheme === 'orange' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            style={{ borderColor: settings.appearance.selectedTheme === 'orange' ? '#ea580c' : '' }}
          >
            <div className="w-8 h-8 rounded-full" style={{ backgroundColor: '#ea580c' }}></div>
            <span className={`mt-2 ${settings.appearance.selectedTheme === 'orange' ? 'font-medium' : 'text-gray-700 dark:text-gray-300'}`}>Orange</span>
          </div>
          
          {/* Thème Noir */}
          <div 
            onClick={async () => {
              // Mettre à jour l'état local
              const updatedSettings = {
                ...settings,
                appearance: { ...settings.appearance, selectedTheme: 'black' }
              };
              setSettings(updatedSettings);
              
              // Appliquer immédiatement le thème
              setTheme('black');
              
              // Sauvegarder les modifications dans Firebase immédiatement
              await saveSettings(updatedSettings);
              setSaveStatus('success');
              setTimeout(() => setSaveStatus('idle'), 3000);
            }}  
            className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-all ${settings.appearance.selectedTheme === 'black' ? 'border-gray-800 bg-gray-100 dark:bg-gray-900/40' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            style={{ borderColor: settings.appearance.selectedTheme === 'black' ? '#000000' : '' }}
          >
            <div className="w-8 h-8 rounded-full" style={{ backgroundColor: '#000000' }}></div>
            <span className={`mt-2 ${settings.appearance.selectedTheme === 'black' ? 'font-medium' : 'text-gray-700 dark:text-gray-300'}`} style={{ color: settings.appearance.selectedTheme === 'black' ? '#000000' : '' }}>Noir</span>
          </div>
          
          {/* Thème Gris Foncé */}
          <div 
            onClick={async () => {
              // Mettre à jour l'état local
              const updatedSettings = {
                ...settings,
                appearance: { ...settings.appearance, selectedTheme: 'darkgray' }
              };
              setSettings(updatedSettings);
              
              // Appliquer immédiatement le thème
              setTheme('darkgray');
              
              // Sauvegarder les modifications dans Firebase immédiatement
              await saveSettings(updatedSettings);
              setSaveStatus('success');
              setTimeout(() => setSaveStatus('idle'), 3000);
            }}  
            className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-all ${settings.appearance.selectedTheme === 'darkgray' ? 'border-gray-600 bg-gray-100 dark:bg-gray-800/40' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            style={{ borderColor: settings.appearance.selectedTheme === 'darkgray' ? '#1f2937' : '' }}
          >
            <div className="w-8 h-8 rounded-full" style={{ backgroundColor: '#1f2937' }}></div>
            <span className={`mt-2 ${settings.appearance.selectedTheme === 'darkgray' ? 'font-medium' : 'text-gray-700 dark:text-gray-300'}`} style={{ color: settings.appearance.selectedTheme === 'darkgray' ? '#1f2937' : '' }}>Gris Foncé</span>
          </div>
          
          {/* Thème Rouge */}
          <div 
            onClick={async () => {
              // Mettre à jour l'état local
              const updatedSettings = {
                ...settings,
                appearance: { ...settings.appearance, selectedTheme: 'red' }
              };
              setSettings(updatedSettings);
              
              // Appliquer immédiatement le thème
              setTheme('red');
              
              // Sauvegarder les modifications dans Firebase immédiatement
              await saveSettings(updatedSettings);
              setSaveStatus('success');
              setTimeout(() => setSaveStatus('idle'), 3000);
            }}  
            className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-all ${settings.appearance.selectedTheme === 'red' ? 'border-red-600 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            style={{ borderColor: settings.appearance.selectedTheme === 'red' ? '#dc2626' : '' }}
          >
            <div className="w-8 h-8 rounded-full" style={{ backgroundColor: '#dc2626' }}></div>
            <span className={`mt-2 ${settings.appearance.selectedTheme === 'red' ? 'font-medium' : 'text-gray-700 dark:text-gray-300'}`} style={{ color: settings.appearance.selectedTheme === 'red' ? '#dc2626' : '' }}>Rouge</span>
          </div>
          
          {/* Thème Bleu Nuit */}
          <div 
            onClick={async () => {
              // Mettre à jour l'état local
              const updatedSettings = {
                ...settings,
                appearance: { ...settings.appearance, selectedTheme: 'navyblue' }
              };
              setSettings(updatedSettings);
              
              // Appliquer immédiatement le thème
              setTheme('navyblue');
              
              // Sauvegarder les modifications dans Firebase immédiatement
              await saveSettings(updatedSettings);
              setSaveStatus('success');
              setTimeout(() => setSaveStatus('idle'), 3000);
            }}  
            className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-all ${settings.appearance.selectedTheme === 'navyblue' ? 'border-blue-800 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            style={{ borderColor: settings.appearance.selectedTheme === 'navyblue' ? '#1e3a8a' : '' }}
          >
            <div className="w-8 h-8 rounded-full" style={{ backgroundColor: '#1e3a8a' }}></div>
            <span className={`mt-2 ${settings.appearance.selectedTheme === 'navyblue' ? 'font-medium' : 'text-gray-700 dark:text-gray-300'}`} style={{ color: settings.appearance.selectedTheme === 'navyblue' ? '#1e3a8a' : '' }}>Bleu Nuit</span>
          </div>
          
          {/* Thème Gris Foncé/Vert */}
          <div 
            onClick={async () => {
              // Mettre à jour l'état local
              const updatedSettings = {
                ...settings,
                appearance: { ...settings.appearance, selectedTheme: 'darkgreen' }
              };
              setSettings(updatedSettings);
              
              // Appliquer immédiatement le thème
              setTheme('darkgreen');
              
              // Sauvegarder les modifications dans Firebase immédiatement
              await saveSettings(updatedSettings);
              setSaveStatus('success');
              setTimeout(() => setSaveStatus('idle'), 3000);
            }}  
            className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-all ${settings.appearance.selectedTheme === 'darkgreen' ? 'border-green-600 bg-gray-100 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            style={{ borderColor: settings.appearance.selectedTheme === 'darkgreen' ? '#1f2937' : '' }}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-gray-800 to-green-600"></div>
            <span className={`mt-2 ${settings.appearance.selectedTheme === 'darkgreen' ? 'font-medium' : 'text-gray-700 dark:text-gray-300'}`} style={{ color: settings.appearance.selectedTheme === 'darkgreen' ? '#059669' : '' }}>Gris/Vert</span>
          </div>
          
          {/* Thème Bordeaux/Vert */}
          <div 
            onClick={async () => {
              // Mettre à jour l'état local
              const updatedSettings = {
                ...settings,
                appearance: { ...settings.appearance, selectedTheme: 'burgundy' }
              };
              setSettings(updatedSettings);
              
              // Appliquer immédiatement le thème
              setTheme('burgundy');
              
              // Sauvegarder les modifications dans Firebase immédiatement
              await saveSettings(updatedSettings);
              setSaveStatus('success');
              setTimeout(() => setSaveStatus('idle'), 3000);
            }}  
            className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-all ${settings.appearance.selectedTheme === 'burgundy' ? 'border-red-800 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            style={{ borderColor: settings.appearance.selectedTheme === 'burgundy' ? '#7f1d1d' : '' }}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-900 to-green-400"></div>
            <span className={`mt-2 ${settings.appearance.selectedTheme === 'burgundy' ? 'font-medium' : 'text-gray-700 dark:text-gray-300'}`} style={{ color: settings.appearance.selectedTheme === 'burgundy' ? '#7f1d1d' : '' }}>Bordeaux/Vert</span>
          </div>
          
          {/* Thème Bleu-vert/Rose */}
          <div 
            onClick={async () => {
              // Mettre à jour l'état local
              const updatedSettings = {
                ...settings,
                appearance: { ...settings.appearance, selectedTheme: 'teal' }
              };
              setSettings(updatedSettings);
              
              // Appliquer immédiatement le thème
              setTheme('teal');
              
              // Sauvegarder les modifications dans Firebase immédiatement
              await saveSettings(updatedSettings);
              setSaveStatus('success');
              setTimeout(() => setSaveStatus('idle'), 3000);
            }}  
            className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-all ${settings.appearance.selectedTheme === 'teal' ? 'border-teal-600 bg-teal-50 dark:bg-teal-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            style={{ borderColor: settings.appearance.selectedTheme === 'teal' ? '#0f766e' : '' }}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-teal-700 to-pink-400"></div>
            <span className={`mt-2 ${settings.appearance.selectedTheme === 'teal' ? 'font-medium' : 'text-gray-700 dark:text-gray-300'}`} style={{ color: settings.appearance.selectedTheme === 'teal' ? '#0f766e' : '' }}>Turquoise/Rose</span>
          </div>
          
          {/* Thème Ardoise/Orange */}
          <div 
            onClick={async () => {
              // Mettre à jour l'état local
              const updatedSettings = {
                ...settings,
                appearance: { ...settings.appearance, selectedTheme: 'slate' }
              };
              setSettings(updatedSettings);
              
              // Appliquer immédiatement le thème
              setTheme('slate');
              
              // Sauvegarder les modifications dans Firebase immédiatement
              await saveSettings(updatedSettings);
              setSaveStatus('success');
              setTimeout(() => setSaveStatus('idle'), 3000);
            }}  
            className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-all ${settings.appearance.selectedTheme === 'slate' ? 'border-slate-500 bg-slate-50 dark:bg-slate-800/40' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            style={{ borderColor: settings.appearance.selectedTheme === 'slate' ? '#475569' : '' }}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-slate-500 to-orange-500"></div>
            <span className={`mt-2 ${settings.appearance.selectedTheme === 'slate' ? 'font-medium' : 'text-gray-700 dark:text-gray-300'}`} style={{ color: settings.appearance.selectedTheme === 'slate' ? '#475569' : '' }}>Ardoise/Orange</span>
          </div>
          
          {/* Thème Chocolat/Bleu */}
          <div 
            onClick={async () => {
              // Mettre à jour l'état local
              const updatedSettings = {
                ...settings,
                appearance: { ...settings.appearance, selectedTheme: 'chocolate' }
              };
              setSettings(updatedSettings);
              
              // Appliquer immédiatement le thème
              setTheme('chocolate');
              
              // Sauvegarder les modifications dans Firebase immédiatement
              await saveSettings(updatedSettings);
              setSaveStatus('success');
              setTimeout(() => setSaveStatus('idle'), 3000);
            }}  
            className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-all ${settings.appearance.selectedTheme === 'chocolate' ? 'border-amber-800 bg-amber-50 dark:bg-amber-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            style={{ borderColor: settings.appearance.selectedTheme === 'chocolate' ? '#78350f' : '' }}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-900 to-blue-500"></div>
            <span className={`mt-2 ${settings.appearance.selectedTheme === 'chocolate' ? 'font-medium' : 'text-gray-700 dark:text-gray-300'}`} style={{ color: settings.appearance.selectedTheme === 'chocolate' ? '#78350f' : '' }}>Chocolat/Bleu</span>
          </div>
          
          {/* Thème Indigo/Jaune */}
          <div 
            onClick={async () => {
              // Mettre à jour l'état local
              const updatedSettings = {
                ...settings,
                appearance: { ...settings.appearance, selectedTheme: 'indigo' }
              };
              setSettings(updatedSettings);
              
              // Appliquer immédiatement le thème
              setTheme('indigo');
              
              // Sauvegarder les modifications dans Firebase immédiatement
              await saveSettings(updatedSettings);
              setSaveStatus('success');
              setTimeout(() => setSaveStatus('idle'), 3000);
            }}  
            className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-all ${settings.appearance.selectedTheme === 'indigo' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            style={{ borderColor: settings.appearance.selectedTheme === 'indigo' ? '#4338ca' : '' }}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-700 to-yellow-500"></div>
            <span className={`mt-2 ${settings.appearance.selectedTheme === 'indigo' ? 'font-medium' : 'text-gray-700 dark:text-gray-300'}`} style={{ color: settings.appearance.selectedTheme === 'indigo' ? '#4338ca' : '' }}>Indigo/Jaune</span>
          </div>
          
          {/* Thème Cramoisi/Bleu ciel */}
          <div 
            onClick={async () => {
              // Mettre à jour l'état local
              const updatedSettings = {
                ...settings,
                appearance: { ...settings.appearance, selectedTheme: 'crimson' }
              };
              setSettings(updatedSettings);
              
              // Appliquer immédiatement le thème
              setTheme('crimson');
              
              // Sauvegarder les modifications dans Firebase immédiatement
              await saveSettings(updatedSettings);
              setSaveStatus('success');
              setTimeout(() => setSaveStatus('idle'), 3000);
            }}  
            className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-all ${settings.appearance.selectedTheme === 'crimson' ? 'border-rose-700 bg-rose-50 dark:bg-rose-900/20' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            style={{ borderColor: settings.appearance.selectedTheme === 'crimson' ? '#9f1239' : '' }}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-rose-800 to-sky-500"></div>
            <span className={`mt-2 ${settings.appearance.selectedTheme === 'crimson' ? 'font-medium' : 'text-gray-700 dark:text-gray-300'}`} style={{ color: settings.appearance.selectedTheme === 'crimson' ? '#9f1239' : '' }}>Cramoisi/Ciel</span>
          </div>
          
          {/* Thème Charbon/Violet */}
          <div 
            onClick={async () => {
              // Mettre à jour l'état local
              const updatedSettings = {
                ...settings,
                appearance: { ...settings.appearance, selectedTheme: 'charcoal' }
              };
              setSettings(updatedSettings);
              
              // Appliquer immédiatement le thème
              setTheme('charcoal');
              
              // Sauvegarder les modifications dans Firebase immédiatement
              await saveSettings(updatedSettings);
              setSaveStatus('success');
              setTimeout(() => setSaveStatus('idle'), 3000);
            }}  
            className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-all ${settings.appearance.selectedTheme === 'charcoal' ? 'border-zinc-700 bg-zinc-100 dark:bg-zinc-800/40' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
            style={{ borderColor: settings.appearance.selectedTheme === 'charcoal' ? '#27272a' : '' }}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-zinc-800 to-purple-500"></div>
            <span className={`mt-2 ${settings.appearance.selectedTheme === 'charcoal' ? 'font-medium' : 'text-gray-700 dark:text-gray-300'}`} style={{ color: settings.appearance.selectedTheme === 'charcoal' ? '#27272a' : '' }}>Charbon/Violet</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Couleur principale
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={settings.appearance.primaryColor}
              onChange={(e) => setSettings({
                ...settings,
                appearance: { ...settings.appearance, primaryColor: e.target.value }
              })}
              className="w-10 h-10 rounded border p-0"
            />
            <input
              type="text"
              value={settings.appearance.primaryColor}
              onChange={(e) => setSettings({
                ...settings,
                appearance: { ...settings.appearance, primaryColor: e.target.value }
              })}
              className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Couleur secondaire
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={settings.appearance.secondaryColor}
              onChange={(e) => setSettings({
                ...settings,
                appearance: { ...settings.appearance, secondaryColor: e.target.value }
              })}
              className="w-10 h-10 rounded border p-0"
            />
            <input
              type="text"
              value={settings.appearance.secondaryColor}
              onChange={(e) => setSettings({
                ...settings,
                appearance: { ...settings.appearance, secondaryColor: e.target.value }
              })}
              className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Rayon des bordures
          </label>
          <select
            value={settings.appearance.borderRadius}
            onChange={(e) => setSettings({
              ...settings,
              appearance: { ...settings.appearance, borderRadius: e.target.value as 'small' | 'medium' | 'large' }
            })}
            className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
          >
            <option value="small">Petit</option>
            <option value="medium">Moyen</option>
            <option value="large">Grand</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Densité de l'interface
          </label>
          <select
            value={settings.appearance.density}
            onChange={(e) => setSettings({
              ...settings,
              appearance: { ...settings.appearance, density: e.target.value as 'compact' | 'normal' | 'comfortable' }
            })}
            className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-800 dark:text-white dark:border-gray-700"
          >
            <option value="compact">Compacte</option>
            <option value="normal">Normale</option>
            <option value="comfortable">Confortable</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={settings.appearance.showAnimations}
            onChange={(e) => setSettings({
              ...settings,
              appearance: { ...settings.appearance, showAnimations: e.target.checked }
            })}
            className="rounded"
            style={{
              accentColor: 'var(--color-primary)',
              outline: '2px solid var(--color-primary)',
              boxShadow: '0 0 0 2px var(--color-primary-light, #b3c7fa)'
            }}
          />
          <span>Activer les animations</span>
        </label>
        <label className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={settings.appearance.customLogo}
            onChange={(e) => setSettings({
              ...settings,
              appearance: { ...settings.appearance, customLogo: e.target.checked }
            })}
            className="rounded"
            style={{
              accentColor: 'var(--color-primary)',
              outline: '2px solid var(--color-primary)',
              boxShadow: '0 0 0 2px var(--color-primary-light, #b3c7fa)'
            }}
          />
          <span>Utiliser un logo personnalisé</span>
        </label>
      </div>

      <div className="mt-4">
        <h3 className="font-medium mb-3 text-gray-800 dark:text-gray-200">Aperçu</h3>
        <div className={`border rounded-lg p-4 shadow ${settings.general.theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <div 
            className="p-4 rounded-lg mb-3" 
            style={{ backgroundColor: settings.appearance.primaryColor, color: 'white' }}
          >
            <h4 className="font-medium">Exemple de composant principal</h4>
            <p>Ceci est un exemple de texte avec la couleur principale.</p>
          </div>
          <div 
            className="p-4 rounded-lg" 
            style={{ backgroundColor: settings.appearance.secondaryColor, color: 'white' }}
          >
            <h4 className="font-medium">Exemple de composant secondaire</h4>
            <p>Ceci est un exemple de texte avec la couleur secondaire.</p>
          </div>
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
      <div className="w-full px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-1">Paramètres</h1>
            <p className="text-gray-500 dark:text-gray-400">Configurez votre application selon vos besoins</p>
          </div>
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
              className={`px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-colors duration-200
                ${saving ? 'opacity-70 cursor-not-allowed' : ''}
                bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] hover:text-white`}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Sauvegarde en cours...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden px-6 pb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col flex-1 overflow-hidden">
          <div className="border-b dark:border-gray-700 overflow-x-auto">
            <div className="flex flex-wrap md:flex-nowrap">
              <button
                onClick={() => setActiveTab('general')}
                className={`flex items-center gap-2 px-5 py-4 font-medium transition-colors whitespace-nowrap text-base
                  ${activeTab === 'general'
                    ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'}
                `}
              >
                <Store size={20} />
                Général
              </button>
              <button
                onClick={() => setActiveTab('payment')}
                className={`flex items-center gap-2 px-5 py-4 font-medium transition-colors whitespace-nowrap text-base
                  ${activeTab === 'payment'
                    ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'}
                `}
              >
                <Euro size={20} />
                Paiement
              </button>
              <button
                onClick={() => setActiveTab('printer')}
                className={`flex items-center gap-2 px-5 py-4 font-medium transition-colors whitespace-nowrap text-base
                  ${activeTab === 'printer'
                    ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'}
                `}
              >
                <Printer size={20} />
                Impression
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`flex items-center gap-2 px-5 py-4 font-medium transition-colors whitespace-nowrap text-base
                  ${activeTab === 'notifications'
                    ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'}
                `}
              >
                <Bell size={20} />
                Notifications
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`flex items-center gap-2 px-5 py-4 font-medium transition-colors whitespace-nowrap text-base
                  ${activeTab === 'security'
                    ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'}
                `}
              >
                <Shield size={20} />
                Sécurité
              </button>
              <button
                onClick={() => setActiveTab('backup')}
                className={`flex items-center gap-2 px-5 py-4 font-medium transition-colors whitespace-nowrap text-base
                  ${activeTab === 'backup'
                    ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'}
                `}
              >
                <Database size={20} />
                Sauvegarde
              </button>
              <button
                onClick={() => setActiveTab('appearance')}
                className={`flex items-center gap-2 px-5 py-4 font-medium transition-colors whitespace-nowrap text-base
                  ${activeTab === 'appearance'
                    ? 'border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-200'}
                `}
              >
                <Palette size={20} />
                Apparence
              </button>
            </div>
          </div>

          <div className="p-6 flex-1 overflow-y-auto">
            {activeTab === 'general' && renderGeneralSettings()}
            {activeTab === 'payment' && renderPaymentSettings()}
            {activeTab === 'printer' && renderPrinterSettings()}
            {activeTab === 'notifications' && renderNotificationSettings()}
            {activeTab === 'security' && renderSecuritySettings()}
            {activeTab === 'backup' && renderBackupSettings()}
            {activeTab === 'appearance' && renderAppearanceSettings()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
