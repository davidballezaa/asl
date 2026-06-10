import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';

type StatBadgeProps = {
  icon: string;
  value: number | string;
  accentColor?: string;
};

export function StatBadge({
  icon,
  value,
  accentColor = colors.text,
}: StatBadgeProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.value, { color: accentColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 3,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  icon: {
    fontSize: 18,
  },
  value: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 16,
  },
});