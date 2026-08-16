import type { ApiClient } from './client';
import type { DashboardSummary } from '../types/dashboard';

export async function getDashboardSummary(api: ApiClient): Promise<DashboardSummary> {
  return api.get<DashboardSummary>('/api/dashboard');
}
