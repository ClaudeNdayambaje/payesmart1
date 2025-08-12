import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import ThemeObserver from './ThemeObserver';
import TrialHeader from './saas/TrialHeader';
import { Employee } from '../types';

interface LayoutProps {
  children: ReactNode;
  activeView: 'pos' | 'history' | 'orders' | 'promotions' | 'employees' | 'stock' | 'reports' | 'settings' | 'loyalty' | 'qrcodes';
  onViewChange: (view: 'pos' | 'history' | 'orders' | 'promotions' | 'employees' | 'stock' | 'reports' | 'settings' | 'loyalty' | 'qrcodes') => void;
  currentEmployee: Employee;
  onLogout: () => void;
  hasPermission: (view: string) => boolean;
}

/**
 * Composant de mise en page principal qui gère la structure de l'application
 * et assure que les changements de thème sont correctement appliqués
 */
const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeView, 
  onViewChange, 
  currentEmployee, 
  onLogout,
  hasPermission
}) => {
  return (
    <div className="h-screen flex overflow-hidden">
      {/* ThemeObserver assure que tous les composants sont synchronisés avec le thème */}
      <ThemeObserver />
      
      {/* Barre latérale fixe - ne défile pas avec le contenu */}
      <div className="h-screen flex-shrink-0">
        <Sidebar
          activeView={activeView}
          onViewChange={onViewChange}
          currentEmployee={currentEmployee}
          onLogout={onLogout}
          hasPermission={hasPermission}
        />
      </div>
        
      {/* Contenu principal de l'application avec défilement indépendant */}
      <div className="flex-1 flex flex-col h-screen">
        {/* En-tête de période d'essai */}
        <TrialHeader />
        
        {/* Contenu principal avec défilement */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
