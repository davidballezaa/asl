import { apiRequest } from '@/lib/api/client';
import type { MeResponse } from '@/lib/api/types';

export async function fetchMe(): Promise<MeResponse> {
  return apiRequest<MeResponse>('/me');
}