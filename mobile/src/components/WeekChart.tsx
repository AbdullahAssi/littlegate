import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, ReduceMotion } from 'react-native-reanimated';

import { PressableScale } from '@/components/PressableScale';
import { Text } from '@/components/Text';
import type { DayStat } from '@/lib/kidMode';
import { css, duration, easing, layoutAnim } from '@/theme/motion';
import { radius, space, useTheme } from '@/theme/tokens';

const HEIGHT = 120;
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const dayOf = (d: DayStat) => new Date(`${d.date}T12:00:00`).getDay();

/**
 * Blocked attempts per day. Monochrome bars with one bar in the accent — the
 * selected day (today by default) — and its value in a small ink tooltip.
 * Tap a bar to read that day. Nothing moves on open (the dashboard is seen daily);
 * only a selection animates, because that change is the thing worth showing.
 */
export function WeekChart({ days }: { days: DayStat[] }) {
  const { colors } = useTheme();
  const [selected, setSelected] = useState(days.length - 1);
  const max = Math.max(1, ...days.map((d) => d.blocked));

  return (
    <View style={styles.root}>
      <View style={styles.plot}>
        {days.map((d, i) => {
          const on = i === selected;
          const h = Math.max(10, (d.blocked / max) * (HEIGHT - 30));
          return (
            <PressableScale
              key={d.date}
              accessibilityRole="button"
              accessibilityLabel={`${DAY_SHORT.at(dayOf(d))}: ${d.blocked} blocked`}
              accessibilityState={{ selected: on }}
              scaleTo={0.94}
              onPress={() => setSelected(i)}
              containerStyle={styles.flex}
              style={styles.col}>
              {on ? (
                // The count rises out of its bar, so it reads as belonging to it.
                <Animated.View
                  entering={FadeInDown.duration(duration.small)
                    .easing(easing.out)
                    .withInitialValues({ opacity: 0, transform: [{ translateY: 6 }] })
                    .reduceMotion(ReduceMotion.System)}
                  exiting={layoutAnim.fadeOut()}
                  style={[styles.tip, { backgroundColor: colors.hero }]}>
                  <Text variant="caption" style={[styles.tipText, { color: colors.onHero }]}>
                    {d.blocked}
                  </Text>
                </Animated.View>
              ) : null}
              <Animated.View
                style={[
                  styles.bar,
                  {
                    height: h,
                    backgroundColor: on ? colors.kid : colors.surfaceSunken,
                    transitionProperty: 'backgroundColor',
                    transitionDuration: duration.small,
                    transitionTimingFunction: css.out,
                  },
                ]}
              />
            </PressableScale>
          );
        })}
      </View>
      <View style={styles.labels}>
        {days.map((d, i) => (
          <Text
            key={d.date}
            variant="caption"
            tone={i === selected ? 'primary' : 'secondary'}
            style={[styles.label, i === selected && { fontWeight: '600' }]}>
            {i === days.length - 1 ? 'Today' : DAY_SHORT.at(dayOf(d))}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: space.sm },
  plot: { height: HEIGHT, flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  flex: { flex: 1 },
  col: { height: HEIGHT, justifyContent: 'flex-end', alignItems: 'center', gap: 6 },
  bar: { alignSelf: 'stretch', borderRadius: radius.sm },
  tip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill },
  tipText: { fontWeight: '600', fontVariant: ['tabular-nums'] },
  labels: { flexDirection: 'row', gap: 10 },
  label: { flex: 1, textAlign: 'center', fontSize: 12 },
});
