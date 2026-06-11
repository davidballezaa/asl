import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmDialog } from '@/components/ConfirmDialog';
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
import { completeLesson, skipCameraExercise } from '@/lib/api/lessons';
import { t } from '@/lib/i18n';
import type { Exercise, Lesson } from '@/lib/mock-data';

type LessonFlowProps = {
  lesson: Lesson;
  lessonId: string;
};

function shuffle<T>(items: T[]) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

function buildRandomLessonRun(exercises: Exercise[]) {
  return shuffle(exercises);
}

export function LessonFlow({ lesson, lessonId }: LessonFlowProps) {
  const router = useRouter();
  const { i18n } = useLang();
  const { refreshMe } = useAppData();

  const exerciseSignature = useMemo(() => {
    return lesson.exercises.map((exercise) => exercise.id).join('|');
  }, [lesson.exercises]);

  const [runExercises, setRunExercises] = useState<Exercise[]>(() =>
    buildRandomLessonRun(lesson.exercises),
  );
  const [step, setStep] = useState(0);
  const [finished, setFinished] = useState(false);
  const [xpEarned, setXpEarned] = useState(lesson.xpReward);
  const [exitDialogVisible, setExitDialogVisible] = useState(false);

  const trophyScale = useRef(new Animated.Value(0.5)).current;
  const finishingRef = useRef(false);

  useEffect(() => {
    finishingRef.current = false;
    trophyScale.setValue(0.5);

    setRunExercises(buildRandomLessonRun(lesson.exercises));
    setStep(0);
    setFinished(false);
    setXpEarned(lesson.xpReward);
  }, [lessonId, exerciseSignature, lesson.exercises, lesson.xpReward, trophyScale]);

  const exercise = runExercises[step];
  const total = runExercises.length;

  const finishLesson = useCallback(() => {
    if (finishingRef.current) return;

    finishingRef.current = true;

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
  }, [lessonId, lesson.xpReward, refreshMe, trophyScale]);

  const goNext = useCallback(() => {
    setStep((currentStep) => {
      if (currentStep + 1 >= runExercises.length) {
        finishLesson();
        return currentStep;
      }

      return currentStep + 1;
    });
  }, [finishLesson, runExercises.length]);

  const leaveLesson = useCallback(() => {
    router.back();
  }, [router]);

  const handleClose = useCallback(() => {
    setExitDialogVisible(true);
  }, []);

  const handleStay = useCallback(() => {
    setExitDialogVisible(false);
  }, []);

  const handleLeave = useCallback(() => {
    setExitDialogVisible(false);
    leaveLesson();
  }, [leaveLesson]);

  const skipCameraPractice = useCallback(() => {
    const currentExercise = runExercises[step];

    if (!currentExercise || currentExercise.type !== 'camera') {
      goNext();
      return;
    }

    void skipCameraExercise(lessonId, currentExercise.id)
      .then(() => refreshMe())
      .finally(goNext);
  }, [goNext, lessonId, refreshMe, runExercises, step]);

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
      <ConfirmDialog
        visible={exitDialogVisible}
        title={i18n.lesson.exitTitle}
        message={i18n.lesson.exitMessage}
        cancelLabel={i18n.lesson.exitStay}
        confirmLabel={i18n.lesson.exitLeave}
        onCancel={handleStay}
        onConfirm={handleLeave}
      />

      <LessonHeader
        progress={step}
        total={total}
        onClose={handleClose}
      />

      <ScreenContainer size="wide" style={[styles.body, { flex: 1 }]}>
        {exercise.type === 'demo' && (
          <SignDemo
            key={exercise.id}
            exercise={exercise}
            youtubeId={lesson.youtubeId}
            onContinue={goNext}
          />
        )}

        {exercise.type === 'camera' && (
          <CameraPractice
            key={exercise.id}
            exercise={exercise}
            lessonId={lessonId}
            maxAttempts={3}
            onSuccess={goNext}
            onSkip={skipCameraPractice}
          />
        )}

        {exercise.type === 'quiz' && (
          <MultipleChoiceQuiz
            key={exercise.id}
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
