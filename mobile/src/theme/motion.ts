// Single source for every curve, duration and spring in the app.
// Values from the animate-expo / emil-design-eng skills — don't hand-roll new ones.
import { cubicBezier, Easing, FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

/** For worklet / layout animations (withTiming, entering, exiting). */
export const easing = {
  out: Easing.bezier(0.23, 1, 0.32, 1),
  inOut: Easing.bezier(0.77, 0, 0.175, 1),
  sheet: Easing.bezier(0.32, 0.72, 0, 1),
};

/** For Reanimated CSS transitions (`transitionTimingFunction`). */
export const css = {
  out: cubicBezier(0.23, 1, 0.32, 1),
  inOut: cubicBezier(0.77, 0, 0.175, 1),
};

export const duration = {
  press: 120,
  small: 180,
  enter: 260,
  exit: 160,
} as const;

export const spring = {
  settle: { duration: 400, dampingRatio: 1 },
  snapBack: { duration: 400, dampingRatio: 0.8 },
  sheet: { duration: 300, dampingRatio: 0.8 },
} as const;

/**
 * Layout-animation presets. Factories, because Reanimated builders mutate when chained.
 * All respect the system reduced-motion setting by default.
 */
export const layoutAnim = {
  /** Something small appearing in place: a row, a message, a chip. */
  fadeIn: () => FadeIn.duration(duration.small).easing(easing.out),
  fadeOut: () => FadeOut.duration(duration.exit).easing(easing.out),
  /** Siblings gliding to close or open a gap: on-screen movement, so ease-in-out. */
  reflow: () => LinearTransition.duration(duration.enter).easing(easing.inOut),
};

/** Press feedback: subtle, and scales label + icon together. */
export const PRESS_SCALE = 0.97;
