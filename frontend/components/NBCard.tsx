import { useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors } from '@/constants/colors';

type NBCardProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
};

export function NBCard({ children, style, onPress, disabled }: NBCardProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const shadowX = useRef(new Animated.Value(4)).current;
  const shadowY = useRef(new Animated.Value(4)).current;

  if (!onPress) {
    return (
      <Animated.View style={[styles.card, styles.shadow, style]}>
        {children}
      </Animated.View>
    );
  }

  const pressIn = () => {
    Animated.parallel([
      Animated.timing(translateX, { toValue: 2, duration: 80, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 2, duration: 80, useNativeDriver: true }),
    ]).start();
    shadowX.setValue(2);
    shadowY.setValue(2);
  };

  const pressOut = () => {
    Animated.parallel([
      Animated.timing(translateX, { toValue: 0, duration: 80, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();
    shadowX.setValue(4);
    shadowY.setValue(4);
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled}
    >
      <Animated.View
        style={[
          styles.card,
          styles.shadow,
          { transform: [{ translateX }, { translateY }] },
          style,
        ]}
      >
        {children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 4,
    padding: 16,
  },
  shadow: {
    shadowColor: colors.border,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
});
