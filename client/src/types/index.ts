export interface ShopInfo {
  shopName: string;
  tagline: string;
  address: string;
  phone: string;
  gstin: string;
  currencySymbol: string;
  isDemoMode: boolean;
}

export interface DashboardMetrics {
  todaySalesAmount: number;
  todayBillsCount: number;
  todayCashAmount: number;
  todayUpiAmount: number;
  todayCreditAmount: number;
  todayExpensesAmount: number;
  estimatedGrossProfit: number;
  totalOutstandingCredit: number;
  creditCustomerCount: number;
  lowStockCount: number;
}

export interface LowStockItem {
  id: number;
  name: string;
  kannadaName: string | null;
  unit: string;
  currentStock: number;
  minStockAlert: number;
}

export interface RecentBill {
  id: number;
  billNumber: string;
  customerName: string | null;
  grandTotal: number;
  paymentMode: 'CASH' | 'UPI' | 'CREDIT' | 'SPLIT' | string;
  paymentStatus: string;
  totalItems: number;
  createdAt: string;
}

export interface DashboardSummary {
  shopInfo: ShopInfo;
  metrics: DashboardMetrics;
  lowStockItems: LowStockItem[];
  recentBills: RecentBill[];
  isDemoData: boolean;
}

export type AppModule = 
  | 'dashboard'
  | 'billing'
  | 'products'
  | 'customers'
  | 'suppliers'
  | 'expenses'
  | 'reports'
  | 'settings';
