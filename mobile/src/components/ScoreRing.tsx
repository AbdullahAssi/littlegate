import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedProps, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { Text } from '@/components/Text';
import { easing } from '@/theme/motion';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  /** 0–100. Only ever a real ratio — never decoration. */
  value: number;
  size?: number;
  stroke?: number;
  color: string;
  track: string;
  textColor: string;
};

/**
 * Small progress ring with its percentage inside (reference: survey-app stat cards).
 * Mounts already filled — the dashboard is seen daily — and only animates when
 * the value changes, because that change is the thing worth showing.
 */
export function Ring({ value, size = 44, stroke = 3.5, color, track, textColor }: Props) {
  const reduced = useReducedMotion();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const progress = useSharedValue(value);

  useEffect(() => {
    progress.set(reduced ? value : withTiming(value, { duration: 420, easing: easing.inOut }));
  }, [value, reduced, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: c * (1 - progress.get() / 100),
  }));

  return (
    <View style={{ width: size, height: size }} accessible accessibilityRole="progressbar" accessibilityLabel={`${value} percent`}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${c} ${c}`}
          animatedProps={animatedProps}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        {/* Lives inside a fixed ring, so it can only grow so far with the system font size. */}
        <Text maxFontSizeMultiplier={1.15} style={[styles.value, { color: textColor }]}>
          {value}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 11, lineHeight: 13, fontWeight: '600', fontVariant: ['tabular-nums'], letterSpacing: -0.2 },
});
