import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import { useLang } from '@/context/LangContext';

type LessonHeaderProps = {
  progress: number;
  total: number;
  onClose: () => void;
};

export function LessonHeader({ progress, total, onClose }: LessonHeaderProps) {
  const { i18n } = useLang();

  return (
    <ScreenContainer size="wide" style={styles.container}>
      <Pressable
        accessibilityRole="button"
        onPress={onClose}
        style={({ pressed }) => [
          styles.backButton,
          { opacity: pressed ? 0.8 : 1 },
        ]}
      >
        <Text style={styles.backText}>{i18n.lesson.back}</Text>
      </Pressable>

      <View style={styles.segments}>
        {Array.from({ length: total }, (_, i) => {
          const segColor =
            i < progress
              ? colors.success
              : i === progress
                ? colors.secondary
                : '#D1D5DB';

          return (
            <View
              key={i}
              style={[styles.segment, { backgroundColor: segColor }]}
            />
          );
        })}
      </View>

      <Text style={styles.progressText}>
        {progress}/{total}
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingBottom: 12,
    paddingTop: 8,
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 3,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  backText: {
    color: colors.text,
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
  },
  segments: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 3,
    flexDirection: 'row',
    gap: 3,
    overflow: 'hidden',
    padding: 3,
  },
  segment: {
    borderRadius: 4,
    flex: 1,
    height: 10,
  },
  progressText: {
    color: colors.muted,
    fontFamily: 'Nunito_700Bold',
    fontSize: 13,
    textAlign: 'right',
  },
});
