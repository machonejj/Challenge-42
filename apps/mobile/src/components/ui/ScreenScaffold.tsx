import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, View, StyleSheet, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, spacing } from '@challenge42/config';

export interface ScreenScaffoldProps {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  center?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Skip top safe-area padding when the first child (e.g. a header band) bleeds under the status bar. */
  bleedTop?: boolean;
  contentStyle?: ViewStyle;
}

/** Standard screen wrapper: cream background, safe areas, optional scroll + pull-to-refresh. */
export function ScreenScaffold({
  children,
  scroll = true,
  padded = true,
  center = false,
  refreshing,
  onRefresh,
  bleedTop = false,
  contentStyle,
}: ScreenScaffoldProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const pad: ViewStyle = {
    paddingTop: bleedTop ? 0 : insets.top + spacing.md,
    paddingBottom: insets.bottom + spacing['6xl'],
    paddingHorizontal: padded ? layout.screenGutter : 0,
  };

  if (!scroll) {
    return (
      <View style={[styles.root, pad, center && styles.center, contentStyle]}>{children}</View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[pad, center && styles.centerGrow, contentStyle]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={!!refreshing}
            onRefresh={onRefresh}
            tintColor={colors.brand.pine}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerGrow: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
