import { db } from '../firebase';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { Product, Employee } from '../types';
import { getSalesByDate, getSales } from './saleService';
import { getProducts } from './productService';
import { getEmployees } from './employeeService';
import { getCurrentBusinessId } from '../utils/authUtils';
import { auth } from '../firebase';

// Collection pour stocker les rapports par entreprise
const BUSINESS_REPORTS_COLLECTION = 'business_reports';

// Cache local pour les rapports
let reportsCache: Record<string, any> = {};

/**
 * Stocke un rapport pour une entreprise spécifique
 */
const storeReportForBusiness = async (businessId: string, reportType: string, reportData: any) => {
  try {
    console.log(`Stockage du rapport ${reportType} pour l'entreprise ${businessId}`);
    
    // Nettoyer les données pour éviter les valeurs undefined
    const cleanData = (data: any): any => {
      if (data === undefined || data === null) return null;
      
      if (Array.isArray(data)) {
        return data.map(item => cleanData(item)).filter(item => item !== null);
      }
      
      if (typeof data === 'object' && data !== null) {
        const result: Record<string, any> = {};
        for (const key in data) {
          const value = cleanData(data[key]);
          if (value !== null) {
            result[key] = value;
          }
        }
        return result;
      }
      
      return data;
    };
    
    // Préparer les données pour Firestore
    const cleanedData = cleanData(reportData);
    
    // Vérifier la taille des données (estimation)
    const dataSize = JSON.stringify(cleanedData).length;
    console.log(`Taille estimée du rapport: ${dataSize} octets`);
    
    // Si le rapport est trop volumineux, le diviser en morceaux
    const MAX_DOC_SIZE = 900000; // Limite à 900Ko pour être sûr (limite Firestore: 1Mo)
    
    if (dataSize > MAX_DOC_SIZE) {
      console.log(`Le rapport est trop volumineux (${dataSize} octets), division en morceaux`);
      
      // Stocker uniquement les métadonnées et les résumés dans le document principal
      const metadataDoc = {
        lastUpdated: Timestamp.now(),
        reportType,
        isMultipart: true,
        totalSize: dataSize,
        summary: cleanedData.summary || {},
        period: cleanedData.period || {},
        businessId
      };
      
      // Créer une référence au document principal
      const businessReportRef = doc(db, BUSINESS_REPORTS_COLLECTION, businessId);
      
      // Stocker les métadonnées dans le document principal
      await setDoc(businessReportRef, {
        [reportType]: metadataDoc
      }, { merge: true });
      
      // Diviser les données détaillées en morceaux
      if (cleanedData.salesByDate) {
        // Stocker les ventes par date dans un document séparé
        const salesByDateRef = doc(db, BUSINESS_REPORTS_COLLECTION, `${businessId}_${reportType}_salesByDate`);
        await setDoc(salesByDateRef, {
          data: cleanedData.salesByDate,
          lastUpdated: Timestamp.now()
        });
      }
      
      if (cleanedData.salesByCategory) {
        // Stocker les ventes par catégorie dans un document séparé
        const salesByCategoryRef = doc(db, BUSINESS_REPORTS_COLLECTION, `${businessId}_${reportType}_salesByCategory`);
        await setDoc(salesByCategoryRef, {
          data: cleanedData.salesByCategory,
          lastUpdated: Timestamp.now()
        });
      }
      
      if (cleanedData.salesByEmployee) {
        // Stocker les ventes par employé dans un document séparé
        const salesByEmployeeRef = doc(db, BUSINESS_REPORTS_COLLECTION, `${businessId}_${reportType}_salesByEmployee`);
        await setDoc(salesByEmployeeRef, {
          data: cleanedData.salesByEmployee,
          lastUpdated: Timestamp.now()
        });
      }
      
      console.log(`Rapport ${reportType} stocké en plusieurs parties pour l'entreprise ${businessId}`);
    } else {
      // Le rapport est assez petit pour être stocké dans un seul document
      const businessReportRef = doc(db, BUSINESS_REPORTS_COLLECTION, businessId);
      
      const reportToStore = {
        ...cleanedData,
        lastUpdated: Timestamp.now(),
        isMultipart: false
      };
      
      // Stocker le rapport dans le document
      await setDoc(businessReportRef, {
        [reportType]: reportToStore
      }, { merge: true });
      
      console.log(`Rapport ${reportType} stocké en un seul document pour l'entreprise ${businessId}`);
    }
    
    // Mettre à jour le cache local
    if (!reportsCache[businessId]) {
      reportsCache[businessId] = {};
    }
    reportsCache[businessId][reportType] = reportData;
    
    console.log(`Rapport ${reportType} stocké avec succès pour l'entreprise ${businessId}`);
  } catch (error) {
    console.error(`Erreur lors du stockage du rapport ${reportType} pour l'entreprise ${businessId}:`, error);
  }
};

/**
 * Récupère un rapport stocké pour une entreprise spécifique
 */
const getReportForBusiness = async (businessId: string, reportType: string): Promise<any | null> => {
  try {
    console.log(`Récupération du rapport ${reportType} pour l'entreprise ${businessId}`);
    
    // Vérifier d'abord dans le cache local
    if (reportsCache[businessId] && reportsCache[businessId][reportType]) {
      console.log(`Rapport ${reportType} trouvé dans le cache pour l'entreprise ${businessId}`);
      return reportsCache[businessId][reportType];
    }
    
    // Créer une référence au document de l'entreprise
    const businessReportRef = doc(db, BUSINESS_REPORTS_COLLECTION, businessId);
    const businessReportSnap = await getDoc(businessReportRef);
    
    if (businessReportSnap.exists()) {
      const data = businessReportSnap.data();
      
      // Si le rapport existe, vérifier s'il est en plusieurs parties
      if (data[reportType]) {
        console.log(`Rapport ${reportType} récupéré depuis Firestore pour l'entreprise ${businessId}`);
        
        const reportData = data[reportType];
        
        // Vérifier si le rapport est stocké en plusieurs parties
        if (reportData.isMultipart) {
          console.log(`Le rapport ${reportType} est stocké en plusieurs parties, récupération des morceaux`);
          
          // Récupérer les différentes parties du rapport
          const completeReport = { ...reportData };
          
          // Récupérer les ventes par date
          try {
            const salesByDateRef = doc(db, BUSINESS_REPORTS_COLLECTION, `${businessId}_${reportType}_salesByDate`);
            const salesByDateSnap = await getDoc(salesByDateRef);
            if (salesByDateSnap.exists()) {
              completeReport.salesByDate = salesByDateSnap.data().data;
            }
          } catch (error) {
            console.error(`Erreur lors de la récupération des ventes par date:`, error);
          }
          
          // Récupérer les ventes par catégorie
          try {
            const salesByCategoryRef = doc(db, BUSINESS_REPORTS_COLLECTION, `${businessId}_${reportType}_salesByCategory`);
            const salesByCategorySnap = await getDoc(salesByCategoryRef);
            if (salesByCategorySnap.exists()) {
              completeReport.salesByCategory = salesByCategorySnap.data().data;
            }
          } catch (error) {
            console.error(`Erreur lors de la récupération des ventes par catégorie:`, error);
          }
          
          // Récupérer les ventes par employé
          try {
            const salesByEmployeeRef = doc(db, BUSINESS_REPORTS_COLLECTION, `${businessId}_${reportType}_salesByEmployee`);
            const salesByEmployeeSnap = await getDoc(salesByEmployeeRef);
            if (salesByEmployeeSnap.exists()) {
              completeReport.salesByEmployee = salesByEmployeeSnap.data().data;
            }
          } catch (error) {
            console.error(`Erreur lors de la récupération des ventes par employé:`, error);
          }
          
          // Mettre à jour le cache local avec le rapport complet
          if (!reportsCache[businessId]) {
            reportsCache[businessId] = {};
          }
          reportsCache[businessId][reportType] = completeReport;
          
          return completeReport;
        } else {
          // Le rapport est stocké dans un seul document
          // Mettre à jour le cache local
          if (!reportsCache[businessId]) {
            reportsCache[businessId] = {};
          }
          reportsCache[businessId][reportType] = reportData;
          
          return reportData;
        }
      }
    }
    
    console.log(`Aucun rapport ${reportType} trouvé pour l'entreprise ${businessId}`);
    return null;
  } catch (error) {
    console.error(`Erreur lors de la récupération du rapport ${reportType} pour l'entreprise ${businessId}:`, error);
    return null;
  }
};

/**
 * Génère un rapport de ventes pour une période donnée
 */
export const generateSalesReport = async (startDate: Date, endDate: Date, forceRefresh = false) => {
  try {
    // Vérifier l'état de l'authentification
    const user = auth.currentUser;
    const businessId = getCurrentBusinessId(); // Utiliser la version synchrone
    
    console.log("État de l'authentification pour le rapport:", user ? "Connecté" : "Non connecté");
    console.log("ID entreprise pour le rapport:", businessId);
    
    // Créer une clé unique pour ce rapport basée sur la période et l'ID entreprise
    const reportKey = `sales_${businessId}_${startDate.toISOString()}_${endDate.toISOString()}`;
    
    // Vérifier si nous avons déjà ce rapport en cache (sauf si forceRefresh est true)
    if (!forceRefresh) {
      const cachedReport = await getReportForBusiness(businessId, reportKey);
      if (cachedReport) {
        console.log(`Utilisation du rapport en cache pour la période ${startDate} - ${endDate}`);
        return cachedReport;
      }
    } else {
      console.log(`Régénération forcée du rapport pour la période ${startDate} - ${endDate}`);
    }
    
    console.log(`Génération d'un nouveau rapport pour la période ${startDate} - ${endDate}`);
    
    // Récupérer les ventes directement depuis la fonction getSales pour garantir la cohérence
    const allSales = await getSales();
    console.log(`${allSales.length} ventes chargées depuis getSales()`);
    
    // Utiliser exactement la même logique de filtrage que dans SalesHistoryFirebase
    const filteredSales = allSales.filter(sale => {
      // Vérifier si la vente a un businessId
      if (!sale.businessId) {
        console.log("Vente ignorée car businessId manquant:", sale.id);
        return false;
      }
      
      // Accepter les ventes avec le businessId de l'utilisateur ou 'business1' en développement
      const isValid = sale.businessId === businessId || 
                      (businessId === 'business1' && sale.businessId === 'business1') ||
                      (businessId === 'business1'); // En mode dev, accepter toutes les ventes
      
      if (!isValid) {
        console.log("Vente ignorée car businessId incorrect:", sale.id, sale.businessId, "≠", businessId);
      }
      
      return isValid;
    });
    
    console.log("Ventes valides après filtrage par businessId:", filteredSales.length);
    
    // Filtrer les ventes par date
    const salesInDateRange = filteredSales.filter(sale => {
      try {
        const saleDate = new Date(sale.timestamp);
        // Vérifier que la date est valide
        if (isNaN(saleDate.getTime())) {
          console.warn("Date invalide ignorée:", sale.timestamp, "pour la vente:", sale.id);
          return false;
        }
        const isInRange = saleDate >= startDate && saleDate <= endDate;
        if (!isInRange) {
          console.log(`Vente ${sale.id} hors période: ${saleDate.toISOString()} n'est pas entre ${startDate.toISOString()} et ${endDate.toISOString()}`);
        }
        return isInRange;
      } catch (error) {
        console.error("Erreur lors de la conversion de la date:", error, "pour la vente:", sale.id);
        return false;
      }
    });
    
    console.log(`${salesInDateRange.length} ventes après filtrage par date`);
    
    // Si aucune vente n'est trouvée pour cette période, retourner un rapport vide
    if (salesInDateRange.length === 0) {
      console.log("Aucune vente trouvée pour cette période, retour d'un rapport vide");
      const emptyReport = {
        summary: {
          totalSales: 0,
          totalRevenue: 0,
          totalItems: 0,
          averageTicket: 0
        },
        sales: [],
        paymentMethods: {
          salesByPaymentMethod: {},
          revenueByPaymentMethod: {}
        },
        categories: {
          salesByCategory: {},
          revenueByCategory: {}
        },
        hourlyDistribution: {},
        topProducts: []
      };
      
      // Stocker le rapport vide dans le cache
      await storeReportForBusiness(businessId, reportKey, emptyReport);
      
      return emptyReport;
    }
    
    // Calculer les totaux
    const totalSales = salesInDateRange.length;
    const totalRevenue = salesInDateRange.reduce((sum, sale) => sum + sale.total, 0);
    const totalItems = salesInDateRange.reduce((sum, sale) => 
      sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
    
    // Calculer les ventes par méthode de paiement
    const salesByPaymentMethod = {
      cash: salesInDateRange.filter(sale => sale.paymentMethod === 'cash').length,
      card: salesInDateRange.filter(sale => sale.paymentMethod === 'card').length
    };
    
    // Calculer les revenus par méthode de paiement
    const revenueByPaymentMethod = {
      cash: salesInDateRange.filter(sale => sale.paymentMethod === 'cash')
        .reduce((sum, sale) => sum + sale.total, 0),
      card: salesInDateRange.filter(sale => sale.paymentMethod === 'card')
        .reduce((sum, sale) => sum + sale.total, 0)
    };
    
    // Calculer les ventes par jour
    const salesByDay: Record<string, number> = {};
    const revenueByDay: Record<string, number> = {};
    
    salesInDateRange.forEach(sale => {
      const day = new Date(sale.timestamp).toISOString().split('T')[0];
      salesByDay[day] = (salesByDay[day] || 0) + 1;
      revenueByDay[day] = (revenueByDay[day] || 0) + sale.total;
    });
    
    // Calculer les ventes par heure
    const salesByHour: Record<number, number> = {};
    const revenueByHour: Record<number, number> = {};
    
    salesInDateRange.forEach(sale => {
      const hour = new Date(sale.timestamp).getHours();
      salesByHour[hour] = (salesByHour[hour] || 0) + 1;
      revenueByHour[hour] = (revenueByHour[hour] || 0) + sale.total;
    });
    
    // Calculer les produits les plus vendus
    const productSales: Record<string, { quantity: number, revenue: number }> = {};
    
    salesInDateRange.forEach(sale => {
      if (!sale.items) {
        console.warn('Vente sans articles:', sale.id);
        return;
      }
      
      sale.items.forEach(item => {
        // Vérifier que l'article et le produit existent
        if (!item || !item.product) {
          console.warn('Article sans produit dans la vente:', sale.id);
          return;
        }
        
        const productId = item.product.id;
        if (!productId) {
          console.warn('Produit sans ID dans la vente:', sale.id);
          return;
        }
        
        if (!productSales[productId]) {
          productSales[productId] = { quantity: 0, revenue: 0 };
        }
        
        productSales[productId].quantity += item.quantity || 0;
        productSales[productId].revenue += (item.quantity || 0) * (item.product.price || 0);
      });
    });
    
    // Obtenir les détails des produits pour cette entreprise
    const products = await getProducts();
    
    // S'assurer que nous n'utilisons que les produits de cette entreprise
    const filteredProducts = products.filter(product => product.businessId === businessId);
    
    const productMap = new Map<string, Product>();
    filteredProducts.forEach(product => productMap.set(product.id, product));
    
    // Créer le tableau des produits les plus vendus
    const topProducts = Object.entries(productSales)
      .map(([productId, stats]) => ({
        product: productMap.get(productId) || { 
          id: productId, 
          name: 'Produit inconnu',
          businessId: businessId 
        } as Product,
        quantity: stats.quantity,
        revenue: stats.revenue
      }))
      .sort((a, b) => b.quantity - a.quantity);
    
    // Calculer les ventes par catégorie
    const salesByCategory: Record<string, { quantity: number, revenue: number }> = {};
    
    salesInDateRange.forEach(sale => {
      if (!sale.items) {
        console.warn('Vente sans articles pour les catégories:', sale.id);
        return;
      }
      
      sale.items.forEach(item => {
        // Vérifier que l'article et le produit existent
        if (!item || !item.product) {
          console.warn('Article sans produit pour les catégories dans la vente:', sale.id);
          return;
        }
        
        const category = item.product.category || 'Non catégorisé';
        if (!salesByCategory[category]) {
          salesByCategory[category] = { quantity: 0, revenue: 0 };
        }
        
        salesByCategory[category].quantity += item.quantity || 0;
        salesByCategory[category].revenue += (item.quantity || 0) * (item.product.price || 0);
      });
    });
    
    // Obtenir les détails des employés pour cette entreprise
    const employees = await getEmployees();
    
    // S'assurer que nous n'utilisons que les employés de cette entreprise
    const filteredEmployees = employees.filter(employee => employee.businessId === businessId);
    
    const employeeMap = new Map<string, Employee>();
    filteredEmployees.forEach(employee => employeeMap.set(employee.id, employee));
    
    // Calculer les ventes par employé
    const salesByEmployee: Record<string, { count: number, revenue: number }> = {};
    
    salesInDateRange.forEach(sale => {
      // Vérifier que l'ID de l'employé existe
      const employeeId = sale.employeeId;
      if (!employeeId) {
        console.warn('Vente sans ID d\'employé:', sale.id);
        return;
      }
      
      if (!salesByEmployee[employeeId]) {
        salesByEmployee[employeeId] = { count: 0, revenue: 0 };
      }
      
      salesByEmployee[employeeId].count += 1;
      salesByEmployee[employeeId].revenue += sale.total || 0;
    });
    
    // Créer le tableau des performances des employés
    const employeePerformance = Object.entries(salesByEmployee)
      .map(([employeeId, stats]) => {
        const employee = employeeMap.get(employeeId);
        return {
          employee: employee || { 
            id: employeeId, 
            firstName: 'Employé', 
            lastName: 'Inconnu',
            businessId: businessId
          } as Employee,
          salesCount: stats.count,
          salesRevenue: stats.revenue,
          averageTicket: stats.count > 0 ? stats.revenue / stats.count : 0
        };
      })
      .sort((a, b) => b.salesCount - a.salesCount);
    
    // Créer l'objet rapport final
    const report = {
      period: {
        startDate,
        endDate
      },
      summary: {
        totalSales,
        totalRevenue,
        totalItems,
        averageTicket: totalSales > 0 ? totalRevenue / totalSales : 0
      },
      paymentMethods: {
        salesByPaymentMethod,
        revenueByPaymentMethod
      },
      timeSeries: {
        salesByDay,
        revenueByDay,
        salesByHour,
        revenueByHour
      },
      products: {
        topProducts,
        salesByCategory
      },
      employees: {
        employeePerformance
      },
      businessId: businessId,
      sales: salesInDateRange, // Inclure les ventes filtrées dans le rapport
      generatedAt: new Date().toISOString() // Ajouter un timestamp de génération
    };
    
    // Stocker le rapport pour une utilisation future
    await storeReportForBusiness(businessId, reportKey, report);
    
    return report;
  } catch (error) {
    console.error('Erreur lors de la génération du rapport de ventes:', error);
    return null;
  }
};

/**
 * Génère un rapport de stock
 */
export const generateStockReport = async (forceRefresh = false) => {
  try {
    const businessId = getCurrentBusinessId();
    console.log("ID entreprise pour le rapport de stock:", businessId);
    
    // Créer une clé unique pour ce rapport
    const reportKey = `stock_${businessId}_${new Date().toISOString().split('T')[0]}`;
    
    // Vérifier si nous avons déjà ce rapport en cache (sauf si forceRefresh est true)
    if (!forceRefresh) {
      const cachedReport = await getReportForBusiness(businessId, reportKey);
      if (cachedReport) {
        console.log('Utilisation du rapport de stock en cache');
        return cachedReport;
      }
    }
    
    console.log('Génération d\'un nouveau rapport de stock');
    
    // Récupérer tous les produits
    const products = await getProducts();
    
    // Filtrer les produits par businessId
    const filteredProducts = products.filter(product => 
      product.businessId === businessId || 
      (businessId === 'business1' && product.businessId === 'business1')
    );
    
    // Calculer les statistiques de stock
    const lowStockProducts = filteredProducts.filter(product => 
      product.lowStockThreshold && product.stock <= product.lowStockThreshold
    );
    
    const outOfStockProducts = filteredProducts.filter(product => product.stock === 0);
    
    const totalProducts = filteredProducts.length;
    const totalStock = filteredProducts.reduce((sum, product) => sum + product.stock, 0);
    const totalValue = filteredProducts.reduce((sum, product) => sum + (product.stock * product.price), 0);
    
    // Calculer le stock par catégorie
    const stockByCategory: Record<string, { count: number, value: number }> = {};
    
    filteredProducts.forEach(product => {
      const category = product.category || 'Non catégorisé';
      if (!stockByCategory[category]) {
        stockByCategory[category] = { count: 0, value: 0 };
      }
      stockByCategory[category].count += product.stock;
      stockByCategory[category].value += product.stock * product.price;
    });
    
    // Créer l'objet rapport final
    const report = {
      date: new Date(),
      summary: {
        totalProducts,
        totalStock,
        totalValue,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length
      },
      details: {
        lowStockProducts,
        outOfStockProducts,
        stockByCategory
      },
      businessId: businessId
    };
    
    // Stocker le rapport pour une utilisation future
    await storeReportForBusiness(businessId, reportKey, report);
    
    return report;
  } catch (error) {
    console.error('Erreur lors de la génération du rapport de stock:', error);
    return null;
  }
};

/**
 * Génère un rapport de performance des employés
 */
export const generateEmployeeReport = async (startDate: Date, endDate: Date, forceRefresh = false) => {
  try {
    const businessId = getCurrentBusinessId();
    console.log("ID entreprise pour le rapport d'employés:", businessId);
    
    // Créer une clé unique pour ce rapport
    const reportKey = `employees_${businessId}_${startDate.toISOString()}_${endDate.toISOString()}`;
    
    // Vérifier si nous avons déjà ce rapport en cache (sauf si forceRefresh est true)
    if (!forceRefresh) {
      const cachedReport = await getReportForBusiness(businessId, reportKey);
      if (cachedReport) {
        console.log(`Utilisation du rapport d'employés en cache pour la période ${startDate} - ${endDate}`);
        return cachedReport;
      }
    } else {
      console.log(`Régénération forcée du rapport d'employés pour la période ${startDate} - ${endDate}`);
    }
    
    console.log(`Génération d'un nouveau rapport d'employés pour la période ${startDate} - ${endDate}`);
    
    // Récupérer les ventes pour la période
    const sales = await getSalesByDate(startDate, endDate);
    
    // Filtrer les ventes par businessId
    const filteredSales = sales.filter(sale => 
      sale.businessId === businessId || 
      (businessId === 'business1' && sale.businessId === 'business1')
    );
    
    // Obtenir tous les employés pour cette entreprise
    const employees = await getEmployees();
    
    // S'assurer que nous n'utilisons que les employés de cette entreprise
    const filteredEmployees = employees.filter(employee => employee.businessId === businessId);
    
    // Calculer les performances par employé
    const employeeStats: Record<string, {
      totalSales: number;
      totalRevenue: number;
      totalItems: number;
      averageTicket: number;
      salesByHour: Record<number, number>;
      salesByCategory: Record<string, number>;
    }> = {};
    
    // Initialiser les statistiques pour chaque employé
    filteredEmployees.forEach(employee => {
      employeeStats[employee.id] = {
        totalSales: 0,
        totalRevenue: 0,
        totalItems: 0,
        averageTicket: 0,
        salesByHour: {},
        salesByCategory: {}
      };
    });
    
    // Calculer les statistiques à partir des ventes
    filteredSales.forEach(sale => {
      const employeeId = sale.employeeId;
      
      // Ignorer les ventes sans employé ou avec un employé inconnu
      if (!employeeId || !employeeStats[employeeId]) return;
      
      const stats = employeeStats[employeeId];
      
      // Mettre à jour les totaux
      stats.totalSales += 1;
      stats.totalRevenue += sale.total;
      
      const itemCount = sale.items.reduce((sum, item) => sum + item.quantity, 0);
      stats.totalItems += itemCount;
      
      // Mettre à jour les ventes par heure
      const hour = new Date(sale.timestamp).getHours();
      stats.salesByHour[hour] = (stats.salesByHour[hour] || 0) + 1;
      
      // Mettre à jour les ventes par catégorie
      sale.items.forEach(item => {
        const category = item.product.category || 'Non catégorisé';
        stats.salesByCategory[category] = (stats.salesByCategory[category] || 0) + item.quantity;
      });
    });
    
    // Calculer les moyennes
    Object.values(employeeStats).forEach(stats => {
      stats.averageTicket = stats.totalSales > 0 ? stats.totalRevenue / stats.totalSales : 0;
    });
    
    // Créer le tableau des performances des employés
    const employeePerformance = filteredEmployees.map(employee => {
      const stats = employeeStats[employee.id] || {
        totalSales: 0,
        totalRevenue: 0,
        totalItems: 0,
        averageTicket: 0,
        salesByHour: {},
        salesByCategory: {}
      };
      
      return {
        employee,
        stats
      };
    }).sort((a, b) => b.stats.totalRevenue - a.stats.totalRevenue);
    
    // Créer l'objet rapport final
    const report = {
      period: {
        startDate,
        endDate
      },
      summary: {
        totalEmployees: filteredEmployees.length,
        totalSales: filteredSales.length,
        totalRevenue: filteredSales.reduce((sum, sale) => sum + sale.total, 0)
      },
      employeePerformance,
      businessId: businessId
    };
    
    // Stocker le rapport pour une utilisation future
    await storeReportForBusiness(businessId, reportKey, report);
    
    return report;
  } catch (error) {
    console.error('Erreur lors de la génération du rapport d\'employés:', error);
    return null;
  }
};
