import { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors } from '@/constants/colors';

type NBButtonVariant = 'primary' | 'secondary' | 'ghost' | 'success';

type NBButtonProps = {
  title: string;
  variant?: NBButtonVariant;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

const variantConfig = {
  primary: {
    bg: colors.primary,
    text: '#FFFFFF',
    border: colors.border,
  },
  secondary: {
    bg: colors.secondary,
    text: colors.text,
    border: colors.border,
  },
  ghost: {
    bg: colors.surface,
    text: colors.text,
    border: colors.border,
  },
  success: {
    bg: colors.success,
    text: '#FFFFFF',
    border: colors.border,
  },
};

export function NBButton({
  title,
  variant = 'primary',
  onPress,
  loading = false,
  disabled,
  style,
}: NBButtonProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const config = variantConfig[variant];

  const pressIn = () => {
    Animated.parallel([
      Animated.timing(translateX, { toValue: 2, duration: 60, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 2, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const pressOut = () => {
    Animated.parallel([
      Animated.timing(translateX, { toValue: 0, duration: 60, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      disabled={disabled || loading}
    >
      <Animated.View
        style={[
          styles.base,
          {
            backgroundColor: config.bg,
            borderColor: config.border,
            opacity: disabled ? 0.6 : 1,
            transform: [{ translateX }, { translateY }],
          },
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={config.text} />
        ) : (
          <Text style={[styles.label, { color: config.text }]}>{title}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 4,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: 24,
    shadowColor: colors.border,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
  },
  label: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 18,
  },
});