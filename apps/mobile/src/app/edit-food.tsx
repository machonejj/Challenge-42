import { useMemo, useState } from 'react';
import { View, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, layout } from '@challenge42/config';
import type { MealSlot } from '@challenge42/types';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useFoodLogStore } from '@/features/tracking/foodLogStore';

const SLOTS: { value: MealSlot; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

export default function EditFood(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const entry = useFoodLogStore((s) => s.entries.find((e) => e.id === id));
  const updateEntry = useFoodLogStore((s) => s.updateEntry);
  const removeEntry = useFoodLogStore((s) => s.removeEntry);

  const [label, setLabel] = useState(entry?.label ?? '');
  const [cal, setCal] = useState(entry ? String(entry.calories) : '');
  const [protein, setProtein] = useState(entry ? String(entry.proteinG) : '');
  const [slot, setSlot] = useState<MealSlot>(entry?.slot ?? 'snack');

  const calNum = useMemo(() => parseInt(cal.replace(/[^0-9]/g, ''), 10), [cal]);
  const canSave = Boolean(entry) && label.trim().length > 0 && !Number.isNaN(calNum) && calNum >= 0;

  const save = (): void => {
    if (!entry || !canSave) return;
    const proteinNum = parseInt(protein.replace(/[^0-9]/g, ''), 10);
    updateEntry(entry.id, {
      label: label.trim(),
      calories: calNum,
      proteinG: Number.isNaN(proteinNum) ? 0 : proteinNum,
      slot,
    });
    router.back();
  };

  const del = (): void => {
    if (entry) removeEntry(entry.id);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text variant="titleMd">{entry ? 'Edit food' : 'Not found'}</Text>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.close}
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={20} color={colors.text.secondary} />
        </Pressable>
      </View>

      {entry ? (
        <View style={styles.content}>
          <Text variant="labelSm" color="tertiary" style={styles.sectionLabel}>
            MEAL
          </Text>
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

          <View style={{ gap: spacing.lg, marginTop: spacing.lg }}>
            <TextField label="FOOD" value={label} onChangeText={setLabel} placeholder="Name" />
            <View style={styles.numRow}>
              <View style={{ flex: 1.4 }}>
                <TextField
                  label="CALORIES"
                  value={cal}
                  onChangeText={setCal}
                  placeholder="Calories"
                  keyboardType="number-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextField
                  label="PROTEIN (G)"
                  value={protein}
                  onChangeText={setProtein}
                  placeholder="Protein"
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </View>

          <Button label="Save changes" onPress={save} disabled={!canSave} style={styles.save} />
          <Pressable
            onPress={del}
            style={styles.deleteBtn}
            accessibilityRole="button"
            accessibilityLabel="Delete this food"
          >
            <Ionicons name="trash-outline" size={18} color={colors.status.danger} />
            <Text variant="labelMd" style={{ color: colors.status.danger }}>
              Delete
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.content}>
          <Text variant="bodyMd" color="secondary">
            That item is no longer in your log.
          </Text>
        </View>
      )}
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
  content: { paddingHorizontal: layout.screenGutter, flex: 1 },
  sectionLabel: { marginTop: spacing.md, marginBottom: spacing.sm },
  slotRow: { flexDirection: 'row', gap: spacing.xs },
  slot: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface.sunken,
  },
  slotOn: { backgroundColor: colors.brand.pine },
  numRow: { flexDirection: 'row', gap: spacing.md },
  save: { marginTop: spacing['2xl'] },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
});
