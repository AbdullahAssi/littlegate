import { useEffect } from 'react';
import { type DimensionValue, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { easing } from '@/theme/motion';
import { radius, space, useTheme } from '@/theme/tokens';

const PULSE_MS = 900;

/** A placeholder block that breathes gently while real content loads. Still under reduced motion. */
export function Skeleton({ width = '100%', height = 14, round }: { width?: DimensionValue; height?: number; round?: boolean }) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    pulse.set(withRepeat(withTiming(1, { duration: PULSE_MS, easing: easing.inOut }), -1, true));
    return () => cancelAnimation(pulse);
  }, [reduced, pulse]);
  const style = useAnimatedStyle(() => ({ opacity: 1 - 0.45 * pulse.get() }));
  return (
    <Animated.View
      style={[
        { width, height, borderRadius: round ? height / 2 : radius.sm / 2, backgroundColor: colors.surfaceSunken },
        style,
      ]}
    />
  );
}

/** Rows shaped like settings rows: an icon, a title and a detail line, and a switch. */
export function SkeletonRows({ count = 3 }: { count?: number }) {
  return (
    <View accessible accessibilityLabel="Loading" accessibilityState={{ busy: true }}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={styles.row}>
          <Skeleton width={36} height={36} round />
          <View style={styles.text}>
            <Skeleton width={i % 2 ? '45%' : '60%'} height={14} />
            <Skeleton width={i % 2 ? '70%' : '50%'} height={11} />
          </View>
          <Skeleton width={44} height={24} round />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 56, paddingVertical: space.md },
  text: { flex: 1, gap: 6 },
});
