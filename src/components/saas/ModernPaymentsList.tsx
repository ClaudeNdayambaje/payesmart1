import React, { useState, useEffect } from 'react';
import { Business } from '../../types';
import { Client, Subscription } from '../../types/saas';
import { getSubscriptions } from '../../services/subscriptionService';
import { getClients } from '../../services/clientService';
import { getSubscriptionPlans } from '../../services/subscriptionPlanService';

// Interface pour les paiements
interface Payment {
  id: string;
  clientId: string;
  subscriptionId: string;
  amount: number;
  date: number;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  method: 'card' | 'bank_transfer' | 'direct_debit' | 'paypal';
  reference: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

// Interface pour les entreprises de démonstration
interface TestBusiness extends Omit<Business, 'createdAt' | 'updatedAt'> {
  status: string;
  notes: string;
  plan: "free" | "basic" | "premium";
  createdAt: Date;
  updatedAt: Date;
}

interface PaymentsListProps {
  onViewDetails: (payment: Payment) => void;
  onProcessPayment: (payment: Payment) => void;
  onRefundPayment: (paymentId: string) => void;
  refreshTrigger?: number;
}

const ModernPaymentsList: React.FC<PaymentsListProps> = ({
  onViewDetails,
  onProcessPayment,
  onRefundPayment,
  refreshTrigger = 0
}) => {
  // États
  const [payments, setPayments] = useState<Payment[]>([]);
  const [businesses, setBusinesses] = useState<Record<string, Business>>({});
  const [subscriptions, setSubscriptions] = useState<Record<string, Subscription>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États pour le filtrage et le tri
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [sortField, setSortField] = useState<'client' | 'amount' | 'date' | 'status'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [confirmRefund, setConfirmRefund] = useState<string | null>(null);
  
  // Statistiques
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [pendingRevenue, setPendingRevenue] = useState(0);
  const [successRate, setSuccessRate] = useState(0);
  const [monthlyTrend, setMonthlyTrend] = useState(0);

  // Chargement des données
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Dans un environnement réel, nous aurions un service de paiement
        // Ici, nous simulons des données de paiement basées sur les abonnements
        const subscriptionsData = await getSubscriptions();
        const clientsData = await getClients();
        await getSubscriptionPlans(); // Nous récupérons les plans mais ne les utilisons pas directement
        
        // Créer un dictionnaire de clients pour un accès rapide
        const clientsDict: Record<string, Business> = {};
        clientsData.forEach((client: Client) => {
          clientsDict[client.id] = client as unknown as Business;
        });
        
        // Créer un dictionnaire d'abonnements pour un accès rapide
        const subscriptionsDict: Record<string, Subscription> = {};
        subscriptionsData.forEach((subscription: Subscription) => {
          subscriptionsDict[subscription.id] = subscription;
        });
        
        // Générer des paiements fictifs pour la démonstration
        const demoPayments: Payment[] = [
          {
            id: 'payment-001',
            clientId: 'client-boulangerie',
            subscriptionId: 'sub-boulangerie',
            amount: 79.99,
            date: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 jours avant
            status: 'completed',
            method: 'card',
            reference: 'REF-789456',
            createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
            updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000
          },
          {
            id: 'payment-002',
            clientId: 'client-cafe',
            subscriptionId: 'sub-cafe',
            amount: 149.99,
            date: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 jours avant
            status: 'completed',
            method: 'bank_transfer',
            reference: 'REF-123789',
            createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
            updatedAt: Date.now() - 5 * 24 * 60 * 60 * 1000
          },
          {
            id: 'payment-003',
            clientId: 'client-restaurant',
            subscriptionId: 'sub-restaurant',
            amount: 199.99,
            date: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 jour avant
            status: 'pending',
            method: 'direct_debit',
            reference: 'REF-456123',
            notes: 'En attente de validation bancaire',
            createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000,
            updatedAt: Date.now() - 1 * 24 * 60 * 60 * 1000
          },
          {
            id: 'payment-004',
            clientId: 'client-boutique',
            subscriptionId: 'sub-boutique',
            amount: 39.99,
            date: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15 jours avant
            status: 'failed',
            method: 'card',
            reference: 'REF-987654',
            notes: 'Carte refusée par la banque',
            createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
            updatedAt: Date.now() - 15 * 24 * 60 * 60 * 1000
          },
          {
            id: 'payment-005',
            clientId: 'client-salon',
            subscriptionId: 'sub-salon',
            amount: 79.99,
            date: Date.now() - 20 * 24 * 60 * 60 * 1000, // 20 jours avant
            status: 'refunded',
            method: 'paypal',
            reference: 'REF-654321',
            notes: 'Remboursement suite à un problème technique',
            createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
            updatedAt: Date.now() - 18 * 24 * 60 * 60 * 1000
          },
          {
            id: 'payment-006',
            clientId: 'client-boulangerie',
            subscriptionId: 'sub-boulangerie',
            amount: 79.99,
            date: Date.now() - 32 * 24 * 60 * 60 * 1000, // 32 jours avant
            status: 'completed',
            method: 'card',
            reference: 'REF-112233',
            createdAt: Date.now() - 32 * 24 * 60 * 60 * 1000,
            updatedAt: Date.now() - 32 * 24 * 60 * 60 * 1000
          },
          {
            id: 'payment-007',
            clientId: 'client-cafe',
            subscriptionId: 'sub-cafe',
            amount: 149.99,
            date: Date.now() - 35 * 24 * 60 * 60 * 1000, // 35 jours avant
            status: 'completed',
            method: 'bank_transfer',
            reference: 'REF-445566',
            createdAt: Date.now() - 35 * 24 * 60 * 60 * 1000,
            updatedAt: Date.now() - 35 * 24 * 60 * 60 * 1000
          },
          {
            id: 'payment-008',
            clientId: 'client-restaurant',
            subscriptionId: 'sub-restaurant',
            amount: 199.99,
            date: Date.now() - 65 * 24 * 60 * 60 * 1000, // 65 jours avant
            status: 'completed',
            method: 'direct_debit',
            reference: 'REF-778899',
            createdAt: Date.now() - 65 * 24 * 60 * 60 * 1000,
            updatedAt: Date.now() - 65 * 24 * 60 * 60 * 1000
          }
        ];
        
        // Créer des clients de démonstration
        const demoBusinesses: Record<string, TestBusiness> = {
          'client-boulangerie': {
            id: 'client-boulangerie',
            businessName: 'Boulangerie Artisanale',
            ownerFirstName: 'Pierre',
            ownerLastName: 'Durand',
            email: 'pierre@boulangerie-artisanale.be',
            phone: '0456789123',
            active: true,
            createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            status: 'active',
            notes: '',
            plan: 'premium',
            address: {
              street: 'Rue du Pain 15',
              city: 'Bruxelles',
              postalCode: '1000',
              country: 'Belgique'
            }
          },
          'client-cafe': {
            id: 'client-cafe',
            businessName: 'Café des Artistes',
            ownerFirstName: 'Sophie',
            ownerLastName: 'Martin',
            email: 'sophie@cafedesartistes.be',
            phone: '0478123456',
            active: true,
            createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
            status: 'active',
            notes: '',
            plan: 'premium',
            address: {
              street: 'Place du Marché 8',
              city: 'Namur',
              postalCode: '5000',
              country: 'Belgique'
            }
          },
          'client-restaurant': {
            id: 'client-restaurant',
            businessName: 'Restaurant La Table',
            ownerFirstName: 'Michel',
            ownerLastName: 'Dupont',
            email: 'michel@latable.be',
            phone: '0498765432',
            active: true,
            createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            status: 'active',
            notes: '',
            plan: 'premium',
            address: {
              street: 'Avenue Gourmande 25',
              city: 'Liège',
              postalCode: '4000',
              country: 'Belgique'
            }
          },
          'client-boutique': {
            id: 'client-boutique',
            businessName: 'Boutique Élégance',
            ownerFirstName: 'Isabelle',
            ownerLastName: 'Leroy',
            email: 'isabelle@elegance.be',
            phone: '0467891234',
            active: true,
            createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
            status: 'active',
            notes: '',
            plan: 'basic',
            address: {
              street: 'Rue de la Mode 10',
              city: 'Anvers',
              postalCode: '2000',
              country: 'Belgique'
            }
          },
          'client-salon': {
            id: 'client-salon',
            businessName: 'Salon Beauté Plus',
            ownerFirstName: 'Nathalie',
            ownerLastName: 'Dubois',
            email: 'nathalie@beauteplus.be',
            phone: '0489123456',
            active: true,
            createdAt: new Date(Date.now() - 110 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
            status: 'active',
            notes: '',
            plan: 'basic',
            address: {
              street: 'Boulevard des Soins 5',
              city: 'Charleroi',
              postalCode: '6000',
              country: 'Belgique'
            }
          }
        };
        
        // Créer des abonnements de démonstration
        const demoSubscriptions: Record<string, Subscription> = {
          'sub-boulangerie': {
            id: 'sub-boulangerie',
            clientId: 'client-boulangerie',
            planId: 'plan2',
            startDate: Date.now() - 60 * 24 * 60 * 60 * 1000,
            endDate: Date.now() + 305 * 24 * 60 * 60 * 1000,
            status: 'active',
            autoRenew: true,
            createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000,
            updatedAt: Date.now() - 60 * 24 * 60 * 60 * 1000
          },
          'sub-cafe': {
            id: 'sub-cafe',
            clientId: 'client-cafe',
            planId: 'plan1',
            startDate: Date.now() - 90 * 24 * 60 * 60 * 1000,
            endDate: Date.now() + 275 * 24 * 60 * 60 * 1000,
            status: 'active',
            autoRenew: true,
            createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
            updatedAt: Date.now() - 90 * 24 * 60 * 60 * 1000
          },
          'sub-restaurant': {
            id: 'sub-restaurant',
            clientId: 'client-restaurant',
            planId: 'plan1',
            startDate: Date.now() - 120 * 24 * 60 * 60 * 1000,
            endDate: Date.now() + 245 * 24 * 60 * 60 * 1000,
            status: 'active',
            autoRenew: true,
            createdAt: Date.now() - 120 * 24 * 60 * 60 * 1000,
            updatedAt: Date.now() - 120 * 24 * 60 * 60 * 1000
          },
          'sub-boutique': {
            id: 'sub-boutique',
            clientId: 'client-boutique',
            planId: 'plan3',
            startDate: Date.now() - 45 * 24 * 60 * 60 * 1000,
            endDate: Date.now() + 320 * 24 * 60 * 60 * 1000,
            status: 'active',
            autoRenew: false,
            createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
            updatedAt: Date.now() - 45 * 24 * 60 * 60 * 1000
          },
          'sub-salon': {
            id: 'sub-salon',
            clientId: 'client-salon',
            planId: 'plan2',
            startDate: Date.now() - 75 * 24 * 60 * 60 * 1000,
            endDate: Date.now() + 290 * 24 * 60 * 60 * 1000,
            status: 'active',
            autoRenew: true,
            createdAt: Date.now() - 75 * 24 * 60 * 60 * 1000,
            updatedAt: Date.now() - 75 * 24 * 60 * 60 * 1000
          }
        };
        
        // Utiliser les données de démonstration
        setPayments(demoPayments);
        setBusinesses(demoBusinesses as unknown as Record<string, Business>);
        setSubscriptions(demoSubscriptions);
        
        // Calculer les statistiques
        const total = demoPayments.reduce((sum, payment) => 
          payment.status === 'completed' || payment.status === 'pending' ? sum + payment.amount : sum, 0);
        
        const pending = demoPayments.reduce((sum, payment) => 
          payment.status === 'pending' ? sum + payment.amount : sum, 0);
        
        const successRateValue = demoPayments.length > 0 ? 
          demoPayments.filter(p => p.status === 'completed').length / demoPayments.length * 100 : 0;
        
        // Calculer la tendance mensuelle (croissance par rapport au mois précédent)
        const currentMonth = new Date().getMonth();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        
        const currentMonthPayments = demoPayments.filter(p => {
          const date = new Date(p.date);
          return date.getMonth() === currentMonth && p.status === 'completed';
        }).reduce((sum, p) => sum + p.amount, 0);
        
        const lastMonthPayments = demoPayments.filter(p => {
          const date = new Date(p.date);
          return date.getMonth() === lastMonth && p.status === 'completed';
        }).reduce((sum, p) => sum + p.amount, 0);
        
        const trend = lastMonthPayments > 0 ? 
          ((currentMonthPayments - lastMonthPayments) / lastMonthPayments) * 100 : 15.5; // Valeur par défaut si pas de données
        
        setTotalRevenue(total);
        setPendingRevenue(pending);
        setSuccessRate(successRateValue);
        setMonthlyTrend(trend);
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        setError('Erreur lors du chargement des données. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [refreshTrigger]);

  // Filtrage des paiements
  const filteredPayments = payments.filter(payment => {
    const business = businesses[payment.clientId];
    const subscription = subscriptions[payment.subscriptionId];
    
    if (!business || !subscription) return false;
    
    // Filtrer par terme de recherche
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      business.businessName.toLowerCase().includes(searchLower) ||
      payment.reference.toLowerCase().includes(searchLower) ||
      payment.id.toLowerCase().includes(searchLower);
    
    if (!matchesSearch) return false;
    
    // Filtrer par statut
    if (filterStatus !== 'all' && payment.status !== filterStatus) return false;
    
    // Filtrer par plage de dates
    const now = Date.now();
    const paymentDate = payment.date;
    
    if (filterDateRange === 'last7days' && (now - paymentDate > 7 * 24 * 60 * 60 * 1000)) return false;
    if (filterDateRange === 'last30days' && (now - paymentDate > 30 * 24 * 60 * 60 * 1000)) return false;
    if (filterDateRange === 'last90days' && (now - paymentDate > 90 * 24 * 60 * 60 * 1000)) return false;
    
    return true;
  });
  
  // Tri des paiements
  const sortedPayments = [...filteredPayments].sort((a, b) => {
    if (sortField === 'client') {
      const businessA = businesses[a.clientId]?.businessName || '';
      const businessB = businesses[b.clientId]?.businessName || '';
      return sortDirection === 'asc' 
        ? businessA.localeCompare(businessB)
        : businessB.localeCompare(businessA);
    }
    
    if (sortField === 'amount') {
      return sortDirection === 'asc' 
        ? a.amount - b.amount
        : b.amount - a.amount;
    }
    
    if (sortField === 'date') {
      return sortDirection === 'asc' 
        ? a.date - b.date
        : b.date - a.date;
    }
    
    if (sortField === 'status') {
      const statusOrder = {
        'pending': 0,
        'completed': 1,
        'failed': 2,
        'refunded': 3
      };
      
      return sortDirection === 'asc' 
        ? statusOrder[a.status] - statusOrder[b.status]
        : statusOrder[b.status] - statusOrder[a.status];
    }
    
    return 0;
  });
  
  // Gestion du tri
  const handleSort = (field: 'client' | 'amount' | 'date' | 'status') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Icône de tri
  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    
    return sortDirection === 'asc' ? (
      <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
      </svg>
    ) : (
      <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    );
  };
  
  // Formatage de la date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  // Obtenir la classe CSS pour le badge de statut
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'refunded':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  // Obtenir le texte du statut
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Complété';
      case 'pending':
        return 'En attente';
      case 'failed':
        return 'Échoué';
      case 'refunded':
        return 'Remboursé';
      default:
        return status;
    }
  };
  
  // Obtenir l'icône pour la méthode de paiement
  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'card':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
          </svg>
        );
      case 'bank_transfer':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"></path>
          </svg>
        );
      case 'direct_debit':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
        );
      case 'paypal':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        );
      default:
        return null;
    }
  };
  
  // Obtenir le texte de la méthode de paiement
  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'card':
        return 'Carte';
      case 'bank_transfer':
        return 'Virement';
      case 'direct_debit':
        return 'Prélèvement';
      case 'paypal':
        return 'PayPal';
      default:
        return method;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* En-tête avec titre, recherche et boutons de filtrage */}
      <div className="p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Titre à gauche */}
          <div className="flex items-center space-x-2 md:w-1/4 w-full">
            <h2 className="text-xl font-bold text-gray-800 whitespace-nowrap">Gestion des Paiements</h2>
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              {filteredPayments.length}
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
          
          {/* Filtres à droite */}
          <div className="flex items-center gap-3 md:w-auto w-full justify-end">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-32 px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
              <option value="all">Tous</option>
              <option value="completed">Complétés</option>
              <option value="pending">En attente</option>
              <option value="failed">Échoués</option>
              <option value="refunded">Remboursés</option>
            </select>
            
            <select
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value)}
              className="w-32 px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
              <option value="all">Toutes dates</option>
              <option value="last7days">7 derniers jours</option>
              <option value="last30days">30 derniers jours</option>
              <option value="last90days">90 derniers jours</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Section KPI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-gray-50 border-y border-gray-200">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">Revenu Total</p>
            <p className="text-2xl font-bold text-gray-800">
              {totalRevenue.toFixed(2)} €
            </p>
            <p className="text-xs text-green-600">
              Tous paiements confondus
            </p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex items-center">
          <div className="rounded-full bg-yellow-100 p-3 mr-4">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">En Attente</p>
            <p className="text-2xl font-bold text-gray-800">
              {pendingRevenue.toFixed(2)} €
            </p>
            <p className="text-xs text-yellow-600">
              Paiements non finalisés
            </p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">Taux de Succès</p>
            <p className="text-2xl font-bold text-gray-800">
              {successRate.toFixed(1)}%
            </p>
            <p className="text-xs text-blue-600">
              Transactions réussies
            </p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow border border-gray-100 flex items-center">
          <div className={`rounded-full ${monthlyTrend >= 0 ? 'bg-purple-100' : 'bg-red-100'} p-3 mr-4`}>
            <svg className={`w-6 h-6 ${monthlyTrend >= 0 ? 'text-purple-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={monthlyTrend >= 0 
                ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" 
                : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"}>
              </path>
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">Tendance Mensuelle</p>
            <p className="text-2xl font-bold text-gray-800">
              {monthlyTrend > 0 ? '+' : ''}{monthlyTrend.toFixed(1)}%
            </p>
            <p className={`text-xs ${monthlyTrend >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
              {monthlyTrend >= 0 ? 'Croissance' : 'Décroissance'}
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
      ) : sortedPayments.length === 0 ? (
        <div className="text-center py-16 px-6">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Aucun paiement trouvé</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filterStatus !== 'all' || filterDateRange !== 'all' ? 
              'Aucun paiement ne correspond à vos critères de recherche.' : 
              'Aucun paiement enregistré pour le moment.'}
          </p>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Référence
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center">
                    Montant {getSortIcon('amount')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center">
                    Date {getSortIcon('date')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Méthode
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
              {sortedPayments.map(payment => {
                const business = businesses[payment.clientId];
                const subscription = subscriptions[payment.subscriptionId];
                
                if (!business || !subscription) return null;
                
                return (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-indigo-100 text-indigo-800 rounded-full flex items-center justify-center font-bold">
                          {business.businessName.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{business.businessName}</div>
                          <div className="text-xs text-gray-500">{business.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{payment.reference}</div>
                      <div className="text-xs text-gray-500">ID: {payment.id.substring(0, 8)}...</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{payment.amount.toFixed(2)} €</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(payment.date)}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(payment.date).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="mr-1.5">{getPaymentMethodIcon(payment.method)}</span>
                        <span className="text-sm text-gray-900">{getPaymentMethodText(payment.method)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusBadgeClass(payment.status)}`}>
                        {getStatusText(payment.status)}
                      </span>
                      {payment.notes && (
                        <div className="text-xs text-gray-500 mt-1">
                          {payment.notes.substring(0, 20)}{payment.notes.length > 20 ? '...' : ''}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => onViewDetails(payment)}
                          className="text-indigo-600 hover:text-indigo-900 p-1"
                          title="Voir les détails"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                          </svg>
                        </button>
                        
                        {payment.status === 'pending' && (
                          <button 
                            onClick={() => onProcessPayment(payment)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="Traiter le paiement"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                          </button>
                        )}
                        
                        {payment.status === 'completed' && (
                          confirmRefund === payment.id ? (
                            <>
                              <button 
                                onClick={() => {
                                  onRefundPayment(payment.id);
                                  setConfirmRefund(null);
                                }}
                                className="text-red-600 hover:text-red-900 p-1"
                                title="Confirmer le remboursement"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                              </button>
                              <button 
                                onClick={() => setConfirmRefund(null)}
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
                              onClick={() => setConfirmRefund(payment.id)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Rembourser"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
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
      
      {/* Section d'analyse prédictive */}
      <div className="p-6 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Analyse Prédictive des Revenus</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Prévision du Mois Prochain</h4>
            <div className="flex items-center">
              <div className={`rounded-full ${monthlyTrend >= 0 ? 'bg-green-100' : 'bg-red-100'} p-2 mr-3`}>
                <svg className={`w-5 h-5 ${monthlyTrend >= 0 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={monthlyTrend >= 0 
                    ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" 
                    : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"}>
                  </path>
                </svg>
              </div>
              <div>
                <p className="text-xl font-bold text-gray-800">
                  {(totalRevenue * (1 + monthlyTrend / 100)).toFixed(2)} €
                </p>
                <p className="text-xs text-gray-500">
                  Basé sur la tendance actuelle de {monthlyTrend > 0 ? '+' : ''}{monthlyTrend.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Taux de Conversion</h4>
            <div className="flex items-center">
              <div className="rounded-full bg-blue-100 p-2 mr-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <p className="text-xl font-bold text-gray-800">
                  {(payments.filter(p => p.status === 'completed').length / (payments.length || 1) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500">
                  {payments.filter(p => p.status === 'completed').length} paiements réussis sur {payments.length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Valeur Moyenne</h4>
            <div className="flex items-center">
              <div className={`rounded-full ${monthlyTrend >= 0 ? 'bg-purple-100' : 'bg-red-100'} p-2 mr-3`}>
                <svg className={`w-5 h-5 ${monthlyTrend >= 0 ? 'text-purple-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div>
                <p className="text-xl font-bold text-gray-800">
                  {(payments.reduce((sum, p) => sum + p.amount, 0) / (payments.length || 1)).toFixed(2)} €
                </p>
                <p className="text-xs text-gray-500">
                  Par transaction
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernPaymentsList;
