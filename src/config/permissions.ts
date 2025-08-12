import { Permission } from '../types/index';

// Définition des modules disponibles dans l'application
export const appModules = [
  { id: 'pos', name: 'Caisse', description: 'Module de caisse et ventes' },
  { id: 'inventory', name: 'Inventaire', description: 'Gestion des produits et du stock' },
  { id: 'suppliers', name: 'Fournisseurs', description: 'Gestion des fournisseurs et commandes' },
  { id: 'employees', name: 'Employés', description: 'Gestion du personnel' },
  { id: 'reports', name: 'Rapports', description: 'Statistiques et analyses' },
  { id: 'settings', name: 'Paramètres', description: 'Configuration du système' },
  { id: 'promotions', name: 'Promotions', description: 'Gestion des promotions' },
  { id: 'loyalty', name: 'Fidélité', description: 'Gestion des cartes de fidélité' },
];

// Liste centralisée des permissions disponibles dans l'application
export const availablePermissions: Permission[] = [
  // Module Caisse
  { id: 'pos.access', name: 'Accès à la caisse', description: 'Permet d\'utiliser le module de caisse', category: 'pos', level: 'read', businessId: 'default' },
  { id: 'pos.refunds', name: 'Remboursements', description: 'Autoriser les remboursements', category: 'pos', level: 'write', businessId: 'default' },
  { id: 'pos.discounts', name: 'Remises', description: 'Appliquer des remises sur les ventes', category: 'pos', level: 'write', businessId: 'default' },
  { id: 'pos.void', name: 'Annulations', description: 'Annuler des transactions', category: 'pos', level: 'admin', businessId: 'default' },
  
  // Module Inventaire
  { id: 'inventory.view', name: 'Voir l\'inventaire', description: 'Consulter les produits et le stock', category: 'inventory', level: 'read', businessId: 'default' },
  { id: 'inventory.add', name: 'Ajouter des produits', description: 'Créer de nouveaux produits', category: 'inventory', level: 'write', businessId: 'default' },
  { id: 'inventory.edit', name: 'Modifier des produits', description: 'Modifier les informations des produits', category: 'inventory', level: 'write', businessId: 'default' },
  { id: 'inventory.delete', name: 'Supprimer des produits', description: 'Supprimer des produits de l\'inventaire', category: 'inventory', level: 'admin', businessId: 'default' },
  { id: 'inventory.adjust', name: 'Ajuster le stock', description: 'Modifier les quantités en stock', category: 'inventory', level: 'write', businessId: 'default' },
  
  // Module Fournisseurs
  { id: 'suppliers.view', name: 'Voir les fournisseurs', description: 'Consulter la liste des fournisseurs', category: 'suppliers', level: 'read', businessId: 'default' },
  { id: 'suppliers.add', name: 'Ajouter des fournisseurs', description: 'Créer de nouveaux fournisseurs', category: 'suppliers', level: 'write', businessId: 'default' },
  { id: 'suppliers.edit', name: 'Modifier des fournisseurs', description: 'Modifier les informations des fournisseurs', category: 'suppliers', level: 'write', businessId: 'default' },
  { id: 'suppliers.delete', name: 'Supprimer des fournisseurs', description: 'Supprimer des fournisseurs', category: 'suppliers', level: 'admin', businessId: 'default' },
  { id: 'suppliers.orders', name: 'Commandes fournisseurs', description: 'Gérer les commandes fournisseurs', category: 'suppliers', level: 'write', businessId: 'default' },
  
  // Module Employés
  { id: 'employees.view', name: 'Voir les employés', description: 'Consulter la liste des employés', category: 'employees', level: 'read', businessId: 'default' },
  { id: 'employees.add', name: 'Ajouter des employés', description: 'Créer de nouveaux employés', category: 'employees', level: 'admin', businessId: 'default' },
  { id: 'employees.edit', name: 'Modifier des employés', description: 'Modifier les informations des employés', category: 'employees', level: 'admin', businessId: 'default' },
  { id: 'employees.delete', name: 'Supprimer des employés', description: 'Supprimer des employés', category: 'employees', level: 'admin', businessId: 'default' },
  { id: 'employees.shifts', name: 'Gérer les horaires', description: 'Gérer les horaires de travail', category: 'employees', level: 'write', businessId: 'default' },
  { id: 'employees.change_own_password', name: 'Changer son propre mot de passe', description: 'Permettre aux employés de changer leur propre mot de passe', category: 'employees', level: 'read', businessId: 'default' },
  
  // Module Rapports
  { id: 'reports.sales', name: 'Rapports de ventes', description: 'Consulter les rapports de ventes', category: 'reports', level: 'read', businessId: 'default' },
  { id: 'reports.inventory', name: 'Rapports d\'inventaire', description: 'Consulter les rapports d\'inventaire', category: 'reports', level: 'read', businessId: 'default' },
  { id: 'reports.employees', name: 'Rapports d\'employés', description: 'Consulter les rapports sur les employés', category: 'reports', level: 'read', businessId: 'default' },
  { id: 'reports.financial', name: 'Rapports financiers', description: 'Consulter les rapports financiers', category: 'reports', level: 'admin', businessId: 'default' },
  { id: 'reports.export', name: 'Exporter les rapports', description: 'Exporter les rapports en différents formats', category: 'reports', level: 'write', businessId: 'default' },
  
  // Module Promotions
  { id: 'promotions.view', name: 'Voir les promotions', description: 'Consulter les promotions', category: 'promotions', level: 'read', businessId: 'default' },
  { id: 'promotions.add', name: 'Ajouter des promotions', description: 'Créer de nouvelles promotions', category: 'promotions', level: 'write', businessId: 'default' },
  { id: 'promotions.edit', name: 'Modifier des promotions', description: 'Modifier les informations des promotions', category: 'promotions', level: 'write', businessId: 'default' },
  { id: 'promotions.delete', name: 'Supprimer des promotions', description: 'Supprimer des promotions', category: 'promotions', level: 'admin', businessId: 'default' },
  
  // Module Fidélité
  { id: 'loyalty.view', name: 'Voir les cartes de fidélité', description: 'Consulter les cartes de fidélité', category: 'loyalty', level: 'read', businessId: 'default' },
  { id: 'loyalty.create_card', name: 'Créer des cartes de fidélité', description: 'Créer de nouvelles cartes de fidélité', category: 'loyalty', level: 'write', businessId: 'default' },
  { id: 'loyalty.edit_card', name: 'Modifier des cartes de fidélité', description: 'Modifier les informations des cartes de fidélité', category: 'loyalty', level: 'write', businessId: 'default' },
  { id: 'loyalty.delete_card', name: 'Supprimer des cartes de fidélité', description: 'Supprimer des cartes de fidélité', category: 'loyalty', level: 'admin', businessId: 'default' },
  { id: 'loyalty.settings', name: 'Paramètres de fidélité', description: 'Gérer les paramètres du programme de fidélité', category: 'loyalty', level: 'admin', businessId: 'default' },
  { id: 'loyalty.export', name: 'Exporter les données', description: 'Exporter les données de fidélité', category: 'loyalty', level: 'admin', businessId: 'default' },
  
  // Module Paramètres
  { id: 'settings.view', name: 'Voir les paramètres', description: 'Consulter les paramètres du système', category: 'settings', level: 'read', businessId: 'default' },
  { id: 'settings.edit', name: 'Modifier les paramètres', description: 'Modifier les paramètres du système', category: 'settings', level: 'admin', businessId: 'default' },
  { id: 'settings.taxes', name: 'Gérer les taxes', description: 'Configurer les taux de TVA', category: 'settings', level: 'admin', businessId: 'default' },
  { id: 'settings.payment', name: 'Méthodes de paiement', description: 'Configurer les méthodes de paiement', category: 'settings', level: 'admin', businessId: 'default' },
  { id: 'settings.backup', name: 'Sauvegardes', description: 'Gérer les sauvegardes du système', category: 'settings', level: 'admin', businessId: 'default' },
];

// Préréglages de permissions par rôle
export const rolePermissionPresets = {
  admin: availablePermissions.map(p => p.id), // Administrateur a toutes les permissions
  
  manager: availablePermissions
    .filter(p => {
      // Exclure certaines permissions administratives
      const excludedPermissions = [
        'settings.edit', 'settings.taxes', 'settings.payment', 'settings.backup',
        'employees.add', 'employees.edit', 'employees.delete',
        'inventory.delete'
      ];
      return !excludedPermissions.includes(p.id);
    })
    .map(p => p.id),
  
  cashier: availablePermissions
    .filter(p => {
      // Permissions spécifiques pour un caissier basées sur les sélections de l'utilisateur
      const includedPermissions = [
        // Module Caisse - Partiel
        'pos.access', 'pos.discounts',
        
        // Module Inventaire - Partiel (lecture seule)
        'inventory.view',
        
        // Module Fournisseurs - Partiel (lecture seule)
        'suppliers.view',
        
        // Module Employés - Modification mot de passe personnel uniquement
        'employees.change_own_password', 'employee_management',
        
        // Module Promotions - Lecture seule
        'promotions.view',
        
        // Module Fidélité - Création de cartes mais pas de modification des paramètres
        'loyalty.view', 'loyalty.create_card',
        
        // Lecture seule des historiques de vente
        'sales.history', 'sales.view',
        
        // Permissions d'accès aux vues principales
        'pos', 'sales_history', 'inventory_management', 'supplier_orders', 'employee_management',
        'promotions', 'manage_loyalty'
      ];
      
      return includedPermissions.includes(p.id);
    })
    .map(p => p.id)
};
