import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { NBButton } from '@/components/NBButton';
import { NBCard } from '@/components/NBCard';
import { SignIllustration } from '@/components/SignIllustration';
import { colors } from '@/constants/colors';
import { useLang } from '@/context/LangContext';
import { isProUser, upgradeToPro } from '@/lib/subscription';
import type { Exercise } from '@/lib/mock-data';

type SignDemoProps = {
  exercise: Exercise;
  youtubeId?: string;
  onContinue: () => void;
};

function YoutubeEmbed({ videoId }: { videoId: string }) {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.embedWrap}>
        <iframe
          title="ASL sign video"
          src={`https://www.youtube-nocookie.com/embed/${videoId}`}
          style={{
            border: 'none',
            borderRadius: 8,
            height: '100%',
            width: '100%',
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </View>
    );
  }

  return (
    <View style={styles.nativeVideo}>
      <Text style={styles.nativeVideoEmoji}>▶️</Text>
      <Text style={styles.nativeVideoText}>Pro video lesson</Text>
    </View>
  );
}

export function SignDemo({ exercise, youtubeId, onContinue }: SignDemoProps) {
  const { i18n } = useLang();
  const [isPro, setIsPro] = useState(isProUser());

  const displayLetter =
    exercise.contentType === 'letter'
      ? exercise.signWord
      : exercise.signWord.charAt(0).toUpperCase();

  const handleUpgrade = () => {
    upgradeToPro();
    setIsPro(true);
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.stepHeader}>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>1</Text>
        </View>
        <Text style={styles.stepTitle}>{i18n.lesson.watchAndLearn}</Text>
      </View>

      <NBCard style={styles.lessonCard}>
        <View style={styles.illustrationHero}>
          <SignIllustration
            word={exercise.signWord}
            size="lg"
            variant={exercise.contentType ?? 'letter'}
          />
        </View>

        <View style={styles.letterRow}>
          <Text style={styles.letter}>{displayLetter}</Text>
          <Text style={styles.description}>{exercise.signDescription}</Text>
        </View>
      </NBCard>

      {isPro && youtubeId && (
        <View style={styles.videoSection}>
          <YoutubeEmbed videoId={youtubeId} />
        </View>
      )}

      {!isPro && (
        <Pressable onPress={handleUpgrade} style={styles.videoHint}>
          <Text style={styles.videoHintText}>
            {i18n.subscription.wantVideo}{' '}
            <Text style={styles.videoHintLink}>{i18n.subscription.upgradeLink}</Text>
          </Text>
        </Pressable>
      )}

      <NBButton
        title={i18n.lesson.gotIt}
        variant="primary"
        onPress={onContinue}
        style={styles.button}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    width: '100%',
  },
  container: {
    gap: 16,
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  stepHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  stepBadge: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 3,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  stepBadgeText: {
    color: '#FFFFFF',
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 16,
  },
  stepTitle: {
    color: colors.text,
    fontFamily: 'Fredoka_700Bold',
    fontSize: 22,
  },
  lessonCard: {
    gap: 0,
    overflow: 'hidden',
    padding: 0,
  },
  illustrationHero: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderBottomColor: colors.border,
    borderBottomWidth: 3,
    paddingVertical: 28,
  },
  letterRow: {
    backgroundColor: colors.surface,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  letter: {
    color: colors.primary,
    fontFamily: 'Fredoka_700Bold',
    fontSize: 40,
    lineHeight: 44,
  },
  description: {
    color: colors.text,
    flex: 1,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    lineHeight: 22,
  },
  videoSection: {
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 3,
    overflow: 'hidden',
  },
  embedWrap: {
    aspectRatio: 16 / 9,
    width: '100%',
  },
  nativeVideo: {
    alignItems: 'center',
    aspectRatio: 16 / 9,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
  },
  nativeVideoEmoji: {
    fontSize: 32,
  },
  nativeVideoText: {
    color: '#FFFFFF',
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
    marginTop: 8,
  },
  videoHint: {
    alignSelf: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  videoHintText: {
    color: colors.muted,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 13,
    textAlign: 'center',
  },
  videoHintLink: {
    color: colors.primary,
    fontFamily: 'Nunito_800ExtraBold',
    textDecorationLine: 'underline',
  },
  button: {
    marginTop: 4,
  },
});
