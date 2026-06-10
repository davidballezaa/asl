import { apiRequest } from '@/lib/api/client';

// TODO(stripe): These endpoints are wired to the backend's DEMO billing flow.
// `startCheckout` currently activates Pro immediately server-side. When real
// Stripe is added, this should instead receive a Checkout Session URL, open it,
// and let the Stripe webhook flip the subscription to `pro`. The response shape
// and `useSubscription` callers should not need to change.

export type CheckoutResponse = {
  plan: 'free' | 'pro';
  status: string;
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

export async function startCheckout(): Promise<CheckoutResponse> {
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
