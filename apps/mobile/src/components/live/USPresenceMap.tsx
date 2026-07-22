import { useState } from 'react';
import { View, StyleSheet, type LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, radius } from '@challenge42/config';
import { LiveDot } from '@/components/ui/LiveDot';
import type { PresenceDot } from '@/features/live/mockPresence';
import { US_STATE_PATHS, US_VIEWBOX } from '@/features/live/usMapData';

// Accurate continental-US map (state borders, Albers-USA) in a 960×600 viewBox. Dots are projected
// through the same projection, so they land at the right cities — still city-level only (privacy).
const ASPECT = 960 / 600;

export function USPresenceMap({ dots }: { dots: readonly PresenceDot[] }): React.JSX.Element {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
  };

  return (
    <View style={styles.container} onLayout={onLayout}>
      <Svg width="100%" height="100%" viewBox={US_VIEWBOX} preserveAspectRatio="xMidYMid meet">
        {US_STATE_PATHS.map((d, i) => (
          <Path
            key={i}
            d={d}
            fill="rgba(18, 56, 43, 0.07)"
            stroke={colors.brand.pine}
            strokeOpacity={0.28}
            strokeWidth={0.8}
            strokeLinejoin="round"
          />
        ))}
      </Svg>

      {size.w > 0
        ? dots.map((d) => {
            const posted = Boolean(d.submission);
            return (
              <View
                key={d.id}
                style={[styles.dotWrap, { left: d.x * size.w - 10, top: d.y * size.h - 10 }]}
                accessibilityLabel={`${d.name}, ${d.city} — ${d.online ? 'online' : 'offline'}`}
              >
                <View style={[styles.ring, posted && styles.ringPosted]}>
                  {d.online ? <LiveDot size={10} /> : <View style={styles.offline} />}
                </View>
              </View>
            );
          })
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', aspectRatio: ASPECT, position: 'relative' },
  dotWrap: {
    position: 'absolute',
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPosted: {
    borderWidth: 1.5,
    borderColor: colors.brand.gold,
    backgroundColor: 'rgba(201, 166, 91, 0.14)',
  },
  offline: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.text.tertiary,
  },
});
