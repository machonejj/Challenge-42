import { View, StyleSheet } from 'react-native';
import { colors } from '@challenge42/config';

export function Divider({ onPine = false }: { onPine?: boolean }): React.JSX.Element {
  return (
    <View
      style={[
        styles.line,
        { backgroundColor: onPine ? colors.border.onPine : colors.border.hairline },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  line: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
});
