import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { brand, colors, spacing } from '@challenge42/config';
import { queryClient } from '@/lib/queryClient';
import { Text } from '@/components/ui/Text';
import { useAuthStore } from '@/features/auth/authStore';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { useProfileStore } from '@/features/profile/profileStore';
import { getAnalytics } from '@/services/analytics/AnalyticsService';

export default function RootLayout(): React.JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <RootNavigator />
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator(): React.JSX.Element {
  const router = useRouter();
  const segments = useSegments();
  const restore = useAuthStore((s) => s.restore);
  const authStatus = useAuthStore((s) => s.status);
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
    <>
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
      </Stack>
      {!ready ? <SplashOverlay /> : null}
    </>
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
