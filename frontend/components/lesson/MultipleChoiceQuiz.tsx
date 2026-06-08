import { useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { NBButton } from '@/components/NBButton';
import { SignIllustration } from '@/components/SignIllustration';
import { colors } from '@/constants/colors';
import { useLang } from '@/context/LangContext';
import { attemptExercise } from '@/lib/api/lessons';
import { playCorrectFeedback, playWrongFeedback } from '@/lib/feedback';
import type { Exercise } from '@/lib/mock-data';

type MultipleChoiceQuizProps = {
  exercise: Exercise;
  lessonId: string;
  onCorrect: () => void;
};

export function MultipleChoiceQuiz({
  exercise,
  lessonId,
  onCorrect,
}: MultipleChoiceQuizProps) {
  const { i18n } = useLang();
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState(
    exercise.correctAnswer ?? exercise.signWord,
  );
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const popAnim = useRef(new Animated.Value(1)).current;

  const options = exercise.options ?? [];
  const correct = correctAnswer;

  const handleSelect = async (option: string) => {
    if (revealed) return;
    setSelected(option);
    setRevealed(true);

    const result = await attemptExercise(lessonId, exercise.id, option);
    if (result.correctAnswer) {
      setCorrectAnswer(result.correctAnswer);
    }

    if (result.correct) {
      popAnim.setValue(0.8);
      Animated.spring(popAnim, {
        toValue: 1,
        friction: 3,
        tension: 80,
        useNativeDriver: true,
      }).start();
      await playCorrectFeedback();
    } else if (!result.correct) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
      await playWrongFeedback();
    }
  };

  const isCorrect = selected === correct;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.prompt}>{i18n.lesson.quizPrompt}</Text>
      <SignIllustration
        word={exercise.signWord}
        size="md"
        variant={exercise.contentType ?? 'letter'}
      />
      <View style={styles.options}>
        {options.map((option) => {
          let bg: string = colors.surface;
          let border: string = colors.border;
          let textColor: string = colors.text;

          if (revealed) {
            if (option === correct && selected === correct) {
              bg = colors.successLight;
              border = colors.success;
              textColor = colors.success;
            } else if (option === selected && option !== correct) {
              bg = colors.errorLight;
              border = colors.error;
              textColor = colors.error;
            }
          } else if (option === selected) {
            border = colors.primary;
          }

          const isWrongSelected = revealed && option === selected && option !== correct;
          const isCorrectOption =
            revealed && option === correct && selected === correct;

          return (
            <Animated.View
              key={option}
              style={[
                styles.optionWrap,
                {
                  transform: [
                    { translateX: isWrongSelected ? shakeAnim : 0 },
                    { scale: isCorrectOption ? popAnim : 1 },
                  ],
                },
              ]}
            >
              <Pressable
                disabled={revealed}
                onPress={() => void handleSelect(option)}
                style={[
                  styles.option,
                  {
                    backgroundColor: bg,
                    borderColor: border,
                  },
                ]}
              >
                <Text style={[styles.optionText, { color: textColor }]}>
                  {option}
                </Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
      {revealed && (
        <NBButton
          title={isCorrect ? i18n.lesson.continue : i18n.lesson.tryAgain}
          variant={isCorrect ? 'success' : 'secondary'}
          onPress={() => {
            if (isCorrect) {
              onCorrect();
            } else {
              setSelected(null);
              setRevealed(false);
            }
          }}
          style={styles.button}
        />
      )}
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
  prompt: {
    color: colors.muted,
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  options: {
    gap: 10,
    width: '100%',
  },
  optionWrap: {
    width: '100%',
  },
  option: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 4,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: colors.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    width: '100%',
  },
  optionText: {
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 20,
    lineHeight: 26,
    textAlign: 'center',
  },
  button: {
    marginTop: 8,
  },
});
