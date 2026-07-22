import { useMemo, useState } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, layout } from '@challenge42/config';
import { searchFoods, type FoodItem } from '@challenge42/domain';
import type { MealSlot } from '@challenge42/types';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Divider } from '@/components/ui/Divider';
import { useFoodLogStore } from '@/features/tracking/foodLogStore';
import { formatThousands } from '@/lib/format';

const SLOTS: { value: MealSlot; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

function defaultSlot(): MealSlot {
  const h = new Date().getHours();
  if (h < 11) return 'breakfast';
  if (h < 15) return 'lunch';
  if (h < 21) return 'dinner';
  return 'snack';
}

export default function LogFood(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const addEntry = useFoodLogStore((s) => s.addEntry);

  const [slot, setSlot] = useState<MealSlot>(defaultSlot());
  const [query, setQuery] = useState('');
  const [quickCal, setQuickCal] = useState('');
  const [quickProtein, setQuickProtein] = useState('');
  const [addedCount, setAddedCount] = useState(0);
  const [addedCal, setAddedCal] = useState(0);

  const results = useMemo(() => searchFoods(query, 15), [query]);

  const tapAdd = (label: string, calories: number, proteinG: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    addEntry({ slot, label, calories: Math.round(calories), proteinG: Math.round(proteinG) });
    setAddedCount((n) => n + 1);
    setAddedCal((c) => c + Math.round(calories));
  };

  const addFood = (food: FoodItem) => {
    const n = food.nutrition;
    tapAdd(food.name, n.calories, n.proteinG);
  };

  const addQuick = () => {
    const cal = parseInt(quickCal.replace(/[^0-9]/g, ''), 10);
    if (Number.isNaN(cal) || cal <= 0) return;
    const protein = parseInt(quickProtein.replace(/[^0-9]/g, ''), 10);
    tapAdd('Quick add', cal, Number.isNaN(protein) ? 0 : protein);
    setQuickCal('');
    setQuickProtein('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text variant="titleMd">Log food</Text>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.close}
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={20} color={colors.text.secondary} />
        </Pressable>
      </View>

      <View style={styles.slotRow}>
        {SLOTS.map((s) => (
          <Pressable
            key={s.value}
            onPress={() => setSlot(s.value)}
            style={[styles.slot, slot === s.value && styles.slotOn]}
          >
            <Text
              variant="labelSm"
              style={{ color: slot === s.value ? colors.text.onPine : colors.text.secondary }}
            >
              {s.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="labelSm" color="tertiary" style={styles.sectionLabel}>
          SEARCH FOODS
        </Text>
        <TextField
          value={query}
          onChangeText={setQuery}
          placeholder="Search (e.g. chicken, banana)"
          autoCapitalize="none"
        />
        {query.trim().length > 0 ? (
          <View style={styles.results}>
            {results.length === 0 ? (
              <Text variant="bodyMd" color="tertiary" style={{ paddingVertical: spacing.md }}>
                No matches. Use Quick add below for anything.
              </Text>
            ) : (
              results.map((food, i) => (
                <View key={food.providerFoodId}>
                  {i > 0 ? <Divider /> : null}
                  <Pressable
                    style={styles.foodRow}
                    onPress={() => addFood(food)}
                    accessibilityRole="button"
                  >
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyLg" numberOfLines={1}>
                        {food.name}
                      </Text>
                      <Text variant="labelSm" color="tertiary">
                        {food.servingLabel} · {food.nutrition.calories} cal ·{' '}
                        {food.nutrition.proteinG}g protein
                      </Text>
                    </View>
                    <View style={styles.addBtn}>
                      <Ionicons name="add" size={20} color={colors.text.onPine} />
                    </View>
                  </Pressable>
                </View>
              ))
            )}
          </View>
        ) : null}

        <Text variant="labelSm" color="tertiary" style={styles.sectionLabel}>
          QUICK ADD
        </Text>
        <View style={styles.quickRow}>
          <View style={{ flex: 1.4 }}>
            <TextField
              value={quickCal}
              onChangeText={setQuickCal}
              placeholder="Calories"
              keyboardType="number-pad"
            />
          </View>
          <View style={{ flex: 1 }}>
            <TextField
              value={quickProtein}
              onChangeText={setQuickProtein}
              placeholder="Protein (g)"
              keyboardType="number-pad"
            />
          </View>
        </View>
        <Button
          label="Add calories"
          variant="secondary"
          onPress={addQuick}
          style={{ marginTop: spacing.md }}
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Text variant="labelMd" color="secondary">
          {addedCount === 0
            ? 'Nothing added yet'
            : `Added ${addedCount} · ${formatThousands(addedCal)} cal`}
        </Text>
        <Button label="Done" onPress={() => router.back()} style={styles.doneBtn} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenGutter,
    paddingBottom: spacing.md,
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surface.sunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: layout.screenGutter,
    marginBottom: spacing.sm,
  },
  slot: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface.sunken,
  },
  slotOn: { backgroundColor: colors.brand.pine },
  content: { paddingHorizontal: layout.screenGutter },
  sectionLabel: { marginTop: spacing.lg, marginBottom: spacing.sm },
  results: { marginTop: spacing.sm },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.pine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickRow: { flexDirection: 'row', gap: spacing.md },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenGutter,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border.hairline,
    backgroundColor: colors.surface.card,
  },
  doneBtn: { paddingHorizontal: spacing['3xl'] },
});
