import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { PressableScale } from '@/components/PressableScale';
import { Text } from '@/components/Text';
import { css, duration, easing, spring } from '@/theme/motion';
import { radius, space, useTheme } from '@/theme/tokens';
import { I } from '@/components/icons';

type Props = {
  length: number;
  /** Return false to reject the code: the pad shakes, buzzes and clears. */
  onComplete: (pin: string) => Promise<boolean | void> | boolean | void;
  disabled?: boolean;
  /** Bottom-left key, e.g. "Forgot?". */
  extraKey?: { label: string; onPress: () => void };
};

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function PinPad({ length, onComplete, disabled, extraKey }: Props) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  // Callers remount with `key={length}` to reset the entry.
  const shakeX = useSharedValue(0);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (clearTimer.current) clearTimeout(clearTimer.current);
  }, []);

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.get() }] }));

  async function submit(code: string) {
    setBusy(true);
    const result = await onComplete(code);
    setBusy(false);
    if (result === false) {
      // Fired the same frame the shake starts — the haptic and the motion are one event.
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(true);
      if (!reduced) {
        const t = { duration: 55, easing: easing.out };
        shakeX.set(
          withSequence(
            withTiming(-12, t),
            withTiming(10, t),
            withTiming(-7, t),
            withTiming(4, t),
            withSpring(0, { ...spring.snapBack, duration: 200 })
          )
        );
      }
      clearTimer.current = setTimeout(() => {
        clearTimer.current = null;
        setPin('');
        setError(false);
      }, 420);
    }
  }

  function press(digit: string) {
    if (disabled || busy) return;
    // Typing during the error beat starts a fresh entry instead of dropping the digit.
    const retrying = error;
    if (retrying && clearTimer.current) {
      clearTimeout(clearTimer.current);
      clearTimer.current = null;
    }
    const current = retrying ? '' : pin;
    if (current.length >= length) return;
    setError(false);
    const next = current + digit;
    setPin(next);
    if (next.length === length) submit(next);
  }

  function backspace() {
    if (disabled || busy) return;
    if (error) {
      if (clearTimer.current) clearTimeout(clearTimer.current);
      clearTimer.current = null;
      setError(false);
      setPin('');
      return;
    }
    setPin((p) => p.slice(0, -1));
  }

  return (
    <View style={styles.root}>
      <Animated.View
        style={[styles.dots, shakeStyle]}
        accessible
        accessibilityLabel={`${pin.length} of ${length} digits entered`}>
        {Array.from({ length }, (_, i) => {
          const filled = i < pin.length;
          return (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  borderColor: error ? colors.danger : filled ? colors.kid : colors.textTertiary,
                  backgroundColor: error ? colors.danger : filled ? colors.kid : 'transparent',
                  // Filling pops from 0.8 — confirms the tap without moving anything else.
                  transform: [{ scale: filled || reduced ? 1 : 0.8 }],
                  transitionProperty: ['backgroundColor', 'borderColor', 'transform'],
                  transitionDuration: duration.press,
                  transitionTimingFunction: css.out,
                },
              ]}
            />
          );
        })}
      </Animated.View>

      <View style={styles.grid}>
        {KEYS.map((k) => (
          <Key key={k} label={k} onPress={() => press(k)} disabled={disabled} />
        ))}
        {extraKey ? (
          <Key label={extraKey.label} small onPress={extraKey.onPress} />
        ) : (
          <View style={styles.key} />
        )}
        <Key label="0" onPress={() => press('0')} disabled={disabled} />
        <Key label="Delete" icon={<I.delete size={26} color={colors.textSecondary} />} onPress={backspace} disabled={disabled || pin.length === 0} quiet />
      </View>
    </View>
  );
}

function Key({
  label,
  onPress,
  disabled,
  small,
  quiet,
  accessibilityLabel,
  icon,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  small?: boolean;
  quiet?: boolean;
  accessibilityLabel?: string;
  icon?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const plain = small || quiet;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      disabled={disabled}
      scaleTo={0.94}
      style={[styles.key, !plain && { backgroundColor: colors.surface }]}>
      {icon ?? (
        <Text variant={small ? 'label' : 'title'} tone={small ? 'secondary' : 'primary'} style={styles.keyLabel}>
          {label}
        </Text>
      )}
    </PressableScale>
  );
}

const KEY = 76;

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: space.xxl },
  dots: { flexDirection: 'row', gap: space.lg, height: 20, alignItems: 'center' },
  dot: { width: 14, height: 14, borderRadius: radius.pill, borderWidth: 1.5 },
  grid: { width: KEY * 3 + space.xl * 2, flexDirection: 'row', flexWrap: 'wrap', gap: space.lg, columnGap: space.xl },
  key: {
    width: KEY,
    height: KEY,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyLabel: { fontVariant: ['tabular-nums'], fontWeight: '500' },
});
