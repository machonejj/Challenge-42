import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { colors, motion, radius } from '@challenge42/config';
import { useReducedMotion } from '@/lib/useReducedMotion';

export interface LiveDotProps {
  color?: string;
  size?: number;
  /** Slow, subtle pulse for genuine liveness. Honors reduce-motion. */
  pulse?: boolean;
}

/** Illuminated presence indicator. Used for online / live / activity states. */
export function LiveDot({
  color = colors.status.online,
  size = 10,
  pulse = true,
}: LiveDotProps): React.JSX.Element {
  const reduced = useReducedMotion();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!pulse || reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: motion.duration.pulse,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim, pulse, reduced]);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {pulse && !reduced ? (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: radius.pill, backgroundColor: color, transform: [{ scale }], opacity },
          ]}
        />
      ) : null}
      <View
        style={{ width: size, height: size, borderRadius: radius.pill, backgroundColor: color }}
      />
    </View>
  );
}
