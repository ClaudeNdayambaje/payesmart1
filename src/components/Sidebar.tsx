import React, { useState, useEffect, useRef } from 'react';
import { Award, BarChart3, Menu, Package, Power, Settings, ShoppingCart, Tag, Truck, UserCircle, Users, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Employee } from '../types';
import { themeEventBus } from '../ThemeEventBus';
import ConfirmationModal from './ui/ConfirmationModal';

// Pour débugger l'application du thème
const DEBUG_SIDEBAR = true;

interface SidebarProps {
  activeView: 'pos' | 'history' | 'orders' | 'promotions' | 'employees' | 'stock' | 'reports' | 'settings' | 'loyalty' | 'qrcodes';
  onViewChange: (view: 'pos' | 'history' | 'orders' | 'promotions' | 'employees' | 'stock' | 'reports' | 'settings' | 'loyalty' | 'qrcodes') => void;
  currentEmployee: Employee;
  onLogout: () => void;
  hasPermission: (view: string) => boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  onViewChange, 
  currentEmployee: initialEmployee,
  onLogout,
  hasPermission
}) => {
  // Utiliser un état local pour gérer l'employé actuel, initialisé avec la prop
  const [currentEmployee, setCurrentEmployee] = useState(initialEmployee);
  
  // Écouter les événements de mise à jour d'avatar
  useEffect(() => {
    const handleAvatarUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      console.log('Événement avatarUpdated reçu dans Sidebar:', customEvent.detail);
      
      // Vérifier si l'événement concerne l'employé actuellement connecté
      if (currentEmployee && customEvent.detail.employeeId === currentEmployee.id) {
        console.log('Mise à jour de l\'avatar dans Sidebar pour:', currentEmployee.firstName);
        
        // Créer une nouvelle référence de l'objet employé avec l'avatar mis à jour
        setCurrentEmployee(prevEmployee => ({
          ...prevEmployee,
          avatarBase64: customEvent.detail.avatarBase64
        }));
      }
    };
    
    // Ajouter l'écouteur d'événement
    document.addEventListener('avatarUpdated', handleAvatarUpdate);
    
    // Nettoyer l'écouteur lors du démontage du composant
    return () => {
      document.removeEventListener('avatarUpdated', handleAvatarUpdate);
    };
  }, [currentEmployee]);
  
  // Mettre à jour l'état local lorsque la prop change
  useEffect(() => {
    setCurrentEmployee(initialEmployee);
  }, [initialEmployee]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme } = useTheme();
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

  // Détecter si l'écran est mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Référence pour suivre si le composant est monté
  const mountedRef = useRef(false);
  
  // Implémenter une fonction forceRefresh locale pour forcer le rendu du composant
  const [refreshKey, setRefreshKey] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });
  
  const checkDarkMode = () => {
    const currentIsDarkMode = document.documentElement.classList.contains('dark');
    setIsDarkMode(currentIsDarkMode);
    return currentIsDarkMode;
  };
  
  const forceRefresh = () => {
    if (mountedRef.current) {
      checkDarkMode();
      setRefreshKey(prev => prev + 1);
      if (DEBUG_SIDEBAR) console.log('Sidebar: forceRefresh appelé, nouvelle clé:', refreshKey + 1, 'isDarkMode:', isDarkMode);
    }
  };

  // Gérer les changements de thème via tous les canaux disponibles
  useEffect(() => {
    if (DEBUG_SIDEBAR) console.log('Sidebar: useEffect pour l\'écoute des événements de thème');
    
    // Marquer le composant comme monté
    mountedRef.current = true;
    
    // Vérifier si le mode sombre est actif
    checkDarkMode();
    
    // Force une application immédiate du thème
    if (DEBUG_SIDEBAR) console.log('Sidebar: Synchronisation forcée du thème au montage');
    
    // Délai court pour s'assurer que le DOM est prêt
    setTimeout(() => {
      // Vérifier à nouveau le mode sombre après un court délai
      checkDarkMode();
      // Déclencher l'événement forceThemeUpdate pour assurer une cohérence du thème
      document.dispatchEvent(new CustomEvent('forceThemeUpdate'));
    }, 50);
    
    // 1. Via l'API d'événements DOM (pour compatibilité)
    const handleThemeChange = (event: Event) => {
      if (DEBUG_SIDEBAR) {
        console.log('Sidebar a reçu l\'événement themechange DOM', 
          (event as CustomEvent).detail?.theme,
          'Version:', (event as CustomEvent).detail?.version
        );
      }
      // Forcer un nouveau rendu synchronisé avec le thème
      setTimeout(() => {
        if (mountedRef.current) {
          forceRefresh();
          if (DEBUG_SIDEBAR) console.log('Sidebar: Rafraîchissement après événement DOM');
        }
      }, 50);
    };
    
    // 2. Via le bus d'événements centralisé (méthode principale)
    const unsubscribe = themeEventBus.subscribe((theme, _colors) => {
      if (DEBUG_SIDEBAR) {
        console.log('Sidebar a reçu un changement de thème via EventBus:', theme);
      }
      setTimeout(() => {
        if (mountedRef.current) {
          forceRefresh();
          if (DEBUG_SIDEBAR) console.log('Sidebar: Rafraîchissement après événement EventBus');
        }
      }, 50);
    });
    
    // 3. Nouvel événement personnalisé 'themeapplied'
    const handleThemeApplied = (event: Event) => {
      if (DEBUG_SIDEBAR) {
        console.log('Sidebar a reçu l\'événement themeapplied', 
          (event as CustomEvent).detail?.theme,
          'Timestamp:', (event as CustomEvent).detail?.timestamp
        );
      }
      // Forcer un nouveau rendu immédiatement
      if (mountedRef.current) {
        forceRefresh();
        if (DEBUG_SIDEBAR) console.log('Sidebar: Rafraîchissement après événement themeapplied');
      }
    };
    
    // 4. Événement forceThemeUpdate
    const handleForceThemeUpdate = (event: Event) => {
      if (DEBUG_SIDEBAR) {
        console.log('Sidebar a reçu l\'événement forceThemeUpdate', 
          (event as CustomEvent).detail
        );
      }
      // Forcer un nouveau rendu immédiatement
      if (mountedRef.current) {
        forceRefresh();
        if (DEBUG_SIDEBAR) console.log('Sidebar: Rafraîchissement après forceThemeUpdate');
      }
    };
    
    // Ajouter les écouteurs d'événements
    document.addEventListener('themechange', handleThemeChange as EventListener);
    document.addEventListener('themeapplied', handleThemeApplied as EventListener);
    document.addEventListener('forceThemeUpdate', handleForceThemeUpdate as EventListener);
    
    return () => {
      mountedRef.current = false;
      document.removeEventListener('themechange', handleThemeChange as EventListener);
      document.removeEventListener('themeapplied', handleThemeApplied as EventListener);
      document.removeEventListener('forceThemeUpdate', handleForceThemeUpdate as EventListener);
      unsubscribe(); // Se désabonner du bus d'événements
    };
  }, []);
  
  // Force une mise à jour du thème lors des changements de vue
  useEffect(() => {
    if (DEBUG_SIDEBAR) console.log('Sidebar: Vue active changée vers', activeView);
    
    // Délai court pour s'assurer que le DOM est prêt
    setTimeout(() => {
      // Déclencher l'événement forceThemeUpdate
      document.dispatchEvent(new CustomEvent('forceThemeUpdate'));
      
      // Force un nouveau rendu de la barre latérale
      forceRefresh();
    }, 100);
  }, [activeView]);

  // Fermer le menu mobile lorsqu'une vue est sélectionnée
  const handleViewChange = (view: 'pos' | 'history' | 'orders' | 'promotions' | 'employees' | 'stock' | 'reports' | 'settings' | 'loyalty' | 'qrcodes') => {
    // Débogage détaillé
    if (DEBUG_SIDEBAR) {
      console.log(`Sidebar: Demande de changement de vue vers: ${view}`, {
        utilisateur: currentEmployee ? `${currentEmployee.firstName} (${currentEmployee.role})` : 'Non connecté',
        vueActuelle: activeView,
        nouvelleVue: view,
        permissions: currentEmployee?.permissions
      });
    }
    
    // Vérifier si l'utilisateur a la permission d'accéder à cette vue
    if (!hasPermission(view)) {
      console.warn(`Sidebar: L'utilisateur n'a pas la permission d'accéder à la vue ${view}`);
      alert(`Vous n'avez pas la permission d'accéder à cette vue.`);
      return;
    }
    
    try {
      // Appliquer le changement de vue
      console.log(`Sidebar: Changement de vue vers: ${view}`);
      onViewChange(view);
      
      // Fermer le menu mobile si nécessaire
      if (isMobile) {
        setMobileMenuOpen(false);
      }
    } catch (error) {
      console.error('Sidebar: Erreur lors du changement de vue:', error);
    }
  };

  // Gérer la confirmation de déconnexion
  const handleLogoutClick = () => {
    setShowLogoutConfirmation(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirmation(false);
    onLogout();
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirmation(false);
  };

  return (
    <>
      {/* Bouton de menu mobile */}
      {isMobile && (
        <div 
          className="fixed top-0 left-0 w-full p-3 flex justify-between items-center z-50 bg-[color:var(--color-primary)] dark:bg-gray-800 text-white">
          <div className="flex items-center">
            <Menu className="w-6 h-6 mr-2" />
            <span className="font-semibold">PayeSmart</span>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              transition: 'all 0.3s ease-in-out'
            }}
            className="p-1 rounded-md hover:opacity-80"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      )}

      {/* Barre latérale - rendu automatiquement mis à jour par les changements de contexte et d'événements */}
      <div 
        className={`h-full ${isMobile ? 'fixed inset-0 z-40 w-64 transform transition-transform duration-300 ease-in-out' : 'w-20 md:w-20 lg:w-20 flex-shrink-0 transition-all'} 
        ${mobileMenuOpen ? 'translate-x-0' : isMobile ? '-translate-x-full' : ''} 
        bg-[color:var(--color-primary)] dark:bg-gray-800 text-[color:var(--color-text-on-primary)] dark:text-white flex flex-col relative`}
        key={`sidebar-${refreshKey}-${theme}-${isDarkMode ? 'dark' : 'light'}`}
      >
        {!isMobile && (
          <div className="flex flex-col items-center mb-4 px-2 pt-5">
            <Menu className="w-8 h-8 text-[color:var(--color-sidebar-icon)]" />
          </div>
        )}

        <div className="flex-1 flex flex-col gap-1 px-2 overflow-y-auto pt-4">
          <button
            onClick={() => handleViewChange('pos')}
            className={`p-3 rounded-md transition-colors duration-200 hover:opacity-80 group ${isMobile ? 'flex items-center' : ''} 
              ${activeView === 'pos' ? 'bg-[color:var(--color-secondary)] dark:bg-[#f6941c] text-white' : 'text-[color:var(--color-text-on-primary)] dark:text-gray-200 hover:bg-opacity-20 hover:bg-[color:var(--color-background-alt)] dark:hover:bg-gray-700'} 
              w-full mb-2 flex justify-center`}
            title="Point de vente"
          >
            <ShoppingCart className={`${isMobile ? 'w-5 h-5 mr-3' : 'w-6 h-6 mx-auto'} ${activeView === 'pos' ? 'text-white' : 'text-[color:var(--color-sidebar-icon)] dark:text-gray-300 group-hover:text-[color:var(--color-secondary)] dark:group-hover:text-[#f6941c]'}`} />
            {isMobile && <span>Caisse</span>}
          </button>

          {/* N'afficher l'historique que si l'employé a la permission ET qu'il n'est pas caissier */}
          {hasPermission('history') && currentEmployee.role !== 'cashier' && (
            <button
              onClick={() => handleViewChange('history')}
              className={`p-3 rounded-md transition-colors duration-200 hover:opacity-80 group ${isMobile ? 'flex items-center' : ''} ${
                activeView === 'history' 
                  ? 'bg-[color:var(--color-secondary)] dark:bg-[#f6941c] text-white' 
                  : 'text-[color:var(--color-text-on-primary)] dark:text-gray-200 hover:bg-opacity-20 hover:bg-[color:var(--color-background-alt)] dark:hover:bg-gray-700'
              } w-full mb-1 flex justify-center`}
              title="Historique"
            >
              <svg 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className={`${isMobile ? 'w-5 h-5 mr-3' : 'w-6 h-6 mx-auto'} ${activeView === 'history' ? 'text-white' : 'text-[color:var(--color-sidebar-icon)] dark:text-gray-300 group-hover:text-[color:var(--color-secondary)] dark:group-hover:text-[#f6941c]'}`}
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M12 7v5l4 2" />
              </svg>
              {isMobile && <span>Historique</span>}
            </button>
          )}

          {hasPermission('stock') && currentEmployee.role !== 'cashier' && (
            <button
              onClick={() => handleViewChange('stock')}
              className={`p-3 rounded-md transition-colors duration-200 hover:opacity-80 group ${isMobile ? 'flex items-center' : ''} ${
                activeView === 'stock' 
                  ? 'bg-[color:var(--color-secondary)] dark:bg-[#f6941c] text-white' 
                  : 'text-[color:var(--color-text-on-primary)] dark:text-gray-200 hover:bg-opacity-20 hover:bg-[color:var(--color-background-alt)] dark:hover:bg-gray-700'
              } w-full mb-1 flex justify-center`}
              title="Stock"
            >
              <Package className={`${isMobile ? 'w-5 h-5 mr-3' : 'w-6 h-6 mx-auto'} ${activeView === 'stock' ? 'text-white' : 'text-[color:var(--color-sidebar-icon)] dark:text-gray-300 group-hover:text-[color:var(--color-secondary)] dark:group-hover:text-[#f6941c]'}`} />
              {isMobile && <span>Stock</span>}
            </button>
          )}

          {hasPermission('orders') && currentEmployee.role !== 'cashier' && (
            <button
              onClick={() => handleViewChange('orders')}
              className={`p-3 rounded-md transition-colors duration-200 hover:opacity-80 group ${isMobile ? 'flex items-center' : ''} ${
                activeView === 'orders' 
                  ? 'bg-[color:var(--color-secondary)] dark:bg-[#f6941c] text-white' 
                  : 'text-[color:var(--color-text-on-primary)] dark:text-gray-200 hover:bg-opacity-20 hover:bg-[color:var(--color-background-alt)] dark:hover:bg-gray-700'
              } w-full mb-1 flex justify-center`}
              title="Commandes"
            >
              <Truck className={`${isMobile ? 'w-5 h-5 mr-3' : 'w-6 h-6 mx-auto'} ${activeView === 'orders' ? 'text-white' : 'text-[color:var(--color-sidebar-icon)] dark:text-gray-300 group-hover:text-[color:var(--color-secondary)] dark:group-hover:text-[#f6941c]'}`} />
              {isMobile && <span>Commandes</span>}
            </button>
          )}

          {hasPermission('promotions') && currentEmployee.role !== 'cashier' && (
            <button
              onClick={() => handleViewChange('promotions')}
              className={`p-3 rounded-md transition-colors duration-200 hover:opacity-80 group ${isMobile ? 'flex items-center' : ''} ${
                activeView === 'promotions' 
                  ? 'bg-[color:var(--color-secondary)] dark:bg-[#f6941c] text-white' 
                  : 'text-[color:var(--color-text-on-primary)] dark:text-gray-200 hover:bg-opacity-20 hover:bg-[color:var(--color-background-alt)] dark:hover:bg-gray-700'
              } w-full mb-1 flex justify-center`}
              title="Promotions"
            >
              <Tag className={`${isMobile ? 'w-5 h-5 mr-3' : 'w-6 h-6 mx-auto'} ${activeView === 'promotions' ? 'text-white' : 'text-[color:var(--color-sidebar-icon)] dark:text-gray-300 group-hover:text-[color:var(--color-secondary)] dark:group-hover:text-[#f6941c]'}`} />
              {isMobile && <span>Promotions</span>}
            </button>
          )}

          {hasPermission('loyalty') && (
            <button
              onClick={() => handleViewChange('loyalty')}
              className={`p-3 rounded-md transition-colors duration-200 hover:opacity-80 group ${isMobile ? 'flex items-center' : ''} ${
                activeView === 'loyalty' 
                  ? 'bg-[color:var(--color-secondary)] dark:bg-[#f6941c] text-white' 
                  : 'text-[color:var(--color-text-on-primary)] dark:text-gray-200 hover:bg-opacity-20 hover:bg-[color:var(--color-background-alt)] dark:hover:bg-gray-700'
              } w-full mb-1 flex justify-center`}
              title="Fidélité"
            >
              <Award className={`${isMobile ? 'w-5 h-5 mr-3' : 'w-6 h-6 mx-auto'} ${activeView === 'loyalty' ? 'text-white' : 'text-[color:var(--color-sidebar-icon)] dark:text-gray-300 group-hover:text-[color:var(--color-secondary)] dark:group-hover:text-[#f6941c]'}`} />
              {isMobile && <span>Fidélité</span>}
            </button>
          )}

          {hasPermission('reports') && currentEmployee.role !== 'cashier' && (
            <button
              onClick={() => handleViewChange('reports')}
              className={`p-3 rounded-md transition-colors duration-200 hover:opacity-80 group ${isMobile ? 'flex items-center' : ''} ${
                activeView === 'reports' 
                  ? 'bg-[color:var(--color-secondary)] dark:bg-[#f6941c] text-white' 
                  : 'text-[color:var(--color-text-on-primary)] dark:text-gray-200 hover:bg-opacity-20 hover:bg-[color:var(--color-background-alt)] dark:hover:bg-gray-700'
              } w-full mb-1 flex justify-center`}
              title="Rapports"
            >
              <BarChart3 className={`${isMobile ? 'w-5 h-5 mr-3' : 'w-6 h-6 mx-auto'} ${activeView === 'reports' ? 'text-white' : 'text-[color:var(--color-sidebar-icon)] dark:text-gray-300 group-hover:text-[color:var(--color-secondary)] dark:group-hover:text-[#f6941c]'}`} />
              {isMobile && <span>Rapports</span>}
            </button>
          )}
          
          {(hasPermission('employees') || currentEmployee.role === 'cashier') && (
            <button
              onClick={() => handleViewChange('employees')}
              className={`p-3 rounded-md transition-colors duration-200 hover:opacity-80 group ${isMobile ? 'flex items-center' : ''} ${
                activeView === 'employees' 
                  ? 'bg-[color:var(--color-secondary)] dark:bg-[#f6941c] text-white' 
                  : 'text-[color:var(--color-text-on-primary)] dark:text-gray-200 hover:bg-opacity-20 hover:bg-[color:var(--color-background-alt)] dark:hover:bg-gray-700'
              } w-full mb-1 flex justify-center`}
              title="Employés"
            >
              <Users className={`${isMobile ? 'w-5 h-5 mr-3' : 'w-6 h-6 mx-auto'} ${activeView === 'employees' ? 'text-white' : 'text-[color:var(--color-sidebar-icon)] dark:text-gray-300 group-hover:text-[color:var(--color-secondary)] dark:group-hover:text-[#f6941c]'}`} />
              {isMobile && <span>Employés</span>}
            </button>
          )}

          {/* Bouton Paramètres juste en dessous du bouton Rapports */}
          {hasPermission('settings') && currentEmployee.role !== 'cashier' && (
            <button
              onClick={() => handleViewChange('settings')}
              className={`p-3 rounded-md transition-colors duration-200 hover:opacity-80 group ${isMobile ? 'flex items-center' : ''} 
                ${activeView === 'settings' ? 'bg-[color:var(--color-secondary)] dark:bg-[#f6941c] text-white' : 'text-[color:var(--color-text-on-primary)] dark:text-gray-200 hover:bg-opacity-20 hover:bg-[color:var(--color-background-alt)] dark:hover:bg-gray-700'} 
                w-full mb-2 flex justify-center`}
              title="Paramètres"
            >
              <Settings className={`${isMobile ? 'w-5 h-5 mr-3' : 'w-6 h-6 mx-auto'} ${activeView === 'settings' ? 'text-white' : 'text-[color:var(--color-sidebar-icon)] dark:text-gray-300 group-hover:text-[color:var(--color-secondary)] dark:group-hover:text-[#f6941c]'}`} />
              {isMobile && <span>Paramètres</span>}
            </button>
          )}
        </div>
        
        <div className="mt-auto px-2 pb-4"> 
          {/* Informations Utilisateur */}
          <div className={`flex ${isMobile ? 'items-center p-3' : 'flex-col items-center'} gap-2 mb-4`}> 
            {currentEmployee ? (
              <>
                {/* Debugger pour voir ce qui est disponible */}
                {DEBUG_SIDEBAR && console.log('Avatar dans Sidebar:', (currentEmployee as any)?.avatarBase64 ? 'Présent' : 'Absent')}
                
                {/* Photo de l'employé - version améliorée */}
                <div className="flex items-center justify-center mb-1">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[color:var(--color-secondary)] dark:border-[#f6941c] shadow-md">
                    {(currentEmployee as any).avatarBase64 || (currentEmployee as any).avatarUrl ? (
                      <img 
                        src={(currentEmployee as any).avatarBase64 || (currentEmployee as any).avatarUrl} 
                        alt={`${currentEmployee.firstName} ${currentEmployee.lastName}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Erreur de chargement d\'image dans Sidebar');
                          // Récupérer la couleur secondaire du thème actuel
                          const secondaryColor = getComputedStyle(document.documentElement).getPropertyValue('--color-secondary') || '#f6941c';
                          // Encoder la couleur pour l'utiliser dans le SVG
                          const encodedColor = encodeURIComponent(secondaryColor.trim());
                          e.currentTarget.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='${encodedColor}' stroke='${encodedColor}'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-700">
                        <UserCircle className="w-12 h-12 text-[color:var(--color-sidebar-icon)] dark:text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="w-14 h-14 rounded-full flex items-center justify-center bg-gray-700 mb-1">
                <UserCircle className="w-12 h-12 text-[color:var(--color-sidebar-icon)] dark:text-white" />
              </div>
            )}
            {isMobile ? (
              <div>
                <div className="text-sm font-medium dark:text-white">{currentEmployee.firstName}</div>
                <div className="text-xs opacity-80 dark:text-gray-300">{currentEmployee.role}</div>
              </div>
            ) : (
              <div className="text-center">
                <div className="text-sm font-medium dark:text-white">{currentEmployee.firstName}</div>
                <div className="text-xs opacity-80 dark:text-gray-300">{currentEmployee.role === 'admin' ? 'Admin' : currentEmployee.role === 'manager' ? 'Manager' : 'Caissier'}</div>
              </div>
            )}
          </div>


          {/* Bouton Déconnexion */}
          <button
            onClick={handleLogoutClick}
            className={`w-full rounded-md transition-all duration-300 hover:opacity-80 ${
              isMobile 
                ? 'flex items-center p-3' 
                : 'flex flex-col items-center p-3'
            } ${isDarkMode ? 'bg-red-700 hover:bg-red-800' : 'bg-[color:var(--color-danger)] hover:bg-[color:var(--color-danger-hover)]'} text-white`}
            title="Déconnexion"
          >
            <Power className="w-6 h-6 text-white" />
            {isMobile && <span>Déconnexion</span>}
          </button>
        </div>
      </div>

      {/* Overlay pour fermer le menu mobile en cliquant à l'extérieur */}
      {isMobile && mobileMenuOpen && (
        <div 
          className={`fixed inset-0 ${isDarkMode ? 'bg-black/50' : 'bg-[color:var(--color-overlay)]'} z-30`}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {showLogoutConfirmation && (
        <ConfirmationModal
          isOpen={showLogoutConfirmation}
          title="Confirmation de déconnexion"
          message={`Souhaitez-vous vous déconnecter de l'application${currentEmployee ? ` en tant que ${currentEmployee.firstName} ${currentEmployee.lastName}` : ''} ?`}
          confirmText="Déconnexion"
          cancelText="Annuler"
          onConfirm={handleConfirmLogout}
          onCancel={handleCancelLogout}
        />
      )}
    </>
  );
};

export default Sidebar;