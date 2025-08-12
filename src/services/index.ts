// Fichier d'exportation centralisé pour tous les services
// Cela garantit que toutes les fonctions sont correctement exportées et disponibles lors du build

// Export des services de commandes fournisseurs - import et export explicites
import { 
  getSupplierOrders,
  getSupplierOrderById,
  addSupplierOrder,
  updateSupplierOrderStatus,
  receiveSupplierOrder,
  deleteSupplierOrder,
  updateSupplierOrder
} from './supplierOrderService';

// Exportation explicite des fonctions
export {
  getSupplierOrders,
  getSupplierOrderById,
  addSupplierOrder,
  updateSupplierOrderStatus,
  receiveSupplierOrder,
  deleteSupplierOrder,
  updateSupplierOrder
};

// Note: Nous ne réexportons pas les autres services de manière générique pour éviter les conflits
// Au besoin, importer directement des fichiers spécifiques
