import { StyleSheet, Text, View } from 'react-native';

import { NBCard } from '@/components/NBCard';
import { NBProgressBar } from '@/components/NBProgressBar';
import { colors } from '@/constants/colors';
import { useLang } from '@/context/LangContext';
import type { ChallengeProgress } from '@/lib/challenges';

type ChallengeCardProps = {
  challenge: ChallengeProgress;
  onPress?: () => void;
};

export function ChallengeCard({ challenge, onPress }: ChallengeCardProps) {
  const { i18n } = useLang();

  const percent =
    challenge.target > 0 ? (challenge.progress / challenge.target) * 100 : 0;

  const statusLabel = challenge.claimed
    ? i18n.profile.claimed
    : challenge.completed
      ? i18n.profile.readyToClaim
      : null;

  const statusStyle = challenge.claimed
    ? styles.claimedBadge
    : challenge.completed
      ? styles.readyBadge
      : null;

  return (
    <NBCard style={styles.card} onPress={onPress}>
      <View style={styles.topRow}>
        <View style={styles.titleRow}>
          <Text style={styles.icon}>{challenge.icon}</Text>
          <Text style={styles.name}>{challenge.title}</Text>
        </View>
        <Text style={styles.xp}>+{challenge.xpReward} XP</Text>
      </View>

      <NBProgressBar
        progress={percent}
        height={12}
        fillColor={
          challenge.claimed
            ? colors.success
            : challenge.completed
              ? colors.secondary
              : colors.primary
        }
      />

      <View style={styles.bottomRow}>
        <Text style={styles.description}>{challenge.description}</Text>
        <Text style={styles.fraction}>
          {challenge.progress}/{challenge.target}
        </Text>
      </View>

      {statusLabel && statusStyle && (
        <Text style={[styles.statusBadge, statusStyle]}>{statusLabel}</Text>
      )}
    </NBCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    padding: 20,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: 8,
  },
  icon: {
    fontSize: 20,
  },
  name: {
    color: colors.text,
    flex: 1,
    fontFamily: 'Fredoka_700Bold',
    fontSize: 18,
  },
  xp: {
    color: colors.primary,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 15,
  },
  bottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  description: {
    color: colors.muted,
    flex: 1,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
  },
  fraction: {
    color: colors.muted,
    fontFamily: 'Nunito_700Bold',
    fontSize: 13,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    borderWidth: 2,
    fontFamily: 'Nunito_700Bold',
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  claimedBadge: {
    backgroundColor: colors.successLight,
    borderColor: colors.success,
    color: colors.success,
  },
  readyBadge: {
    backgroundColor: colors.secondaryLight,
    borderColor: colors.secondary,
    color: colors.text,
  },
});
