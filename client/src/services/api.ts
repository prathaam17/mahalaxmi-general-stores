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
