import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import ModernClientsList from '../components/saas/ModernClientsList';
import ModernSubscriptionsList from '../components/saas/ModernSubscriptionsList';
import ModernPaymentsList from '../components/saas/ModernPaymentsList';
import SubscriptionForm from '../components/saas/SubscriptionForm';
import ClientForm from '../components/saas/ClientForm';
import SaasDashboard from '../components/saas/SaasDashboard';
import UserProfileHeader from '../components/saas/UserProfileHeader';
import EnhancedTrialConfigManager from '../components/saas/EnhancedTrialConfigManager';
import TrialPeriodsManager from '../components/saas/TrialPeriodsManager';
import AdminUserManager from '../components/saas/AdminUserManager';
import ModernSubscriptionPlansManager from '../components/saas/ModernSubscriptionPlansManager';
import MarketingProductsManager from '../components/saas/MarketingProductsManager';
import AccessoriesMarketingManager from '../components/saas/AccessoriesMarketingManager';
import { Client, Subscription } from '../types/saas';
import { addSubscription, updateSubscription, cancelSubscription } from '../services/subscriptionService';
import { saveTrialPeriodsConfig } from '../services/trialService';
import ConfirmationModal from '../components/ui/ConfirmationModal';
// Les icônes sont maintenant importées directement dans les composants qui les utilisent

const ADMIN_USERS_COLLECTION = 'adminUsers';

const SaasAdmin: React.FC = () => {
  // États pour l'authentification
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState<string | null>(null);
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  
  // États pour l'interface d'administration
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingClient, setEditingClient] = useState<Client | undefined>(undefined);
  const [showClientForm, setShowClientForm] = useState(false);
  // État pour rafraîchir la liste des clients
  const [refreshClients, setRefreshClients] = useState(0);
  // État pour gérer les détails des clients (future amélioration)
  
  // États pour la gestion des abonnements
  const [editingSubscription, setEditingSubscription] = useState<Subscription | undefined>(undefined);
  const [showSubscriptionForm, setShowSubscriptionForm] = useState(false);
  const [refreshSubscriptions, setRefreshSubscriptions] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Fonctions pour la gestion des abonnements
  const handleEditSubscription = (subscription: Subscription) => {
    setEditingSubscription(subscription);
    setShowSubscriptionForm(true);
  };

  const handleAddNewSubscription = () => {
    setEditingSubscription(undefined);
    setShowSubscriptionForm(true);
  };

  const handleCloseSubscriptionForm = () => {
    setShowSubscriptionForm(false);
    setEditingSubscription(undefined);
  };

  const handleSubscriptionSaved = async (subscriptionData: Omit<Subscription, 'id'>) => {
    try {
      setErrorMessage(null);
      
      if (editingSubscription) {
        // Mise à jour d'un abonnement existant
        await updateSubscription(editingSubscription.id, subscriptionData);
      } else {
        // Ajout d'un nouvel abonnement
        await addSubscription(subscriptionData);
      }
      
      setShowSubscriptionForm(false);
      setEditingSubscription(undefined);
      setRefreshSubscriptions(prev => prev + 1);
    } catch (error: any) {
      console.error('Erreur lors de l\'enregistrement de l\'abonnement:', error);
      setErrorMessage(error.message || 'Une erreur est survenue lors de l\'enregistrement de l\'abonnement');
      // Nous n'allons pas fermer le formulaire en cas d'erreur pour que l'utilisateur puisse corriger le problème
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    try {
      await cancelSubscription(subscriptionId);
      setRefreshSubscriptions(prev => prev + 1);
    } catch (error) {
      console.error('Erreur lors de l\'annulation de l\'abonnement:', error);
    }
  };
  
  // Liste des emails autorisés pour le mode démo
  const AUTHORIZED_ADMIN_EMAILS = [
    'admin@payesmart.com',
    'cn@elexium.be', // Ajout de l'utilisateur Claude Ndayambaje
    // Ajoutez d'autres emails d'administrateurs système ici
  ];

  // Vérifier l'état d'authentification au chargement du composant
  useEffect(() => {
    // Récupérer l'onglet actif depuis localStorage (uniquement pour la préférence UI)
    const savedTab = localStorage.getItem('payesmart_admin_tab');
    if (savedTab) {
      // S'assurer que l'onglet est valide avant de l'activer
      const validTabs = ['dashboard', 'clients', 'subscriptions', 'payments', 'plans', 'users', 'accessories', 'products', 'trial-config', 'trial-periods'];
      if (validTabs.includes(savedTab)) {
        setActiveTab(savedTab);
      } else {
        // Si l'onglet n'est pas valide, définir l'onglet par défaut
        setActiveTab('dashboard');
        localStorage.setItem('payesmart_admin_tab', 'dashboard');
      }
    } else {
      // Si aucun onglet n'est enregistré, définir l'onglet par défaut
      setActiveTab('dashboard');
      localStorage.setItem('payesmart_admin_tab', 'dashboard');
    }
    
    // Écouter les changements d'état d'authentification Firebase
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // L'utilisateur est connecté
        setIsAuthenticated(true);
        // Stocker l'email de l'utilisateur pour l'affichage dans l'interface
        if (user.email) {
          setEmail(user.email);
        }
      } else {
        // L'utilisateur n'est pas connecté
        setIsAuthenticated(false);
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
        // Se connecter avec Firebase Auth
        await signInWithEmailAndPassword(auth, email, password);
        setIsAuthenticated(true);
      } else {
        throw new Error("Vous n'êtes pas autorisé à accéder à cette interface d'administration.");
      }
    } catch (error: any) {
      console.error('Erreur de connexion:', error);
      setError(error.message || "Email ou mot de passe incorrect.");
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  // Afficher la boîte de dialogue de confirmation de déconnexion
  const handleLogoutClick = () => {
    setShowLogoutConfirmation(true);
  };

  // Annuler la déconnexion
  const handleCancelLogout = () => {
    setShowLogoutConfirmation(false);
  };

  // Confirmer et exécuter la déconnexion
  const handleConfirmLogout = async () => {
    setShowLogoutConfirmation(false);
    
    try {
      // Conserver uniquement les préférences UI dans localStorage
      // mais supprimer tout ce qui est lié à l'authentification
      
      // Placer un flag dans localStorage pour indiquer une déconnexion admin volontaire
      // Ce flag sera vérifié par les écouteurs d'authentification
      localStorage.setItem('admin_logout_in_progress', 'true');
      
      // Récupérer la partie de l'URL avant le hash
      const baseUrl = window.location.href.split('#')[0];
      
      // Préparer la redirection avec l'URL complète
      const loginUrl = baseUrl + '#/admin/login';
      
      // Déconnexion de Firebase
      await signOut(auth);
      
      // Mettre à jour l'état local
      setIsAuthenticated(false);
      
      // Redirection vers la page de connexion avec un paramètre pour éviter les redirections en boucle
      window.location.replace(loginUrl + '?source=admin_logout&t=' + Date.now());
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // En cas d'erreur, tout de même rediriger vers la page de connexion avec l'URL complète
      const baseUrl = window.location.href.split('#')[0];
      localStorage.removeItem('admin_logout_in_progress');
      window.location.replace(baseUrl + '#/admin/login');
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connexion en cours...
                </div>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Les hooks ont été déplacés en haut de la fonction pour respecter les règles des hooks React

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setShowClientForm(true);
  };

  const handleAddNewClient = () => {
    setEditingClient(undefined);
    setShowClientForm(true);
  };

  const handleCloseClientForm = () => {
    setShowClientForm(false);
    setEditingClient(undefined);
  };

  const handleClientSaved = (clientData: Omit<Client, 'id'>) => {
    try {
      console.log('Client sauvegardé:', clientData);
      
      // Fermer le formulaire
      setShowClientForm(false);
      setEditingClient(undefined);
      
      // Rafraîchir la liste des clients
      setRefreshClients(prev => prev + 1);
      
      // Forcer une mise à jour du contexte pour rafraîchir tous les composants
      setTimeout(() => {
        // Un petit délai pour s'assurer que Firestore a bien terminé
        setRefreshClients(prev => prev + 1);
      }, 500);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du client:', error);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50 overflow-hidden">
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
            <button
              className={`group relative w-full flex items-center px-3 py-3 text-base font-medium rounded-md transition-all duration-300 ${activeTab === 'dashboard' ? 'bg-gradient-to-r from-indigo-700 to-indigo-800 text-white shadow-md' : 'bg-gradient-to-r from-indigo-900/50 to-indigo-900/30 text-indigo-100 hover:from-indigo-700 hover:to-indigo-800 hover:text-white'}`}
              onClick={() => {
                // Forcer la mise à jour immédiate de l'onglet actif
                setActiveTab('dashboard');
                // Enregistrer l'onglet actif dans localStorage
                localStorage.setItem('payesmart_admin_tab', 'dashboard');
                // Forcer un reflow pour s'assurer que le composant est correctement mis à jour
                setTimeout(() => {
                  if (activeTab !== 'dashboard') {
                    setActiveTab('dashboard');
                  }
                }, 0);
              }}
            >
              {/* Effet de brillance au survol */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <svg className="w-5 h-5 mr-2 text-indigo-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"></path>
              </svg>
              Tableau de bord
            </button>
            
            <div className="px-3 mt-4 mb-1 text-sm font-semibold text-indigo-400 uppercase tracking-wider">
              Gestion
            </div>
            <button
              className={`group relative w-full flex items-center px-3 py-3 text-base font-medium rounded-md transition-all duration-300 ${activeTab === 'clients' ? 'bg-gradient-to-r from-indigo-700 to-indigo-800 text-white shadow-md' : 'bg-gradient-to-r from-indigo-900/50 to-indigo-900/30 text-indigo-100 hover:from-indigo-700 hover:to-indigo-800 hover:text-white'}`}
              onClick={() => {
                setActiveTab('clients');
                localStorage.setItem('payesmart_admin_tab', 'clients');
              }}
            >
              {/* Effet de brillance au survol */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <svg className="w-5 h-5 mr-2 text-indigo-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              Clients
            </button>
            {/* Le lien vers Périodes d'essai a été supprimé et déplacé vers la page Clients en essai */}
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
            <button
              className={`group relative w-full flex items-center px-3 py-3 text-base font-medium rounded-md transition-all duration-300 ${activeTab === 'subscriptions' ? 'bg-gradient-to-r from-indigo-700 to-indigo-800 text-white shadow-md' : 'bg-gradient-to-r from-indigo-900/50 to-indigo-900/30 text-indigo-100 hover:from-indigo-700 hover:to-indigo-800 hover:text-white'}`}
              onClick={() => {
                setActiveTab('subscriptions');
                localStorage.setItem('payesmart_admin_tab', 'subscriptions');
              }}
            >
              {/* Effet de brillance au survol */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <svg className="w-5 h-5 mr-2 text-indigo-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              Abonnements
            </button>
            <button
              className={`group relative w-full flex items-center px-3 py-3 text-base font-medium rounded-md transition-all duration-300 ${activeTab === 'payments' ? 'bg-gradient-to-r from-indigo-700 to-indigo-800 text-white shadow-md' : 'bg-gradient-to-r from-indigo-900/50 to-indigo-900/30 text-indigo-100 hover:from-indigo-700 hover:to-indigo-800 hover:text-white'}`}
              onClick={() => {
                setActiveTab('payments');
                localStorage.setItem('payesmart_admin_tab', 'payments');
              }}
            >
              {/* Effet de brillance au survol */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <svg className="w-5 h-5 mr-2 text-indigo-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
              </svg>
              Paiements
            </button>
            <button
              className={`group relative w-full flex items-center px-3 py-3 text-base font-medium rounded-md transition-all duration-300 ${activeTab === 'plans' ? 'bg-gradient-to-r from-indigo-700 to-indigo-800 text-white shadow-md' : 'bg-gradient-to-r from-indigo-900/50 to-indigo-900/30 text-indigo-100 hover:from-indigo-700 hover:to-indigo-800 hover:text-white'}`}
              onClick={() => {
                setActiveTab('plans');
                localStorage.setItem('payesmart_admin_tab', 'plans');
              }}
            >
              {/* Effet de brillance au survol */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <svg className="w-5 h-5 mr-2 text-indigo-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
              </svg>
              Plans
            </button>
            <button
              className={`group relative w-full flex items-center px-3 py-3 text-base font-medium rounded-md transition-all duration-300 ${activeTab === 'products' ? 'bg-gradient-to-r from-indigo-700 to-indigo-800 text-white shadow-md' : 'bg-gradient-to-r from-indigo-900/50 to-indigo-900/30 text-indigo-100 hover:from-indigo-700 hover:to-indigo-800 hover:text-white'}`}
              onClick={() => {
                setActiveTab('products');
                localStorage.setItem('payesmart_admin_tab', 'products');
              }}
            >
              {/* Effet de brillance au survol */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <svg className="w-5 h-5 mr-2 text-indigo-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8-4-8 4"></path>
              </svg>
              Produits Marketing
            </button>
            <button
              className={`group relative w-full flex items-center px-3 py-3 text-base font-medium rounded-md transition-all duration-300 ${activeTab === 'accessories' ? 'bg-gradient-to-r from-indigo-700 to-indigo-800 text-white shadow-md' : 'bg-gradient-to-r from-indigo-900/50 to-indigo-900/30 text-indigo-100 hover:from-indigo-700 hover:to-indigo-800 hover:text-white'}`}
              onClick={() => {
                setActiveTab('accessories');
                localStorage.setItem('payesmart_admin_tab', 'accessories');
              }}
            >
              {/* Effet de brillance au survol */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <svg className="w-5 h-5 mr-2 text-indigo-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
              </svg>
              Accessoires
            </button>
            <div className="px-3 mt-4 mb-1 text-sm font-semibold text-indigo-400 uppercase tracking-wider">
              Administration
            </div>
            <button
              className={`group relative w-full flex items-center px-3 py-3 text-base font-medium rounded-md transition-all duration-300 ${activeTab === 'users' ? 'bg-gradient-to-r from-indigo-700 to-indigo-800 text-white shadow-md' : 'bg-gradient-to-r from-indigo-900/50 to-indigo-900/30 text-indigo-100 hover:from-indigo-700 hover:to-indigo-800 hover:text-white'}`}
              onClick={() => {
                setActiveTab('users');
                localStorage.setItem('payesmart_admin_tab', 'users');
              }}
            >
              {/* Effet de brillance au survol */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <svg className="w-5 h-5 mr-2 text-indigo-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
              Utilisateurs
            </button>
          </nav>
        </div>
        
        {/* Profil de l'utilisateur connecté */}
        <div className="mt-auto border-t border-indigo-800/30">
          <div className="p-3">
            <UserProfileHeader className="text-white mb-3" />
            
            {/* Bouton de déconnexion */}
            <button 
              onClick={handleLogoutClick}
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
        {/* Contenu basé sur l'onglet actif */}
        {activeTab === 'dashboard' && (
          <SaasDashboard />
        )}
        
        {activeTab === 'clients' && !showClientForm && (
          <ModernClientsList 
            onEditClient={(client) => {
              setEditingClient(client);
              setShowClientForm(true);
            }}
            onAddNewClient={handleAddNewClient}
            onViewDetails={(client) => console.log('Détails client essai:', client)}
            refreshTrigger={refreshClients} // Ajout du déclencheur de rafraîchissement
          />
        )}

        {activeTab === 'trial-clients' && (
          <ModernClientsList 
            onViewDetails={(client) => console.log('Voir détails client test:', client)}
            onEditClient={handleEditClient}
            onAddNewClient={handleAddNewClient}
            refreshTrigger={refreshClients}
          />
        )}
        
        {/* Formulaire client */}
        {showClientForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <ClientForm
                client={editingClient}
                onSave={handleClientSaved}
                onClose={handleCloseClientForm}
              />
            </div>
          </div>
        )}
        
        {activeTab === 'subscriptions' && (
          <>
            <ModernSubscriptionsList 
              onEditSubscription={handleEditSubscription}
              onAddSubscription={handleAddNewSubscription}
              onCancelSubscription={handleCancelSubscription}
              refreshTrigger={refreshSubscriptions}
            />
            
            {/* Formulaire d'abonnement */}
            {showSubscriptionForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-3xl mx-auto">
                  {errorMessage && (
                    <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-red-700">
                            {errorMessage}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  <SubscriptionForm
                    subscription={editingSubscription}
                    onSave={handleSubscriptionSaved}
                    onCancel={handleCloseSubscriptionForm}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'payments' && (
          <ModernPaymentsList 
            onViewDetails={(payment: any) => console.log('Voir détails:', payment)}
            onProcessPayment={(payment: any) => console.log('Traiter paiement:', payment)}
            onRefundPayment={(paymentId: string) => console.log('Rembourser paiement:', paymentId)}
            refreshTrigger={refreshSubscriptions}
          />
        )}

        {activeTab === 'plans' && (
          <ModernSubscriptionPlansManager />
        )}

        {activeTab === 'users' && (
          <AdminUserManager />
        )}
        
        {activeTab === 'trial-config' && (
          <EnhancedTrialConfigManager />
        )}
        
        {activeTab === 'trial-periods' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <TrialPeriodsManager onSaveConfiguration={async (config: any) => {
              try {
                await saveTrialPeriodsConfig(config);
                console.log('Configuration des périodes d\'essai sauvegardée avec succès');
              } catch (error) {
                console.error('Erreur lors de la sauvegarde de la configuration:', error);
              }
            }} />
          </div>
        )}

        {activeTab === 'products' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Gestion des Produits Marketing</h2>
            <MarketingProductsManager />
          </div>
        )}
        
        {activeTab === 'accessories' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Gestion des Accessoires Marketing</h2>
            <AccessoriesMarketingManager />
          </div>
        )}
      </div>

      {/* Boîte de dialogue de confirmation de déconnexion */}
      {showLogoutConfirmation && (
        <ConfirmationModal
          isOpen={showLogoutConfirmation}
          title="Confirmation de déconnexion"
          message="Souhaitez-vous vous déconnecter de l'application d'administration PayeSmart ?"
          confirmText="Déconnexion"
          cancelText="Annuler"
          onConfirm={handleConfirmLogout}
          onCancel={handleCancelLogout}
        />
      )}
    </div>
  );
};

export default SaasAdmin;
