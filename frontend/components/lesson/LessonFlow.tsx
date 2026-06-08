import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NBButton } from '@/components/NBButton';
import { NBCard } from '@/components/NBCard';
import { ScreenContainer } from '@/components/ScreenContainer';
import { CameraPractice } from '@/components/lesson/CameraPractice';
import { LessonHeader } from '@/components/lesson/LessonHeader';
import { MultipleChoiceQuiz } from '@/components/lesson/MultipleChoiceQuiz';
import { SignDemo } from '@/components/lesson/SignDemo';
import { colors } from '@/constants/colors';
import { useAppData } from '@/context/AppDataContext';
import { useLang } from '@/context/LangContext';
import { completeLesson } from '@/lib/api/lessons';
import { t } from '@/lib/i18n';
import type { Lesson } from '@/lib/mock-data';

type LessonFlowProps = {
  lesson: Lesson;
  lessonId: string;
};

export function LessonFlow({ lesson, lessonId }: LessonFlowProps) {
  const router = useRouter();
  const { i18n } = useLang();
  const { refreshMe } = useAppData();
  const [step, setStep] = useState(0);
  const [finished, setFinished] = useState(false);
  const [xpEarned, setXpEarned] = useState(lesson.xpReward);

  const trophyScale = useRef(new Animated.Value(0.5)).current;

  const exercise = lesson.exercises[step];
  const total = lesson.exercises.length;

  const goNext = useCallback(() => {
    if (step + 1 >= total) {
      void completeLesson(lessonId)
        .then((result) => {
          setXpEarned(result.xpEarned || lesson.xpReward);
          return refreshMe();
        })
        .finally(() => {
          setFinished(true);
          Animated.spring(trophyScale, {
            toValue: 1,
            friction: 4,
            tension: 50,
            useNativeDriver: true,
          }).start();
        });
    } else {
      setStep((s) => s + 1);
    }
  }, [step, total, trophyScale, lessonId, lesson.xpReward, refreshMe]);

  if (finished) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScreenContainer size="wide" style={styles.complete}>
          <Animated.View style={{ transform: [{ scale: trophyScale }] }}>
            <NBCard style={styles.trophyCard}>
              <View style={styles.trophyIcon}>
                <Text style={styles.trophyEmoji}>🏆</Text>
              </View>
              <Text style={styles.completeTitle}>
                {i18n.lesson.completeTitle}
              </Text>
              <Text style={styles.completeXp}>
                {t(i18n, 'lesson.completeXp', { xp: xpEarned })}
              </Text>
            </NBCard>
          </Animated.View>
          <NBButton
            title={i18n.lesson.backToPath}
            variant="primary"
            onPress={() => router.replace('/(app)/home')}
          />
        </ScreenContainer>
      </SafeAreaView>
    );
  }

  if (!exercise) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <LessonHeader
        progress={step}
        total={total}
        onClose={() => router.back()}
      />
      <ScreenContainer size="wide" style={[styles.body, { flex: 1 }]}>
        {exercise.type === 'demo' && (
          <SignDemo
            exercise={exercise}
            youtubeId={lesson.youtubeId}
            onContinue={goNext}
          />
        )}
        {exercise.type === 'camera' && (
          <CameraPractice
            exercise={exercise}
            lessonId={lessonId}
            onSuccess={goNext}
          />
        )}
        {exercise.type === 'quiz' && (
          <MultipleChoiceQuiz
            exercise={exercise}
            lessonId={lessonId}
            onCorrect={goNext}
          />
        )}
      </ScreenContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  body: {
    flex: 1,
  },
  complete: {
    flex: 1,
    gap: 24,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  trophyCard: {
    alignItems: 'center',
    gap: 12,
  },
  trophyIcon: {
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 4,
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  trophyEmoji: {
    fontSize: 36,
  },
  completeTitle: {
    color: colors.text,
    fontFamily: 'Fredoka_700Bold',
    fontSize: 28,
    textAlign: 'center',
  },
  completeXp: {
    color: colors.primary,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 18,
  },
});
