import React from 'react';
import { Sale, Employee } from '../../types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Fonction utilitaire pour formater les montants en euros
const formatCurrency = (amount: number): string => {
  if (isNaN(amount) || amount === undefined) return '0,00 €';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
};

// Fonction utilitaire pour formater les nombres avec séparateurs de milliers
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('fr-FR').format(num);
};

// Fonction utilitaire pour formater les dates de manière sécurisée
const formatDate = (date: any): string => {
  if (!date) return 'Date inconnue';
  
  try {
    let dateObj;
    
    // Vérifier si c'est un objet Firebase Timestamp
    if (typeof date === 'object' && date !== null && 'toDate' in date && typeof date.toDate === 'function') {
      // Convertir le Timestamp Firebase en Date
      dateObj = date.toDate();
    } else if (typeof date === 'string') {
      // Convertir une chaîne en Date
      dateObj = new Date(date);
    } else if (date instanceof Date) {
      // Déjà un objet Date
      dateObj = date;
    } else {
      console.warn('Type de date non reconnu:', typeof date);
      return 'Format de date non reconnu';
    }
    
    if (isNaN(dateObj.getTime())) {
      console.warn('Date invalide détectée:', JSON.stringify(date));
      return 'Date invalide';
    }
    
    return format(dateObj, 'dd/MM/yyyy HH:mm', { locale: fr });
  } catch (error) {
    console.error('Erreur lors du formatage de la date:', error, 'pour la date:', JSON.stringify(date));
    return 'Date invalide';
  }
};

// Interfaces pour les props des composants
interface SalesTableProps {
  sales?: Sale[];
  employees?: Employee[];
}

interface ProductTableProps {
  sales?: Sale[];
}

interface EmployeeTableProps {
  sales?: Sale[];
  employees?: Employee[];
}

// Tableau des ventes
export const SalesTable: React.FC<SalesTableProps> = ({ sales = [], employees = [] }) => {
  // Si aucune vente n'existe, afficher un message
  if (!sales || sales.length === 0) {
    return (
      <div className="w-full bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <h3 className="font-medium text-gray-700 dark:text-white text-center">Historique des ventes</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-10 px-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-600 dark:text-gray-300 text-center text-lg font-medium mb-2">Aucune vente trouvée</p>
          <p className="text-gray-500 dark:text-gray-400 text-center text-sm max-w-md">Les ventes apparaîtront ici après vos premières transactions</p>
        </div>
      </div>
    );
  }

  // Trier les ventes par date (les plus récentes d'abord)
  const sortedSales = [...sales].sort((a, b) => {
    const dateA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
    const dateB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
    return dateB.getTime() - dateA.getTime();
  });

  // Limiter à 10 ventes pour l'affichage
  const displaySales = sortedSales.slice(0, 10);

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <h3 className="font-medium text-gray-700 dark:text-white">Historique des ventes</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Employé
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Articles
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Paiement
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {displaySales.map((sale, index) => {
              const saleDate = sale.timestamp instanceof Date 
                ? sale.timestamp 
                : new Date(sale.timestamp);
              
              const itemCount = Array.isArray(sale.items) 
                ? sale.items.reduce((sum, item) => sum + (item.quantity || 0), 0)
                : 0;
              
              // Trouver le nom de l'employé à partir de l'ID
              let employeeName = 'N/A';
              if (sale.employeeId) {
                const employee = employees.find(emp => emp.id === sale.employeeId);
                if (employee) {
                  employeeName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
                }
              }
              
              return (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {formatDate(saleDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {employeeName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {formatNumber(itemCount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                    {sale.paymentMethod === 'cash' ? 'Espèces' : sale.paymentMethod === 'card' ? 'Carte' : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(sale.total || 0)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Tableau de performance des produits
export const ProductPerformanceTable: React.FC<ProductTableProps> = ({ sales = [] }) => {
  // Si aucune vente n'existe, afficher un message
  if (!sales || sales.length === 0) {
    return (
      <div className="w-full bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <h3 className="font-medium text-gray-700 dark:text-white text-center">Performance des produits</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-10 px-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <p className="text-gray-600 dark:text-gray-300 text-center text-lg font-medium mb-2">Aucune donnée produit disponible</p>
          <p className="text-gray-500 dark:text-gray-400 text-center text-sm max-w-md">Les statistiques produits apparaîtront ici après vos premières ventes</p>
        </div>
      </div>
    );
  }

  // Calculer les performances des produits
  const productPerformance: Record<string, { 
    name: string, 
    quantity: number, 
    revenue: number,
    category?: string
  }> = {};

  // Parcourir toutes les ventes et leurs articles
  sales.forEach(sale => {
    if (!sale.items || !Array.isArray(sale.items)) return;
    
    sale.items.forEach(item => {
      if (!item.product) return;
      
      const productId = item.product.id || 'unknown';
      const quantity = item.quantity || 0;
      const price = item.product.price || 0;
      const revenue = quantity * price;
      
      if (!productPerformance[productId]) {
        productPerformance[productId] = {
          name: item.product.name || 'Produit inconnu',
          quantity: 0,
          revenue: 0,
          category: item.product.category
        };
      }
      
      productPerformance[productId].quantity += quantity;
      productPerformance[productId].revenue += revenue;
    });
  });

  // Convertir en tableau et trier par chiffre d'affaires
  const productList = Object.values(productPerformance)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10); // Limiter aux 10 meilleurs produits

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <h3 className="font-medium text-gray-700 dark:text-white">Performance des produits</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Produit
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Catégorie
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Quantité vendue
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Chiffre d'affaires
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {productList.map((product, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {product.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {product.category || 'Non catégorisé'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {formatNumber(product.quantity)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(product.revenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Tableau de performance des employés
export const EmployeePerformanceTable: React.FC<EmployeeTableProps> = ({ sales = [], employees = [] }) => {
  // Si aucune vente n'existe, afficher un message
  if (!sales || sales.length === 0) {
    return (
      <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <h3 className="font-medium text-gray-700 dark:text-white text-center">Performance des employés</h3>
        </div>
        <div className="flex flex-col items-center justify-center py-10 px-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-gray-600 dark:text-gray-300 text-center text-lg font-medium mb-2">Aucune donnée employé disponible</p>
          <p className="text-gray-500 dark:text-gray-400 text-center text-sm max-w-md">Les statistiques employés apparaîtront ici après vos premières ventes</p>
        </div>
      </div>
    );
  }

  // Calculer les performances des employés
  const employeePerformance: Record<string, { 
    id: string,
    name: string, 
    transactions: number, 
    revenue: number,
    averageTicket: number
  }> = {};

  // Créer une entrée pour chaque employé
  employees.forEach(employee => {
    const id = employee.id || 'unknown';
    const name = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || 'Employé inconnu';
    
    employeePerformance[id] = {
      id,
      name,
      transactions: 0,
      revenue: 0,
      averageTicket: 0
    };
  });

  // Parcourir toutes les ventes
  sales.forEach(sale => {
    const employeeId = sale.employeeId || 'unknown';
    const revenue = sale.total || 0;
    
    if (!employeePerformance[employeeId]) {
      // Trouver le nom de l'employé à partir de l'ID
      let employeeName = 'Employé inconnu';
      const employee = employees.find(emp => emp.id === employeeId);
      if (employee) {
        employeeName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim();
      }
      
      employeePerformance[employeeId] = {
        id: employeeId,
        name: employeeName,
        transactions: 0,
        revenue: 0,
        averageTicket: 0
      };
    }
    
    employeePerformance[employeeId].transactions += 1;
    employeePerformance[employeeId].revenue += revenue;
  });

  // Calculer le panier moyen pour chaque employé
  Object.values(employeePerformance).forEach(employee => {
    employee.averageTicket = employee.transactions > 0 
      ? employee.revenue / employee.transactions 
      : 0;
  });

  // Convertir en tableau et trier par chiffre d'affaires
  const employeeList = Object.values(employeePerformance)
    .filter(employee => employee.transactions > 0) // Ne garder que les employés avec des ventes
    .sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <h3 className="font-medium text-gray-700 dark:text-white">Performance des employés</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Employé
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Transactions
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Chiffre d'affaires
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Panier moyen
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {employeeList.map((employee, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {employee.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {formatNumber(employee.transactions)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {formatCurrency(employee.revenue)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {formatCurrency(employee.averageTicket)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default { SalesTable, ProductPerformanceTable, EmployeePerformanceTable };
