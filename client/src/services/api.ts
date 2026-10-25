import type { DashboardSummary } from '../types';

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
