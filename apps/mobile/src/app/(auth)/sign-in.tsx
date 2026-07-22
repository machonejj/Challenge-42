import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { signInSchema } from '@challenge42/validation';
import { spacing } from '@challenge42/config';
import { AuthShell } from '@/features/auth/AuthShell';
import { useAuthStore } from '@/features/auth/authStore';
import { AUTH_ERROR_COPY } from '@/services/auth';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';

export default function SignIn(): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const busy = useAuthStore((s) => s.busy);
  const authError = useAuthStore((s) => s.error);
  const signIn = useAuthStore((s) => s.signIn);
  const clearError = useAuthStore((s) => s.clearError);

  const onSubmit = async () => {
    clearError();
    const parsed = signInSchema.safeParse({ email, password });
    if (!parsed.success) {
      const errs: { email?: string; password?: string } = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === 'email') errs.email = issue.message;
        if (key === 'password') errs.password = issue.message;
      }
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    await signIn(parsed.data.email, parsed.data.password);
    // On success the root gate redirects automatically.
  };

  return (
    <AuthShell title="Welcome back" subtitle="Pick up right where you left off.">
      {authError ? (
        <View style={styles.banner}>
          <Text variant="bodyMd" color="danger">
            {AUTH_ERROR_COPY[authError]}
          </Text>
        </View>
      ) : null}
      <TextField
        label="EMAIL"
        value={email}
        onChangeText={setEmail}
        placeholder="you@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={fieldErrors.email}
      />
      <TextField
        label="PASSWORD"
        value={password}
        onChangeText={setPassword}
        placeholder="Your password"
        secureTextEntry
        autoCapitalize="none"
        error={fieldErrors.password}
      />
      <Button label="Sign in" onPress={onSubmit} loading={busy} />
      <View style={styles.links}>
        <Link href="/(auth)/reset">
          <Text variant="labelMd" color="gold">
            Forgot password?
          </Text>
        </Link>
        <Link href="/(auth)/sign-up">
          <Text variant="labelMd" color="secondary">
            Create an account
          </Text>
        </Link>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: 'rgba(178, 59, 52, 0.08)',
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(178, 59, 52, 0.18)',
  },
  links: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
