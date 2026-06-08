import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import type { ContentType } from '@/lib/mock-data';

type SignIllustrationProps = {
  word: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: ContentType;
};

const sizeMap = {
  sm: { box: 72, font: 28, sub: 10 },
  md: { box: 120, font: 48, sub: 12 },
  lg: { box: 180, font: 72, sub: 14 },
};

export function SignIllustration({
  word,
  size = 'md',
  variant = 'letter',
}: SignIllustrationProps) {
  const dims = sizeMap[size];
  const display = variant === 'letter' ? word : word.split('').join(' · ');

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.box,
          {
            width: dims.box,
            height: dims.box,
          },
        ]}
      >
        <Text style={[styles.hand, { fontSize: dims.font * 0.45 }]}>🤟</Text>
        <Text
          style={[
            styles.word,
            { fontSize: dims.font * 0.5 },
          ]}
        >
          {display}
        </Text>
      </View>
      <Text style={[styles.caption, { fontSize: dims.sub }]}>
        {variant === 'letter' ? 'Fingerspell' : 'Name spelling'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 8,
  },
  box: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 4,
    justifyContent: 'center',
    padding: 8,
    shadowColor: colors.border,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  hand: {
    marginBottom: 4,
  },
  word: {
    color: colors.primary,
    fontFamily: 'Fredoka_700Bold',
    letterSpacing: 2,
    textAlign: 'center',
  },
  caption: {
    color: colors.muted,
    fontFamily: 'Nunito_700Bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
