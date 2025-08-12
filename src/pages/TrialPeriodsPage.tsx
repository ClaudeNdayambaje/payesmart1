import React, { useState, useEffect } from 'react';
import TrialPeriodsManager from '../components/saas/TrialPeriodsManager';
import { saveTrialPeriodsConfig, getTrialPeriodsConfig } from '../services/trialService';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import UserProfileHeader from '../components/saas/UserProfileHeader';

const ADMIN_USERS_COLLECTION = 'adminUsers';

const TrialPeriodsPage: React.FC = () => {
  // États pour l'authentification
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null);
  // État pour la configuration des périodes d'essai
  const [enableTrials, setEnableTrials] = useState(true);
  const [trialConfig, setTrialConfig] = useState<{
    enableTrials: boolean;
    activeTrialId: string;
    trialPeriods: any[];
  } | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Liste des emails autorisés pour le mode démo
  const AUTHORIZED_ADMIN_EMAILS = [
    'admin@payesmart.com',
    'cn@elexium.be', // Ajout de l'utilisateur Claude Ndayambaje
    // Ajoutez d'autres emails d'administrateurs système ici
  ];

  // Vérifier l'état d'authentification au chargement du composant
  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté dans localStorage
    const savedAuth = localStorage.getItem('payesmart_admin_auth');
    if (savedAuth === 'true') {
      setIsAuthenticated(true);
    }
    
    // Écouter les changements d'état d'authentification Firebase
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // L'utilisateur est connecté
        setIsAuthenticated(true);
        localStorage.setItem('payesmart_admin_auth', 'true');
      } else {
        // Vérifier si nous avons une session locale (pour le mode démo)
        const localAuth = localStorage.getItem('payesmart_admin_auth');
        if (localAuth !== 'true') {
          setIsAuthenticated(false);
          localStorage.removeItem('payesmart_admin_auth');
        }
      }
      setLoading(false);
    });
    
    // Nettoyer l'écouteur lors du démontage du composant
    return () => unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Vérifier si l'email existe dans la collection adminUsers
      const adminUsersQuery = query(
        collection(db, ADMIN_USERS_COLLECTION),
        where('email', '==', email.toLowerCase()),
        where('active', '==', true)
      );
      
      const snapshot = await getDocs(adminUsersQuery);
      const isAdminUser = !snapshot.empty;
      
      // Vérifier si l'utilisateur existe dans la collection adminUsers ou est dans la liste des emails autorisés
      if (isAdminUser || AUTHORIZED_ADMIN_EMAILS.includes(email.toLowerCase())) {
        try {
          // Essayer de se connecter avec Firebase Auth
          await signInWithEmailAndPassword(auth, email, password);
          setIsAuthenticated(true);
          localStorage.setItem('payesmart_admin_auth', 'true');
        } catch (authError) {
          // Si l'authentification Firebase échoue, afficher un message d'erreur
          console.error("Erreur d'authentification:", authError);
          throw new Error("Email ou mot de passe incorrect.");
        }
      } else {
        throw new Error("Vous n'êtes pas autorisé à accéder à cette interface d'administration.");
      }
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setIsAuthenticated(false);
      localStorage.removeItem('payesmart_admin_auth');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };



  // État pour les notifications
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Fonction pour afficher une notification temporaire
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000); // Disparaît après 5 secondes
  };
  
  // Charger la configuration des périodes d'essai depuis Firestore
  useEffect(() => {
    const loadTrialConfig = async () => {
      if (!isAuthenticated) return;
      
      try {
        setLoadingConfig(true);
        const config = await getTrialPeriodsConfig();
        if (config) {
          console.log('Configuration chargée depuis Firestore:', config);
          setTrialConfig(config);
          setEnableTrials(config.enableTrials);
          
          // Sauvegarder dans localStorage pour accès rapide
          localStorage.setItem('trialPeriodsConfig', JSON.stringify(config));
          localStorage.setItem('activeTrialId', config.activeTrialId);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la configuration:', error);
        showNotification('Erreur lors du chargement de la configuration. Utilisation des valeurs par défaut.', 'error');
      } finally {
        setLoadingConfig(false);
      }
    };
    
    loadTrialConfig();
  }, [isAuthenticated]);
  
  // Fonction pour sauvegarder la configuration
  const handleSaveConfiguration = async (config: any) => {
    try {
      // Désactiver temporairement le bouton pendant la sauvegarde
      const saveButton = document.querySelector('.save-config-button') as HTMLButtonElement;
      if (saveButton) {
        saveButton.disabled = true;
        saveButton.classList.add('opacity-70');
      }
      
      // Nettoyer la configuration pour éviter les valeurs undefined
      const sanitizedConfig = {
        enableTrials: Boolean(config.enableTrials),
        activeTrialId: config.activeTrialId || '',
        trialPeriods: Array.isArray(config.trialPeriods) ? config.trialPeriods.map((period: any) => ({
          id: period.id || '',
          name: period.name || '',
          days: typeof period.days === 'number' ? period.days : 0,
          minutes: typeof period.minutes === 'number' ? period.minutes : 0,
          isActive: Boolean(period.isActive),
          createdAt: period.createdAt instanceof Date ? period.createdAt : new Date(),
          lastModified: period.lastModified instanceof Date ? period.lastModified : new Date(),
          description: period.description || ''
        })) : []
      };
      
      console.log('Configuration nettoyée à sauvegarder:', sanitizedConfig);
      
      // Sauvegarder dans Firestore
      await saveTrialPeriodsConfig(sanitizedConfig);
      
      // Sauvegarder également dans le localStorage pour plus de sécurité
      localStorage.setItem('trialPeriodsConfig', JSON.stringify(sanitizedConfig));
      
      console.log('Configuration des périodes d\'essai sauvegardée avec succès');
      showNotification('Configuration des périodes d\'essai sauvegardée avec succès');
      
      // Réactiver le bouton
      if (saveButton) {
        setTimeout(() => {
          saveButton.disabled = false;
          saveButton.classList.remove('opacity-70');
        }, 1000);
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la configuration:', error);
      showNotification('Erreur lors de la sauvegarde de la configuration. Veuillez réessayer.', 'error');
      
      // Réactiver le bouton en cas d'erreur
      const saveButton = document.querySelector('.save-config-button') as HTMLButtonElement;
      if (saveButton) {
        saveButton.disabled = false;
        saveButton.classList.remove('opacity-70');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement de PayeSmart Administration...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full border border-gray-200">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="PayeSmart Logo" className="h-12" />
          </div>
          <h1 className="text-2xl font-bold text-center mb-6 text-indigo-800">PayeSmart Admin</h1>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="admin@payesmart.com"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connexion en cours...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Barre latérale fixe */}
      <div className="w-56 bg-gradient-to-b from-indigo-900 to-indigo-800 text-white min-h-screen shadow-lg fixed left-0 top-0 h-full z-10 overflow-y-auto flex flex-col">
        <div className="flex-grow">
          <div className="p-3 border-b border-indigo-800 flex flex-col items-center">
            <h1 className="text-lg font-bold">PayeSmart</h1>
            <p className="text-sm text-indigo-300">Administration</p>
          </div>
          
          <nav className="mt-4">
            <div className="px-3 mb-1 text-sm font-semibold text-indigo-400 uppercase tracking-wider">
              Principal
            </div>
            <a 
              href="/#/admin/saas" 
              className="group relative w-full flex items-center px-3 py-3 text-base font-medium rounded-md transition-all duration-300 bg-gradient-to-r from-indigo-900/50 to-indigo-900/30 text-indigo-100 hover:from-indigo-700 hover:to-indigo-800 hover:text-white"
              onClick={() => localStorage.setItem('payesmart_admin_tab', 'dashboard')}
            >
              {/* Effet de brillance au survol */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <svg className="w-5 h-5 mr-2 text-indigo-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"></path>
              </svg>
              Tableau de bord
            </a>
          </nav>
          
          <nav className="mt-4">
            <div className="px-3 mb-1 text-sm font-semibold text-indigo-400 uppercase tracking-wider">
              Gestion
            </div>
            <a 
              href="/#/admin/saas" 
              className="group relative w-full flex items-center px-3 py-3 text-base font-medium rounded-md transition-all duration-300 bg-gradient-to-r from-indigo-900/50 to-indigo-900/30 text-indigo-100 hover:from-indigo-700 hover:to-indigo-800 hover:text-white"
              onClick={() => localStorage.setItem('payesmart_admin_tab', 'clients')}
            >
              {/* Effet de brillance au survol */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <svg className="w-5 h-5 mr-2 text-indigo-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              Clients
            </a>

            <a 
              href="/#/admin/trial-periods" 
              className="group relative w-full flex items-center px-3 py-3 text-base font-medium rounded-md transition-all duration-300 bg-gradient-to-r from-indigo-700 to-indigo-800 text-white shadow-md"
            >
              {/* Effet de brillance au survol */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <svg className="w-5 h-5 mr-2 text-indigo-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Périodes d'essai
            </a>
            
            <a 
              href="/#/admin/trial-clients" 
              className="group relative w-full flex items-center px-3 py-3 text-base font-medium rounded-md transition-all duration-300 bg-gradient-to-r from-indigo-900/50 to-indigo-900/30 text-indigo-100 hover:from-indigo-700 hover:to-indigo-800 hover:text-white"
            >
              {/* Effet de brillance au survol */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <svg className="w-5 h-5 mr-2 text-indigo-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
              Clients en essai
            </a>
            <a 
              href="/#/admin/saas" 
              className="group relative w-full flex items-center px-3 py-3 text-base font-medium rounded-md transition-all duration-300 bg-gradient-to-r from-indigo-900/50 to-indigo-900/30 text-indigo-100 hover:from-indigo-700 hover:to-indigo-800 hover:text-white"
              onClick={() => localStorage.setItem('payesmart_admin_tab', 'subscriptions')}
            >
              {/* Effet de brillance au survol */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <svg className="w-5 h-5 mr-2 text-indigo-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              Abonnements
            </a>
            <a 
              href="/#/admin/saas" 
              className="group relative w-full flex items-center px-3 py-3 text-base font-medium rounded-md transition-all duration-300 bg-gradient-to-r from-indigo-900/50 to-indigo-900/30 text-indigo-100 hover:from-indigo-700 hover:to-indigo-800 hover:text-white"
              onClick={() => localStorage.setItem('payesmart_admin_tab', 'payments')}
            >
              {/* Effet de brillance au survol */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <svg className="w-5 h-5 mr-2 text-indigo-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
              </svg>
              Paiements
            </a>
            <a 
              href="/#/admin/saas" 
              className="group relative w-full flex items-center px-3 py-3 text-base font-medium rounded-md transition-all duration-300 bg-gradient-to-r from-indigo-900/50 to-indigo-900/30 text-indigo-100 hover:from-indigo-700 hover:to-indigo-800 hover:text-white"
              onClick={() => localStorage.setItem('payesmart_admin_tab', 'plans')}
            >
              {/* Effet de brillance au survol */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <svg className="w-5 h-5 mr-2 text-indigo-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
              </svg>
              Plans
            </a>
          </nav>
          
          <nav className="mt-4">
            <div className="px-3 mb-1 text-sm font-semibold text-indigo-400 uppercase tracking-wider">
              Administration
            </div>
            <a 
              href="/#/admin/saas" 
              className="group relative w-full flex items-center px-3 py-3 text-base font-medium rounded-md transition-all duration-300 bg-gradient-to-r from-indigo-900/50 to-indigo-900/30 text-indigo-100 hover:from-indigo-700 hover:to-indigo-800 hover:text-white"
              onClick={() => localStorage.setItem('payesmart_admin_tab', 'users')}
            >
              {/* Effet de brillance au survol */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <svg className="w-5 h-5 mr-2 text-indigo-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
              Utilisateurs
            </a>
          </nav>
        </div>
        
        {/* Profil de l'utilisateur connecté */}
        <div className="mt-auto border-t border-indigo-800/30">
          <div className="p-3">
            <UserProfileHeader className="text-white mb-3" />
            
            {/* Bouton de déconnexion */}
            <button 
              onClick={handleLogout}
              className="group relative flex items-center justify-center gap-2 px-3 py-2 mt-2 bg-gradient-to-r from-indigo-700 to-indigo-800 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-md transition-all duration-300 w-full text-sm shadow-md overflow-hidden"
              title="Déconnexion"
            >
              {/* Effet de brillance au survol */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              {/* Contenu du bouton */}
              <svg className="w-4 h-4 text-indigo-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Contenu principal avec marge à gauche pour compenser la barre latérale fixe */}
      <div className="ml-56 flex-1 p-8">
        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transition-all duration-300 ${notification.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
            <div className="flex items-center">
              {notification.type === 'success' ? (
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              ) : (
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              )}
              {notification.message}
            </div>
          </div>
        )}
        
        {/* Contenu principal */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* En-tête avec titre, recherche et bouton d'ajout */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-2 md:w-auto w-full">
                <h2 className="text-xl font-bold text-gray-800 whitespace-nowrap">Gestion des Périodes d'essai</h2>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  8
                </span>
              </div>
              
              {/* Le bouton pour mettre à jour les périodes d'essai a été supprimé */}
              
              <div className="flex items-center gap-3 flex-1 md:flex-none">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableTrials"
                    checked={enableTrials}
                    onChange={(e) => setEnableTrials(e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="enableTrials" className="ml-2 text-sm text-gray-700">
                    Activer les périodes d'essai
                  </label>
                </div>
                
                <a 
                  href="/#/admin/trial-reports"
                  className="bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 flex items-center shadow-sm whitespace-nowrap"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                  </svg>
                  Voir les rapports
                </a>
                
                <button 
                  onClick={() => {
                    const config = {
                      enableTrials: enableTrials,
                      activeTrialId: localStorage.getItem('activeTrialId') || '1',
                      trialPeriods: JSON.parse(localStorage.getItem('trialPeriodsConfig') || '[]').trialPeriods || []
                    };
                    handleSaveConfiguration(config);
                  }}
                  className="bg-[color:var(--color-primary)] text-white hover:bg-[color:var(--color-primary-dark)] px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 flex items-center shadow-sm whitespace-nowrap"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
          
          {loadingConfig ? (
            <div className="p-6 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[color:var(--color-primary)]"></div>
              <p className="mt-2 text-gray-600">Chargement de la configuration...</p>
            </div>
          ) : (
            <TrialPeriodsManager 
              onSaveConfiguration={handleSaveConfiguration} 
              enableTrials={enableTrials} 
              initialConfig={trialConfig ? {
                enableTrials: trialConfig.enableTrials,
                activeTrialId: trialConfig.activeTrialId,
                trialPeriods: trialConfig.trialPeriods
              } : undefined}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TrialPeriodsPage;
