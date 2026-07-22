import { useEffect, useRef, useState } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand, colors, radius, spacing } from '@challenge42/config';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { useReducedMotion } from '@/lib/useReducedMotion';

interface Slide {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
}

const SLIDES: Slide[] = [
  {
    eyebrow: brand.name.toUpperCase(),
    title: '42 days.\nOne reset.',
    body: 'A healthier version of your life starts here.',
    cta: 'Get started',
  },
  {
    eyebrow: 'BUILT FOR REAL LIFE',
    title: 'Made for\nreal life.',
    body: 'Simple meals. Workouts that fit your schedule. People doing it right alongside you.',
    cta: 'Continue',
  },
  {
    eyebrow: 'TOGETHER',
    title: 'You’re not\ndoing this alone.',
    body: 'Track your progress. See the challenge happening live. Build consistency for 42 days.',
    cta: 'Create account',
  },
];

export default function Welcome(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

  // Cross-fade when the slide changes.
  useEffect(() => {
    if (reduced) return;
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [index, fade, reduced]);

  const slide = SLIDES[index]!;

  const onPressCta = () => {
    if (index < SLIDES.length - 1) setIndex((i) => i + 1);
    else router.push('/(auth)/sign-up');
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Animated.View
        style={[styles.slide, { paddingTop: insets.top + spacing['5xl'], opacity: fade }]}
      >
        <Text variant="labelSm" style={styles.eyebrow}>
          {slide.eyebrow}
        </Text>
        <Text variant="displayXl" style={styles.title}>
          {slide.title}
        </Text>
        <Text variant="bodyLg" style={styles.body}>
          {slide.body}
        </Text>
      </Animated.View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.xl }]}>
        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <View key={s.eyebrow} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        <Button label={slide.cta} onPress={onPressCta} variant="secondary" />
        <View style={styles.signInRow}>
          <Text variant="bodyMd" style={{ color: colors.text.onPineMuted }}>
            Already have an account?{' '}
          </Text>
          <Link href="/(auth)/sign-in" accessibilityRole="link">
            <Text variant="labelMd" style={{ color: colors.brand.gold }}>
              Sign in
            </Text>
          </Link>
        </View>
        <Link href="/(auth)/sign-in" accessibilityRole="link" style={styles.adminLink}>
          <Text variant="labelSm" style={{ color: colors.text.onPineMuted }}>
            Admin sign in
          </Text>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface.pine },
  slide: { flex: 1, paddingHorizontal: spacing.xl },
  eyebrow: { color: colors.brand.gold, letterSpacing: 2 },
  title: { color: colors.text.onPine, marginTop: spacing.lg },
  body: { color: colors.text.onPineMuted, marginTop: spacing.xl, maxWidth: 360 },
  footer: { paddingHorizontal: spacing.xl, gap: spacing.lg },
  dots: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
  dot: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(247, 243, 232, 0.28)',
  },
  dotActive: { backgroundColor: colors.brand.gold, width: 22 },
  signInRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  adminLink: { alignSelf: 'center', opacity: 0.7 },
});
