/**
 * Device step sync. Reads the phone's step count so it can flow into the challenge automatically.
 *
 * Uses Expo's Pedometer, which is backed by CoreMotion on iOS (aggregates iPhone + Apple Watch) and
 * the hardware step counter on Android. It is FREE and needs no third-party service.
 *
 * On web there is no phone step data, so every call is a safe no-op and the app keeps using manual
 * "Log Steps". This module is deliberately the single seam for step data — a HealthKit / Health
 * Connect provider (for background delivery + full history) can be dropped in behind this same API
 * without touching the rest of the app.
 *
 * Note: `getStepCountAsync` for a past interval is reliable on iOS. On Android the historical query
 * isn't supported on all devices; when it isn't, we return null and fall back to manual logging (a
 * Health Connect provider is the follow-up to make Android history solid).
 */
import { Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';

export async function isStepSyncAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    return await Pedometer.isAvailableAsync();
  } catch {
    return false;
  }
}

/** Ask for motion/activity permission. Returns true if we may read steps. */
export async function requestStepPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const res = await Pedometer.requestPermissionsAsync();
    return res.granted;
  } catch {
    return false;
  }
}

export async function hasStepPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const res = await Pedometer.getPermissionsAsync();
    return res.granted;
  } catch {
    return false;
  }
}

/** Today's step count from the device, or null if unavailable / not permitted. */
export async function getTodayDeviceSteps(): Promise<number | null> {
  if (Platform.OS === 'web') return null;
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const result = await Pedometer.getStepCountAsync(start, new Date());
    return typeof result?.steps === 'number' ? result.steps : null;
  } catch {
    return null;
  }
}
