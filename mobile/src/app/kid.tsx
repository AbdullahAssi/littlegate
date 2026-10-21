import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BackHandler, Image, Linking, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, ReduceMotion, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { type Period, periodOf, Sky, SKY } from '@/components/Sky';
import { PressableScale } from '@/components/PressableScale';
import { Text } from '@/components/Text';
import {
  formatDuration,
  grantedApps,
  type InstalledApp,
  KidMode,
  timeLeft,
  useHealth,
  useRequests,
  useSettings,
  useUsageToday,
} from '@/lib/kidMode';
import { appVisual, tint } from '@/lib/visuals';
import { duration, easing } from '@/theme/motion';
import { radius, space, useTheme } from '@/theme/tokens';
import { I } from '@/components/icons';

const COLUMNS = 3;
const INTRO_MS = 1200;
/** The whole cascade lands within this, however many apps there are. */
const STAGGER_BUDGET = 300;

/**
 * The kid launcher: the phone's home screen while Kid Mode is on.
 * Only allowlisted apps appear. Back is swallowed; the PIN is the only exit.
 */
export default function KidLauncher() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  // `sky` is a dev-only override so every time of day can be previewed.
  const { fresh, sky: skyParam } = useLocalSearchParams<{ fresh?: string; sky?: Period }>();
  const [settings] = useSettings();
  const [apps, setApps] = useState<InstalledApp[] | null>(null);
  const [intro, setIntro] = useState(fresh === '1');
  // After the intro the grid is already in place underneath — it's revealed, not replayed.
  const [cascade] = useState(fresh !== '1');
  const now = useClock();
  const health = useHealth();
  const [launches, setLaunches] = useState(0);
  const usage = useUsageToday(`${now.getTime()}:${launches}`);
  const period: Period = __DEV__ && skyParam && skyParam in SKY ? skyParam : periodOf(now);
  const sky = SKY[period];
  const night = period === 'night';

  useEffect(() => {
    KidMode.getInstalledApps().then(setApps);
  }, []);

  useEffect(() => {
    if (!intro) return;
    const t = setTimeout(() => setIntro(false), INTRO_MS);
    return () => clearTimeout(t);
  }, [intro]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => sub.remove();
    }, [])
  );

  // Allowed apps, plus any a grown-up opened for a while from a request.
  const requests = useRequests();
  const allowed = useMemo(() => {
    const granted = grantedApps(requests, now.getTime());
    return (apps ?? []).filter((a) => settings?.allowedApps.includes(a.packageName) || granted.includes(a.packageName));
  }, [apps, settings?.allowedApps, requests, now]);

  const tile = Math.min(96, (width - space.xl * 2 - space.xl * (COLUMNS - 1)) / COLUMNS);
  // The grid builds behind the intro, so it's tappable the moment the intro lifts.
  const ready = apps !== null && settings !== null;
  const step = Math.min(45, STAGGER_BUDGET / Math.max(1, allowed.length - 1));

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.bg }]} edges={['top', 'bottom']}>
      <Sky period={period} />

      <View style={styles.header}>
        <Text variant="label" style={{ color: sky.inkSoft }}>
          {now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
        <Text maxFontSizeMultiplier={1.3} style={[styles.clock, { color: sky.ink }]}>
          {now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
        </Text>
        <Text variant="heading" style={{ color: sky.ink, fontWeight: '600' }}>
          {health?.failClosed ? sky.greeting : `${sky.greeting}. What do you want to do?`}
        </Text>
      </View>

      {health?.failClosed ? (
        // Fail closed (report #1): protection died mid-session, so the apps pause behind the PIN.
        <Animated.View entering={FadeIn.duration(duration.enter)} style={styles.paused}>
          <View style={[styles.pausedBadge, { backgroundColor: night ? tint('#FFFFFF', 0.12) : tint('#FFFFFF', 0.7) }]}>
            <I.lock size={40} color={sky.ink} />
          </View>
          <Text variant="title" style={[styles.pausedText, { color: sky.ink }]}>
            Apps are paused
          </Text>
          <Text style={[styles.pausedText, { color: sky.inkSoft }]}>
            Something switched off Littlegate’s protection. Ask a grown-up to fix it.
          </Text>
          {/* Never blocked (report #5): the phone itself always works. */}
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Make a phone call"
            onPress={() => Linking.openURL('tel:')}
            style={[styles.call, { backgroundColor: night ? tint('#FFFFFF', 0.12) : tint('#FFFFFF', 0.7) }]}>
            <I.phoneCall size={18} color={sky.ink} />
            <Text variant="label" style={{ color: sky.ink }}>
              Call someone
            </Text>
          </PressableScale>
        </Animated.View>
      ) : ready ? (
        <View style={styles.grid}>
          {allowed.map((app, i) => {
            const v = appVisual(app.packageName);
            const left = settings ? timeLeft(settings, usage, app.packageName) : null;
            const done = left === 0;
            return (
              <Animated.View
                key={app.packageName}
                entering={
                  cascade
                    ? FadeInDown.duration(duration.enter)
                        .delay(i * step)
                        .easing(easing.out)
                        .withInitialValues({ opacity: 0, transform: [{ translateY: 10 }] })
                        .reduceMotion(ReduceMotion.System)
                    : undefined
                }>
                <PressableScale
                  accessibilityRole="button"
                  accessibilityLabel={
                    done ? `${app.label}, all done for today` : left !== null ? `Open ${app.label}, ${formatDuration(left)} left` : `Open ${app.label}`
                  }
                  scaleTo={0.92}
                  onPress={async () => {
                    const result = await KidMode.launchApp(app.packageName);
                    setLaunches((n) => n + 1);
                    if (result === 'timeUp') router.push({ pathname: '/blocked', params: { kind: 'time', name: app.label, subject: app.packageName } });
                  }}
                  containerStyle={done && styles.done}
                  style={[styles.app, { width: tile }]}>
                  {app.iconUri ? (
                    <Image source={{ uri: app.iconUri }} style={{ width: tile, height: tile, borderRadius: tile * 0.28 }} />
                  ) : (
                    <View style={[styles.icon, { width: tile, height: tile, borderRadius: tile * 0.28, backgroundColor: v.hue }]}>
                      {v.Icon ? (
                        <v.Icon size={tile * 0.46} color="#FFFFFF" />
                      ) : (
                        <Text style={styles.monogram}>{app.label.charAt(0)}</Text>
                      )}
                    </View>
                  )}
                  <Text variant="label" numberOfLines={1} style={[styles.appLabel, { color: sky.ink }]}>
                    {app.label}
                  </Text>
                  {left !== null ? (
                    <View style={[styles.timeLeft, { backgroundColor: night ? tint('#FFFFFF', 0.12) : tint('#FFFFFF', 0.7) }]}>
                      <I.hourglass size={11} weight="bold" color={sky.inkSoft} />
                      <Text variant="caption" style={{ color: sky.inkSoft, fontVariant: ['tabular-nums'] }}>
                        {done ? 'Done today' : `${formatDuration(left)} left`}
                      </Text>
                    </View>
                  ) : null}
                </PressableScale>
              </Animated.View>
            );
          })}
          {allowed.length === 0 ? (
            <Text style={[styles.empty, { color: sky.inkSoft }]}>
              No apps yet. A grown-up can add some in Settings.
            </Text>
          ) : null}
        </View>
      ) : (
        <View style={styles.grid} />
      )}

      <View style={styles.footer}>
        <View style={[styles.status, { backgroundColor: night ? tint('#FFFFFF', 0.12) : tint('#FFFFFF', 0.7) }]}>
          {/* Static: the word carries the state; nothing pulses for attention. */}
          {/* Never claims "Protected" while protection is down. */}
          {health?.failClosed ? (
            <I.warning size={16} weight="fill" color={colors.lock} />
          ) : (
            <I.protection size={16} weight="fill" color={night ? '#7EE0B5' : colors.leaf} />
          )}
          <Text variant="label" style={{ color: sky.ink }}>
            {health?.failClosed ? 'Paused' : 'Protected'}
          </Text>
        </View>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Parent unlock"
          hitSlop={12}
          onPress={() => router.push({ pathname: '/unlock', params: { next: 'exit' } })}
          style={styles.parent}>
          <I.lock size={14} color={sky.inkSoft} />
          <Text variant="label" style={{ color: sky.inkSoft }}>
            Parent
          </Text>
        </PressableScale>
      </View>

      {intro ? (
        <Animated.View
          entering={FadeIn.duration(140)}
          exiting={FadeOut.duration(duration.exit).easing(easing.out)}
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.kid }]}>
          {/* A tap lifts the intro early: it never holds the launcher hostage. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kid Mode is on. Tap to continue"
            onPress={() => setIntro(false)}
            style={[StyleSheet.absoluteFill, styles.intro]}>
          <Animated.View
            entering={ZoomIn.duration(duration.enter)
              .easing(easing.out)
              .withInitialValues({ transform: [{ scale: 0.9 }] })
              .reduceMotion(ReduceMotion.System)}
            style={styles.introInner}>
            <View style={[styles.introBadge, { backgroundColor: tint('#FFFFFF', 0.14) }]}>
              <I.protection size={56} color={colors.onKid} />
            </View>
            <Text variant="title" tone="onKid">
              Kid Mode is on
            </Text>
            <Text variant="label" tone="onKid" style={{ opacity: 0.8, fontWeight: '400' }}>
              Have fun!
            </Text>
          </Animated.View>
          </Pressable>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

/** Re-renders once a minute, aligned to the minute boundary. */
function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const timeout = setTimeout(() => {
      setNow(new Date());
      interval = setInterval(() => setNow(new Date()), 60_000);
    }, 60_000 - (Date.now() % 60_000));
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);
  return now;
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: space.xl },
  header: { alignItems: 'center', marginTop: space.xxxl, marginBottom: space.xxxl, gap: 2 },
  clock: { fontSize: 64, lineHeight: 72, letterSpacing: -2, fontVariant: ['tabular-nums'] },
  grid: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', columnGap: space.xl, rowGap: space.xl, justifyContent: 'flex-start', alignContent: 'flex-start' },
  app: { alignItems: 'center', gap: space.sm },
  icon: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  monogram: { color: '#FFFFFF', fontSize: 28, fontWeight: '700' },
  appLabel: { textAlign: 'center', alignSelf: 'stretch' },
  // Used-up apps stay visible (so the limit is understood), just quieter.
  done: { opacity: 0.5 },
  timeLeft: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: -4, paddingHorizontal: 6, paddingVertical: 1, borderRadius: radius.pill },
  empty: { textAlign: 'center', flex: 1, marginTop: space.xxl },
  paused: { flex: 1, alignItems: 'center', gap: space.sm, paddingHorizontal: space.md },
  pausedBadge: { width: 88, height: 88, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: space.sm },
  pausedText: { textAlign: 'center' },
  call: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 48, paddingHorizontal: space.lg, borderRadius: radius.pill, marginTop: space.lg },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: space.lg },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
  },
  parent: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: space.md },
  intro: { alignItems: 'center', justifyContent: 'center' },
  introInner: { alignItems: 'center', gap: space.sm },
  introBadge: { width: 112, height: 112, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: space.md },
});
