import React from 'react';
import { Client, Subscription, Payment, SaasStats } from '../../types/saas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Users, CreditCard, TrendingUp, Calendar, DollarSign, UserPlus, UserMinus } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SaasOverviewProps {
  stats: SaasStats;
  clients: Client[];
  subscriptions: Subscription[];
  payments: Payment[];
}

const SaasOverview: React.FC<SaasOverviewProps> = ({
  stats,
  clients,
  subscriptions,
  payments
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), 'dd MMM yyyy', { locale: fr });
  };

  // Calcul des clients récents (derniers 30 jours)
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentClients = clients.filter(client => client.createdAt > thirtyDaysAgo);

  // Calcul des paiements récents (derniers 30 jours)
  const recentPayments = payments.filter(payment => 
    payment.paymentDate > thirtyDaysAgo && 
    payment.status === 'completed'
  );

  // Calcul du revenu des 30 derniers jours
  const recentRevenue = recentPayments.reduce((sum, payment) => sum + payment.amount, 0);

  // Abonnements qui expirent bientôt (dans les 30 prochains jours)
  const thirtyDaysLater = Date.now() + 30 * 24 * 60 * 60 * 1000;
  const expiringSubscriptions = subscriptions.filter(
    sub => sub.status === 'active' && sub.endDate < thirtyDaysLater && sub.endDate > Date.now()
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Tableau de bord SaaS</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients Actifs</CardTitle>
            <Users className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeClients}</div>
            <p className="text-xs text-gray-500">
              Sur un total de {stats.totalClients} clients
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenu Mensuel Récurrent</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.monthlyRecurringRevenue)}</div>
            <p className="text-xs text-gray-500">
              {formatCurrency(stats.monthlyRecurringRevenue * 12)} annuel estimé
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenu Total</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-gray-500">
              {formatCurrency(recentRevenue)} ces 30 derniers jours
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nouveaux Clients</CardTitle>
            <UserPlus className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentClients.length}</div>
            <p className="text-xs text-gray-500">
              Ces 30 derniers jours
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Derniers Clients</CardTitle>
            <CardDescription>Les clients les plus récemment inscrits</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clients.length === 0 ? (
                <p className="text-sm text-gray-500">Aucun client inscrit pour le moment.</p>
              ) : (
                clients
                  .sort((a, b) => b.createdAt - a.createdAt)
                  .slice(0, 5)
                  .map(client => (
                    <div key={client.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{client.businessName}</p>
                        <p className="text-sm text-gray-500">{client.contactName}</p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(client.createdAt)}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Derniers Paiements</CardTitle>
            <CardDescription>Les paiements les plus récents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {payments.length === 0 ? (
                <p className="text-sm text-gray-500">Aucun paiement enregistré pour le moment.</p>
              ) : (
                payments
                  .filter(payment => payment.status === 'completed')
                  .sort((a, b) => b.paymentDate - a.paymentDate)
                  .slice(0, 5)
                  .map(payment => {
                    const client = clients.find(c => c.id === payment.clientId);
                    return (
                      <div key={payment.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {client ? client.businessName : 'Client inconnu'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Intl.NumberFormat('fr-FR', { 
                              style: 'currency', 
                              currency: payment.currency 
                            }).format(payment.amount)}
                          </p>
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(payment.paymentDate)}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Abonnements Expirant Bientôt</CardTitle>
            <CardDescription>Abonnements qui expirent dans les 30 prochains jours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expiringSubscriptions.length === 0 ? (
                <p className="text-sm text-gray-500">Aucun abonnement n'expire dans les 30 prochains jours.</p>
              ) : (
                expiringSubscriptions
                  .sort((a, b) => a.endDate - b.endDate)
                  .map(subscription => {
                    const client = clients.find(c => c.id === subscription.clientId);
                    return (
                      <div key={subscription.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {client ? client.businessName : 'Client inconnu'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {subscription.autoRenew ? 'Renouvellement auto' : 'Sans renouvellement'}
                          </p>
                        </div>
                        <div className="text-sm text-gray-500">
                          Expire le {formatDate(subscription.endDate)}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Répartition des Plans</CardTitle>
            <CardDescription>Distribution des clients par plan d'abonnement</CardDescription>
          </CardHeader>
          <CardContent>
            {subscriptions.length === 0 ? (
              <p className="text-sm text-gray-500">Aucun abonnement actif pour le moment.</p>
            ) : (
              <div className="space-y-4">
                {(() => {
                  // Calculer la répartition des plans
                  const planCounts: Record<string, number> = {};
                  
                  subscriptions
                    .filter(sub => sub.status === 'active')
                    .forEach(sub => {
                      if (!planCounts[sub.planId]) {
                        planCounts[sub.planId] = 0;
                      }
                      planCounts[sub.planId]++;
                    });
                  
                  // Convertir en tableau pour l'affichage
                  return Object.entries(planCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([planId, count]) => {
                      const totalActive = subscriptions.filter(sub => sub.status === 'active').length;
                      const percentage = Math.round((count / totalActive) * 100);
                      
                      return (
                        <div key={planId} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Plan #{planId.substring(0, 6)}</span>
                            <span className="text-sm text-gray-500">{count} clients ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-indigo-600 h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    });
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SaasOverview;
