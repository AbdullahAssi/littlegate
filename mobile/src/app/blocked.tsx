import * as Haptics from 'expo-haptics';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  FadeIn,
  useAnimatedReaction,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { type BlockRequest, KidMode } from '@/lib/kidMode';
import { tint } from '@/lib/visuals';
import { easing, layoutAnim } from '@/theme/motion';
import { space, useTheme } from '@/theme/tokens';
import { I } from '@/components/icons';

const BREATH_MS = 4000;

const MIN_SCALE = 0.78;

/**
 * Shown when a child opens a blocked app or site (phase 5's app guard routes here).
 * Pattern from One Sec: a slow breathing circle turns a "no" into a calm pause
 * instead of a wall. The breath is the purpose — explanation + calm — and it's rare.
 */
export default function Blocked() {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  // `subject` is the package or domain the guard blocked; `name` is what the child sees.
  const { name, subject, kind = 'app' } = useLocalSearchParams<{
    name?: string;
    subject?: string;
    kind?: 'app' | 'site' | 'time';
  }>();
  const [inhale, setInhale] = useState(true);
  const [request, setRequest] = useState<BlockRequest | null>(null);
  const asked = request !== null;

  // Only the subject is sent; the label the parent sees is derived from it natively.
  const [askFailed, setAskFailed] = useState(false);
  async function ask() {
    Haptics.selectionAsync();
    if (!subject) return setAskFailed(true);
    try {
      setRequest(await KidMode.createRequest({ kind, subject, minutes: kind === 'time' ? 15 : undefined }));
    } catch {
      setAskFailed(true);
    }
  }

  // One clock for the circle and the words: the label flips when the breath turns, so they can't drift.
  const breath = useSharedValue(0);
  const rising = useSharedValue(true);
  useEffect(() => {
    if (reduced) return;
    breath.set(withRepeat(withTiming(1, { duration: BREATH_MS, easing: easing.inOut }), -1, true));
    return () => cancelAnimation(breath);
  }, [reduced, breath]);
  useAnimatedReaction(
    () => breath.get(),
    (v, prev) => {
      if (prev === null || v === prev) return;
      const up = v > prev;
      if (up !== rising.get()) {
        rising.set(up);
        scheduleOnRN(setInhale, up);
      }
    }
  );
  const breathStyle = useAnimatedStyle(() => ({
    transform: [{ scale: reduced ? 1 : MIN_SCALE + (1 - MIN_SCALE) * breath.get() }],
  }));

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        router.replace('/kid');
        return true;
      });
      return () => sub.remove();
    }, [])
  );

  const what = name ?? (kind === 'site' ? 'This website' : 'This app');

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <View style={styles.center}>
        <Animated.View layout={layoutAnim.reflow()} style={styles.breathWrap} accessible accessibilityLabel={inhale ? 'Breathe in' : 'Breathe out'}>
          <Animated.View
            style={[
              styles.circle,
              styles.outer,
              { backgroundColor: tint(colors.kid, 0.12) },
              breathStyle,
            ]}
          />
          <Animated.View
            style={[
              styles.circle,
              styles.inner,
              { backgroundColor: tint(colors.kid, 0.22) },
              breathStyle,
            ]}
          />
          <Animated.View key={String(inhale)} entering={FadeIn.duration(400)}>
            <Text variant="heading" tone="kid">
              {reduced ? 'Slow breath' : inhale ? 'Breathe in…' : 'Breathe out…'}
            </Text>
          </Animated.View>
        </Animated.View>

        {/* The footer loses a button when a grown-up is asked; the centred content glides rather than jumps. */}
        <Animated.View layout={layoutAnim.reflow()} style={styles.copy}>
          <Text variant="title" style={styles.centerText}>
            {kind === 'time' ? `Time’s up for ${what} today` : `${what} is taking a break`}
          </Text>
          <Animated.View key={String(asked)} entering={layoutAnim.fadeIn()}>
            <Text tone="secondary" style={styles.centerText}>
              {asked
                ? 'Asked! Show a grown-up this screen, or they’ll see it next time they open Littlegate.'
                : askFailed
                  ? 'This one can’t be asked for. Let’s pick something else to do.'
                  : kind === 'time'
                  ? 'It’ll be back tomorrow. Let’s pick something else for now.'
                  : 'Let’s pick something else to do for now.'}
            </Text>
          </Animated.View>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <Button
          label="Back to my apps"
          icon={<I.home size={18} color={colors.onHero} />}
          onPress={() => router.replace('/kid')}
        />
        {asked ? (
          <Button
            variant="ghost"
            label="Grown-up: answer now"
            onPress={() => router.push({ pathname: '/approve', params: { id: request.id } })}
          />
        ) : (
          askFailed ? null : <Button variant="ghost" label={kind === 'time' ? 'Ask for more time' : 'Ask a grown-up'} onPress={ask} />
        )}
      </View>
    </SafeAreaView>
  );
}

const SIZE = 220;

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: space.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.xxl },
  breathWrap: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  circle: { position: 'absolute', borderRadius: SIZE },
  outer: { width: SIZE, height: SIZE },
  inner: { width: SIZE * 0.7, height: SIZE * 0.7 },
  copy: { gap: space.sm, paddingHorizontal: space.md },
  centerText: { textAlign: 'center' },
  footer: { gap: space.xs, paddingBottom: space.lg },
});
