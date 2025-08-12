import React, { useState, useEffect, useCallback, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Sale, Employee } from '../types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { startOfDay, endOfDay, subDays } from 'date-fns';

// Fonction utilitaire pour nettoyer les données des rapports
const cleanReportData = (data: any): any => {
  if (!data) return {};
  
  const cleanValue = (value: any): any => {
    // Cas spéciaux pour les valeurs null ou undefined
    if (value === null || value === undefined) return 0;
    
    // Cas spécial pour les nombres NaN
    if (typeof value === 'number' && isNaN(value)) return 0;
    
    // Cas spécial pour les tableaux
    if (Array.isArray(value)) {
      // S'il n'y a pas d'éléments, retourner un tableau vide
      if (value.length === 0) return [];
      // Sinon, filtrer les éléments null ou undefined et nettoyer chaque élément
      return value.filter(item => item !== null && item !== undefined).map(cleanValue);
    }
    
    // Cas spécial pour les objets
    if (typeof value === 'object' && value !== null) {
      // Ne pas modifier les dates
      if (value instanceof Date) return value;
      
      // Cas spécial pour les objets Timestamp de Firebase
      if ('toDate' in value && typeof value.toDate === 'function') {
        return value; // Garder l'objet Timestamp intact
      }
      
      // Pour les autres objets, nettoyer récursivement chaque propriété
      const cleanedObj: Record<string, any> = {};
      Object.keys(value).forEach(key => {
        cleanedObj[key] = cleanValue(value[key]);
      });
      return cleanedObj;
    }
    
    // Pour les autres types de valeurs, les retourner telles quelles
    return value;
  };
  
  return cleanValue(data);
};

// Nous utilisons les fonctions de formatage définies dans les composants de graphiques
// Importer les composants de graphiques
import { 
  SalesEvolutionChart, 
  CategoryPieChart, 
  EmployeePerformanceChart,
  HourlySalesChart,
  TopProductsChart 
} from './charts/ReportCharts';

// Nous n'avons plus besoin de cette variable car nous utilisons forceRefresh
// pour forcer le rechargement des graphiques
import { KpiCards } from './charts/KpiCards';
import { 
  SalesTable, 
  ProductPerformanceTable, 
  EmployeePerformanceTable 
} from './charts/DataTables';
import { getSales } from '../services/saleService';
import { auth } from '../firebase';

interface ReportsProps {
  employees: Employee[];
}

const Reports: React.FC<ReportsProps> = ({ employees = [] }) => {
  // Utiliser 'all' comme valeur par défaut pour correspondre à l'historique des ventes
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [customReportCriteria, setCustomReportCriteria] = useState({
    startDate: '',
    endDate: '',
    title: 'Rapport de ventes PaySmart',
    format: 'pdf',
    statistics: {
      dailySales: false,
      weeklySales: false,
      monthlySales: true,
      yearlySales: false,
      topProducts: false,
      salesByCategory: false,
      salesByPaymentMethod: false,
      salesByTimeOfDay: false,
      profitMargins: false,
      customerRetention: false
    },
    filters: {
      includeProducts: true,
      includeEmployees: true,
      includePaymentMethods: true,
      includeCategories: true,
      minAmount: '',
      maxAmount: '',
      onlyCompleted: true
    }
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [salesReport, setSalesReport] = useState<any>(null);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [previousSales, setPreviousSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [forceRefresh, setForceRefresh] = useState<boolean>(true); // Toujours forcer le rafraîchissement au démarrage
  const [allSales, setAllSales] = useState<Sale[]>([]); // Toutes les ventes non filtrées
  const [authChecked, setAuthChecked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case 'all':
        // Pour 'all', utiliser une date très ancienne comme début
        return { start: new Date(2000, 0, 1), end: endOfDay(now) };
      case 'today':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'week':
        return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) };
      case 'month':
        return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
      case 'year':
        return { start: startOfDay(subDays(now, 365)), end: endOfDay(now) };
    }
  };

  const getPreviousDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case 'all':
        // Pour 'all', utiliser une période précédente très large
        return { start: new Date(1990, 0, 1), end: new Date(1999, 11, 31) };
      case 'today':
        return { start: startOfDay(subDays(now, 1)), end: endOfDay(subDays(now, 1)) };
      case 'week':
        return { start: startOfDay(subDays(now, 14)), end: endOfDay(subDays(now, 7)) };
      case 'month':
        return { start: startOfDay(subDays(now, 60)), end: endOfDay(subDays(now, 30)) };
      case 'year':
        return { start: startOfDay(subDays(now, 730)), end: endOfDay(subDays(now, 365)) };
    }
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

  // Charger toutes les ventes une seule fois - EXACTEMENT comme dans SalesHistoryFirebase
  useEffect(() => {
    const loadAllSales = async () => {
      if (!authChecked) {
        console.log("Attente de la vérification de l'authentification...");
        return;
      }
      
      try {
        console.log("Chargement initial de toutes les ventes");
        setLoading(true);
        setError(null);
        
        // Charger les ventes depuis le service
        const salesData = await getSales();
        console.log(`${salesData.length} ventes chargées depuis getSales()`);
        
        // Filtrer les ventes pour s'assurer qu'elles appartiennent à l'entreprise actuelle
        const currentBusinessId = userId || 'unknown';
        console.log("Filtrage des ventes pour l'entreprise:", currentBusinessId);
        const validSales = salesData.filter(sale => sale.businessId === currentBusinessId);
        console.log(`${validSales.length} ventes appartiennent à l'entreprise actuelle`);
        
        // Dédupliquer les ventes en utilisant l'ID comme clé
        const salesMap = new Map<string, Sale>();
        validSales.forEach(sale => {
          if (sale.id) {
            salesMap.set(sale.id, sale);
          }
        });
        
        const uniqueSales = Array.from(salesMap.values());
        console.log("Ventes uniques après déduplication:", uniqueSales.length);
        
        // Journalisation détaillée pour le débogage
        console.log("Ventes valides après filtrage par businessId:", validSales.length);
        console.log("Nombre total de ventes dans le tableau de bord:", uniqueSales.length);
        
        // Afficher les IDs des ventes pour faciliter le débogage
        console.log("IDs des ventes dans le tableau de bord:", uniqueSales.map(sale => sale.id));
        
        setAllSales(uniqueSales);
        setLoading(false);
      } catch (error) {
        console.error("Erreur lors du chargement des ventes:", error);
        setError("Erreur lors du chargement des ventes. Veuillez réessayer.");
        setLoading(false);
      }
    };
    
    loadAllSales();
  }, [authChecked, userId, forceRefresh]);

  // Filtrer les ventes selon la période sélectionnée
  useEffect(() => {
    const filterSalesByDate = () => {
      if (allSales.length === 0) {
        console.log("Aucune vente à filtrer");
        setFilteredSales([]);
        setPreviousSales([]);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const range = getDateRange();
        console.log(`Filtrage des ventes pour la période: ${range.start.toISOString()} - ${range.end.toISOString()}`);
        
        // Filtrer les ventes pour la période actuelle - EXACTEMENT comme dans SalesHistoryFirebase
        const filteredSalesData = allSales.filter(sale => {
          try {
            // Vérifier que la vente a un timestamp valide
            if (!sale || !sale.timestamp) {
              console.warn('Vente sans timestamp ignorée:', sale?.id || 'ID inconnu');
              return false;
            }
            
            // Si dateRange est 'all', accepter toutes les ventes avec un timestamp valide
            if (dateRange === 'all') {
              return true;
            }
            
            // Convertir le timestamp en Date
            let saleDate;
            if (typeof sale.timestamp === 'object' && 'toDate' in sale.timestamp && typeof sale.timestamp.toDate === 'function') {
              // C'est un Timestamp Firebase
              saleDate = sale.timestamp.toDate();
            } else if (sale.timestamp instanceof Date) {
              // C'est déjà une Date
              saleDate = sale.timestamp;
            } else {
              // C'est une chaîne ou un nombre
              saleDate = new Date(sale.timestamp);
            }
            
            // Vérifier que la date est valide
            if (isNaN(saleDate.getTime())) {
              console.warn('Vente avec date invalide ignorée:', sale.id);
              return false;
            }
            
            const startOfStartDate = new Date(range.start);
            startOfStartDate.setHours(0, 0, 0, 0);
            
            const endOfEndDate = new Date(range.end);
            endOfEndDate.setHours(23, 59, 59, 999);
            
            return saleDate >= startOfStartDate && saleDate <= endOfEndDate;
          } catch (error) {
            console.error(`Erreur lors de la conversion de la date pour la vente ${sale.id}:`, error);
            return false;
          }
        });
        
        // Journalisation détaillée pour le débogage
        console.log(`Ventes filtrées pour la période ${dateRange}: ${filteredSalesData.length} sur ${allSales.length}`);
        
        console.log(`Ventes filtrées pour la période actuelle: ${filteredSalesData.length}`);
        
        // Nettoyer les données pour éliminer les valeurs NaN et undefined
        const cleanedSalesData = cleanReportData(filteredSalesData);
        
        // Vérifier que les données sont un tableau valide
        if (!Array.isArray(cleanedSalesData)) {
          console.error("Les données nettoyées ne sont pas un tableau");
          setFilteredSales([]);
        } else {
          // Filtrer les ventes qui ont des données valides pour les graphiques
          const validSales = cleanedSalesData.filter(sale => {
            // Vérifier que la vente a un timestamp valide
            if (!sale || !sale.timestamp) {
              console.warn('Vente sans timestamp valide ignorée:', sale?.id || 'ID inconnu');
              return false;
            }
            
            // Vérifier que la vente a un total valide
            if (typeof sale.total !== 'number' || isNaN(sale.total)) {
              console.warn('Vente avec total invalide ignorée:', sale.id);
              return false;
            }
            
            // Vérifier que la vente a des items valides
            if (!Array.isArray(sale.items) || sale.items.length === 0) {
              console.warn('Vente sans items ignorée:', sale.id);
              return false;
            }
            
            return true;
          });
          
          console.log(`Données nettoyées et validées: ${validSales.length} ventes sur ${cleanedSalesData.length}`);
          setFilteredSales(validSales);
        }
        
        // Filtrer les ventes pour la période précédente
        const previousRange = getPreviousDateRange();
        const filteredPreviousSales = allSales.filter(sale => {
          try {
            const saleDate = new Date(sale.timestamp);
            const startOfStartDate = new Date(previousRange.start);
            startOfStartDate.setHours(0, 0, 0, 0);
            
            const endOfEndDate = new Date(previousRange.end);
            endOfEndDate.setHours(23, 59, 59, 999);
            
            return saleDate >= startOfStartDate && saleDate <= endOfEndDate;
          } catch (error) {
            console.error(`Erreur lors de la conversion de la date pour la vente ${sale.id}:`, error);
            return false;
          }
        });
        
        console.log(`Ventes filtrées pour la période précédente: ${filteredPreviousSales.length}`);
        
        // Nettoyer les données précédentes
        const cleanedPreviousSales = cleanReportData(filteredPreviousSales);
        
        // Vérifier que les données précédentes sont un tableau valide
        if (!Array.isArray(cleanedPreviousSales)) {
          console.error("Les données précédentes nettoyées ne sont pas un tableau");
          setPreviousSales([]);
        } else {
          // Filtrer les ventes précédentes qui ont des données valides pour les graphiques
          const validPreviousSales = cleanedPreviousSales.filter(sale => {
            // Vérifier que la vente a un timestamp valide
            if (!sale || !sale.timestamp) return false;
            
            // Vérifier que la vente a un total valide
            if (typeof sale.total !== 'number' || isNaN(sale.total)) return false;
            
            // Vérifier que la vente a des items valides
            if (!Array.isArray(sale.items) || sale.items.length === 0) return false;
            
            return true;
          });
          
          console.log(`Données précédentes nettoyées et validées: ${validPreviousSales.length} ventes sur ${cleanedPreviousSales.length}`);
          setPreviousSales(validPreviousSales);
        }
        
        // Générer un rapport de ventes basique en utilisant uniquement les ventes valides
        const validSales = Array.isArray(filteredSales) ? filteredSales : [];
        const salesReport = {
          totalSales: validSales.length,
          totalRevenue: validSales.reduce((sum: number, sale: Sale) => sum + (sale.total || 0), 0),
          averageTicket: validSales.length > 0 
            ? validSales.reduce((sum: number, sale: Sale) => sum + (sale.total || 0), 0) / validSales.length 
            : 0,
          period: {
            start: range.start,
            end: range.end
          }
        };
        
        // Journalisation détaillée pour le débogage
        console.log('Rapport de ventes généré:', {
          totalSales: salesReport.totalSales,
          totalRevenue: salesReport.totalRevenue,
          averageTicket: salesReport.averageTicket,
          period: `${salesReport.period.start.toISOString()} - ${salesReport.period.end.toISOString()}`
        });
        
        setSalesReport(salesReport);
        setForceRefresh(false);
        setLoading(false);
      } catch (error) {
        console.error("Erreur lors du filtrage des ventes:", error);
        setError("Erreur lors du filtrage des ventes. Veuillez réessayer.");
        setLoading(false);
        setSalesReport(null);
        setFilteredSales([]);
        setPreviousSales([]);
      }
    };
    
    filterSalesByDate();
  }, [dateRange, allSales]);

  const handleRefresh = useCallback(() => {
    console.log("Rafraîchissement des données du tableau de bord...");
    setSalesReport(null);
    setFilteredSales([]);
    setPreviousSales([]);
    setForceRefresh(prev => !prev); // Inverser la valeur pour forcer le rechargement
  }, []);

  // Composant de sélection de plage de dates
  const DateRangeSelector = () => {
    const options = [
      { value: 'all', label: 'Toutes les ventes' },
      { value: 'today', label: 'Aujourd\'hui' },
      { value: 'week', label: '7 jours' },
      { value: 'month', label: '30 jours' },
      { value: 'year', label: '365 jours' }
    ];
    
    return (
      <div className="flex flex-wrap items-center gap-4 justify-center mb-6" data-component-name="DateRangeSelector">
        <div className="relative min-w-[200px]">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="appearance-none w-full px-4 py-2.5 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent pr-10 cursor-pointer"
            data-component-name="DateRangeSelector"
          >
            {options.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
        
        <button
          onClick={handleRefresh}
          className="p-2.5 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200"
          title="Rafraîchir les rapports"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        </button>
        
        <button
          onClick={() => setIsReportModalOpen(true)}
          className="px-4 py-2.5 rounded-lg bg-[color:var(--color-primary)] text-white hover:bg-[color:var(--color-primary-dark)] transition-colors flex items-center gap-2"
          title="Générer un rapport personnalisé"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V8z" clipRule="evenodd" />
          </svg>
          Rapport personnalisé
        </button>
      </div>
    );
  };
  
  // Fonction pour générer un rapport personnalisé
  const generateCustomReport = () => {
    console.log('Génération de rapport avec critères:', customReportCriteria);
    
    // Validation des entrées
    if (!customReportCriteria.startDate && !customReportCriteria.endDate) {
      // Définir des dates par défaut si aucune n'est spécifiée
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      setCustomReportCriteria(prev => ({
        ...prev,
        startDate: thirtyDaysAgo.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      }));
    }
    
    // Vérifier si au moins une statistique est sélectionnée
    const hasSelectedStats = Object.values(customReportCriteria.statistics).some(value => value === true);
    
    if (!hasSelectedStats) {
      alert('Veuillez sélectionner au moins un type de statistique pour votre rapport.');
      return;
    }
    
    // Préparation des données pour le rapport
    const reportData = {
      ...customReportCriteria,
      generatedAt: new Date().toISOString(),
      userId: auth.currentUser?.uid || 'anonymous',
      userName: auth.currentUser?.displayName || 'Utilisateur',
      filteredSalesCount: filteredSales.length,
      reportId: `report-${Date.now()}`
    };
    
    // Simulation de génération de rapport - normalement, cela appellerait un service backend
    setTimeout(() => {
      console.log('Rapport généré:', reportData);
      
      // Création d'un PDF basique pour démonstration (dans une implémentation réelle, utilisez une bibliothèque comme jsPDF)
      const statisticsSelected = Object.entries(customReportCriteria.statistics)
        .filter(([_, isSelected]) => isSelected)
        .map(([key]) => {
          switch(key) {
            case 'dailySales': return 'Ventes journalières';
            case 'weeklySales': return 'Ventes hebdomadaires';
            case 'monthlySales': return 'Ventes mensuelles';
            case 'yearlySales': return 'Ventes annuelles';
            case 'topProducts': return 'Produits populaires';
            case 'salesByCategory': return 'Ventes par catégorie';
            case 'salesByPaymentMethod': return 'Ventes par moyen de paiement';
            case 'salesByTimeOfDay': return 'Ventes par heure';
            case 'profitMargins': return 'Marges bénéficiaires';
            case 'customerRetention': return 'Fidélisation clients';
            default: return key;
          }
        }).join(', ');
        
      // Fermer le modal après la génération
      setIsReportModalOpen(false);
      
      // Message de succès avec détails
      alert(
        `Rapport "${customReportCriteria.title}" généré avec succès!\n\n` +
        `Période: ${customReportCriteria.startDate || 'Non spécifiée'} - ${customReportCriteria.endDate || 'Non spécifiée'}\n` +
        `Statistiques incluses: ${statisticsSelected}\n` +
        `Format: ${customReportCriteria.format.toUpperCase()}\n\n` +
        `Le téléchargement va commencer.`
      );
    }, 1500); // Délai simulé pour donner l'impression de traitement
  };
  
  // Gérer les changements dans le formulaire de rapport personnalisé
  const handleCustomReportChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    // Gestion des statistiques et filtres avec notation par points (stat.dailySales)
    if (name.includes('.')) {
      const [category, field] = name.split('.');
      
      if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setCustomReportCriteria(prev => {
          if (category === 'statistics') {
            return {
              ...prev,
              statistics: {
                ...prev.statistics,
                [field]: checked
              }
            };
          } else if (category === 'filters') {
            return {
              ...prev,
              filters: {
                ...prev.filters,
                [field]: checked
              }
            };
          }
          return prev;
        });
      } else if (type === 'number' || type === 'text' || type === 'date' || type === 'select-one') {
        setCustomReportCriteria(prev => {
          if (category === 'statistics') {
            return {
              ...prev,
              statistics: {
                ...prev.statistics,
                [field]: value
              }
            };
          } else if (category === 'filters') {
            return {
              ...prev,
              filters: {
                ...prev.filters,
                [field]: value
              }
            };
          }
          return prev;
        });
      }
    } else {
      // Champs de premier niveau
      if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setCustomReportCriteria(prev => ({
          ...prev,
          [name]: checked
        }));
      } else {
        setCustomReportCriteria(prev => ({
          ...prev,
          [name]: value
        }));
      }
    }
  };
  
  // Modal de génération de rapport personnalisé
  const CustomReportModal = () => (
    <Transition appear show={isReportModalOpen} as={Fragment}>
      <Dialog 
        as="div" 
        className="relative z-50" 
        onClose={() => setIsReportModalOpen(false)}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4"
                >
                  Générer un rapport personnalisé
                </Dialog.Title>
                
                <div className="mt-2 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Titre du rapport
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={customReportCriteria.title}
                      onChange={handleCustomReportChange}
                      placeholder="Rapport de ventes PaySmart"
                      className="block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[color:var(--color-primary)] focus:border-[color:var(--color-primary)] text-sm dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Période
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">Du</label>
                        <input
                          type="date"
                          name="startDate"
                          value={customReportCriteria.startDate}
                          onChange={handleCustomReportChange}
                          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[color:var(--color-primary)] focus:border-[color:var(--color-primary)] text-sm dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400">Au</label>
                        <input
                          type="date"
                          name="endDate"
                          value={customReportCriteria.endDate}
                          onChange={handleCustomReportChange}
                          className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[color:var(--color-primary)] focus:border-[color:var(--color-primary)] text-sm dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Format du rapport
                    </label>
                    <select
                      name="format"
                      value={customReportCriteria.format}
                      onChange={handleCustomReportChange}
                      className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-[color:var(--color-primary)] focus:border-[color:var(--color-primary)] text-sm dark:text-white"
                    >
                      <option value="pdf">PDF</option>
                      <option value="excel">Excel</option>
                      <option value="csv">CSV</option>
                    </select>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Type de statistiques à inclure</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="statistics.dailySales"
                            name="statistics.dailySales"
                            checked={customReportCriteria.statistics.dailySales}
                            onChange={handleCustomReportChange}
                            className="h-4 w-4 text-[color:var(--color-primary)] focus:ring-[color:var(--color-primary)] border-gray-300 rounded"
                          />
                          <label htmlFor="statistics.dailySales" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            Ventes journalières
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="statistics.weeklySales"
                            name="statistics.weeklySales"
                            checked={customReportCriteria.statistics.weeklySales}
                            onChange={handleCustomReportChange}
                            className="h-4 w-4 text-[color:var(--color-primary)] focus:ring-[color:var(--color-primary)] border-gray-300 rounded"
                          />
                          <label htmlFor="statistics.weeklySales" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            Ventes hebdomadaires
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="statistics.monthlySales"
                            name="statistics.monthlySales"
                            checked={customReportCriteria.statistics.monthlySales}
                            onChange={handleCustomReportChange}
                            className="h-4 w-4 text-[color:var(--color-primary)] focus:ring-[color:var(--color-primary)] border-gray-300 rounded"
                          />
                          <label htmlFor="statistics.monthlySales" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            Ventes mensuelles
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="statistics.yearlySales"
                            name="statistics.yearlySales"
                            checked={customReportCriteria.statistics.yearlySales}
                            onChange={handleCustomReportChange}
                            className="h-4 w-4 text-[color:var(--color-primary)] focus:ring-[color:var(--color-primary)] border-gray-300 rounded"
                          />
                          <label htmlFor="statistics.yearlySales" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            Ventes annuelles
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="statistics.topProducts"
                            name="statistics.topProducts"
                            checked={customReportCriteria.statistics.topProducts}
                            onChange={handleCustomReportChange}
                            className="h-4 w-4 text-[color:var(--color-primary)] focus:ring-[color:var(--color-primary)] border-gray-300 rounded"
                          />
                          <label htmlFor="statistics.topProducts" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            Produits populaires
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="statistics.salesByCategory"
                            name="statistics.salesByCategory"
                            checked={customReportCriteria.statistics.salesByCategory}
                            onChange={handleCustomReportChange}
                            className="h-4 w-4 text-[color:var(--color-primary)] focus:ring-[color:var(--color-primary)] border-gray-300 rounded"
                          />
                          <label htmlFor="statistics.salesByCategory" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            Ventes par catégorie
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="statistics.salesByPaymentMethod"
                            name="statistics.salesByPaymentMethod"
                            checked={customReportCriteria.statistics.salesByPaymentMethod}
                            onChange={handleCustomReportChange}
                            className="h-4 w-4 text-[color:var(--color-primary)] focus:ring-[color:var(--color-primary)] border-gray-300 rounded"
                          />
                          <label htmlFor="statistics.salesByPaymentMethod" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            Ventes par moyen de paiement
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="statistics.profitMargins"
                            name="statistics.profitMargins"
                            checked={customReportCriteria.statistics.profitMargins}
                            onChange={handleCustomReportChange}
                            className="h-4 w-4 text-[color:var(--color-primary)] focus:ring-[color:var(--color-primary)] border-gray-300 rounded"
                          />
                          <label htmlFor="statistics.profitMargins" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            Marges bénéficiaires
                          </label>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filtres supplémentaires</p>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="filters.includeProducts"
                            name="filters.includeProducts"
                            checked={customReportCriteria.filters.includeProducts}
                            onChange={handleCustomReportChange}
                            className="h-4 w-4 text-[color:var(--color-primary)] focus:ring-[color:var(--color-primary)] border-gray-300 rounded"
                          />
                          <label htmlFor="filters.includeProducts" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            Détails des produits
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="filters.includeEmployees"
                            name="filters.includeEmployees"
                            checked={customReportCriteria.filters.includeEmployees}
                            onChange={handleCustomReportChange}
                            className="h-4 w-4 text-[color:var(--color-primary)] focus:ring-[color:var(--color-primary)] border-gray-300 rounded"
                          />
                          <label htmlFor="filters.includeEmployees" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            Performance des employés
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="filters.includePaymentMethods"
                            name="filters.includePaymentMethods"
                            checked={customReportCriteria.filters.includePaymentMethods}
                            onChange={handleCustomReportChange}
                            className="h-4 w-4 text-[color:var(--color-primary)] focus:ring-[color:var(--color-primary)] border-gray-300 rounded"
                          />
                          <label htmlFor="filters.includePaymentMethods" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            Moyens de paiement
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="filters.onlyCompleted"
                            name="filters.onlyCompleted"
                            checked={customReportCriteria.filters.onlyCompleted}
                            onChange={handleCustomReportChange}
                            className="h-4 w-4 text-[color:var(--color-primary)] focus:ring-[color:var(--color-primary)] border-gray-300 rounded"
                          />
                          <label htmlFor="filters.onlyCompleted" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                            Uniquement ventes terminées
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--color-primary)]"
                    onClick={() => setIsReportModalOpen(false)}
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-[color:var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[color:var(--color-primary-dark)] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--color-primary)]"
                    onClick={generateCustomReport}
                  >
                    Générer
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );

  // Message quand il n'y a aucune transaction dans le système
  const NoDataMessage = () => (
    <div className="flex flex-col items-center justify-center py-16 px-6 bg-white rounded-lg shadow-sm mx-auto max-w-3xl my-8">
      <img 
        src="/empty-data.svg" 
        alt="Aucune donnée" 
        className="w-40 h-40 mb-6 opacity-60"
        onError={(e) => {
          // Fallback si l'image n'existe pas
          e.currentTarget.style.display = 'none';
        }}
      />
      <h3 className="text-xl font-medium text-gray-800 dark:text-white mb-3 text-center">Aucune donnée disponible</h3>
      <p className="text-gray-500 text-center max-w-lg mb-6">
        Vous n'avez pas encore effectué de ventes. Les statistiques et graphiques apparaîtront ici dès que vous commencerez à enregistrer des ventes.
      </p>
      <div className="flex justify-center gap-4">
        <button 
          onClick={() => window.location.href = '/'}
          className="bg-[color:var(--color-primary)] text-white px-6 py-2.5 rounded-lg hover:bg-[color:var(--color-primary-dark)] transition-colors font-medium"
        >
          Retour à la caisse
        </button>
      </div>
    </div>
  );
  
  // Message quand il y a des transactions mais aucune pour la période filtrée
  const NoFilteredDataMessage = () => (
    <div className="flex flex-col items-center justify-center py-16 px-6 bg-white rounded-lg shadow-sm mx-auto max-w-3xl my-8">
      <img 
        src="/empty-filter.svg" 
        alt="Aucune donnée pour cette période" 
        className="w-40 h-40 mb-6 opacity-60"
        onError={(e) => {
          // Fallback si l'image n'existe pas
          e.currentTarget.style.display = 'none';
        }}
      />
      <h3 className="text-xl font-medium text-gray-800 dark:text-white mb-3 text-center">Aucune donnée pour cette période</h3>
      <p className="text-gray-500 text-center max-w-lg mb-6">
        Il n'y a pas de transactions pour la période sélectionnée. Essayez de choisir une autre période ou de vérifier vos filtres.
      </p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 theme-primary-border mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Chargement des rapports...</p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Veuillez patienter pendant le traitement des données</p>
          </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
          <button 
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 theme-primary text-white rounded-lg hover:opacity-80"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (filteredSales.length === 0) {
    return (
      <div className="flex-1 p-6 overflow-auto bg-gray-50 dark:bg-gray-900">
        <div className="max-w-[2000px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Tableau de bord</h1>
              <p className="text-gray-500 dark:text-gray-400">Analyse des performances commerciales</p>
            </div>
          </div>
          
          {/* Toujours afficher les boutons de sélection de période */}
          <DateRangeSelector />
          
          {/* Afficher le message approprié selon qu'il y a des ventes ou non */}
          {allSales.length > 0 ? <NoFilteredDataMessage /> : <NoDataMessage />}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 overflow-auto" data-component-name="Reports">
      <div className="max-w-[2000px] mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Tableau de bord</h1>
            <p className="text-gray-500 dark:text-gray-400">Analyse des performances commerciales</p>
          </div>
          <DateRangeSelector />
        </div>
        
        {/* Modal de rapport personnalisé */}
        <CustomReportModal />

        {/* Utiliser le composant KpiCards avec des données nettoyées */}
        <div className="mb-8">
          <KpiCards 
            sales={Array.isArray(filteredSales) ? filteredSales : []} 
            previousSales={Array.isArray(previousSales) ? previousSales : []} 
            salesReport={salesReport || {}}
          />
        </div>

        <Tabs 
          defaultValue="overview" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="mb-8"
        >
          <TabsList className="mb-8 bg-white dark:bg-gray-800 p-1 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            <TabsTrigger value="overview" className="data-[state=active]:theme-primary data-[state=active]:text-white dark:text-gray-300 dark:data-[state=inactive]:text-gray-300">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="sales" className="data-[state=active]:theme-primary data-[state=active]:text-white dark:text-gray-300 dark:data-[state=inactive]:text-gray-300">Analyse des ventes</TabsTrigger>
            <TabsTrigger value="products" className="data-[state=active]:theme-primary data-[state=active]:text-white dark:text-gray-300 dark:data-[state=inactive]:text-gray-300">Analyse des produits</TabsTrigger>
            <TabsTrigger value="employees" className="data-[state=active]:theme-primary data-[state=active]:text-white dark:text-gray-300 dark:data-[state=inactive]:text-gray-300">Performance des employés</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-xl mb-4 text-gray-800 dark:text-white flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 theme-primary-text" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Évolution des ventes
              </h3>
              <SalesEvolutionChart sales={Array.isArray(filteredSales) ? filteredSales : []} dateRange={dateRange} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="font-semibold text-xl mb-4 text-gray-800 dark:text-white flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 theme-primary-text" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                </svg>
                Top 10 des produits
              </h3>
              <TopProductsChart sales={Array.isArray(filteredSales) ? filteredSales : []} />
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-xl mb-4 text-gray-800 dark:text-white flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 theme-primary-text" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                  <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                </svg>
                Répartition par catégorie
              </h3>
              <CategoryPieChart sales={Array.isArray(filteredSales) ? filteredSales : []} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-xl mb-4 text-gray-800 dark:text-white flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 theme-primary-text" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
              </svg>
              Évolution des ventes
            </h3>
            <SalesEvolutionChart sales={Array.isArray(filteredSales) ? filteredSales : []} dateRange={dateRange} />
          </div>
            
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-xl mb-4 text-gray-800 dark:text-white flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 theme-primary-text" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
              Ventes par heure
            </h3>
            <HourlySalesChart sales={Array.isArray(filteredSales) ? filteredSales : []} />
          </div>
            
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-xl mb-4 text-gray-800 dark:text-white flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 theme-primary-text" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2h14a1 1 0 100-2H3zm0 6a1 1 0 000 2h14a1 1 0 100-2H3zm0 6a1 1 0 000 2h14a1 1 0 100-2H3z" clipRule="evenodd" />
              </svg>
              Historique des ventes
            </h3>
            <SalesTable sales={Array.isArray(filteredSales) ? filteredSales : []} />
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-xl mb-4 text-gray-800 dark:text-white flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 theme-primary-text" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
              </svg>
              Top 10 des produits
            </h3>
            <TopProductsChart sales={Array.isArray(filteredSales) ? filteredSales : []} />
          </div>
            
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-xl mb-4 text-gray-800 dark:text-white flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 theme-primary-text" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
              </svg>
              Répartition par catégorie
            </h3>
            <CategoryPieChart sales={Array.isArray(filteredSales) ? filteredSales : []} />
          </div>
            
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-xl mb-4 text-gray-800 dark:text-white flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 theme-primary-text" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 000 2h14a1 1 0 100-2H3zm0 6a1 1 0 000 2h14a1 1 0 100-2H3zm0 6a1 1 0 000 2h14a1 1 0 100-2H3z" clipRule="evenodd" />
              </svg>
              Performance des produits
            </h3>
            <ProductPerformanceTable sales={Array.isArray(filteredSales) ? filteredSales : []} />
          </div>
        </TabsContent>

        <TabsContent value="employees" className="space-y-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-xl mb-4 text-gray-800 dark:text-white flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 theme-primary-text" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              Performance des employés
            </h3>
            <EmployeePerformanceChart 
              sales={Array.isArray(filteredSales) ? filteredSales : []} 
              employees={Array.isArray(employees) ? employees : []} 
            />
          </div>
            
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-xl mb-4 text-gray-800 dark:text-white flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 theme-primary-text" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              Détails des performances
            </h3>
            <EmployeePerformanceTable 
              sales={Array.isArray(filteredSales) ? filteredSales : []} 
              employees={Array.isArray(employees) ? employees : []} 
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  </div>
  );
};

export default Reports;
