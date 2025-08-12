import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

// Mode développement: pas besoin des constantes d'authentification

// Version ultra-simplifiée pour le mode développement uniquement
const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ 
  children, 
  redirectTo = '/admin/login' 
}) => {
  // En mode développement, on ignore complètement l'authentification
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true);
  const location = useLocation();
  
  // Aucune vérification d'authentification pour le mode développement
  useEffect(() => {
    console.log('Mode développement: authentification admin forcée');
    
    // Force l'authentification pour le mode développement
    localStorage.setItem('payesmart_admin_auth', 'true');
    localStorage.setItem('payesmart_admin_email', 'admin@payesmart.com');
    
    // Déjà authentifié par défaut
    setIsAdmin(true);
    setLoading(false);
  }, []);
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 text-indigo-600 animate-spin" />
          <p className="mt-4 text-gray-600">Vérification des droits d'administrateur...</p>
        </div>
      </div>
    );
  }
  
  if (!isAdmin) {
    // Rediriger vers la page de connexion avec un message d'erreur
    return <Navigate to={redirectTo} state={{ 
      from: location,
      error: "Accès refusé. Vous n'avez pas les droits d'administrateur nécessaires."
    }} replace />;
  }
  
  // Si l'utilisateur est un administrateur authentifié
  return <>{children}</>;
};

export default ProtectedAdminRoute;
