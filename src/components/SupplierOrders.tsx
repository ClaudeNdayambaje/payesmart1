import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { emitEvent } from '../services/eventService';
import { SupplierOrder } from '../types';
import { getSupplierOrders, receiveSupplierOrder, updateSupplierOrderStatus, deleteSupplierOrder } from '../services';
import { format } from 'date-fns';
import { 
  PackagePlus, 
  Loader2, 
  Clock,
  CheckCircle,
  Package,
  HelpCircle,
  MoreVertical,
  Trash2,
  Edit,
  Grid,
  List,
  Calendar,
  ChevronDown
} from 'lucide-react';
import { Button } from "../components/ui/button";

interface SupplierOrdersProps {
  onCreateOrder: (onSuccess?: () => void) => void;
  onEditOrder?: (orderId: string, onSuccess?: () => void) => void;
  hasPermission: (permission: string) => boolean;
}

const SupplierOrders: React.FC<SupplierOrdersProps> = ({ onCreateOrder, onEditOrder, hasPermission }) => {
  // Référence pour savoir si le composant est monté
  const isMounted = React.useRef(true);

  // Nettoyer la référence au démontage
  React.useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // États
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<SupplierOrder['status'] | null>(null);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [statusUpdateModalOpen, setStatusUpdateModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  // Pas besoin de stocker le businessId en état car il est récupéré à la demande

  // Récupérer les commandes fournisseurs

  // Charger les commandes fournisseurs
  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fetchedOrders = await getSupplierOrders();
      
      if (isMounted.current) {
        setOrders(fetchedOrders);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des commandes:', err);
      if (isMounted.current) {
        setError('Impossible de charger les commandes fournisseurs. Veuillez réessayer.');
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []);

  // Charger les commandes au montage et lors du rafraîchissement
  useEffect(() => {
    loadOrders();
  }, [loadOrders, refreshKey]);

  // Formater la date
  const formatDate = (date: Date) => {
    return format(date, 'dd/MM/yyyy');
  };

  // Formater le montant
  const formatAmount = (amount: number) => {
    return `${amount.toFixed(2)} €`;
  };

  // Trier et filtrer les commandes
  const sortedAndFilteredOrders = useMemo(() => {
    // Cloner les commandes
    let filtered = [...orders];
    
    // Filtrer par statut si nécessaire
    if (filterStatus) {
      filtered = filtered.filter(order => order.status === filterStatus);
    }
    
    // Trier les commandes par date (du plus récent au plus ancien)
    filtered.sort((a, b) => {
      return b.orderDate.getTime() - a.orderDate.getTime();
    });
    
    return filtered;
  }, [orders, filterStatus]);

  // Rafraîchir les commandes
  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  // Obtenir l'icône en fonction du statut
  const getStatusIcon = (status: SupplierOrder['status']) => {
    switch (status) {
      case 'pending':
        return <Clock size={14} className="mr-1" />;
      case 'confirmed':
        return <CheckCircle size={14} className="mr-1" />;
      case 'delivered':
        return <Package size={14} className="mr-1" />;
      default:
        return <HelpCircle size={14} className="mr-1" />;
    }
  };

  // Obtenir le texte du statut
  const getStatusText = (status: SupplierOrder['status']) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'confirmed':
        return 'Confirmée';
      case 'delivered':
        return 'Livrée';
      default:
        return 'Inconnu';
    }
  };

  // Réceptionner une commande
  const handleReceiveOrder = async (orderId: string) => {
    try {
      setProcessingOrderId(orderId);
      setError(null);
      
      const success = await receiveSupplierOrder(orderId);
      
      if (success) {
        handleRefresh();
        // Émettre un événement pour notifier l'application que les stocks ont été mis à jour
        // et qu'il faut revenir à la page Caisse
        emitEvent('stockUpdated', {
          source: 'supplierOrderReceived',
          orderId,
          timestamp: new Date().getTime(),
          navigateTo: 'pos'
        });
      } else {
        setError('Impossible de réceptionner la commande. Veuillez réessayer.');
      }
    } catch (err) {
      console.error('Erreur lors de la réception de la commande:', err);
      setError('Une erreur s\'est produite lors de la réception de la commande.');
    } finally {
      setProcessingOrderId(null);
    }
  };

  // Ouvrir la modal de mise à jour du statut
  const openStatusUpdateModal = (orderId: string) => {
    setSelectedOrderId(orderId);
    setStatusUpdateModalOpen(true);
  };
  
  // Mettre à jour le statut d'une commande
  const handleUpdateStatus = async (orderId: string, newStatus: 'pending' | 'confirmed' | 'delivered') => {
    try {
      setProcessingOrderId(orderId);
      setError(null);
      
      let success = false;
      
      // Si la commande est marquée comme livrée, utiliser receiveSupplierOrder pour mettre à jour le stock
      if (newStatus === 'delivered') {
        success = await receiveSupplierOrder(orderId);
        
        // Émettre un événement pour notifier l'application que les stocks ont été mis à jour
        // et qu'il faut revenir à la page Caisse
        if (success) {
          emitEvent('stockUpdated', {
            source: 'supplierOrderReceived',
            orderId,
            timestamp: new Date().getTime(),
            navigateTo: 'pos'
          });
        }
      } else {
        // Pour les autres statuts, utiliser updateSupplierOrderStatus
        success = await updateSupplierOrderStatus(orderId, newStatus);
      }
      
      if (success) {
        setStatusUpdateModalOpen(false);
        // Recharger les commandes pour mettre à jour la liste
        setRefreshKey(prev => prev + 1);
      } else {
        setError(`Impossible de mettre à jour le statut de la commande vers ${newStatus}.`);
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      setError('Une erreur s\'est produite lors de la mise à jour du statut.');
    } finally {
      setProcessingOrderId(null);
    }
  };

  // Modifier une commande
  const handleEditOrder = (orderId: string) => {
    if (onEditOrder) {
      onEditOrder(orderId, () => {
        // Callback de succès: Recharger les commandes
        setRefreshKey(prev => prev + 1);
      });
    }
  };

  // Supprimer une commande
  const handleDeleteOrder = async (orderId: string) => {
    if (processingOrderId) return;
    
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) {
      return;
    }
    
    try {
      setProcessingOrderId(orderId);
      
      const success = await deleteSupplierOrder(orderId);
      
      if (success) {
        // Actualiser la liste des commandes
        setRefreshKey(prev => prev + 1);
      } else {
        setError('Échec de la suppression. Veuillez réessayer.');
      }
    } catch (err) {
      console.error('Erreur lors de la suppression de la commande:', err);
      setError('Une erreur s\'est produite lors de la suppression de la commande.');
    } finally {
      setProcessingOrderId(null);
    }
  };

  // Obtenir la couleur en fonction du statut
  // Fonction supprimée car non utilisée
  
  // Obtenir la couleur des badges pour la vue liste
  const getStatusTagColor = (status: SupplierOrder['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300';
      case 'confirmed':
        return 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300';
      case 'delivered':
        return 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="flex-1 p-6 overflow-auto">
      <div className="max-w-[2000px] mx-auto">
        {/* En-tête avec les actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Commandes Fournisseurs</h1>
          
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            <div className="flex items-center gap-3 order-1 md:order-none">
              <div className="relative h-9">
                <select
                  className="appearance-none min-w-[140px] pl-3 pr-10 h-9 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 text-sm"
                  value={filterStatus || ""}
                  onChange={(e) => setFilterStatus(e.target.value ? e.target.value as 'pending' | 'confirmed' | 'delivered' : null)}
                >
                  <option value="">Tous</option>
                  <option value="pending" className="text-yellow-700 dark:text-yellow-400">En attente</option>
                  <option value="confirmed" className="text-blue-700 dark:text-blue-400">Confirmées</option>
                  <option value="delivered" className="text-green-700 dark:text-green-400">Livrées</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" size={14} />
              </div>
              

            </div>
            <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-700 shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                }`}
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-gray-700 shadow'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
                }`}
              >
                <List size={20} />
              </button>
            </div>
            
            {hasPermission("suppliers.orders") && (
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => onCreateOrder(() => handleRefresh())}
                className="flex items-center"
              >
                <PackagePlus size={16} className="mr-2" />
                Nouvelle commande
              </Button>
            )}
          </div>
        </div>

        {/* KPI - Nombre de commandes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-full bg-indigo-600">
                <PackagePlus size={18} className="text-white" />
              </div>
              <h3 className="font-medium text-gray-700 dark:text-white text-sm">Commandes totales</h3>
            </div>
            <p className="text-xl font-bold mb-1.5 dark:text-white">{orders.length}</p>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">Toutes périodes confondues</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-full bg-yellow-500">
                <Clock size={18} className="text-white" />
              </div>
              <h3 className="font-medium text-gray-700 dark:text-white text-sm">Commandes en attente</h3>
            </div>
            <p className="text-xl font-bold mb-1.5 dark:text-white">{orders.filter(o => o.status === 'pending').length}</p>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">À confirmer</span>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-full bg-green-600">
                <Package size={18} className="text-white" />
              </div>
              <h3 className="font-medium text-gray-700 dark:text-white text-sm">Commandes livrées</h3>
            </div>
            <p className="text-xl font-bold mb-1.5 dark:text-white">{orders.filter(o => o.status === 'delivered').length}</p>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 dark:text-gray-400">Stock mis à jour</span>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded-full bg-blue-600">
                <Calendar size={18} className="text-white" />
              </div>
              <h3 className="font-medium text-gray-700 dark:text-white text-sm">Prochaine livraison</h3>
            </div>
            {orders.filter(o => o.status === 'confirmed').length > 0 ? (
              <>
                <p className="text-xl font-bold mb-1.5 dark:text-white">
                  {format(
                    new Date(
                      Math.min(
                        ...orders
                          .filter(o => o.status === 'confirmed')
                          .map(o => new Date(o.expectedDeliveryDate || o.orderDate).getTime() + 7 * 24 * 60 * 60 * 1000)
                      )
                    ),
                    'dd/MM/yyyy'
                  )}
                </p>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Commande confirmée</span>
                </div>
              </>
            ) : (
              <>
                <p className="text-xl font-bold mb-1.5 text-gray-400 dark:text-gray-500">--/--/----</p>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Aucune livraison prévue</span>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Section retirée car déplacée à côté du titre */}
        
        {/* Message d'erreur */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-300 p-3 rounded-md mb-4 flex items-start">
            <HelpCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
            <div>{error}</div>
          </div>
        )}
        
        {/* Indicateur de chargement */}
        {loading && orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <Loader2 size={40} className="animate-spin text-primary dark:text-white mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Chargement des commandes...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center shadow-md">
            <PackagePlus size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium mb-2 dark:text-white">Aucune commande fournisseur</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Créez votre première commande pour approvisionner votre stock</p>
            {hasPermission("suppliers.orders") && (
              <Button onClick={() => onCreateOrder(() => handleRefresh())}>
                Créer une commande
              </Button>
            )}
          </div>
        ) : viewMode === 'list' ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700">
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">
                      <div className="flex items-center">
                        <Clock size={14} className="mr-2 text-gray-400 dark:text-gray-500" />
                        Date / Référence
                      </div>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">
                      <div className="flex items-center">
                        <CheckCircle size={14} className="mr-2 text-gray-400 dark:text-gray-500" />
                        Statut
                      </div>
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">
                      <div className="flex items-center">
                        <Package size={14} className="mr-2 text-gray-400 dark:text-gray-500" />
                        Produits
                      </div>
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">
                      <div className="flex items-center justify-end">
                        Montant
                      </div>
                    </th>
                    <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-gray-300">
                      <div className="flex items-center justify-center">
                        Actions
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {sortedAndFilteredOrders.map((order: SupplierOrder) => (
                    <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-t dark:border-gray-700 dark:text-gray-300">
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <span className="text-sm font-medium dark:text-gray-300">{formatDate(order.orderDate)}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">CMD-{order.id.slice(-6)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`h-7 flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusTagColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1.5">{getStatusText(order.status)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <details className="group">
                          <summary className="cursor-pointer text-sm font-medium text-primary hover:text-primary-dark flex items-center">
                            <span className="text-sm dark:text-gray-300">{order.products.length} produit{order.products.length > 1 ? 's' : ''}</span>
                            <span className="text-xs ml-2 group-open:rotate-180 transition-transform">▼</span>
                          </summary>
                          <div className="mt-3 space-y-1.5 text-sm bg-gray-50 dark:bg-gray-800 rounded-md p-3 max-h-60 overflow-y-auto">
                            {order.products.map(({ product, quantity }: { product: any, quantity: number }, index: number) => (
                              <div key={index} className="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
                                <span className="font-medium truncate max-w-[200px] dark:text-gray-300">{product.name}</span>
                                <span className="ml-4 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full text-xs">{quantity} unité{quantity > 1 ? 's' : ''}</span>
                              </div>
                            ))}
                          </div>
                        </details>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-right">
                        {hasPermission("suppliers.manage") ? (
                          <span className="text-base font-semibold text-gray-900 dark:text-gray-200">{formatAmount(order.totalAmount)}</span>
                        ) : (
                          <span className="text-base font-semibold text-gray-400 dark:text-gray-500">--</span>
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-3">
                          <button
                            onClick={() => openStatusUpdateModal(order.id)}
                            className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-colors"
                            title="Modifier le statut"
                            disabled={processingOrderId === order.id}
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          {onEditOrder && hasPermission("suppliers.manage") && (
                            <button
                              onClick={() => handleEditOrder(order.id)}
                              className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-full hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600 transition-colors"
                              title="Modifier la commande"
                              disabled={processingOrderId === order.id}
                            >
                              <Edit size={16} />
                            </button>
                          )}
                          
                          {hasPermission("suppliers.manage") && (
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 transition-colors"
                              title="Supprimer la commande"
                              disabled={processingOrderId === order.id}
                            >
                              {processingOrderId === order.id ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedAndFilteredOrders.map((order: SupplierOrder) => (
              <div key={order.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow duration-200">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{formatDate(order.orderDate)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">#{order.id.slice(0, 8)}</div>
                    </div>
                    <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusTagColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1.5">{getStatusText(order.status)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 space-y-3">
                  <div className="mb-3">
                    <div className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400 mb-1">Produits</div>
                    <div className="text-sm dark:text-gray-300">
                      {order.products.length > 0 
                        ? `${order.products.length} produit${order.products.length > 1 ? 's' : ''}`
                        : 'Aucun produit'
                      }
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    {hasPermission("suppliers.manage") ? (
                      <>
                        <div className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400 mb-1">Montant total</div>
                        <div className="text-lg font-medium text-gray-900 dark:text-gray-200">{formatAmount(order.totalAmount)}</div>
                      </>
                    ) : (
                      <>
                        <div className="text-xs font-medium uppercase text-gray-500 dark:text-gray-400 mb-1">Montant total</div>
                        <div className="text-lg font-medium text-gray-400 dark:text-gray-500">--</div>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex space-x-2">
                    {order.status === 'confirmed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReceiveOrder(order.id)}
                        disabled={processingOrderId === order.id}
                        className="flex items-center"
                      >
                        {processingOrderId === order.id ? (
                          <Loader2 size={14} className="mr-1 animate-spin" />
                        ) : (
                          <Package size={14} className="mr-1" />
                        )}
                        Réceptionner
                      </Button>
                    )}
                    
                    {onEditOrder && hasPermission("suppliers.manage") && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditOrder(order.id)}
                        disabled={processingOrderId === order.id}
                        className="flex items-center"
                      >
                        <Edit size={14} className="mr-1" />
                        Modifier
                      </Button>
                    )}
                  </div>
                  
                  {hasPermission("suppliers.manage") && viewMode === 'grid' && (
                    <button
                      onClick={() => handleDeleteOrder(order.id)}
                      className="p-1 text-red-500 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-300 rounded-full"
                      title="Supprimer la commande"
                      disabled={processingOrderId === order.id}
                    >
                      {processingOrderId === order.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Modal pour la mise à jour du statut des commandes */}
        {statusUpdateModalOpen && selectedOrderId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-gray-900/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 max-w-md w-full bg-white dark:bg-gray-800 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium dark:text-white">Modifier le statut de la commande</h3>
                <button 
                  onClick={() => setStatusUpdateModalOpen(false)}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none p-1.5"
                >
                  <MoreVertical size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Sélectionnez le nouveau statut pour cette commande :</p>
                
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => handleUpdateStatus(selectedOrderId, 'pending')}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300"
                    disabled={processingOrderId === selectedOrderId}
                  >
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 text-yellow-500 dark:text-yellow-400 mr-2" />
                      <span className="dark:text-gray-300">En attente</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => handleUpdateStatus(selectedOrderId, 'confirmed')}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300"
                    disabled={processingOrderId === selectedOrderId}
                  >
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-blue-500 dark:text-blue-400 mr-2" />
                      <span className="dark:text-gray-300">Confirmée</span>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => handleUpdateStatus(selectedOrderId, 'delivered')}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300"
                    disabled={processingOrderId === selectedOrderId}
                  >
                    <div className="flex items-center">
                      <Package className="w-5 h-5 text-green-500 dark:text-green-400 mr-2" />
                      <span className="dark:text-gray-300">Livrée</span>
                    </div>
                  </button>
                </div>
                
                {processingOrderId === selectedOrderId && (
                  <div className="flex justify-center mt-2">
                    <Loader2 size={24} className="animate-spin text-blue-500 dark:text-blue-400" />
                  </div>
                )}
                
                <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setStatusUpdateModalOpen(false)}
                    className="px-4 py-2 mr-2 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-300"
                    disabled={processingOrderId === selectedOrderId}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => setStatusUpdateModalOpen(false)}
                    className="px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-md hover:bg-blue-600 dark:hover:bg-blue-700"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierOrders;
