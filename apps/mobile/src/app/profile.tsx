import { View, Pressable, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { brand, colors, radius, spacing } from '@challenge42/config';
import { ScreenScaffold } from '@/components/ui/ScreenScaffold';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Pill } from '@/components/ui/Pill';
import { Divider } from '@/components/ui/Divider';
import { Avatar } from '@/components/ui/Avatar';

const PRIVACY: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }[] = [
  { icon: 'scale-outline', label: 'Weight', value: 'Private' },
  { icon: 'restaurant-outline', label: 'Calories', value: 'Private' },
  { icon: 'images-outline', label: 'Progress photos', value: 'Private' },
  { icon: 'location-outline', label: 'Map location', value: 'Hidden' },
];

export default function ProfileScreen(): React.JSX.Element {
  const router = useRouter();
  return (
    <>
      <StatusBar style="dark" />
      <ScreenScaffold>
        <View style={styles.header}>
          <Text variant="titleLg">Profile</Text>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={8}
            style={styles.close}
          >
            <Ionicons name="close" size={20} color={colors.text.secondary} />
          </Pressable>
        </View>

        <Card style={styles.identity}>
          <Avatar name="Jake M." size={56} tone="gold" />
          <View style={{ flex: 1 }}>
            <Text variant="titleMd">Jake M.</Text>
            <Text variant="bodyMd" color="secondary">
              Team Pine · Winter Reset
            </Text>
          </View>
        </Card>

        <Text variant="labelSm" color="tertiary" style={styles.sectionLabel}>
          PRIVACY · PRIVATE BY DEFAULT
        </Text>
        <Card padded={false}>
          <View style={styles.list}>
            {PRIVACY.map((row, i) => (
              <View key={row.label}>
                {i > 0 ? <Divider /> : null}
                <View style={styles.row}>
                  <View style={styles.iconBubble}>
                    <Ionicons name={row.icon} size={17} color={colors.brand.pine} />
                  </View>
                  <Text variant="bodyLg" style={{ flex: 1 }}>
                    {row.label}
                  </Text>
                  <Pill label={row.value} tone={row.value === 'Hidden' ? 'neutral' : 'online'} />
                </View>
              </View>
            ))}
          </View>
        </Card>
        <Text variant="bodyMd" color="secondary" style={styles.note}>
          Your exact location and running routes are never shared with other challengers. You
          control exactly what you share, and you can change it anytime.
        </Text>

        <Text variant="labelSm" color="tertiary" style={styles.sectionLabel}>
          ABOUT
        </Text>
        <Card>
          <View style={styles.aboutRow}>
            <Text variant="bodyLg">{brand.name}</Text>
            <Text variant="bodyMd" color="tertiary">
              v0.1.0 · Preview
            </Text>
          </View>
          <Divider />
          <Text variant="bodyMd" color="secondary" style={styles.disclaimer}>
            {brand.legal.disclaimer}
          </Text>
        </Card>
      </ScreenScaffold>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surface.sunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  sectionLabel: { marginTop: spacing['2xl'], marginBottom: spacing.sm },
  list: { paddingHorizontal: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  iconBubble: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(18, 56, 43, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: { marginTop: spacing.md },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  disclaimer: { marginTop: spacing.md },
});
