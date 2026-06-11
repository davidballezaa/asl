import { apiRequest } from '@/lib/api/client';

export type CheckoutResponse = {
  url: string;
};

export type CancelResponse = {
  plan: 'free' | 'pro';
};

export type BillingPlan = {
  id: 'free' | 'pro';
  name: string;
  priceCents: number;
  currency: string;
  interval: string | null;
};

export async function fetchPlans(): Promise<BillingPlan[]> {
  const data = await apiRequest<{ plans: BillingPlan[] }>('/billing/plans');
  return data.plans;
}

export async function startBillingCheckout(): Promise<CheckoutResponse> {
  return apiRequest<CheckoutResponse>('/billing/checkout', {
    method: 'POST',
    body: {},
  });
}

export async function cancelSubscription(): Promise<CancelResponse> {
  return apiRequest<CancelResponse>('/billing/cancel', {
    method: 'POST',
    body: {},
  });
}