import React, { useEffect, useContext, useState } from 'react';
import { Employee } from '../../types';
import { Edit, Trash2, Shield, Users, User, MoreVertical } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

import { AppContext } from '../../App';
import { canPerformAction } from '../../services/permissionService';

interface EmployeeListProps {
  employees: Employee[];
  searchQuery: string;
  onEdit: (employee: Employee) => void;
  onDelete: (employeeId: string) => void;
}

const EmployeeList: React.FC<EmployeeListProps> = ({
  employees,
  searchQuery,
  onEdit,
  onDelete,
}) => {
  const { theme } = useTheme();
  const { currentEmployee } = useContext(AppContext);
  
  // État pour suivre quel menu est ouvert
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  // Fonction pour gérer l'ouverture/fermeture du menu
  const toggleMenu = (employeeId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    if (openMenuId === employeeId) {
      setOpenMenuId(null);
    } else {
      setOpenMenuId(employeeId);
    }
  };
  
  // Fonction pour fermer le menu lorsqu'on clique ailleurs
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);
  
  // Fonctions pour vérifier les permissions
  const canEditEmployee = (employeeId: string) => {
    // Admin peut tout modifier
    if (currentEmployee?.role === 'admin') {
      return true;
    }
    
    // Pour les caissiers, autoriser explicitement la modification de leur propre profil
    if (currentEmployee?.role === 'cashier' && employeeId === currentEmployee.id) {
      return true;
    }
    
    // Pour les autres rôles, vérifier la permission spécifique
    return canPerformAction(currentEmployee as any, 'edit_employee');
  };
  
  const canDeleteEmployee = () => {
    if (currentEmployee?.role === 'admin') return true;
    return canPerformAction(currentEmployee as any, 'delete_employee');
  };

  // Forcer l'application du thème lors du chargement du composant
  useEffect(() => {
    // Déclencher l'événement forceThemeUpdate pour s'assurer que le thème est correctement appliqué
    const event = new CustomEvent('forceThemeUpdate', {
      detail: { 
        theme: theme, 
        timestamp: Date.now() 
      }
    });
    document.dispatchEvent(event);
  }, [theme]);

  // Filtrer les employés en fonction de la recherche
  const filteredEmployees = employees.filter(employee => {
    // N'afficher l'administrateur principal que si l'utilisateur actuel est lui-même l'admin principal
    if (employee.isMainAdmin && (!currentEmployee?.isMainAdmin)) {
      return false;
    }

    // Si l'utilisateur est un caissier, il ne peut voir que son propre profil
    if (currentEmployee?.role === 'cashier') {
      return employee.id === currentEmployee.id;
    }

    const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || 
           employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
           employee.role.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Fonction pour afficher le rôle en français
  const getRoleName = (role: string) => {
    switch (role) {
      case 'manager': return 'Gérant';
      case 'cashier': return 'Caissier';
      case 'admin': return 'Administrateur';
      default: return role;
    }
  };

  return (
    <div className="w-full h-full p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="text-2xl font-bold text-gray-700 dark:text-gray-300 flex items-center">
          <Users className="h-6 w-6 mr-2" style={{ color: 'var(--color-primary)' }} />
          <span>{filteredEmployees.length} employé{filteredEmployees.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Employé
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Contact
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Rôle
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Statut
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 relative">
                        {employee.avatarUrl ? (
                          <img 
                            src={employee.avatarUrl} 
                            alt={`${employee.firstName} ${employee.lastName}`} 
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        ) : (
                          <div 
                            className="h-10 w-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400" 
                          >
                            <User size={20} />
                          </div>
                        )}
                        {employee.isMainAdmin && (
                          <div 
                            className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-white dark:bg-gray-700 p-0.5 shadow-sm" 
                            title="Administrateur principal"
                          >
                            <Shield className="h-full w-full text-red-500" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {employee.firstName} {employee.lastName}
                        </div>
                        {employee.hireDate && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Embauché le {new Date(employee.hireDate).toLocaleDateString('fr-FR')}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">{employee.email}</div>
                    {employee.phone && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">{employee.phone}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium shadow-sm"
                      style={{
                        backgroundColor: employee.role === 'admin' ? 'rgba(79, 70, 229, 0.15)' : 
                                       employee.role === 'manager' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: employee.role === 'admin' ? 'rgb(79, 70, 229)' : 
                               employee.role === 'manager' ? 'rgb(16, 185, 129)' : 'rgb(245, 158, 11)',
                        border: employee.role === 'admin' ? '1px solid rgba(79, 70, 229, 0.3)' : 
                                employee.role === 'manager' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
                      }}>
                      <Shield size={12} className="mr-1" />
                      {getRoleName(employee.role)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {employee.active ? (
                        <>
                          <div className="h-2.5 w-2.5 rounded-full bg-green-500 mr-2"></div>
                          <span className="text-sm text-gray-700 dark:text-gray-300">Actif</span>
                        </>
                      ) : (
                        <>
                          <div className="h-2.5 w-2.5 rounded-full bg-red-500 mr-2"></div>
                          <span className="text-sm text-gray-700 dark:text-gray-300">Inactif</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMenu(employee.id);
                        }}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <MoreVertical size={16} className="text-gray-500 dark:text-gray-400" />
                      </button>
                      
                      {openMenuId === employee.id && (
                        <div className="absolute right-0 mt-1 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 dark:ring-gray-700 z-10">
                          <div className="py-1" role="menu" aria-orientation="vertical">
                            {canEditEmployee(employee.id) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEdit(employee);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white flex items-center"
                              >
                                <Edit size={14} className="mr-3 text-gray-500 dark:text-gray-400" />
                                Modifier
                              </button>
                            )}
                            {canDeleteEmployee() && !employee.isMainAdmin && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete(employee.id);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-300 flex items-center"
                              >
                                <Trash2 size={14} className="mr-3 text-red-500" />
                                Supprimer
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredEmployees.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
              <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Aucun employé ne correspond à votre recherche</p>
              <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">Essayez avec d'autres termes ou ajoutez un nouvel employé</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeList;
