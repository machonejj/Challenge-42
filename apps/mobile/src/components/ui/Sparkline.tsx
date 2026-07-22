import { View } from 'react-native';
import Svg, { Polyline, Circle } from 'react-native-svg';
import { colors } from '@challenge42/config';

export interface SparklineProps {
  values: readonly number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
}

/** Minimal trend line (the smoothed weight series). No axes — a calm, glanceable shape. */
export function Sparkline({
  values,
  width = 140,
  height = 44,
  color = colors.status.positive,
  strokeWidth = 2,
}: SparklineProps): React.JSX.Element | null {
  if (values.length < 2) return null;
  const pad = strokeWidth + 1;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const stepX = (width - pad * 2) / (values.length - 1);

  const points = values
    .map((v, i) => {
      const x = pad + i * stepX;
      // Higher weight → higher on screen would be misleading; we just render the shape.
      const y = pad + (1 - (v - min) / span) * (height - pad * 2);
      return `${x},${y}`;
    })
    .join(' ');

  const lastX = pad + (values.length - 1) * stepX;
  const lastY = pad + (1 - (values[values.length - 1]! - min) / span) * (height - pad * 2);

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <Circle cx={lastX} cy={lastY} r={strokeWidth + 1.5} fill={color} />
      </Svg>
    </View>
  );
}
