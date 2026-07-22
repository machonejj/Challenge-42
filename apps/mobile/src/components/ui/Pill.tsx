import { View, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '@challenge42/config';
import { Text } from './Text';

export type PillTone = 'live' | 'gold' | 'neutral' | 'online' | 'pineOutline';

export interface PillProps {
  label: string;
  tone?: PillTone;
  /** Optional leading dot (used for LIVE / online states). */
  dot?: boolean;
}

const TONES: Record<PillTone, { bg: string; fg: string; dot: string }> = {
  live: { bg: 'rgba(215, 74, 67, 0.12)', fg: colors.brand.live, dot: colors.brand.live },
  gold: { bg: 'rgba(201, 166, 91, 0.16)', fg: '#8A6D2B', dot: colors.brand.gold },
  neutral: { bg: colors.surface.sunken, fg: colors.text.secondary, dot: colors.text.tertiary },
  online: { bg: 'rgba(51, 185, 106, 0.14)', fg: '#1F7A46', dot: colors.status.online },
  pineOutline: { bg: 'transparent', fg: colors.text.onPineMuted, dot: colors.status.online },
};

/** Small status/label chip (LIVE, HIGH PROTEIN, N online, …). */
export function Pill({ label, tone = 'neutral', dot = false }: PillProps): React.JSX.Element {
  const t = TONES[tone];
  return (
    <View style={[styles.pill, { backgroundColor: t.bg }]}>
      {dot ? <View style={[styles.dot, { backgroundColor: t.dot }]} /> : null}
      <Text variant="labelSm" style={{ color: t.fg }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    gap: spacing.xs,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
  },
});
