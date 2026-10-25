import type {
  DashboardSummary,
  ProductItem,
  Customer,
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
