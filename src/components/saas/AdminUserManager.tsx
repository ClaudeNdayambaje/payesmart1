import React, { useState, useEffect, useRef } from 'react';
import { 
  addAdminUser, 
  updateAdminUser, 
  deleteAdminUser, 
  getAdminUsers,
  sendPasswordReset,
  getAvailableRoles,
  AdminUser
} from '../../services/adminUserService';

// Étendre l'interface AdminUser pour inclure le champ avatarBase64
type AdminUserWithBase64 = AdminUser & { avatarBase64?: string | null };
import { saveUserAvatarBase64 } from '../../services/avatarService';
import { createDefaultAdminUser } from '../../services/seedAdminUsers';
import { HiPlus, HiPencil, HiTrash, HiSearch, HiRefresh, HiMail, HiViewList, HiViewGrid, HiCamera, HiX, HiUserGroup, HiShieldCheck, HiUserAdd } from 'react-icons/hi';

const AdminUserManager: React.FC = () => {
  // États
  const [users, setUsers] = useState<AdminUserWithBase64[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<AdminUserWithBase64> | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  // Variables pour la prévisualisation d'avatar
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // États pour les KPI
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    newUsersThisMonth: 0,
    lastCreatedUser: null as AdminUser | null,
  });

  // Récupérer les utilisateurs au chargement du composant
  useEffect(() => {
    fetchUsers();
  }, []);
  
  // Calculer les statistiques utilisateur
  useEffect(() => {
    if (users.length > 0) {
      // Obtenir la date du début du mois courant
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // Calculer les statistiques
      const activeUsers = users.filter(user => user.active).length;
      const adminUsers = users.filter(user => user.role.toLowerCase().includes('admin')).length;
      
      // Compter les utilisateurs créés ce mois-ci
      const newUsersThisMonth = users.filter(user => {
        if (user.createdAt) {
          const createdDate = user.createdAt instanceof Date 
            ? user.createdAt 
            : new Date(user.createdAt);
          return createdDate >= startOfMonth;
        }
        return false;
      }).length;
      
      // Trouver l'utilisateur créé le plus récemment
      const sortedUsers = [...users].sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt || 0);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
      
      const lastCreatedUser = sortedUsers.length > 0 ? sortedUsers[0] : null;
      
      // Mettre à jour les statistiques
      setUserStats({
        totalUsers: users.length,
        activeUsers,
        adminUsers,
        newUsersThisMonth,
        lastCreatedUser,
      });
    }
  }, [users]);

  // Filtrer les utilisateurs lorsque le terme de recherche change
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const lowercasedTerm = searchTerm.toLowerCase();
      const filtered = users.filter(user => 
        user.firstName.toLowerCase().includes(lowercasedTerm) ||
        user.lastName.toLowerCase().includes(lowercasedTerm) ||
        user.email.toLowerCase().includes(lowercasedTerm) ||
        user.role.toLowerCase().includes(lowercasedTerm)
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  // Récupérer les utilisateurs depuis Firestore
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Récupérer les utilisateurs existants
      let fetchedUsers = await getAdminUsers();
      console.log('Utilisateurs récupérés:', fetchedUsers);
      
      // Si aucun utilisateur n'est trouvé, créer un utilisateur administrateur par défaut
      if (fetchedUsers.length === 0) {
        console.log('Aucun utilisateur trouvé, création d\'un utilisateur par défaut...');
        const created = await createDefaultAdminUser();
        
        if (created) {
          console.log('Utilisateur par défaut créé, récupération des utilisateurs...');
          // Récupérer à nouveau les utilisateurs après la création
          fetchedUsers = await getAdminUsers();
          console.log('Utilisateurs après création:', fetchedUsers);
        } else {
          console.warn('Impossible de créer l\'utilisateur par défaut');
        }
      }
      
      // Vérifier si les utilisateurs ont des avatarUrl
      fetchedUsers.forEach(user => {
        console.log(`Utilisateur ${user.firstName} ${user.lastName} (${user.id}):`, user.avatarUrl || 'Pas d\'avatar');
      });
      
      setUsers(fetchedUsers);
      setFilteredUsers(fetchedUsers);
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      setError('Erreur lors de la récupération des utilisateurs');
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction d'aide pour gérer l'upload d'avatar de manière robuste
  // Utilise l'approche base64 pour éviter les problèmes CORS avec Firebase Storage
  const handleAvatarUpload = async (userId: string, file: File): Promise<{avatarUrl: string | null, avatarBase64: string | null}> => {
    if (!file || file.size === 0) {
      console.error('Fichier avatar invalide ou vide');
      return { avatarUrl: null, avatarBase64: null };
    }
    
    try {
      setIsUploadingAvatar(true);
      setSuccessMessage('Upload de l\'avatar en cours...');
      
      // Étape 1: Valider le fichier avant l'upload
      if (!file.type.startsWith('image/')) {
        throw new Error('Le fichier doit être une image');
      }
      
      if (file.size > 2 * 1024 * 1024) { // Limite à 2MB pour le stockage en base64
        throw new Error('L\'image ne doit pas dépasser 2MB pour le stockage en base64');
      }
      
      // Étape 2: Convertir le fichier en DataURL (base64)
      console.log('Conversion du fichier en base64...');
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Impossible de lire le fichier comme DataURL'));
          }
        };
        reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
        reader.readAsDataURL(file);
      });
      
      console.log('Fichier converti en base64 avec succès, longueur:', dataUrl.length);
      
      // Étape 3: Vérifier que l'image est valide
      try {
        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            console.log('Image validée avec succès, dimensions:', img.width, 'x', img.height);
            resolve();
          };
          img.onerror = () => reject(new Error('Le fichier n\'est pas une image valide'));
          img.src = dataUrl;
          
          // Timeout de sécurité
          setTimeout(() => reject(new Error('Timeout lors du chargement de l\'image')), 5000);
        });
      } catch (imageError: any) {
        console.error('Erreur lors de la validation de l\'image:', imageError);
        throw new Error(`L'image n'est pas valide: ${imageError.message}`);
      }
      
      // Étape 4: Enregistrer l'avatar en base64 dans Firestore
      console.log('Début de l\'enregistrement de l\'avatar en base64 pour l\'utilisateur:', userId);
      const success = await saveUserAvatarBase64(userId, dataUrl);
      
      if (!success) {
        throw new Error('Erreur lors de l\'enregistrement de l\'avatar en base64');
      }
      
      console.log('Avatar enregistré avec succès en base64');
      
      // Générer une URL fictive avec timestamp pour forcer le rafraîchissement
      const timestamp = Date.now();
      const avatarUrl = `data:image/base64;${timestamp}`;
      
      return { avatarUrl, avatarBase64: dataUrl };
    } catch (error: any) {
      console.error('Erreur lors de l\'upload de l\'avatar:', error);
      setError(`Erreur lors de l'upload de l'avatar: ${error.message}`);
      return { avatarUrl: null, avatarBase64: null };
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Ouvrir le modal pour ajouter un nouvel utilisateur
  const handleAddUser = () => {
    setCurrentUser({
      email: '',
      firstName: '',
      lastName: '',
      role: 'admin',
      active: true
    });
    setPassword('');
    setConfirmPassword('');
    setError('');
    setIsModalOpen(true);
  };

  // Ouvrir le modal pour modifier un utilisateur existant
  const handleEditUser = (user: AdminUser) => {
    console.log('Modification de l\'utilisateur:', user);
    console.log('Avatar URL de l\'utilisateur:', user.avatarUrl || 'Pas d\'avatar');
    
    // Vérifier si l'avatar est correctement enregistré sur Firebase
    // Les avatars sont maintenant stockés en base64 directement dans Firestore
    // Pas besoin de vérifier l'existence sur Firebase Storage
    
    setCurrentUser(user);
    setAvatarPreview(user.avatarUrl || null);
    setIsModalOpen(true);
  };

  // Ouvrir le modal de confirmation de suppression
  const handleDeleteUserConfirmation = (user: AdminUser) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  // Supprimer un utilisateur
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsLoading(true);
    try {
      const success = await deleteAdminUser(userToDelete.id);
      if (success) {
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userToDelete.id));
        setSuccessMessage(`L'utilisateur ${userToDelete.firstName} ${userToDelete.lastName} a été supprimé avec succès`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError('Erreur lors de la suppression de l\'utilisateur');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      setError('Erreur lors de la suppression de l\'utilisateur');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  // Envoyer un email de réinitialisation de mot de passe
  const handleSendPasswordReset = async (email: string) => {
    setIsLoading(true);
    try {
      const success = await sendPasswordReset(email);
      if (success) {
        setSuccessMessage(`Un email de réinitialisation de mot de passe a été envoyé à ${email}`);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError('Erreur lors de l\'envoi de l\'email de réinitialisation');
        setTimeout(() => setError(''), 3000);
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email de réinitialisation:', error);
      setError('Erreur lors de l\'envoi de l\'email de réinitialisation');
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Gérer la sélection et la validation d'un avatar
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      // Réinitialiser les états
      setError('');
      setAvatarFile(null);
      setAvatarPreview(null);
      
      // Récupérer le fichier sélectionné
      const file = e.target.files?.[0];
      if (!file) {
        console.log('Aucun fichier sélectionné');
        return;
      }
      
      console.log('Fichier sélectionné:', file.name);
      console.log('Type de fichier:', file.type);
      console.log('Taille du fichier:', file.size);
      
      // Étape 1: Vérifier que le fichier est une image
      if (!file.type.startsWith('image/')) {
        setError('Le fichier doit être une image (jpg, png, etc.)');
        return;
      }
      
      // Étape 2: Vérifier la taille du fichier
      if (file.size > 5 * 1024 * 1024) {
        setError('L\'image ne doit pas dépasser 5MB');
        return;
      }
      
      // Étape 3: Créer une copie du fichier avec un nom unique
      const timestamp = Date.now();
      const fileExtension = file.type.split('/')[1] || 'jpg';
      const newFileName = `avatar_${timestamp}.${fileExtension}`;
      
      // Étape 4: Convertir le fichier en DataURL pour la prévisualisation et la validation
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              resolve(reader.result);
            } else {
              reject(new Error('Impossible de lire le fichier comme DataURL'));
            }
          };
          reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
          reader.readAsDataURL(file);
        });
        
        console.log('Fichier converti en DataURL avec succès, longueur:', dataUrl.length);
        
        // Stocker la prévisualisation
        setAvatarPreview(dataUrl);
        
        // Étape 5: Valider que l'image peut être chargée correctement
        try {
          await new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              console.log('Image validée avec succès, dimensions:', img.width, 'x', img.height);
              resolve();
            };
            img.onerror = () => reject(new Error('Le fichier n\'est pas une image valide'));
            img.src = dataUrl;
            
            // Timeout de sécurité
            setTimeout(() => reject(new Error('Timeout lors du chargement de l\'image')), 5000);
          });
        } catch (imageError: any) {
          console.error('Erreur lors de la validation de l\'image:', imageError);
          setError(`L'image n'est pas valide: ${imageError.message}`);
          return;
        }
        
        // Étape 6: Créer un blob à partir de la DataURL
        try {
          const response = await fetch(dataUrl);
          const blob = await response.blob();
          
          if (blob.size === 0) {
            throw new Error('Le blob généré est vide');
          }
          
          // Créer un nouveau fichier à partir du blob
          const validFile = new File([blob], newFileName, { type: blob.type });
          console.log('Fichier validé créé avec succès, taille:', validFile.size);
          
          // Stocker le fichier pour l'upload ultérieur
          setAvatarFile(validFile);
        } catch (blobError: any) {
          console.error('Erreur lors de la création du blob:', blobError);
          setError(`Erreur lors de la préparation de l'image: ${blobError.message}`);
          return;
        }
      } catch (readError: any) {
        console.error('Erreur lors de la lecture du fichier:', readError);
        setError(`Erreur lors de la lecture du fichier: ${readError.message}`);
        return;
      }
    } catch (error: any) {
      console.error('Erreur globale lors du traitement de l\'avatar:', error);
      setError(`Erreur lors du traitement de l'image: ${error.message}`);
    }
  };
  
  // Supprimer l'avatar sélectionné
  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Soumettre le formulaire d'ajout/modification d'utilisateur
  const handleSubmitUserForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    // Vérifier si déjà en cours de traitement pour éviter les soumissions multiples
    if (isLoading) {
      console.log('Traitement déjà en cours, soumission ignorée');
      return;
    }
    
    if (!currentUser) {
      console.error('Aucun utilisateur sélectionné');
      return;
    }
    
    // Étape 1: Valider les champs obligatoires
    if (!currentUser.email || !currentUser.firstName || !currentUser.lastName || !currentUser.role) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    // Étape 2: Valider les mots de passe pour les nouveaux utilisateurs
    if (!currentUser.id && password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('Début du traitement du formulaire utilisateur...');
      
      let updatedUser: AdminUser | null = null;
      
      // Étape 3: Traiter l'utilisateur selon qu'il s'agit d'une création ou d'une mise à jour
      if (currentUser.id) {
        // Mise à jour d'un utilisateur existant
        console.log('Mise à jour de l\'utilisateur existant:', currentUser.id);
        
        try {
          // Préparer les données à mettre à jour (sans email pour éviter l'erreur)
          const userData = {
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            role: currentUser.role as any,
            active: currentUser.active !== undefined ? currentUser.active : true,
          };
          
          const success = await updateAdminUser(currentUser.id, userData);
          
          if (!success) {
            throw new Error('Erreur lors de la mise à jour de l\'utilisateur');
          }
          
          console.log('Utilisateur mis à jour avec succès dans Firestore');
          
          // Étape 4: Gérer l'upload de l'avatar si nécessaire
          if (avatarFile) {
            const result = await handleAvatarUpload(currentUser.id, avatarFile);
            
            if (result.avatarUrl && result.avatarBase64) {
              console.log('Avatar uploadé avec succès:', result.avatarUrl);
              
              // Ajouter l'URL de l'avatar aux données de l'utilisateur
              if (updatedUser && currentUser.id) {
                // Créer une nouvelle référence avec typage explicite
                const userCopy = Object.assign({}, updatedUser) as AdminUser & { avatarBase64?: string | null };
                userCopy.avatarUrl = result.avatarUrl;
                userCopy.avatarBase64 = result.avatarBase64;
                updatedUser = userCopy;
              }
              
              // Synchroniser avec l'employé actuel dans le localStorage si c'est le même utilisateur
              const savedEmployee = localStorage.getItem('currentEmployee');
              if (savedEmployee) {
                try {
                  const parsedEmployee = JSON.parse(savedEmployee) as { email: string; id?: string };
                  if (updatedUser && 'email' in updatedUser && parsedEmployee.email === updatedUser.email) {
                    // Mettre à jour l'avatar dans l'objet Employee
                    // Vérifier que parsedEmployee est un objet avant d'utiliser le spread operator
                    const updatedEmployee = typeof parsedEmployee === 'object' && parsedEmployee !== null ? { 
                      ...parsedEmployee, 
                      avatarBase64: result.avatarBase64,
                      avatarUrl: result.avatarUrl
                    } : parsedEmployee;
                    localStorage.setItem('currentEmployee', JSON.stringify(updatedEmployee));
                    console.log('Avatar synchronisé avec l\'utilisateur connecté');
                    
                    // Publier un événement personnalisé pour notifier que l'avatar de l'utilisateur a été mis à jour
                    const avatarUpdateEvent = new CustomEvent('avatarUpdated', {
                      detail: {
                        employeeId: parsedEmployee.id || 'unknown',
                        avatarBase64: result.avatarBase64,
                        timestamp: Date.now()
                      }
                    });
                    document.dispatchEvent(avatarUpdateEvent);
                    console.log('Événement avatarUpdated émis avec succès');
                    
                    // Force le rechargement de la page pour appliquer les changements à la barre latérale
                    // Attendre un peu plus longtemps pour s'assurer que les événements ont le temps d'être traités
                    setTimeout(() => window.location.reload(), 1500);
                  }
                } catch (error) {
                  console.error('Erreur lors de la synchronisation avec l\'employé actuel:', error);
                }
              }
            } else {
              console.warn('Échec de l\'upload de l\'avatar');
            }
          }
          
          // Forcer le rafraîchissement des utilisateurs
          await fetchUsers();
          
          // Fermer le modal et réinitialiser les états
          setIsModalOpen(false);
          setCurrentUser(null);
          setPassword('');
          setConfirmPassword('');
          setAvatarFile(null);
          setAvatarPreview(null);
          
          // Réinitialiser le champ de fichier
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } catch (updateError: any) {
          console.error('Erreur lors de la mise à jour:', updateError);
          throw updateError; // Propager l'erreur pour qu'elle soit gérée dans le bloc catch principal
        }
      } else {
        // Création d'un nouvel utilisateur
        try {
          console.log('Création d\'un nouvel utilisateur');
          updatedUser = await addAdminUser({
            email: currentUser.email,
            firstName: currentUser.firstName,
            lastName: currentUser.lastName,
            role: currentUser.role as any,
            active: currentUser.active !== undefined ? currentUser.active : true,
          }, password);
          
          if (!updatedUser) {
            throw new Error('Erreur lors de la création de l\'utilisateur');
          }
          
          console.log('Nouvel utilisateur créé avec succès:', updatedUser.id);
          
          // Étape 4: Gérer l'upload de l'avatar si nécessaire
          if (avatarFile) {
            const result = await handleAvatarUpload(updatedUser.id, avatarFile);
            
            if (result.avatarUrl && result.avatarBase64) {
              console.log('Avatar uploadé avec succès:', result.avatarUrl);
              
              // Ajouter l'URL de l'avatar aux données de l'utilisateur
              if (updatedUser && updatedUser.id) {
                updatedUser = { 
                  ...updatedUser, 
                  avatarUrl: result.avatarUrl, 
                  avatarBase64: result.avatarBase64 
                };
              }
            } else {
              console.warn('Échec de l\'upload de l\'avatar');
            }
          }
          
          // Forcer le rafraîchissement des utilisateurs
          await fetchUsers();
          
          // Fermer le modal et réinitialiser les états
          setIsModalOpen(false);
          setCurrentUser(null);
          setPassword('');
          setConfirmPassword('');
          setAvatarFile(null);
          setAvatarPreview(null);
          
          // Réinitialiser le champ de fichier
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        } catch (createError: any) {
          console.error('Erreur lors de la création:', createError);
          throw createError; // Propager l'erreur pour qu'elle soit gérée dans le bloc catch principal
        }
      }
    } catch (error: any) {
      console.error('Erreur lors de la soumission du formulaire:', error);
      setError(error.message || 'Une erreur est survenue lors de la soumission du formulaire');
    } finally {
      // S'assurer que l'indicateur de chargement est désactivé quoi qu'il arrive
      console.log('Fin du traitement, réinitialisation de l\'indicateur de chargement');
      setIsLoading(false);
    }
  };
  
  // Obtenir les rôles disponibles
  const availableRoles = getAvailableRoles();

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
      {/* Message de succès */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-md flex justify-between items-center">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="text-green-700">
            <HiX className="h-5 w-5" />
          </button>
        </div>
      )}
      
      {/* Message d'erreur */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-700">
            <HiX className="h-5 w-5" />
          </button>
        </div>
      )}
      
      {/* En-tête */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestion des Utilisateurs</h2>
          <p className="text-gray-500 mt-1">Gérez les utilisateurs qui ont accès à PayeSmart Administration</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}
              title="Vue liste"
            >
              <HiViewList className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}
              title="Vue carte"
            >
              <HiViewGrid className="h-5 w-5" />
            </button>
          </div>
          
          <button
            onClick={fetchUsers}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <HiRefresh className="h-4 w-4" />
            <span>Actualiser</span>
          </button>
          
          <button
            onClick={handleAddUser}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <HiPlus className="h-4 w-4" />
            <span>Ajouter</span>
          </button>
        </div>
      </div>
      
      {/* KPI Dashboard */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total des utilisateurs */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-600 mr-4">
              <HiUserGroup className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total des utilisateurs</p>
              <p className="text-2xl font-semibold">{userStats.totalUsers}</p>
            </div>
          </div>
        </div>
        
        {/* Utilisateurs actifs */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <HiShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Utilisateurs actifs</p>
              <p className="text-2xl font-semibold">{userStats.activeUsers}</p>
              <p className="text-xs text-gray-500">
                {userStats.totalUsers > 0 
                  ? `${Math.round((userStats.activeUsers / userStats.totalUsers) * 100)}% du total` 
                  : '0% du total'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Administrateurs */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <HiShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Administrateurs</p>
              <p className="text-2xl font-semibold">{userStats.adminUsers}</p>
              <p className="text-xs text-gray-500">
                {userStats.totalUsers > 0 
                  ? `${Math.round((userStats.adminUsers / userStats.totalUsers) * 100)}% du total` 
                  : '0% du total'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Nouveaux utilisateurs ce mois */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
              <HiUserAdd className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Nouveaux ce mois</p>
              <p className="text-2xl font-semibold">{userStats.newUsersThisMonth}</p>
              {userStats.lastCreatedUser && (
                <p className="text-xs text-gray-500">
                  Dernier: {userStats.lastCreatedUser.firstName} {userStats.lastCreatedUser.lastName}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Vue en liste */}
      {viewMode === 'list' && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dernière connexion
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                      <span className="ml-2">Chargement...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.avatarBase64 ? (
                            <img 
                              className="h-10 w-10 rounded-full object-cover border border-gray-200" 
                              src={user.avatarBase64} 
                              alt={`${user.firstName} ${user.lastName}`}
                              onError={(e) => {
                                console.error('Erreur de chargement d\'image:', e);
                                // Remplacer par les initiales en cas d'erreur
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).parentElement!.innerHTML = `
                                  <div class="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                    <span class="text-indigo-800 font-medium">
                                      ${user.firstName.charAt(0)}${user.lastName.charAt(0)}
                                    </span>
                                  </div>
                                `;
                              }}
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-indigo-800 font-medium">
                                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            Créé le {user.createdAt.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {availableRoles.find(role => role.id === user.role)?.name || user.role}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.lastLogin 
                        ? user.lastLogin.toLocaleDateString() + ' ' + user.lastLogin.toLocaleTimeString() 
                        : 'Jamais connecté'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleSendPasswordReset(user.email)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Envoyer un email de réinitialisation de mot de passe"
                        >
                          <HiMail className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Modifier"
                        >
                          <HiPencil className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUserConfirmation(user)}
                          className="text-red-600 hover:text-red-900"
                          title="Supprimer"
                        >
                          <HiTrash className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Vue en grille */}
      {viewMode === 'grid' && (
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${isLoading ? 'items-center justify-center' : ''}`}>
          {isLoading ? (
            <div className="col-span-full flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              <span className="ml-3 text-lg">Chargement...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              Aucun utilisateur trouvé
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
                <div className="p-6">
                  <div className="flex items-center justify-center mb-4">
                    {/* Vérifier d'abord s'il y a un avatar en base64 */}
                    {(user as any).avatarBase64 ? (
                      <img 
                        className="h-20 w-20 rounded-full object-cover border border-gray-200" 
                        src={(user as any).avatarBase64}
                        alt={`${user.firstName} ${user.lastName}`}
                        onError={(e) => {
                          console.error('Erreur de chargement de l\'avatar base64:', e);
                          // Essayer avec l'URL de l'avatar en cas d'erreur
                          if (user.avatarUrl) {
                            (e.target as HTMLImageElement).src = `${user.avatarUrl}${user.avatarUrl.includes('?') ? '&' : '?'}refresh=${Date.now()}`;
                          } else {
                            // Si pas d'URL non plus, afficher les initiales
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.innerHTML = `
                              <div class="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span class="text-indigo-800 font-medium text-xl">
                                  ${user.firstName.charAt(0)}${user.lastName.charAt(0)}
                                </span>
                              </div>
                            `;
                          }
                        }}
                      />
                    ) : user.avatarUrl ? (
                      <img 
                        className="h-20 w-20 rounded-full object-cover border border-gray-200" 
                        src={`${user.avatarUrl}${user.avatarUrl.includes('?') ? '&' : '?'}refresh=${Date.now()}`} 
                        alt={`${user.firstName} ${user.lastName}`}
                        onError={(e) => {
                          console.error('Erreur de chargement d\'image URL:', e);
                          // Remplacer par les initiales en cas d'erreur
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = `
                            <div class="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span class="text-indigo-800 font-medium text-xl">
                                ${user.firstName.charAt(0)}${user.lastName.charAt(0)}
                              </span>
                            </div>
                          `;
                        }}
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-indigo-800 font-medium text-xl">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">{user.firstName} {user.lastName}</h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Rôle:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {availableRoles.find(role => role.id === user.role)?.name || user.role}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Statut:</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.active ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Créé le:</span>
                      <span className="text-sm text-gray-900">{user.createdAt.toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Dernière connexion:</span>
                      <span className="text-sm text-gray-900">
                        {user.lastLogin 
                          ? user.lastLogin.toLocaleDateString()
                          : 'Jamais connecté'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                  <div className="flex justify-between">
                    <button
                      onClick={() => handleSendPasswordReset(user.email)}
                      className="text-indigo-600 hover:text-indigo-900 p-1"
                      title="Envoyer un email de réinitialisation de mot de passe"
                    >
                      <HiMail className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleEditUser(user)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      title="Modifier"
                    >
                      <HiPencil className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteUserConfirmation(user)}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Supprimer"
                    >
                      <HiTrash className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      
      {/* Modal d'ajout/modification d'utilisateur */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {currentUser?.id ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}
              </h3>
              
              <form onSubmit={handleSubmitUserForm}>
                {/* Avatar upload */}
                <div className="mb-6 flex flex-col items-center">
                  <div className="relative mb-3">
                    {isUploadingAvatar && (
                      <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10 rounded-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                      </div>
                    )}
                    {avatarPreview || currentUser?.avatarBase64 ? (
                      <div className="relative">
                        <img 
                          src={avatarPreview || currentUser?.avatarBase64} 
                          alt="Avatar" 
                          className="h-24 w-24 rounded-full object-cover border-2 border-indigo-100"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                          title="Supprimer l'avatar"
                        >
                          <HiX className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-indigo-800 font-medium text-xl">
                          {currentUser?.firstName?.charAt(0) || ''}
                          {currentUser?.lastName?.charAt(0) || ''}
                        </span>
                      </div>
                    )}
                    
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-indigo-600 text-white rounded-full p-2 hover:bg-indigo-700 transition-colors"
                      title="Changer l'avatar"
                      disabled={isUploadingAvatar}
                    >
                      <HiCamera className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  <span className="text-sm text-gray-500">
                    Cliquez sur l'icône de caméra pour changer l'avatar
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={currentUser?.email || ''}
                      onChange={(e) => setCurrentUser({...currentUser, email: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required
                      disabled={!!currentUser?.id}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                      Prénom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      value={currentUser?.firstName || ''}
                      onChange={(e) => setCurrentUser({...currentUser, firstName: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                      Nom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      value={currentUser?.lastName || ''}
                      onChange={(e) => setCurrentUser({...currentUser, lastName: e.target.value})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                      Rôle <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="role"
                      value={currentUser?.role || 'admin'}
                      onChange={(e) => setCurrentUser({...currentUser, role: e.target.value as any})}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    >
                      {availableRoles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name} - {role.description}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {!currentUser?.id && (
                    <>
                      <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                          Mot de passe <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          id="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          required={!currentUser?.id}
                          minLength={6}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                          Confirmer le mot de passe <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          id="confirmPassword"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          required={!currentUser?.id}
                        />
                      </div>
                    </>
                  )}
                  
                  <div>
                    <label htmlFor="active" className="flex items-center">
                      <input
                        type="checkbox"
                        id="active"
                        checked={currentUser?.active || false}
                        onChange={(e) => setCurrentUser({...currentUser, active: e.target.checked})}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">Utilisateur actif</span>
                    </label>
                  </div>
                </div>
                
                {error && (
                  <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        <span>Traitement...</span>
                      </div>
                    ) : currentUser?.id ? 'Mettre à jour' : 'Ajouter'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de confirmation de suppression */}
      {isDeleteModalOpen && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmer la suppression</h3>
              <p className="text-gray-500 mb-6">
                Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{userToDelete.firstName} {userToDelete.lastName}</strong> ? Cette action est irréversible.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleDeleteUser}
                  className="bg-red-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      <span>Traitement...</span>
                    </div>
                  ) : 'Supprimer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManager;
