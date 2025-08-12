import React, { useState, useEffect } from 'react';
import { getActiveEmployees, loginWithIdAndPin, logout } from '../services/authService';
import { Employee } from '../types';
import { UserCircle, Loader2, Power } from 'lucide-react';
import { removeExtraMainAdmins } from '../services/employeeService';
import { auth } from '../firebase'; // Import Firebase Auth
import { getSettings, defaultSettings } from '../services/settingsService'; // Import du service de paramètres
import { useTheme } from '../contexts/ThemeContext'; // Import du contexte de thème
import ConfirmationModal from './ui/ConfirmationModal';
import { forceStoreNameRefresh, clearStoreData } from '../utils/storeNameFixer'; // Import de l'utilitaire pour corriger le nom du magasin
import '../styles/custom-login.css'; // Import des styles personnalisés pour la page de connexion

interface EmployeeLoginProps {
  onLogin: (employee: Employee) => void;
}

const EmployeeLogin: React.FC<EmployeeLoginProps> = ({ onLogin }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loginInProgress, setLoginInProgress] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [storeName, setStoreName] = useState(defaultSettings.general.storeName); // État pour le nom du magasin
  const [showCreateAdminButton, setShowCreateAdminButton] = useState(false);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const { setTheme } = useTheme(); // Utiliser le contexte de thème

  // État pour stocker le businessId actuel
  const [currentBusinessId, setCurrentBusinessId] = useState<string>('');

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setLoading(true);
        
        // Récupérer le businessId depuis l'URL ou le localStorage
        const urlParams = new URLSearchParams(window.location.search);
        let businessId = urlParams.get('businessId');
        
        // Si pas de businessId dans l'URL, essayer de le récupérer du localStorage
        if (!businessId) {
          const storedBusinessId = localStorage.getItem('businessId');
          if (storedBusinessId) {
            businessId = storedBusinessId;
            console.log('BusinessId récupéré du localStorage:', businessId);
          }
        }
        
        // Si toujours pas de businessId, essayer de le récupérer via Firebase Auth
        if (!businessId) {
          const currentUser = auth.currentUser;
          if (currentUser) {
            businessId = currentUser.uid;
            console.log('BusinessId récupéré de Firebase Auth:', businessId);
          }
        }
        
        // Stocker le businessId dans le localStorage pour une utilisation ultérieure
        if (businessId) {
          localStorage.setItem('businessId', businessId);
          // Mettre à jour l'état du businessId
          setCurrentBusinessId(businessId);
        }
        
        // Supprimer les administrateurs principaux en double dans la base de données
        if (businessId) {
          await removeExtraMainAdmins();
        }
        
        const activeEmployees = await getActiveEmployees();
        
        // Si des employés sont trouvés, les afficher
        if (activeEmployees.length > 0) {
          console.log('Employés actifs trouvés:', activeEmployees.length);
          
          // Vérifier s'il y a plusieurs administrateurs principaux
          const mainAdmins = activeEmployees.filter(emp => emp.isMainAdmin);
          if (mainAdmins.length > 1) {
            console.log('Plusieurs administrateurs principaux trouvés, conservation du premier seulement');
            // Conserver uniquement le premier administrateur principal
            const firstMainAdmin = mainAdmins[0];
            const otherEmployees = activeEmployees.filter(emp => !emp.isMainAdmin || emp.id === firstMainAdmin.id);
            setEmployees(otherEmployees as any);
          } else {
            setEmployees(activeEmployees as any);
          }
        } 
        // Si aucun employé n'est trouvé mais qu'on a un administrateur par défaut dans le localStorage
        else if (localStorage.getItem('defaultAdminCreated') === 'true') {
          console.log('Aucun employé trouvé, mais un administrateur par défaut a déjà été créé');
          // Créer un administrateur par défaut avec le nom "Admin" et le PIN "1234"
          const defaultAdmin: Employee = {
            firstName: 'Admin',
            lastName: 'Principal',
            email: 'admin@default.com',
            role: 'admin',
            pin: '1234',
            isMainAdmin: true,
            id: 'default-admin',
            active: true,
            createdAt: new Date(),
            businessId: businessId || 'default',
            permissions: []
          };
          setEmployees([defaultAdmin] as any);
        } 
        // Si aucun employé n'est trouvé et pas d'administrateur par défaut, proposer d'en créer un
        else {
          console.log('Aucun employé trouvé, proposition de créer un administrateur par défaut');
          setShowCreateAdminButton(true);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des employés:', error);
        setLoading(false);
        setError('Erreur lors du chargement des employés. Veuillez réessayer.');
      }
    };
    
    loadEmployees();
  }, []);
  
  // Charger les paramètres du magasin chaque fois que le businessId change
  useEffect(() => {
    if (currentBusinessId) {
      loadSettings();
    }
  }, [currentBusinessId]);
  
  // Écouter l'événement storeNameUpdated pour mettre à jour le nom du magasin
  useEffect(() => {
    const handleStoreNameUpdated = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.storeName) {
        console.log('Mise à jour du nom du magasin depuis l\'event:', customEvent.detail.storeName);
        setStoreName(customEvent.detail.storeName);
      }
    };
    
    // Ajouter l'écouteur d'événement
    document.addEventListener('storeNameUpdated', handleStoreNameUpdated);
    
    // Essayer de récupérer le nom du magasin depuis le localStorage au chargement
    const storedName = localStorage.getItem('currentStoreName');
    if (storedName) {
      console.log('Nom du magasin récupéré depuis localStorage:', storedName);
      setStoreName(storedName);
    }
    
    // Nettoyer l'écouteur à la destruction du composant
    return () => {
      document.removeEventListener('storeNameUpdated', handleStoreNameUpdated);
    };
  }, []);
  
  const loadSettings = async () => {
    try {
      console.log('Chargement des paramètres du magasin pour le businessId:', currentBusinessId);
      // Forcer la récupération des paramètres depuis le serveur (pas de cache)
      const settings = await getSettings();
      
      if (settings && settings.general && settings.general.storeName) {
        console.log('Nom du magasin récupéré:', settings.general.storeName);
        setStoreName(settings.general.storeName);
      } else {
        console.warn('Aucun nom de magasin trouvé dans les paramètres');
        // Si on ne trouve pas de nom, essayer de récupérer les infos de l'entreprise directement
        if (currentBusinessId) {
          try {
            const { getDoc, doc } = await import('firebase/firestore');
            const { db } = await import('../firebase');
            
            const businessRef = doc(db, 'businesses', currentBusinessId);
            const businessSnap = await getDoc(businessRef);
            
            if (businessSnap.exists()) {
              const businessData = businessSnap.data();
              if (businessData.businessName) {
                console.log('Nom du magasin récupéré depuis businesses:', businessData.businessName);
                setStoreName(businessData.businessName);
              }
            }
          } catch (err) {
            console.error('Erreur lors de la récupération des infos entreprise:', err);
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      // Utiliser le nom par défaut en cas d'erreur
    }
  };
  
  // Gérer l'entrée du code PIN
  const handlePinInput = async (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      
      // Si le PIN est complet (4 chiffres), tenter la connexion
      if (newPin.length === 4 && selectedEmployee) {
        setLoginInProgress(true);
        setError('');
        
        try {
          console.log(`Tentative de connexion pour l'employé: ${selectedEmployee.firstName} avec PIN: ****`);
          
          // Essayer d'abord de se connecter sans dépendance sur Firebase
          // Vérifier localement si le PIN correspond avant d'appeler le service d'authentification
          if (selectedEmployee.pin === newPin) {
            console.log('PIN local valide, tentative d\'authentification avec le service...');
          } else {
            console.log('PIN incorrect, va échouer au niveau du service');
          }
          
          const loggedInEmployee = await loginWithIdAndPin(selectedEmployee.id, newPin);
          
          if (loggedInEmployee) {
            console.log('Connexion réussie pour:', loggedInEmployee.firstName);
            // Récupérer les paramètres de l'utilisateur et appliquer son thème
            try {
              const settings = await getSettings();
              const selectedTheme = settings?.appearance?.selectedTheme || 'default';
              console.log('Application du thème de l\'utilisateur:', selectedTheme);
              
              // Appliquer le thème via l'API du contexte de thème
              setTheme(selectedTheme);
              
              // Afficher un message de connexion réussie
              setError('');
              
              // Appliquer le thème en deux étapes pour garantir son application
              // Étape 1: Application directe
              applyThemeDirectly(selectedTheme);
              
              // Étape 2: Différer l'appel au callback pour s'assurer que le thème est appliqué
              setTimeout(() => {
                // Appliquer à nouveau le thème juste avant la navigation
                applyThemeDirectly(selectedTheme);
                
                // Callback de connexion qui va rediriger vers le tableau de bord
                console.log('Redirection vers le tableau de bord...');
                onLogin(loggedInEmployee as any);
              }, 500); // Délai augmenté pour garantir l'application du thème
              
              return; // Sortir de la fonction
            } catch (themeError) {
              console.error('Erreur lors de l\'application du thème:', themeError);
              // Continuer malgré l'erreur de thème
              onLogin(loggedInEmployee as any);
            }
          } else {
            console.log('Échec de l\'authentification: employé non trouvé ou PIN incorrect');
            setError('Code PIN incorrect');
            setPin('');
          }
        } catch (error) {
          console.error('Erreur de connexion:', error);
          setError('Erreur de connexion. Veuillez réessayer.');
          setPin('');
        } finally {
          setLoginInProgress(false);
        }
      }
    }
  };
  
  // Fonction pour appliquer directement le thème aux éléments DOM
  const applyThemeDirectly = (themeName: string) => {
    console.log('Application directe du thème:', themeName);
    
    // 1. Appliquer les classes de thème sur les éléments racine
    const rootElement = document.documentElement;
    const bodyElement = document.body;
    
    // Nettoyer les anciennes classes de thème
    const themeClasses = ['dark', 'theme-default', 'theme-light', 'theme-blue', 'theme-green', 
      'theme-purple', 'theme-orange', 'theme-custom', 'theme-black', 'theme-darkgray', 
      'theme-red', 'theme-navyblue', 'theme-darkgreen', 'theme-burgundy', 'theme-teal', 
      'theme-slate', 'theme-chocolate', 'theme-indigo', 'theme-crimson', 'theme-charcoal'];
    
    themeClasses.forEach(cls => {
      rootElement.classList.remove(cls);
      bodyElement.classList.remove(cls);
    });
    
    // Appliquer la classe du thème actuel
    if (themeName === 'dark') {
      rootElement.classList.add('dark');
      bodyElement.classList.add('dark');
    } else {
      const themeClass = `theme-${themeName}`;
      rootElement.classList.add(themeClass);
      bodyElement.classList.add(themeClass);
    }
    
    // 2. Déclencher un événement personnalisé pour forcer la mise à jour du thème
    const themeUpdateEvent = new CustomEvent('forceThemeUpdate', {
      detail: { theme: themeName }
    });
    document.dispatchEvent(themeUpdateEvent);
    
    // 3. Forcer un reflow pour s'assurer que les styles sont appliqués
    void document.documentElement.offsetHeight;
    
    // 4. Ajouter un attribut data-theme pour les sélecteurs CSS
    document.documentElement.setAttribute('data-theme', themeName);
  };
  
  const handleClear = () => {
    setPin('');
    setError('');
  };
  
  const handleBack = () => {
    setSelectedEmployee(null);
    setPin('');
    setError('');
  };
  
  const handleCreateDefaultAdmin = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Récupérer le businessId depuis le localStorage
      let businessId = '';
      try {
        const storedBusinessId = localStorage.getItem('businessId');
        if (storedBusinessId) {
          businessId = storedBusinessId;
          console.log('BusinessId récupéré du localStorage:', businessId);
        }
      } catch (e) {
        console.error('Erreur lors de l\'accès au localStorage:', e);
      }
      
      // Si pas de businessId, utiliser 'default'
      if (!businessId) {
        businessId = 'default';
        console.log('Aucun businessId trouvé, utilisation de la valeur par défaut:', businessId);
      }
      
      console.log('Création d\'un administrateur par défaut pour le businessId:', businessId);
      
      // Créer un compte administrateur par défaut
      try {
        // Importer directement le service employé pour éviter les problèmes de types
        const employeeService = await import('../services/employeeService');
        
        // Créer l'administrateur avec les données minimales nécessaires
        const adminData = {
          firstName: 'Admin',
          lastName: 'Principal',
          email: `admin.${businessId}@payesmart.com`,
          role: 'admin' as const,
          pin: '1234',
          isMainAdmin: true,
          active: true,
          businessId: businessId,
          permissions: [] // Les permissions seront ajoutées par le service
        };
        
        console.log('Données de l\'administrateur par défaut:', adminData);
        
        // Ajouter l'administrateur à la base de données
        const createdAdmin = await employeeService.addEmployee(adminData);
        console.log('Administrateur créé avec succès:', createdAdmin);
        
        // Stocker l'information dans le localStorage
        localStorage.setItem('defaultAdminCreated', 'true');
        localStorage.setItem('businessId', businessId);
        
        // Rafraîchir la liste des employés
        const newEmployees = await getActiveEmployees();
        setEmployees(newEmployees as any);
        
        // Mettre à jour l'état
        setShowCreateAdminButton(false);
        setModalMessage(`Un compte administrateur a été créé avec le code PIN 1234 pour l'entreprise ${businessId}.`);
        setShowModal(true);
        
      } catch (err) {
        console.error('Erreur lors de la création de l\'administrateur:', err);
        setError('Erreur lors de la création de l\'administrateur. Veuillez réessayer.');
      }
    } catch (error) {
      console.error('Erreur générale:', error);
      setError('Une erreur s\'est produite. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
  };
  
  // Cette fonction est commentée car elle n'est pas utilisée actuellement
  // mais pourrait être utile pour des fonctionnalités futures
  /*
  const resetDefaultAdmin = () => {
    localStorage.removeItem('defaultAdminCreated');
  };
  */
  
  // Fonction pour se déconnecter
  const handleLogout = async () => {
    try {
      setShowLogoutConfirmation(false);
      
      // Nettoyer toutes les données du magasin avant la déconnexion
      clearStoreData();
      
      // Déconnexion de Firebase
      await logout();
      
      // Réinitialiser l'état local
      setSelectedEmployee(null);
      
      // Recharger la page pour garantir un état propre
      window.location.reload();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirmation(true);
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirmation(false);
  };

  return (
    <div
      className="min-h-screen flex flex-col ps-login-background"
    >
      <div className="flex justify-end p-4">
        <button 
          onClick={handleLogoutClick}
          type="button"
          className="text-gray-300 hover:text-white flex items-center gap-1 text-sm font-medium transition-colors duration-200"
        >
          <Power size={18} />
          Déconnexion
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-start px-6 pb-6 pt-8">
        {!selectedEmployee && (
          <div className="w-full max-w-md mb-8 px-6 py-4 flex flex-col items-center gap-4">
            <div className="flex flex-col items-center gap-2">
              <div className="text-center mt-2 mb-4">
                <h1 className="text-3xl font-bold text-white tracking-wide mb-0 leading-tight">{storeName}</h1>
                <div className="h-1 w-24 bg-gray-400 mx-auto mt-1 rounded-full"></div>
                <p className="text-gray-400 mt-2 text-base font-medium">Système de Gestion de Caisse</p>
              </div>
            </div>
          </div>
        )}
        <div className="rounded-lg shadow-xl w-full max-w-md overflow-hidden text-white ps-login-container">
          {loading ? (
            <div className="p-8 flex flex-col items-center justify-center">
              <Loader2 size={48} className="text-white animate-spin mb-4" />
              <p className="text-gray-400">Chargement des employés...</p>
            </div>
          ) : selectedEmployee ? (
            <div className="p-6">
              <div className="flex items-center mb-3">
                <button 
                  onClick={(e) => {
                    e.preventDefault(); // Empêcher le comportement par défaut
                    handleBack();
                  }}
                  type="button" // Spécifier explicitement que c'est un bouton, pas un submit
                  className="text-gray-400 hover:text-white flex items-center gap-1 text-sm font-medium"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  Retour
                </button>
              </div>

              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full ps-user-avatar mb-3 shadow-md overflow-hidden">
                  {selectedEmployee.avatarUrl ? (
                    <>
                      <img 
                        src={selectedEmployee.avatarUrl} 
                        alt={`${selectedEmployee.firstName} ${selectedEmployee.lastName}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // En cas d'erreur de chargement de l'image, afficher l'icône par défaut
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            const fallbackIcon = parent.querySelector('.fallback-icon');
                            if (fallbackIcon instanceof HTMLElement) {
                              fallbackIcon.style.display = 'block';
                            }
                          }
                        }}
                      />
                      <div className="fallback-icon absolute" style={{display: 'none'}}>
                        <UserCircle size={48} className="text-gray-400" />
                      </div>
                    </>
                  ) : (
                    <UserCircle size={48} className="text-gray-400" />
                  )}
                </div>
                <h2 className="text-2xl font-semibold text-white tracking-wide">{selectedEmployee.firstName} {selectedEmployee.lastName}</h2>
                <div className="bg-[#28292e] rounded-full px-3 py-1 text-xs inline-block mt-2">
                  <p className="text-gray-300">{selectedEmployee.role === 'admin' ? 'Administrateur' : selectedEmployee.role === 'manager' ? 'Manager' : 'Caissier'}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-center text-gray-400 mb-2">Entrez votre code PIN</p>
                <div className="flex justify-center space-x-3 mb-4">
                  {[0, 1, 2, 3].map(i => (
                    <div
                      key={i}
                      className={`w-4 h-4 rounded-md ps-pin-dot ${i < pin.length ? 'ps-pin-dot-filled' : ''} shadow-md transition-all duration-300 ${i < pin.length ? 'scale-110' : 'scale-100'}`}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-gray-400 text-center text-sm font-medium mb-4">{error}</p>
              )}
              
              {loginInProgress && (
                <div className="flex space-x-3 justify-center mb-6">
                  <Loader2 size={24} className="text-white animate-spin mr-2" />
                  <p className="text-gray-400 text-sm">Vérification...</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: '1' },
                  { value: '2' },
                  { value: '3' },
                  { value: '4' },
                  { value: '5' },
                  { value: '6' },
                  { value: '7' },
                  { value: '8' },
                  { value: '9' }
                ].map(item => (
                  <button
                    key={item.value}
                    onClick={(e) => {
                      e.preventDefault(); 
                      handlePinInput(item.value);
                    }}
                    type="button" 
                    className="ps-numpad-button rounded-md p-4 font-medium text-white flex items-center justify-center shadow-sm"
                  >
                    <span className="text-lg font-bold">{item.value}</span>
                  </button>
                ))}
                <button
                  onClick={(e) => {
                    e.preventDefault(); 
                    handleClear();
                  }}
                  type="button"
                  className="ps-numpad-button rounded-md p-4 text-sm font-medium text-white shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault(); 
                    handlePinInput('0');
                  }}
                  type="button"
                  className="ps-numpad-button rounded-lg p-4 font-medium text-white flex items-center justify-center"
                >
                  <span className="text-lg font-bold">0</span>
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault(); 
                    if (pin.length > 0) {
                      setPin(pin.slice(0, -1));
                    }
                  }}
                  type="button"
                  className="ps-numpad-button rounded-lg p-4 text-sm font-medium text-white"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6.707 4.879A3 3 0 018.828 4H15a3 3 0 013 3v6a3 3 0 01-3 3H8.828a3 3 0 01-2.12-.879l-4.415-4.414a1 1 0 010-1.414l4.414-4.414zm4 2.414a1 1 0 00-1.414 1.414L10.586 10l-1.293 1.293a1 1 0 101.414 1.414L12 11.414l1.293 1.293a1 1 0 001.414-1.414L13.414 10l1.293-1.293a1 1 0 00-1.414-1.414L12 8.586l-1.293-1.293z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-center text-white mb-6">Sélectionnez votre profil</h2>
              
              <div style={{maxHeight: '60vh', overflowY: 'auto'}} className="pr-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  {employees.map(employee => (
                    <div 
                      key={employee.id}
                      onClick={async () => {
                        // Utiliser l'utilitaire pour forcer le rafraîchissement du nom du magasin
                        if (employee.businessId) {
                          try {
                            // Nettoyer complètement toutes les données du magasin précédent
                            clearStoreData();
                            
                            // Forcer la récupération du nom du magasin actuel
                            const newStoreName = await forceStoreNameRefresh(employee.businessId);
                            
                            if (newStoreName) {
                              console.log('Nom du magasin actualisé avec succès:', newStoreName);
                              setStoreName(newStoreName);
                            } else {
                              console.error('Impossible de récupérer le nom du magasin pour:', employee.businessId);
                            }
                          } catch (error) {
                            console.error('Erreur lors de la mise à jour du nom du magasin:', error);
                          }
                        }
                        
                        // Sélectionner l'employé
                        setSelectedEmployee(employee);
                      }}
                      className={`ps-user-card rounded-lg p-4 flex flex-col items-center cursor-pointer transition-all duration-200 shadow-sm hover:shadow transform hover:-translate-y-1 ${selectedEmployee && (selectedEmployee as Employee).id === employee.id ? 'selected' : ''}`}
                    >
                      <div className="w-16 h-16 rounded-full ps-user-avatar flex items-center justify-center mb-3 shadow-sm overflow-hidden">
                        {employee.avatarUrl ? (
                          <>
                            <img 
                              src={employee.avatarUrl} 
                              alt={`${employee.firstName} ${employee.lastName}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // En cas d'erreur de chargement de l'image, afficher l'icône par défaut
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                  const fallbackIcon = parent.querySelector('.fallback-icon');
                                  if (fallbackIcon instanceof HTMLElement) {
                                    fallbackIcon.style.display = 'block';
                                  }
                                }
                              }}
                            />
                            <div className="fallback-icon absolute" style={{display: 'none'}}>
                              <UserCircle size={32} className="text-gray-300" />
                            </div>
                          </>
                        ) : (
                          <UserCircle size={32} className="text-gray-300" />
                        )}
                      </div>
                      <h3 className="font-medium text-white text-lg">{employee.firstName}</h3>
                      <p className="text-gray-400 text-sm mt-1">
                        {employee.role === 'admin' ? 'Administrateur' : employee.role === 'manager' ? 'Manager' : 'Caissier'}
                      </p>
                    </div>
                  ))}
                </div>
                
                {showCreateAdminButton && (
                  <div className="col-span-full mt-6 mb-2">
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        handleCreateDefaultAdmin();
                      }}
                      type="button"
                      className="w-full py-3 px-4 ps-btn-primary rounded-lg flex items-center justify-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 01-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Créer un compte administrateur par défaut
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-lg">
            <h3 className="text-xl font-bold mb-4">Information</h3>
            <p className="mb-6">{modalMessage}</p>
            <button
              onClick={handleCloseModal}
              className="bg-[#28292e] hover:bg-[#313236] text-white px-4 py-2 rounded-md font-medium"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
      {showLogoutConfirmation && (
        <ConfirmationModal
          isOpen={showLogoutConfirmation}
          title={
            <div className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Confirmation de déconnexion</span>
            </div>
          }
          message={
            <div>
              <p className="font-medium">{`Vous êtes sur le point de vous déconnecter du compte${selectedEmployee ? ` de ${selectedEmployee.firstName} ${selectedEmployee.lastName}` : ''}.`}</p>
              <p className="text-gray-400 text-sm">Vous serez redirigé vers la page de connexion.</p>
            </div>
          }
          confirmText={
            <div className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Déconnexion</span>
            </div>
          }
          cancelText={
            <div className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Annuler</span>
            </div>
          }
          onConfirm={handleLogout}
          onCancel={handleCancelLogout}
          variant="login"
        />
      )}
    </div>
  );
};

export default EmployeeLogin;
