import React, { useState, useEffect } from 'react';
import { Client, Subscription, Payment, SubscriptionPlan, SaasStats } from '../types/saas';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Users, CreditCard, TrendingUp, Calendar, LayoutDashboard, RefreshCw } from 'lucide-react';
import ClientsManager from './saas/ClientsManager';
import SubscriptionsManager from './saas/SubscriptionsManager';
import PaymentsManager from './saas/PaymentsManager';
import PlansManager from './saas/PlansManager';
import SaasOverview from './saas/SaasOverview';
import { getClients } from '../services/clientService';
import { getSubscriptions, getSubscriptionPlans } from '../services/subscriptionService';
import { getPayments } from '../services/paymentService';
import { getSaasStats } from '../services/saasStatsService';

interface SaasManagerProps {
  currentBusinessId: string;
}

const SaasManager: React.FC<SaasManagerProps> = ({ currentBusinessId }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [stats, setStats] = useState<SaasStats>({
    totalClients: 0,
    activeClients: 0,
    trialClients: 0,
    monthlyRecurringRevenue: 0,
    totalRevenue: 0,
    retentionRate: 0,
    renewalRate: 0,
    churnRate: 0,
    averageRevenuePerUser: 0,
    lifetimeValue: 0,
    clientGrowthRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [forceRefresh, setForceRefresh] = useState(0); // État pour forcer le rechargement

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Chargement des données SaaS, forceRefresh:', forceRefresh);
        
        // Charge les statistiques en priorité et séparément pour éviter tout problème de cache
        const statsData = await getSaasStats();
        console.log('Nouvelles statistiques chargées:', statsData);
        setStats(statsData);
        
        // Puis charger les autres données en parallèle
        const [clientsData, subscriptionsData, paymentsData, plansData] = await Promise.all([
          getClients(),
          getSubscriptions(),
          getPayments(),
          getSubscriptionPlans()
        ]);
        
        setClients(clientsData);
        setSubscriptions(subscriptionsData);
        setPayments(paymentsData);
        setPlans(plansData);
      } catch (error) {
        console.error('Erreur lors du chargement des données SaaS:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [forceRefresh]); // Dépend de forceRefresh pour permettre un rechargement manuel

  const refreshData = async () => {
    try {
      const clientsData = await getClients();
      const subscriptionsData = await getSubscriptions();
      const paymentsData = await getPayments();
      
      setClients(clientsData);
      setSubscriptions(subscriptionsData);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des données:', error);
    }
  };

  // Fonction pour forcer un rafraîchissement des statistiques
  const handleForceRefresh = () => {
    console.log('Forçage manuel du rechargement des statistiques');
    setForceRefresh(prev => prev + 1);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestion SaaS</h1>
        <button 
          onClick={handleForceRefresh}
          className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          title="Rafraîchir les statistiques"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Rafraîchir
        </button>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          <span className="ml-3 text-gray-600">Chargement des données...</span>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview" className="flex items-center">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Tableau de bord
            </TabsTrigger>
            <TabsTrigger value="clients" className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Clients
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Abonnements
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center">
              <CreditCard className="w-4 h-4 mr-2" />
              Paiements
            </TabsTrigger>
            <TabsTrigger value="plans" className="flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Plans
            </TabsTrigger>
          </TabsList>
          
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <TabsContent value="overview">
              <SaasOverview 
                stats={stats} 
                clients={clients} 
                subscriptions={subscriptions} 
                payments={payments}
              />
            </TabsContent>
            
            <TabsContent value="clients">
              <ClientsManager 
                clients={clients} 
                onClientAdded={refreshData} 
                onClientUpdated={refreshData} 
                onClientDeleted={refreshData}
              />
            </TabsContent>
            
            <TabsContent value="subscriptions">
              <SubscriptionsManager 
                subscriptions={subscriptions} 
                clients={clients} 
                plans={plans} 
                onSubscriptionAdded={refreshData} 
                onSubscriptionUpdated={refreshData} 
                onSubscriptionCancelled={refreshData}
              />
            </TabsContent>
            
            <TabsContent value="payments">
              <PaymentsManager 
                payments={payments} 
                clients={clients} 
                subscriptions={subscriptions} 
                onPaymentAdded={refreshData} 
                onPaymentUpdated={refreshData}
              />
            </TabsContent>
            
            <TabsContent value="plans">
              <PlansManager 
                plans={plans}
                onPlanAdded={async () => {
                  const plansData = await getSubscriptionPlans();
                  setPlans(plansData);
                }}
                onPlanUpdated={async () => {
                  const plansData = await getSubscriptionPlans();
                  setPlans(plansData);
                }}
              />
            </TabsContent>
          </div>
        </Tabs>
      )}
    </div>
  );
};

export default SaasManager;
