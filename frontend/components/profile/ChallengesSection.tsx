import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { ChallengeCard } from '@/components/profile/ChallengeCard';
import { SectionBlock } from '@/components/SectionBlock';
import { colors } from '@/constants/colors';
import { useAppData } from '@/context/AppDataContext';
import { useLang } from '@/context/LangContext';
import { claimChallenge } from '@/lib/api/challenges';
import type { ChallengeProgress } from '@/lib/challenges';

type ChallengesSectionProps = {
  challenges: ChallengeProgress[];
};

function pickFeaturedChallenge(
  challenges: ChallengeProgress[],
): ChallengeProgress | null {
  if (challenges.length === 0) return null;

  const inProgress = challenges.find((c) => !c.completed && !c.claimed);
  if (inProgress) return inProgress;

  const readyToClaim = challenges.find((c) => c.completed && !c.claimed);
  if (readyToClaim) return readyToClaim;

  return challenges.find((c) => !c.claimed) ?? challenges[0];
}

export function ChallengesSection({ challenges }: ChallengesSectionProps) {
  const router = useRouter();
  const { i18n } = useLang();
  const { refreshMe } = useAppData();
  const challenge = pickFeaturedChallenge(challenges);

  const handleClaim = async (challengeId: string) => {
    await claimChallenge(challengeId);
    await refreshMe();
  };

  if (!challenge) return null;

  return (
    <SectionBlock title={i18n.profile.challenges}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={i18n.challenges.viewAll}
        onPress={() => router.push('/challenges')}
        style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}
      >
        <ChallengeCard
          challenge={challenge}
          onPress={
            challenge.completed && !challenge.claimed
              ? () => void handleClaim(challenge.id)
              : undefined
          }
        />
        <Text style={styles.viewAll}>{i18n.challenges.viewAll}</Text>
      </Pressable>
    </SectionBlock>
  );
}

const styles = StyleSheet.create({
  viewAll: {
    color: colors.border,
    fontFamily: 'Nunito_700Bold',
    fontSize: 20,
    marginTop: 8,
    textAlign: 'right',
  },
});
