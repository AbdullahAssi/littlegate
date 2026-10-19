import { useEffect } from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { duration, easing, PRESS_SCALE } from '@/theme/motion';

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** Override the press scale for very large surfaces (cards scale less). */
  scaleTo?: number;
  /** Layout for the outer touch target (e.g. `flex: 1` in a row). */
  containerStyle?: StyleProp<ViewStyle>;
};

/**
 * Feedback on press-in, commit on press-out. The press lives in a shared value,
 * not React state, so feedback never waits on a re-render. Reduced motion swaps
 * the scale for a dim, which still confirms the press.
 */
export function PressableScale({
  style,
  containerStyle,
  scaleTo = PRESS_SCALE,
  children,
  onPressIn,
  onPressOut,
  ...rest
}: Props) {
  const pressed = useSharedValue(0);
  const reduced = useReducedMotion();
  const timing = { duration: duration.press, easing: easing.out };

  // Becoming enabled is a state change worth seeing (e.g. Continue lighting up), so it fades.
  const base = useSharedValue(rest.disabled ? 0.45 : 1);
  useEffect(() => {
    base.set(withTiming(rest.disabled ? 0.45 : 1, { duration: duration.small, easing: easing.out }));
  }, [rest.disabled, base]);

  const pressStyle = useAnimatedStyle(() => {
    const p = pressed.get();
    return reduced
      ? { opacity: base.get() * (1 - 0.3 * p) }
      : { opacity: base.get(), transform: [{ scale: 1 + (scaleTo - 1) * p }] };
  });

  return (
    <Pressable
      {...rest}
      style={containerStyle}
      pressRetentionOffset={{ top: 16, bottom: 16, left: 16, right: 16 }}
      onPressIn={(e) => {
        pressed.set(withTiming(1, timing));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.set(withTiming(0, timing));
        onPressOut?.(e);
      }}>
      {(state) => (
        <Animated.View style={[style, pressStyle]}>
          {typeof children === 'function' ? children(state) : children}
        </Animated.View>
      )}
    </Pressable>
  );
}
