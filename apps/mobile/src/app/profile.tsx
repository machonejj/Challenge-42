import { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { brand, colors, radius, spacing, layout } from '@challenge42/config';
import type { WeightUnit } from '@challenge42/types';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Divider } from '@/components/ui/Divider';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useProfileStore } from '@/features/profile/profileStore';
import { useAuthStore } from '@/features/auth/authStore';
import { getAnalytics } from '@/services/analytics/AnalyticsService';

function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.segItem, on && styles.segItemOn]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
          >
            <Text
              variant="labelSm"
              style={{ color: on ? colors.text.onPine : colors.text.secondary }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function SettingBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.settingBlock}>
      <Text variant="labelMd" style={{ marginBottom: spacing.sm }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

export default function ProfileScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const store = useProfileStore();
  const signOut = useAuthStore((s) => s.signOut);
  const analytics = getAnalytics();

  const [displayName, setDisplayName] = useState(store.displayName ?? store.firstName ?? '');
  const [city, setCity] = useState(store.city ?? '');
  const [stateField, setStateField] = useState(store.state ?? '');
  const [unit, setUnit] = useState<WeightUnit>(store.weightUnit);

  const dirty =
    displayName !== (store.displayName ?? store.firstName ?? '') ||
    city !== (store.city ?? '') ||
    stateField !== (store.state ?? '') ||
    unit !== store.weightUnit;

  const savePrefs = () => {
    store.updatePreferences({
      displayName: displayName.trim() || null,
      city: city.trim() || null,
      state: stateField.trim() || null,
      weightUnit: unit,
    });
    analytics.track('PROFILE_UPDATED', { fields: ['displayName', 'city', 'state', 'weightUnit'] });
  };

  const changePrivacy = (setting: string, value: string, apply: () => void) => {
    apply();
    analytics.track('PRIVACY_SETTING_CHANGED', { setting, value });
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingBottom: insets.bottom + spacing['5xl'],
          paddingHorizontal: layout.screenGutter,
        }}
        showsVerticalScrollIndicator={false}
      >
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
          <Avatar name={displayName || 'You'} size={56} tone="gold" />
          <View style={{ flex: 1 }}>
            <Text variant="titleMd">{displayName || 'You'}</Text>
            <Text variant="bodyMd" color="secondary">
              {store.challengeName ?? 'Not enrolled yet'}
            </Text>
          </View>
        </Card>

        <Text variant="labelSm" color="tertiary" style={styles.sectionLabel}>
          YOUR DETAILS
        </Text>
        <Card style={{ gap: spacing.lg }}>
          <TextField
            label="DISPLAY NAME"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Name"
          />
          <TextField label="CITY" value={city} onChangeText={setCity} placeholder="City" />
          <TextField
            label="STATE / REGION"
            value={stateField}
            onChangeText={setStateField}
            placeholder="State"
          />
          <SettingBlock label="Weight units">
            <Segmented
              options={[
                { value: 'lb', label: 'Pounds (lb)' },
                { value: 'kg', label: 'Kilograms (kg)' },
              ]}
              value={unit}
              onChange={setUnit}
            />
          </SettingBlock>
          <Button label="Save changes" onPress={savePrefs} disabled={!dirty} />
        </Card>

        <Text variant="labelSm" color="tertiary" style={styles.sectionLabel}>
          PRIVACY · PRIVATE BY DEFAULT
        </Text>
        <Card style={{ gap: spacing.xl }}>
          <SettingBlock label="Profile visibility">
            <Segmented
              options={[
                { value: 'challenge', label: 'Challenge' },
                { value: 'team', label: 'Team' },
                { value: 'private', label: 'Private' },
              ]}
              value={store.privacy.profileVisibility}
              onChange={(v) =>
                changePrivacy('profileVisibility', v, () =>
                  store.updatePrivacy({ profileVisibility: v }),
                )
              }
            />
          </SettingBlock>
          <SettingBlock label="Map visibility">
            <Segmented
              options={[
                { value: 'hidden', label: 'Hidden' },
                { value: 'city', label: 'City' },
                { value: 'approximate', label: 'Approx.' },
              ]}
              value={store.privacy.mapVisibility}
              onChange={(v) =>
                changePrivacy('mapVisibility', v, () => store.updatePrivacy({ mapVisibility: v }))
              }
            />
          </SettingBlock>
          <SettingBlock label="Weight sharing">
            <Segmented
              options={[
                { value: 'private', label: 'Private' },
                { value: 'total_change', label: 'Total' },
                { value: 'percent_change', label: '%' },
              ]}
              value={store.privacy.weightSharing}
              onChange={(v) =>
                changePrivacy('weightSharing', v, () => store.updatePrivacy({ weightSharing: v }))
              }
            />
            <Text variant="labelSm" color="tertiary" style={{ marginTop: spacing.xs }}>
              Exact weight is never shared. Sharing only ever shows change, not your number.
            </Text>
          </SettingBlock>
          <SettingBlock label="Progress photos">
            <Segmented
              options={[
                { value: 'private', label: 'Private' },
                { value: 'shared', label: 'Shared' },
              ]}
              value={store.privacy.photoSharing}
              onChange={(v) =>
                changePrivacy('photoSharing', v, () => store.updatePrivacy({ photoSharing: v }))
              }
            />
          </SettingBlock>
        </Card>

        <Text variant="labelSm" color="tertiary" style={styles.sectionLabel}>
          NOTIFICATIONS
        </Text>
        <Card>
          <View style={styles.rowBetween}>
            <Text variant="bodyLg">Reminders & nudges</Text>
            <Text variant="labelSm" color="tertiary">
              Coming soon
            </Text>
          </View>
        </Card>

        <Text variant="labelSm" color="tertiary" style={styles.sectionLabel}>
          ABOUT
        </Text>
        <Card>
          <View style={styles.rowBetween}>
            <Text variant="bodyLg">{brand.name}</Text>
            <Text variant="bodyMd" color="tertiary">
              v0.2.0 · Phase 2
            </Text>
          </View>
          <Divider />
          <Text variant="bodyMd" color="secondary" style={{ marginTop: spacing.md }}>
            {brand.legal.disclaimer}
          </Text>
        </Card>

        <View style={{ marginTop: spacing['2xl'] }}>
          <Button
            label="Sign out"
            variant="secondary"
            icon="log-out-outline"
            onPress={() => {
              router.back();
              void signOut();
            }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface.background },
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
  settingBlock: {},
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.surface.sunken,
    borderRadius: radius.pill,
    padding: 3,
    gap: 2,
  },
  segItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  segItemOn: { backgroundColor: colors.brand.pine },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
