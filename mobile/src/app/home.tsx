import * as Haptics from 'expo-haptics';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { HealthCard } from '@/components/HealthCard';
import { IconCircle } from '@/components/IconCircle';
import { Mark } from '@/components/Mark';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { StatCard } from '@/components/StatCard';
import { Text } from '@/components/Text';
import { WeekChart } from '@/components/WeekChart';
import {
  CATEGORIES,
  describeRequest,
  isNativeKidMode,
  KidMode,
  type PermissionState,
  type Stats,
  type StatsRange,
  useHealth,
  useKidModeStatus,
  useRequests,
  useSettings,
} from '@/lib/kidMode';
import { parentSession } from '@/lib/parentSession';
import { protectionScore } from '@/lib/protection';
import { CATEGORY_VISUAL } from '@/lib/visuals';
import { spring } from '@/theme/motion';
import { radius, space, useTheme } from '@/theme/tokens';
import { I, type AppIcon } from '@/components/icons';

/** Every parent control is behind the PIN; quick actions just get there faster. */
function unlockTo(next: 'settings' | 'permissions', section?: 'apps' | 'websites') {
  router.push({ pathname: '/unlock', params: section ? { next, section } : { next } });
}

function minutes(ms: number) {
  const m = Math.round(ms / 60_000);
  return m < 60 ? { value: String(m), unit: 'min' } : { value: `${Math.floor(m / 60)}h ${m % 60}`, unit: 'min' };
}

export default function Home() {
  const { colors } = useTheme();
  const [settings] = useSettings();
  const [range, setRange] = useState<StatsRange>('today');
  const [stats, setStats] = useState<Stats | null>(null);
  const [week, setWeek] = useState<Stats | null>(null);
  const [perms, setPerms] = useState<PermissionState | null>(null);
  const [starting, setStarting] = useState(false);
  const status = useKidModeStatus();
  const health = useHealth();
  const pending = (useRequests() ?? []).filter((r) => r.status === 'pending');

  useFocusEffect(
    useCallback(() => {
      KidMode.getStats('week').then(setWeek);
      KidMode.getPermissionState().then(setPerms);
    }, [])
  );
  useEffect(() => {
    KidMode.getStats(range).then(setStats);
  }, [range]);

  const protection = settings && perms ? protectionScore(settings, perms) : null;
  const catsOn = CATEGORIES.filter((c) => settings?.categories.includes(c.id)).length;
  const time = stats ? minutes(stats.kidModeMs) : null;

  // Trend for blocked: today vs the previous days' average, or this week vs last.
  const days = week?.days ?? [];
  const prior = days.slice(0, -1);
  const priorAvg = prior.length ? prior.reduce((n, d) => n + d.blocked, 0) / prior.length : 0;
  const weekTotal = days.reduce((n, d) => n + d.blocked, 0);
  const trend =
    range === 'today'
      ? priorAvg
        ? Math.round(((days.at(-1)?.blocked ?? 0) / priorAvg - 1) * 100)
        : null
      : week?.prevWeekBlocked
        ? Math.round((weekTotal / week.prevWeekBlocked - 1) * 100)
        : null;

  async function start() {
    // Kid Mode must start locked: no leftover parent unlock window.
    parentSession.close();
    setStarting(true);
    await KidMode.startKidMode();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Leave `starting` set: this screen is replaced, and resetting it would let the
    // active-status redirect race the navigation and skip the activation screen.
    router.replace({ pathname: '/kid', params: { fresh: '1' } });
  }

  // Dashboard is the Kid Mode-off view; a deep link here mid-session goes back to the launcher.
  if (status?.active && !starting) return <Redirect href="/kid" />;

  return (
    <Screen
      dock={
        // Without the app guard, Home or Recents would walk straight out of Kid Mode:
        // don't offer a Kid Mode that can't hold.
        perms && !perms.accessibility ? (
          <View style={styles.dockRow}>
            <View style={{ flex: 1, gap: 1 }}>
              <Text variant="label">App blocking is off</Text>
              <Text variant="caption" tone="secondary">
                Kid Mode needs it to keep other apps closed
              </Text>
            </View>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Set up app blocking"
              onPress={() => unlockTo('permissions')}
              style={[styles.startButton, { backgroundColor: colors.hero }]}>
              <I.key size={18} weight="bold" color={colors.onHero} />
              <Text variant="label" style={{ color: colors.onHero, fontWeight: '600' }}>
                Set up
              </Text>
            </PressableScale>
          </View>
        ) : (
          <View style={styles.dockRow}>
            <View style={{ flex: 1, gap: 1 }}>
              <Text variant="label">Ready to hand over</Text>
              <Text variant="caption" tone="secondary">
                Sites filtered, apps locked
              </Text>
            </View>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Start Kid Mode"
              disabled={starting || !perms}
              onPress={start}
              style={[styles.startButton, { backgroundColor: colors.hero }]}>
              <I.lock size={18} weight="bold" color={colors.onHero} />
              <Text variant="label" style={{ color: colors.onHero, fontWeight: '600' }}>
                {starting ? 'Starting…' : 'Start Kid Mode'}
              </Text>
            </PressableScale>
          </View>
        )
      }>
      <View style={styles.topBar}>
        <Mark size={44} />
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Settings"
          hitSlop={8}
          onPress={() => unlockTo('settings')}
          style={[styles.circleButton, { backgroundColor: colors.surface }]}>
          <I.settings size={20} color={colors.text} />
        </PressableScale>
      </View>

      <View style={{ gap: 4, marginTop: space.xs }}>
        <Text variant="title">Kid Mode is off</Text>
        <Text tone="secondary">Start it before you hand the phone over.</Text>
        {/* A dev-only fact, not an alarm: one quiet line, no tinted box. */}
        {!isNativeKidMode ? (
          <Text variant="caption" tone="secondary" style={{ marginTop: space.xs }}>
            Preview build: filtering is simulated.
          </Text>
        ) : null}
      </View>

      <View style={styles.overviewRow}>
        <Text variant="heading">Overview</Text>
        <Segment value={range} onChange={setRange} />
      </View>

      <View style={styles.grid}>
        <View style={styles.row}>
          <StatCard
            highlight
            Icon={I.protection}
            label="Protection"
            value={protection ? scoreWord(protection.score) : '–'}
            ratio={protection?.score}
            onPress={() => unlockTo('permissions')}
          />
          <StatCard
            Icon={I.categories}
            label="Categories"
            value={String(catsOn)}
            unit={`of ${CATEGORIES.length} blocked`}
            badge={settings?.safeSearch ? <Pill text="Safe search" /> : undefined}
            onPress={() => unlockTo('settings')}
          />
        </View>
        <View style={styles.row}>
          <StatCard
            Icon={I.time}
            label="In Kid Mode"
            value={time?.value ?? '–'}
            unit={time ? `${time.unit} ${range === 'today' ? 'today' : 'this week'}` : undefined}
          />
          <StatCard
            Icon={I.blocked}
            label="Sites blocked"
            value={stats ? String(stats.blockedCount) : '–'}
            unit={range === 'today' ? '/today' : '/week'}
            badge={trend !== null ? <Trend pct={trend} /> : undefined}
          />
        </View>
      </View>

      {health ? (
        <HealthCard health={health} onFix={() => unlockTo('permissions')} onDismiss={() => router.push({ pathname: '/unlock', params: { next: 'dismissWarnings' } })} />
      ) : null}

      {/* The status card covers permissions; this suggests the best remaining choice. */}
      {protection?.nextSetting ? (
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={`Next step: ${protection.nextSetting.tip}`}
          scaleTo={0.98}
          onPress={() => unlockTo('settings')}
          style={[styles.nextRow, { backgroundColor: colors.surface }]}>
          <IconCircle Icon={I.filter} />
          <View style={{ flex: 1, gap: 1 }}>
            <Text variant="label">{protection.nextSetting.tip}</Text>
            <Text variant="caption" tone="secondary">
              Raises protection by {protection.nextSetting.points} points
            </Text>
          </View>
          <I.chevron size={18} color={colors.textTertiary} />
        </PressableScale>
      ) : null}

      {pending.length ? (
        <>
          <View style={styles.panelHeadOut}>
            <Text variant="heading">Asked while you were away</Text>
            <Text variant="caption" tone="secondary">
              {pending.length} waiting
            </Text>
          </View>
          <View style={[styles.panel, { backgroundColor: colors.surface, paddingVertical: space.xs, gap: 0 }]}>
            {pending.map((r) => (
              <PressableScale
                key={r.id}
                accessibilityRole="button"
                accessibilityLabel={`Answer: ${describeRequest(r)}`}
                scaleTo={0.98}
                onPress={() => router.push({ pathname: '/approve', params: { id: r.id } })}
                style={styles.listRow}>
                <IconCircle Icon={r.kind === 'time' ? I.hourglass : I.lockKey} />
                <View style={{ flex: 1, gap: 1 }}>
                  <Text variant="label" numberOfLines={2}>
                    {describeRequest(r)}
                  </Text>
                  <Text variant="caption" tone="secondary">
                    {timeAgo(r.createdAt)}
                  </Text>
                </View>
                <Text variant="label" tone="kid">
                  Answer
                </Text>
              </PressableScale>
            ))}
          </View>
        </>
      ) : null}

      <Text variant="heading" style={styles.sectionTitle}>
        Quick actions
      </Text>
      <View style={styles.row}>
        {/* Each action lands on its own section. Schedule returns when the feature does. */}
        <Action Icon={I.apps} label="Apps" onPress={() => unlockTo('settings', 'apps')} />
        <Action Icon={I.web} label="Websites" onPress={() => unlockTo('settings', 'websites')} />
        <Action Icon={I.key} label="Access" onPress={() => unlockTo('permissions')} />
      </View>

      {days.length ? (
        <View style={[styles.panel, { backgroundColor: colors.surface }]}>
          <View style={styles.panelHead}>
            <Text variant="heading">Blocked this week</Text>
            <Text variant="caption" tone="secondary">
              {Math.round(weekTotal / days.length)} a day on average
            </Text>
          </View>
          <WeekChart days={days} />
        </View>
      ) : null}

      <View style={styles.panelHeadOut}>
        <Text variant="heading">Most blocked</Text>
        <Text variant="caption" tone="secondary">
          {range === 'today' ? 'Today' : 'This week'}
        </Text>
      </View>
      <View style={[styles.panel, { backgroundColor: colors.surface, paddingVertical: space.xs }]}>
        {stats && stats.topDomains.length === 0 ? (
          <Text tone="secondary" style={{ paddingVertical: space.md }}>
            {settings?.logRetention === 'off'
              ? 'History is off, so blocked sites aren’t recorded.'
              : settings?.logRetention === 'counts' && stats.blockedCount > 0
                ? 'Site names aren’t kept: history is set to counts only.'
                : 'Nothing blocked yet. Attempts will show up here.'}
          </Text>
        ) : (
          stats?.topDomains.map((d, i) => (
            <View
              key={d.domain}
              style={styles.listRow}>
              <IconCircle Icon={CATEGORY_VISUAL[d.category].Icon} />
              <View style={{ flex: 1, gap: 1 }}>
                <Text variant="label" numberOfLines={1}>
                  {d.domain}
                </Text>
                <Text variant="caption" tone="secondary">
                  {CATEGORIES.find((c) => c.id === d.category)?.title ?? 'Custom'}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text variant="heading" style={{ fontVariant: ['tabular-nums'] }}>
                  {d.count}
                </Text>
                <Text variant="caption" tone="secondary">
                  {d.count === 1 ? 'try' : 'tries'}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </Screen>
  );
}

function timeAgo(t: number) {
  const m = Math.round((Date.now() - t) / 60_000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : 'Yesterday or earlier';
}

function scoreWord(score: number) {
  return score >= 85 ? 'Strong' : score >= 60 ? 'Good' : score >= 35 ? 'Fair' : 'Weak';
}

const SEGMENTS = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'Week' },
] as const;
const SEGMENT_W = 64;

/** Two-way toggle whose thumb springs between options, from wherever it is. */
function Segment({ value, onChange }: { value: StatsRange; onChange: (r: StatsRange) => void }) {
  const { colors } = useTheme();
  const index = SEGMENTS.findIndex((s) => s.id === value);
  const x = useSharedValue(index * SEGMENT_W);
  useEffect(() => {
    x.set(withSpring(index * SEGMENT_W, spring.settle));
  }, [index, x]);
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: x.get() }] }));

  return (
    <View accessibilityRole="tablist" style={[styles.segment, { backgroundColor: colors.surface }]}>
      <Animated.View style={[styles.segmentThumb, { backgroundColor: colors.surfaceSunken }, thumb]} />
      {SEGMENTS.map((s) => (
        <PressableScale
          key={s.id}
          accessibilityRole="tab"
          accessibilityState={{ selected: value === s.id }}
          scaleTo={0.94}
          onPress={() => {
            if (s.id === value) return;
            // Same frame the thumb starts moving: one detent per change.
            Haptics.selectionAsync();
            onChange(s.id);
          }}
          style={styles.segmentItem}>
          <Text variant="caption" tone={value === s.id ? 'primary' : 'secondary'} style={{ fontWeight: '500' }}>
            {s.label}
          </Text>
        </PressableScale>
      ))}
    </View>
  );
}

function Pill({ text }: { text: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.trend, { backgroundColor: colors.surfaceSunken }]}>
      <Text variant="caption" tone="secondary" style={{ fontWeight: '500' }}>
        {text}
      </Text>
    </View>
  );
}

function Trend({ pct }: { pct: number }) {
  const { colors } = useTheme();
  const down = pct <= 0;
  const Icon = down ? I.trendDown : I.trendUp;
  return (
    <View
      accessible
      accessibilityLabel={`${Math.abs(pct)} percent ${down ? 'fewer' : 'more'} than usual`}
      style={[styles.trend, { backgroundColor: colors.surfaceSunken }]}>
      <Icon size={13} color={colors.textSecondary} />
      <Text variant="caption" tone="secondary" style={{ fontWeight: '500', fontVariant: ['tabular-nums'] }}>
        {Math.abs(pct)}%
      </Text>
    </View>
  );
}

function Action({ Icon, label, onPress }: { Icon: AppIcon; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      containerStyle={{ flex: 1 }}
      style={[styles.action, { backgroundColor: colors.surface }]}>
      <Icon size={20} color={colors.text} />
      <Text variant="caption" tone="secondary" numberOfLines={1}>
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  circleButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  overviewRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.sm },
  segment: { flexDirection: 'row', padding: 3, borderRadius: radius.pill },
  segmentItem: { width: SEGMENT_W, minHeight: 32, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  segmentThumb: { position: 'absolute', top: 3, bottom: 3, left: 3, width: SEGMENT_W, borderRadius: radius.pill },
  grid: { gap: space.md },
  row: { flexDirection: 'row', gap: space.md },
  trend: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, minHeight: 26, borderRadius: radius.pill },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.md },
  sectionTitle: { marginTop: space.sm },
  action: { alignItems: 'center', justifyContent: 'center', gap: space.sm, height: 84, borderRadius: radius.md },
  panel: { borderRadius: radius.lg, padding: space.lg, gap: space.lg },
  panelHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  panelHeadOut: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: space.sm },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  dockRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: 52,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
  },
});
