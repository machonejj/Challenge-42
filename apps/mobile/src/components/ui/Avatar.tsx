import { View, StyleSheet } from 'react-native';
import { colors, radius } from '@challenge42/config';
import { Text } from './Text';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0]?.[0] ?? '';
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + second).toUpperCase();
}

export interface AvatarProps {
  name: string;
  size?: number;
  tone?: 'pine' | 'gold';
}

/** Initials avatar. (Phase One seed uses no photos; real images arrive via expo-image later.) */
export function Avatar({ name, size = 40, tone = 'pine' }: AvatarProps): React.JSX.Element {
  const bg = tone === 'gold' ? colors.brand.gold : colors.surface.pineElevated;
  const fg = tone === 'gold' ? colors.text.onGold : colors.text.onPine;
  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: radius.pill, backgroundColor: bg },
      ]}
      accessibilityLabel={`${name} avatar`}
    >
      <Text style={{ color: fg, fontSize: size * 0.36, fontWeight: '700' }}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
