import { Redirect, Tabs } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';

export default function AppLayout() {
  const { isSignedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Curse',
          tabBarIcon: ({ focused }) => (
            <ImageTabIcon
              source={require('../../assets/icons/Curses.png')}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <ImageTabIcon
              source={require('../../assets/icons/profile.png')}
              focused={focused}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="learn"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

function ImageTabIcon({
  source,
  focused,
}: {
  source: ImageSourcePropType;
  focused: boolean;
}) {
  return (
    <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
      <Image
        source={source}
        resizeMode="contain"
        style={[
          styles.tabIconImage,
          {
            opacity: focused ? 1 : 0.55,
            transform: [{ scale: focused ? 1.08 : 1 }],
          },
        ]}
      />
    </View>
  );
}

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <View style={[styles.tabIconWrap, focused && styles.tabIconWrapActive]}>
      <Text style={styles.tabEmoji}>{emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
  },
  tabBar: {
    backgroundColor: colors.background,
    borderTopColor: colors.border,
    borderTopWidth: 4,
    height: 60,
    paddingBottom: 6,
    paddingTop: 6,
  },
  tabIconWrap: {
    alignItems: 'center',
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    width: 52,
  },
  tabIconWrapActive: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 3,
    shadowColor: colors.border,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  tabIconImage: {
    height: 28,
    width: 28,
  },
  tabEmoji: {
    fontSize: 24,
  },
});