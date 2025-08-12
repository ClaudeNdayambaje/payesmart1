import React from 'react';
import { Sale } from '../../types';
import { 
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, 
  BarChart3, CreditCard, Banknote, Calendar 
} from 'lucide-react';

// Fonction utilitaire pour formater les nombres avec séparateurs de milliers
const formatNumber = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return new Intl.NumberFormat('fr-FR').format(num);
};

// Fonction utilitaire pour formater les montants en euros
const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return '0,00 €';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
};

// Fonction utilitaire pour s'assurer qu'une valeur est un nombre valide
const ensureNumber = (value: any): number => {
  if (value === undefined || value === null) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  color: string;
}

interface KpiCardsProps {
  sales: Sale[];
  previousSales: Sale[];
  salesReport?: any;
}

export const KpiCard: React.FC<KpiCardProps> = ({ 
  title, 
  value, 
  icon, 
  trend, 
  trendLabel, 
  color 
}) => {
  const trendColor = trend && trend > 0 ? 'text-green-600' : 'text-red-600';
  const trendIcon = trend && trend > 0 ? 
    <TrendingUp size={16} className="text-green-600" /> : 
    <TrendingDown size={16} className="text-red-600" />;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition-all duration-300 hover:shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-full ${color}`}>
          {icon}
        </div>
        <h3 className="font-medium text-gray-700 dark:text-white text-sm">{title}</h3>
      </div>
      <p className="text-xl font-bold mb-1.5 dark:text-white">{value}</p>
      {trend !== undefined && (
        <div className="flex items-center gap-1">
          {trendIcon}
          <span className={`text-xs ${trendColor}`}>
            {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
          </span>
          {trendLabel && <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
};

export const KpiCards: React.FC<KpiCardsProps> = ({ 
  sales, 
  previousSales
}) => {
  // Vérifier que les ventes sont définies et non nulles
  const safeSales = Array.isArray(sales) ? sales : [];
  
  // Si aucune vente n'existe, retourner des valeurs à zéro
  if (safeSales.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          title="Chiffre d'affaires"
          value="0,00 €"
          icon={<DollarSign size={18} className="text-white" />}
          color="bg-indigo-600"
        />
        <KpiCard
          title="Transactions"
          value="0"
          icon={<ShoppingCart size={18} className="text-white" />}
          color="bg-emerald-500"
        />
        <KpiCard
          title="Panier moyen"
          value="0,00 €"
          icon={<BarChart3 size={18} className="text-white" />}
          color="bg-purple-500"
        />
        <KpiCard
          title="Heure de pointe"
          value="-"
          icon={<Calendar size={18} className="text-white" />}
          color="bg-indigo-500"
        />
      </div>
    );
  }
  
  // Calculer le total des ventes (chiffre d'affaires) pour la période actuelle
  const totalRevenue = safeSales.reduce((sum, sale) => {
    // Vérifier que sale existe et que sale.total est un nombre valide
    if (!sale) return sum;
    const total = ensureNumber(sale.total);
    return sum + total;
  }, 0);
  
  console.log(`KpiCards: Chiffre d'affaires calculé = ${totalRevenue} € (${safeSales.length} ventes)`);

  // Calculer le total des ventes pour la période précédente
  const previousTotalRevenue = previousSales.reduce((sum, sale) => {
    if (!sale) return sum;
    const total = ensureNumber(sale.total);
    return sum + total;
  }, 0);

  // Calculer le panier moyen
  const averageBasket = safeSales.length > 0 ? totalRevenue / safeSales.length : 0;
  const previousAverageBasket = previousSales.length > 0 ? previousTotalRevenue / previousSales.length : 0;

  // Calculer les tendances (variation en pourcentage)
  const revenueTrend = previousTotalRevenue > 0 
    ? ((totalRevenue - previousTotalRevenue) / previousTotalRevenue) * 100 
    : 0;
  
  const transactionsTrend = previousSales.length > 0 
    ? ((safeSales.length - previousSales.length) / previousSales.length) * 100 
    : 0;
  
  const basketTrend = previousAverageBasket > 0 
    ? ((averageBasket - previousAverageBasket) / previousAverageBasket) * 100 
    : 0;

  // Calculer les montants par mode de paiement
  const cashTotal = safeSales.reduce((sum, sale) => {
    if (!sale || !sale.paymentMethod) return sum;
    return sale.paymentMethod === 'cash' ? sum + ensureNumber(sale.total) : sum;
  }, 0);

  const cardTotal = safeSales.reduce((sum, sale) => {
    if (!sale || !sale.paymentMethod) return sum;
    return sale.paymentMethod === 'card' ? sum + ensureNumber(sale.total) : sum;
  }, 0);

  // Calculer les pourcentages de paiement
  const cashPercentage = totalRevenue > 0 ? (cashTotal / totalRevenue) * 100 : 0;
  const cardPercentage = totalRevenue > 0 ? (cardTotal / totalRevenue) * 100 : 0;

  // Déterminer l'heure de pointe (heure avec le plus de ventes)
  const salesByHour: { [key: string]: number } = {};
  
  safeSales.forEach(sale => {
    if (!sale || !sale.timestamp) return;
    
    const saleDate = sale.timestamp instanceof Date 
      ? sale.timestamp 
      : new Date(sale.timestamp);
    
    const hour = saleDate.getHours();
    salesByHour[hour] = (salesByHour[hour] || 0) + 1;
  });
  
  let peakHour = '';
  let maxSales = 0;
  
  Object.entries(salesByHour).forEach(([hour, count]) => {
    if (count > maxSales) {
      maxSales = count;
      peakHour = hour;
    }
  });
  
  const formattedPeakHour = peakHour 
    ? `${peakHour}h - ${(parseInt(peakHour) + 1) % 24}h` 
    : '-';

  // Afficher les KPI
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <KpiCard
        title="Chiffre d'affaires"
        value={formatCurrency(totalRevenue)}
        icon={<DollarSign size={18} className="text-white" />}
        trend={revenueTrend}
        trendLabel="vs. période précédente"
        color="bg-indigo-600"
      />
      <KpiCard
        title="Transactions"
        value={formatNumber(safeSales.length)}
        icon={<ShoppingCart size={18} className="text-white" />}
        trend={transactionsTrend}
        trendLabel="vs. période précédente"
        color="bg-emerald-500"
      />
      <KpiCard
        title="Panier moyen"
        value={formatCurrency(averageBasket)}
        icon={<BarChart3 size={18} className="text-white" />}
        trend={basketTrend}
        trendLabel="vs. période précédente"
        color="bg-purple-500"
      />
      <KpiCard
        title="Heure de pointe"
        value={formattedPeakHour}
        icon={<Calendar size={18} className="text-white" />}
        color="bg-indigo-500"
      />
      <KpiCard
        title="CA Espèces"
        value={formatCurrency(cashTotal)}
        icon={<Banknote size={18} className="text-white" />}
        color="bg-yellow-500"
      />
      <KpiCard
        title="CA Carte"
        value={formatCurrency(cardTotal)}
        icon={<CreditCard size={18} className="text-white" />}
        color="bg-teal-500"
      />
      <KpiCard
        title="% Paiement espèces"
        value={`${cashPercentage.toFixed(1)}%`}
        icon={<Banknote size={18} className="text-white" />}
        color="bg-orange-500"
      />
      <KpiCard
        title="% Paiement carte"
        value={`${cardPercentage.toFixed(1)}%`}
        icon={<CreditCard size={18} className="text-white" />}
        color="bg-cyan-500"
      />
    </div>
  );
};

export default KpiCards;
