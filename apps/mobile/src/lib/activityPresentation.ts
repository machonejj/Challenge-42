import { Ionicons } from '@expo/vector-icons';
import { colors } from '@challenge42/config';
import type { PresenceStatus } from '@challenge42/types';

type IconName = keyof typeof Ionicons.glyphMap;

const MAP: Record<PresenceStatus, { label: string; color: string; icon: IconName }> = {
  RUNNING: { label: 'Running', color: colors.activity.running, icon: 'walk' },
  WALKING: { label: 'Walking', color: colors.activity.walking, icon: 'walk-outline' },
  WORKING_OUT: { label: 'Working Out', color: colors.activity.workout, icon: 'barbell-outline' },
  CYCLING: { label: 'Cycling', color: colors.activity.cycling, icon: 'bicycle-outline' },
  OTHER_ACTIVITY: { label: 'Active', color: colors.activity.other, icon: 'pulse-outline' },
  ONLINE: { label: 'Online', color: colors.status.online, icon: 'ellipse' },
  OFFLINE: { label: 'Offline', color: colors.text.tertiary, icon: 'ellipse-outline' },
};

export function presence(status: PresenceStatus) {
  return MAP[status];
}

export function isTimedActivity(status: PresenceStatus): boolean {
  return status === 'WORKING_OUT' || status === 'OTHER_ACTIVITY' || status === 'CYCLING';
}
