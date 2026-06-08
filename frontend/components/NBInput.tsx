import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { colors } from '@/constants/colors';

type NBInputProps = TextInputProps;

export function NBInput(props: NBInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.muted}
      {...props}
      style={[styles.input, props.style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 4,
    color: colors.text,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    padding: 16,
  },
});
