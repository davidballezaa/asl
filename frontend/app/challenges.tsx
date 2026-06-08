import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChallengeCard } from '@/components/profile/ChallengeCard';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import { useLang } from '@/context/LangContext';
import type { Challenge, ChallengeProgress } from '@/lib/challenges';
import { useAppData } from '@/context/AppDataContext';
import { claimChallenge } from '@/lib/api/challenges';

const CATEGORY_ORDER: Challenge['category'][] = [
  'streak',
  'alphabet',
  'practice',
  'mastery',
];

function sortChallenges(items: ChallengeProgress[]): ChallengeProgress[] {
  return [...items].sort((a, b) => {
    const score = (c: ChallengeProgress) => {
      if (c.completed && !c.claimed) return 0;
      if (!c.completed && !c.claimed) return 1;
      return 2;
    };
    return score(a) - score(b);
  });
}

export default function ChallengesScreen() {
  const router = useRouter();
  const { i18n } = useLang();
  const { me, refreshMe } = useAppData();
  const challenges = me?.gamification.challenges ?? [];

  const handleClaim = async (challengeId: string) => {
    await claimChallenge(challengeId);
    await refreshMe();
  };

  const grouped = useMemo(() => {
    const map = new Map<Challenge['category'], ChallengeProgress[]>();
    for (const category of CATEGORY_ORDER) {
      map.set(category, []);
    }
    for (const challenge of challenges) {
      map.get(challenge.category)?.push(challenge);
    }
    return CATEGORY_ORDER.map((category) => ({
      category,
      challenges: sortChallenges(map.get(category) ?? []),
    })).filter((group) => group.challenges.length > 0);
  }, [challenges]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <ScreenContainer size="narrow" style={styles.content}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              { opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Text style={styles.backText}>{i18n.challenges.back}</Text>
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.title}>{i18n.challenges.title}</Text>
            <Text style={styles.subtitle}>{i18n.challenges.subtitle}</Text>
          </View>

          {grouped.map((group) => (
            <View key={group.category} style={styles.section}>
              <Text style={styles.sectionTitle}>
                {i18n.challenges.categories[group.category]}
              </Text>
              <View style={styles.cardList}>
                {group.challenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onPress={
                      challenge.completed && !challenge.claimed
                        ? () => void handleClaim(challenge.id)
                        : undefined
                    }
                  />
                ))}
              </View>
            </View>
          ))}
        </ScreenContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scroll: {
    paddingBottom: 32,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  content: {
    gap: 24,
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 3,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  backText: {
    color: colors.text,
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
  },
  header: {
    gap: 6,
  },
  title: {
    color: colors.text,
    fontFamily: 'Fredoka_700Bold',
    fontSize: 32,
    lineHeight: 40,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: 'Fredoka_700Bold',
    fontSize: 20,
    marginTop: 8,
  },
  cardList: {
    gap: 12,
  },
});
