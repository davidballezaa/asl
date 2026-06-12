import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, Modal } from 'react-native';

import { SignIllustration } from '@/components/SignIllustration';
import { colors } from '@/constants/colors';
import type { Exercise } from '@/lib/mock-data';

type HintProps = {
  exercise: Exercise;
  maxUses?: number;
};

const STORAGE_PREFIX = '@asl/hintUses:';

export function Hint({ exercise, maxUses = 3 }: HintProps) {
  const [uses, setUses] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);

  const storageKey = `${STORAGE_PREFIX}${exercise.id}`;

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(storageKey).then((v) => {
      if (!mounted) return;
      const n = v ? parseInt(v, 10) || 0 : 0;
      setUses(n);
    });

    return () => {
      mounted = false;
    };
  }, [storageKey]);

  const incrementUse = async () => {
    const next = (uses ?? 0) + 1;
    setUses(next);
    try {
      await AsyncStorage.setItem(storageKey, String(next));
    } catch {
      // ignore
    }
  };

  const handlePress = async () => {
    if ((uses ?? 0) >= maxUses) return;
    await incrementUse();
    setVisible(true);
  };

  const remaining = maxUses - (uses ?? 0);

  return (
    <>
      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}
        accessibilityLabel="Hint"
      >
        <Image source={require('../assets/bulb.png')} resizeMode = "contain" style={styles.icon} />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{Math.max(0, remaining)}</Text>
        </View>
      </Pressable>

      <Modal visible={visible} animationType="fade" transparent>
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <SignIllustration
              word={exercise.signWord}
              size="lg"
              variant={exercise.contentType ?? 'letter'}
              imageUrl={exercise.imageUrl}
            />

            <Text style={styles.description}>{exercise.signDescription}</Text>

            <Pressable
              onPress={() => setVisible(false)}
              style={styles.closeButton}
            >
              <Text style={styles.closeText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    right: 12,
    top: 12,
    zIndex: 30,
    width: 48,
    height: 48,
  },
  icon: {
    width: 48,
    height: 48,
  },
  badge: {
    position: 'absolute',
    right: -6,
    bottom: -6,
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    paddingHorizontal: 4,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  badgeText: {
    color: '#fff',
    fontFamily: 'Nunito_700Bold',
    fontSize: 12,
  },
  modalWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    maxWidth: 520,
    alignItems: 'center',
    gap: 12,
  },
  description: {
    color: colors.text,
    fontFamily: 'Nunito_400Regular',
    fontSize: 14,
    textAlign: 'center',
  },
  closeButton: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  closeText: {
    color: '#fff',
    fontFamily: 'Nunito_700Bold',
  },
});

export default Hint;
