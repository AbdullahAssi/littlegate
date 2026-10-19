import type { ViewStyle } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { css } from '@/theme/motion';

const BOB = {
  from: { transform: [{ translateY: -3 }] },
  to: { transform: [{ translateY: 3 }] },
};

/**
 * Slow idle bob for illustration pieces on first-time screens only (delight tier).
 * Each piece gets its own delay so they never move in lockstep.
 */
export function Floating({ delay = 0, children, style }: { delay?: number; children: React.ReactNode; style?: ViewStyle }) {
  const reduced = useReducedMotion();
  return (
    <Animated.View
      style={[
        style,
        !reduced && {
          animationName: BOB,
          // 1.8s each way (~0.28 Hz) keeps clear of the ~0.2 Hz band that bothers motion-sensitive people.
          animationDuration: '1800ms',
          animationDelay: `${delay}ms`,
          animationIterationCount: 'infinite',
          animationDirection: 'alternate',
          animationTimingFunction: css.inOut,
        },
      ]}>
      {children}
    </Animated.View>
  );
}
