import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated';
import type { ViewStyle } from 'react-native';

import { duration, easing } from '@/theme/motion';

const STAGGER = 60;

/**
 * Entrance for first-time screens only (onboarding, empty states) — the delight
 * budget. A short rise + fade, staggered. Never use on screens seen daily.
 */
export function Enter({ index = 0, children, style }: { index?: number; children: React.ReactNode; style?: ViewStyle }) {
  return (
    <Animated.View
      style={style}
      entering={FadeInDown.duration(duration.enter)
        .delay(index * STAGGER)
        .easing(easing.out)
        .withInitialValues({ opacity: 0, transform: [{ translateY: 12 }] })
        .reduceMotion(ReduceMotion.System)}>
      {children}
    </Animated.View>
  );
}
