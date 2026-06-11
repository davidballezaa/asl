import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NBButton } from '@/components/NBButton';
import { LessonFlow } from '@/components/lesson/LessonFlow';
import { colors } from '@/constants/colors';
import { useLang } from '@/context/LangContext';
import { fetchLesson } from '@/lib/api/curriculum';
import type { Lesson } from '@/lib/mock-data';

export default function LessonScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const router = useRouter();
  const { i18n } = useLang();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [flowKey, setFlowKey] = useState(0);
  const hasBlurredRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (hasBlurredRef.current) {
        setFlowKey((current) => current + 1);
        hasBlurredRef.current = false;
      }

      return () => {
        hasBlurredRef.current = true;
      };
    }, []),
  );

  useEffect(() => {
    if (!lessonId) return;
    setLoading(true);
    fetchLesson(lessonId)
      .then((data) => setLesson(data.lesson))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [lessonId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!lesson || error) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>{i18n.lesson.notFound}</Text>
          <NBButton
            title={i18n.lesson.goBack}
            variant="ghost"
            onPress={() => router.back()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <LessonFlow
      key={flowKey}
      lesson={lesson}
      lessonId={lessonId ?? lesson.id}
    />
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  notFound: {
    alignItems: 'center',
    flex: 1,
    gap: 16,
    justifyContent: 'center',
    padding: 24,
  },
  notFoundText: {
    color: colors.text,
    fontFamily: 'Fredoka_700Bold',
    fontSize: 20,
  },
});
