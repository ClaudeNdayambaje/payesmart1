/**
 * Utilitaires pour gérer l'affichage et la manipulation des permissions
 * Ces fonctions aident à éviter l'erreur "Objects are not valid as React child"
 */

/**
 * Extrait le nom d'une permission en toute sécurité
 * @param permission - La permission à afficher (peut être un objet ou une chaîne)
 * @returns Le nom de la permission sous forme de chaîne de caractères
 */
export const getPermissionName = (permission: any): string => {
  if (permission === null || permission === undefined) {
    return 'Permission inconnue';
  }
  if (typeof permission === 'object') {
    return permission.name || permission.id || 'Permission';
  }
  if (typeof permission === 'string') {
    return permission;
  }
  return String(permission); // Conversion explicite en chaîne pour tout autre type
};

/**
 * Extrait la description d'une permission en toute sécurité
 * @param permission - La permission à afficher (peut être un objet ou une chaîne)
 * @returns La description de la permission sous forme de chaîne de caractères
 */
export const getPermissionDescription = (permission: any): string => {
  if (permission === null || permission === undefined) {
    return '';
  }
  if (typeof permission === 'object') {
    return permission.description || '';
  }
  if (typeof permission === 'string') {
    // Pour une permission string, on peut retourner la même valeur comme description
    return permission;
  }
  return ''; // Par défaut, pas de description
};

/**
 * Extrait l'ID d'une permission en toute sécurité
 * @param permission - La permission à identifier (peut être un objet ou une chaîne)
 * @returns L'ID de la permission sous forme de chaîne de caractères
 */
export const getPermissionId = (permission: any): string => {
  if (permission === null || permission === undefined) {
    return '';
  }
  if (typeof permission === 'object') {
    return permission.id || '';
  }
  if (typeof permission === 'string') {
    return permission;
  }
  return String(permission); // Conversion explicite en chaîne pour tout autre type
};

/**
 * Sécurise l'affichage d'une permission pour React
 * Garantit que la valeur retournée est toujours une chaîne, jamais un objet
 */
export const safePermissionRender = (permission: any): string => {
  if (permission === null || permission === undefined) {
    return '';
  }
  if (typeof permission === 'object') {
    return getPermissionName(permission);
  }
  return String(permission);
};

/**
 * Vérifie si une permission est dans une liste
 * @param permissionId - L'ID de la permission à rechercher
 * @param permissions - La liste des permissions à vérifier
 */
export const hasPermissionInList = (permissionId: string, permissions: any[]): boolean => {
  if (!Array.isArray(permissions)) {
    return false;
  }
  return permissions.some(permission => {
    if (typeof permission === 'string') {
      return permission === permissionId;
    }
    if (typeof permission === 'object' && permission !== null) {
      return permission.id === permissionId;
    }
    return false;
  });
};

/**
 * Vérifie si une permission est dans une liste
 * @param permissionId - L'ID de la permission à rechercher
 * @param permissions - La liste des permissions à vérifier
 * @returns true si la permission est dans la liste, false sinon
 */
export const hasPermission = (permissionId: string, permissions: any[]): boolean => {
  if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
    return false;
  }

  return permissions.some(perm => {
    if (typeof perm === 'object' && perm !== null) {
      return perm.id === permissionId;
    }
    return perm === permissionId;
  });
};

/**
 * Sécurise un tableau de permissions pour l'affichage
 * @param permissions - Le tableau de permissions à sécuriser
 * @returns Un tableau de chaînes contenant uniquement les noms des permissions
 */
export const safePermissionsArray = (permissions: any[]): string[] => {
  if (!permissions || !Array.isArray(permissions)) {
    return [];
  }
  
  return permissions.map(perm => getPermissionName(perm));
};
