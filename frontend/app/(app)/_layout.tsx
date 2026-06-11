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
        tabBarPosition: 'top',
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
    <View style={[styles.tabIconWrap, 
      focused ? styles.tabIconWrapActive : styles.tabIconWrapInactive]}>
      <Image
        source={source}
        resizeMode="contain"
        style={[
          styles.tabIconImage,
          {
            opacity: focused ? 1 : 0.65,
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
  backgroundColor: colors.color_bot,
  borderBottomColor: colors.border,
  borderBottomWidth: 4,
  borderTopWidth: 0,
  height: 66,
  paddingBottom: 8,
  paddingTop: 8,
  },

  tabIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 3,
    height: 44,
    justifyContent: 'center',
    width: 52,
  },

  tabIconWrapActive: {
    shadowColor: colors.border,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
    transform: [{ translateY: 2 }],
  },

  tabIconWrapInactive: {
    opacity: 0.8,
  },
  tabIconImage: {
    height: 35,
    width: 35,
  },
  tabEmoji: {
    fontSize: 24,
  },
});