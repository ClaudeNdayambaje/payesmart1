import React, { useState, useEffect, ChangeEvent } from 'react';
import { Employee, Permission } from '../../types/index';
import { User, Upload, X, Loader2 } from 'lucide-react';
import { availablePermissions, appModules, rolePermissionPresets } from '../../config/permissions';

// Type pour les rôles
type Role = 'admin' | 'manager' | 'cashier' | string;

// Props pour le formulaire
export interface EmployeeFormProps {
  employee: Employee | null;
  onSave: (employee: Partial<Employee>, isPasswordChange?: boolean) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
  defaultRole?: Role;
  isPasswordChangeOnly?: boolean;
}

// Type pour le state du formulaire
interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  hireDate: string;
  role: Role;
  pin: string;
  active: boolean;
  permissions: string[]; // Utiliser un tableau d'IDs (string)
  avatarUrl: string;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ 
  employee, 
  onSave, 
  onCancel, 
  isEdit = false, 
  defaultRole, 
  isPasswordChangeOnly = false 
}) => {
  // Données du formulaire
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    hireDate: '',
    role: defaultRole || 'cashier',
    pin: '',
    active: true,
    permissions: [],
    avatarUrl: ''
  });
  
  // États pour la gestion de l'interface
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Si nous sommes en mode modification avec un employé spécifique
    if (isEdit && employee) {
      // Convertir les objets Permission en IDs
      const permissionIds = employee.permissions 
        ? (typeof employee.permissions[0] === 'string' 
            ? employee.permissions as unknown as string[]
            : (employee.permissions as Permission[]).map(p => typeof p === 'string' ? p : p.id))
        : [];
      
      // Déterminer le rôle
      let role = employee.role || 'cashier';
      
      // Initialiser le formulaire avec les données de l'employé
      setFormData({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        phone: employee.phone || '',
        hireDate: employee.hireDate ? (typeof employee.hireDate === 'string' ? employee.hireDate : '') : '',
        role: role,
        pin: employee.pin || '',
        active: employee.active !== undefined ? employee.active : true,
        permissions: permissionIds,
        avatarUrl: employee.avatarUrl || ''
      });
      
      if (employee.avatarUrl) {
        setPreviewUrl(employee.avatarUrl);
      }
    } else {
      // En mode création, réinitialiser le formulaire
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        hireDate: '',
        role: defaultRole || 'cashier',
        pin: '',
        active: true,
        permissions: [],
        avatarUrl: ''
      });
      
      // Appliquer les permissions par défaut selon le rôle
      if (defaultRole) {
        applyRolePreset(defaultRole);
      } else {
        applyRolePreset('cashier');
      }
    }
  }, [employee, isEdit, defaultRole]);

  // Gérer les changements de champs dans le formulaire
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Gérer le téléchargement d'un avatar
  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Vérifier la taille du fichier (2 Mo max)
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Le fichier est trop volumineux. La taille maximale est de 2 Mo.');
      return;
    }
    
    // Vérifier le type de fichier
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
      setAvatarError('Format de fichier non pris en charge. Utilisez JPG, PNG ou GIF.');
      return;
    }
    
    // Créer une URL pour la prévisualisation
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    // Lire le fichier comme une URL de données
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFormData(prev => ({
          ...prev,
          avatarUrl: event.target?.result as string
        }));
      }
    };
    reader.readAsDataURL(file);
    
    setAvatarError(null);
  };

  // Gérer la suppression de l'avatar
  const handleRemoveAvatar = () => {
    setPreviewUrl(null);
    setFormData(prev => ({
      ...prev,
      avatarUrl: ''
    }));
  };

  // Gérer le changement de code PIN (uniquement des chiffres)
  const handlePinChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setFormData(prev => ({
      ...prev,
      pin: value
    }));
    
    if (value.length !== 4 && value.length > 0) {
      setPinError('Le code PIN doit comporter 4 chiffres');
    } else {
      setPinError(null);
    }
  };

  // Gérer le changement de rôle avec chargement des permissions prédéfinies
  const handleRoleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as Role;
    
    setFormData(prev => ({
      ...prev,
      role: newRole
    }));
    
    // Appliquer automatiquement les permissions du nouveau rôle
    applyRolePreset(newRole);
  };

  // Appliquer les permissions prédéfinies selon le rôle
  const applyRolePreset = (role: Role) => {
    // Obtenir les permissions prédéfinies pour ce rôle
    const presetPermissions = rolePermissionPresets[role as keyof typeof rolePermissionPresets] || [];
    
    // Mettre à jour le formulaire
    setFormData(prev => ({
      ...prev,
      permissions: presetPermissions.map(p => typeof p === 'string' ? p : p.id)
    }));
  };

  // Gestion du changement de permissions
  const handlePermissionChange = (permissionId: string) => {
    setFormData(prev => {
      // Vérifier si la permission est déjà sélectionnée
      const isSelected = prev.permissions.includes(permissionId);
      
      // Mettre à jour la liste des permissions
      const updatedPermissions = isSelected
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId];
      
      return {
        ...prev,
        permissions: updatedPermissions
      };
    });
  };

  // Gérer la sélection/désélection de toutes les permissions d'un module
  const handleSelectAllModulePermissions = (moduleId: string, selected: boolean) => {
    // Obtenir toutes les permissions de ce module
    const modulePermissions = availablePermissions
      .filter(p => p.category === moduleId)
      .map(p => p.id);
    
    setFormData(prev => {
      let updatedPermissions = [...prev.permissions];
      
      if (selected) {
        // Ajouter toutes les permissions du module qui ne sont pas déjà sélectionnées
        modulePermissions.forEach(id => {
          if (!updatedPermissions.includes(id)) {
            updatedPermissions.push(id);
          }
        });
      } else {
        // Retirer toutes les permissions du module
        updatedPermissions = updatedPermissions.filter(id => !modulePermissions.includes(id));
      }
      
      return {
        ...prev,
        permissions: updatedPermissions
      };
    });
  };

  // Vérifier si un module est entièrement sélectionné
  const isModuleFullySelected = (moduleId: string) => {
    const modulePermissions = availablePermissions
      .filter(p => p.category === moduleId)
      .map(p => p.id);
    
    return modulePermissions.every(id => formData.permissions.includes(id));
  };

  // Vérifier si une permission est sélectionnée
  const isPermissionSelected = (permissionId: string) => {
    return formData.permissions.includes(permissionId);
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validation du PIN
    if (formData.pin && formData.pin.length !== 4) {
      setPinError('Le code PIN doit comporter 4 chiffres');
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Convertir les IDs de permission en objets Permission complets
      const selectedPermissionObjects = availablePermissions
        .filter(p => formData.permissions.includes(p.id));
      
      // Préparer les données à envoyer
      const employeeData: Partial<Employee> = {
        id: employee?.id,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        hireDate: formData.hireDate as any,
        role: formData.role as 'admin' | 'manager' | 'cashier',
        active: formData.active,
        permissions: selectedPermissionObjects,
        pin: formData.pin,
      };
      
      // S'assurer que l'avatarUrl est TOUJOURS inclus dans les données envoyées
      // même si c'est une chaîne vide (pour supprimer l'avatar)
      if (formData.avatarUrl !== undefined) {
        employeeData.avatarUrl = formData.avatarUrl;
      } else if (employee?.avatarUrl !== undefined) {
        // Si aucune modification n'a été apportée à l'avatar, conserver l'avatar existant
        employeeData.avatarUrl = employee.avatarUrl;
      } else {
        // Si aucun avatar n'est défini, définir une chaîne vide
        employeeData.avatarUrl = '';
      }
  
      // Envoyer les données à la fonction parent
      await onSave(employeeData, false);
      setIsSubmitting(false);
    } catch (error) {
      console.error('Error submitting employee data:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            {isPasswordChangeOnly ? 'Modifier vos informations personnelles' : 
             isEdit ? 'Modifier un employé' : 'Ajouter un employé'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            {!isPasswordChangeOnly && (
              <>
                {/* Section Avatar */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Photo de profil</h3>
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      {previewUrl ? (
                        <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200">
                          <img
                            src={previewUrl}
                            alt="Avatar Preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={handleRemoveAvatar}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 transform transition-transform hover:scale-110"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-full flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 hover:border-primary">
                          {employee?.avatarUrl ? (
                            <div className="relative w-full h-full">
                              <img
                                src={employee.avatarUrl}
                                alt="Avatar actuel"
                                className="w-full h-full object-cover rounded-full"
                                onError={(e) => {
                                  console.error("Erreur de chargement de l'image:", employee.avatarUrl);
                                  (e.target as HTMLImageElement).onerror = null;
                                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXVzZXIiPjxwYXRoIGQ9Ik0xOSAyMXYtMmE0IDQgMCAwIDAtNC00SDlhNCA0IDAgMCAwLTQgNHYyIi8+PGNpcmNsZSBjeD0iMTIiIGN5PSI3IiByPSI0Ii8+PC9zdmc+';
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  console.log("Suppression de l'avatar existant");
                                  setFormData(prev => ({ ...prev, avatarUrl: '' }));
                                  setPreviewUrl(null);
                                }}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 transform transition-transform hover:scale-110"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <User className="text-gray-400" size={40} />
                          )}
                        </div>
                      )}
                    </div>
                    <div>
                      <label htmlFor="avatar" className="btn btn-outline-primary cursor-pointer">
                        <Upload size={16} className="mr-2" />
                        Télécharger une photo
                      </label>
                      <input
                        type="file"
                        id="avatar"
                        name="avatar"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        JPG, PNG ou GIF. 2 MB maximum.
                      </p>
                      {avatarError && (
                        <p className="text-xs text-red-500 mt-1">{avatarError}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Section Informations personnelles */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Informations personnelles</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label htmlFor="firstName" className="form-label">
                        Prénom
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="form-input"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="lastName" className="form-label">
                        Nom
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="form-input"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="email" className="form-label">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="form-input"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="phone" className="form-label">
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone || ''}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>
                  
                    <div className="form-group">
                      <label htmlFor="hireDate" className="form-label">
                        Date d'embauche
                      </label>
                      <input
                        type="date"
                        id="hireDate"
                        name="hireDate"
                        value={formData.hireDate?.split('T')[0] || ''}
                        onChange={handleChange}
                        className="form-input"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="role" className="form-label">
                        Rôle
                      </label>
                      <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleRoleChange}
                        className="form-select"
                        required
                      >
                        <option value="">Sélectionner un rôle</option>
                        <option value="admin">Administrateur</option>
                        <option value="manager">Gérant</option>
                        <option value="cashier">Caissier</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-group mt-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="active"
                        name="active"
                        checked={formData.active}
                        onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                        className="form-checkbox"
                      />
                      <label htmlFor="active" className="form-label ml-2 mb-0">
                        Compte actif
                      </label>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {/* Section Code PIN - visible uniquement en mode création ou édition complète */}
            {!isEdit && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Code PIN</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label htmlFor="pin" className="form-label">
                      Code PIN (4 chiffres)
                    </label>
                    <input
                      type="password"
                      id="pin"
                      name="pin"
                      value={formData.pin}
                      onChange={handlePinChange}
                      maxLength={4}
                      placeholder="Entrez 4 chiffres"
                      className="form-input"
                    />
                    {pinError && (
                      <p className="text-red-500 text-xs mt-1">{pinError}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {!isPasswordChangeOnly && formData.role !== 'admin' && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Permissions</h3>
                
                <div className="border rounded-lg p-4 bg-white shadow-sm">
                  <div className="mt-3">
                    {appModules.map((module) => (
                      <div key={module.id} className="mb-4">
                        <div className="form-group mb-2">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`module-${module.id}`}
                              checked={isModuleFullySelected(module.id)}
                              onChange={() => handleSelectAllModulePermissions(module.id, !isModuleFullySelected(module.id))}
                              className="form-checkbox"
                            />
                            <label htmlFor={`module-${module.id}`} className="form-label ml-2 mb-0 font-medium">
                              {module.name}
                            </label>
                          </div>
                        </div>
                        
                        <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-2">
                          {availablePermissions
                            .filter((permission) => permission.category === module.id)
                            .map((permission) => (
                              <div key={permission.id} className="form-group mb-1">
                                <div className="flex items-center">
                                  <input
                                    type="checkbox"
                                    id={`permission-${permission.id}`}
                                    checked={isPermissionSelected(permission.id)}
                                    onChange={() => handlePermissionChange(permission.id)}
                                    className="form-checkbox"
                                  />
                                  <label htmlFor={`permission-${permission.id}`} className="form-label ml-2 mb-0 text-sm">
                                    {permission.name}
                                  </label>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={onCancel}
                className="btn-secondary"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Enregistrement...
                  </>
                ) : (
                  isEdit ? 'Mettre à jour' : 'Créer l\'employé'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployeeForm;
