export type Plan = 'free' | 'pro';

let currentPlan: Plan = 'free';

export function getPlan(): Plan {
  return currentPlan;
}

export function isProUser(): boolean {
  return currentPlan === 'pro';
}

export function upgradeToPro(): void {
  currentPlan = 'pro';
}
