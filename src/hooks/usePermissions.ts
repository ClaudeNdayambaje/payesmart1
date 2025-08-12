import { useContext } from 'react';
import { AppContext } from '../App';
import { hasPermission, canAccessView, canPerformAction, canViewModuleItem } from '../services/permissionService';

/**
 * Hook personnalisé pour gérer l'accès aux différentes parties de l'application
 * en fonction des permissions de l'utilisateur
 */
export const usePermissions = () => {
  const { currentEmployee } = useContext(AppContext);

  return {
    /**
     * Vérifie si l'utilisateur a une permission spécifique
     * @param permissionId L'identifiant de la permission
     */
    hasPermission: (permissionId: string) => {
      return hasPermission(currentEmployee, permissionId);
    },

    /**
     * Vérifie si l'utilisateur peut accéder à une vue spécifique
     * @param view L'identifiant de la vue
     */
    canAccessView: (view: string) => {
      return canAccessView(currentEmployee, view);
    },

    /**
     * Vérifie si l'utilisateur peut effectuer une action spécifique
     * @param action L'identifiant de l'action
     */
    canPerformAction: (action: string) => {
      return canPerformAction(currentEmployee, action);
    },

    /**
     * Vérifie si l'utilisateur peut voir un élément spécifique dans un module
     * Utilisé pour les permissions partielles à l'intérieur d'un module
     * @param modulePermission La permission pour accéder au module
     * @param itemPermission La permission pour l'élément spécifique
     */
    canViewModuleItem: (modulePermission: string, itemPermission: string) => {
      return canViewModuleItem(currentEmployee, modulePermission, itemPermission);
    },

    /**
     * Renvoie le rôle de l'utilisateur actuel
     */
    getCurrentRole: () => {
      return currentEmployee?.role || null;
    },

    /**
     * Vérifie si l'utilisateur est un administrateur
     */
    isAdmin: () => {
      return currentEmployee?.role === 'admin';
    },

    /**
     * Vérifie si l'utilisateur est un manager
     */
    isManager: () => {
      return currentEmployee?.role === 'manager';
    }
  };
};
