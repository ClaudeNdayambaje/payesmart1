import { Employee, Permission } from '../types/index';
import { getPermissionName, getPermissionDescription } from '../utils/permissionUtils';

/**
 * Définit les permissions requises pour chaque vue de l'application
 */
export const VIEW_PERMISSIONS = {
  pos: 'pos',
  history: 'sales_history',
  orders: 'supplier_orders',
  promotions: 'promotions',
  employees: 'employee_management',
  stock: 'inventory_management',
  reports: 'reports',
  settings: 'settings',
  loyalty: 'manage_loyalty'
};

/**
 * Définit les permissions requises pour chaque action spécifique
 */
export const ACTION_PERMISSIONS = {
  // POS
  process_sale: 'process_sale',
  apply_discount: 'apply_discount',
  process_refund: 'process_refund',
  void_transaction: 'void_transaction',
  
  // Inventory
  add_product: 'add_product',
  edit_product: 'edit_product',
  delete_product: 'delete_product',
  adjust_stock: 'adjust_stock',
  
  // Employees
  add_employee: 'add_employee',
  edit_employee: 'edit_employee',
  delete_employee: 'delete_employee',
  manage_shifts: 'manage_shifts',
  
  // Reports
  view_sales_reports: 'view_sales_reports',
  view_inventory_reports: 'view_inventory_reports',
  view_employee_reports: 'view_employee_reports',
  export_reports: 'export_reports',
  
  // Settings
  manage_settings: 'manage_settings',
  manage_loyalty: 'manage_loyalty',
  manage_taxes: 'manage_taxes'
};

// Activer le mode débogage pour voir les logs détaillés
const DEBUG_PERMISSIONS = true;

/**
 * Vérifie si un employé a une permission spécifique
 */
export const hasPermission = (employee: Employee | null, permissionId: string): boolean => {
  if (!employee) {
    if (DEBUG_PERMISSIONS) console.log(`hasPermission: Aucun employé fourni pour vérifier la permission ${permissionId}`);
    return false;
  }
  
  // Les administrateurs ont toutes les permissions
  if (employee.role === 'admin') {
    if (DEBUG_PERMISSIONS) console.log(`hasPermission: L'employé ${employee.firstName} est admin, accès autorisé pour ${permissionId}`);
    return true;
  }
  
  // Vérifier que les permissions existent
  if (!employee.permissions || !Array.isArray(employee.permissions)) {
    console.error(`hasPermission: L'employé ${employee.firstName} n'a pas de permissions valides:`, employee.permissions);
    return false;
  }
  
  // Récupérer le businessId de l'employé
  const employeeBusinessId = employee.businessId || 'default';
  if (DEBUG_PERMISSIONS) {
    console.log(`hasPermission: Vérification de la permission ${permissionId} pour l'employé ${employee.firstName} (businessId: ${employeeBusinessId})`);
    console.log(`hasPermission: L'employé a ${employee.permissions.length} permissions`);
  }
  
  // Vérifier si l'employé a la permission spécifique
  const hasSpecificPermission = employee.permissions.some(permission => {
    // Si la permission est juste une chaîne (id), la comparer directement
    if (typeof permission === 'string') {
      const idMatch = permission === permissionId;
      if (DEBUG_PERMISSIONS && idMatch) {
        console.log(`hasPermission: Permission ${permissionId} trouvée (format string) pour ${employee.firstName}`);
      }
      return idMatch;
    }
    
    // Vérifier l'ID de la permission si c'est un objet
    const idMatch = permission.id === permissionId;
    
    // Vérifier également que le businessId correspond
    const businessIdMatch = !permission.businessId || 
                           permission.businessId === 'default' || 
                           permission.businessId === employeeBusinessId;
    
    // La permission est valide si l'ID correspond et que le businessId correspond
    const isValid = idMatch && businessIdMatch;
    
    if (DEBUG_PERMISSIONS && isValid) {
      console.log(`hasPermission: Permission ${permissionId} trouvée pour ${employee.firstName} (businessId: ${permission.businessId || 'default'})`);
    }
    
    return isValid;
  });
  
  if (DEBUG_PERMISSIONS) {
    if (hasSpecificPermission) {
      console.log(`hasPermission: L'employé ${employee.firstName} a la permission ${permissionId}`);
    } else {
      console.log(`hasPermission: L'employé ${employee.firstName} n'a PAS la permission ${permissionId}`);
      console.log('Permissions disponibles:', employee.permissions.map(p => typeof p === 'string' ? p : p.id).join(', '));
    }
  }
  
  return hasSpecificPermission;
};

/**
 * Vérifie si un employé a accès à une vue spécifique
 */
export const canAccessView = (employee: Employee | null, view: string): boolean => {
  if (!employee) return false;
  
  // Les administrateurs ont accès à toutes les vues
  if (employee.role === 'admin') {
    if (DEBUG_PERMISSIONS) console.log(`canAccessView: ${employee.firstName} est admin, accès autorisé pour ${view}`);
    return true;
  }
  
  // Accès minimal pour tous les employés (caisse)
  if (view === 'pos') {
    if (DEBUG_PERMISSIONS) console.log(`canAccessView: Accès minimal à la caisse pour ${employee.firstName}`);
    return true;
  }
  
  // Récupérer la permission requise pour la vue
  const requiredPermission = VIEW_PERMISSIONS[view as keyof typeof VIEW_PERMISSIONS];
  if (!requiredPermission) {
    console.warn(`Aucune permission définie pour la vue: ${view}`);
    return false;
  }
  
  // Vérifier si l'employé a la permission requise
  const hasAccess = hasPermission(employee, requiredPermission);
  
  if (DEBUG_PERMISSIONS) {
    console.log(`canAccessView: Vérification d'accès pour la vue: ${view}, employé: ${employee.firstName}, permission requise: ${requiredPermission}, accès: ${hasAccess}`);
    if (!hasAccess) {
      console.log(`canAccessView: Permissions de l'employé:`, employee.permissions.map(p => typeof p === 'string' ? p : p.id).join(', '));
    }
  }
  
  return hasAccess;
};

/**
 * Vérifie si un employé peut voir un élément spécifique dans un module
 * Utilisé pour les permissions partielles à l'intérieur d'un module
 */
export const canViewModuleItem = (employee: Employee | null, modulePermission: string, itemPermission: string): boolean => {
  if (!employee) return false;
  
  // Les administrateurs peuvent tout voir
  if (employee.role === 'admin') return true;
  
  // Vérifier d'abord si l'employé a accès au module
  if (!hasPermission(employee, modulePermission)) return false;
  
  // Ensuite vérifier s'il a l'autorisation spécifique pour cet élément
  return hasPermission(employee, itemPermission);
};

/**
 * Vérifie si un employé peut effectuer une action spécifique
 */
export const canPerformAction = (employee: Employee | null, action: string): boolean => {
  if (!employee) return false;
  
  // Les administrateurs peuvent effectuer toutes les actions
  if (employee.role === 'admin') return true;
  
  // Récupérer la permission requise pour l'action
  const requiredPermission = ACTION_PERMISSIONS[action as keyof typeof ACTION_PERMISSIONS];
  if (!requiredPermission) return false;
  
  // Vérifier si l'employé a la permission requise
  return hasPermission(employee, requiredPermission);
};

/**
 * Récupère toutes les permissions disponibles groupées par catégorie
 */
export const getAllPermissions = (): Permission[] => {
  // Créer les permissions de base sans businessId
  const basePermissions = [
    // Permissions POS
    { id: 'pos', name: 'Accès à la caisse', description: 'Permet d\'accéder au module de caisse', category: 'pos', level: 'read' },
    { id: 'process_sale', name: 'Effectuer une vente', description: 'Permet d\'effectuer des transactions de vente', category: 'pos', level: 'write' },
    { id: 'apply_discount', name: 'Appliquer des remises', description: 'Permet d\'appliquer des remises sur les ventes', category: 'pos', level: 'write' },
    { id: 'process_refund', name: 'Effectuer des remboursements', description: 'Permet de traiter les remboursements clients', category: 'pos', level: 'write' },
    { id: 'void_transaction', name: 'Annuler des transactions', description: 'Permet d\'annuler des transactions existantes', category: 'pos', level: 'admin' },
    { id: 'sales_history', name: 'Historique des ventes', description: 'Permet de consulter l\'historique des ventes', category: 'pos', level: 'read' },
    
    // Permissions Inventaire
    { id: 'inventory_management', name: 'Gestion du stock', description: 'Permet d\'accéder au module de gestion du stock', category: 'inventory', level: 'read' },
    { id: 'add_product', name: 'Ajouter des produits', description: 'Permet d\'ajouter de nouveaux produits', category: 'inventory', level: 'write' },
    { id: 'edit_product', name: 'Modifier des produits', description: 'Permet de modifier les produits existants', category: 'inventory', level: 'write' },
    { id: 'delete_product', name: 'Supprimer des produits', description: 'Permet de supprimer des produits', category: 'inventory', level: 'admin' },
    { id: 'adjust_stock', name: 'Ajuster le stock', description: 'Permet d\'ajuster les niveaux de stock', category: 'inventory', level: 'write' },
    { id: 'supplier_orders', name: 'Commandes fournisseurs', description: 'Permet de gérer les commandes fournisseurs', category: 'inventory', level: 'write' },
    
    // Permissions Employés
    { id: 'employee_management', name: 'Gestion des employés', description: 'Permet d\'accéder au module de gestion des employés', category: 'admin', level: 'read' },
    { id: 'add_employee', name: 'Ajouter des employés', description: 'Permet d\'ajouter de nouveaux employés', category: 'admin', level: 'write' },
    { id: 'edit_employee', name: 'Modifier des employés', description: 'Permet de modifier les employés existants', category: 'admin', level: 'write' },
    { id: 'delete_employee', name: 'Supprimer des employés', description: 'Permet de supprimer des employés', category: 'admin', level: 'admin' },
    { id: 'manage_shifts', name: 'Gérer les horaires', description: 'Permet de gérer les horaires des employés', category: 'admin', level: 'write' },
    
    // Permissions Rapports
    { id: 'reports', name: 'Rapports', description: 'Permet d\'accéder au module de rapports', category: 'reports', level: 'read' },
    { id: 'view_sales_reports', name: 'Rapports de ventes', description: 'Permet de consulter les rapports de ventes', category: 'reports', level: 'read' },
    { id: 'view_inventory_reports', name: 'Rapports d\'inventaire', description: 'Permet de consulter les rapports d\'inventaire', category: 'reports', level: 'read' },
    { id: 'view_employee_reports', name: 'Rapports d\'employés', description: 'Permet de consulter les rapports d\'employés', category: 'reports', level: 'read' },
    { id: 'export_reports', name: 'Exporter les rapports', description: 'Permet d\'exporter les rapports', category: 'reports', level: 'write' },
    
    // Permissions Paramètres
    { id: 'settings', name: 'Paramètres', description: 'Permet d\'accéder aux paramètres de l\'application', category: 'settings', level: 'read' },
    { id: 'manage_settings', name: 'Gérer les paramètres', description: 'Permet de modifier les paramètres de l\'application', category: 'settings', level: 'admin' },
    { id: 'promotions', name: 'Promotions', description: 'Permet de gérer les promotions', category: 'settings', level: 'write' },
    { id: 'manage_loyalty', name: 'Programme de fidélité', description: 'Permet de gérer le programme de fidélité', category: 'settings', level: 'write' },
    { id: 'manage_taxes', name: 'Gestion des taxes', description: 'Permet de gérer les paramètres de taxes', category: 'settings', level: 'admin' }
  ];
  
  // Utiliser un businessId par défaut pour les permissions
  // Cela sera remplacé par le vrai businessId lors de l'ajout d'un employé
  const defaultBusinessId = 'default';
  
  // Ajouter le businessId à chaque permission
  return basePermissions.map(permission => ({
    ...permission,
    businessId: defaultBusinessId
  })) as Permission[];
};

/**
 * Récupère les permissions par défaut pour un rôle spécifique
 */
export const getDefaultPermissionsForRole = (role: 'admin' | 'manager' | 'cashier'): Permission[] => {
  const allPermissions = getAllPermissions();
  
  // Admin a toutes les permissions
  if (role === 'admin') {
    return allPermissions;
  }
  
  // Permissions pour les managers
  if (role === 'manager') {
    return allPermissions.filter(p => 
      p.level !== 'admin' || 
      ['employee_management', 'inventory_management', 'reports', 'manage_shifts'].includes(p.id)
    );
  }
  
  // Permissions pour les caissiers
  return allPermissions.filter(p => 
    (p.category === 'pos' && p.id !== 'void_transaction') || 
    p.id === 'inventory_management' ||
    p.id === 'adjust_stock' ||
    p.id === 'process_refund' ||
    p.id === 'sales_history'
  );
};

/**
 * Récupère les permissions par défaut pour un rôle spécifique avec un businessId
 */
export const getDefaultPermissionsForRoleWithBusinessId = (role: 'admin' | 'manager' | 'cashier', businessId: string): Permission[] => {
  const allPermissions = getAllPermissions();
  
  // Ajouter le businessId à chaque permission
  const permissionsWithBusinessId = allPermissions.map(permission => ({
    ...permission,
    businessId
  }));
  
  // ===== ADMINISTRATEUR =====
  // L'administrateur dispose d'un accès complet à toutes les fonctionnalités du système
  if (role === 'admin') {
    return permissionsWithBusinessId;
  }
  
  // ===== GÉRANT =====
  // Le gérant a accès à la plupart des fonctionnalités, mais avec certaines restrictions administratives
  if (role === 'manager') {
    return permissionsWithBusinessId.filter(p => {
      // Permissions POS complètes
      if (p.category === 'pos') return true;
      
      // Gestion complète de l'inventaire
      if (p.category === 'inventory') return true;
      
      // Gestion limitée des employés (sauf supprimer des employés et gérer les paramètres admin)
      if (p.category === 'admin' && p.id !== 'delete_employee' && p.id !== 'manage_settings') return true;
      
      // Accès à tous les rapports
      if (p.category === 'reports') return true;
      
      // Pas d'accès aux paramètres avancés
      if (p.category === 'settings' && p.id !== 'manage_settings' && p.id !== 'manage_taxes') return false;
      
      return false;
    });
  }
  
  // ===== CAISSIER =====
  // Le caissier a un accès très limité, principalement aux fonctions de caisse
  return permissionsWithBusinessId.filter(p => {
    // Accès limité au module de caisse
    if (p.category === 'pos' && p.id !== 'void_transaction') return true;
    
    // Accès au programme de fidélité (uniquement création de cartes)
    if (p.id === 'manage_loyalty') return true;
    
    // Pas d'accès aux rapports
    if (p.category === 'reports') return false;
    
    // Pas d'accès aux paramètres
    if (p.category === 'settings') return false;
    
    // Pas d'accès à la gestion d'inventaire sauf consultation
    if (p.category === 'inventory' && p.id === 'inventory_management') return true;
    
    return false;
  });
};

/**
 * Affiche une permission de manière sécurisée
 */
export const formatPermission = (permission: any): string => {
  return getPermissionName(permission);
};

/**
 * Obtient la description d'une permission de manière sécurisée
 */
export const getPermissionInfo = (permission: any): string => {
  return getPermissionDescription(permission);
};
