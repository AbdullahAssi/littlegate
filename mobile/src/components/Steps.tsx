import { StyleSheet, View } from 'react-native';

import { radius, space, useTheme } from '@/theme/tokens';

/** Onboarding progress as filled bars; the count is read out, not printed. */
export function Steps({ at, of = 3 }: { at: number; of?: number }) {
  const { colors, dark } = useTheme();
  const track = dark ? 'rgba(255,255,255,0.16)' : 'rgba(34,31,43,0.12)';
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={`Step ${at} of ${of}`} style={styles.row}>
      {Array.from({ length: of }, (_, i) => (
        <View key={i} style={[styles.bar, { backgroundColor: i < at ? colors.hero : track }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.xs, width: 120 },
  bar: { flex: 1, height: 6, borderRadius: radius.pill },
});
