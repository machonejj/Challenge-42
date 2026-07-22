import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@challenge42/config';
import type { HomePlanMeal } from '@challenge42/types';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Divider } from '@/components/ui/Divider';

const SLOT_LABEL: Record<HomePlanMeal['slot'], string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

function MealRow({ meal, onPress }: { meal: HomePlanMeal; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View
        style={[styles.check, meal.completed ? styles.checkDone : styles.checkTodo]}
        accessibilityLabel={meal.completed ? 'completed' : 'not completed'}
      >
        {meal.completed ? <Ionicons name="checkmark" size={15} color={colors.text.onPine} /> : null}
      </View>
      <View style={styles.mealBody}>
        <Text variant="labelSm" color="tertiary">
          {SLOT_LABEL[meal.slot].toUpperCase()}
        </Text>
        <Text variant="bodyLg" numberOfLines={1}>
          {meal.title}
        </Text>
      </View>
      <View style={styles.macro}>
        <Text variant="labelMd" color="secondary">
          {meal.calories} cal
        </Text>
        <Text variant="labelSm" color="tertiary">
          {meal.proteinG}g protein
        </Text>
      </View>
    </Pressable>
  );
}

/** Today's plan preview: breakfast/lunch/dinner/snack with completion state. */
export function MealPlanPreview({
  meals,
  onPressMeal,
}: {
  meals: readonly HomePlanMeal[];
  onPressMeal?: (meal: HomePlanMeal) => void;
}): React.JSX.Element {
  return (
    <Card padded={false}>
      <View style={styles.list}>
        {meals.map((meal, i) => (
          <View key={meal.slot}>
            {i > 0 ? <Divider /> : null}
            <MealRow meal={meal} onPress={onPressMeal ? () => onPressMeal(meal) : undefined} />
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  pressed: { opacity: 0.6 },
  check: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  checkDone: { backgroundColor: colors.status.positive, borderColor: colors.status.positive },
  checkTodo: { backgroundColor: 'transparent', borderColor: colors.border.strong },
  mealBody: { flex: 1, gap: 1 },
  macro: { alignItems: 'flex-end', gap: 1 },
});
