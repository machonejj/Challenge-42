import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@challenge42/config';
import { PlaceholderScreen } from '@/features/placeholders/PlaceholderScreen';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';

type Cell = 'done' | 'none';
const WEEK: { label: string; days: readonly Cell[] }[] = [
  { label: 'Calories', days: ['done', 'done', 'done', 'done', 'none', 'done', 'none'] },
  { label: 'Weigh-ins', days: ['done', 'none', 'none', 'none', 'none', 'done', 'none'] },
  { label: 'Plan', days: ['done', 'done', 'done', 'done', 'done', 'none', 'none'] },
  { label: 'Movement', days: ['done', 'done', 'none', 'done', 'none', 'none', 'none'] },
];
const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

function ConsistencyGrid() {
  return (
    <Card>
      <View style={styles.headerRow}>
        <View style={styles.rowLabelSpacer} />
        {DAY_LETTERS.map((d, i) => (
          <Text key={i} variant="labelSm" color="tertiary" style={styles.dayHead}>
            {d}
          </Text>
        ))}
      </View>
      {WEEK.map((row) => (
        <View key={row.label} style={styles.gridRow}>
          <Text variant="labelMd" color="secondary" style={styles.rowLabel}>
            {row.label}
          </Text>
          {row.days.map((c, i) => (
            <View key={i} style={styles.cellWrap}>
              <View style={[styles.cell, c === 'done' ? styles.cellDone : styles.cellNone]}>
                {c === 'done' ? (
                  <Ionicons name="checkmark" size={12} color={colors.text.onPine} />
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ))}
    </Card>
  );
}

export default function TrackScreen(): React.JSX.Element {
  return (
    <PlaceholderScreen
      eyebrow="TRACK"
      title="Weight, calories, consistency"
      description="Simple daily tracking that feeds your score. Weigh in weekly (no daily pressure), log food fast, and watch your consistency build."
      phaseLabel="Arriving Phase 3"
      teaser={
        <View>
          <Text variant="labelSm" color="tertiary" style={styles.teaserLabel}>
            THIS WEEK · PREVIEW
          </Text>
          <ConsistencyGrid />
        </View>
      }
      features={[
        {
          icon: 'scale-outline',
          label: 'Weight & trend',
          description:
            'Starting, current, and goal weight with total change, % change, and weekly averages.',
        },
        {
          icon: 'restaurant-outline',
          label: 'Calorie logging',
          description: 'Target, consumed, and remaining — with one-tap logging of planned meals.',
        },
        {
          icon: 'grid-outline',
          label: 'Consistency grid',
          description:
            'A weekly view of what you completed — the heart of a healthy, sustainable score.',
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  teaserLabel: { marginBottom: spacing.sm },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  rowLabelSpacer: { width: 88 },
  dayHead: { flex: 1, textAlign: 'center' },
  gridRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs },
  rowLabel: { width: 88 },
  cellWrap: { flex: 1, alignItems: 'center' },
  cell: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellDone: { backgroundColor: colors.status.positive },
  cellNone: { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border.strong },
});
