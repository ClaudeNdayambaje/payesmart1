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
}

export interface CartItem {
  product: Product;
  quantity: number;
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
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
}

export interface Receipt {
  sale: Sale;
  businessName: string;
  address: string;
  phone: string;
  email: string;
  vatNumber: string;
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
}

export interface Discount {
  id: string;
  type: 'loyalty' | 'student' | 'senior' | 'custom';
  value: number;
  description: string;
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
}

export interface LoyaltyTier {
  name: 'bronze' | 'silver' | 'gold' | 'platinum';
  minimumPoints: number;
  discountPercentage: number;
  pointsMultiplier: number;
  color: string;
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
  permissions: Permission[];
  address?: string;
  phone?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  birthDate?: Date;
  hireDate?: Date;
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
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'pos' | 'inventory' | 'admin' | 'reports' | 'settings';
  level: 'read' | 'write' | 'admin';
}

export interface Shift {
  id: string;
  employeeId: string;
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
  end?: Date;
  type: 'lunch' | 'rest' | 'other';
  paid: boolean;
  duration?: number;
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
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  date: Date;
  type: 'sales' | 'training' | 'performance' | 'other';
  icon: string;
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
}

export interface StockAdjustment {
  productId: string;
  quantity: number;
  type: 'adjustment' | 'loss' | 'inventory';
  reason: string;
}