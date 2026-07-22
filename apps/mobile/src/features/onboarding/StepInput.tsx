import { useState } from 'react';
import { View, Pressable, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@challenge42/config';
import { displayToKg, kgToDisplay, round } from '@challenge42/domain';
import type {
  OnboardingAnswerKey,
  OnboardingAnswers,
  OnboardingOption,
  OnboardingStepDef,
  WeightUnit,
} from '@challenge42/types';
import { typeStyle } from '@/theme/theme';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';

type SetAnswer = <K extends OnboardingAnswerKey>(key: K, value: OnboardingAnswers[K]) => void;

// ---- Selectable option card ------------------------------------------------------------------

function OptionCard({
  option,
  selected,
  onPress,
}: {
  option: OnboardingOption;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.option, selected && styles.optionSelected]}
    >
      {option.emoji ? <Text style={styles.optionEmoji}>{option.emoji}</Text> : null}
      <View style={{ flex: 1 }}>
        <Text variant="bodyLg" style={selected ? styles.optionLabelSelected : undefined}>
          {option.label}
        </Text>
        {option.hint ? (
          <Text variant="labelSm" color="tertiary">
            {option.hint}
          </Text>
        ) : null}
      </View>
      <View style={[styles.check, selected && styles.checkOn]}>
        {selected ? <Ionicons name="checkmark" size={15} color={colors.text.onPine} /> : null}
      </View>
    </Pressable>
  );
}

function SingleSelect({
  options,
  value,
  onChange,
}: {
  options: readonly OnboardingOption[];
  value: string | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.options}>
      {options.map((o) => (
        <OptionCard
          key={o.value}
          option={o}
          selected={value === o.value}
          onPress={() => onChange(o.value)}
        />
      ))}
    </View>
  );
}

function MultiSelect({
  options,
  value,
  maxSelect,
  onChange,
}: {
  options: readonly OnboardingOption[];
  value: string[];
  maxSelect?: number;
  onChange: (v: string[]) => void;
}) {
  const toggle = (v: string) => {
    if (value.includes(v)) {
      onChange(value.filter((x) => x !== v));
    } else if (!maxSelect || value.length < maxSelect) {
      onChange([...value, v]);
    }
  };
  return (
    <View style={styles.options}>
      {options.map((o) => (
        <OptionCard
          key={o.value}
          option={o}
          selected={value.includes(o.value)}
          onPress={() => toggle(o.value)}
        />
      ))}
    </View>
  );
}

function BooleanInput({
  value,
  onChange,
}: {
  value: boolean | undefined;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.options}>
      <OptionCard
        option={{ value: 'yes', label: 'Yes' }}
        selected={value === true}
        onPress={() => onChange(true)}
      />
      <OptionCard
        option={{ value: 'no', label: 'No' }}
        selected={value === false}
        onPress={() => onChange(false)}
      />
    </View>
  );
}

function ScaleInput({
  value,
  min,
  max,
  onChange,
}: {
  value: number | undefined;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const nums = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  return (
    <View>
      <View style={styles.scaleRow}>
        {nums.map((n) => (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            accessibilityRole="button"
            style={[styles.scaleCell, value === n && styles.scaleCellOn]}
          >
            <Text variant="labelMd" style={value === n ? { color: colors.text.onPine } : undefined}>
              {n}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.scaleLabels}>
        <Text variant="labelSm" color="tertiary">
          Not at all
        </Text>
        <Text variant="labelSm" color="tertiary">
          Completely
        </Text>
      </View>
    </View>
  );
}

function NumberInput({
  value,
  placeholder,
  onChange,
}: {
  value: number | undefined;
  placeholder?: string;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <TextField
      value={value != null ? String(value) : ''}
      onChangeText={(t) => {
        const n = parseInt(t.replace(/[^0-9]/g, ''), 10);
        onChange(Number.isNaN(n) ? undefined : n);
      }}
      placeholder={placeholder ?? '0'}
      keyboardType="number-pad"
    />
  );
}

function UnitToggle({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.toggle}>
      {options.map((o) => (
        <Pressable
          key={o.value}
          onPress={() => onChange(o.value)}
          style={[styles.toggleItem, value === o.value && styles.toggleItemOn]}
        >
          <Text
            variant="labelMd"
            style={
              value === o.value ? { color: colors.text.onPine } : { color: colors.text.secondary }
            }
          >
            {o.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function HeightInput({
  valueCm,
  onChange,
}: {
  valueCm: number | undefined;
  onChange: (cm: number | undefined) => void;
}) {
  const [unit, setUnit] = useState<'ftin' | 'cm'>('ftin');
  const totalIn = valueCm != null ? valueCm / 2.54 : undefined;
  const feet = totalIn != null ? Math.floor(totalIn / 12) : undefined;
  const inches = totalIn != null ? Math.round(totalIn - (feet ?? 0) * 12) : undefined;

  const setFtIn = (f: number | undefined, i: number | undefined) => {
    if (f == null && i == null) return onChange(undefined);
    onChange(round(((f ?? 0) * 12 + (i ?? 0)) * 2.54, 1));
  };

  return (
    <View style={{ gap: spacing.md }}>
      <UnitToggle
        options={[
          { value: 'ftin', label: 'ft / in' },
          { value: 'cm', label: 'cm' },
        ]}
        value={unit}
        onChange={(v) => setUnit(v as 'ftin' | 'cm')}
      />
      {unit === 'ftin' ? (
        <View style={styles.dualRow}>
          <View style={{ flex: 1 }}>
            <NumberInput value={feet} placeholder="ft" onChange={(f) => setFtIn(f, inches)} />
          </View>
          <View style={{ flex: 1 }}>
            <NumberInput value={inches} placeholder="in" onChange={(i) => setFtIn(feet, i)} />
          </View>
        </View>
      ) : (
        <NumberInput
          value={valueCm != null ? Math.round(valueCm) : undefined}
          placeholder="cm"
          onChange={(c) => onChange(c)}
        />
      )}
    </View>
  );
}

function WeightInput({
  valueKg,
  unit,
  onChange,
}: {
  valueKg: number | undefined;
  unit: WeightUnit;
  onChange: (kg: number | undefined, unit: WeightUnit) => void;
}) {
  const display = valueKg != null ? round(kgToDisplay(valueKg, unit), 1) : undefined;
  return (
    <View style={{ gap: spacing.md }}>
      <UnitToggle
        options={[
          { value: 'lb', label: 'lb' },
          { value: 'kg', label: 'kg' },
        ]}
        value={unit}
        onChange={(u) => {
          // Keep the same body weight; just change the display unit.
          onChange(valueKg, u as WeightUnit);
        }}
      />
      <TextField
        value={display != null ? String(display) : ''}
        onChangeText={(t) => {
          const n = parseFloat(t.replace(/[^0-9.]/g, ''));
          onChange(Number.isNaN(n) ? undefined : round(displayToKg(n, unit), 3), unit);
        }}
        placeholder={unit === 'lb' ? 'e.g. 180' : 'e.g. 82'}
        keyboardType="decimal-pad"
      />
    </View>
  );
}

function TagListInput({
  value,
  placeholder,
  onChange,
}: {
  value: string[];
  placeholder?: string;
  onChange: (v: string[]) => void;
}) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setDraft('');
  };
  return (
    <View style={{ gap: spacing.md }}>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        onSubmitEditing={add}
        blurOnSubmit={false}
        returnKeyType="done"
        placeholder={placeholder ?? 'Type and press return'}
        placeholderTextColor={colors.text.tertiary}
        style={[styles.tagInput, typeStyle('bodyLg'), { color: colors.text.primary }]}
      />
      <View style={styles.chips}>
        {value.map((tag) => (
          <Pressable
            key={tag}
            onPress={() => onChange(value.filter((t) => t !== tag))}
            style={styles.chip}
          >
            <Text variant="labelMd">{tag}</Text>
            <Ionicons name="close" size={14} color={colors.text.tertiary} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ---- The switcher ----------------------------------------------------------------------------

export function StepInput({
  step,
  answers,
  setAnswer,
}: {
  step: OnboardingStepDef;
  answers: OnboardingAnswers;
  setAnswer: SetAnswer;
}): React.JSX.Element | null {
  const key = step.key;
  const val = key ? answers[key] : undefined;

  switch (step.kind) {
    case 'info':
      return null;
    case 'text':
      return (
        <TextField
          value={(val as string) ?? ''}
          onChangeText={(t) => key && setAnswer(key, t as never)}
          placeholder={step.placeholder}
          autoCapitalize="words"
          autoFocus
        />
      );
    case 'longtext':
      return (
        <TextField
          value={(val as string) ?? ''}
          onChangeText={(t) => key && setAnswer(key, t as never)}
          placeholder={step.placeholder}
          multiline
          numberOfLines={4}
        />
      );
    case 'number':
      return (
        <NumberInput
          value={val as number | undefined}
          onChange={(n) => key && setAnswer(key, n as never)}
        />
      );
    case 'scale':
      return (
        <ScaleInput
          value={val as number | undefined}
          min={step.min ?? 1}
          max={step.max ?? 10}
          onChange={(n) => key && setAnswer(key, n as never)}
        />
      );
    case 'height':
      return (
        <HeightInput
          valueCm={val as number | undefined}
          onChange={(c) => key && setAnswer(key, c as never)}
        />
      );
    case 'weight':
      return (
        <WeightInput
          valueKg={val as number | undefined}
          unit={answers.weightUnit ?? 'lb'}
          onChange={(kg, u) => {
            if (key) setAnswer(key, kg as never);
            setAnswer('weightUnit', u);
          }}
        />
      );
    case 'boolean':
      return (
        <BooleanInput
          value={val as boolean | undefined}
          onChange={(b) => key && setAnswer(key, b as never)}
        />
      );
    case 'single_select':
      return (
        <SingleSelect
          options={step.options ?? []}
          value={val as string | undefined}
          onChange={(v) => key && setAnswer(key, v as never)}
        />
      );
    case 'multi_select':
      return (
        <MultiSelect
          options={step.options ?? []}
          value={(val as string[]) ?? []}
          maxSelect={step.maxSelect}
          onChange={(v) => key && setAnswer(key, v as never)}
        />
      );
    case 'taglist':
      return (
        <TagListInput
          value={(val as string[]) ?? []}
          placeholder={step.placeholder}
          onChange={(v) => key && setAnswer(key, v as never)}
        />
      );
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  options: { gap: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.strong,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 58,
  },
  optionSelected: { borderColor: colors.brand.pine, backgroundColor: 'rgba(18, 56, 43, 0.05)' },
  optionEmoji: { fontSize: 20 },
  optionLabelSelected: { color: colors.brand.pine },
  check: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.strong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.brand.pine, borderColor: colors.brand.pine },
  scaleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  scaleCell: {
    width: '18%',
    aspectRatio: 1.1,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.strong,
    backgroundColor: colors.surface.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleCellOn: { backgroundColor: colors.brand.pine, borderColor: colors.brand.pine },
  scaleLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  dualRow: { flexDirection: 'row', gap: spacing.md },
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface.sunken,
    borderRadius: radius.pill,
    padding: 3,
    alignSelf: 'flex-start',
  },
  toggleItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  toggleItemOn: { backgroundColor: colors.brand.pine },
  tagInput: {
    backgroundColor: colors.surface.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.strong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 52,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface.sunken,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});
