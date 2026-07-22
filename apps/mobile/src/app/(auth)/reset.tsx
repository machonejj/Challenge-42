import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { resetRequestSchema } from '@challenge42/validation';
import { spacing } from '@challenge42/config';
import { AuthShell } from '@/features/auth/AuthShell';
import { useAuthStore } from '@/features/auth/authStore';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { StatePlaceholder } from '@/components/ui/StatePlaceholder';

export default function Reset(): React.JSX.Element {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const busy = useAuthStore((s) => s.busy);
  const requestReset = useAuthStore((s) => s.requestReset);

  const onSubmit = async () => {
    const parsed = resetRequestSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Enter a valid email');
      return;
    }
    setError(null);
    await requestReset(parsed.data.email);
    // Always report success (never reveals whether an email exists).
    setSent(true);
  };

  if (sent) {
    return (
      <AuthShell title="Check your email">
        <StatePlaceholder
          kind="empty"
          icon="mail-outline"
          title="If that email exists, a reset link is on its way"
          message="Follow the link to choose a new password, then sign in."
          actionLabel="Back to sign in"
          onAction={() => router.replace('/(auth)/sign-in')}
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Reset your password" subtitle="We’ll email you a link to set a new one.">
      <TextField
        label="EMAIL"
        value={email}
        onChangeText={setEmail}
        placeholder="you@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={error}
      />
      <Button label="Send reset link" onPress={onSubmit} loading={busy} />
      <View style={styles.center}>
        <Text variant="labelMd" color="secondary" onPress={() => router.back()}>
          Back
        </Text>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', marginTop: spacing.sm },
});
