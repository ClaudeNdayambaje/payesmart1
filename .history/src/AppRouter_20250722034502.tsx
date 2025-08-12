import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ThemePersistence from './components/ThemePersistence';
import ClientAuth from './pages/ClientAuth';
import SimpleAuth from './pages/SimpleAuth';
import ProtectedRoute from './components/client/ProtectedRoute';
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute';
import SaasAdmin from './pages/SaasAdmin';
import AdminLogin from './pages/AdminLogin';
import TrialPeriodsPage from './pages/TrialPeriodsPage';
import TrialClientsPage from './pages/TrialClientsPage';
import TrialEfficiencyReportPage from './pages/TrialEfficiencyReportPage';
import FirebaseChecker from './pages/FirebaseChecker';
import RepairSubscriptionsPage from './pages/RepairSubscriptionsPage';
import CheckoutSuccessPage from './pages/CheckoutSuccessPage';
import CheckoutCanceledPage from './pages/CheckoutCanceledPage';
import SubscriptionPlansPage from './pages/SubscriptionPlansPage';
import SubscriptionCheckoutPage from './pages/SubscriptionCheckoutPage';
import AuthDebug from './pages/AuthDebug';
import { StripeProvider } from './contexts/StripeContext';
// Import supprimés pour éviter les erreurs de build

// Import du composant App sans utiliser export default pour éviter les problèmes TypeScript
// @ts-ignore
import * as AppModule from './App';
const App = AppModule.default;

// Composant pour afficher le site marketing local
const MarketingSiteRedirect: React.FC = () => {
  useEffect(() => {
    // Rediriger vers le site marketing local dans le dossier public
    // Utiliser un chemin relatif pour éviter les problèmes sur Netlify
    window.location.href = './marketing/index.html';
  }, []);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <p className="text-gray-600">Chargement du site marketing...</p>
    </div>
  );
};

// Composant pour redirection conditionnelle basée sur l'URL
const ConditionalRedirect: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  console.log('ConditionalRedirect - URL actuelle:', window.location.href);
  console.log('ConditionalRedirect - Chemin:', location.pathname);
  
  // Vérifier si l'utilisateur vient d'une déconnexion admin
  const source = searchParams.get('source');
  const adminLogoutInProgress = localStorage.getItem('admin_logout_in_progress') === 'true';
  
  console.log('ConditionalRedirect - Source:', source);
  console.log('ConditionalRedirect - Admin logout en cours:', adminLogoutInProgress);
  
  // Si l'URL contient "/admin", rediriger vers la page de connexion admin
  if (location.pathname.includes('/admin')) {
    console.log('ConditionalRedirect - Redirection vers /admin/login');
    return <Navigate to="/admin/login" replace />;
  }
  
  // Si une déconnexion admin est en cours ou si le paramètre source=admin_logout est présent, ne pas rediriger
  if (source === 'admin_logout' || adminLogoutInProgress) {
    console.log('ConditionalRedirect - BLOCAGE de la redirection vers /auth après déconnexion admin');
    
    // On reste sur la page actuelle mais on supprime les paramètres d'URL
    // C'est une solution de dernier recours - la page devrait être /admin/login mais on vérifie
    if (!location.pathname.includes('/admin/login')) {
      console.log('ConditionalRedirect - Forçage vers /admin/login');
      return <Navigate to="/admin/login" replace />;
    }
    
    return null; // Ne pas rediriger, rester sur la page actuelle
  }
  
  // Dans tous les autres cas, rediriger vers l'authentification client
  console.log('ConditionalRedirect - Redirection vers /auth');
  return <Navigate to="/auth" replace />;
};

// Fonction pour vérifier si on est dans un contexte de déconnexion admin
const isAdminLogoutContext = () => {
  const adminLogout = localStorage.getItem('admin_logout_in_progress') === 'true';
  const searchParams = new URLSearchParams(window.location.search);
  const adminLogoutParam = searchParams.get('admin_logout') === 'true';
  const sourceParam = searchParams.get('source') === 'admin_logout';
  
  return adminLogout || adminLogoutParam || sourceParam;
};

// Composant principal de routage
const AppRouter: React.FC = () => {
  // Vérifier immédiatement si nous sommes dans un contexte de déconnexion admin
  const adminLogoutContext = isAdminLogoutContext();
  
  useEffect(() => {
    if (adminLogoutContext) {
      console.log('AppRouter: Détection d\'une déconnexion admin - établissement de la protection');
      
      // Nettoyer les flags après un court délai
      const timer = setTimeout(() => {
        localStorage.removeItem('admin_logout_in_progress');
        localStorage.removeItem('block_all_redirects');
        console.log('AppRouter: Nettoyage des flags de protection après délai');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [adminLogoutContext]);
  
  return (
    <Router>
      <StripeProvider>
        {/* Composant de persistance du thème */}
        <ThemePersistence />
        <Routes>
          {/* Routes publiques */}
          <Route path="/auth" element={<>
              {console.log('Rendu du composant ClientAuth')}
              <ClientAuth />
            </>} />
          
          {/* Route d'authentification simplifiée pour tester */}
          <Route path="/simple-auth" element={<SimpleAuth />} />
          
          {/* Application principale (protégée) */}
          <Route 
            path="/app" 
            element={
              <ProtectedRoute>
                <App />
              </ProtectedRoute>
            } 
          />
          
          {/* Redirection de l'ancienne route dashboard vers l'application */}
          <Route 
            path="/dashboard" 
            element={<Navigate to="/app" replace />} 
          />
          
          {/* Page de connexion administrative - PRIORITAIRE pour éviter les redirections non souhaitées */}
          <Route 
            path="/admin/login" 
            element={<AdminLogin />} 
          />
          
          {/* Ajouter une route spécifique pour la page d'authentification client */}
          <Route 
            path="/login" 
            element={<Navigate to="/auth" replace />} 
          />
          
          {/* Page d'accueil - redirection vers le site web marketing */}
          <Route 
            path="/" 
            element={
              <MarketingSiteRedirect />
            } 
          />
          
          {/* Nouvelle route principale pour l'interface d'administration */}
          <Route 
            path="/admin" 
            element={
              <ProtectedAdminRoute>
                <SaasAdmin />
              </ProtectedAdminRoute>
            } 
          />
          
          {/* Redirection de l'ancienne route /admin/saas vers la nouvelle */}
          <Route 
            path="/admin/saas" 
            element={<Navigate to="/admin" replace />} 
          />
          
          {/* Outil de diagnostic Firebase */}
          <Route 
            path="/admin/firebase-check" 
            element={<FirebaseChecker />} 
          />
          
          {/* Routes de suppression temporairement désactivées */}
          
          {/* Outil de réparation des abonnements */}
          <Route 
            path="/admin/repair-subscriptions" 
            element={<RepairSubscriptionsPage />} 
          />
          
          {/* Pages de paiement Stripe */}
          <Route 
            path="/checkout/success" 
            element={<CheckoutSuccessPage />} 
          />
          
          <Route 
            path="/checkout/canceled" 
            element={<CheckoutCanceledPage />} 
          />
          
          {/* Page de plans d'abonnement */}
          <Route 
            path="/plans" 
            element={<SubscriptionPlansPage />} 
          />
          
          {/* Routes pour le checkout de plans spécifiques */}
          <Route 
            path="/subscription-checkout/:planId" 
            element={<SubscriptionCheckoutPage />} 
          />
          
          {/* Page de débogage de l'authentification */}
          <Route
            path="/auth-debug"
            element={<AuthDebug />}
          />
          
          {/* Gestion des périodes d'essai */}
          <Route 
            path="/admin/trial-periods" 
            element={
              <ProtectedAdminRoute>
                <TrialPeriodsPage />
              </ProtectedAdminRoute>
            } 
          />
          
          {/* Gestion des clients en essai */}
          <Route 
            path="/admin/trial-clients" 
            element={
              <ProtectedAdminRoute>
                <TrialClientsPage />
              </ProtectedAdminRoute>
            } 
          />
          
          {/* Rapports d'efficacité des périodes d'essai */}
          <Route 
            path="/admin/trial-reports" 
            element={
              <ProtectedAdminRoute>
                <TrialEfficiencyReportPage />
              </ProtectedAdminRoute>
            } 
          />
          
          {/* Route catch-all avec logique de redirection conditionnelle */}
          <Route 
            path="*" 
            element={
              <ConditionalRedirect />
            } 
          />
          />
        </Routes>
      </StripeProvider>
    </Router>
  );
};

export default AppRouter;
