import { Timestamp } from 'firebase/firestore';

// Types pour les documents Firestore
export interface FirestoreDocument {
  id: string;
}

export interface TimestampDocument extends FirestoreDocument {
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Interface pour les données de l'entreprise
export interface Business {
  id: string;
  businessName: string;
  ownerFirstName: string;
  ownerLastName: string;
  email: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
  plan: 'free' | 'basic' | 'premium';
  active: boolean;
  logo?: string;
  address?: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  settings?: {
    currency: string;
    language: string;
    timezone: string;
    vatNumber?: string;
    invoicePrefix?: string;
    receiptFooter?: string;
    loyaltyProgram?: boolean;
  };
}

export interface EmployeeFirestoreDocument extends TimestampDocument {
  firstName: string;
  lastName: string;
  email: string;
  pin: string;
  role: 'admin' | 'manager' | 'cashier';
  active: boolean;
  businessId: string;
  permissions: string[];
  isMainAdmin?: boolean; // Indique si c'est l'administrateur principal qui ne peut pas être supprimé
  lastLogin?: Timestamp;
  birthDate?: Timestamp;
  hireDate?: Timestamp;
  terminationDate?: Timestamp;
  firebasePassword?: string; // Mot de passe spécifique pour l'authentification Firebase
  documents?: {
    id: string;
    type: 'id' | 'contract' | 'certificate' | 'other';
    name: string;
    url: string;
    uploadDate: Timestamp;
  }[];
  contractType?: 'full-time' | 'part-time' | 'temporary';
  hourlyRate?: number;
  bankAccount?: string;
  socialSecurityNumber?: string;
  notes?: string;
  address?: string;
  phone?: string;
  avatarUrl?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  schedule?: {
    monday?: WorkingHours;
    tuesday?: WorkingHours;
    wednesday?: WorkingHours;
    thursday?: WorkingHours;
    friday?: WorkingHours;
    saturday?: WorkingHours;
    sunday?: WorkingHours;
  };
}

export interface ShiftFirestoreDocument extends TimestampDocument {
  employeeId: string;
  businessId: string;
  start: Timestamp;
  end: Timestamp;
  status: 'scheduled' | 'active' | 'completed' | 'absent' | 'late';
  actualStart?: Timestamp;
  actualEnd?: Timestamp;
  breaks?: {
    id: string;
    type: 'lunch' | 'rest' | 'other';
    paid: boolean;
    duration?: number;
    start: Timestamp;
    end: Timestamp | null;
  }[];
  notes?: string;
  overrideHourlyRate?: number;
  totalHours?: number;
  totalPay?: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  image?: string;
  lowStockThreshold?: number;
  vatRate: 21 | 12 | 6;
  supplier?: string;
  orderQuantity?: number;
  promotion?: Promotion;
  barcode?: string; // Code-barres du produit
  businessId: string; // ID de l'entreprise à laquelle appartient le produit
}

export interface CartItem {
  product: Product;
  quantity: number;
  businessId: string; // ID de l'entreprise à laquelle appartient l'article du panier
}

export interface Sale {
  id: string;
  items: CartItem[];
  subtotal: number;
  vatAmounts: {
    vat6: number;
    vat12: number;
    vat21: number;
  };
  total: number;
  timestamp: Date;
  paymentMethod: 'cash' | 'card';
  receiptNumber: string;
  amountReceived: number;
  change: number;
  discounts?: Discount[];
  loyaltyCard?: LoyaltyCard;
  pointsEarned?: number;
  employeeId: string;
  businessId: string; // ID de l'entreprise à laquelle appartient la vente
  
  // Informations sur le terminal de paiement (pour Viva)
  paymentTerminalId?: string; // ID du terminal utilisé pour le paiement par carte
  paymentTerminalName?: string; // Nom du terminal utilisé pour le paiement
  
  // Propriétés liées aux remboursements
  refunded?: boolean;
  refundId?: string;
  refundedItems?: { productId: string; quantity: number }[];
  refundAmount?: number;
  refundTimestamp?: Date | { toDate: () => Date } | any; // Support pour Timestamp Firestore
  refundMethod?: 'cash' | 'card';
  fullRefund?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  businessId: string; // ID de l'entreprise à laquelle appartient la catégorie
}

export interface Receipt {
  sale: Sale;
  businessName: string;
  address: string;
  phone: string;
  email: string;
  vatNumber: string;
  businessId: string; // ID de l'entreprise à laquelle appartient le reçu
}

export interface SupplierOrder {
  id: string;
  products: {
    product: Product;
    quantity: number;
  }[];
  status: 'pending' | 'confirmed' | 'delivered';
  orderDate: Date;
  expectedDeliveryDate?: Date;
  totalAmount: number;
  businessId: string; // ID de l'entreprise à laquelle appartient la commande fournisseur
}

export interface Promotion {
  id: string;
  type: 'percentage' | 'fixed' | 'buyXgetY';
  value: number;
  startDate: Date;
  endDate: Date;
  description: string;
  buyQuantity?: number;
  getFreeQuantity?: number;
  businessId: string; // ID de l'entreprise à laquelle appartient la promotion
}

export interface Discount {
  id: string;
  type: 'loyalty' | 'student' | 'senior' | 'custom';
  value: number;
  description: string;
  businessId: string; // ID de l'entreprise à laquelle appartient la remise
}

export interface LoyaltyCard {
  id: string;
  number: string;
  customerName: string;
  email: string;
  phone?: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  createdAt: Date;
  lastUsed?: Date;
  businessId: string; // ID de l'entreprise à laquelle appartient la carte de fidélité
}

export interface LoyaltyTier {
  name: 'bronze' | 'silver' | 'gold' | 'platinum';
  minimumPoints: number;
  discountPercentage: number;
  pointsMultiplier: number;
  color: string;
  businessId: string; // ID de l'entreprise à laquelle appartient le niveau de fidélité
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'manager' | 'cashier';
  pin: string;
  active: boolean;
  createdAt: Date;
  lastLogin?: Date;
  businessId: string;
  permissions: Permission[];
  isMainAdmin?: boolean; // Indique si c'est l'administrateur principal qui ne peut pas être supprimé
  firebasePassword?: string; // Mot de passe spécifique pour l'authentification Firebase
  avatarUrl?: string;
  address?: string;
  phone?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  birthDate?: Date;
  hireDate?: Date;
  terminationDate?: Date;
  contractType?: 'full-time' | 'part-time' | 'temporary';
  hourlyRate?: number;
  bankAccount?: string;
  socialSecurityNumber?: string;
  notes?: string;
  documents?: EmployeeDocument[];
  schedule?: {
    monday?: WorkingHours;
    tuesday?: WorkingHours;
    wednesday?: WorkingHours;
    thursday?: WorkingHours;
    friday?: WorkingHours;
    saturday?: WorkingHours;
    sunday?: WorkingHours;
  };
}

export interface WorkingHours {
  start: string;
  end: string;
  breaks?: { start: string; end: string }[];
}

export interface EmployeeDocument {
  id: string;
  type: 'contract' | 'id' | 'certificate' | 'other';
  name: string;
  url: string;
  uploadDate: Date;
  businessId: string; // ID de l'entreprise à laquelle appartient le document de l'employé
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'pos' | 'inventory' | 'admin' | 'reports' | 'settings' | 'sales' | 'employees' | 'suppliers';
  level: 'read' | 'write' | 'admin';
  businessId: string; // ID de l'entreprise à laquelle appartient la permission
}

export interface Shift {
  id: string;
  employeeId: string;
  businessId: string; // ID de l'entreprise à laquelle appartient le shift
  start: Date;
  end: Date;
  status: 'scheduled' | 'active' | 'completed' | 'absent' | 'late';
  actualStart?: Date;
  actualEnd?: Date;
  breaks: Break[];
  notes?: string;
  overrideHourlyRate?: number;
  totalHours?: number;
  totalPay?: number;
}

export interface Break {
  id: string;
  start: Date;
  end: Date | null;
  type: 'lunch' | 'rest' | 'other';
  paid: boolean;
  duration?: number;
  businessId: string; // ID de l'entreprise à laquelle appartient la pause
}

export interface EmployeeStats {
  totalSales: number;
  averageTransactionValue: number;
  totalTransactions: number;
  hoursWorked: number;
  performance: number;
  salesByCategory: Record<string, number>;
  salesByHour: Record<number, number>;
  customerSatisfaction?: number;
  absenceRate: number;
  lateArrivals: number;
  overtime: number;
  efficiency: number;
  trainingCompleted: string[];
  achievements: Achievement[];
  businessId: string; // ID de l'entreprise à laquelle appartient les statistiques de l'employé
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  date: Date;
  type: 'sales' | 'training' | 'performance' | 'other';
  icon: string;
  businessId: string; // ID de l'entreprise à laquelle appartient la réalisation
}

export interface StockMovement {
  id: string;
  productId: string;
  type: 'adjustment' | 'sale' | 'return' | 'reception' | 'loss' | 'inventory';
  quantity: number;
  previousStock: number;
  newStock: number;
  timestamp: Date;
  reason?: string;
  employeeId: string;
  reference?: string;
  businessId: string; // ID de l'entreprise à laquelle appartient le mouvement de stock
}

export interface StockAdjustment {
  productId: string;
  quantity: number;
  type: 'adjustment' | 'loss' | 'inventory';
  reason: string;
  employeeId?: string;
  reference?: string;
  businessId: string; // ID de l'entreprise à laquelle appartient l'ajustement de stock
}