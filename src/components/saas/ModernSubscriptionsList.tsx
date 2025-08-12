import React, { useState, useEffect } from 'react';
import { getSaasStats } from '../../services/saasStatsService';
import { Subscription, SubscriptionPlan } from '../../types/saas';
import { Business } from '../../types';
import { getSubscriptions } from '../../services/subscriptionService';
import { getSubscriptionPlans } from '../../services/subscriptionPlanService';
import { getAllBusinesses } from '../../services/getAllBusinesses';
import DateDisplay from './DateDisplay';

interface SubscriptionsListProps {
  onEditSubscription: (subscription: Subscription) => void;
  onAddSubscription: () => void;
  onCancelSubscription: (subscriptionId: string) => void;
  refreshTrigger?: number;
}

const ModernSubscriptionsList: React.FC<SubscriptionsListProps> = ({
  onEditSubscription,
  onAddSubscription,
  onCancelSubscription,
  refreshTrigger = 0
}) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [businesses, setBusinesses] = useState<Record<string, Business>>({});
  const [plans, setPlans] = useState<Record<string, SubscriptionPlan>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [cancelConfirmation, setCancelConfirmation] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('startDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Récupérer les abonnements
        const subscriptionsData = await getSubscriptions();
        console.log('Abonnements récupérés:', subscriptionsData);
        console.log('Nombre d\'abonnements actifs:', subscriptionsData.filter(sub => sub.status === 'active').length);
        setSubscriptions(subscriptionsData);

        // Récupérer les entreprises (vrais clients PayeSmart)
        const businessesData = await getAllBusinesses();
        console.log('Entreprises récupérées:', businessesData);
        const businessesMap: Record<string, Business> = {};
        businessesData.forEach(business => {
          businessesMap[business.id] = business;
        });
        setBusinesses(businessesMap);

        // Récupérer les plans d'abonnement
        const plansData = await getSubscriptionPlans();
        console.log('Plans d\'abonnement récupérés:', plansData);
        const plansMap: Record<string, SubscriptionPlan> = {};
        plansData.forEach(plan => {
          plansMap[plan.id] = plan;
        });
        setPlans(plansMap);
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
        setError('Impossible de charger les abonnements. Veuillez réessayer plus tard.');
        
        // Données de test en cas d'erreur
        const testSubscriptions: Subscription[] = [
          {
            id: 'sub1',
            clientId: 'client1',
            planId: 'plan1',
            startDate: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 jours avant
            endDate: Date.now() + 335 * 24 * 60 * 60 * 1000, // 335 jours après
            status: 'active',
            autoRenew: true,
            createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
            price: 29.99,
            currency: 'EUR',
            billingCycle: 'monthly',
            paymentMethod: 'card',
            notes: 'Abonnement de test 1'
          },
          {
            id: 'sub2',
            clientId: 'client2',
            planId: 'plan2',
            startDate: Date.now() - 60 * 24 * 60 * 60 * 1000, // 60 jours avant
            endDate: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 jours après
            status: 'active',
            autoRenew: false,
            createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
            price: 299.99,
            currency: 'EUR',
            billingCycle: 'yearly',
            paymentMethod: 'transfer',
            notes: 'Abonnement de test 2'
          },
          {
            id: 'sub3',
            clientId: 'client3',
            planId: 'plan3',
            startDate: Date.now() - 90 * 24 * 60 * 60 * 1000, // 90 jours avant
            endDate: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 jours avant
            status: 'expired',
            autoRenew: false,
            createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
            price: 149.99,
            currency: 'EUR',
            billingCycle: 'yearly',
            paymentMethod: 'card',
            notes: 'Abonnement de test 3 (expiré)'
          }
        ];
        
        // Créer un type temporaire qui étend Business pour les données de test
        type TestBusiness = Business & {
          ownerFirstName: string;
          ownerLastName: string;
          active: boolean;
          address: {
            street: string;
            city: string;
            postalCode: string;
            country: string;
          };
          status: 'active' | 'inactive' | 'pending';
          notes: string;
        };
        
        const testBusinesses: Record<string, TestBusiness> = {
          'client1': {
            id: 'client1',
            businessName: 'Proximus Shop',
            ownerFirstName: 'Aubain',
            ownerLastName: 'Minaku',
            email: 'am@proximus.be',
            phone: '0456788987',
            active: true,
            createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            status: 'active',
            notes: '',
            plan: 'premium',
            address: {
              street: 'Rue de la Loi 1',
              city: 'Bruxelles',
              postalCode: '1000',
              country: 'Belgique'
            }
          },
          'client2': {
            id: 'client2',
            businessName: 'Café des Arts',
            ownerFirstName: 'Marie',
            ownerLastName: 'Dubois',
            email: 'marie@cafedesarts.be',
            phone: '0478123456',
            active: true,
            createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
            status: 'active',
            notes: '',
            plan: 'basic',
            address: {
              street: 'Place du Marché 5',
              city: 'Namur',
              postalCode: '5000',
              country: 'Belgique'
            }
          },
          'client3': {
            id: 'client3',
            businessName: 'Librairie Page',
            ownerFirstName: 'Jean',
            ownerLastName: 'Martin',
            email: 'jean@librairiepage.be',
            phone: '0498765432',
            active: false,
            createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            status: 'inactive',
            notes: '',
            plan: 'free',
            address: {
              street: 'Rue des Carmes 12',
              city: 'Liège',
              postalCode: '4000',
              country: 'Belgique'
            }
          }
        };
        
        const testPlans: Record<string, SubscriptionPlan> = {
          'plan1': {
            id: 'plan1',
            name: 'Enterprise',
            description: 'Plan pour les grandes entreprises',
            price: 149,
            currency: 'EUR',
            billingCycle: 'monthly',
            features: ['Toutes les fonctionnalités', 'Support prioritaire', 'API accès'],
            active: true,
            createdAt: Date.now() - 200 * 24 * 60 * 60 * 1000
          },
          'plan2': {
            id: 'plan2',
            name: 'Standard',
            description: 'Plan pour les PME',
            price: 79,
            currency: 'EUR',
            billingCycle: 'monthly',
            features: ['Fonctionnalités essentielles', 'Support email'],
            active: true,
            createdAt: Date.now() - 200 * 24 * 60 * 60 * 1000
          },
          'plan3': {
            id: 'plan3',
            name: 'Basic',
            description: 'Plan pour les petites entreprises',
            price: 39,
            currency: 'EUR',
            billingCycle: 'monthly',
            features: ['Fonctionnalités de base'],
            active: true,
            createdAt: Date.now() - 200 * 24 * 60 * 60 * 1000
          }
        };
        
        setSubscriptions(testSubscriptions);
        setBusinesses(testBusinesses as unknown as Record<string, Business>);
        setPlans(testPlans);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshTrigger]);

  // Fonctions utilitaires pour le formatage et le calcul
  // Utilisation du composant DateDisplay pour l'affichage des dates

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'expired':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'cancelled':
        return 'Annulé';
      case 'expired':
        return 'Expiré';
      case 'pending':
        return 'En attente';
      default:
        return status;
    }
  };

  const getRemainingTime = (endDate: number): string => {
    const now = Date.now();
    const diffTime = endDate - now;
    
    if (diffTime <= 0) {
      return 'Expiré';
    }
    
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 30) {
      const diffMonths = Math.floor(diffDays / 30);
      return `${diffMonths} mois`;
    }
    
    return `${diffDays} jours`;
  };

  const getRemainingDays = (endDate: number): number => {
    const now = Date.now();
    const diffTime = endDate - now;
    return diffTime <= 0 ? 0 : Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getProgressBarClass = (remainingDays: number, totalDays: number = 365): string => {
    const percentage = (remainingDays / totalDays) * 100;
    if (percentage <= 10) return 'bg-red-500';
    if (percentage <= 25) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Fonctions pour le tri et le filtrage
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return null;
    
    return sortDirection === 'asc' 
      ? <svg className="w-4 h-4 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
      : <svg className="w-4 h-4 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>;
  };

  // Filtrer les abonnements par terme de recherche et statut
  console.log('Filtrage des abonnements - Statut sélectionné:', filterStatus);
  console.log('Terme de recherche:', searchTerm);
  
  // Afficher les détails des abonnements et des entreprises pour le débogage
  console.log('Détails des abonnements disponibles:', subscriptions.map(sub => ({
    id: sub.id,
    clientId: sub.clientId,
    planId: sub.planId,
    status: sub.status
  })));
  
  console.log('Détails des entreprises disponibles:', Object.keys(businesses).map(key => ({
    id: businesses[key].id,
    name: businesses[key].businessName,
    contact: businesses[key].ownerFirstName ? `${businesses[key].ownerFirstName} ${businesses[key].ownerLastName}` : ''
  })));
  
  console.log('Détails des plans disponibles:', Object.keys(plans).map(key => ({
    id: plans[key].id,
    name: plans[key].name
  })));
  
  const filteredSubscriptions = subscriptions.filter(subscription => {
    const business = businesses[subscription.clientId];
    const plan = plans[subscription.planId];
    
    if (!business || !plan) {
      console.log('Abonnement ignoré (client ou plan manquant):', subscription.id, 'clientId:', subscription.clientId, 'planId:', subscription.planId);
      return false;
    }
    
    // Construire le nom du contact en utilisant ownerFirstName/ownerLastName s'ils existent
    const contactName = business.ownerFirstName && business.ownerLastName ? 
      `${business.ownerFirstName} ${business.ownerLastName}` : 
      (business as any).contactName || '';
      
    const matchesSearch = (
      business.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesStatus = filterStatus === 'all' || subscription.status === filterStatus;
    
    // Afficher des informations de débogage pour chaque abonnement
    console.log(
      'Abonnement', subscription.id, 
      '- Status:', subscription.status, 
      '- Client:', business.businessName, 
      '- Plan:', plan.name, 
      '- Matches Search:', matchesSearch, 
      '- Matches Status:', matchesStatus
    );
    
    return matchesSearch && matchesStatus;
  });
  
  console.log('Nombre d\'abonnements filtrés:', filteredSubscriptions.length);

  // Trier les abonnements
  const sortedSubscriptions = [...filteredSubscriptions].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'client':
        const businessA = businesses[a.clientId];
        const businessB = businesses[b.clientId];
        comparison = businessA?.businessName.localeCompare(businessB?.businessName || '') || 0;
        break;
      case 'plan':
        const planA = plans[a.planId];
        const planB = plans[b.planId];
        comparison = planA?.name.localeCompare(planB?.name || '') || 0;
        break;
      case 'startDate':
        comparison = a.startDate - b.startDate;
        break;
      case 'endDate':
        comparison = a.endDate - b.endDate;
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      default:
        comparison = 0;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // États pour les statistiques SaaS
  const [stats, setStats] = useState({
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    renewalRate: 0
  });

  // Charger les statistiques SaaS depuis le service
  useEffect(() => {
    const loadStats = async () => {
      try {
        console.log('Chargement des statistiques SaaS depuis le service...');
        const saasStats = await getSaasStats();
        console.log('Statistiques SaaS chargées:', saasStats);
        
        setStats({
          activeSubscriptions: activeSubscriptionsArray.length, // Garder la logique locale pour l'affichage immédiat
          monthlyRevenue: saasStats.monthlyRecurringRevenue,
          renewalRate: saasStats.renewalRate
        });
        
        console.log('Statistiques mises à jour dans le composant');
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques SaaS:', error);
      }
    };
    
    loadStats();
  }, [subscriptions.length]); // Recharger les stats quand le nombre d'abonnements change
  
  // Calculs locaux pour l'affichage immédiat
  console.log('Calcul des KPI - Tous les abonnements:', subscriptions);
  const activeSubscriptionsArray = subscriptions.filter(sub => sub.status === 'active');
  console.log('Abonnements actifs:', activeSubscriptionsArray);
  const activeSubscriptions = stats.activeSubscriptions || activeSubscriptionsArray.length;
  console.log('Nombre d\'abonnements actifs:', activeSubscriptions);
  
  const monthlyRevenue = stats.monthlyRevenue || subscriptions
    .filter(sub => sub.status === 'active')
    .reduce((total, sub) => {
      const plan = plans[sub.planId];
      return total + (plan?.price || 0);
    }, 0);
    
  const autoRenewSubscriptions = subscriptions.filter(sub => sub.autoRenew);
  const renewalRate = stats.renewalRate || (autoRenewSubscriptions.length / (subscriptions.length || 1) * 100);
  console.log('Taux de renouvellement:', renewalRate, '%');

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* En-tête avec titre, recherche et bouton d'ajout */}
      <div className="p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Titre à gauche */}
          <div className="flex items-center space-x-2 md:w-1/4 w-full">
            <h2 className="text-xl font-bold text-gray-800 whitespace-nowrap">Gestion des Abonnements</h2>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {filteredSubscriptions.length}
            </span>
          </div>
          
          {/* Barre de recherche centrée */}
          <div className="flex justify-center items-center md:w-1/3 w-full">
            <div className="relative w-full max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Rechercher..."
                className="w-full pl-7 pr-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* Filtres et bouton à droite */}
          <div className="flex items-center gap-3 md:w-auto w-full justify-end">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-32 px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
              <option value="all">Tous</option>
              <option value="active">Actifs</option>
              <option value="expired">Expirés</option>
              <option value="cancelled">Annulés</option>
            </select>
            
            <button 
              onClick={onAddSubscription}
              className="bg-indigo-600 text-white hover:bg-indigo-700 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 flex items-center shadow-sm whitespace-nowrap"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
              </svg>
              Ajouter
            </button>
          </div>
        </div>
      </div>
      
      {/* Section KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-gray-50 border-y border-gray-200">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">Abonnements Actifs</p>
            <p className="text-2xl font-bold text-gray-800">
              {/* Nombre d'abonnements actifs qui ont des clients existants */}
              {filteredSubscriptions.filter(sub => sub.status === 'active').length}
            </p>
            <p className="text-xs text-green-600">
              {filteredSubscriptions.length > 0 ? 
                Math.round((filteredSubscriptions.filter(sub => sub.status === 'active').length / filteredSubscriptions.length) * 100) : 0}% du total
            </p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">Revenu Mensuel</p>
            <p className="text-2xl font-bold text-gray-800">
              {/* Calcul du revenu mensuel basé sur les clients existants */}
              {filteredSubscriptions
                .filter(sub => sub.status === 'active')
                .reduce((total, sub) => {
                  const plan = plans[sub.planId];
                  return total + (plan?.price || 0);
                }, 0)} €
            </p>
            <p className="text-xs text-blue-600">
              Récurrent (MRR)
            </p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex items-center">
          <div className="rounded-full bg-purple-100 p-3 mr-4">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">Taux de Renouvellement</p>
            <p className="text-2xl font-bold text-gray-800">
              {/* Calcul du taux de renouvellement basé sur les clients existants */}
              {filteredSubscriptions.length > 0 ?
                Math.round((filteredSubscriptions.filter(sub => sub.autoRenew).length / filteredSubscriptions.length) * 100) : 0}%
            </p>
            <p className="text-xs text-purple-600">
              Auto-renouvellement activé
            </p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex items-center">
          <div className="rounded-full bg-amber-100 p-3 mr-4">
            <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">Valeur Totale (LTV)</p>
            <p className="text-2xl font-bold text-gray-800">
              {/* Calcul de la valeur totale des contrats actifs */}
              {filteredSubscriptions
                .filter(sub => sub.status === 'active')
                .reduce((total, sub) => {
                  const plan = plans[sub.planId];
                  // Calcul basé sur le prix du plan et une estimation de durée de vie de 24 mois
                  return total + ((plan?.price || 0) * 24);
                }, 0).toLocaleString('fr-FR')} €
            </p>
            <p className="text-xs text-amber-600">
              Valeur sur 24 mois
            </p>
          </div>
        </div>
      </div>
      
      {/* Contenu principal */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mx-6 my-4">
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : sortedSubscriptions.length === 0 ? (
        <div className="text-center py-16 px-6">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun abonnement trouvé</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm ? 'Aucun abonnement ne correspond à votre recherche.' : 'Aucun abonnement enregistré.'}
          </p>
          <button 
            onClick={onAddSubscription}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Ajouter votre premier abonnement
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('client')}
                >
                  <div className="flex items-center">
                    Client {getSortIcon('client')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('plan')}
                >
                  <div className="flex items-center">
                    Plan {getSortIcon('plan')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('endDate')}
                >
                  <div className="flex items-center">
                    Période {getSortIcon('endDate')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Statut {getSortIcon('status')}
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedSubscriptions.map(subscription => {
                const business = businesses[subscription.clientId];
                const plan = plans[subscription.planId];
                
                if (!business || !plan) return null;
                
                const remainingDays = getRemainingDays(subscription.endDate);
                const totalDays = Math.ceil((subscription.endDate - subscription.startDate) / (1000 * 60 * 60 * 24));
                const progressBarClass = getProgressBarClass(remainingDays, totalDays);
                const progressPercent = Math.max(0, Math.min(100, (remainingDays / totalDays) * 100));
                
                return (
                  <tr key={subscription.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-indigo-100 text-indigo-800 rounded-full flex items-center justify-center font-bold">
                          {business.businessName.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{business.businessName}</div>
                          <div className="text-xs text-gray-500">{business.ownerFirstName} {business.ownerLastName}</div>
                          <div className="text-xs text-gray-500 italic">{business.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{plan.name}</div>
                      <div className="text-xs text-gray-500">{plan.price} € / {plan.billingCycle === 'monthly' ? 'mois' : plan.billingCycle}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 mb-1">
                        <DateDisplay timestamp={subscription.startDate} /> - <DateDisplay timestamp={subscription.endDate} />
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`${progressBarClass} h-2.5 rounded-full`} 
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Reste: {getRemainingTime(subscription.endDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusBadgeClass(subscription.status)}`}>
                        {getStatusText(subscription.status)}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">
                        {subscription.autoRenew ? 'Renouvellement auto' : 'Sans renouvellement'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => onEditSubscription(subscription)}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                          title="Modifier"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                          </svg>
                        </button>
                        {subscription.status === 'active' && (
                          cancelConfirmation === subscription.id ? (
                            <>
                              <button 
                                onClick={() => {
                                  onCancelSubscription(subscription.id);
                                  setCancelConfirmation(null);
                                }}
                                className="text-red-600 hover:text-red-900 p-1"
                                title="Confirmer la résiliation"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                              </button>
                              <button 
                                onClick={() => setCancelConfirmation(null)}
                                className="text-gray-600 hover:text-gray-900 p-1"
                                title="Annuler"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                              </button>
                            </>
                          ) : (
                            <button 
                              onClick={() => setCancelConfirmation(subscription.id)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Résilier"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ModernSubscriptionsList;
