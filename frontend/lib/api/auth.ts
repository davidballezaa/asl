import { apiRequest, clearToken, setToken } from '@/lib/api/client';
import type { AuthResponse } from '@/lib/api/types';

export async function register(
  name: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  const data = await apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: { name, email, password },
    auth: false,
  });
  await setToken(data.token);
  return data;
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  const data = await apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  });
  await setToken(data.token);
  return data;
}

export async function logout(): Promise<void> {
  try {
    await apiRequest('/auth/logout', { method: 'POST' });
  } finally {
    await clearToken();
  }
}
