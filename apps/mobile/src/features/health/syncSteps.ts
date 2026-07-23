/**
 * Pulls today's device step count into the steps store when the user has opted in and granted
 * permission. Safe to call anywhere (app open, opening the steps screen) — it no-ops on web, when
 * sync is off, or when permission is missing.
 */
import { useStepsStore } from '@/features/tracking/stepsStore';
import { getTodayDeviceSteps, hasStepPermission } from './healthSteps';

export async function syncStepsFromDevice(): Promise<void> {
  const store = useStepsStore.getState();
  if (!store.syncEnabled) return;
  if (!(await hasStepPermission())) return;
  const steps = await getTodayDeviceSteps();
  if (steps != null) store.syncDeviceSteps(steps);
}
