import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@challenge42/config';

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
  const insets = useSafeAreaInsets();
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
          // Enough room for icon + label; clears the home indicator via the bottom inset
          // (and gives browsers, which report no inset, a comfortable gap too).
          height: 64 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom > 0 ? insets.bottom + 4 : 16,
        },
        // Compact, non-uppercase labels so nothing truncates (e.g. "Community").
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', letterSpacing: 0.1 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: tabIcon('home') }} />
      <Tabs.Screen name="track" options={{ title: 'Track', tabBarIcon: tabIcon('stats-chart') }} />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'handshake' : 'handshake-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen name="live" options={{ title: 'Leaderboard', tabBarIcon: tabIcon('trophy') }} />
      <Tabs.Screen name="plan" options={{ href: null }} />
    </Tabs>
  );
}
