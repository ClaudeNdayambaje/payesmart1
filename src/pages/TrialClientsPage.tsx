import React, { useState, useEffect } from 'react';
import ModernTrialClientsList from '../components/saas/ModernTrialClientsList';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import UserProfileHeader from '../components/saas/UserProfileHeader';
import { Client } from '../types/saas';

const ADMIN_USERS_COLLECTION = 'adminUsers';

const TrialClientsPage: React.FC = () => {
  // États pour l'authentification
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null);

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
  const [notification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  // État pour la recherche et l'actualisation
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fonction pour gérer l'actualisation
  const handleRefresh = () => {
    // Actualisation simple sans état
    window.location.reload();
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
              className="w-full flex items-center px-3 py-3 text-base font-medium rounded-md transition-all duration-200 text-indigo-100 hover:bg-indigo-800 hover:text-white"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
              className="w-full flex items-center px-3 py-3 text-base font-medium rounded-md transition-all duration-200 text-indigo-100 hover:bg-indigo-800 hover:text-white"
              onClick={() => localStorage.setItem('payesmart_admin_tab', 'clients')}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              Clients
            </a>

            {/* Le lien vers Périodes d'essai a été supprimé et déplacé vers un bouton dans la page */}
            
            <a 
              href="/#/admin/trial-clients" 
              className="group relative w-full flex items-center px-3 py-3 text-base font-medium rounded-md transition-all duration-300 bg-gradient-to-r from-indigo-700 to-indigo-800 text-white shadow-md"
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
        <div className="mt-auto p-3 border-t border-indigo-800">
          <div className="flex flex-col items-center">
            <UserProfileHeader className="text-white" />
            
            {/* Bouton de déconnexion */}
            <button 
              onClick={handleLogout}
              className="group relative flex items-center justify-center gap-2 px-3 py-2 mt-2 bg-gradient-to-r from-indigo-700 to-indigo-800 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-md transition-all duration-300 w-full text-sm shadow-md overflow-hidden"
              title="Déconnexion"
            >
              {/* Effet de brillance au survol */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <svg className="w-4 h-4 text-indigo-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Contenu principal avec marge à gauche pour compenser la barre latérale fixe */}
      <div className="ml-56 flex-1 p-8 relative">
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
        

        
        {/* Contenu de la page */}
        <div className="flex-1 overflow-auto">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {/* En-tête avec titre, recherche et boutons de filtrage */}
            <div className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-2">
                <div className="flex items-center space-x-2 md:w-auto w-full">
                  <h2 className="text-xl font-bold text-gray-800 whitespace-nowrap">Clients en période d'essai</h2>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {searchTerm ? 'Recherche active' : 'Tous les clients'}
                  </span>
                </div>
                
                <div className="flex items-center gap-3 flex-1 md:flex-none md:max-w-md">
                  <div className="relative w-full md:w-64">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Rechercher un client..."
                      className="w-full pl-7 pr-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <a 
                    href="/#/admin/trial-periods"
                    className="bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 flex items-center shadow-sm whitespace-nowrap"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Périodes d'essai
                  </a>
                  
                  <button 
                    onClick={handleRefresh}
                    className="bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 flex items-center shadow-sm whitespace-nowrap"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                    </svg>
                    Actualiser
                  </button>
                </div>
              </div>
            </div>
            
            {/* Composant de liste des clients en essai */}
            <ModernTrialClientsList 
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onRefresh={handleRefresh}
              onViewDetails={(client: Client) => {
                console.log('Détails du client:', client);
                // Vous pouvez implémenter une vue détaillée ici si nécessaire
              }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialClientsPage;
