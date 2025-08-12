import React from 'react';
import { Employee, Permission } from '../../types';
import { Edit, Trash2, User, Mail, Shield, Award } from 'lucide-react';

interface EmployeeDetailModalProps {
  employee: Employee;
  onEdit: (employee: Employee) => void;
  onDelete: (employeeId: string) => void;
  onClose: () => void;
}

const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  employee,
  onEdit,
  onDelete,
  onClose
}) => {
  // Fonction pour afficher le rôle en français
  const getRoleName = (role: string) => {
    switch (role) {
      case 'manager': return 'Gérant';
      case 'cashier': return 'Caissier';
      case 'admin': return 'Administrateur';
      default: return role;
    }
  };

  // Afficher uniquement les 3 premières permissions, le reste est compté
  const visiblePermissions = employee.permissions.slice(0, 3);
  const remainingCount = employee.permissions.length - 3;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Bannière supérieure neutre */}
        <div 
          className="h-16 w-full relative overflow-hidden"
          style={{ 
            background: 'linear-gradient(135deg, #f5f5f5, #e0e0e0)'
          }}
        >
          {employee.isMainAdmin && (
            <div className="absolute top-2 right-2 bg-white bg-opacity-90 rounded-full p-1 shadow-md" title="Administrateur principal">
              <Shield className="h-4 w-4" style={{ color: 'var(--color-primary)' }} />
            </div>
          )}
        </div>

        {/* Contenu de la carte */}
        <div className="px-6 pb-6 pt-0">
          {/* Avatar positionné sur la bannière */}
          <div className="flex justify-center -mt-12 mb-3">
            {employee.avatarUrl ? (
              <img 
                src={employee.avatarUrl} 
                alt={`${employee.firstName} ${employee.lastName}`} 
                className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="h-24 w-24 rounded-full flex items-center justify-center shadow-lg border-4 border-white" 
                style={{ 
                  background: `linear-gradient(135deg, #f8f8f8, #eeeeee)`,
                }}>
                <User size={42} style={{ color: 'var(--color-primary)' }} />
              </div>
            )}
          </div>
          
          {/* Nom et rôle */}
          <div className="text-center mb-4">
            <h3 className="font-bold text-lg text-gray-800 flex items-center justify-center gap-1.5">
              {employee.firstName} {employee.lastName}
              {employee.active ? (
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-green-500 shadow-sm" title="Actif"></span>
              ) : (
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-red-500 shadow-sm" title="Inactif"></span>
              )}
            </h3>
            <div className="mt-1.5 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium shadow-sm"
              style={{
                backgroundColor: employee.role === 'admin' ? 'rgba(79, 70, 229, 0.15)' : 
                              employee.role === 'manager' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: employee.role === 'admin' ? 'rgb(79, 70, 229)' : 
                      employee.role === 'manager' ? 'rgb(16, 185, 129)' : 'rgb(245, 158, 11)',
                border: employee.role === 'admin' ? '1px solid rgba(79, 70, 229, 0.3)' : 
                        employee.role === 'manager' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
              }}>
              <Award size={14} className="mr-1" />
              {getRoleName(employee.role)}
            </div>
          </div>
          
          {/* Email */}
          <div className="space-y-2.5 mb-5">
            <div className="flex items-center text-sm text-gray-600">
              <Mail size={14} className="mr-2 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
              <span className="truncate">{employee.email}</span>
            </div>
          </div>
          
          {/* Permissions */}
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <Shield size={14} className="mr-1.5" style={{ color: 'var(--color-primary)' }} />
              <span className="text-sm font-medium text-gray-700">Permissions</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {visiblePermissions.map((permission, index) => (
                <span 
                  key={`${employee.id}-perm-${index}`} 
                  className="px-2.5 py-1 text-xs font-medium rounded-md shadow-sm"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'white',
                    border: '1px solid var(--color-primary-dark)'
                  }}
                  title={typeof permission === 'string' ? permission : permission.name}
                >
                  {typeof permission === 'string' ? permission : permission.name}
                </span>
              ))}
              {remainingCount > 0 && (
                <span className="px-2.5 py-1 text-xs font-medium rounded-md shadow-sm bg-gray-200 text-gray-800 border border-gray-300">
                  +{remainingCount} autres
                </span>
              )}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-between mt-5">
            <button
              onClick={() => onEdit(employee)}
              className="px-3 py-1.5 bg-gray-100 rounded-md text-sm text-gray-700 hover:bg-gray-200 flex items-center transition-colors"
            >
              <Edit size={14} className="mr-1.5" />
              Modifier
            </button>
            
            {/* Bouton supprimer - uniquement visible si ce n'est pas un admin principal ou système */}
            {!employee.isMainAdmin && !employee.firebaseUid && (
              <button
                onClick={() => onDelete(employee.id)}
                className="px-3 py-1.5 bg-red-50 rounded-md text-sm text-red-600 hover:bg-red-100 flex items-center transition-colors"
              >
                <Trash2 size={14} className="mr-1.5" />
                Supprimer
              </button>
            )}
          </div>
          
          {/* Bouton fermer */}
          <button
            onClick={onClose}
            className="mt-6 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailModal;
