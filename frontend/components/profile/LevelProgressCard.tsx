import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { NBCard } from '@/components/NBCard';
import { NBProgressBar } from '@/components/NBProgressBar';
import { LevelRoadmap } from '@/components/profile/LevelRoadmap';
import { colors } from '@/constants/colors';
import { useLang } from '@/context/LangContext';
import { t } from '@/lib/i18n';
import type { LevelProgress } from '@/lib/progression';

type LevelProgressCardProps = {
  level: LevelProgress;
};

export function LevelProgressCard({ level }: LevelProgressCardProps) {
  const { i18n } = useLang();
  const [expanded, setExpanded] = useState(false);

  return (
    <NBCard style={styles.card}>
      <Pressable
        onPress={() => setExpanded((e) => !e)}
        style={styles.header}
      >
        <View style={styles.levelRow}>
          <Text style={styles.medal}>{level.current.medal}</Text>
          <View>
            <Text style={styles.levelTitle}>
              {t(i18n, 'profile.level', { level: level.current.level })} · {level.current.title}
            </Text>
            <Text style={styles.medalLabel}>
              {level.current.medalLabel}
            </Text>
          </View>
        </View>
        <Text style={styles.chevron}>
          {expanded ? '▲' : '▼'}
        </Text>
      </Pressable>

      <View style={styles.progressSection}>
        <View style={styles.xpRow}>
          <Text style={styles.xpText}>
            {t(i18n, 'profile.xpTotal', { xp: level.totalXp })}
          </Text>
          {level.next && (
            <Text style={styles.xpNext}>
              {t(i18n, 'profile.xpToNext', {
                xp: level.xpForNextLevel - level.xpIntoLevel,
                level: level.next.level,
              })}
            </Text>
          )}
        </View>
        <NBProgressBar
          progress={level.progressPercent}
          height={16}
          fillColor={colors.primary}
        />
      </View>

      {expanded && (
        <LevelRoadmap currentLevel={level.current.level} totalXp={level.totalXp} />
      )}
    </NBCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  levelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  medal: {
    fontSize: 36,
  },
  levelTitle: {
    color: colors.text,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 16,
  },
  medalLabel: {
    color: colors.muted,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 12,
  },
  chevron: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  progressSection: {
    gap: 8,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  xpText: {
    color: colors.text,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 14,
  },
  xpNext: {
    color: colors.muted,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 12,
  },
});
