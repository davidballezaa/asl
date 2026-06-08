import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { useLang } from '@/context/LangContext';
import { isLevelUnlocked, levelTiers } from '@/lib/progression';

type LevelRoadmapProps = {
  currentLevel: number;
  totalXp: number;
};

export function LevelRoadmap({ currentLevel, totalXp }: LevelRoadmapProps) {
  const { i18n } = useLang();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{i18n.profile.levelPath}</Text>
      {levelTiers.map((tier) => {
        const unlocked = isLevelUnlocked(tier.level, totalXp);
        const isCurrent = tier.level === currentLevel;

        return (
          <View
            key={tier.level}
            style={[
              styles.row,
              {
                backgroundColor: isCurrent ? colors.primaryLight : colors.surface,
                borderColor: isCurrent ? colors.primary : colors.border,
                borderWidth: isCurrent ? 3 : 2,
              },
            ]}
          >
            <Text style={[styles.medal, { opacity: unlocked ? 1 : 0.35 }]}>
              {tier.medal}
            </Text>
            <View style={styles.info}>
              <Text
                style={[
                  styles.levelName,
                  { color: unlocked ? colors.text : colors.muted },
                ]}
              >
                Lv {tier.level} · {tier.title}
              </Text>
              <Text style={styles.xp}>{tier.minXp} XP</Text>
            </View>
            {unlocked && (
              <Text style={styles.check}>✓</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopColor: colors.muted,
    borderTopWidth: 1,
    gap: 6,
    marginTop: 8,
    paddingTop: 12,
  },
  title: {
    color: colors.muted,
    fontFamily: 'Nunito_700Bold',
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  row: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  medal: {
    fontSize: 22,
    textAlign: 'center',
    width: 28,
  },
  info: {
    flex: 1,
  },
  levelName: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
  },
  xp: {
    color: colors.muted,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 11,
  },
  check: {
    color: colors.success,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 16,
  },
});
