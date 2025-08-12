import React, { useState, useMemo, useEffect, useCallback, useContext } from 'react';
import { Sale, CartItem } from '../types';
import { Search, Loader2, AlertTriangle, FileText, ShoppingCart, ShieldAlert, DollarSign, ShoppingBag, ChevronDown } from 'lucide-react';
import { processRefund, Refund } from '../services/refundService';
import { deleteSale, clearSalesCache } from '../services/saleService';
import SalesHistory from './SalesHistory';
import RefundReceipt from './RefundReceipt';
import { isWithinInterval, startOfDay, endOfDay, subDays } from 'date-fns';
import { initSalesListener, getSales, getSaleById } from '../services/saleService';
import { auth } from '../firebase';
import { AppContext } from '../App';
import { getEmployees } from '../services/employeeService';

interface SalesHistoryFirebaseProps {
  onViewReceipt: (sale: Sale) => void;
}

const SalesHistoryFirebase: React.FC<SalesHistoryFirebaseProps> = ({ onViewReceipt }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'card'>('all');
  const [refreshKey, setRefreshKey] = useState(0); // Clé pour forcer le rafraîchissement
  const [authChecked, setAuthChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  const [showRefundReceipt, setShowRefundReceipt] = useState(false);
  const [currentRefund, setCurrentRefund] = useState<Refund | null>(null);
  const [refundOriginalSale, setRefundOriginalSale] = useState<Sale | null>(null);
  const [employeesMap, setEmployeesMap] = useState<Record<string, string>>({});
  
  // Récupérer l'employé actuel pour vérifier son rôle
  const { currentEmployee } = useContext(AppContext);
  
  // Informations de l'entreprise pour le ticket de remboursement
  const businessInfo = {
    name: 'PayeSmart',
    address: '123 Rue du Commerce, 1000 Bruxelles',
    phone: '+32 2 123 45 67',
    email: 'contact@payesmart.be',
    vatNumber: 'BE0123456789'
  };
  
  // Vérifier si l'employé est un administrateur ou un manager
  const canProcessRefund = currentEmployee && (currentEmployee.role === 'admin' || currentEmployee.role === 'manager');

  // Charger les employés
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const employeesList = await getEmployees();
        // Créer une carte des employés avec l'ID comme clé et le nom complet comme valeur
        const employeesMapping: Record<string, string> = {};
        employeesList.forEach(emp => {
          employeesMapping[emp.id] = `${emp.firstName} ${emp.lastName}`;
        });
        setEmployeesMap(employeesMapping);
      } catch (error) {
        console.error("Erreur lors du chargement des employés:", error);
      }
    };
    
    loadEmployees();
  }, []);

  // Fonction utilitaire pour obtenir le nom de l'employé à partir de son ID
  const getEmployeeName = (employeeId: string): string => {
    return employeesMap[employeeId] || "Employé inconnu";
  };
  
  // Vérifier l'état de l'authentification
  useEffect(() => {
    console.log("Initialisation de l'écouteur d'authentification");
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log("État de l'authentification:", user ? "Connecté" : "Non connecté");
      setAuthChecked(true);
      setUserId(user ? user.uid : null);
      
      if (user) {
        console.log("ID de l'utilisateur connecté:", user.uid);
      }
    });
    
    return () => {
      console.log("Nettoyage de l'écouteur d'authentification");
      unsubscribe();
    };
  }, []);

  // Charger les ventes immédiatement depuis le cache ou Firestore
  useEffect(() => {
    const loadSales = async () => {
      if (!authChecked) {
        console.log("Attente de la vérification de l'authentification...");
        return;
      }
      
      try {
        console.log("Chargement initial des ventes");
        setLoading(true);
        setError(null);
        
        // Charger les ventes depuis le service
        const salesData = await getSales();
        console.log(`${salesData.length} ventes chargées depuis getSales()`);
        
        // Accepter toutes les ventes disponibles, quelle que soit l'entreprise
        console.log("Mode développement forcé: acceptation de toutes les ventes");
        const validSales = salesData;
        
        // Dédupliquer les ventes en utilisant l'ID comme clé
        const salesMap = new Map<string, Sale>();
        validSales.forEach(sale => {
          if (sale.id) {
            salesMap.set(sale.id, sale);
          }
        });
        
        const uniqueSales = Array.from(salesMap.values());
        console.log("Ventes uniques après déduplication:", uniqueSales.length);
        
        console.log("Ventes valides après filtrage par businessId:", validSales.length);
        setSales(uniqueSales);
        setLoading(false);
        setIsInitialLoadComplete(true);
      } catch (error) {
        console.error("Erreur lors du chargement des ventes:", error);
        setError("Erreur lors du chargement des ventes. Veuillez réessayer.");
        setLoading(false);
      }
    };
    
    loadSales();
  }, [authChecked, userId]);

  // Initialiser l'écouteur de ventes en temps réel
  useEffect(() => {
    if (!authChecked) {
      console.log("Attente de la vérification de l'authentification...");
      return;
    }
    
    console.log("Initialisation de l'écouteur de ventes en temps réel");
    
    // Fonction de rappel pour mettre à jour les ventes
    const handleSalesUpdate = (updatedSales: Sale[]) => {
      console.log(`Mise à jour reçue: ${updatedSales.length} ventes`);
      
      // Utiliser un ID par défaut pour le développement si aucun utilisateur n'est connecté
      const effectiveUserId = userId || 'business1';
      
      // Filtrer les ventes par businessId
      const validSales = updatedSales.filter(sale => {
        // Vérifier si la vente a un businessId
        if (!sale.businessId) {
          console.log("Vente ignorée car businessId manquant:", sale.id);
          return false;
        }
        
        // Accepter les ventes avec le businessId de l'utilisateur ou 'business1' en développement
        const isValid = sale.businessId === effectiveUserId || 
                        (effectiveUserId === 'business1' && sale.businessId === 'business1') ||
                        (effectiveUserId === 'business1'); // En mode dev, accepter toutes les ventes
        
        if (!isValid) {
          console.log("Vente ignorée car businessId incorrect:", sale.id, sale.businessId, "≠", effectiveUserId);
        }
        
        return isValid;
      });
      
      // Dédupliquer les ventes en utilisant l'ID comme clé
      const salesMap = new Map<string, Sale>();
      validSales.forEach(sale => {
        if (sale.id) {
          salesMap.set(sale.id, sale);
        }
      });
      
      const uniqueSales = Array.from(salesMap.values());
      console.log("Ventes uniques après déduplication:", uniqueSales.length);
      
      console.log("Ventes valides après filtrage par businessId:", validSales.length);
      setSales(uniqueSales);
      setLoading(false);
    };
    
    // Initialiser l'écouteur seulement si le chargement initial est terminé
    // ou si c'est un rafraîchissement forcé
    if (isInitialLoadComplete || refreshKey > 0) {
      const unsubscribe = initSalesListener(handleSalesUpdate);
      
      // Nettoyage lors du démontage du composant
      return () => {
        console.log("Nettoyage de l'écouteur de ventes en temps réel");
        unsubscribe();
      };
    }
  }, [authChecked, userId, refreshKey, isInitialLoadComplete]);

  // Fonction pour forcer le rafraîchissement
  const handleRefresh = useCallback(() => {
    console.log("Rafraîchissement forcé de l'historique des ventes");
    setRefreshKey(prev => prev + 1);
  }, []);

  // Fonction utilitaire pour normaliser la recherche (casse et accents)
  const normalize = (str: string) => str ? str.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase() : '';

  // Filtrer les ventes en fonction des critères de recherche et des filtres
  const filteredSales = useMemo(() => {
    console.log("Application des filtres sur", sales.length, "ventes");
    const normalizedQuery = normalize(searchQuery.trim());
    return sales.filter(sale => {
      // Filtre de recherche robuste (numéro ticket, produit, catégorie, insensible à la casse et aux accents)
      const numTicket = sale.receiptNumber ? normalize(sale.receiptNumber) : '';
      const produitMatch = sale.items.some(item => item.product && item.product.name && normalize(item.product.name).includes(normalizedQuery));
      const categorieMatch = sale.items.some(item => item.product && item.product.category && normalize(item.product.category).includes(normalizedQuery));
      const matchesSearch = normalizedQuery === '' || numTicket.includes(normalizedQuery) || produitMatch || categorieMatch;
      if (!matchesSearch) return false;

      // Filtre de date robuste
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const saleDate = sale.timestamp ? new Date(sale.timestamp) : null;
        const today = new Date();
        if (saleDate) {
          if (dateFilter === 'today') {
            matchesDate = isWithinInterval(saleDate, { start: startOfDay(today), end: endOfDay(today) });
          } else if (dateFilter === 'week') {
            matchesDate = isWithinInterval(saleDate, { start: startOfDay(subDays(today, 6)), end: endOfDay(today) });
          } else if (dateFilter === 'month') {
            matchesDate = isWithinInterval(saleDate, { start: startOfDay(subDays(today, 29)), end: endOfDay(today) });
          }
        }
      }
      if (!matchesDate) return false;

      // Filtre de paiement
      let matchesPayment = true;
      if (paymentFilter !== 'all') {
        matchesPayment = sale.paymentMethod === paymentFilter;
      }
      return matchesPayment;
    });
  }, [sales, searchQuery, dateFilter, paymentFilter]);

  // Fonction pour formater les nombres avec séparateurs de milliers
  const formatNumber = (num: number | undefined): string => {
    if (num === undefined || isNaN(num)) return "0";
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  // Fonction pour formater les prix
  const formatPrice = (price: number) => {
    if (isNaN(price) || price === undefined) return "0,00";
    return new Intl.NumberFormat('fr-FR', { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2 
    }).format(price);
  };
  
  // Fonction pour afficher un ticket de remboursement
  const handleViewRefundReceipt = (sale: Sale) => {
    // Récupérer la vente originale pour le ticket de remboursement
    getSaleById(sale.id)
      .then(originalSale => {
        if (originalSale) {
          // Trouver les informations des produits originaux à partir de la vente originale
          const convertedItems: CartItem[] = (sale.refundedItems || []).map(refundItem => {
            // Chercher le produit correspondant dans la vente originale
            const originalItem = originalSale.items.find(item => 
              item.product && item.product.id === refundItem.productId
            );
            
            return {
              product: {
                id: refundItem.productId,
                name: originalItem ? originalItem.product.name : 'Produit remboursé', // Utiliser le nom réel si disponible
                price: originalItem ? originalItem.product.price : 0,
                stock: 0,
                category: originalItem ? originalItem.product.category : '',
                vatRate: originalItem ? originalItem.product.vatRate : 21,
                businessId: sale.businessId
              },
              quantity: refundItem.quantity,
              businessId: sale.businessId
            };
          });
          
          // Construire un objet Refund à partir des données de la vente remboursée
          const refundData: Refund = {
            id: sale.refundId || 'refund-' + sale.id,
            saleId: sale.id,
            employeeId: sale.employeeId,
            timestamp: sale.refundTimestamp || new Date(),
            refundMethod: sale.refundMethod || 'cash',
            refundAmount: sale.refundAmount || sale.total,
            refundedItems: convertedItems,
            businessId: sale.businessId,
            fullRefund: sale.fullRefund || false
          };

          // Afficher le ticket de remboursement
          setRefundOriginalSale(originalSale);
          setCurrentRefund(refundData);
          setShowRefundReceipt(true);
        } else {
          console.error('Vente originale non trouvée pour le remboursement:', sale.id);
          // Fallback sur le ticket standard si la vente originale n'est pas trouvée
          onViewReceipt(sale);
        }
      })
      .catch(error => {
        console.error('Erreur lors de la récupération de la vente pour le remboursement:', error);
        // Fallback sur le ticket standard en cas d'erreur
        onViewReceipt(sale);
      });
  };

  // Fonction pour gérer les remboursements
  const handleRefund = async (saleId: string, refundItems: CartItem[], refundMethod: 'cash' | 'card', fullRefund: boolean): Promise<void> => {
    try {
      // Vérifier si l'employé est autorisé à effectuer des remboursements
      if (!canProcessRefund) {
        throw new Error('Vous n\'avez pas les autorisations nécessaires pour effectuer des remboursements');
      }
      
      // Afficher un message de traitement en cours (géré par le composant RefundModal)
      
      // Utiliser l'ID de l'employé connecté
      const employeeId = currentEmployee?.id || userId || 'employee1';
      
      // Récupérer la vente originale pour le ticket de remboursement
      const originalSale = await getSaleById(saleId);
      if (!originalSale) {
        throw new Error('Vente non trouvée pour le remboursement');
      }
      
      // Traiter le remboursement
      const result = await processRefund(saleId, refundItems, refundMethod, employeeId, fullRefund);
      
      if (result) {
        // Rafraîchir la liste des ventes après le remboursement
        setTimeout(() => {
          handleRefresh();
        }, 1000);
        
        // Préparer les données pour le ticket de remboursement
        setRefundOriginalSale(originalSale);
        setCurrentRefund(result);
        setShowRefundReceipt(true);
      } else {
        throw new Error('Échec du remboursement');
      }
    } catch (error) {
      console.error('Erreur lors du remboursement:', error);
      throw error;
    }
  };

  // Calculer les KPI
  const kpiData = useMemo(() => {
    // Nombre total de ventes
    const totalSalesCount = filteredSales.length;
    
    // Montant total des ventes en vérifiant que chaque valeur est un nombre valide et en tenant compte des remboursements
    const totalSalesAmount = filteredSales.reduce((sum, sale) => {
      // Vérifier si sale.total est un nombre valide
      const saleTotal = sale.total && !isNaN(sale.total) ? sale.total : 0;
      
      // Si c'est une vente normale (non remboursée), ajouter le montant total
      if (!sale.refunded) {
        return sum + saleTotal;
      }
      
      // Pour les ventes remboursées
      if (sale.refunded) {
        // Si un montant de remboursement est spécifié, utiliser ce montant exact
        // Ce montant correspond uniquement aux produits remboursés
        if (sale.refundAmount && !isNaN(sale.refundAmount)) {
          // Ajouter la partie non remboursée de la vente au total
          return sum + (saleTotal - sale.refundAmount);
        }
        
        // Pour un remboursement complet, ne rien ajouter au total
        if (sale.fullRefund) {
          return sum;
        }
        
        // Si aucune information de remboursement n'est disponible, traiter comme une vente normale
        return sum + saleTotal;
      }
      
      return sum;
    }, 0);
    
    // Log pour débogage
    console.log('Total des ventes calculé:', totalSalesAmount);
    
    // Nombre total d'articles vendus
    const totalItemsSold = filteredSales.reduce((sum, sale) => 
      sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
    
    // Panier moyen
    const averageBasket = totalSalesCount > 0 ? totalSalesAmount / totalSalesCount : 0;
    
    // Répartition des modes de paiement
    const paymentMethodCount = {
      cash: filteredSales.filter(sale => sale.paymentMethod === 'cash').length,
      card: filteredSales.filter(sale => sale.paymentMethod === 'card').length
    };
    
    return {
      totalSalesCount,
      totalSalesAmount,
      totalItemsSold,
      averageBasket,
      paymentMethodCount
    };
  }, [filteredSales]);

  // Vérifier si l'employé est un caissier et afficher un message d'accès refusé
  if (currentEmployee && currentEmployee.role === 'cashier') {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-[80vh]">
        <ShieldAlert size={64} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">Accès refusé</h1>
        <p className="text-gray-600 text-center mb-4">
          Vous n'avez pas les autorisations nécessaires pour accéder à l'historique des ventes.
          <br />
          Seuls les managers et les administrateurs peuvent accéder à cette page.
        </p>
      </div>
    );
  }

  // Fonction pour fermer le ticket de remboursement
  const handleCloseRefundReceipt = () => {
    setShowRefundReceipt(false);
    setCurrentRefund(null);
    setRefundOriginalSale(null);
  };
  
  // Fonction pour supprimer une vente
  const handleDeleteSale = async (saleId: string): Promise<boolean> => {
    try {
      // Vérifier si l'employé est autorisé à supprimer des ventes
      if (!currentEmployee || (currentEmployee.role !== 'admin' && currentEmployee.role !== 'manager')) {
        alert("Vous n'avez pas les autorisations nécessaires pour supprimer des ventes.");
        return false;
      }
      
      // Appeler le service pour supprimer la vente
      const success = await deleteSale(saleId);
      
      if (success) {
        // Mise à jour immédiate de l'affichage des ventes
        // 1. Supprimer la vente du tableau local
        setSales(prevSales => prevSales.filter(sale => sale.id !== saleId));
        
        // 2. Forcer le rafraîchissement complet de la liste
        handleRefresh();
        
        // 3. Vider le cache pour s'assurer que les données sont fraîches
        clearSalesCache();
        
        // Afficher un message de succès
        console.log(`Vente ${saleId} supprimée avec succès et KPI mis à jour`);
        return true;
      } else {
        alert("Erreur lors de la suppression de la vente. Veuillez réessayer.");
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la vente:', error);
      alert("Une erreur est survenue lors de la suppression de la vente.");
      return false;
    }
  };
  
  return (
    <div className="p-4 min-h-[calc(100vh-4rem)]">
      {/* Afficher le ticket de remboursement si un remboursement a été effectué */}
      {showRefundReceipt && currentRefund && refundOriginalSale && (
        <RefundReceipt
          refund={currentRefund}
          originalSale={refundOriginalSale}
          businessName={businessInfo.name}
          address={businessInfo.address}
          phone={businessInfo.phone}
          email={businessInfo.email}
          vatNumber={businessInfo.vatNumber}
          onClose={handleCloseRefundReceipt}
        />
      )}
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Historique des ventes</h1>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto sm:ml-auto">
          <div className="flex flex-col md:flex-row gap-3 w-full sm:w-auto">
            <div className="relative min-w-[180px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[color:var(--color-text-secondary)]" size={18} />
              <input
                type="text"
                placeholder="Rechercher une vente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
              />
            </div>
            <div className="relative">
              <select
                className="appearance-none w-full min-w-[180px] pl-3 pr-10 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value as any)}
              >
                <option value="all">Toute la période</option>
                <option value="today">Aujourd'hui</option>
                <option value="week">7 derniers jours</option>
                <option value="month">30 derniers jours</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" size={16} />
            </div>
            <div className="relative">
              <select
                className="appearance-none w-full min-w-[180px] pl-3 pr-10 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
                value={paymentFilter}
                onChange={e => setPaymentFilter(e.target.value as any)}
              >
                <option value="all">Tous paiements</option>
                <option value="cash">Espèces</option>
                <option value="card">Carte</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none" size={16} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Section des KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* KPI 1: Nombre total de ventes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-all duration-300 hover:shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-full bg-blue-600">
              <FileText size={18} className="text-white" />
            </div>
            <h3 className="font-medium text-gray-700 dark:text-white text-sm">Nombre de ventes</h3>
          </div>
          <p className="text-xl font-bold mb-1.5 dark:text-white">{formatNumber(kpiData.totalSalesCount)}</p>
        </div>

        {/* KPI 2: Montant total des ventes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-all duration-300 hover:shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-full bg-green-600">
              <DollarSign size={18} className="text-white" />
            </div>
            <h3 className="font-medium text-gray-700 dark:text-white text-sm">Chiffre d'affaires</h3>
          </div>
          <p className="text-xl font-bold mb-1.5 dark:text-white">{formatPrice(kpiData.totalSalesAmount)} €</p>
        </div>

        {/* KPI 3: Nombre total d'articles vendus */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-all duration-300 hover:shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-full bg-purple-600">
              <ShoppingCart size={18} className="text-white" />
            </div>
            <h3 className="font-medium text-gray-700 dark:text-white text-sm">Articles vendus</h3>
          </div>
          <p className="text-xl font-bold mb-1.5 dark:text-white">{formatNumber(kpiData.totalItemsSold)}</p>
        </div>

        {/* KPI 4: Panier moyen */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-all duration-300 hover:shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-full bg-yellow-500">
              <ShoppingBag size={18} className="text-white" />
            </div>
            <h3 className="font-medium text-gray-700 dark:text-white text-sm">Panier moyen</h3>
          </div>
          <p className="text-xl font-bold mb-1.5 dark:text-white">{formatPrice(kpiData.averageBasket)} €</p>
        </div>
      </div>

      {/* État de chargement */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 mb-6 flex justify-center items-center text-gray-800 dark:text-gray-200">
          <Loader2 className="animate-spin mr-3" size={28} />
          <span className="text-lg">Chargement de l'historique des ventes...</span>
        </div>
      )}
      
      {/* Message d'erreur */}
      {error && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-5 mb-6 border-l-4 border-red-500 dark:border-red-600">
          <div className="flex items-start">
            <AlertTriangle className="mr-3 mt-0.5 flex-shrink-0 text-red-500 dark:text-red-400" size={24} />
            <div>
              <p className="font-medium text-red-800 dark:text-red-200 mb-2">{error}</p>
              <button 
                className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors duration-200"
                onClick={handleRefresh}
              >
                Réessayer
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Utiliser le composant SalesHistory pour afficher les ventes */}
      {!loading && !error && (
        <SalesHistory 
          sales={filteredSales} 
          onViewReceipt={onViewReceipt}
          onViewRefundReceipt={handleViewRefundReceipt}
          onRefundSale={canProcessRefund ? handleRefund : undefined}
          onDeleteSale={handleDeleteSale}
          getEmployeeName={getEmployeeName}
        />
      )}
    </div>
  );
};

export default SalesHistoryFirebase;
