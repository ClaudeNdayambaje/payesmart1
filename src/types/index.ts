// Types pour les employés
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
  phoneNumber?: string;
  phone?: string;
  address?: string;
  birthDate?: Date;
  hireDate?: Date;
  terminationDate?: Date;
  hourlyRate?: number;
  documents?: EmployeeDocument[];
  permissions: Permission[];
  notes?: string;
  profileImage?: string;
  avatarUrl?: string;
  businessId: string;
  isMainAdmin?: boolean;
  firebaseUid?: string; // UID du compte Firebase associé (pour l'administrateur système)
  firebasePassword?: string;
  emergencyContact?: string;
  contractType?: string;
  bankAccount?: string;
  socialSecurityNumber?: string;
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

export interface EmployeeDocument {
  id: string;
  type: 'id' | 'contract' | 'certificate' | 'other';
  name: string;
  url: string;
  uploadDate: Date;
}

export interface WorkingHours {
  start: string; // Format: "HH:MM"
  end: string; // Format: "HH:MM"
}

// Types pour les permissions
export interface Permission {
  id: string;
  name: string;
  description: string;
  category: 'pos' | 'sales' | 'inventory' | 'suppliers' | 'employees' | 'reports' | 'settings' | 'admin';
  level: 'read' | 'write' | 'admin';
  businessId: string;
}

// Types pour les shifts
export interface Shift {
  id: string;
  employeeId: string;
  start: Date;
  end: Date;
  status: 'scheduled' | 'active' | 'completed' | 'absent' | 'late' | 'cancelled' | 'in_progress';
  actualStart?: Date;
  actualEnd?: Date;
  breaks: Break[];
  notes?: string;
  overrideHourlyRate?: number;
  totalHours?: number;
  totalPay?: number;
  businessId: string;
}

export interface Break {
  id: string;
  type: 'lunch' | 'rest' | 'other';
  start: Date;
  end?: Date;
  duration?: number; // en minutes
  paid: boolean;
}

// Types pour les statistiques des employés
export interface EmployeeStats {
  totalHoursWorked: number;
  totalShifts: number;
  completedShifts: number;
  lateArrivals: number;
  completionRate: number; // pourcentage
  punctualityRate: number; // pourcentage
  totalSales: number;
  averageTransactionValue: number;
  totalTransactions: number;
  hoursWorked: number;
  performance: number;
  salesByCategory?: Record<string, number>;
  salesByHour?: Record<number, number>;
  customerSatisfaction?: number;
  absenceRate?: number;
  overtime?: number;
  efficiency?: number;
  trainingCompleted?: string[];
}

export interface EmployeeFirestoreDocument {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'manager' | 'cashier';
  pin: string;
  active: boolean;
  createdAt: Date | any;
  lastLogin?: Date | any;
  phoneNumber?: string;
  phone?: string;
  address?: string;
  birthDate?: Date | any;
  hireDate?: Date | any;
  terminationDate?: Date | any;
  hourlyRate?: number;
  documents?: EmployeeDocument[];
  permissions: string[];
  notes?: string;
  profileImage?: string;
  avatarUrl?: string;
  businessId: string;
  isMainAdmin?: boolean;
  firebasePassword?: string;
  emergencyContact?: string;
  contractType?: string;
  bankAccount?: string;
  socialSecurityNumber?: string;
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

export interface ShiftFirestoreDocument {
  id: string;
  employeeId: string;
  startTime: Date | any;
  endTime?: Date | any;
  scheduledStartTime: Date | any;
  scheduledEndTime: Date | any;
  status: 'scheduled' | 'in-progress' | 'completed' | 'missed';
  notes?: string;
  breaks?: any[];
  createdAt: Date | any;
  updatedAt?: Date | any;
  businessId: string;
}

// Type pour les entreprises (basé sur la structure Firebase)
// Type pour les catégories
export interface Category {
  id: string;
  name: string;
  active?: boolean;
  createdAt: any; // Pour supporter à la fois string et Timestamp
  businessId: string;
  description?: string;
}

export interface Business {
  id: string;
  // Champs généraux
  name?: string;
  businessName?: string;
  email?: string;
  phone?: string;
  address?: string | { 
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
  };
  city?: string;
  postalCode?: string;
  country?: string;
  createdAt?: number | Date | string;
  updatedAt?: number | Date | string;
  
  // Informations sur le propriétaire
  owner?: string;
  ownerFirstName?: string;
  ownerLastName?: string;
  
  // Statut et configuration
  active?: boolean;
  status?: string;
  deleted?: boolean;
  deletedAt?: number;
  plan?: string;
  isInTrial?: boolean;
  trialStartDate?: number;
  trialEndDate?: number;
  
  // Paramètres régionaux
  currency?: string;
  language?: string;
  timezone?: string;
  
  // Autres champs
  notes?: string;
  logo?: string;
  settings?: any;
}
