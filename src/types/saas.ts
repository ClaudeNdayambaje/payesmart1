// Types pour la gestion du SaaS

// Interface pour les informations de période d'essai
export interface TrialInfo {
  trialPeriodId: string;
  trialPeriodName: string;
  durationDays: number;
  durationMinutes: number;
  formattedEndDate: string;
}

export interface Client {
  id: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  createdAt: number;
  status: 'active' | 'inactive' | 'pending' | 'Active' | 'DELETED';
  notes?: string;
  businessId?: string; // ID de l'entreprise associée à ce client SaaS
  trialStartDate?: number; // Date de début de la période d'essai
  trialEndDate?: number; // Date de fin de la période d'essai
  isInTrial?: boolean; // Indique si le client est en période d'essai
  trialInfo?: TrialInfo; // Informations détaillées sur la période d'essai
  deleted?: boolean; // Indique si le client a été supprimé
  deletedAt?: number; // Date de suppression du client
}

export interface Subscription {
  id: string;
  clientId: string;
  planId: string;
  startDate: number;
  endDate: number;
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  autoRenew: boolean;
  createdAt: number;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'quarterly' | 'biannually' | 'annually' | 'yearly';
  paymentMethod: string;
  notes?: string;
  cancelDate?: number;
  lastModified?: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'quarterly' | 'biannually' | 'annually' | 'yearly';
  features: string[];
  active: boolean;
  createdAt?: number;
  trialPeriodInDays?: number;
  isPopular?: boolean;
}

export interface Payment {
  id: string;
  clientId: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  paymentDate: number;
  date: number; // Date du paiement (alias pour paymentDate pour compatibilité)
  paymentMethod: 'card' | 'bank_transfer' | 'paypal' | 'other';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  notes?: string;
}

export interface SaasStats {
  totalClients: number;
  activeClients: number;
  trialClients: number;
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  clientGrowthRate: number;
  churnRate: number;
  retentionRate: number;
  renewalRate: number;
  averageRevenuePerUser: number;
  lifetimeValue: number;
}
