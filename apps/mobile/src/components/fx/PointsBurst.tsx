import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '@challenge42/config';
import { Text } from '@/components/ui/Text';
import { usePointsFxStore, type PointsFxEvent } from '@/features/points/pointsFx';

const STARS = 10;
const RADIUS = 96;

/** Full-screen, non-interactive celebration that pops whenever points are earned. */
export function PointsBurst(): React.JSX.Element | null {
  const event = usePointsFxStore((s) => s.event);
  const t = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState<PointsFxEvent | null>(null);

  useEffect(() => {
    if (!event) return;
    setShown(event);
    t.setValue(0);
    Animated.sequence([
      Animated.spring(t, { toValue: 1, friction: 6, tension: 130, useNativeDriver: false }),
      Animated.delay(650),
      Animated.timing(t, {
        toValue: 2,
        duration: 480,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start(({ finished }) => {
      if (finished) setShown(null);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id]);

  if (!shown) return null;

  const badgeScale = t.interpolate({ inputRange: [0, 1, 2], outputRange: [0.3, 1, 1] });
  const badgeOpacity = t.interpolate({ inputRange: [0, 0.3, 1.6, 2], outputRange: [0, 1, 1, 0] });
  const badgeY = t.interpolate({ inputRange: [1, 2], outputRange: [0, -84], extrapolate: 'clamp' });

  return (
    <View pointerEvents="none" style={styles.overlay}>
      {Array.from({ length: STARS }).map((_, i) => {
        const angle = (i / STARS) * Math.PI * 2;
        const dist = RADIUS + (i % 3) * 20;
        const x = t.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * dist] });
        const y = t.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(angle) * dist] });
        const op = t.interpolate({
          inputRange: [0, 0.2, 0.9, 1.2],
          outputRange: [0, 1, 1, 0],
          extrapolate: 'clamp',
        });
        const sc = t.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
        return (
          <Animated.Text
            key={i}
            style={[
              styles.star,
              { opacity: op, transform: [{ translateX: x }, { translateY: y }, { scale: sc }] },
            ]}
          >
            {i % 2 === 0 ? '⭐' : '✨'}
          </Animated.Text>
        );
      })}

      <Animated.View
        style={[
          styles.badge,
          { opacity: badgeOpacity, transform: [{ scale: badgeScale }, { translateY: badgeY }] },
        ]}
      >
        <Ionicons name="star" size={22} color="#1C1A15" />
        <Text variant="titleLg" style={styles.badgeText}>
          +{shown.points}
        </Text>
        <Text variant="labelMd" style={styles.badgeText}>
          pts
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  star: { position: 'absolute', fontSize: 24 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.brand.gold,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  badgeText: { color: '#1C1A15', fontWeight: '800' },
});
