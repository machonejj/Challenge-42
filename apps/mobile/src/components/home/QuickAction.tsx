import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { colors, layout, radius, spacing } from '@challenge42/config';
import { Text } from '@/components/ui/Text';

export interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  tone?: 'primary' | 'default';
}

/** Large, thumb-friendly action button (≥ 60pt). Light haptic on press. */
export function QuickAction({
  icon,
  label,
  onPress,
  tone = 'default',
}: QuickActionProps): React.JSX.Element {
  const primary = tone === 'primary';
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.base,
        primary ? styles.primary : styles.default,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.iconWrap, primary ? styles.iconPrimary : styles.iconDefault]}>
        <Ionicons name={icon} size={20} color={primary ? colors.text.onPine : colors.brand.pine} />
      </View>
      <Text variant="labelMd" color={primary ? 'onPine' : 'primary'} align="center">
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    minHeight: layout.quickActionHeight,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
  default: {
    backgroundColor: colors.surface.card,
    borderColor: colors.border.hairline,
  },
  primary: {
    backgroundColor: colors.brand.pine,
    borderColor: colors.brand.pine,
  },
  pressed: { opacity: 0.85 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDefault: { backgroundColor: 'rgba(18, 56, 43, 0.06)' },
  iconPrimary: { backgroundColor: 'rgba(247, 243, 232, 0.14)' },
});
