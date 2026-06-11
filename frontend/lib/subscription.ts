import { useCallback, useState } from 'react';

import { useAppData } from '@/context/AppDataContext';
import { cancelSubscription, startCheckout } from '@/lib/api/billing';

export type Plan = 'free' | 'pro';

/**
 * Subscription state is owned by the backend and delivered via `/me`
 * (`me.subscription.plan`). This hook derives the plan from that single source
 * of truth and exposes upgrade/cancel actions that persist server-side and then
 * refresh `me`, so the whole app reacts to the new plan.
 */
export function useSubscription() {
  const { me, refreshMe } = useAppData();
  const plan: Plan = me?.subscription.plan ?? 'free';
  const isPro = plan === 'pro';
  const [isUpdating, setIsUpdating] = useState(false);

  const upgrade = useCallback(async () => {
    setIsUpdating(true);
    try {
      await startCheckout();
      await refreshMe();
    } finally {
      setIsUpdating(false);
    }
  }, [refreshMe]);

  const cancel = useCallback(async () => {
    setIsUpdating(true);
    try {
      await cancelSubscription();
      await refreshMe();
    } finally {
      setIsUpdating(false);
    }
  }, [refreshMe]);

  return { plan, isPro, isUpdating, upgrade, cancel };
}
