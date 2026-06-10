import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/constants/colors';

type NBProgressBarProps = {
  progress: number;
  height?: number;
  fillColor?: string;
  style?: StyleProp<ViewStyle>;
};

export function NBProgressBar({
  progress,
  height = 16,
  fillColor = colors.secondary,
  style,
}: NBProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, progress));

  return (
    <View
      style={[
        styles.track,
        { height, borderRadius: height / 2 },
        style,
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            backgroundColor: fillColor,
            width: `${clamped}%`,
            borderRadius: Math.max(0, height / 2 - 2),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 4,
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: '100%',
  },
});