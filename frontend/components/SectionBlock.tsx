import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/constants/colors';

type SectionBlockProps = {
  title: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function SectionBlock({ title, children, style }: SectionBlockProps) {
  return (
    <View style={[styles.block, style]}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 12,
  },
  title: {
    color: colors.text,
    fontFamily: 'Fredoka_700Bold',
    fontSize: 20,
    marginTop: 8,
  },
});