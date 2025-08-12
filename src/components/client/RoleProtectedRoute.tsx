import React, { useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AppContext } from '../../App';
import { Loader2 } from 'lucide-react';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: ('admin' | 'manager' | 'cashier')[];
  redirectTo?: string;
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({ 
  children, 
  allowedRoles,
  redirectTo = '/pos' 
}) => {
  const { currentEmployee } = useContext(AppContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier si l'employé est chargé
    if (currentEmployee !== null || currentEmployee === null) {
      setLoading(false);
    }
  }, [currentEmployee]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="ml-2 text-lg">Chargement...</span>
      </div>
    );
  }

  // Si l'employé n'est pas connecté ou n'a pas un rôle autorisé
  if (!currentEmployee || !allowedRoles.includes(currentEmployee.role)) {
    console.log(`Accès refusé: Rôle ${currentEmployee?.role} non autorisé. Redirection vers ${redirectTo}`);
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default RoleProtectedRoute;
