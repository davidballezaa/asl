import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import { useLang } from '@/context/LangContext';
import type { UserProfile } from '@/lib/profile-data';

type ProfileHeaderProps = {
  profile: UserProfile;
  isPro?: boolean;
  onPlanBadgePress?: () => void;
};

export function ProfileHeader({
  profile,
  isPro = false,
  onPlanBadgePress,
}: ProfileHeaderProps) {
  const { i18n } = useLang();

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.initials}>{profile.initials}</Text>
      </View>
      <Text style={styles.name}>{profile.name}</Text>
      <Text style={styles.username}>@{profile.username}</Text>

      {isPro ? (
        <View style={[styles.planBadge, styles.proBadge]}>
          <Text style={styles.proBadgeText}>✨ {i18n.subscription.proBadge}</Text>
        </View>
      ) : (
        <Pressable
          onPress={onPlanBadgePress}
          style={({ pressed }) => [
            styles.planBadge,
            styles.freeBadge,
            pressed && styles.planBadgePressed,
          ]}
        >
          <Text style={styles.freeBadgeText}>{i18n.subscription.freeBadge}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 4,
    paddingBottom: 4,
    paddingTop: 8,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderColor: colors.border,
    borderRadius: 48,
    borderWidth: 4,
    height: 96,
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: colors.border,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
    width: 96,
  },
  initials: {
    color: colors.primary,
    fontFamily: 'Fredoka_700Bold',
    fontSize: 32,
  },
  name: {
    color: colors.text,
    fontFamily: 'Fredoka_700Bold',
    fontSize: 24,
  },
  username: {
    color: colors.muted,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
  },
  planBadge: {
    borderRadius: 20,
    borderWidth: 3,
    marginBottom: 8,
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  planBadgePressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  freeBadge: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.border,
  },
  freeBadgeText: {
    color: colors.primary,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 12,
  },
  proBadge: {
    backgroundColor: colors.secondary,
    borderColor: colors.border,
  },
  proBadgeText: {
    color: colors.text,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 12,
  },
});
