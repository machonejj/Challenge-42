import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, type TypographyToken } from '@challenge42/config';
import { Text } from '@/components/ui/Text';

export interface MetricDelta {
  text: string;
  tone: 'positive' | 'neutral' | 'danger';
  direction?: 'up' | 'down' | 'none';
}

export interface MetricCardProps {
  label: string;
  value: string;
  /** Small trailing unit or target, e.g. "/ 2,100" or "lbs". */
  suffix?: string;
  delta?: MetricDelta;
  valueVariant?: TypographyToken;
}

const DELTA_COLOR: Record<MetricDelta['tone'], string> = {
  positive: colors.status.positive,
  neutral: colors.text.secondary,
  danger: colors.status.danger,
};

/** One big labeled number with an optional trend delta. The core "how am I doing" atom. */
export function MetricCard({
  label,
  value,
  suffix,
  delta,
  valueVariant = 'displayMd',
}: MetricCardProps): React.JSX.Element {
  return (
    <View style={styles.wrap}>
      <Text variant="labelSm" color="tertiary">
        {label}
      </Text>
      <View style={styles.valueRow}>
        <Text variant={valueVariant}>{value}</Text>
        {suffix ? (
          <Text variant="bodyMd" color="tertiary" style={styles.suffix}>
            {suffix}
          </Text>
        ) : null}
      </View>
      {delta ? (
        <View style={styles.deltaRow}>
          {delta.direction && delta.direction !== 'none' ? (
            <Ionicons
              name={delta.direction === 'down' ? 'arrow-down' : 'arrow-up'}
              size={13}
              color={DELTA_COLOR[delta.tone]}
            />
          ) : null}
          <Text variant="labelMd" style={{ color: DELTA_COLOR[delta.tone] }}>
            {delta.text}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  valueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  suffix: { marginBottom: 5 },
  deltaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
});
