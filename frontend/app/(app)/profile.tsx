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
import { useSubscription } from '@/lib/subscription';

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { i18n } = useLang();
  const router = useRouter();

  const { me, refreshMe } = useAppData();

  const state = useGamification();
  const { isPro } = useSubscription();
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
            profile={
              me?.profile ?? {
                name: '',
                username: '',
                initials: '?',
                practiceDays: [],
              }
            }
            isPro={isPro}
            onPlanBadgePress={() => setUpgradeOpen(true)}
          />

          {state && <LevelProgressCard level={state.level} />}

          <PracticeHeatmap practiceDays={me?.profile.practiceDays ?? []} />

          {me?.user.role === 'admin' && (
            <NBButton
              title="Admin panel"
              variant="secondary"
              onPress={() => router.push('/admin')}
            />
          )}

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
        onUpgraded={() => {
          void refreshMe();
          setUpgradeOpen(false);
        }}
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