import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, layout } from '@challenge42/config';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Divider } from '@/components/ui/Divider';
import { useAccessStore } from '@/features/admin/accessStore';
import { useChallengeStore } from '@/features/challenge/challengeStore';
import {
  listMembers,
  listAllowlist,
  addAllowlist,
  removeAllowlist,
  setDisabled,
  setChallenge,
  type Member,
  type AllowlistEntry,
} from '@/features/admin/adminService';

const DAY = 24 * 60 * 60 * 1000;
function toYMD(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`;
}
function fromYMD(s: string | null): number {
  if (!s) return new Date().setHours(0, 0, 0, 0);
  return new Date(`${s}T00:00:00`).getTime();
}
function prettyDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function AdminScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isAdmin = useAccessStore((s) => s.isAdmin);

  const [members, setMembers] = useState<Member[]>([]);
  const [allow, setAllow] = useState<AllowlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const challengeStart = useChallengeStore((s) => s.startDate);
  const challengeLength = useChallengeStore((s) => s.lengthDays);
  const [startMs, setStartMs] = useState(() => fromYMD(challengeStart));
  const [weeks, setWeeks] = useState(() => Math.max(Math.round(challengeLength / 7), 1));
  const [savedAt, setSavedAt] = useState(false);

  useEffect(() => {
    setStartMs(fromYMD(challengeStart));
    setWeeks(Math.max(Math.round(challengeLength / 7), 1));
  }, [challengeStart, challengeLength]);

  const saveChallenge = async (): Promise<void> => {
    setBusy('challenge');
    setError(null);
    setSavedAt(false);
    const err = await setChallenge(toYMD(startMs), weeks * 7);
    if (err) setError(err);
    else {
      await useChallengeStore.getState().refresh();
      setSavedAt(true);
    }
    setBusy(null);
  };

  const load = useCallback(async () => {
    setLoading(true);
    const [m, a] = await Promise.all([listMembers(), listAllowlist()]);
    setMembers(m);
    setAllow(a);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleDisabled = async (m: Member): Promise<void> => {
    setBusy(m.userId);
    setError(null);
    const err = await setDisabled(m.userId, !m.disabled);
    if (err) setError(err);
    await load();
    setBusy(null);
  };

  const invite = async (): Promise<void> => {
    const email = newEmail.trim().toLowerCase();
    if (!email.includes('@')) {
      setError('Enter a valid email.');
      return;
    }
    setBusy('invite');
    setError(null);
    const err = await addAllowlist(email);
    if (err) setError(err);
    else setNewEmail('');
    await load();
    setBusy(null);
  };

  const uninvite = async (email: string): Promise<void> => {
    setBusy(email);
    setError(null);
    const err = await removeAllowlist(email);
    if (err) setError(err);
    await load();
    setBusy(null);
  };

  const header = (
    <View style={styles.header}>
      <Text variant="titleLg">Admin</Text>
      <Pressable
        onPress={() => router.back()}
        hitSlop={8}
        style={styles.close}
        accessibilityLabel="Close"
      >
        <Ionicons name="close" size={20} color={colors.text.secondary} />
      </Pressable>
    </View>
  );

  if (!isAdmin) {
    return (
      <View style={[styles.root, styles.centered, { paddingTop: insets.top + spacing.md }]}>
        <StatusBar style="dark" />
        {header}
        <Ionicons name="lock-closed-outline" size={28} color={colors.text.tertiary} />
        <Text variant="titleMd" style={{ marginTop: spacing.md }}>
          Admins only
        </Text>
        <Text variant="bodyMd" color="secondary" align="center" style={{ marginTop: spacing.xs }}>
          This area is for challenge admins. Ask the owner to grant you access.
        </Text>
      </View>
    );
  }

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
          paddingBottom: insets.bottom + spacing['4xl'],
          paddingHorizontal: layout.screenGutter,
        }}
      >
        {header}

        {error ? (
          <View style={styles.errorBox}>
            <Text variant="labelSm" style={{ color: colors.status.danger }}>
              {error}
            </Text>
          </View>
        ) : null}

        {/* Challenge dates */}
        <Text variant="labelSm" color="tertiary" style={styles.sectionLabel}>
          CHALLENGE
        </Text>
        <Card style={{ gap: spacing.md }}>
          <Text variant="bodyMd" color="secondary">
            Everyone runs the same window. Set when the challenge begins.
          </Text>
          <View style={styles.dateBox}>
            <Text variant="labelSm" color="tertiary">
              START DATE
            </Text>
            <Text variant="titleLg">{prettyDate(startMs)}</Text>
          </View>
          <View style={styles.stepRow}>
            {[
              { l: '−1 wk', d: -7 },
              { l: '−1 d', d: -1 },
              { l: '+1 d', d: 1 },
              { l: '+1 wk', d: 7 },
            ].map((b) => (
              <Pressable
                key={b.l}
                onPress={() => setStartMs((m) => m + b.d * DAY)}
                style={styles.stepChip}
              >
                <Text variant="labelSm">{b.l}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.lenRow}>
            <Text variant="labelMd" style={{ flex: 1 }}>
              Length
            </Text>
            <Pressable
              onPress={() => setWeeks((w) => Math.max(w - 1, 1))}
              style={styles.lenBtn}
              accessibilityLabel="Fewer weeks"
            >
              <Ionicons name="remove" size={18} color={colors.text.onPine} />
            </Pressable>
            <Text variant="labelMd" style={styles.lenValue}>
              {weeks} wk
            </Text>
            <Pressable
              onPress={() => setWeeks((w) => Math.min(w + 1, 12))}
              style={styles.lenBtn}
              accessibilityLabel="More weeks"
            >
              <Ionicons name="add" size={18} color={colors.text.onPine} />
            </Pressable>
          </View>
          <Text variant="labelSm" color="tertiary">
            Day 1 is {prettyDate(startMs)} · ends {prettyDate(startMs + (weeks * 7 - 1) * DAY)}
          </Text>
          <Button
            label="Save challenge dates"
            onPress={saveChallenge}
            loading={busy === 'challenge'}
          />
          {savedAt ? (
            <Text variant="labelSm" style={{ color: colors.status.positive }}>
              Saved — everyone’s dates are updated.
            </Text>
          ) : null}
        </Card>

        {/* Invite allowlist */}
        <Text variant="labelSm" color="tertiary" style={styles.sectionLabel}>
          INVITE PEOPLE
        </Text>
        <Card style={{ gap: spacing.md }}>
          <Text variant="bodyMd" color="secondary">
            Only emails on this list can create an account.
          </Text>
          <View style={styles.inviteRow}>
            <View style={{ flex: 1 }}>
              <TextField
                value={newEmail}
                onChangeText={setNewEmail}
                placeholder="name@email.com"
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            <Button
              label="Invite"
              onPress={invite}
              loading={busy === 'invite'}
              style={styles.inviteBtn}
            />
          </View>
          {allow.length > 0 ? (
            <View>
              {allow.map((a, i) => (
                <View key={a.email}>
                  {i > 0 ? <Divider /> : null}
                  <View style={styles.row}>
                    <Text variant="bodyMd" style={{ flex: 1 }} numberOfLines={1}>
                      {a.email}
                    </Text>
                    <Pressable
                      onPress={() => uninvite(a.email)}
                      hitSlop={8}
                      disabled={busy === a.email}
                      accessibilityLabel={`Remove invite for ${a.email}`}
                      style={styles.iconBtn}
                    >
                      <Ionicons name="close" size={16} color={colors.text.tertiary} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          ) : null}
        </Card>

        {/* Members */}
        <Text variant="labelSm" color="tertiary" style={styles.sectionLabel}>
          MEMBERS {members.length ? `· ${members.length}` : ''}
        </Text>
        {loading ? (
          <Card style={styles.centeredCard}>
            <ActivityIndicator color={colors.brand.pine} />
          </Card>
        ) : members.length === 0 ? (
          <Card>
            <Text variant="bodyMd" color="secondary">
              No one has signed up yet. Invite people above.
            </Text>
          </Card>
        ) : (
          <Card padded={false}>
            <View style={styles.list}>
              {members.map((m, i) => (
                <View key={m.userId}>
                  {i > 0 ? <Divider /> : null}
                  <View style={styles.memberRow}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.nameRow}>
                        <Text variant="labelMd" numberOfLines={1}>
                          {m.displayName ?? m.email ?? 'Challenger'}
                        </Text>
                        {m.isAdmin ? (
                          <View style={styles.adminPill}>
                            <Text variant="labelSm" style={styles.adminPillText}>
                              ADMIN
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Text variant="labelSm" color="tertiary" numberOfLines={1}>
                        {m.email ?? '—'}
                        {m.state ? ` · ${m.state}` : ''}
                        {m.disabled ? ' · access off' : ''}
                      </Text>
                    </View>
                    {m.isAdmin ? (
                      <Text variant="labelSm" color="tertiary">
                        —
                      </Text>
                    ) : (
                      <Pressable
                        onPress={() => toggleDisabled(m)}
                        disabled={busy === m.userId}
                        style={[styles.accessBtn, m.disabled ? styles.accessOn : styles.accessOff]}
                        accessibilityLabel={`${m.disabled ? 'Restore' : 'Disable'} access for ${m.displayName ?? m.email}`}
                      >
                        <Text
                          variant="labelSm"
                          style={{ color: m.disabled ? colors.text.onPine : colors.status.danger }}
                        >
                          {busy === m.userId ? '…' : m.disabled ? 'Restore' : 'Disable'}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface.background },
  centered: { alignItems: 'center', paddingHorizontal: layout.screenGutter },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    alignSelf: 'stretch',
  },
  close: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surface.sunken,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: { marginTop: spacing['2xl'], marginBottom: spacing.sm },
  dateBox: {
    backgroundColor: colors.surface.sunken,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 2,
    alignItems: 'center',
  },
  stepRow: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' },
  stepChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface.sunken,
  },
  lenRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  lenBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.pine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lenValue: { minWidth: 56, textAlign: 'center' },
  errorBox: {
    backgroundColor: 'rgba(184, 62, 62, 0.08)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  inviteRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  inviteBtn: { paddingHorizontal: spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface.sunken,
  },
  list: { paddingHorizontal: spacing.lg },
  centeredCard: { alignItems: 'center', paddingVertical: spacing.xl },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  adminPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.gold,
  },
  adminPillText: { color: '#1C1A15', fontWeight: '700', fontSize: 9, letterSpacing: 0.5 },
  accessBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    minWidth: 74,
    alignItems: 'center',
  },
  accessOff: { backgroundColor: 'rgba(184, 62, 62, 0.10)' },
  accessOn: { backgroundColor: colors.brand.pine },
});
