import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import {
  type AppTime,
  type BlockRequest,
  type CategoryId,
  type Health,
  KidMode,
  type KidModeStatus,
  type LogRetention,
  type ServiceId,
  type Settings,
} from '../../modules/kid-mode';

export { isNativeKidMode, KidMode } from '../../modules/kid-mode';
export type * from '../../modules/kid-mode/src/KidMode.types';

export const CATEGORIES = [
  { id: 'adult', title: 'Adult content', detail: 'Pornography and explicit sites', defaultOn: true },
  { id: 'gambling', title: 'Gambling', detail: 'Betting, casinos, lotteries', defaultOn: true },
  { id: 'violence', title: 'Violence', detail: 'Gore and graphic violence', defaultOn: true },
  { id: 'social', title: 'Social media', detail: 'TikTok, Instagram, Snapchat…', defaultOn: false },
  { id: 'gaming', title: 'Gaming', detail: 'Online games and game stores', defaultOn: false },
  { id: 'aiCompanion', title: 'AI companions', detail: 'Character.AI, Replika and other chat “friends”', defaultOn: true },
  { id: 'aiAssistant', title: 'AI assistants', detail: 'ChatGPT, Gemini, Claude…', defaultOn: false },
] as const;

/** Named services the parent can block one by one. `category` is the category that already covers it. */
export const SERVICES: { id: ServiceId; name: string; category: CategoryId }[] = [
  { id: 'tiktok', name: 'TikTok', category: 'social' },
  { id: 'instagram', name: 'Instagram', category: 'social' },
  { id: 'snapchat', name: 'Snapchat', category: 'social' },
  { id: 'discord', name: 'Discord', category: 'social' },
  { id: 'reddit', name: 'Reddit', category: 'social' },
  { id: 'roblox', name: 'Roblox', category: 'gaming' },
  { id: 'fortnite', name: 'Fortnite', category: 'gaming' },
  { id: 'twitch', name: 'Twitch', category: 'gaming' },
];

export const RETENTION: { id: LogRetention; label: string; spoken: string; detail: string }[] = [
  { id: 'off', label: 'Off', spoken: 'Off', detail: 'Nothing is recorded. The dashboard shows no blocked sites or counts.' },
  { id: 'counts', label: 'Counts', spoken: 'Counts only', detail: 'Daily totals per category only. Site names are never saved.' },
  { id: '1d', label: '24h', spoken: '24 hours', detail: 'Site names are kept for 24 hours, then only daily totals remain.' },
  { id: '7d', label: '7d', spoken: '7 days', detail: 'Site names are kept for a week, then only daily totals remain.' },
  { id: '30d', label: '30d', spoken: '30 days', detail: 'Site names are kept for a month, then only daily totals remain.' },
];

/** Live Kid Mode status: loads once, then follows native change events. */
export function useKidModeStatus() {
  const [status, setStatus] = useState<KidModeStatus | null>(null);
  useEffect(() => {
    KidMode.getStatus().then(setStatus);
    const sub = KidMode.addListener('onKidModeChanged', setStatus);
    return () => sub.remove();
  }, []);
  return status;
}

/** Settings with optimistic updates; reloads whenever the screen regains focus. */
export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  useFocusEffect(
    useCallback(() => {
      KidMode.getSettings().then(setSettings);
    }, [])
  );
  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((s) => (s ? { ...s, ...patch } : s));
    // A rejection (e.g. the native parent session ran out) rolls back to the real settings.
    KidMode.updateSettings(patch)
      .then(setSettings)
      .catch(() => KidMode.getSettings().then(setSettings));
  }, []);
  return [settings, update] as const;
}

/**
 * Apps that can open websites (report #19). Browsers are open to every site the
 * filter doesn't block; the others open links in a built-in browser, where safe
 * search may not be enforced. A static list until the guard can detect WebViews.
 */
const BROWSERS = new Set([
  'com.android.chrome',
  'org.mozilla.firefox',
  'com.sec.android.app.sbrowser',
  'com.microsoft.emmx',
  'com.opera.browser',
  'com.brave.browser',
  'com.duckduckgo.mobile.android',
]);
const OPENS_LINKS = new Set([
  'com.whatsapp',
  'com.google.android.gm',
  'com.google.android.apps.messaging',
  'com.samsung.android.messaging',
  'org.telegram.messenger',
  'com.facebook.orca',
  'com.facebook.katana',
  'com.instagram.android',
  'com.discord',
  'com.snapchat.android',
  'com.google.android.googlequicksearchbox',
]);

export function webWarning(packageName: string) {
  if (BROWSERS.has(packageName)) return 'A web browser: every site the filter doesn’t block is open.';
  if (OPENS_LINKS.has(packageName)) return 'Can open websites from links. The filter still applies, but safe search may not.';
  return null;
}

/** Daily-limit choices in minutes. Few and round: parents pick, they don't type. */
export const LIMIT_PRESETS = [15, 30, 60, 120] as const;

/** Today's app time per package; reloads on focus and whenever `tick` changes. */
export function useUsageToday(tick?: unknown) {
  const [usage, setUsage] = useState<Record<string, AppTime>>({});
  const load = useCallback(() => {
    KidMode.getUsageToday().then(setUsage);
  }, []);
  useFocusEffect(load);
  useEffect(load, [load, tick]);
  return usage;
}

/** Milliseconds left today for an app, or null when it has no limit. */
export function timeLeft(settings: Settings, usage: Record<string, AppTime>, packageName: string) {
  const limit = settings.appLimits[packageName];
  if (limit === undefined) return null;
  const t = usage[packageName];
  return Math.max(0, limit * 60_000 + (t?.extraMs ?? 0) - (t?.usedMs ?? 0));
}

/** Live protection status: loads on focus, then follows native changes. */
export function useHealth() {
  const [health, setHealth] = useState<Health | null>(null);
  useFocusEffect(
    useCallback(() => {
      KidMode.getHealth().then(setHealth);
    }, [])
  );
  useEffect(() => {
    const sub = KidMode.addListener('onHealthChanged', setHealth);
    return () => sub.remove();
  }, []);
  return health;
}

/** Ask-a-grown-up requests: loads on focus, then follows native changes. `pending` is the badge count. */
export function useRequests() {
  const [requests, setRequests] = useState<BlockRequest[] | null>(null);
  const load = useCallback(() => {
    KidMode.getRequests().then(setRequests);
  }, []);
  useFocusEffect(load);
  useEffect(() => {
    const sub = KidMode.addListener('onRequestsChanged', load);
    return () => sub.remove();
  }, [load]);
  return requests;
}

/** Apps opened for a while by an approved request, still within their time. */
export function grantedApps(requests: BlockRequest[] | null, now = Date.now()) {
  return (requests ?? [])
    .filter((r) => r.kind === 'app' && r.status === 'approved' && r.grant?.type === 'for')
    .filter((r) => (r.decidedAt ?? 0) + (r.grant?.type === 'for' ? r.grant.minutes : 0) * 60_000 > now)
    .map((r) => r.subject);
}

/** One line for a request, from the child's side: "15 more minutes of YouTube Kids". */
export function describeRequest(r: Pick<BlockRequest, 'kind' | 'label' | 'minutes'>) {
  return r.kind === 'time' ? `${r.minutes ?? 15} more minutes of ${r.label}` : `To open ${r.label}`;
}

export function formatDuration(ms: number) {
  const mins = Math.round(ms / 60_000);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
