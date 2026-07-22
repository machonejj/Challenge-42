import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '@challenge42/config';

export interface ProgressRingProps {
  /** 0–1. Clamped. */
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
}

/** Circular progress with a center slot (used for score / calories). Restrained, no glow. */
export function ProgressRing({
  progress,
  size = 132,
  strokeWidth = 12,
  color = colors.brand.pine,
  trackColor = colors.surface.sunken,
  children,
}: ProgressRingProps): React.JSX.Element {
  const clamped = Math.max(0, Math.min(1, progress));
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const dashoffset = circumference * (1 - clamped);
  const center = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={center}
          cy={center}
          r={r}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          // Start at 12 o'clock.
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View style={styles.center}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
