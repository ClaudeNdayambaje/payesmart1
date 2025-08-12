import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, PieChart, Pie, Cell, Area, AreaChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { getSaasStats, getClientEvolutionData, getMonthlyRevenueData } from '../../services/saasStatsService';
import { SaasStats } from '../../types/saas';
import { Loader2 } from 'lucide-react';

// Interface pour les données d'évolution des clients
interface ClientEvolutionData {
  mois: string;
  actifs: number;
  essai: number;
  désabonnés: number;
}

// Interface pour les données de revenus mensuels
interface MonthlyRevenueData {
  mois: string;
  revenu: number;
  annee: number;
}

const conversionData = [
  { name: 'Convertis', value: 68 },
  { name: 'Non convertis', value: 32 }
];

// Les données de revenus seront chargées dynamiquement depuis Firestore

const planStats = [
  { name: 'Starter', clients: 45, pourcentage: 35 },
  { name: 'Pro', clients: 62, pourcentage: 49 },
  { name: 'Enterprise', clients: 20, pourcentage: 16 }
];

// Composant personnalisé pour le tooltip des graphiques
const CustomTooltip = ({ active, payload, label, valuePrefix = '', valueSuffix = '' }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
            {`${entry.name}: ${valuePrefix}${entry.value}${valueSuffix}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const SaasDashboard: React.FC = () => {
  // État pour stocker les statistiques SaaS
  const [stats, setStats] = useState<SaasStats | null>(null);
  const [clientsData, setClientsData] = useState<ClientEvolutionData[]>([]);
  const [revenueData, setRevenueData] = useState<MonthlyRevenueData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les statistiques au chargement du composant
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Récupérer les statistiques générales
        const data = await getSaasStats();
        setStats(data);
        
        // Récupérer les données d'évolution des clients (vraies données)
        const evolutionData = await getClientEvolutionData();
        setClientsData(evolutionData);
        
        // Récupérer les données de revenus mensuels réels
        const monthlyRevenue = await getMonthlyRevenueData();
        setRevenueData(monthlyRevenue);
        
        setError(null);
      } catch (err) {
        console.error('Erreur lors de la récupération des statistiques:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Formater un nombre en euros
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
      .format(value)
      .replace('€', ' €');
  };

  // Formater un pourcentage
  const formatPercent = (value: number): string => {
    return `${Math.round(value)}%`;
  };

  // Si les données sont en cours de chargement
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-600">Chargement des statistiques...</p>
      </div>
    );
  }

  // Si une erreur s'est produite
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
        <p className="font-medium">Erreur</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Tableau de bord</h2>
        <div className="text-sm text-gray-500">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Clients actifs</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats?.activeClients || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className={`text-sm font-medium flex items-center ${stats?.clientGrowthRate && stats.clientGrowthRate > 0 ? 'text-green-500' : 'text-red-500'}`}>
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stats?.clientGrowthRate && stats.clientGrowthRate > 0 ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"}></path>
              </svg>
              {formatPercent(stats?.clientGrowthRate || 0)}
            </span>
            <span className="text-gray-400 text-xs ml-2">vs mois précédent</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Clients en essai</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats?.trialClients || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-gray-400 text-xs">Période d'essai (30 jours)</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Revenu mensuel</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{formatCurrency(stats?.monthlyRecurringRevenue || 0)}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-gray-500 text-sm">
              {formatCurrency(stats?.averageRevenuePerUser || 0)} / client
            </span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Taux de rétention</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{formatPercent(stats?.retentionRate || 0)}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-red-500 text-sm font-medium flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
              </svg>
              {formatPercent(stats?.churnRate || 0)} d'attrition
            </span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Évolution des clients</h3>
              <p className="text-sm text-gray-500 mt-1">Progression sur les 12 derniers mois</p>
            </div>
            {clientsData.length > 1 && (
              <div className="bg-indigo-50 text-indigo-600 text-xs font-medium px-2.5 py-1 rounded-full">
                +{clientsData[clientsData.length - 1]?.actifs - clientsData[0]?.actifs || 0} clients
              </div>
            )}
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={clientsData}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                barSize={20}
                barGap={8}
              >
                <defs>
                  <linearGradient id="colorActifs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.2}/>
                  </linearGradient>
                  <linearGradient id="colorEssai" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.2}/>
                  </linearGradient>
                  <linearGradient id="colorDesabonnes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="mois" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ paddingTop: 20 }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar 
                  dataKey="actifs" 
                  name="Clients actifs" 
                  fill="url(#colorActifs)" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="essai" 
                  name="Clients en essai" 
                  fill="url(#colorEssai)" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="désabonnés" 
                  name="Désabonnements" 
                  fill="url(#colorDesabonnes)" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Revenu mensuel réel</h3>
              <p className="text-sm text-gray-500 mt-1">Évolution du chiffre d'affaires</p>
            </div>
            {stats && (
              <div className="bg-green-50 text-green-600 text-xs font-medium px-2.5 py-1 rounded-full">
                {formatCurrency(stats.monthlyRecurringRevenue)} / mois
              </div>
            )}
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={revenueData}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="colorRevenu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="mois" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  width={40}
                  tickFormatter={(value) => `${value}€`}
                />
                <Tooltip content={<CustomTooltip valueSuffix=" €" />} />
                <Area 
                  type="monotone" 
                  dataKey="revenu" 
                  name="Revenu mensuel" 
                  stroke="#10b981" 
                  fillOpacity={1}
                  fill="url(#colorRevenu)" 
                  strokeWidth={3}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Taux de conversion des essais</h3>
              <p className="text-sm text-gray-500 mt-1">Pourcentage des essais convertis en abonnements</p>
            </div>
            <div className="bg-blue-50 text-blue-600 text-xs font-medium px-2.5 py-1 rounded-full">
              {conversionData[0].value}% de conversion
            </div>
          </div>
          <div className="h-80 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  <linearGradient id="colorConvertis" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#818cf8" stopOpacity={1}/>
                  </linearGradient>
                  <linearGradient id="colorNonConvertis" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#f87171" stopOpacity={1}/>
                  </linearGradient>
                </defs>
                <Pie
                  data={conversionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {conversionData.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === 0 ? 'url(#colorConvertis)' : 'url(#colorNonConvertis)'} 
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip valueSuffix="%" />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  iconSize={10}
                  formatter={(value) => (
                    <span className="text-sm font-medium text-gray-700">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Répartition par plan</h3>
              <p className="text-sm text-gray-500 mt-1">Distribution des clients par formule d'abonnement</p>
            </div>
            <div className="bg-purple-50 text-purple-600 text-xs font-medium px-2.5 py-1 rounded-full">
              {planStats.length} plans actifs
            </div>
          </div>
          <div className="space-y-6">
            {planStats.map((plan) => (
              <div key={plan.name} className="bg-gray-50 p-5 rounded-lg hover:shadow-sm transition-shadow duration-200">
                <div className="flex justify-between mb-3">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${
                      plan.name === 'Starter' ? 'bg-blue-500' : 
                      plan.name === 'Pro' ? 'bg-indigo-500' : 'bg-purple-500'
                    } mr-2.5`}></div>
                    <span className="font-medium text-gray-800">{plan.name}</span>
                  </div>
                  <span className="font-medium text-gray-700">{plan.clients} clients</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-3 rounded-full ${
                      plan.name === 'Starter' ? 'bg-gradient-to-r from-blue-400 to-blue-600' : 
                      plan.name === 'Pro' ? 'bg-gradient-to-r from-indigo-400 to-indigo-600' : 
                      'bg-gradient-to-r from-purple-400 to-purple-600'
                    }`}
                    style={{ width: `${plan.pourcentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    {plan.name === 'Starter' ? 'Plan de base' : 
                     plan.name === 'Pro' ? 'Plan professionnel' : 'Plan entreprise'}
                  </span>
                  <span className="text-xs font-medium text-gray-600">
                    {plan.pourcentage}% du total
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tableau des clients en période d'essai */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Clients en période d'essai</h3>
          <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            Voir tous →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date de début
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date de fin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progression
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[
                { id: 1, name: 'Boulangerie Dupont', email: 'contact@boulangerie-dupont.fr', startDate: '2025-04-01', endDate: '2025-05-01', progress: 60 },
                { id: 2, name: 'Café de la Place', email: 'info@cafedelaplace.fr', startDate: '2025-04-10', endDate: '2025-05-10', progress: 30 },
                { id: 3, name: 'Épicerie Martin', email: 'contact@epicerie-martin.fr', startDate: '2025-04-15', endDate: '2025-05-15', progress: 10 }
              ].map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{client.name}</div>
                        <div className="text-sm text-gray-500">{client.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(client.startDate).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(client.endDate).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${
                          client.progress > 70 ? 'bg-red-500' : 
                          client.progress > 30 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${client.progress}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {100 - client.progress}% restants
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                      Contacter
                    </button>
                    <button className="text-gray-600 hover:text-gray-900">
                      Détails
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Alertes et notifications */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
        <h3 className="text-lg font-semibold mb-4">Alertes et notifications</h3>
        <div className="space-y-4">
          <div className="flex items-start p-4 bg-yellow-50 border border-yellow-100 rounded-lg">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 mr-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-medium text-yellow-800">5 périodes d'essai se terminent cette semaine</h4>
              <p className="text-xs text-yellow-700 mt-1">Pensez à contacter ces clients pour les encourager à s'abonner.</p>
            </div>
          </div>
          
          <div className="flex items-start p-4 bg-red-50 border border-red-100 rounded-lg">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 mr-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-medium text-red-800">3 désabonnements ce mois-ci</h4>
              <p className="text-xs text-red-700 mt-1">Le taux de désabonnement est en hausse de 2% par rapport au mois dernier.</p>
            </div>
          </div>
          
          <div className="flex items-start p-4 bg-green-50 border border-green-100 rounded-lg">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 mr-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-medium text-green-800">8 nouveaux clients ce mois-ci</h4>
              <p className="text-xs text-green-700 mt-1">C'est une augmentation de 15% par rapport au mois dernier.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaasDashboard;
