import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import {
  Image,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Navbar } from '@/components/Navbar';
import { NBButton } from '@/components/NBButton';
import { NBCard } from '@/components/NBCard';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useLang } from '@/context/LangContext';

const HAND_ROTATIONS = [-4, 0, 4, -4, 0, 4, -4, 0, 4];

export default function LandingScreen() {
  const router = useRouter();
  const { isSignedIn, isLoading } = useAuth();
  const { i18n } = useLang();
  const { width } = useWindowDimensions();
  const isWide = width >= 1024;

  const fadeAnims = Array.from({ length: 4 }, () =>
    useRef(new Animated.Value(0)).current,
  );
  const slideAnims = Array.from({ length: 4 }, () =>
    useRef(new Animated.Value(24)).current,
  );
  const gridRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLoading && isSignedIn) {
      router.replace('/(app)/home');
    }
  }, [isLoading, isSignedIn, router]);

  useEffect(() => {
    const animations = fadeAnims.map((fade, i) =>
      Animated.sequence([
        Animated.delay(i * 100),
        Animated.parallel([
          Animated.timing(fade, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnims[i], {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    Animated.parallel(animations).start();
    Animated.timing(gridRotate, {
      toValue: 1,
      duration: 800,
      delay: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnims, slideAnims, gridRotate]);

  if (isLoading) return null;

  const features = [
    {
      icon: '🤟',
      title: i18n.landing.features.f1Title,
      desc: i18n.landing.features.f1Desc,
      color: colors.primary,
    },
    {
      icon: '📷',
      title: i18n.landing.features.f2Title,
      desc: i18n.landing.features.f2Desc,
      color: colors.success,
    },
    {
      icon: '🏆',
      title: i18n.landing.features.f3Title,
      desc: i18n.landing.features.f3Desc,
      color: colors.secondary,
    },
  ];

  const spin = gridRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-6deg', '-3deg'],
  });

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Navbar />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <ScreenContainer size="wide">
          <View style={[styles.hero, isWide && styles.heroWide]}>
            <Animated.View
              style={[
                styles.heroCopy,
                isWide && styles.heroCopyWide,
                {
                  opacity: fadeAnims[0],
                  transform: [{ translateY: slideAnims[0] }],
                },
              ]}
            >
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{i18n.landing.tagline}</Text>
              </View>

              <View style={styles.titleRow}>
                <Text style={styles.title}>{i18n.landing.title}</Text>
              </View>

              <Text style={styles.subtitle}>{i18n.landing.subtitle}</Text>

              <View style={styles.actions}>
                <NBButton
                  title={`${i18n.landing.cta}`}
                  variant="primary"
                  onPress={() =>
                    router.push(isSignedIn ? '/(app)/home' : '/register')
                  }
                  style={styles.ctaBtn}
                />
                {!isSignedIn && (
                  <NBButton
                    title={i18n.landing.already}
                    variant="ghost"
                    onPress={() => router.push('/login')}
                    style={styles.ghostBtn}
                  />
                )}
              </View>
            </Animated.View>

            {isWide && (
              <Animated.View
                style={[
                  styles.gridSide,
                  {
                    opacity: fadeAnims[1],
                    transform: [{ rotate: spin }],
                  },
                ]}
              >
                <View style={styles.handGrid}>
                  {HANDS.map((tile, i) => (
                    <View
                      key={i}
                      style={[
                        styles.gridCell,
                        {
                          backgroundColor: tile.color,
                          transform: [{ rotate: `${HAND_ROTATIONS[i]}deg` }],
                        },
                      ]}
                    >
                      <Image
                        source={tile.image}
                        style={[
                          styles.gridImage,
                          i === 8 && styles.gridHandLight,
                        ]}
                      />
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}
          </View>

          <Animated.View
            style={[
              styles.features,
              width >= 768 && styles.featuresWide,
              {
                opacity: fadeAnims[2],
                transform: [{ translateY: slideAnims[2] }],
              },
            ]}
          >
            {features.map((f) => (
              <NBCard key={f.title} style={styles.featureCard}>
                <View style={[styles.featureIcon, { backgroundColor: f.color }]}>
                  <Text style={styles.featureEmoji}>{f.icon}</Text>
                </View>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </NBCard>
            ))}
          </Animated.View>
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
    paddingBottom: 48,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  hero: {
    gap: 32,
  },
  heroWide: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  heroCopy: {
    gap: 20,
  },
  heroCopyWide: {
    flex: 1,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.secondary,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    shadowColor: colors.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  badgeText: {
    color: colors.text,
    fontFamily: 'Nunito_700Bold',
    fontSize: 14,
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  title: {
    color: colors.text,
    fontFamily: 'Fredoka_700Bold',
    fontSize: 42,
    lineHeight: 50,
  },
  titleHand: {
    fontSize: 48,
  },
  subtitle: {
    color: colors.muted,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 18,
    lineHeight: 28,
    maxWidth: 560,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  ctaBtn: {
    minWidth: 200,
  },
  ghostBtn: {
    minWidth: 180,
  },
  gridSide: {
    flex: 1,
    minHeight: 640,
  alignItems: 'center',
  justifyContent: 'center',
  },
  handGrid: {
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
    width: 590,
  },
  gridCell: {
    alignItems: 'center',
    aspectRatio: 1,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 4,
    justifyContent: 'center',
    shadowColor: colors.border,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
    width: '33.33%',
  },
  gridHand: {
    fontSize: 36,
  },
  gridHandLight: {
    opacity: 0.9,
  },
  features: {
    gap: 16,
    marginTop: 64,
  },
  featuresWide: {
    flexDirection: 'row',
  },
  featureCard: {
    flex: 1,
    gap: 10,
    minWidth: 220,
    padding: 24,
  },
  featureIcon: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 4,
    height: 56,
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: colors.border,
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    width: 56,
  },
  featureEmoji: {
    fontSize: 26,
  },
  featureTitle: {
    color: colors.text,
    fontFamily: 'Fredoka_700Bold',
    fontSize: 20,
  },
  featureDesc: {
    color: colors.muted,
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 15,
    lineHeight: 22,
  },
  gridImage: {
    width: '80%',
    height: '85%',
    resizeMode: 'contain',
  }
});

const HANDS = [
  {
    color: '#2DE6E0',
    image : require('../../frontend/assets/alfabeto_manos/a.png'),
  },
  {
    color: '#4DE63D',
    image : require('../../frontend/assets/alfabeto_manos/l.png'),
  },
  {
    color: '#E64403',
    image : require('../../frontend/assets/alfabeto_manos/o.png'),
  },
  {
    color: '#E67E17',
    image : require('../../frontend/assets/alfabeto_manos/s.png'),
  },
  {
    color: '#931FE6',
    image : require('../../frontend/assets/alfabeto_manos/t.png'),
  },
  {
    color: '#E6AC00',
    image : require('../../frontend/assets/alfabeto_manos/w.png'),
  },
  {
    color: '#E65179',
    image : require('../../frontend/assets/alfabeto_manos/v.png'),
  },
  {
    color: '#F59E0B',
    image : require('../../frontend/assets/alfabeto_manos/k.png'),
  },
  {
    color: '#2E4BE6',
    image : require('../../frontend/assets/alfabeto_manos/i.png'),
  },
]
