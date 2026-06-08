import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NBButton } from '@/components/NBButton';
import { colors } from '@/constants/colors';
import { MAX_WIDTH } from '@/constants/layout';
import { useGamification } from '@/context/AppDataContext';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LangContext';

export function Navbar() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isSignedIn, signOut } = useAuth();
  const { lang, setLang, i18n } = useLang();
  const state = useGamification();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/');
  };

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <View style={styles.inner}>
        <Pressable
          onPress={() => router.push(isSignedIn ? '/(app)/home' : '/')}
          style={styles.brand}
        >
          <View style={styles.brandIcon}>
            <Text style={styles.brandEmoji}>🤟</Text>
          </View>
          <Text style={styles.brandText}>
            ASL<Text style={styles.brandAccent}>Academy</Text>
          </Text>
        </Pressable>

        <View style={styles.actions}>
          <View style={styles.langToggle}>
            <Pressable
              onPress={() => setLang('es')}
              style={[styles.langBtn, lang === 'es' && styles.langBtnActive]}
            >
              <Text
                style={[styles.langText, lang === 'es' && styles.langTextActive]}
              >
                ES
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setLang('en')}
              style={[
                styles.langBtn,
                styles.langBtnDivider,
                lang === 'en' && styles.langBtnActive,
              ]}
            >
              <Text
                style={[styles.langText, lang === 'en' && styles.langTextActive]}
              >
                EN
              </Text>
            </Pressable>
          </View>

          {isSignedIn ? (
            <>
              <View style={styles.statPill}>
                <Text style={styles.statEmoji}>🔥</Text>
                <Text style={styles.statValue}>{state?.streak ?? 0}</Text>
              </View>
              <View style={styles.statPill}>
                <Text style={styles.statEmoji}>⭐</Text>
                <Text style={styles.statValue}>{state?.totalXp ?? 0}</Text>
              </View>
              <Pressable onPress={() => void handleSignOut()} style={styles.logoutBtn}>
                <Text style={styles.logoutText}>↗</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable onPress={() => router.push('/login')}>
                <Text style={styles.linkText}>{i18n.nav.login}</Text>
              </Pressable>
              <NBButton
                title={i18n.nav.register}
                variant="primary"
                onPress={() => router.push('/register')}
                style={styles.registerBtn}
              />
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.background,
    borderBottomColor: colors.border,
    borderBottomWidth: 4,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  inner: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    maxWidth: MAX_WIDTH.wide,
    width: '100%',
    alignSelf: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  brand: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  brandIcon: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 4,
    height: 40,
    justifyContent: 'center',
    shadowColor: colors.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    width: 40,
  },
  brandEmoji: {
    fontSize: 18,
  },
  brandText: {
    color: colors.text,
    fontFamily: 'Fredoka_700Bold',
    fontSize: 22,
  },
  brandAccent: {
    color: colors.primary,
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  langToggle: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 4,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: colors.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  langBtnDivider: {
    borderLeftColor: colors.border,
    borderLeftWidth: 4,
  },
  langBtnActive: {
    backgroundColor: colors.primary,
  },
  langText: {
    color: colors.text,
    fontFamily: 'Fredoka_700Bold',
    fontSize: 13,
  },
  langTextActive: {
    color: '#FFFFFF',
  },
  statPill: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 4,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: colors.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  statEmoji: {
    fontSize: 14,
  },
  statValue: {
    color: colors.text,
    fontFamily: 'Fredoka_700Bold',
    fontSize: 14,
  },
  logoutBtn: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 4,
    height: 36,
    justifyContent: 'center',
    shadowColor: colors.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    width: 36,
  },
  logoutText: {
    fontSize: 16,
  },
  linkText: {
    color: colors.text,
    fontFamily: 'Fredoka_700Bold',
    fontSize: 14,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  registerBtn: {
    minHeight: 36,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
});
