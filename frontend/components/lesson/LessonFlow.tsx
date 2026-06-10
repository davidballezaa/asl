import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import type { Exercise, Lesson } from '@/lib/mock-data';

type LessonFlowProps = {
  lesson: Lesson;
  lessonId: string;
};

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function shuffle<T>(items: T[]) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }

  return copy;
}

function normalizeLetterAnswer(value: string) {
  return value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1);
}

function createLetterOptions(correctAnswer: string) {
  const correct = normalizeLetterAnswer(correctAnswer);
  const wrongOptions = shuffle(ALPHABET.filter((letter) => letter !== correct));

  return shuffle([correct, ...wrongOptions.slice(0, 3)]);
}

function createFallbackQuiz(exercise: Exercise, index: number): Exercise {
  const rawAnswer = String(exercise.correctAnswer ?? exercise.signWord);
  const isLetter = (exercise.contentType ?? 'letter') === 'letter';

  const correctAnswer = isLetter
    ? normalizeLetterAnswer(rawAnswer)
    : rawAnswer.toUpperCase();

  return {
    ...exercise,
    id: `${exercise.id}-fallback-quiz-${index}`,
    type: 'quiz',
    correctAnswer,
    options: exercise.options?.length
      ? exercise.options
      : createLetterOptions(correctAnswer),
    contentType: exercise.contentType ?? 'letter',
  } as Exercise;
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

  const skipCameraPractice = useCallback(() => {
    const currentExercise = runExercises[step];

    if (!currentExercise || currentExercise.type !== 'camera') {
      goNext();
      return;
    }

    const fallbackQuiz = createFallbackQuiz(currentExercise, step);

    setRunExercises((currentRun) => [
      ...currentRun.slice(0, step + 1),
      fallbackQuiz,
      ...currentRun.slice(step + 1),
    ]);

    setStep((currentStep) => currentStep + 1);
  }, [goNext, runExercises, step]);

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