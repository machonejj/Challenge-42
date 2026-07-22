import { Stack } from 'expo-router';
import { colors } from '@challenge42/config';

export default function OnboardingLayout(): React.JSX.Element {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        contentStyle: { backgroundColor: colors.surface.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="plan-reveal" />
    </Stack>
  );
}
