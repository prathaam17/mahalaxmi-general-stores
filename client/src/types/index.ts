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

export interface ProductItem {
  id: number;
  barcode: string | null;
  name: string;
  kannadaName: string | null;
  categoryId: number | null;
  categoryName: string | null;
  isLoose: boolean;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  mrp: number;
  currentStock: number;
  minStockAlert: number;
}

export interface ProductWithCategory extends ProductItem {
  profitMarginPercent: number;
  stockStatus: 'normal' | 'low' | 'out_of_stock';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryItem {
  id: number;
  name: string;
  description: string | null;
  productCount: number;
}

export interface InventoryMetrics {
  totalProducts: number;
  totalValuationCost: number;
  totalValuationRetail: number;
  lowStockCount: number;
  outOfStockCount: number;
  looseGoodsCount: number;
}

export interface Customer {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
  creditLimit: number;
  currentBalance: number;
  availableCredit: number;
}

export interface CustomerWithMeta extends Customer {
  isOverLimit: boolean;
  lastTransactionDate: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CustomerMetrics {
  totalCustomers: number;
  totalOutstandingBalance: number;
  customersWithDueCount: number;
  repaymentsCollectedToday: number;
}

export interface LedgerEntry {
  id: number;
  customerId: number;
  billId: number | null;
  billNumber: string | null;
  entryType: 'DEBIT' | 'CREDIT';
  amount: number;
  balanceAfter: number;
  paymentMode: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CustomerStatement {
  customer: CustomerWithMeta;
  summary: {
    totalDebits: number;
    totalCredits: number;
    currentBalance: number;
    totalTransactions: number;
  };
  entries: LedgerEntry[];
}

export interface CustomerFormData {
  name: string;
  phone?: string | null;
  address?: string | null;
  creditLimit?: number;
  initialBalance?: number;
}

export interface CartItem {
  productId?: number | null;
  barcode?: string | null;
  productName: string;
  kannadaName?: string | null;
  quantity: number;
  unit: string;
  costPrice?: number;
  unitPrice: number;
  lineTotal: number;
  isLoose?: boolean;
}

export interface CreateBillPayload {
  customerId?: number | null;
  items: Array<{
    productId?: number | null;
    productName: string;
    quantity: number;
    unit: string;
    costPrice?: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  discount?: number;
  taxAmount?: number;
  paymentMode: 'CASH' | 'UPI' | 'CREDIT' | 'SPLIT';
  cashReceived?: number;
  upiReceived?: number;
  creditAdded?: number;
  notes?: string;
}

export interface BillDetail {
  id: number;
  billNumber: string;
  customerId: number | null;
  customerName?: string | null;
  customerPhone?: string | null;
  totalItems: number;
  subtotal: number;
  discount: number;
  taxAmount: number;
  grandTotal: number;
  paymentMode: string;
  cashReceived: number;
  upiReceived: number;
  creditAdded: number;
  changeReturned: number;
  paymentStatus: string;
  notes: string | null;
  isReversed: boolean;
  reversedAt: string | null;
  reversalReason: string | null;
  createdAt: string;
  items: Array<{
    id: number;
    productId: number | null;
    productName: string;
    quantity: number;
    unit: string;
    costPrice: number;
    unitPrice: number;
    lineTotal: number;
  }>;
}

export interface ProductFormData {
  barcode?: string | null;
  name: string;
  kannadaName?: string | null;
  categoryId?: number | null;
  isLoose: boolean;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  mrp?: number;
  currentStock?: number;
  minStockAlert?: number;
}

export interface SupplierWithMeta {
  id: number;
  name: string;
  phone: string | null;
  gstin: string | null;
  address: string | null;
  currentBalance: number;
  totalPurchasesCount: number;
  lastPurchaseDate: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface SupplierMetrics {
  totalSuppliers: number;
  totalPayableBalance: number;
  suppliersWithDueCount: number;
  purchasesThisMonth: number;
  paymentsMadeThisMonth: number;
}

export interface SupplierLedgerEntry {
  id: number;
  supplierId: number;
  purchaseId: number | null;
  invoiceNumber: string | null;
  entryType: 'CREDIT' | 'DEBIT';
  amount: number;
  balanceAfter: number;
  paymentMode: string | null;
  notes: string | null;
  createdAt: string;
}

export interface SupplierStatement {
  supplier: SupplierWithMeta;
  summary: {
    totalDeliveries: number;
    totalPayments: number;
    currentBalance: number;
    totalTransactions: number;
  };
  entries: SupplierLedgerEntry[];
}

export interface SupplierFormData {
  name: string;
  phone?: string | null;
  gstin?: string | null;
  address?: string | null;
  initialBalance?: number;
}

export interface PurchaseItemFormData {
  productId?: number | null;
  productName: string;
  quantity: number;
  unit: string;
  unitCostPrice: number;
  lineTotal: number;
  updateProductCost?: boolean;
}

export interface PurchaseFormData {
  supplierId: number;
  invoiceNumber?: string;
  purchaseDate?: string;
  items: PurchaseItemFormData[];
  paymentMode: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CREDIT';
  paidAmount: number;
  notes?: string;
}

export interface PurchaseDetail {
  id: number;
  invoiceNumber: string;
  supplierId: number;
  supplierName: string;
  supplierPhone: string | null;
  totalItems: number;
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  paidAmount: number;
  paymentMode: string;
  paymentStatus: string;
  notes: string | null;
  purchaseDate: string;
  createdAt: string;
  items: Array<{
    id: number;
    productId: number | null;
    productName: string;
    quantity: number;
    unit: string;
    unitCostPrice: number;
    lineTotal: number;
  }>;
}
