import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View , Image} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Navbar } from '@/components/Navbar';
import { NBButton } from '@/components/NBButton';
import { NBCard } from '@/components/NBCard';
import { NBInput } from '@/components/NBInput';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LangContext';

export default function LoginScreen() {
  const router = useRouter();
  const { isSignedIn, isLoading, signIn } = useAuth();
  const { i18n } = useLang();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && isSignedIn) {
      router.replace('/(app)/home');
    }
  }, [isLoading, isSignedIn, router]);

  const handleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      router.replace('/(app)/home');
    } catch {
      setError(i18n.login.error);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Navbar />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenContainer size="auth">
          <NBCard style={styles.card}>
            <View>
              <Image source={require("../assets/icons/Logoapp.png")}
              style={styles.logoImage}/>
            </View>

            <Text style={styles.title}>{i18n.login.title}</Text>

            <View style={styles.form}>
              <NBInput
                placeholder={i18n.login.email}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <NBInput
                placeholder={i18n.login.password}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {error !== '' && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <NBButton
              title={i18n.login.submit}
              variant="primary"
              loading={loading}
              onPress={() => void handleSignIn()}
            />

            <View style={styles.linkRow}>
              <Text style={styles.linkText}>{i18n.login.noAccount} </Text>
              <Text
                style={styles.linkAction}
                onPress={() => router.push('/register')}
              >
                {i18n.login.register}
              </Text>
            </View>
          </NBCard>
        </ScreenContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  card: {
    alignItems: 'center',
    gap: 12,
    padding: 32,
  },
  iconCircle: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 4,
    height: 64,
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: colors.border,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
    width: 64,
  },
  iconText: {
    fontSize: 28,
  },
  title: {
    color: colors.text,
    fontFamily: 'Fredoka_700Bold',
    fontSize: 28,
    marginBottom: 8,
    textAlign: 'center',
  },
  form: {
    gap: 12,
    width: '100%',
  },
  errorBox: {
    backgroundColor: colors.error,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 3,
    padding: 12,
    width: '100%',
  },
  errorText: {
    color: '#FFFFFF',
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
    textAlign: 'center',
  },
  linkRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  linkText: {
    color: colors.muted,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 14,
  },
  linkAction: {
    color: colors.primary,
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
    logoImage: {
    width: 300,
    height: 300
  }
});
