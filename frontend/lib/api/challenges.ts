import { apiRequest } from '@/lib/api/client';
import type { ClaimChallengeResponse } from '@/lib/api/types';

export async function claimChallenge(
  challengeId: string,
): Promise<ClaimChallengeResponse> {
  return apiRequest<ClaimChallengeResponse>(
    `/challenges/${challengeId}/claim`,
    { method: 'POST', body: {} },
  );
}
