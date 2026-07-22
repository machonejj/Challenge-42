import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { brand, colors, spacing } from '@challenge42/config';
import { queryClient } from '@/lib/queryClient';
import { Text } from '@/components/ui/Text';
import { isSupabaseConfigured } from '@/services/supabase/client';
import { startCloudSync, stopCloudSync } from '@/services/sync/cloudSync';
import { useAuthStore } from '@/features/auth/authStore';
import { useAccessStore } from '@/features/admin/accessStore';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { useProfileStore } from '@/features/profile/profileStore';
import { getAnalytics } from '@/services/analytics/AnalyticsService';

export default function RootLayout(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={[styles.root, isWeb && styles.rootWeb]}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <RootNavigator />
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const isWeb = Platform.OS === 'web';

function RootNavigator(): React.JSX.Element {
  const router = useRouter();
  const segments = useSegments();
  const restore = useAuthStore((s) => s.restore);
  const authStatus = useAuthStore((s) => s.status);
  const userId = useAuthStore((s) => s.session?.user.id ?? null);
  const onbHydrated = useOnboardingStore((s) => s.hydrated);
  const onbStatus = useOnboardingStore((s) => s.status);
  const profileHydrated = useProfileStore((s) => s.hydrated);

  useEffect(() => {
    void restore().then(() => {
      getAnalytics().track('APP_OPENED', {
        authenticated: useAuthStore.getState().status === 'signedIn',
      });
    });
  }, [restore]);

  // Cross-device sync: pull on sign-in, push on change (only when Supabase is configured).
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    if (authStatus === 'signedIn' && userId) {
      void startCloudSync(userId);
      return () => stopCloudSync();
    }
    return undefined;
  }, [authStatus, userId]);

  // Access control: on sign-in, refresh admin flag and sign out anyone whose access was revoked.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    if (authStatus === 'signedIn' && userId) {
      void useAccessStore
        .getState()
        .refresh()
        .then((disabled) => {
          if (disabled) void useAuthStore.getState().signOut();
        });
    } else if (authStatus === 'signedOut') {
      useAccessStore.getState().clear();
    }
  }, [authStatus, userId]);

  const ready = authStatus !== 'restoring' && onbHydrated && profileHydrated;

  useEffect(() => {
    if (!ready) return;
    const group = segments[0];
    const inAuth = group === '(auth)';
    const inOnboarding = group === '(onboarding)';

    const atRoot = group === undefined; // the bare "/" index route

    if (authStatus === 'signedOut') {
      if (!inAuth) router.replace('/(auth)/welcome');
      return;
    }
    const onboardingComplete = onbStatus === 'COMPLETED';
    if (!onboardingComplete) {
      if (!inOnboarding) router.replace('/(onboarding)');
      return;
    }
    // Onboarded: send auth/onboarding/root to the app; leave (tabs) and the profile modal alone.
    if (inAuth || inOnboarding || atRoot) router.replace('/(tabs)');
  }, [ready, authStatus, onbStatus, segments, router]);

  return (
    <View style={[styles.frame, isWeb && styles.frameWeb]}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.surface.background },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="profile" options={{ presentation: 'modal' }} />
        <Stack.Screen name="weigh-in" options={{ presentation: 'modal' }} />
        <Stack.Screen name="activity" options={{ presentation: 'modal' }} />
        <Stack.Screen name="log-food" options={{ presentation: 'modal' }} />
        <Stack.Screen name="edit-food" options={{ presentation: 'modal' }} />
        <Stack.Screen name="admin" options={{ presentation: 'modal' }} />
      </Stack>
      {!ready ? <SplashOverlay /> : null}
    </View>
  );
}

function SplashOverlay(): React.JSX.Element {
  return (
    <View style={styles.splash}>
      <Text variant="labelSm" style={{ color: colors.brand.gold, letterSpacing: 2 }}>
        {brand.name.toUpperCase()}
      </Text>
      <ActivityIndicator color={colors.brand.gold} style={{ marginTop: spacing.lg }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  // On web, sit the app in a centered phone-width column on a muted backdrop, so every screen (and
  // the map) fits like a phone instead of stretching across the browser. No-op on real devices.
  // Centering is done with alignSelf on the frame (NOT alignItems on the root, which would collapse
  // the provider views to zero width on react-native-web).
  rootWeb: { backgroundColor: '#DED8C7' },
  frame: { flex: 1, width: '100%' },
  frameWeb: { maxWidth: 460, alignSelf: 'center', backgroundColor: colors.surface.background },
  splash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface.pine,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
