import { type RefObject } from 'react';
import { ScrollView, type ScrollViewInstance, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { space, useTheme } from '@/theme/tokens';

type Props = {
  children: React.ReactNode;
  /** Pinned to the bottom, outside the scroll area (primary actions). */
  footer?: React.ReactNode;
  /**
   * An edge-to-edge bar docked to the bottom of the screen, on the surface tone,
   * running under the gesture area. For the screen's one primary action.
   */
  dock?: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  /** For screens that scroll to a section on arrival. */
  scrollRef?: RefObject<ScrollViewInstance | null>;
};

export function Screen({ children, footer, dock, scroll = true, contentStyle, scrollRef }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={dock ? ['top'] : ['top', 'bottom']}>
      <View style={styles.flex}>
        {scroll ? (
          <ScrollView
            ref={scrollRef}
            style={styles.flex}
            contentContainerStyle={[styles.content, contentStyle]}
            keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flex, styles.content, contentStyle]}>{children}</View>
        )}
      </View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
      {dock ? (
        <View style={[styles.dock, { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, space.lg) }]}>
          {dock}
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: { paddingHorizontal: space.xl, paddingTop: space.xl, paddingBottom: space.xxl, gap: space.lg },
  footer: { paddingHorizontal: space.xl, paddingBottom: space.lg, paddingTop: space.sm, gap: space.sm },
  dock: { paddingHorizontal: space.xl, paddingTop: space.lg },
});
