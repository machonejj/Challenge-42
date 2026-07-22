import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, type ColorValue } from 'react-native';
import { colors } from '@challenge42/config';
import { typeStyle } from '@/theme/theme';

type IoniconName = keyof typeof Ionicons.glyphMap;

/** Returns a tabBarIcon renderer for a base Ionicon (outline when inactive, filled when focused). */
function tabIcon(base: IoniconName) {
  return ({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) => (
    <Ionicons
      name={focused ? base : (`${base}-outline` as IoniconName)}
      size={size}
      color={color}
    />
  );
}

/** The five primary tabs. Profile/settings live behind the Home header avatar — never a 6th tab. */
export default function TabsLayout(): React.JSX.Element {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand.pine,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: colors.surface.card,
          borderTopColor: colors.border.hairline,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        tabBarLabelStyle: { ...typeStyle('labelSm'), marginTop: 2 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: tabIcon('home') }} />
      <Tabs.Screen name="live" options={{ title: 'Live', tabBarIcon: tabIcon('pulse') }} />
      <Tabs.Screen name="track" options={{ title: 'Track', tabBarIcon: tabIcon('stats-chart') }} />
      <Tabs.Screen name="plan" options={{ title: 'Plan', tabBarIcon: tabIcon('restaurant') }} />
      <Tabs.Screen
        name="community"
        options={{ title: 'Community', tabBarIcon: tabIcon('people') }}
      />
    </Tabs>
  );
}
