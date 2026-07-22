import { useState } from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  type TextInputProps,
  type KeyboardTypeOptions,
} from 'react-native';
import { colors, radius, spacing } from '@challenge42/config';
import { typeStyle } from '@/theme/theme';
import { Text } from './Text';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string | null;
  keyboardType?: KeyboardTypeOptions;
}

export function TextField({
  label,
  error,
  onFocus,
  onBlur,
  ...rest
}: TextFieldProps): React.JSX.Element {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      {label ? (
        <Text variant="labelSm" color="tertiary" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={colors.text.tertiary}
        {...rest}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          typeStyle('bodyLg'),
          { color: colors.text.primary },
          focused && styles.inputFocused,
          error ? styles.inputError : null,
        ]}
      />
      {error ? (
        <Text variant="labelSm" color="danger" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  label: { marginLeft: spacing.xs },
  input: {
    backgroundColor: colors.surface.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border.strong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 52,
  },
  inputFocused: { borderColor: colors.brand.pine },
  inputError: { borderColor: colors.status.danger },
  error: { marginLeft: spacing.xs },
});
