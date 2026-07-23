import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@challenge42/config';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { formatThousands } from '@/lib/format';

type IconName = keyof typeof Ionicons.glyphMap;

export interface GoalRow {
  icon: IconName;
  label: string;
  value: number;
  goal: number | null;
  /** For calories, being at/under goal is good; the bar just reflects progress toward the number. */
  unit?: string;
}

function Row({ row }: { row: GoalRow }) {
  const has = row.goal != null && row.goal > 0;
  const pct = has ? Math.min(row.value / (row.goal as number), 1) : 0;
  const met = has && row.value >= (row.goal as number);
  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, met && styles.iconMet]}>
        <Ionicons
          name={met ? 'checkmark' : row.icon}
          size={16}
          color={met ? colors.text.onPine : colors.brand.pine}
        />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.rowTop}>
          <Text variant="labelMd">{row.label}</Text>
          <Text variant="labelSm" color="secondary">
            {formatThousands(Math.round(row.value))}
            {has ? ` / ${formatThousands(row.goal as number)}` : ''}
            {row.unit ? ` ${row.unit}` : ''}
          </Text>
        </View>
        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              {
                width: `${pct * 100}%`,
                backgroundColor: met ? colors.status.positive : colors.brand.gold,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

/** Compact progress toward the challenger's customizable daily goals. */
export function GoalsProgress({ rows }: { rows: GoalRow[] }): React.JSX.Element {
  return (
    <Card style={{ gap: spacing.lg }}>
      {rows.map((r) => (
        <Row key={r.label} row={r} />
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(18, 56, 43, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconMet: { backgroundColor: colors.status.positive },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface.sunken,
    marginTop: 6,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.pill },
});
