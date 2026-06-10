import { Image, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/colors';
import type { ContentType } from '@/lib/mock-data';
import { ASL_LETTER_IMAGES, getSignImageSource,getSignLetters } from '@/lib/alphabet';

type SignIllustrationProps = {
  word: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: ContentType;
};

const sizeMap = {
  sm: { box: 72, font: 28, sub: 10 , image: 54},
  md: { box: 120, font: 48, sub: 12 , image: 88},
  lg: { box: 180, font: 72, sub: 14 , image: 130},
};

export function SignIllustration({
  word,
  size = 'md',
  variant = 'letter',
}: SignIllustrationProps) {
  const dims = sizeMap[size];
  const letters = variant === 'letter' ? getSignLetters(word,1) : getSignLetters(word, size=== 'lg'? 6 : 4);
  const display = variant === 'letter' ? word : letters.join(' · ');

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
        <View style={styles.signRow}>
          {letters.map((letter, index) => {
            const source = ASL_LETTER_IMAGES[letter];

            if (!source) {
              return (
                <Text
                  key={`${letter}-${index}`}
                  style={[
                    styles.fallbackLetter,
                    { fontSize: dims.font * 0.5 },
                  ]}
                >
                  {letter}
                </Text>
              );
            }

            return (
              <Image
                key={`${letter}-${index}`}
                source={source}
                resizeMode="contain"
                style={[
                  styles.signImage,
                  {
                    height:
                      variant === 'letter'
                        ? dims.image
                        : Math.max(34, dims.image * 0.55),
                    width:
                      variant === 'letter'
                        ? dims.image
                        : Math.max(34, dims.image * 0.55),
                  },
                ]}
              />
            );
          })}
        </View>

        <Text
          style={[
            styles.word,
            {
              fontSize: dims.font * 0.34,
            },
          ]}
          numberOfLines={1}
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
  signRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'center',
  },
  signImage: {
    marginBottom: 4,
  },
  fallbackLetter: {
    color: colors.primary,
    fontFamily: 'Fredoka_700Bold',
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