import React from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell
} from 'recharts';
import { format, isSameDay, isAfter, isBefore, subDays, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Sale, Employee } from '../../types';

// Fonction utilitaire pour formater les nombres avec séparateurs de milliers
const formatNumber = (num: number): string => {
  if (isNaN(num) || num === undefined) return '0';
  return new Intl.NumberFormat('fr-FR').format(num);
};

// Fonction utilitaire pour formater les montants en euros
const formatCurrency = (amount: number): string => {
  if (isNaN(amount) || amount === undefined) return '0,00 €';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
};

interface SalesByDateData {
  date: string;
  revenue: number;
  transactions: number;
}

interface EmployeePerformanceData {
  name: string;
  sales: number;
  transactions: number;
  average: number;
}

interface HourlyData {
  hour: string;
  revenue: number;
  transactions: number;
}

// Palette de couleurs moderne pour les graphiques
const COLORS = [
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#EC4899', // Rose
  '#F43F5E', // Rouge
  '#F97316', // Orange
  '#F59E0B', // Ambre
  '#10B981', // Émeraude
  '#06B6D4', // Cyan
  '#3B82F6', // Bleu
  '#A855F7'  // Pourpre
];

// Formater les montants en euros
const formatEuro = (value: number) => {
  if (isNaN(value) || value === undefined) return '0,00 €';
  return formatCurrency(value);
};

// Tooltip personnalisé moderne pour les graphiques
const CustomTooltip = ({ active, payload, label, valuePrefix = '' }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-200 shadow-lg rounded-md">
        <p className="font-medium text-gray-700 mb-2 border-b pb-1">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => {
            // Vérifier que entry et entry.value sont définis
            if (!entry) return null;
            const value = entry.value !== undefined ? entry.value : 0;
            const name = entry.name || '';
            
            // Déterminer la couleur en fonction du nom de la série
            const isRevenue = name.toLowerCase().includes('chiffre') || name.toLowerCase().includes('revenue');
            const color = isRevenue ? '#4F46E5' : '#10B981';
            
            return (
              <div key={index} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                  <span className="text-sm font-medium">{name}</span>
                </div>
                <span className="font-semibold" style={{ color: color }}>
                  {valuePrefix}
                  {isRevenue 
                    ? formatCurrency(value)
                    : formatNumber(value)
                  }
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

// Graphique d'évolution des ventes
interface SalesEvolutionChartProps {
  sales: Sale[];
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
}
export const SalesEvolutionChart: React.FC<SalesEvolutionChartProps> = ({ sales = [], dateRange = 'week' }) => {
  // Si aucune vente n'existe, afficher un message
  if (!sales || sales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-72 bg-gray-50 rounded-lg border border-gray-200 p-6 mx-auto w-full">
        <div className="text-gray-400 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-gray-600 text-center text-lg font-medium mb-2">Aucune donnée disponible</p>
        <p className="text-gray-500 text-center text-sm max-w-md">Les données apparaîtront ici après vos premières ventes</p>
      </div>
    );
  }

  // Gérer le cas où dateRange est 'all'
  const effectiveDateRange = dateRange === 'all' ? 'month' : dateRange;
  
  // Préparer les données pour le graphique en fonction de la période
  const prepareData = (): SalesByDateData[] => {
    // Retourner un tableau vide si les ventes sont nulles ou vides
    if (!sales || !Array.isArray(sales) || sales.length === 0) {
      console.log('Aucune vente disponible pour le graphique d\'évolution');
      return [
        { date: 'Aucune donnée', revenue: 0, transactions: 0 }
      ];
    }
    
    // Filtrer les ventes en fonction de la période
    const now = new Date();
    const filteredSales = dateRange === 'all' ? sales : sales.filter(sale => {
      try {
        if (!sale || !sale.timestamp) return false;
        
        const saleDate = new Date(sale.timestamp);
        
        if (effectiveDateRange === 'today') {
          return isSameDay(saleDate, now);
        } else if (effectiveDateRange === 'week') {
          return isAfter(saleDate, subDays(now, 7)) && isBefore(saleDate, addDays(now, 1));
        } else if (effectiveDateRange === 'month') {
          return isAfter(saleDate, subDays(now, 30)) && isBefore(saleDate, addDays(now, 1));
        } else { // year
          return isAfter(saleDate, subDays(now, 365)) && isBefore(saleDate, addDays(now, 1));
        }
      } catch (error) {
        console.error('Erreur lors du filtrage des ventes par date:', error);
        return false;
      }
    });
    
    const salesByDate = filteredSales.reduce((acc: Record<string, SalesByDateData>, sale) => {
      // Vérifier que sale existe et que sale.timestamp est une valeur valide
      if (!sale || !sale.timestamp) {
        console.warn('Vente sans timestamp valide ignorée:', sale?.id || 'ID inconnu');
        return acc;
      }
      
      let date;
      try {
        // Vérifier si le timestamp est un objet Firebase Timestamp
        if (typeof sale.timestamp === 'object' && sale.timestamp !== null && 'toDate' in sale.timestamp && typeof sale.timestamp.toDate === 'function') {
          // Convertir le Timestamp Firebase en Date
          date = sale.timestamp.toDate();
        } else {
          // Sinon, essayer de créer une date à partir de la valeur
          date = new Date(sale.timestamp);
        }
        
        // Vérifier que la date est valide
        if (isNaN(date.getTime())) {
          console.warn('Timestamp invalide ignoré:', JSON.stringify(sale.timestamp), 'pour la vente:', sale.id || 'ID inconnu');
          return acc;
        }
      } catch (error) {
        console.error('Erreur lors de la conversion du timestamp:', error, 'pour la vente:', sale.id || 'ID inconnu');
        return acc;
      }
      
      // Format de date en fonction de la période
      let dateKey;
      try {
        if (effectiveDateRange === 'today') {
          dateKey = format(date, 'HH:00', { locale: fr });
        } else if (effectiveDateRange === 'week') {
          dateKey = format(date, 'EEE dd/MM', { locale: fr });
        } else if (effectiveDateRange === 'month') {
          dateKey = format(date, 'dd MMM', { locale: fr });
        } else {
          dateKey = format(date, 'MMM yyyy', { locale: fr });
        }
      } catch (error) {
        console.error('Erreur lors du formatage de la date:', error, 'pour la date:', date);
        // Utiliser un format de secours
        dateKey = date.toISOString().split('T')[0];
      }
      
      // Calculer le total pour chaque date
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          revenue: 0,
          transactions: 0
        };
      }
      
      // Ajouter le montant de la vente avec vérification
      let amount = 0;
      if (sale.total !== undefined && sale.total !== null) {
        amount = typeof sale.total === 'number' && !isNaN(sale.total) ? sale.total : 0;
      }
      
      acc[dateKey].revenue += amount;
      acc[dateKey].transactions += 1;
      
      return acc;
    }, {});
    
    // Convertir en tableau et trier par date
    let sortedData = Object.values(salesByDate);
    
    try {
      sortedData = sortedData.sort((a, b) => {
        // Tri spécial pour le format 'HH:00'
        if (dateRange === 'today') {
          const hourA = parseInt(a.date);
          const hourB = parseInt(b.date);
          if (isNaN(hourA) || isNaN(hourB)) {
            return 0;
          }
          return hourA - hourB;
        }
        return 0; // Conserver l'ordre d'insertion pour les autres formats
      });
    } catch (error) {
      console.error('Erreur lors du tri des données:', error);
      // En cas d'erreur, retourner les données non triées
    }
    
    return sortedData;
  };
  
  const data = prepareData();
  
  // Vérifier si les données sont vides
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] bg-gray-50 rounded-lg">
        <p className="text-gray-500">Aucune donnée disponible pour cette période</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorTransactions" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis yAxisId="left" orientation="left" stroke="#4F46E5" />
        <YAxis yAxisId="right" orientation="right" stroke="#10B981" />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Area 
          type="monotone" 
          dataKey="revenue" 
          name="Chiffre d'affaires"
          stroke="#4F46E5" 
          fillOpacity={1} 
          fill="url(#colorRevenue)" 
          yAxisId="left"
        />
        <Area 
          type="monotone" 
          dataKey="transactions" 
          name="Nombre de ventes"
          stroke="#10B981" 
          fillOpacity={1} 
          fill="url(#colorTransactions)" 
          yAxisId="right"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// Graphique de répartition par catégorie
export const CategoryPieChart: React.FC<{ sales: Sale[] }> = ({ sales = [] }) => {
  // Si aucune vente n'existe, afficher un message
  if (!sales || sales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-72 bg-gray-50 rounded-lg border border-gray-200 p-6 mx-auto w-full">
        <div className="text-gray-400 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
        </div>
        <p className="text-gray-600 text-center text-lg font-medium mb-2">Aucune donnée disponible</p>
        <p className="text-gray-500 text-center text-sm max-w-md">Les données apparaîtront ici après vos premières ventes</p>
      </div>
    );
  }

  // Préparer les données pour le graphique
  const prepareData = () => {
    // Vérifier si les ventes sont valides
    if (!Array.isArray(sales) || sales.length === 0) {
      console.log('Aucune vente disponible pour le graphique de catégories');
      return [{ name: 'Aucune donnée', value: 1, color: '#CBD5E1' }];
    }
    
    const categorySales: Record<string, number> = {};
    
    sales.forEach(sale => {
      if (!sale || !Array.isArray(sale.items)) return;
      
      sale.items.forEach(item => {
        if (!item || !item.product) return;
        
        const category = item.product?.category || 'Non catégorisé';
        if (!categorySales[category]) {
          categorySales[category] = 0;
        }
        
        const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
        const price = typeof item.product?.price === 'number' ? item.product.price : 0;
        categorySales[category] += quantity * price;
      });
    });
    
    // Si aucune catégorie n'a été trouvée
    if (Object.keys(categorySales).length === 0) {
      return [{ name: 'Aucune donnée', value: 1, color: '#CBD5E1' }];
    }
    
    // Préparer les données pour le graphique en camembert
    
    return Object.entries(categorySales).map(([name, value], index) => ({
      name,
      value,
      color: COLORS[index % COLORS.length]
    })).sort((a, b) => b.value - a.value);
  };
  
  const data = prepareData();
  
  // Vérifier si les données sont vides
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] bg-gray-50 rounded-lg">
        <p className="text-gray-500">Aucune donnée disponible pour cette période</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <defs>
          <filter id="glow" height="300%" width="300%" x="-100%" y="-100%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={true}
          outerRadius={120}
          innerRadius={60} // Donut chart plus prononcé
          fill="#8884d8"
          dataKey="value"
          nameKey="name"
          paddingAngle={3} // Plus d'espace entre les segments
          label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
          animationDuration={1000}
          animationBegin={0}
          style={{ filter: 'url(#glow)' }}
        >
          {data.map((_, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={COLORS[index % COLORS.length]} 
              stroke="#fff"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip 
          content={<CustomTooltip />} 
          animationDuration={200}
        />
        <Legend 
          layout="horizontal" 
          verticalAlign="bottom" 
          align="center"
          iconType="circle"
          iconSize={12}
          wrapperStyle={{ paddingTop: 30 }}
          formatter={(value) => <span className="text-sm font-medium text-gray-700">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

// Graphique de performance des employés
export const EmployeePerformanceChart: React.FC<{ sales: Sale[], employees: Employee[] }> = ({ sales = [], employees = [] }) => {
  // Si aucune vente n'existe, afficher un message
  if (!sales || sales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-72 bg-gray-50 rounded-lg border border-gray-200 p-6 mx-auto w-full">
        <div className="text-gray-400 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <p className="text-gray-600 text-center text-lg font-medium mb-2">Aucune donnée disponible</p>
        <p className="text-gray-500 text-center text-sm max-w-md">Les données apparaîtront ici après vos premières ventes</p>
      </div>
    );
  }

  // Préparer les données pour le graphique
  const prepareData = (): EmployeePerformanceData[] => {
    // Vérifier si les ventes sont valides
    if (!Array.isArray(sales) || sales.length === 0 || !Array.isArray(employees) || employees.length === 0) {
      console.log('Aucune donnée disponible pour le graphique de performance des employés');
      return [{ name: 'Aucune donnée', sales: 0, transactions: 0, average: 0 }];
    }
    
    const employeeSales: Record<string, { sales: number, transactions: number }> = {};
    
    sales.forEach(sale => {
      if (!sale || !sale.employeeId) return;
      
      if (!employeeSales[sale.employeeId]) {
        employeeSales[sale.employeeId] = { sales: 0, transactions: 0 };
      }
      
      // Vérifier que total est un nombre valide
      const total = typeof sale.total === 'number' && !isNaN(sale.total) ? sale.total : 0;
      
      employeeSales[sale.employeeId].sales += total;
      employeeSales[sale.employeeId].transactions += 1;
    });
    
    // Si aucun employé n'a été trouvé
    if (Object.keys(employeeSales).length === 0) {
      return [{ name: 'Aucune donnée', sales: 0, transactions: 0, average: 0 }];
    }
    
    return Object.entries(employeeSales).map(([id, data]) => {
      const employee = employees.find(e => e.id === id);
      return {
        name: employee ? `${employee.firstName} ${employee.lastName}` : 'Inconnu',
        sales: data.sales,
        transactions: data.transactions,
        average: data.transactions > 0 ? data.sales / data.transactions : 0
      };
    }).sort((a, b) => b.sales - a.sales).slice(0, 5);
  };
  
  const data = prepareData();
  
  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <defs>
          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.9}/>
            <stop offset="95%" stopColor="#818CF8" stopOpacity={0.2}/>
          </linearGradient>
          <linearGradient id="colorTransactions" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.9}/>
            <stop offset="95%" stopColor="#C4B5FD" stopOpacity={0.2}/>
          </linearGradient>
          <filter id="shadow" height="200%">
            <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="#6366F1" floodOpacity="0.2"/>
          </filter>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis 
          dataKey="name" 
          tick={{ fill: '#4B5563', fontSize: 12, fontWeight: 500 }}
          tickLine={{ stroke: '#E5E7EB' }}
          axisLine={{ stroke: '#E5E7EB' }}
          padding={{ left: 10, right: 10 }}
        />
        <YAxis 
          yAxisId="left" 
          orientation="left" 
          tickFormatter={formatEuro} 
          tick={{ fill: '#4B5563', fontSize: 12, fontWeight: 500 }}
          tickLine={{ stroke: '#E5E7EB' }}
          axisLine={{ stroke: '#E5E7EB' }}
          width={80}
        />
        <YAxis 
          yAxisId="right" 
          orientation="right" 
          tick={{ fill: '#4B5563', fontSize: 12, fontWeight: 500 }}
          tickLine={{ stroke: '#E5E7EB' }}
          axisLine={{ stroke: '#E5E7EB' }}
          width={40}
        />
        <Tooltip 
          content={<CustomTooltip />} 
          cursor={{ stroke: '#E5E7EB', strokeWidth: 1, strokeDasharray: '5 5' }}
        />
        <Legend 
          iconType="circle" 
          wrapperStyle={{ paddingTop: 20 }}
          formatter={(value) => <span className="text-sm font-medium text-gray-700">{value}</span>}
        />
        <Area 
          yAxisId="left" 
          type="monotone" 
          dataKey="sales" 
          name="Chiffre d'affaires" 
          stroke="#4F46E5" 
          fill="url(#colorRevenue)"
          strokeWidth={3}
          activeDot={{ r: 8, stroke: '#4F46E5', strokeWidth: 2, fill: 'white' }} 
          style={{ filter: 'url(#shadow)' }}
        />
        <Area 
          yAxisId="right" 
          type="monotone" 
          dataKey="transactions" 
          name="Transactions" 
          stroke="#8B5CF6" 
          fill="url(#colorTransactions)"
          strokeWidth={3}
          activeDot={{ r: 6, stroke: '#8B5CF6', strokeWidth: 2, fill: 'white' }}
          style={{ filter: 'url(#shadow)' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// Graphique des ventes par heure
export const HourlySalesChart: React.FC<{ sales: Sale[] }> = ({ sales = [] }) => {
  // Si aucune vente n'existe, afficher un message
  if (!sales || sales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-72 bg-gray-50 rounded-lg border border-gray-200 p-6 mx-auto w-full">
        <div className="text-gray-400 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-600 text-center text-lg font-medium mb-2">Aucune donnée disponible</p>
        <p className="text-gray-500 text-center text-sm max-w-md">Les données apparaîtront ici après vos premières ventes</p>
      </div>
    );
  }

  // Préparer les données pour le graphique
  const prepareData = (): HourlyData[] => {
    // Vérifier si les ventes sont valides
    if (!Array.isArray(sales) || sales.length === 0) {
      console.log('Aucune vente disponible pour le graphique horaire');
      // Retourner des données vides mais avec une structure valide pour le graphique
      return Array.from({ length: 24 }, (_, i) => ({
        hour: `${i}h`,
        revenue: 0,
        transactions: 0
      }));
    }
    
    const hourlyData: Record<number, { revenue: number, transactions: number }> = {};
    
    // Initialiser les données pour chaque heure
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = { revenue: 0, transactions: 0 };
    }
    
    sales.forEach(sale => {
      if (!sale || !sale.timestamp) return;
      
      let date;
      try {
        // Vérifier si le timestamp est un objet Firebase Timestamp
        if (typeof sale.timestamp === 'object' && sale.timestamp !== null && 'toDate' in sale.timestamp && typeof sale.timestamp.toDate === 'function') {
          // Convertir le Timestamp Firebase en Date
          date = sale.timestamp.toDate();
        } else {
          // Sinon, essayer de créer une date à partir de la valeur
          date = new Date(sale.timestamp);
        }
        
        if (isNaN(date.getTime())) {
          console.warn('Timestamp invalide ignoré dans HourlySalesChart:', JSON.stringify(sale.timestamp), 'pour la vente:', sale.id || 'ID inconnu');
          return;
        }
      } catch (error) {
        console.error('Erreur lors de la conversion du timestamp dans HourlySalesChart:', error, 'pour la vente:', sale.id || 'ID inconnu');
        return;
      }
      
      const hour = date.getHours();
      // Vérifier que total est un nombre valide
      const total = typeof sale.total === 'number' && !isNaN(sale.total) ? sale.total : 0;
      
      hourlyData[hour].revenue += total;
      hourlyData[hour].transactions += 1;
    });
    
    return Object.entries(hourlyData).map(([hour, data]) => ({
      hour: `${hour}h`,
      revenue: data.revenue,
      transactions: data.transactions
    }));
  };
  
  const data = prepareData();
  
  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
        <defs>
          <linearGradient id="colorHourlyRevenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#EC4899" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#F9A8D4" stopOpacity={0.2}/>
          </linearGradient>
          <linearGradient id="colorHourlyTransactions" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#6EE7B7" stopOpacity={0.2}/>
          </linearGradient>
          <filter id="hourlyGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="glow" />
            <feBlend in="SourceGraphic" in2="glow" mode="normal" />
          </filter>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis 
          dataKey="hour" 
          tick={{ fill: '#4B5563', fontSize: 12, fontWeight: 500 }}
          tickLine={{ stroke: '#E5E7EB' }}
          axisLine={{ stroke: '#E5E7EB' }}
          padding={{ left: 10, right: 10 }}
        />
        <YAxis 
          yAxisId="left" 
          orientation="left" 
          tickFormatter={formatEuro} 
          tick={{ fill: '#4B5563', fontSize: 12, fontWeight: 500 }}
          tickLine={{ stroke: '#E5E7EB' }}
          axisLine={{ stroke: '#E5E7EB' }}
          width={80}
        />
        <YAxis 
          yAxisId="right" 
          orientation="right" 
          tick={{ fill: '#4B5563', fontSize: 12, fontWeight: 500 }}
          tickLine={{ stroke: '#E5E7EB' }}
          axisLine={{ stroke: '#E5E7EB' }}
          width={40}
        />
        <Tooltip 
          content={<CustomTooltip />} 
          cursor={{ stroke: '#E5E7EB', strokeWidth: 1, strokeDasharray: '5 5' }}
        />
        <Legend 
          iconType="circle" 
          wrapperStyle={{ paddingTop: 20 }}
          formatter={(value) => <span className="text-sm font-medium text-gray-700">{value}</span>}
        />
        <Line 
          yAxisId="left" 
          type="monotone" 
          dataKey="revenue" 
          name="Chiffre d'affaires" 
          stroke="#EC4899" 
          strokeWidth={3}
          dot={{ stroke: '#EC4899', strokeWidth: 2, fill: 'white', r: 5 }}
          activeDot={{ r: 8, stroke: '#EC4899', strokeWidth: 2, fill: 'white' }} 
          style={{ filter: 'url(#hourlyGlow)' }}
        />
        <Line 
          yAxisId="right" 
          type="monotone" 
          dataKey="transactions" 
          name="Transactions" 
          stroke="#10B981" 
          strokeWidth={3}
          dot={{ stroke: '#10B981', strokeWidth: 2, fill: 'white', r: 5 }}
          activeDot={{ r: 8, stroke: '#10B981', strokeWidth: 2, fill: 'white' }}
          style={{ filter: 'url(#hourlyGlow)' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

// Graphique des top produits
export const TopProductsChart: React.FC<{ sales: Sale[] }> = ({ sales = [] }) => {
  // Si aucune vente n'existe, afficher un message
  if (!sales || sales.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-72 bg-gray-50 rounded-lg border border-gray-200 p-6 mx-auto w-full">
        <div className="text-gray-400 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <p className="text-gray-600 text-center text-lg font-medium mb-2">Aucune donnée disponible</p>
        <p className="text-gray-500 text-center text-sm max-w-md">Les données apparaîtront ici après vos premières ventes</p>
      </div>
    );
  }

  // Préparer les données pour le graphique
  const prepareData = () => {
    // Vérifier si les ventes sont valides
    if (!Array.isArray(sales) || sales.length === 0) {
      console.log('Aucune vente disponible pour le graphique des top produits');
      return [{ name: 'Aucune donnée', revenue: 0, quantity: 0 }];
    }
    
    const productSales: Record<string, { name: string, revenue: number, quantity: number }> = {};
    
    sales.forEach(sale => {
      if (!sale || !Array.isArray(sale.items)) return;
      
      sale.items.forEach(item => {
        if (!item || !item.product) return;
        
        const productId = item.product.id;
        if (!productId) return;
        
        if (!productSales[productId]) {
          productSales[productId] = {
            name: item.product.name || 'Produit sans nom',
            revenue: 0,
            quantity: 0
          };
        }
        
        const quantity = typeof item.quantity === 'number' ? item.quantity : 0;
        const price = typeof item.product.price === 'number' ? item.product.price : 0;
        productSales[productId].revenue += quantity * price;
        productSales[productId].quantity += quantity;
      });
    });
    
    // Si aucun produit n'a été trouvé
    if (Object.keys(productSales).length === 0) {
      return [{ name: 'Aucune donnée', revenue: 0, quantity: 0 }];
    }
    
    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  };
  
  const data = prepareData();
  
  return (
    <ResponsiveContainer width="100%" height={500}>
      <BarChart 
        data={data} 
        layout="vertical"
        margin={{ top: 20, right: 30, left: 140, bottom: 20 }}
      >
        <defs>
          <linearGradient id="colorTopProducts" x1="0" y1="0" x2="1" y2="0">
            <stop offset="5%" stopColor="#1E40AF" stopOpacity={0.9}/>
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.9}/>
          </linearGradient>
          <filter id="productShadow" height="130%" width="130%" x="-15%" y="-15%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
            <feOffset dx="0" dy="2" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.2" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={true} vertical={false} />
        <XAxis 
          type="number" 
          tickFormatter={formatEuro} 
          tick={{ fill: '#4B5563', fontSize: 12, fontWeight: 500 }}
          tickLine={{ stroke: '#E5E7EB' }}
          axisLine={{ stroke: '#E5E7EB' }}
          padding={{ left: 0, right: 20 }}
        />
        <YAxis 
          type="category" 
          dataKey="name" 
          width={140}
          tick={{ fill: '#4B5563', fontSize: 12, fontWeight: 500 }}
          tickLine={false}
          axisLine={{ stroke: '#E5E7EB' }}
        />
        <Tooltip 
          content={<CustomTooltip valuePrefix="" />} 
          cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
        />
        <Legend 
          iconType="circle" 
          wrapperStyle={{ paddingTop: 20 }}
          formatter={(value) => <span className="text-sm font-medium text-gray-700">{value}</span>}
        />
        <Bar 
          dataKey="revenue" 
          name="Chiffre d'affaires" 
          fill="url(#colorTopProducts)" 
          radius={[0, 6, 6, 0]}
          barSize={24}
          style={{ filter: 'url(#productShadow)' }}
          animationDuration={1000}
          animationBegin={200}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};
