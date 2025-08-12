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
