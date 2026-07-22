/**
 * Cross-device sync. When Supabase is configured and the user is signed in, the app's local state
 * (profile, onboarding, weight, food, activity) is synced to a per-user `user_app_state` document:
 * pulled on sign-in, pushed (debounced) on change. Last-write-wins — fine for a single user across
 * their own devices. No-op when Supabase isn't configured (local-only dev mode).
 *
 * Interim mechanism for the pilot; normalized tables remain for server-side analytics later.
 */
import { supabase } from '@/services/supabase/client';
import { useProfileStore } from '@/features/profile/profileStore';
import { useOnboardingStore } from '@/features/onboarding/onboardingStore';
import { useWeightStore } from '@/features/tracking/weightStore';
import { useFoodLogStore } from '@/features/tracking/foodLogStore';
import { useActivityStore } from '@/features/activity/activityStore';

interface AppStateBlob {
  v: number;
  profile?: Record<string, unknown>;
  onboarding?: Record<string, unknown>;
  weight?: Record<string, unknown>;
  food?: Record<string, unknown>;
  activity?: Record<string, unknown>;
}

function collectState(): AppStateBlob {
  const p = useProfileStore.getState();
  const o = useOnboardingStore.getState();
  const w = useWeightStore.getState();
  const f = useFoodLogStore.getState();
  const a = useActivityStore.getState();
  return {
    v: 1,
    profile: {
      enrolled: p.enrolled,
      firstName: p.firstName,
      displayName: p.displayName,
      city: p.city,
      state: p.state,
      weightUnit: p.weightUnit,
      challengeId: p.challengeId,
      challengeName: p.challengeName,
      challengeStartDate: p.challengeStartDate,
      challengeLengthDays: p.challengeLengthDays,
      startWeightKg: p.startWeightKg,
      latestWeightKg: p.latestWeightKg,
      recommendation: p.recommendation,
      safetyStatus: p.safetyStatus,
      privacy: p.privacy,
    },
    onboarding: { answers: o.answers, currentStepId: o.currentStepId, status: o.status },
    weight: { entries: w.entries },
    food: { entries: f.entries },
    activity: { sessions: a.sessions },
  };
}

function hydrate(blob: AppStateBlob): void {
  if (blob.profile) useProfileStore.setState(blob.profile as never);
  if (blob.onboarding) useOnboardingStore.setState(blob.onboarding as never);
  if (blob.weight) useWeightStore.setState(blob.weight as never);
  if (blob.food) useFoodLogStore.setState(blob.food as never);
  if (blob.activity) useActivityStore.setState(blob.activity as never);
}

function isMeaningful(blob: AppStateBlob | null): boolean {
  if (!blob) return false;
  const onboardingDone =
    (blob.onboarding as { status?: string } | undefined)?.status === 'COMPLETED';
  const enrolled = (blob.profile as { enrolled?: boolean } | undefined)?.enrolled === true;
  const food = ((blob.food as { entries?: unknown[] } | undefined)?.entries?.length ?? 0) > 0;
  const weight = ((blob.weight as { entries?: unknown[] } | undefined)?.entries?.length ?? 0) > 0;
  return onboardingDone || enrolled || food || weight;
}

async function pull(userId: string): Promise<AppStateBlob | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('user_app_state')
    .select('state')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return data.state as AppStateBlob;
}

async function push(userId: string): Promise<void> {
  if (!supabase) return;
  await supabase
    .from('user_app_state')
    .upsert({ user_id: userId, state: collectState(), updated_at: new Date().toISOString() });
}

let unsubscribers: Array<() => void> = [];
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let activeUserId: string | null = null;

function schedulePush(userId: string): void {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    void push(userId);
  }, 900);
}

/** Begin syncing for a signed-in user. Idempotent per user. */
export async function startCloudSync(userId: string): Promise<void> {
  if (!supabase || activeUserId === userId) return;
  stopCloudSync();
  activeUserId = userId;

  const remote = await pull(userId);
  if (isMeaningful(remote)) {
    hydrate(remote!);
  } else {
    await push(userId); // first device / fresh account → seed the cloud from local
  }

  const stores = [
    useProfileStore,
    useOnboardingStore,
    useWeightStore,
    useFoodLogStore,
    useActivityStore,
  ];
  unsubscribers = stores.map((s) => s.subscribe(() => schedulePush(userId)));
}

export function stopCloudSync(): void {
  unsubscribers.forEach((u) => u());
  unsubscribers = [];
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
  activeUserId = null;
}
