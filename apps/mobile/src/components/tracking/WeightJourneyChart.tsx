import { View } from 'react-native';
import Svg, { Line, Polyline, Circle, Text as SvgText } from 'react-native-svg';
import { colors } from '@challenge42/config';
import { kgToDisplay, round, type DailyWeightPoint } from '@challenge42/domain';
import type { WeightUnit } from '@challenge42/types';

export interface WeightJourneyChartProps {
  series: readonly DailyWeightPoint[]; // carry-forward actuals (kg)
  startKg: number;
  /** Healthy 42-day target weight (start − conservative range). Drawn as a gentle guide, not a promise. */
  targetKg: number | null;
  totalDays: number;
  unit: WeightUnit;
  width: number;
  height?: number;
}

/**
 * The 42-day weight journey: a dashed line at the starting weight, a gentle downward *healthy* target
 * guide (from the conservative Target-Engine range — deliberately NOT an aggressive 10%), and the
 * user's carry-forward actual line. Calm and non-judgmental.
 */
export function WeightJourneyChart({
  series,
  startKg,
  targetKg,
  totalDays,
  unit,
  width,
  height = 190,
}: WeightJourneyChartProps): React.JSX.Element {
  const padL = 10;
  const padR = 12;
  const padT = 18;
  const padB = 22;
  const plotW = Math.max(width - padL - padR, 10);
  const plotH = Math.max(height - padT - padB, 10);

  const actualKg = series.map((p) => p.weightKg);
  const candidates = [startKg, ...(targetKg != null ? [targetKg] : []), ...actualKg];
  let yMin = Math.min(...candidates);
  let yMax = Math.max(...candidates);
  const range = yMax - yMin || 1;
  yMin -= range * 0.12;
  yMax += range * 0.12;

  const x = (day: number) => padL + ((day - 1) / Math.max(totalDays - 1, 1)) * plotW;
  const y = (kg: number) => padT + (1 - (kg - yMin) / (yMax - yMin)) * plotH;

  const startY = y(startKg);
  const actualPoints = series.map((p) => `${x(p.day)},${y(p.weightKg)}`).join(' ');
  const last = series[series.length - 1];

  const label = (kg: number) => `${round(kgToDisplay(kg, unit), 0)} ${unit}`;

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        {/* Starting-weight reference (dashed) */}
        <Line
          x1={padL}
          y1={startY}
          x2={padL + plotW}
          y2={startY}
          stroke={colors.border.strong}
          strokeWidth={1}
          strokeDasharray="3 4"
        />
        <SvgText x={padL} y={startY - 6} fontSize={10} fill={colors.text.tertiary}>
          Start {label(startKg)}
        </SvgText>

        {/* Healthy target guide (dashed gold) */}
        {targetKg != null ? (
          <>
            <Line
              x1={x(1)}
              y1={startY}
              x2={x(totalDays)}
              y2={y(targetKg)}
              stroke={colors.brand.gold}
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
            <SvgText
              x={padL + plotW}
              y={y(targetKg) - 6}
              fontSize={10}
              fill="#8A6D2B"
              textAnchor="end"
            >
              Healthy target {label(targetKg)}
            </SvgText>
          </>
        ) : null}

        {/* Actual (carry-forward) */}
        {series.length >= 2 ? (
          <Polyline
            points={actualPoints}
            fill="none"
            stroke={colors.brand.pine}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ) : null}
        {last ? (
          <Circle cx={x(last.day)} cy={y(last.weightKg)} r={4} fill={colors.brand.pine} />
        ) : null}

        {/* Day axis */}
        <SvgText x={padL} y={height - 6} fontSize={10} fill={colors.text.tertiary}>
          Day 1
        </SvgText>
        <SvgText
          x={padL + plotW}
          y={height - 6}
          fontSize={10}
          fill={colors.text.tertiary}
          textAnchor="end"
        >
          Day {totalDays}
        </SvgText>
      </Svg>
    </View>
  );
}
