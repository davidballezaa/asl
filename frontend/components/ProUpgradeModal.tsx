import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { ProUpgradeCard } from '@/components/ProUpgradeCard';
import { colors } from '@/constants/colors';
import { useLang } from '@/context/LangContext';

type ProUpgradeModalProps = {
  visible: boolean;
  onClose: () => void;
  onUpgraded: () => void;
};

export function ProUpgradeModal({
  visible,
  onClose,
  onUpgraded,
}: ProUpgradeModalProps) {
  const { i18n } = useLang();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{i18n.subscription.upgradeTitle}</Text>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeBtn,
                pressed && styles.closeBtnPressed,
              ]}
              hitSlop={8}
            >
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <ProUpgradeCard
            hideBadge
            onUpgraded={() => {
              onUpgraded();
              onClose();
            }}
          />
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
    gap: 4,
    maxWidth: 420,
    padding: 20,
    shadowColor: colors.border,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 12,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerTitle: {
    color: colors.text,
    flex: 1,
    fontFamily: 'Fredoka_700Bold',
    fontSize: 22,
    paddingRight: 12,
  },
  closeBtn: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 3,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  closeBtnPressed: {
    opacity: 0.8,
  },
  closeText: {
    color: colors.text,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 14,
  },
});