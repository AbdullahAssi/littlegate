import { Redirect, router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Platform, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { IconTile } from '@/components/IconTile';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { isNativeKidMode, KidMode, type PermissionState, useHealth } from '@/lib/kidMode';
import { oemStep } from '@/lib/oem';
import { parentSession } from '@/lib/parentSession';
import { css, duration, layoutAnim } from '@/theme/motion';
import { radius, space, useTheme } from '@/theme/tokens';
import { I, type AppIcon } from '@/components/icons';

/**
 * Android 13+ greys out accessibility for apps installed outside Play (sideloaded APKs,
 * including dev builds) until "restricted settings" are allowed for the app.
 */
const RESTRICTED_HINT =
  'Switch greyed out? Open Littlegate’s App info, tap ⋮ (top right), choose “Allow restricted settings”, then try again.';

const ITEMS: { key: keyof PermissionState; Icon: AppIcon; title: string; why: string; required?: boolean }[] = [
  { key: 'vpnConsent', Icon: I.filter, title: 'Website filter', why: 'Lets Kid Mode check sites on the phone itself.', required: true },
  { key: 'notifications', Icon: I.bell, title: 'Notifications', why: 'Shows that Kid Mode is on, and keeps the filter running.', required: true },
  { key: 'batteryOptimizationIgnored', Icon: I.battery, title: 'Run in background', why: 'Stops the phone from switching the filter off to save battery.' },
  // Title and reason come from the phone maker (oemStep); hidden where there's no such setting.
  { key: 'autostart', Icon: I.phone, title: 'Phone maker settings', why: '' },
  { key: 'accessibility', Icon: I.blocked, title: 'App blocking', why: 'Sends your child back to the Kid Mode home screen if they open a blocked app.' },
  { key: 'overlay', Icon: I.overlay, title: 'Block screen', why: 'Covers a blocked app straight away, and keeps app blocking working if Android switches it off.' },
  { key: 'usageAccess', Icon: I.usage, title: 'App time', why: 'Counts time in each app for daily limits. Nothing leaves the phone.' },
  { key: 'defaultLauncher', Icon: I.home, title: 'Kid home screen', why: 'Replaces the home screen while Kid Mode is on.' },
];

export default function Permissions() {
  const { colors } = useTheme();
  const [state, setState] = useState<PermissionState | null>(null);
  // Per-row feedback after "Turn on": a hint, or why nothing opened.
  const [notes, setNotes] = useState<Partial<Record<keyof PermissionState, string | null>>>({});
  const health = useHealth();
  const oem = oemStep(health?.manufacturer ?? '');
  const items = ITEMS.filter((i) => state?.[i.key] !== null).map((i) =>
    i.key === 'autostart' ? { ...i, title: oem.title, why: oem.why } : i
  );
  const [trackW, setTrackW] = useState(0);
  const prevDone = useRef<number | null>(null);
  const doneNow = items.filter((i) => state?.[i.key]).length;
  const total = items.length;

  // Completing the list is the one moment worth a success haptic, paired with "All set" appearing.
  useEffect(() => {
    if (!state) return;
    if (prevDone.current !== null && prevDone.current < total && doneNow === total) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    prevDone.current = doneNow;
  }, [state, doneNow, total]);

  useFocusEffect(
    useCallback(() => {
      KidMode.getPermissionState().then(setState);
    }, [])
  );
  // Most switches live in system settings: re-read when the parent comes back from there.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') KidMode.getPermissionState().then(setState);
    });
    return () => sub.remove();
  }, []);

  if (!parentSession.isOpen()) return <Redirect href={{ pathname: '/unlock', params: { next: 'permissions' } }} />;

  const done = items.filter((i) => state?.[i.key]).length;

  async function grant(key: keyof PermissionState) {
    try {
      const opened = await KidMode.requestPermission(key);
      setNotes((n) => ({
        ...n,
        [key]: !opened
          ? 'This step isn’t in this build yet.'
          : key === 'accessibility' && Platform.OS === 'android' && isNativeKidMode
            ? RESTRICTED_HINT
            : null,
      }));
    } catch (e) {
      // The native PIN window closed (or never opened): get the PIN again, then come back here.
      if ((e as { code?: string }).code === 'ERR_PARENT_LOCKED') {
        parentSession.close();
        router.replace({ pathname: '/unlock', params: { next: 'permissions' } });
        return;
      }
      setNotes((n) => ({ ...n, [key]: `Couldn’t open that setting: ${(e as Error).message}` }));
    }
    setState(await KidMode.getPermissionState());
  }

  return (
    <Screen footer={<Button variant="secondary" label="Done" onPress={() => router.back()} />}>
      <View style={styles.header}>
        <Text variant="title">Permissions</Text>
        <Text tone="secondary">
          Android asks you to switch some of these on in system settings. We’ll take you to the right place.
        </Text>
      </View>

      <View style={{ gap: space.sm }}>
        <View style={styles.progressHead}>
          <Text variant="label">
            {done} of {items.length} on
          </Text>
          {done === items.length ? (
            <Animated.View entering={layoutAnim.fadeIn()}>
              <Text variant="label" tone="kid">
                All set
              </Text>
            </Animated.View>
          ) : null}
        </View>
        <View
          onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}
          style={[styles.progress, { backgroundColor: colors.surfaceSunken }]}>
          {/* A full-width fill slid in from the left: a transform, so it stays on the compositor and keeps its round end. */}
          {/* Mounted once measured: a transition never animates initial values, so it opens at its real value. */}
          {trackW ? (
            <Animated.View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.kid,
                  width: trackW,
                  transform: [{ translateX: (done / items.length - 1) * trackW }],
                  transitionProperty: 'transform',
                  transitionDuration: duration.enter,
                  transitionTimingFunction: css.out,
                },
              ]}
            />
          ) : null}
        </View>
      </View>

      <Card style={styles.list}>
        {items.map((item, i) => {
          const granted = state?.[item.key] ?? false;
          return (
            <View
              key={item.key}
              style={styles.row}>
              <IconTile Icon={item.Icon} hue={granted ? colors.kid : colors.textSecondary} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="heading">
                  {item.title}
                  {item.required ? <Text variant="caption" tone="secondary">{'  '}required</Text> : null}
                </Text>
                <Text variant="caption" tone="secondary">
                  {item.why}
                </Text>
                {notes[item.key] && !granted ? (
                  <Animated.View entering={layoutAnim.fadeIn()}>
                    <Text variant="caption" style={{ color: colors.lock, marginTop: 2 }} accessibilityLiveRegion="polite">
                      {notes[item.key]}
                    </Text>
                  </Animated.View>
                ) : null}
              </View>
              {granted ? (
                // "Turn on" becomes "On" in place: faded, so the change is seen, not missed.
                <Animated.View
                  entering={layoutAnim.fadeIn()}
                  style={[styles.state, styles.stateOn, { backgroundColor: colors.kidSoft }]}>
                  <I.check size={14} color={colors.kidText} />
                  <Text variant="label" tone="kid">
                    On
                  </Text>
                </Animated.View>
              ) : (
                <PressableScale
                  accessibilityRole="button"
                  accessibilityLabel={`Turn on ${item.title}`}
                  onPress={() => grant(item.key)}
                  style={[styles.state, { backgroundColor: colors.kid }]}>
                  <Text variant="label" tone="onKid">
                    Turn on
                  </Text>
                </PressableScale>
              )}
            </View>
          );
        })}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: space.sm, marginTop: space.lg },
  list: { paddingVertical: space.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md },
  stateOn: { flexDirection: 'row', gap: 4 },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between' },
  progress: { height: 8, borderRadius: radius.pill, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: radius.pill },
  state: { minHeight: 36, minWidth: 72, paddingHorizontal: space.md, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
