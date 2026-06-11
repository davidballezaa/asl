import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { NBButton } from '@/components/NBButton';
import { colors } from '@/constants/colors';

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            <NBButton
              title={cancelLabel}
              variant="primary"
              onPress={onCancel}
              style={styles.actionButton}
            />
            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.destructiveButton,
                pressed && styles.destructiveButtonPressed,
              ]}
            >
              <Text style={styles.destructiveLabel}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 4,
    gap: 12,
    maxWidth: 400,
    padding: 20,
    shadowColor: colors.border,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 12,
    width: '100%',
  },
  title: {
    color: colors.text,
    fontFamily: 'Fredoka_700Bold',
    fontSize: 22,
  },
  message: {
    color: colors.muted,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    gap: 10,
    marginTop: 4,
  },
  actionButton: {
    width: '100%',
  },
  destructiveButton: {
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    borderColor: colors.error,
    borderRadius: 16,
    borderWidth: 4,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: 24,
    shadowColor: colors.border,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 8,
    width: '100%',
  },
  destructiveButtonPressed: {
    opacity: 0.85,
    transform: [{ translateX: 2 }, { translateY: 2 }],
  },
  destructiveLabel: {
    color: colors.error,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 18,
  },
});
