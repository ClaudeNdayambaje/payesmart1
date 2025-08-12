import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, TrendingUp, Users, Clock } from 'lucide-react';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getCurrentBusinessId } from '../../services/businessService';

interface TrialPeriod {
  id: string;
  name: string;
  days: number;
  minutes: number;
}

interface TrialStats {
  periodId: string;
  periodName: string;
  totalTrials: number;
  conversions: number;
  conversionRate: number;
  averageTimeToConversion: number; // en jours
  color: string;
}

const COLORS = ['#4f46e5', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#84cc16', '#eab308'];

const TrialEfficiencyReport: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<TrialStats[]>([]);
  const [totalTrials, setTotalTrials] = useState<number>(0);
  const [totalConversions, setTotalConversions] = useState<number>(0);
  const [overallConversionRate, setOverallConversionRate] = useState<number>(0);
  const [bestPeriod, setBestPeriod] = useState<TrialStats | null>(null);
  
  useEffect(() => {
    const fetchTrialStats = async () => {
      try {
        setLoading(true);
        const businessId = await getCurrentBusinessId();
        
        // Récupérer toutes les périodes d'essai
        const trialConfigRef = collection(db, 'trialConfigurations');
        const trialConfigSnapshot = await getDocs(query(trialConfigRef, where('businessId', '==', businessId)));
        
        if (trialConfigSnapshot.empty) {
          setLoading(false);
          return;
        }
        
        const configData = trialConfigSnapshot.docs[0].data();
        const trialPeriods = configData.trialPeriods || [];
        
        // Récupérer tous les clients qui ont eu une période d'essai
        const clientsRef = collection(db, 'clients');
        const clientsSnapshot = await getDocs(query(clientsRef, 
          where('businessId', '==', businessId),
          where('hadTrial', '==', true)
        ));
        
        const clientsData = clientsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Calculer les statistiques pour chaque période d'essai
        const calculatedStats: TrialStats[] = trialPeriods.map((period: TrialPeriod, index: number) => {
          // Filtrer les clients qui ont utilisé cette période d'essai
          const periodClients = clientsData.filter((client: any) => client.trialPeriodId === period.id);
          
          // Compter les conversions (clients qui ont souscrit après l'essai)
          const conversions = periodClients.filter((client: any) => client.convertedAfterTrial).length;
          
          // Calculer le taux de conversion
          const conversionRate = periodClients.length > 0 
            ? (conversions / periodClients.length) * 100 
            : 0;
          
          // Calculer le temps moyen jusqu'à la conversion
          const conversionTimes = periodClients
            .filter((client: any) => client.convertedAfterTrial && client.conversionDate && client.trialStartDate)
            .map((client: any) => {
              const startDate = client.trialStartDate.toDate();
              const conversionDate = client.conversionDate.toDate();
              return (conversionDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24); // en jours
            });
          
          const averageTimeToConversion = conversionTimes.length > 0
            ? conversionTimes.reduce((sum, time) => sum + time, 0) / conversionTimes.length
            : 0;
          
          return {
            periodId: period.id,
            periodName: period.name,
            totalTrials: periodClients.length,
            conversions,
            conversionRate,
            averageTimeToConversion,
            color: COLORS[index % COLORS.length]
          };
        });
        
        // Calculer les statistiques globales
        const totalTrialsCount = calculatedStats.reduce((sum, stat) => sum + stat.totalTrials, 0);
        const totalConversionsCount = calculatedStats.reduce((sum, stat) => sum + stat.conversions, 0);
        const overallRate = totalTrialsCount > 0 ? (totalConversionsCount / totalTrialsCount) * 100 : 0;
        
        // Trouver la période avec le meilleur taux de conversion (parmi celles avec au moins 5 essais)
        const validStats = calculatedStats.filter(stat => stat.totalTrials >= 5);
        const bestPeriodStat = validStats.length > 0 
          ? validStats.reduce((best, current) => current.conversionRate > best.conversionRate ? current : best, validStats[0])
          : null;
        
        setStats(calculatedStats);
        setTotalTrials(totalTrialsCount);
        setTotalConversions(totalConversionsCount);
        setOverallConversionRate(overallRate);
        setBestPeriod(bestPeriodStat);
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de la récupération des statistiques des périodes d\'essai:', error);
        setLoading(false);
      }
    };
    
    fetchTrialStats();
  }, []);
  
  // Données pour le graphique en camembert
  const pieData = stats.map(stat => ({
    name: stat.periodName,
    value: stat.totalTrials,
    conversions: stat.conversions
  }));
  
  // Données pour le graphique en barres
  const barData = stats.map(stat => ({
    name: stat.periodName,
    'Taux de conversion (%)': stat.conversionRate.toFixed(1),
    'Temps moyen (jours)': stat.averageTimeToConversion.toFixed(1)
  }));
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">Rapport d'efficacité des périodes d'essai</h2>
        <p className="text-sm text-gray-500 mt-1">
          Analyse des performances et des taux de conversion des différentes périodes d'essai
        </p>
      </div>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex items-center">
          <div className="rounded-full bg-indigo-100 p-3 mr-4">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total des essais</p>
            <p className="text-2xl font-bold text-gray-800">{totalTrials}</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Conversions</p>
            <p className="text-2xl font-bold text-gray-800">{totalConversions}</p>
            <p className="text-xs text-green-600">{overallConversionRate.toFixed(1)}% de taux de conversion</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <Calendar className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Meilleure période</p>
            <p className="text-2xl font-bold text-gray-800">
              {bestPeriod ? bestPeriod.periodName : 'N/A'}
            </p>
            {bestPeriod && (
              <p className="text-xs text-blue-600">{bestPeriod.conversionRate.toFixed(1)}% de conversion</p>
            )}
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex items-center">
          <div className="rounded-full bg-amber-100 p-3 mr-4">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Temps moyen de conversion</p>
            <p className="text-2xl font-bold text-gray-800">
              {stats.length > 0 
                ? (stats.reduce((sum, stat) => sum + (stat.conversions * stat.averageTimeToConversion), 0) / 
                   Math.max(1, totalConversions)).toFixed(1)
                : 'N/A'}
            </p>
            <p className="text-xs text-amber-600">jours</p>
          </div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution des essais par période */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Distribution des essais par période</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={stats[index].color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [value, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Taux de conversion par période */}
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Performance des périodes d'essai</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Taux de conversion (%)" fill="#4f46e5" />
                <Bar dataKey="Temps moyen (jours)" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Detailed Stats Table */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Statistiques détaillées par période</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Période
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total des essais
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conversions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Taux de conversion
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Temps moyen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.map((stat) => (
                <tr key={stat.periodId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-3 w-3 rounded-full mr-2" style={{ backgroundColor: stat.color }}></div>
                      <span className="font-medium text-gray-900">{stat.periodName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                    {stat.totalTrials}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                    {stat.conversions}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-gray-900 font-medium">{stat.conversionRate.toFixed(1)}%</span>
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(100, stat.conversionRate)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                    {stat.averageTimeToConversion.toFixed(1)} jours
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TrialEfficiencyReport;
