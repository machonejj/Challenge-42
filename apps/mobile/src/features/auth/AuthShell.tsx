import type { ReactNode } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, layout } from '@challenge42/config';
import { Text } from '@/components/ui/Text';

export function AuthShell({
  title,
  subtitle,
  children,
  canGoBack = true,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  canGoBack?: boolean;
}): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingBottom: insets.bottom + spacing['4xl'],
          paddingHorizontal: layout.screenGutter,
        }}
        showsVerticalScrollIndicator={false}
      >
        {canGoBack ? (
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={8}
            style={styles.back}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text.secondary} />
          </Pressable>
        ) : null}
        <Text variant="titleLg" style={styles.title}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="bodyLg" color="secondary" style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
        <View style={styles.body}>{children}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface.background },
  back: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface.sunken,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { marginTop: spacing.sm },
  subtitle: { marginTop: spacing.sm },
  body: { marginTop: spacing['2xl'], gap: spacing.lg },
});
