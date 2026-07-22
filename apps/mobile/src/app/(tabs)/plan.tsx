import { View, StyleSheet } from 'react-native';
import { spacing } from '@challenge42/config';
import { PlaceholderScreen } from '@/features/placeholders/PlaceholderScreen';
import { Text } from '@/components/ui/Text';
import { Pill } from '@/components/ui/Pill';
import { MealPlanPreview } from '@/components/home/MealPlanPreview';
import { buildHomeSnapshot } from '@/features/home/mockHome';

const samplePlan = buildHomeSnapshot().plan;

export default function PlanScreen(): React.JSX.Element {
  return (
    <PlaceholderScreen
      eyebrow="PLAN"
      title="Your personalized plan"
      description="Meals built around your calorie and protein targets, preferences, budget, and time. AI drafts ideas; verified nutrition data sets the numbers."
      phaseLabel="Arriving Phase 8"
      teaser={
        <View>
          <View style={styles.tags}>
            <Pill label="2,100 CAL" tone="neutral" />
            <Pill label="HIGH PROTEIN" tone="gold" />
            <Pill label="UNDER 30 MIN" tone="neutral" />
          </View>
          <Text variant="labelSm" color="tertiary" style={styles.teaserLabel}>
            TODAY · PREVIEW
          </Text>
          <MealPlanPreview meals={samplePlan} />
        </View>
      }
      features={[
        {
          icon: 'sparkles-outline',
          label: 'Swap, regenerate, adapt',
          description:
            'Make it quicker, cheaper, or a different cuisine — or use what you already have.',
        },
        {
          icon: 'cart-outline',
          label: 'Grocery lists',
          description:
            'Auto-built shopping lists, including a plan for a set budget or a Costco run.',
        },
        {
          icon: 'shield-checkmark-outline',
          label: 'Verified nutrition',
          description: 'Macros come from a verified provider (USDA), never from AI guesses.',
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  teaserLabel: { marginBottom: spacing.sm },
});
