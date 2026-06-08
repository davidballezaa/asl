import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { MAX_WIDTH } from '@/constants/layout';

type ScreenContainerProps = {
  children: React.ReactNode;
  size?: keyof typeof MAX_WIDTH;
  style?: StyleProp<ViewStyle>;
};

export function ScreenContainer({
  children,
  size = 'wide',
  style,
}: ScreenContainerProps) {
  const flatStyle = StyleSheet.flatten(style);
  const fillsHeight = flatStyle?.flex === 1;

  return (
    <View style={[styles.outer, style]}>
      <View
        style={[
          styles.inner,
          { maxWidth: MAX_WIDTH[size] },
          fillsHeight && styles.innerFill,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    alignItems: 'center',
    width: '100%',
  },
  inner: {
    width: '100%',
  },
  innerFill: {
    flex: 1,
  },
});
