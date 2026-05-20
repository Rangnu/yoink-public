// January 08, 2026 23:40
import 'react-native-reanimated';

import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, View } from 'react-native';
import { useEffect } from 'react';

import { ActivityProvider } from '@/contexts/activity-context';
import { AuthProvider } from '@/contexts/auth-context';
import { SettingsProvider } from '@/contexts/settings-context';
import { supabase } from '@/utils/supabase';
import { ThemeProvider, useTheme } from '@/contexts/theme-context';
import { WatchlistProvider } from '@/contexts/watchlist-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const { resolvedTheme, colors } = useTheme();
  const isWeb = Platform.OS === 'web';
  const router = useRouter();

  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        router.replace('/auth/update-password' as any);
      }
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }, isWeb && styles.rootWeb]}>
      <View style={[styles.app, isWeb && styles.appWeb]}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth/login" options={{ presentation: 'modal' }} />
          <Stack.Screen name="auth/update-password" options={{ presentation: 'modal' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
      </View>
      <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SettingsProvider>
      <ThemeProvider>
        <AuthProvider>
          <ActivityProvider>
            <WatchlistProvider>
              <RootLayoutNav />
            </WatchlistProvider>
          </ActivityProvider>
        </AuthProvider>
      </ThemeProvider>
    </SettingsProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  rootWeb: {
    alignItems: 'center',
  },
  app: {
    flex: 1,
    width: '100%',
  },
  appWeb: {
    maxWidth: 430,
  },
});
