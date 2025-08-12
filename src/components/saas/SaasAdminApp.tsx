import React, { useState, useEffect } from 'react';
import { auth } from '../../firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import SaasAdminLogin from './SaasAdminLogin';
import SaasManager from '../SaasManager';

// Liste des emails autorisés à accéder à l'interface d'administration SaaS
const AUTHORIZED_ADMIN_EMAILS = [
  'admin@payesmart.com',
  // Ajoutez d'autres emails d'administrateurs système ici
];

const SaasAdminApp: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  // ID d'entreprise fixe pour l'interface d'administration
  const currentBusinessId = 'admin';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      
      // Vérifier si l'utilisateur est autorisé
      if (user && user.email && AUTHORIZED_ADMIN_EMAILS.includes(user.email.toLowerCase())) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
      
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !isAuthorized) {
    return <SaasAdminLogin onLoginSuccess={() => setIsAuthorized(true)} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-gradient-to-r from-indigo-800 to-indigo-700 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div>
              <h1 className="text-xl font-bold">PayeSmart Admin</h1>
              <span className="bg-indigo-600 px-2 py-0.5 rounded text-xs">SaaS</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <span className="opacity-75">Connecté en tant que</span>{' '}
              <span className="font-medium">{currentUser.email}</span>
            </div>
            
            <button 
              onClick={handleLogout}
              className="bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded-md text-sm transition-colors duration-200"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto p-6">
        <SaasManager currentBusinessId={currentBusinessId} />
      </main>
      
      <footer className="bg-gray-900 text-gray-400 p-3 text-center text-sm">
        <p> {new Date().getFullYear()} PayeSmart - Interface d'administration SaaS</p>
      </footer>
    </div>
  );
};

export default SaasAdminApp;
