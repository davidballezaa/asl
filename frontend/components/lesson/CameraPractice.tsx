import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { NBButton } from '@/components/NBButton';
import { NBCard } from '@/components/NBCard';
import { colors } from '@/constants/colors';
import { useAppData } from '@/context/AppDataContext';
import { useLang } from '@/context/LangContext';
import { recognizeSign } from '@/lib/api/signs';
import { playCorrectFeedback, playWrongFeedback } from '@/lib/feedback';
import { t } from '@/lib/i18n';
import type { Exercise } from '@/lib/mock-data';

type CameraPracticeProps = {
  exercise: Exercise;
  lessonId: string;
  onSuccess: () => void;
  onSkip: () => void;
  maxAttempts?: number;
};

export function CameraPractice({
  exercise,
  lessonId,
  onSuccess,
  onSkip,
  maxAttempts = 3,
}: CameraPracticeProps) {
  const { i18n } = useLang();
  const { refreshMe } = useAppData();
  const [permission, requestPermission] = useCameraPermissions();

  const [status, setStatus] = useState<'idle' | 'scanning' | 'result'>('idle');
  const [resultMessage, setResultMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [cameraLocked, setCameraLocked] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  const bounceAnim = useRef(new Animated.Value(0.5)).current;
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (permission && !permission.granted) {
      void requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    setStatus('idle');
    setResultMessage('');
    setSuccess(false);
    setAttempts(0);
    setCameraLocked(false);

    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
  }, [exercise.id]);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  const showFeedback = () => {
    bounceAnim.setValue(0.5);

    Animated.spring(bounceAnim, {
      toValue: 1,
      friction: 4,
      tension: 60,
      useNativeDriver: true,
    }).start();
  };

  const registerFailedAttempt = () => {
    setAttempts((currentAttempts) => {
      const nextAttempts = currentAttempts + 1;

      if (nextAttempts >= maxAttempts) {
        setCameraLocked(true);
      }

      return nextAttempts;
    });
  };

  const resetForRetry = () => {
    if (cameraLocked) return;

    setStatus('idle');
    setResultMessage('');
    setSuccess(false);
  };

  const handleCapture = async () => {
    if (status === 'scanning' || cameraLocked) return;

    setStatus('scanning');

    try {
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.7,
        skipProcessing: true,
      });

      if (!photo?.uri) {
        throw new Error('No photo captured');
      }

      const result = await recognizeSign({
        imageUri: photo.uri,
        expectedSign: exercise.signWord,
        lessonId,
        exerciseId: exercise.id,
      });

      setResultMessage(
        result.success ? i18n.lesson.signSuccess : i18n.lesson.signMiss,
      );
      setSuccess(result.success);
      setStatus('result');
      showFeedback();

      if (result.success) {
        setAttempts(0);
        await refreshMe();
        await playCorrectFeedback();

        successTimerRef.current = setTimeout(() => {
          onSuccess();
        }, 650);

        return;
      }

      registerFailedAttempt();
      await playWrongFeedback();
    } catch {
      setResultMessage(i18n.lesson.signMiss);
      setSuccess(false);
      setStatus('result');
      showFeedback();
      registerFailedAttempt();
      await playWrongFeedback();
    }
  };

  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>{i18n.lesson.cameraPermission}</Text>

        <NBButton
          title={i18n.lesson.allowCamera}
          variant="primary"
          onPress={requestPermission}
        />

        <NBButton
          title={i18n.lesson.continue}
          variant="secondary"
          onPress={onSkip}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.prompt}>{i18n.lesson.practiceCamera}</Text>

      <Text style={styles.title}>
        {t(i18n, 'lesson.sign', { word: exercise.signWord })}
      </Text>

      <Text style={styles.hint}>{exercise.signDescription}</Text>

      <Text style={styles.attemptsText}>
        Intentos: {attempts}/{maxAttempts}
      </Text>

      <NBCard style={styles.cameraCard}>
        <View style={styles.cameraWrap}>
          <CameraView ref={cameraRef} style={styles.camera} facing="front" />

          {status === 'scanning' && (
            <View style={styles.overlay}>
              <ActivityIndicator color="#fff" size="large" />
              <Text style={styles.overlayText}>{i18n.lesson.scanning}</Text>
            </View>
          )}

          {cameraLocked && (
            <View style={styles.overlay}>
              <Text style={styles.overlayText}>{i18n.lesson.attemptsLimit}</Text>
            </View>
          )}
        </View>
      </NBCard>

      {status === 'result' && !cameraLocked && (
        <Animated.View
          style={[
            styles.resultBox,
            {
              backgroundColor: success ? colors.successLight : colors.errorLight,
              borderColor: success ? colors.success : colors.error,
              transform: [{ scale: bounceAnim }],
            },
          ]}
        >
          <Text
            style={[
              styles.resultText,
              { color: success ? colors.success : colors.error },
            ]}
          >
            {resultMessage}
          </Text>
        </Animated.View>
      )}

      <View style={styles.actions}>
        {status !== 'result' && (
          <NBButton
            title={i18n.lesson.checkSign}
            variant="primary"
            loading={status === 'scanning'}
            disabled={status === 'scanning' || cameraLocked}
            onPress={() => void handleCapture()}
          />
        )}

        {status === 'result' && success && (
          <NBButton
            title={i18n.lesson.continue}
            variant="success"
            onPress={onSuccess}
          />
        )}

        {status === 'result' && !success && !cameraLocked && (
          <NBButton
            title={i18n.lesson.tryAgain}
            variant="secondary"
            onPress={resetForRetry}
          />
        )}

        {cameraLocked && (
          <NBButton
            title={i18n.lesson.continue}
            variant="primary"
            onPress={onSkip}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    width: '100%',
  },
  container: {
    gap: 12,
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  centered: {
    alignItems: 'center',
    flex: 1,
    gap: 16,
    justifyContent: 'center',
    padding: 20,
  },
  prompt: {
    color: colors.muted,
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontFamily: 'Fredoka_700Bold',
    fontSize: 22,
  },
  hint: {
    color: colors.muted,
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  attemptsText: {
    color: colors.muted,
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    textAlign: 'center',
  },
  message: {
    color: colors.text,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  cameraCard: {
    alignSelf: 'center',
    maxWidth: 360,
    overflow: 'hidden',
    padding: 0,
    width: '100%',
  },
  cameraWrap: {
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    gap: 12,
    justifyContent: 'center',
  },
  overlayText: {
    color: '#fff',
    fontFamily: 'Nunito_700Bold',
    fontSize: 16,
    textAlign: 'center',
  },
  resultBox: {
    borderRadius: 12,
    borderWidth: 3,
    paddingHorizontal: 16,
    paddingVertical: 14,
    width: '100%',
  },
  resultText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  actions: {
    gap: 8,
    marginTop: 4,
    width: '100%',
  },
});