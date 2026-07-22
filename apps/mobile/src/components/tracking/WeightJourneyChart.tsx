import { View } from 'react-native';
import Svg, { Line, Polyline, Polygon, Circle, Text as SvgText } from 'react-native-svg';
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
 * The 42-day weight journey: a dashed reference at the starting weight, a gentle *healthy* target
 * guide (from the conservative Target-Engine range — deliberately NOT an aggressive 10%), and the
 * user's carry-forward actual line.
 *
 * The y-axis is framed on the real data (start + readings), not on the far-away target — so early in
 * the challenge, when there's only a point or two, the data fills the chart instead of floating in
 * dead space. The target is shown as a clamped guide toward the bottom rather than stretching the
 * scale. Calm and non-judgmental.
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
  const padL = 12;
  const padR = 14;
  const padT = 22;
  const padB = 24;
  const plotW = Math.max(width - padL - padR, 10);
  const plotH = Math.max(height - padT - padB, 10);
  const plotBottom = padT + plotH;

  const actualKg = series.map((p) => p.weightKg);

  // Frame the y-axis on the DATA (start + readings) with headroom, so a single early reading fills
  // the chart. The target is deliberately NOT in the scale (it would drag the axis down and leave
  // the data floating up top); it's drawn as a clamped guide below.
  const hi = Math.max(startKg, ...actualKg);
  const lo = Math.min(startKg, ...actualKg);
  const spread = hi - lo;
  // A minimum span (~4% of body weight) so a tiny change isn't rendered as a dramatic cliff.
  const minSpan = Math.max(startKg * 0.04, 1);
  const spanAbove = Math.max(spread * 0.45, minSpan * 0.5);
  const spanBelow = Math.max(spread * 0.85, minSpan);
  const yMax = hi + spanAbove;
  const yMin = lo - spanBelow;

  const x = (day: number): number => padL + ((day - 1) / Math.max(totalDays - 1, 1)) * plotW;
  const yRaw = (kg: number): number => padT + (1 - (kg - yMin) / (yMax - yMin)) * plotH;
  const y = (kg: number): number => Math.min(Math.max(yRaw(kg), padT), plotBottom); // clamp to plot

  const startY = y(startKg);
  const pts = series.map((p) => ({ x: x(p.day), y: y(p.weightKg) }));
  const last = series[series.length - 1];

  const label = (kg: number): string => `${round(kgToDisplay(kg, unit), 0)} ${unit}`;

  // Area under the actual line → gives the line visual weight instead of a thin thread.
  const areaPoints =
    pts.length >= 1
      ? [
          `${pts[0]!.x},${plotBottom}`,
          ...pts.map((p) => `${p.x},${p.y}`),
          `${pts[pts.length - 1]!.x},${plotBottom}`,
        ].join(' ')
      : '';
  const linePoints = pts.map((p) => `${p.x},${p.y}`).join(' ');

  // Faint horizontal gridlines so the plot reads as an intentional chart, not an empty box.
  const gridYs = [0.25, 0.5, 0.75].map((f) => padT + f * plotH);

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        {gridYs.map((gy, i) => (
          <Line
            key={`g${i}`}
            x1={padL}
            y1={gy}
            x2={padL + plotW}
            y2={gy}
            stroke={colors.border.hairline}
            strokeWidth={1}
          />
        ))}

        {/* Healthy target guide (dashed gold), clamped into the frame so it never leaves the plot. */}
        {targetKg != null ? (
          <>
            <Line
              x1={x(1)}
              y1={startY}
              x2={x(totalDays)}
              y2={y(targetKg)}
              stroke={colors.brand.gold}
              strokeWidth={1.5}
              strokeDasharray="4 5"
            />
            <SvgText
              x={padL + plotW}
              y={Math.min(y(targetKg) + 13, plotBottom + 2)}
              fontSize={10}
              fill="#8A6D2B"
              textAnchor="end"
            >
              Target {label(targetKg)}
            </SvgText>
          </>
        ) : null}

        {/* Area fill + actual (carry-forward) line */}
        {pts.length >= 2 ? (
          <>
            <Polygon points={areaPoints} fill="rgba(18, 56, 43, 0.07)" />
            <Polyline
              points={linePoints}
              fill="none"
              stroke={colors.brand.pine}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </>
        ) : null}

        {/* Starting-weight reference (dashed) — drawn after the area so its label stays legible. */}
        <Line
          x1={padL}
          y1={startY}
          x2={padL + plotW}
          y2={startY}
          stroke={colors.border.strong}
          strokeWidth={1}
          strokeDasharray="3 4"
        />
        <SvgText x={padL} y={startY - 7} fontSize={10} fill={colors.text.tertiary}>
          Start {label(startKg)}
        </SvgText>

        {/* Latest reading marker + value label */}
        {last ? (
          <>
            <Circle
              cx={x(last.day)}
              cy={y(last.weightKg)}
              r={4.5}
              fill={colors.brand.pine}
              stroke={colors.surface.card}
              strokeWidth={2}
            />
            <SvgText
              x={Math.min(x(last.day) + 9, padL + plotW)}
              y={y(last.weightKg) - 9}
              fontSize={11}
              fontWeight="600"
              fill={colors.brand.pine}
              textAnchor={last.day >= totalDays - 3 ? 'end' : 'start'}
            >
              {label(last.weightKg)}
            </SvgText>
          </>
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
