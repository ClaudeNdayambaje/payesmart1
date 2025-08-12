import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import ClientLogin from '../components/client/ClientLogin';
import ClientRegistration from '../components/client/ClientRegistration';
import LogoSelector from '../components/client/LogoSelector';
import { Loader2 } from 'lucide-react';

const ClientAuth: React.FC = () => {
  const [showRegistration, setShowRegistration] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Vérifier si le paramètre register=true est présent dans l'URL
    const searchParams = new URLSearchParams(location.search);
    const shouldShowRegistration = searchParams.get('register') === 'true';
    
    if (shouldShowRegistration) {
      setShowRegistration(true);
    }
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // L'utilisateur est déjà connecté, rediriger vers l'application principale
        navigate('/app');
      } else {
        // Pas d'utilisateur connecté, afficher le formulaire de connexion
        setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, [navigate, location]);
  
  const handleLoginSuccess = () => {
    navigate('/app');
  };
  
  const handleRegistrationSuccess = () => {
    setShowRegistration(false);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center ps-login-background">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 text-[var(--ps-orange)] animate-spin" />
          <p className="mt-4 text-gray-300 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="ps-login-background">
      {/* Fond épuré sans éléments décoratifs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#2F2F2F] to-[#232323] opacity-70"></div>
      </div>
      
      <div className="flex-1 flex md:flex-row flex-col items-center justify-center p-6 pt-16 relative overflow-hidden z-10">
        <div className="md:w-1/2 w-full flex flex-col items-center justify-center md:pr-8 mb-8 md:mb-0">
          <LogoSelector variant="light" size="lg" className="mb-4" />
          <p className="text-[var(--ps-orange)] text-center text-lg mb-6">Votre solution de gestion de caisse intelligente</p>
          
          <a 
            href="/"
            className="mb-6 text-[var(--ps-orange)] hover:text-[var(--ps-orange-light)] transition-all text-sm hover:underline"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = window.location.origin + '/marketing/index.html';
            }}
          >
            Visiter notre site Web
          </a>
          
          <div className="grid grid-cols-2 gap-4 w-full max-w-md">
            <div className="bg-[rgba(35,35,35,0.6)] backdrop-blur-md p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="text-[var(--ps-orange)] font-medium mb-1">Simple</div>
              <div className="text-white/80 text-sm">Interface intuitive pour une prise en main rapide</div>
            </div>
            <div className="bg-[rgba(35,35,35,0.6)] backdrop-blur-md p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="text-[var(--ps-orange)] font-medium mb-1">Sécurisé</div>
              <div className="text-white/80 text-sm">Protection de vos données et transactions</div>
            </div>
            <div className="bg-[rgba(35,35,35,0.6)] backdrop-blur-md p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="text-[var(--ps-orange)] font-medium mb-1">Rapide</div>
              <div className="text-white/80 text-sm">Optimisé pour des performances maximales</div>
            </div>
            <div className="bg-[rgba(35,35,35,0.6)] backdrop-blur-md p-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="text-[var(--ps-orange)] font-medium mb-1">Complet</div>
              <div className="text-white/80 text-sm">Toutes les fonctionnalités dont vous avez besoin</div>
            </div>
          </div>
        </div>
        
        <div className="md:w-1/2 w-full max-w-md z-10">
          
          {showRegistration ? (
            <ClientRegistration 
              onSuccess={handleRegistrationSuccess} 
              onCancel={() => setShowRegistration(false)} 
            />
          ) : (
            <ClientLogin 
              onSuccess={handleLoginSuccess} 
              onRegister={() => setShowRegistration(true)} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientAuth;
