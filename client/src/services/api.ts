import type {
  DashboardSummary,
  ProductItem,
  ProductWithCategory,
  CategoryItem,
  InventoryMetrics,
  ProductFormData,
  Customer,
  CustomerWithMeta,
  CustomerMetrics,
  CustomerStatement,
  CustomerFormData,
  CreateBillPayload,
  BillDetail,
  SupplierWithMeta,
  SupplierMetrics,
  SupplierStatement,
  SupplierFormData,
  PurchaseFormData,
  PurchaseDetail,
  ExpenseItem,
  ExpenseMetrics,
  ExpenseFormData,
  CashRegisterSummary,
  CashRegisterDenominations,
  CashRegisterHistoryItem,
  SalesReportSummary,
  ShopSettingsData,
  DatabaseStatusInfo,
  AuditLogEntry,
} from '../types';

const API_BASE = '/api';

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const response = await fetch(`${API_BASE}/dashboard/summary`);
  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard summary (Status: ${response.status})`);
  }
  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Invalid server response');
  }
  return result.data;
}

export async function checkServerHealth(): Promise<{ status: string; shop: string; mode: string }> {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) {
    throw new Error('Server health check failed');
  }
  return response.json();
}

// ----------------------------------------------------
// Customers & Udhaar Khata APIs
// ----------------------------------------------------

export async function fetchCustomersList(search?: string, hasBalance?: boolean): Promise<CustomerWithMeta[]> {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (hasBalance) params.set('hasBalance', 'true');

  const url = `${API_BASE}/customers?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch customers (Status: ${response.status})`);
  }
  const result = await response.json();
  return result.data || [];
}

export async function fetchCustomerMetrics(): Promise<CustomerMetrics> {
  const response = await fetch(`${API_BASE}/customers/metrics`);
  if (!response.ok) {
    throw new Error(`Failed to fetch customer metrics (Status: ${response.status})`);
  }
  const result = await response.json();
  return result.data;
}

export async function createCustomer(data: CustomerFormData): Promise<CustomerWithMeta> {
  const response = await fetch(`${API_BASE}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error?.message || 'Failed to register customer');
  }
  return result.data;
}

export async function updateCustomer(id: number, data: CustomerFormData): Promise<CustomerWithMeta> {
  const response = await fetch(`${API_BASE}/customers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error?.message || 'Failed to update customer details');
  }
  return result.data;
}

export async function recordCustomerPayment(
  id: number,
  amount: number,
  paymentMode: 'CASH' | 'UPI',
  notes?: string
): Promise<{ customer: CustomerWithMeta }> {
  const response = await fetch(`${API_BASE}/customers/${id}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, paymentMode, notes }),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error?.message || 'Failed to record payment');
  }
  return result.data;
}

export async function fetchCustomerStatement(
  id: number,
  startDate?: string,
  endDate?: string
): Promise<CustomerStatement> {
  const params = new URLSearchParams();
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);

  const url = `${API_BASE}/customers/${id}/statement?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch customer statement (Status: ${response.status})`);
  }
  const result = await response.json();
  return result.data;
}

export async function deactivateCustomer(id: number): Promise<boolean> {
  const response = await fetch(`${API_BASE}/customers/${id}`, {
    method: 'DELETE',
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error?.message || 'Failed to deactivate customer');
  }
  return true;
}

// ----------------------------------------------------
// Products & Inventory APIs
// ----------------------------------------------------

export interface FetchProductsFilter {
  search?: string;
  categoryId?: number;
  stockStatus?: 'all' | 'low' | 'out_of_stock' | 'normal';
  isLoose?: boolean;
}

export async function fetchProducts(filters: FetchProductsFilter = {}): Promise<ProductWithCategory[]> {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.categoryId) params.set('categoryId', String(filters.categoryId));
  if (filters.stockStatus && filters.stockStatus !== 'all') params.set('stockStatus', filters.stockStatus);
  if (filters.isLoose !== undefined) params.set('isLoose', String(filters.isLoose));

  const url = `${API_BASE}/products?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch products (Status: ${response.status})`);
  }
  const result = await response.json();
  return result.data || [];
}

export async function fetchInventoryMetrics(): Promise<InventoryMetrics> {
  const response = await fetch(`${API_BASE}/products/metrics`);
  if (!response.ok) {
    throw new Error(`Failed to fetch inventory metrics (Status: ${response.status})`);
  }
  const result = await response.json();
  return result.data;
}

export async function fetchCategories(): Promise<CategoryItem[]> {
  const response = await fetch(`${API_BASE}/products/categories`);
  if (!response.ok) {
    throw new Error(`Failed to fetch categories (Status: ${response.status})`);
  }
  const result = await response.json();
  return result.data || [];
}

export async function createCategory(name: string, description?: string): Promise<CategoryItem> {
  const response = await fetch(`${API_BASE}/products/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description }),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error?.message || 'Failed to create category');
  }
  return result.data;
}

export async function createProduct(data: ProductFormData): Promise<ProductWithCategory> {
  const response = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error?.message || 'Failed to create product');
  }
  return result.data;
}

export async function updateProduct(id: number, data: ProductFormData): Promise<ProductWithCategory> {
  const response = await fetch(`${API_BASE}/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error?.message || 'Failed to update product');
  }
  return result.data;
}

export async function adjustProductStock(
  id: number,
  deltaQuantity: number,
  reason: string
): Promise<ProductWithCategory> {
  const response = await fetch(`${API_BASE}/products/${id}/adjust-stock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deltaQuantity, reason }),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error?.message || 'Failed to adjust stock');
  }
  return result.data;
}

export async function deactivateProduct(id: number): Promise<boolean> {
  const response = await fetch(`${API_BASE}/products/${id}`, {
    method: 'DELETE',
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error?.message || 'Failed to deactivate product');
  }
  return true;
}

// ----------------------------------------------------
// Billing APIs
// ----------------------------------------------------

export async function searchProducts(query: string = ''): Promise<ProductItem[]> {
  const url = `${API_BASE}/billing/products?q=${encodeURIComponent(query)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to search products (Status: ${response.status})`);
  }
  const result = await response.json();
  return result.data || [];
}

export async function fetchCustomers(query: string = ''): Promise<Customer[]> {
  const url = `${API_BASE}/billing/customers?q=${encodeURIComponent(query)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch customers (Status: ${response.status})`);
  }
  const result = await response.json();
  return result.data || [];
}

export async function createSaleBill(payload: CreateBillPayload): Promise<BillDetail> {
  const response = await fetch(`${API_BASE}/billing/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error?.message || 'Failed to complete sale bill');
  }
  return result.data;
}

export async function getBillDetails(id: number): Promise<BillDetail> {
  const response = await fetch(`${API_BASE}/billing/bills/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch bill details (Status: ${response.status})`);
  }
  const result = await response.json();
  return result.data;
}

export async function reverseBill(id: number, reason: string): Promise<BillDetail> {
  const response = await fetch(`${API_BASE}/billing/bills/${id}/reverse`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reason }),
  });

  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error?.message || 'Failed to reverse bill');
  }
  return result.data;
}

// ----------------------------------------------------
// Suppliers & Purchase Entries APIs
// ----------------------------------------------------

export async function fetchSuppliersList(search?: string, hasBalance?: boolean): Promise<SupplierWithMeta[]> {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (hasBalance) params.set('hasBalance', 'true');

  const url = `${API_BASE}/suppliers?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch suppliers (Status: ${response.status})`);
  }
  const result = await response.json();
  return result.data || [];
}

export async function fetchSupplierMetrics(): Promise<SupplierMetrics> {
  const response = await fetch(`${API_BASE}/suppliers/metrics`);
  if (!response.ok) {
    throw new Error(`Failed to fetch supplier metrics (Status: ${response.status})`);
  }
  const result = await response.json();
  return result.data;
}

export async function createSupplier(data: SupplierFormData): Promise<SupplierWithMeta> {
  const response = await fetch(`${API_BASE}/suppliers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error?.message || 'Failed to create supplier');
  }
  return result.data;
}

export async function updateSupplier(id: number, data: SupplierFormData): Promise<SupplierWithMeta> {
  const response = await fetch(`${API_BASE}/suppliers/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error?.message || 'Failed to update supplier details');
  }
  return result.data;
}

export async function deleteSupplier(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/suppliers/${id}`, {
    method: 'DELETE',
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error?.message || 'Failed to deactivate supplier');
  }
}

export async function recordSupplierPurchase(data: PurchaseFormData): Promise<PurchaseDetail> {
  const response = await fetch(`${API_BASE}/suppliers/purchases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error?.message || 'Failed to record purchase entry');
  }
  return result.data;
}

export async function recordSupplierPayment(
  id: number,
  amount: number,
  paymentMode: 'CASH' | 'UPI' | 'BANK_TRANSFER',
  notes?: string
): Promise<{ supplier: SupplierWithMeta }> {
  const response = await fetch(`${API_BASE}/suppliers/${id}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, paymentMode, notes }),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error?.message || 'Failed to record payment to supplier');
  }
  return result.data;
}

export async function fetchSupplierStatement(id: number): Promise<SupplierStatement> {
  const response = await fetch(`${API_BASE}/suppliers/${id}/statement`);
  if (!response.ok) {
    throw new Error(`Failed to fetch supplier statement (Status: ${response.status})`);
  }
  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to load supplier statement');
  }
  return result.data;
}

export async function fetchPurchasesList(supplierId?: number, limit?: number): Promise<PurchaseDetail[]> {
  const params = new URLSearchParams();
  if (supplierId) params.set('supplierId', String(supplierId));
  if (limit) params.set('limit', String(limit));

  const url = `${API_BASE}/suppliers/purchases?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch purchases (Status: ${response.status})`);
  }
  const result = await response.json();
  return result.data || [];
}

// ----------------------------------------------------
// Daily Expenses & Cash Drawer APIs
// ----------------------------------------------------

export async function fetchExpensesList(filters: {
  startDate?: string;
  endDate?: string;
  category?: string;
  paymentMode?: string;
} = {}): Promise<ExpenseItem[]> {
  const params = new URLSearchParams();
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (filters.category) params.set('category', filters.category);
  if (filters.paymentMode) params.set('paymentMode', filters.paymentMode);

  const url = `${API_BASE}/expenses?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch expenses (Status: ${response.status})`);
  }
  const result = await response.json();
  return result.data || [];
}

export async function fetchExpenseMetrics(date?: string): Promise<ExpenseMetrics> {
  const params = new URLSearchParams();
  if (date) params.set('date', date);

  const url = `${API_BASE}/expenses/metrics?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch expense metrics (Status: ${response.status})`);
  }
  const result = await response.json();
  return result.data;
}

export async function createExpense(data: ExpenseFormData): Promise<ExpenseItem> {
  const response = await fetch(`${API_BASE}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error?.message || 'Failed to record expense');
  }
  return result.data;
}

export async function updateExpense(id: number, data: ExpenseFormData & { expenseDate: string }): Promise<ExpenseItem> {
  const response = await fetch(`${API_BASE}/expenses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error?.message || 'Failed to update expense');
  }
  return result.data;
}

export async function deleteExpense(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/expenses/${id}`, {
    method: 'DELETE',
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error?.message || 'Failed to delete expense');
  }
}

export async function fetchCashRegister(date?: string): Promise<CashRegisterSummary> {
  const params = new URLSearchParams();
  if (date) params.set('date', date);

  const url = `${API_BASE}/expenses/cash-register?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch cash register summary (Status: ${response.status})`);
  }
  const result = await response.json();
  return result.data;
}

export async function setOpeningCash(date: string, openingCash: number, notes?: string): Promise<CashRegisterSummary> {
  const response = await fetch(`${API_BASE}/expenses/cash-register/opening`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, openingCash, notes }),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error?.message || 'Failed to set opening cash');
  }
  return result.data;
}

export async function closeCashRegister(
  date: string,
  denominations: CashRegisterDenominations,
  closingNotes?: string
): Promise<CashRegisterSummary> {
  const response = await fetch(`${API_BASE}/expenses/cash-register/close`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, denominations, closingNotes }),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error?.message || 'Failed to close cash register');
  }
  return result.data;
}

export async function reopenCashRegister(date: string): Promise<CashRegisterSummary> {
  const response = await fetch(`${API_BASE}/expenses/cash-register/reopen`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date }),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error?.message || 'Failed to reopen cash register');
  }
  return result.data;
}

export async function fetchCashHistory(limit?: number): Promise<CashRegisterHistoryItem[]> {
  const params = new URLSearchParams();
  if (limit) params.set('limit', String(limit));

  const url = `${API_BASE}/expenses/cash-register/history?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch cash drawer history (Status: ${response.status})`);
  }
  const result = await response.json();
  return result.data || [];
}

// ----------------------------------------------------
// Sales & Profit Reports APIs
// ----------------------------------------------------

export async function fetchSalesReport(params: {
  startDate?: string;
  endDate?: string;
  period?: 'today' | 'week' | 'month' | 'year' | 'custom';
} = {}): Promise<SalesReportSummary> {
  const searchParams = new URLSearchParams();
  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.endDate) searchParams.set('endDate', params.endDate);
  if (params.period) searchParams.set('period', params.period);

  const url = `${API_BASE}/reports/sales?${searchParams.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch sales report (Status: ${response.status})`);
  }
  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error?.message || 'Failed to load sales report');
  }
  return result.data;
}

// ----------------------------------------------------
// Shop Settings, Database Backup & Audit Trail APIs
// ----------------------------------------------------

export async function fetchShopSettings(): Promise<ShopSettingsData> {
  const response = await fetch(`${API_BASE}/settings`);
  if (!response.ok) {
    throw new Error(`Failed to fetch shop settings (Status: ${response.status})`);
  }
  const result = await response.json();
  return result.data;
}

export async function updateShopSettings(data: Partial<ShopSettingsData>): Promise<ShopSettingsData> {
  const response = await fetch(`${API_BASE}/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error?.message || 'Failed to update shop settings');
  }
  return result.data;
}

export async function fetchDatabaseStatus(): Promise<DatabaseStatusInfo> {
  const response = await fetch(`${API_BASE}/settings/status`);
  if (!response.ok) {
    throw new Error(`Failed to fetch database status (Status: ${response.status})`);
  }
  const result = await response.json();
  return result.data;
}

export async function fetchAuditLogs(filters: { search?: string; action?: string; limit?: number } = {}): Promise<AuditLogEntry[]> {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.action) params.set('action', filters.action);
  if (filters.limit) params.set('limit', String(filters.limit));

  const url = `${API_BASE}/settings/audit?${params.toString()}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch audit logs (Status: ${response.status})`);
  }
  const result = await response.json();
  return result.data || [];
}

export async function restoreDatabaseBackup(file: File): Promise<{ success: boolean; message: string }> {
  const arrayBuffer = await file.arrayBuffer();

  const response = await fetch(`${API_BASE}/settings/restore`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
    },
    body: arrayBuffer,
  });

  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.error?.message || 'Failed to restore database from file');
  }
  return result.data;
}
