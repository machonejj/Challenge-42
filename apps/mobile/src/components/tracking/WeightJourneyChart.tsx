import { useState } from 'react';
import { View, StyleSheet, type LayoutChangeEvent } from 'react-native';
import Svg, { Line, Polyline, Polygon, Circle, Text as SvgText } from 'react-native-svg';
import { colors, spacing } from '@challenge42/config';
import { kgToDisplay, round, type DailyWeightPoint } from '@challenge42/domain';
import type { WeightUnit } from '@challenge42/types';
import { Text } from '@/components/ui/Text';

export interface WeightJourneyChartProps {
  series: readonly DailyWeightPoint[]; // daily carry-forward series; actual weigh-ins have hasReading
  startKg: number;
  /** Healthy 42-day goal weight (start − conservative range). A reference line, not a promise. */
  targetKg: number | null;
  totalDays: number;
  unit: WeightUnit;
  height?: number;
}

const STROKE = '#c9c3b5';

/**
 * The weight journey: each actual weigh-in is a clear point, connected into a trend line, framed
 * between a dashed "start" reference and a dashed gold "goal" line. Weigh-ins are spread across the
 * full width (first → latest) so the chart always reads well — one point sits centered, many points
 * fill the plot. Start/goal labels live in a legend below the plot, so text never overlaps the data.
 *
 * The chart measures its OWN container width (never the window) so it always fits its card — on the
 * web the app sits in a narrow phone frame, so a window-derived width would overflow the card.
 */
export function WeightJourneyChart({
  series,
  startKg,
  targetKg,
  unit,
  height = 176,
}: WeightJourneyChartProps): React.JSX.Element {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent): void => setWidth(e.nativeEvent.layout.width);

  const padL = 12;
  const padR = 14;
  const padT = 16;
  const padB = 20;
  const plotW = Math.max(width - padL - padR, 10);
  const plotH = Math.max(height - padT - padB, 10);
  const plotBottom = padT + plotH;

  const reads = series.filter((p) => p.hasReading);
  const vals = reads.length ? reads.map((p) => p.weightKg) : [startKg];

  // Frame vertically between start (top) and goal (bottom), expanding for any readings beyond them.
  const top = Math.max(startKg, ...vals);
  const bot = Math.min(...(targetKg != null ? [targetKg] : []), ...vals);
  const span = Math.max(top - bot, Math.max(startKg * 0.03, 1));
  const m = span * 0.14;
  const yMax = top + m;
  const yMin = bot - m;

  const first = reads.length ? reads[0]!.day : 1;
  const lastD = reads.length ? reads[reads.length - 1]!.day : 1;
  const single = first === lastD;
  const x = (day: number): number =>
    single ? padL + plotW / 2 : padL + ((day - first) / (lastD - first)) * plotW;
  const y = (kg: number): number =>
    Math.min(Math.max(padT + (1 - (kg - yMin) / (yMax - yMin)) * plotH, padT), plotBottom);

  const startY = y(startKg);
  const pts = reads.map((p) => ({ x: x(p.day), y: y(p.weightKg) }));
  const linePoints = pts.map((p) => `${p.x},${p.y}`).join(' ');
  const areaPoints = pts.length
    ? [
        `${pts[0]!.x},${plotBottom}`,
        ...pts.map((p) => `${p.x},${p.y}`),
        `${pts[pts.length - 1]!.x},${plotBottom}`,
      ].join(' ')
    : '';

  const label = (kg: number): string => `${round(kgToDisplay(kg, unit), 0)} ${unit}`;
  const gridYs = [0.33, 0.66].map((f) => padT + f * plotH);

  return (
    <View style={styles.container} onLayout={onLayout}>
      {width > 0 ? (
        <>
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

            {/* Goal reference (dashed gold, horizontal) */}
            {targetKg != null ? (
              <Line
                x1={padL}
                y1={y(targetKg)}
                x2={padL + plotW}
                y2={y(targetKg)}
                stroke={colors.brand.gold}
                strokeWidth={1.5}
                strokeDasharray="5 5"
              />
            ) : null}

            {/* Trend area + line */}
            {pts.length >= 2 ? (
              <>
                <Polygon points={areaPoints} fill="rgba(18, 56, 43, 0.06)" />
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

            {/* Start reference (dashed) */}
            <Line
              x1={padL}
              y1={startY}
              x2={padL + plotW}
              y2={startY}
              stroke={STROKE}
              strokeWidth={1}
              strokeDasharray="3 4"
            />

            {/* Each actual weigh-in as a clear point */}
            {pts.map((p, i) => (
              <Circle
                key={`p${i}`}
                cx={p.x}
                cy={p.y}
                r={4.5}
                fill={colors.brand.pine}
                stroke={colors.surface.card}
                strokeWidth={2.5}
              />
            ))}

            {/* Day axis */}
            <SvgText x={padL} y={height - 4} fontSize={10} fill={colors.text.tertiary}>
              Day {first}
            </SvgText>
            {!single ? (
              <SvgText
                x={padL + plotW}
                y={height - 4}
                fontSize={10}
                fill={colors.text.tertiary}
                textAnchor="end"
              >
                Day {lastD}
              </SvgText>
            ) : null}
          </Svg>

          <View style={styles.legend}>
            <LegendItem color={STROKE} label={`Start ${label(startKg)}`} />
            {targetKg != null ? (
              <LegendItem color={colors.brand.gold} label={`Goal ${label(targetKg)}`} />
            ) : null}
          </View>
        </>
      ) : null}
    </View>
  );
}

function LegendItem({ color, label }: { color: string; label: string }): React.JSX.Element {
  return (
    <View style={styles.legendItem}>
      <Svg width={16} height={2}>
        <Line x1={0} y1={1} x2={16} y2={1} stroke={color} strokeWidth={2} strokeDasharray="3 3" />
      </Svg>
      <Text variant="labelSm" color="secondary">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', minHeight: 176 },
  legend: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
