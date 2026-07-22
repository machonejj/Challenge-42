import { useState } from 'react';
import { View, StyleSheet, type LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, radius } from '@challenge42/config';
import { LiveDot } from '@/components/ui/LiveDot';
import type { PresenceDot } from '@/features/live/mockPresence';

// Stylized continental-US silhouette (viewBox 100×62). Deliberately approximate — a "general
// location" map, not a zoomable street map, which keeps location privacy-safe by construction.
const US_PATH =
  'M8,12 L30,9 L50,8 L53,12 L57,10 L60,13 L63,9 L85,6 L93,7 L90,12 L86,18 L84,24 L85,31 ' +
  'L88,40 L89,52 L86,54 L83,45 L82,42 L74,44 L66,46 L60,45 L56,49 L52,55 L48,50 L40,49 ' +
  'L32,49 L22,47 L16,43 L12,34 L9,24 L7,16 Z';

/** Fills its parent's width; measures its real rendered size so dots position accurately. */
export function USPresenceMap({ dots }: { dots: readonly PresenceDot[] }): React.JSX.Element {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
  };

  return (
    <View style={styles.container} onLayout={onLayout}>
      <Svg width="100%" height="100%" viewBox="0 0 100 62" preserveAspectRatio="xMidYMid meet">
        <Path
          d={US_PATH}
          fill="rgba(18, 56, 43, 0.09)"
          stroke={colors.brand.pine}
          strokeOpacity={0.35}
          strokeWidth={0.7}
          strokeLinejoin="round"
        />
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
  container: { width: '100%', aspectRatio: 100 / 62, position: 'relative' },
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
