import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { NBButton } from '@/components/NBButton';
import { NBCard } from '@/components/NBCard';
import { colors } from '@/constants/colors';
import { useLang } from '@/context/LangContext';
import { isProUser, upgradeToPro } from '@/lib/subscription';

type ProUpgradeCardProps = {
  compact?: boolean;
  hideBadge?: boolean;
  onUpgraded?: () => void;
};

export function ProUpgradeCard({
  compact,
  hideBadge,
  onUpgraded,
}: ProUpgradeCardProps) {
  const { i18n } = useLang();
  const [isPro, setIsPro] = useState(isProUser());

  if (isPro) {
    return (
      <NBCard style={[styles.card, compact && styles.cardCompact]}>
        <View style={styles.proBadge}>
          <Text style={styles.proBadgeText}> {i18n.subscription.proBadge}</Text>
        </View>
        <Text style={styles.proTitle}>{i18n.subscription.proActive}</Text>
        <Text style={styles.proDesc}>{i18n.subscription.proActiveDesc}</Text>
      </NBCard>
    );
  }

  return (
    <NBCard style={[styles.card, compact && styles.cardCompact]}>
      {!hideBadge && (
        <View style={styles.freeBadge}>
          <Text style={styles.freeBadgeText}>{i18n.subscription.freeBadge}</Text>
        </View>
      )}
      {!hideBadge && (
        <Text style={styles.title}>{i18n.subscription.upgradeTitle}</Text>
      )}
      <Text style={styles.desc}>{i18n.subscription.upgradeDesc}</Text>
      {!compact && (
        <View style={styles.perks}>
          {i18n.subscription.perks.map((perk) => (
            <Text key={perk} style={styles.perk}>
              ✓ {perk}
            </Text>
          ))}
        </View>
      )}
      <NBButton
        title={i18n.subscription.upgradeCta}
        variant="secondary"
        onPress={() => {
          upgradeToPro();
          setIsPro(true);
          onUpgraded?.();
        }}
      />
    </NBCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
  },
  cardCompact: {
    gap: 8,
  },
  freeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 3,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  freeBadgeText: {
    color: colors.primary,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 12,
  },
  proBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 3,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  proBadgeText: {
    color: colors.text,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 12,
  },
  title: {
    color: colors.text,
    fontFamily: 'Fredoka_700Bold',
    fontSize: 20,
  },
  proTitle: {
    color: colors.text,
    fontFamily: 'Fredoka_700Bold',
    fontSize: 18,
  },
  desc: {
    color: colors.muted,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    lineHeight: 20,
  },
  proDesc: {
    color: colors.muted,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
  },
  perks: {
    gap: 4,
  },
  perk: {
    color: colors.text,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
  },
});