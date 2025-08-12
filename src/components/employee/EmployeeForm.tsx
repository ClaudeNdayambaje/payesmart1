import React, { useState, useEffect, useRef } from 'react';
import { Employee, Permission } from '../../types';
import { X, Shield, User, AlertCircle, Camera, Trash2, Check } from 'lucide-react';
import { getDefaultPermissionsForRoleWithBusinessId, getAllPermissions } from '../../services/permissionService';
import { uploadAndResizeImage } from '../../services/fileService';
import { getCurrentBusinessId } from '../../services/businessService';

interface EmployeeFormProps {
  employee?: Employee;
  onSave: (employeeData: any) => void;
  onCancel: () => void;
  isEdit?: boolean;
  defaultRole?: 'cashier' | 'manager' | 'admin';
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({
  employee,
  onSave,
  onCancel,
  isEdit = false,
  defaultRole,
}) => {
  const [formData, setFormData] = useState({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    role: 'cashier' as 'cashier' | 'manager' | 'admin',
    pin: '',
    active: true,
    permissions: [] as Permission[],
    avatarUrl: '',
    businessId: ''
  });
  
  // États pour la gestion des erreurs et du chargement
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Référence pour l'input de fichier
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // État pour la recherche de permissions
  // Récupérer toutes les permissions disponibles
  const availablePermissions = getAllPermissions();

  // Gérer le changement de rôle et mettre à jour les permissions
  const handleRoleChange = async (roleValue: 'cashier' | 'manager' | 'admin') => {
    try {
      const businessId = await getCurrentBusinessId();
      if (!businessId) {
        console.error('Impossible de récupérer l\'identifiant de l\'entreprise');
        return;
      }
      
      // Mode édition : vérifier si nous sommes en train de modifier un employé existant
      if (isEdit && employee) {
        // Préserver l'ID et le businessId lors de la mise à jour
        setFormData(prev => ({
          ...prev,
          role: roleValue,
          // Conserver les permissions existantes si on modifie un employé
          permissions: prev.permissions
        }));
      } else {
        // Mode création : mettre à jour les permissions en fonction du rôle
        setFormData(prev => ({
          ...prev,
          role: roleValue,
          businessId: businessId,
          permissions: getDefaultPermissionsForRoleWithBusinessId(roleValue, businessId)
        }));
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des permissions:', error);
    }
  };

  // Initialiser le formulaire avec les données de l'employé si en mode édition
  // Initialiser les permissions en fonction du rôle par défaut
  useEffect(() => {
    const initializeEmployee = async () => {
      try {
        const businessId = await getCurrentBusinessId();
        if (!businessId) {
          console.error('Impossible de récupérer l\'identifiant de l\'entreprise');
          return;
        }
        
        if (employee) {
          // Mode édition: utiliser les données de l'employé
          setFormData({
            id: employee.id || '',
            firstName: employee.firstName || '',
            lastName: employee.lastName || '',
            email: employee.email || '',
            role: employee.role || 'cashier',
            pin: employee.pin || '',
            active: employee.active !== false, // par défaut true
            permissions: employee.permissions || [],
            avatarUrl: employee.avatarUrl || '',
            businessId: employee.businessId || businessId
          });
        } else {
          // Mode création: utiliser le rôle par défaut s'il est spécifié
          if (defaultRole) {
            setFormData(prev => ({
              ...prev,
              businessId: businessId,
              permissions: getDefaultPermissionsForRoleWithBusinessId(defaultRole, businessId)
            }));
          } else {
            // Sinon utiliser 'cashier' comme rôle par défaut
            setFormData(prev => ({
              ...prev,
              businessId: businessId,
              permissions: getDefaultPermissionsForRoleWithBusinessId('cashier', businessId)
            }));
          }
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation des données de l\'employé:', error);
      }
    };
    
    initializeEmployee();
  }, [employee, defaultRole]);

  // Gérer les changements dans le formulaire
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'role') {
      handleRoleChange(value as 'cashier' | 'manager' | 'admin');
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Effacer les erreurs pour ce champ
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  
  // Gérer le téléchargement de l'avatar
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    console.log('Fichier sélectionné:', file.name, file.type, file.size);
    
    // Vérifier que le fichier est une image
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, avatar: 'Le fichier doit être une image' }));
      return;
    }
    
    // Vérifier la taille du fichier (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, avatar: 'L\'image ne doit pas dépasser 5MB' }));
      return;
    }
    
    try {
      setIsUploading(true);
      setUploadProgress(10);
      console.log('Début du téléchargement...');
      
      // Créer une URL locale pour afficher immédiatement l'image
      const localUrl = URL.createObjectURL(file);
      setFormData(prev => ({
        ...prev,
        avatarUrl: localUrl
      }));
      
      // Simuler une progression de téléchargement jusqu'à 85%
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 85) {
            clearInterval(progressInterval);
            return 85;
          }
          return prev + 10;
        });
      }, 200);
      
      // Télécharger directement le fichier sans redimensionnement
      console.log('Téléchargement du fichier vers Firebase...');
      const downloadURL = await uploadAndResizeImage(file, 'employees/avatars');
      console.log('Téléchargement terminé, URL:', downloadURL);
      
      // Assurer que la progression atteint 100% après le téléchargement réussi
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Mettre à jour l'URL de l'avatar dans le formulaire avec l'URL Firebase
      setFormData(prev => ({
        ...prev,
        avatarUrl: downloadURL
      }));
      
      // Effacer les erreurs liées à l'avatar
      setErrors(prev => ({ ...prev, avatar: '' }));
      console.log('Avatar mis à jour avec succès');
    } catch (error) {
      console.error('Erreur lors du téléchargement de l\'avatar:', error);
      setErrors(prev => ({ ...prev, avatar: 'Erreur lors du téléchargement. Veuillez réessayer.' }));
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };
  
  // Supprimer l'avatar
  const handleRemoveAvatar = () => {
    setFormData(prev => ({
      ...prev,
      avatarUrl: ''
    }));
    
    // Réinitialiser l'input de fichier
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Valider le formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }
    
    if (!formData.pin.trim()) {
      newErrors.pin = 'Le code PIN est requis';
    } else if (!/^\d{4}$/.test(formData.pin)) {
      newErrors.pin = 'Le code PIN doit contenir exactement 4 chiffres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Gérer la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Valider le formulaire
    if (!validateForm()) {
      return;
    }
    
    try {
      let dataToSave = { ...formData };
      
      // En mode édition, s'assurer que nous conservons l'ID et les permissions existantes
      if (isEdit && employee) {
        dataToSave = {
          ...dataToSave,
          id: employee.id, // S'assurer que l'ID est présent
          // Conserver les données spécifiques si nécessaire
          createdAt: employee.createdAt
        };
      }
      
      console.log('Données de l\'employé à sauvegarder:', dataToSave);
      
      // Appeler la fonction onSave fournie par le parent
      onSave(dataToSave);
    } catch (error) {
      console.error('Erreur lors de la préparation des données de l\'employé:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">
            {isEdit ? 'Modifier l\'employé' : 'Ajouter un employé'}
          </h2>
          <button
            onClick={onCancel}
            className="transition-colors"
            style={{ color: 'var(--color-gray-500)' }}
            onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-gray-700)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-gray-500)'}
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Colonne de gauche */}
            <div className="space-y-6">
              {/* Avatar */}
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  {formData.avatarUrl ? (
                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 shadow-md group" style={{ borderColor: 'var(--color-primary-lightest)' }}>
                      <img 
                        src={formData.avatarUrl} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: 'rgba(var(--color-primary-rgb), 0.7)' }}>
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="p-2 rounded-full text-white transition-colors"
                          style={{ backgroundColor: 'var(--color-danger)' }}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--color-danger-dark)'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--color-danger)'}
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-full flex items-center justify-center border-4 shadow-md" style={{ backgroundColor: 'var(--color-gray-100)', borderColor: 'var(--color-primary-lightest)' }}>
                      <User size={48} style={{ color: 'var(--color-primary-light)' }} />
                    </div>
                  )}
                  
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-32 h-32 rounded-full flex flex-col items-center justify-center text-white" style={{ backgroundColor: 'rgba(var(--color-primary-rgb), 0.7)' }}>
                        <div className="text-lg font-bold">{uploadProgress}%</div>
                        <div className="text-xs">Chargement...</div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col items-center">
                  <label htmlFor="avatar-upload" className="mt-2 px-3 py-1.5 rounded-md transition-colors text-sm flex items-center cursor-pointer" style={{ backgroundColor: 'var(--color-primary-lightest)', color: 'var(--color-primary)' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-light)'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-lightest)'}>
                    <Camera size={18} className="mr-1" />
                    {formData.avatarUrl ? 'Changer la photo' : 'Ajouter une photo'}
                  </label>
                  <input
                    id="avatar-upload"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  {errors.avatar && (
                    <div className="text-red-500 text-sm flex items-center mt-1">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.avatar}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Format JPG, PNG ou GIF<br />Taille max. 5MB
                  </p>
                </div>
              </div>
              
              {/* Informations de base */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.firstName && (
                      <div className="text-red-500 text-sm flex items-center mt-1">
                        <AlertCircle size={14} className="mr-1" />
                        {errors.firstName}
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.lastName && (
                      <div className="text-red-500 text-sm flex items-center mt-1">
                        <AlertCircle size={14} className="mr-1" />
                        {errors.lastName}
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                    />
                    {errors.email && (
                      <div className="text-red-500 text-sm flex items-center mt-1">
                        <AlertCircle size={14} className="mr-1" />
                        {errors.email}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Colonne de droite */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rôle <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="cashier">Caissier</option>
                  <option value="manager">Gérant</option>
                  <option value="admin">Administrateur</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Le rôle détermine les permissions de l'employé
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Code PIN (4 chiffres) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="pin"
                    value={formData.pin}
                    onChange={handleChange}
                    pattern="[0-9]{4}"
                    maxLength={4}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.pin ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.pin && (
                    <div className="text-red-500 text-sm flex items-center mt-1">
                      <AlertCircle size={14} className="mr-1" />
                      {errors.pin}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Le code PIN sera utilisé pour la connexion à la caisse
                </p>
              </div>
              
              <div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="active"
                    checked={formData.active}
                    onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                    className="form-checkbox h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Compte actif</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-7">
                  Désactivez pour suspendre temporairement l'accès de l'employé
                </p>
              </div>
            </div>
          </div>
          

          
          <div>
            <div className="flex items-center mb-2">
              <Shield size={16} className="mr-1 text-indigo-600" />
              <label className="block text-sm font-medium text-gray-700">
                Permissions associées au rôle
              </label>
              <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
                {formData.permissions.length} permission(s)
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Les permissions définissent ce que l'employé peut faire dans le système. Sélectionnez les permissions appropriées en fonction du rôle de l'employé.
              {formData.role === 'admin' && (
                <span className="block mt-1 font-medium text-indigo-600">
                  Note: Les administrateurs ont automatiquement accès à toutes les fonctionnalités du système.
                </span>
              )}
            </p>
            
            {/* Information sur les permissions */}
            <div className="mb-4 p-4 bg-indigo-50 rounded-lg">
              <div className="flex items-center text-indigo-700 mb-2">
                <Shield size={16} className="mr-2" />
                <span className="font-medium">Permissions automatiques</span>
              </div>
              <p className="text-sm text-indigo-600 mb-2">
                Les permissions sont automatiquement assignées en fonction du rôle de l'employé.
              </p>
              <div className="text-xs text-indigo-500">
                {formData.role === 'admin' && "Un administrateur a accès à toutes les fonctionnalités du système."}
                {formData.role === 'manager' && "Un gérant a accès à la plupart des fonctionnalités, à l'exception de certaines fonctions administratives."}
                {formData.role === 'cashier' && "Un caissier a accès aux fonctions de caisse et à certaines fonctions d'inventaire."}
              </div>
            </div>
            
            {/* Afficher les permissions par catégorie en lecture seule */}
            {(['inventory', 'sales', 'employees', 'reports', 'settings'] as const).map(category => {
              // Filtrer les permissions par catégorie qui sont dans les permissions actuelles de l'employé
              const categoryPermissions = availablePermissions.filter(p => 
                (p.category as string) === category && 
                formData.permissions.some(fp => fp.id === p.id)
              );
              if (categoryPermissions.length === 0) return null;
              
              // Traduire les noms de catégories
              const categoryNames = {
                inventory: 'Inventaire',
                sales: 'Ventes',
                employees: 'Employés',
                reports: 'Rapports',
                settings: 'Paramètres'
              };
              
              return (
                <div key={category} className="mb-4">
                  <div className="flex items-center mb-2 pb-1 border-b border-gray-200">
                    <h4 className="text-sm font-medium text-gray-800">
                      {categoryNames[category as keyof typeof categoryNames]}
                    </h4>
                    <div className="ml-2 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                      {categoryPermissions.length} permission(s)
                    </div>
                  </div>
                  <div className="space-y-2 pl-2">
                    {categoryPermissions.map(permission => (
                      <div key={permission.id} className="flex items-center p-1 rounded-md">
                        <div className="flex items-center justify-center h-4 w-4 text-green-600 mr-2">
                          <Check size={16} />
                        </div>
                        <div className="flex-1 text-sm text-gray-700">
                          <div className="font-medium">{permission.name}</div>
                          <div className="text-xs text-gray-500">
                            {permission.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="flex justify-end space-x-3 mt-8 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border rounded-lg transition-colors flex items-center"
              style={{
                borderColor: 'var(--color-gray-300)',
                color: 'var(--color-gray-700)',
                backgroundColor: 'var(--color-white)',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--color-gray-50)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--color-white)'}
            >
              <X size={18} className="mr-1" />
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white rounded-lg transition-colors flex items-center"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-white)'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary-dark)'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {isEdit ? 'Enregistrer les modifications' : 'Ajouter l\'employé'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeForm;
