import type { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@challenge42/config';
import { ScreenScaffold } from '@/components/ui/ScreenScaffold';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Pill } from '@/components/ui/Pill';
import { Divider } from '@/components/ui/Divider';

export interface PreviewFeature {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  description: string;
}

export interface PlaceholderScreenProps {
  eyebrow: string;
  title: string;
  description: string;
  phaseLabel: string;
  features: readonly PreviewFeature[];
  teaser?: ReactNode;
}

/**
 * Intentional, on-brand placeholder for tabs whose full functionality lands in a later phase.
 * Never a blank "coming soon" — it explains what's coming with real design-system components.
 */
export function PlaceholderScreen({
  eyebrow,
  title,
  description,
  phaseLabel,
  features,
  teaser,
}: PlaceholderScreenProps): React.JSX.Element {
  return (
    <>
      <StatusBar style="dark" />
      <ScreenScaffold>
        <Text variant="labelSm" color="gold">
          {eyebrow}
        </Text>
        <Text variant="titleLg" style={styles.title}>
          {title}
        </Text>
        <View style={styles.phaseRow}>
          <Pill label={phaseLabel} tone="neutral" />
        </View>
        <Text variant="bodyLg" color="secondary" style={styles.desc}>
          {description}
        </Text>

        {teaser ? <View style={styles.teaser}>{teaser}</View> : null}

        <Text variant="labelSm" color="tertiary" style={styles.whatsNext}>
          WHAT'S COMING
        </Text>
        <Card padded={false} style={styles.featureCard}>
          <View style={styles.featureList}>
            {features.map((f, i) => (
              <View key={f.label}>
                {i > 0 ? <Divider /> : null}
                <View style={styles.featureRow}>
                  <View style={styles.iconBubble}>
                    <Ionicons name={f.icon} size={18} color={colors.brand.pine} />
                  </View>
                  <View style={styles.featureBody}>
                    <Text variant="labelMd">{f.label}</Text>
                    <Text variant="bodyMd" color="secondary">
                      {f.description}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </Card>
      </ScreenScaffold>
    </>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.xs },
  phaseRow: { flexDirection: 'row', marginTop: spacing.md },
  desc: { marginTop: spacing.md },
  teaser: { marginTop: spacing['2xl'] },
  whatsNext: { marginTop: spacing['2xl'], marginBottom: spacing.sm },
  featureCard: {},
  featureList: { paddingHorizontal: spacing.lg },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  iconBubble: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(18, 56, 43, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureBody: { flex: 1, gap: 1 },
});
