import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NBButton } from '@/components/NBButton';
import { ProUpgradeModal } from '@/components/ProUpgradeModal';
import { ScreenContainer } from '@/components/ScreenContainer';
import { LevelProgressCard } from '@/components/profile/LevelProgressCard';
import { PracticeHeatmap } from '@/components/profile/PracticeHeatmap';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LangContext';
import { useAppData, useGamification } from '@/context/AppDataContext';
import { isProUser } from '@/lib/subscription';

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { i18n } = useLang();
  const router = useRouter();
  const { me } = useAppData();
  const state = useGamification();
  const [isPro, setIsPro] = useState(isProUser());
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <ScreenContainer size="narrow" style={styles.content}>
          <ProfileHeader
            profile={me?.profile ?? { name: '', username: '', initials: '?', practiceDays: [] }}
            isPro={isPro}
            onPlanBadgePress={() => setUpgradeOpen(true)}
          />

          {state && <LevelProgressCard level={state.level} />}

          <PracticeHeatmap practiceDays={me?.profile.practiceDays ?? []} />

          <NBButton
            title={i18n.profile.signOut}
            variant="ghost"
            style={styles.signOut}
            onPress={() => void handleSignOut()}
          />
        </ScreenContainer>
      </ScrollView>

      <ProUpgradeModal
        visible={upgradeOpen && !isPro}
        onClose={() => setUpgradeOpen(false)}
        onUpgraded={() => setIsPro(true)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scroll: {
    paddingBottom: 32,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  content: {
    gap: 24,
  },
  signOut: {
    marginTop: 16,
  },
});
