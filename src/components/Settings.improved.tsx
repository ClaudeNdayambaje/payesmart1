import React, { useState } from 'react';
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
  Sliders
} from 'lucide-react';

interface SettingsProps {
  onSave: (settings: any) => void;
}

const Settings: React.FC<SettingsProps> = ({ onSave }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'payment' | 'printer' | 'notifications' | 'security' | 'backup' | 'appearance'>('general');
  const [settings, setSettings] = useState({
    general: {
      storeName: 'Night Shop Express',
      address: 'Rue de la Station 123, 1000 Bruxelles',
      phone: '02 123 45 67',
      email: 'contact@nightshop.be',
      vatNumber: 'BE 0123.456.789',
      theme: 'light' as 'light' | 'dark' | 'system',
      language: 'fr' as 'fr' | 'nl' | 'en',
      currency: 'EUR',
      timezone: 'Europe/Brussels'
    },
    payment: {
      acceptCash: true,
      acceptCard: true,
      acceptContactless: true,
      minCardAmount: 5,
      roundCashAmounts: true,
      showChangeCalculator: true,
      defaultPaymentMethod: 'cash' as 'cash' | 'card'
    },
    printer: {
      enabled: true,
      printAutomatically: true,
      copies: 1,
      format: 'A4',
      showLogo: true,
      footerText: 'Merci de votre visite!',
      printerName: 'EPSON TM-T88VI'
    },
    notifications: {
      lowStock: true,
      lowStockThreshold: 10,
      newOrders: true,
      orderStatus: true,
      employeeLogin: true,
      dailyReport: true,
      emailNotifications: true
    },
    security: {
      requirePinForRefunds: true,
      requirePinForDiscounts: true,
      requirePinForVoid: true,
      sessionTimeout: 30,
      maxLoginAttempts: 3,
      passwordExpiration: 90,
      twoFactorAuth: false
    },
    backup: {
      autoBackup: true,
      backupFrequency: 'daily' as 'daily' | 'weekly' | 'monthly',
      backupLocation: 'local' as 'local' | 'cloud',
      keepBackups: 10,
      includeImages: true,
      lastBackup: new Date().toISOString()
    },
    appearance: {
      primaryColor: '#4f46e5',
      secondaryColor: '#f97316',
      borderRadius: 'medium' as 'small' | 'medium' | 'large',
      density: 'normal' as 'compact' | 'normal' | 'comfortable',
      showAnimations: true,
      customLogo: false,
      customFonts: false
    }
  });

  const handleSave = () => {
    onSave(settings);
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom du magasin
          </label>
          <input
            type="text"
            value={settings.general.storeName}
            onChange={(e) => setSettings({
              ...settings,
              general: { ...settings.general, storeName: e.target.value }
            })}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Numéro de TVA
          </label>
          <input
            type="text"
            value={settings.general.vatNumber}
            onChange={(e) => setSettings({
              ...settings,
              general: { ...settings.general, vatNumber: e.target.value }
            })}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Adresse
        </label>
        <input
          type="text"
          value={settings.general.address}
          onChange={(e) => setSettings({
            ...settings,
            general: { ...settings.general, address: e.target.value }
          })}
          className="w-full border rounded-lg px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Téléphone
          </label>
          <input
            type="tel"
            value={settings.general.phone}
            onChange={(e) => setSettings({
              ...settings,
              general: { ...settings.general, phone: e.target.value }
            })}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={settings.general.email}
            onChange={(e) => setSettings({
              ...settings,
              general: { ...settings.general, email: e.target.value }
            })}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Thème
          </label>
          <select
            value={settings.general.theme}
            onChange={(e) => setSettings({
              ...settings,
              general: { ...settings.general, theme: e.target.value as 'light' | 'dark' | 'system' }
            })}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="light">Clair</option>
            <option value="dark">Sombre</option>
            <option value="system">Système</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Langue
          </label>
          <select
            value={settings.general.language}
            onChange={(e) => setSettings({
              ...settings,
              general: { ...settings.general, language: e.target.value as 'fr' | 'nl' | 'en' }
            })}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="fr">Français</option>
            <option value="nl">Nederlands</option>
            <option value="en">English</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fuseau horaire
          </label>
          <select
            value={settings.general.timezone}
            onChange={(e) => setSettings({
              ...settings,
              general: { ...settings.general, timezone: e.target.value }
            })}
            className="w-full border rounded-lg px-3 py-2"
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
              className="rounded text-indigo-600"
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
              className="rounded text-indigo-600"
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
              className="rounded text-indigo-600"
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
            className="rounded text-indigo-600"
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
            className="rounded text-indigo-600"
          />
          <span>Afficher la calculatrice de monnaie</span>
        </label>
      </div>
    </div>
  );

  const renderPrinterSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
        <div>
          <h3 className="font-medium">Imprimante de tickets</h3>
          <p className="text-sm text-gray-500">{settings.printer.printerName}</p>
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
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Format
          </label>
          <select
            value={settings.printer.format}
            onChange={(e) => setSettings({
              ...settings,
              printer: { ...settings.printer, format: e.target.value }
            })}
            className="w-full border rounded-lg px-3 py-2"
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
          Texte de pied de page
        </label>
        <textarea
          value={settings.printer.footerText}
          onChange={(e) => setSettings({
            ...settings,
            printer: { ...settings.printer, footerText: e.target.value }
          })}
          className="w-full border rounded-lg px-3 py-2"
          rows={3}
        />
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.printer.printAutomatically}
            onChange={(e) => setSettings({
              ...settings,
              printer: { ...settings.printer, printAutomatically: e.target.checked }
            })}
            className="rounded text-indigo-600"
          />
          <span>Imprimer automatiquement après chaque vente</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.printer.showLogo}
            onChange={(e) => setSettings({
              ...settings,
              printer: { ...settings.printer, showLogo: e.target.checked }
            })}
            className="rounded text-indigo-600"
          />
          <span>Afficher le logo sur les tickets</span>
        </label>
      </div>
    </div>
  );
