import * as Haptics from 'expo-haptics';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import Animated from 'react-native-reanimated';
import { type LayoutChangeEvent, type ScrollViewInstance, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card, SectionLabel, SwitchRow } from '@/components/Card';
import { PressableScale } from '@/components/PressableScale';
import { IconCircle } from '@/components/IconCircle';
import { IconTile } from '@/components/IconTile';
import { Screen } from '@/components/Screen';
import { ServiceChips } from '@/components/ServiceChips';
import { SkeletonRows } from '@/components/Skeleton';
import { Text } from '@/components/Text';
import {
  CATEGORIES,
  type CategoryId,
  formatDuration,
  type InstalledApp,
  KidMode,
  LIMIT_PRESETS,
  type LogRetention,
  RETENTION,
  timeLeft,
  useSettings,
  useUsageToday,
  webWarning,
} from '@/lib/kidMode';
import { parentSession } from '@/lib/parentSession';
import { appVisual, CATEGORY_VISUAL } from '@/lib/visuals';
import { layoutAnim } from '@/theme/motion';
import { font, radius, space, type as typeScale, useTheme } from '@/theme/tokens';
import { I } from '@/components/icons';

const DOMAIN = /^(\*\.)?([a-z0-9-]+\.)+[a-z]{2,}$/;
const UNDO_MS = 5000;

type Section = 'apps' | 'websites';

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { section } = useLocalSearchParams<{ section?: Section }>();
  const [settings, update] = useSettings();
  const [apps, setApps] = useState<InstalledApp[] | null>(null);
  const [domain, setDomain] = useState('');
  const [tried, setTried] = useState(false);
  const [removed, setRemoved] = useState<{ domain: string; index: number } | null>(null);
  const [wipe, setWipe] = useState<'idle' | 'confirm' | 'done'>('idle');
  const usage = useUsageToday();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const scrolled = useRef(false);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sectionY = useRef<Partial<Record<Section, number>>>({});
  // Reflow is for the user's own edits only: switched on after the app list has loaded,
  // so the screen doesn't glide about while it's still filling in.
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (apps === null) return;
    const id = requestAnimationFrame(() => setSettled(true));
    return () => cancelAnimationFrame(id);
  }, [apps]);

  useEffect(() => {
    KidMode.getInstalledApps().then(setApps);
    // Leaving Settings by any route (not just Done) ends the unlock window.
    return () => {
      parentSession.close();
      if (undoTimer.current) clearTimeout(undoTimer.current);
    };
  }, []);

  // An empty app list leaves Websites where it was, so no new onLayout arrives: scroll from the stored position.
  useEffect(() => {
    if (apps?.length === 0) scrollToSection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apps]);

  const reflow = settled ? layoutAnim.reflow() : undefined;

  if (!parentSession.isOpen()) {
    return <Redirect href={{ pathname: '/unlock', params: section ? { next: 'settings', section } : { next: 'settings' } }} />;
  }

  /** Arriving from a quick action: glide to that section once the lists above it have their real height. */
  function scrollToSection() {
    const y = section ? sectionY.current[section] : undefined;
    // Websites sits below the app list, so wait for that list before scrolling.
    if (y === undefined || scrolled.current || (section === 'websites' && apps === null)) return;
    scrolled.current = true;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - space.md), animated: true });
  }

  function onSectionLayout(key: Section, e: LayoutChangeEvent) {
    sectionY.current[key] = e.nativeEvent.layout.y;
    if (section === key) scrollToSection();
  }

  function toggleIn<T extends string>(list: T[], item: T, on: boolean) {
    const set = new Set(list);
    if (on) set.add(item);
    else set.delete(item);
    return [...set];
  }

  const cleaned = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const duplicate = !!settings?.customBlocked.includes(cleaned);
  const validDomain = DOMAIN.test(cleaned) && !duplicate;
  // A duplicate is flagged as you type; a malformed address only once you try to add it.
  const domainError = duplicate
    ? 'That site is already blocked.'
    : tried && cleaned && !validDomain
      ? 'Enter a site address like example.com.'
      : null;

  function addDomain() {
    if (!settings) return;
    if (!validDomain) {
      setTried(true);
      return;
    }
    update({ customBlocked: [cleaned, ...settings.customBlocked] });
    setDomain('');
    setTried(false);
  }

  function removeDomain(d: string) {
    if (!settings) return;
    update({ customBlocked: settings.customBlocked.filter((x) => x !== d) });
    setRemoved({ domain: d, index: settings.customBlocked.indexOf(d) });
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setRemoved(null), UNDO_MS);
  }

  function undoRemove() {
    if (!settings || !removed) return;
    const list = [...settings.customBlocked];
    if (!list.includes(removed.domain)) list.splice(removed.index, 0, removed.domain);
    update({ customBlocked: list });
    setRemoved(null);
    if (undoTimer.current) clearTimeout(undoTimer.current);
  }

  return (
    <Screen scrollRef={scrollRef}>
      <View style={styles.topBar}>
        <Text variant="title">Settings</Text>
        <Button
          variant="ghost"
          label="Done"
          onPress={() => {
            parentSession.close();
            router.back();
          }}
        />
      </View>

      {settings ? (
        <>
          <SectionLabel>Blocked categories</SectionLabel>
          <Card style={styles.list}>
            {CATEGORIES.map((c, i) => (
              <SwitchRow
                key={c.id}
                title={c.title}
                detail={c.detail}
                icon={<IconCircle Icon={CATEGORY_VISUAL[c.id].Icon} />}
                value={settings.categories.includes(c.id)}
                onValueChange={(v) => update({ categories: toggleIn<CategoryId>(settings.categories, c.id, v) })}
              />
            ))}
            <SwitchRow
              icon={<IconCircle Icon={I.search} />}
              title="Safe search"
              detail="Family-friendly results on Google, Bing and YouTube"
              value={settings.safeSearch}
              onValueChange={(v) => update({ safeSearch: v })}
            />
          </Card>

          <SectionLabel>Block by name</SectionLabel>
          <Card style={{ gap: space.md }}>
            <ServiceChips
              categories={settings.categories}
              blocked={settings.blockedServices}
              onChange={(blockedServices) => update({ blockedServices })}
            />
            <Text variant="caption" tone="secondary">
              Faded ones are already blocked by a category above.
            </Text>
          </Card>

          <View onLayout={(e) => onSectionLayout('apps', e)}>
            <SectionLabel>Apps in Kid Mode</SectionLabel>
          </View>
          <Card style={styles.list} layout={reflow}>
            {/* Reading every installed app's name takes a moment on a real phone. */}
            {apps === null ? <SkeletonRows count={4} /> : null}
            {(apps ?? []).map((a) => {
              const on = settings.allowedApps.includes(a.packageName);
              const limit = settings.appLimits[a.packageName];
              const left = timeLeft(settings, usage, a.packageName);
              const warning = webWarning(a.packageName);
              return (
                <Animated.View key={a.packageName} layout={reflow}>
                  <SwitchRow
                    icon={<IconTile Icon={appVisual(a.packageName).Icon ?? I.phone} hue={appVisual(a.packageName).hue} solid />}
                    title={a.label}
                    detail={
                      !on
                        ? 'Blocked'
                        : left === null
                          ? 'No time limit'
                          : `${formatDuration(limit * 60_000)} a day · ${left ? `${formatDuration(left)} left today` : 'used up today'}`
                    }
                    value={on}
                    onValueChange={(v) => update({ allowedApps: toggleIn(settings.allowedApps, a.packageName, v) })}
                  />
                  {on ? (
                    <Animated.View entering={layoutAnim.fadeIn()} exiting={layoutAnim.fadeOut()}>
                      {warning ? (
                        <View style={[styles.warning, { backgroundColor: colors.lockSoft }]}>
                          <I.web size={14} color={colors.lock} />
                          <Text variant="caption" style={{ color: colors.lock, flex: 1 }}>
                            {warning}
                          </Text>
                        </View>
                      ) : null}
                      <LimitPicker
                        app={a.label}
                        value={limit}
                        onChange={(min) => {
                          const appLimits = { ...settings.appLimits };
                          if (min === undefined) delete appLimits[a.packageName];
                          else appLimits[a.packageName] = min;
                          update({ appLimits });
                        }}
                      />
                    </Animated.View>
                  ) : null}
                </Animated.View>
              );
            })}
          </Card>

          <View onLayout={(e) => onSectionLayout('websites', e)}>
            <SectionLabel>Blocked websites</SectionLabel>
          </View>
          {/* Adding or removing a site moves everything below it, so all of it glides. */}
          <Card style={{ gap: space.md }} layout={reflow}>
            <View style={styles.addRow}>
              <TextInput
                value={domain}
                onChangeText={(t) => {
                  setDomain(t);
                  setTried(false);
                }}
                onSubmitEditing={addDomain}
                placeholder="example.com"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="done"
                accessibilityLabel="Website to block"
                style={[
                  styles.input,
                  typeScale.body,
                  { fontFamily: font('400'), fontWeight: undefined },
                  { color: colors.text, backgroundColor: colors.surfaceSunken },
                  domainError ? { borderWidth: 1, borderColor: colors.danger } : null,
                ]}
              />
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Add website"
                disabled={!cleaned || duplicate}
                onPress={addDomain}
                style={[styles.add, { backgroundColor: colors.kid }]}>
                <Text variant="heading" tone="onKid">
                  Add
                </Text>
              </PressableScale>
            </View>
            {domainError ? (
              <Animated.View entering={layoutAnim.fadeIn()} exiting={layoutAnim.fadeOut()} layout={reflow}>
                <Text variant="caption" tone="danger" accessibilityLiveRegion="polite">
                  {domainError}
                </Text>
              </Animated.View>
            ) : null}
            {removed ? (
              <Animated.View
                entering={layoutAnim.fadeIn()}
                exiting={layoutAnim.fadeOut()}
                layout={reflow}
                style={[styles.undoRow, { backgroundColor: colors.surfaceSunken }]}
                accessibilityLiveRegion="polite">
                <Text variant="caption" tone="secondary" numberOfLines={1} style={{ flex: 1 }}>
                  Removed {removed.domain}
                </Text>
                <PressableScale accessibilityRole="button" accessibilityLabel={`Undo removing ${removed.domain}`} hitSlop={12} onPress={undoRemove}>
                  <Text variant="label" tone="kid">
                    Undo
                  </Text>
                </PressableScale>
              </Animated.View>
            ) : null}
            {settings.customBlocked.length === 0 ? (
              <Animated.View entering={layoutAnim.fadeIn()} layout={reflow}>
                <Text variant="caption" tone="secondary">
                  Sites you add here are blocked in addition to the categories above. Use *.site.com for all subdomains.
                </Text>
              </Animated.View>
            ) : (
              settings.customBlocked.map((d) => (
                <Animated.View
                  key={d}
                  entering={layoutAnim.fadeIn()}
                  exiting={layoutAnim.fadeOut()}
                  layout={reflow}
                  style={styles.domainRow}>
                  <Text variant="label" numberOfLines={1} style={{ flex: 1 }}>
                    {d}
                  </Text>
                  <PressableScale
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${d}`}
                    hitSlop={12}
                    onPress={() => removeDomain(d)}>
                    <Text variant="label" tone="danger">
                      Remove
                    </Text>
                  </PressableScale>
                </Animated.View>
              ))
            )}
          </Card>

          <SectionLabel layout={reflow}>Schedule</SectionLabel>
          <Card layout={reflow}>
            <Text variant="heading">Automatic Kid Mode</Text>
            <Text variant="caption" tone="secondary">
              Turn Kid Mode on and off at set times, like bedtime. Coming in a later update.
            </Text>
          </Card>

          <SectionLabel layout={reflow}>History & privacy</SectionLabel>
          <Card style={{ gap: space.md }} layout={reflow}>
            <Text variant="heading">Keep blocked-site history</Text>
            <RetentionPicker value={settings.logRetention} onChange={(logRetention) => update({ logRetention })} />
            <Text variant="caption" tone="secondary" accessibilityLiveRegion="polite">
              {RETENTION.find((r) => r.id === settings.logRetention)?.detail} Nothing ever leaves this phone.
            </Text>
            {wipe === 'confirm' ? (
              <Animated.View entering={layoutAnim.fadeIn()} style={[styles.undoRow, { backgroundColor: colors.dangerSoft }]}>
                <Text variant="caption" style={{ flex: 1, color: colors.danger }}>
                  Delete all history?
                </Text>
                <PressableScale accessibilityRole="button" hitSlop={12} onPress={() => setWipe('idle')}>
                  <Text variant="label" tone="secondary">
                    Cancel
                  </Text>
                </PressableScale>
                <PressableScale
                  accessibilityRole="button"
                  accessibilityLabel="Delete history"
                  hitSlop={12}
                  onPress={async () => {
                    await KidMode.clearHistory();
                    setWipe('done');
                  }}>
                  <Text variant="label" tone="danger">
                    Delete
                  </Text>
                </PressableScale>
              </Animated.View>
            ) : (
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Wipe history now"
                disabled={wipe === 'done'}
                onPress={() => setWipe('confirm')}
                style={styles.wipeRow}>
                <I.wipe size={18} color={wipe === 'done' ? colors.textTertiary : colors.danger} />
                <Text variant="label" tone={wipe === 'done' ? 'secondary' : 'danger'}>
                  {wipe === 'done' ? 'History wiped' : 'Wipe history now'}
                </Text>
              </PressableScale>
            )}
          </Card>

          <SectionLabel layout={reflow}>Security</SectionLabel>
          <Card style={{ gap: space.sm }} layout={reflow}>
            <Button variant="secondary" label="Permissions" onPress={() => router.push('/permissions')} />
          </Card>
        </>
      ) : (
        // Settings come from native storage and arrive in a moment; show their shape meanwhile.
        <>
          <SectionLabel>Blocked categories</SectionLabel>
          <Card style={styles.list}>
            <SkeletonRows count={5} />
          </Card>
          <SectionLabel>Apps in Kid Mode</SectionLabel>
          <Card style={styles.list}>
            <SkeletonRows count={3} />
          </Card>
        </>
      )}
    </Screen>
  );
}

/** Daily limit for one app: no limit or a preset. Sits under the app's row, aligned with its title. */
function LimitPicker({ app, value, onChange }: { app: string; value?: number; onChange: (min?: number) => void }) {
  const { colors } = useTheme();
  const options = [undefined, ...LIMIT_PRESETS];
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={`Daily limit for ${app}`} style={[styles.pills, styles.limitRow]}>
      {options.map((min) => {
        const on = min === value;
        const label = min === undefined ? 'No limit' : formatDuration(min * 60_000);
        return (
          <PressableScale
            key={label}
            containerStyle={min === undefined ? { flex: 1.6 } : { flex: 1 }}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={min === undefined ? 'No limit' : `${min} minutes a day`}
            scaleTo={0.94}
            onPress={() => {
              if (on) return;
              Haptics.selectionAsync();
              onChange(min);
            }}
            style={[styles.pill, styles.pillSmall, { backgroundColor: on ? colors.kidSoft : colors.surfaceSunken }]}>
            <Text variant="caption" style={{ color: on ? colors.kidText : colors.textSecondary, fontWeight: '500' }}>
              {label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

/** Five fixed choices, shown as pills: every option is visible, which a dropdown would hide. */
function RetentionPicker({ value, onChange }: { value: LogRetention; onChange: (v: LogRetention) => void }) {
  const { colors } = useTheme();
  return (
    <View accessibilityRole="radiogroup" style={styles.pills}>
      {RETENTION.map((r) => {
        const on = r.id === value;
        return (
          <PressableScale
            key={r.id}
            containerStyle={{ flex: 1 }}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={r.spoken}
            scaleTo={0.94}
            onPress={() => {
              if (on) return;
              Haptics.selectionAsync();
              onChange(r.id);
            }}
            style={[styles.pill, { backgroundColor: on ? colors.kid : colors.surfaceSunken }]}>
            <Text variant="label" style={{ color: on ? colors.onKid : colors.textSecondary }}>
              {r.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  pills: { flexDirection: 'row', gap: space.xs },
  pill: { flex: 1, minHeight: 40, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  pillSmall: { minHeight: 32 },
  // Icon tile (36) + row gap: lines the pills up under the app name.
  limitRow: { marginLeft: 36 + space.md, marginTop: -space.xs, marginBottom: space.md },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginLeft: 36 + space.md,
    marginBottom: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.sm,
  },
  wipeRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 40, alignSelf: 'flex-start' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  list: { paddingVertical: space.xs },
  addRow: { flexDirection: 'row', gap: space.sm },
  input: { flex: 1, minHeight: 48, borderRadius: radius.sm, paddingHorizontal: space.md },
  add: { minHeight: 48, paddingHorizontal: space.lg, borderRadius: radius.sm, justifyContent: 'center' },
  undoRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 40, paddingHorizontal: space.md, borderRadius: radius.sm },
  domainRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 36 },
});
