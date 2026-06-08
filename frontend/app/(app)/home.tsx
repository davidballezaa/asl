import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { LearnPath } from '@/components/LearnPath';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ChallengesSection } from '@/components/profile/ChallengesSection';
import { colors } from '@/constants/colors';
import { useGamification } from '@/context/AppDataContext';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LangContext';
import { t } from '@/lib/i18n';

export default function HomeScreen() {
  const { userName } = useAuth();
  const { i18n } = useLang();
  const insets = useSafeAreaInsets();
  const state = useGamification();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: 72 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ScreenContainer size="narrow" style={styles.topSection}>
          <View style={styles.headerBlock}>
            <Text style={styles.greeting}>
              {t(i18n, 'home.greeting', { name: userName ?? 'Friend' })}
            </Text>
            {(state?.streak ?? 0) > 0 && (
              <Text style={styles.subtitle}>
                {state?.streak} {i18n.home.days} 🔥
              </Text>
            )}
          </View>

          <ChallengesSection challenges={state?.challenges ?? []} />
        </ScreenContainer>

        <LearnPath />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scroll: {
    gap: 24,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  topSection: {
    gap: 20,
  },
  headerBlock: {
    gap: 4,
  },
  greeting: {
    color: colors.text,
    fontFamily: 'Fredoka_700Bold',
    fontSize: 32,
    lineHeight: 40,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
  },
});
