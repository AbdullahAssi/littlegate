import type { PermissionState, Settings } from '@/lib/kidMode';

/** 'setting' tips are choices; 'device' tips are permissions the status card already covers. */
type Item = { points: number; done: boolean; tip: string; kind: 'setting' | 'device' };

/**
 * A single 0–100 "how protected is this phone" number, like Opal's Focus Score.
 * Weighted toward what actually stops content: the filter permission and the
 * core categories. Returns the next most valuable step as a tip.
 */
export function protectionScore(settings: Settings, perms: PermissionState) {
  const has = (c: string) => settings.categories.includes(c as never);
  // Background running and the overlay weigh more than their look: battery kills and
  // a revoked accessibility service are how protection fails silently (PLAN §5.4).
  // Phones without a maker autostart setting count it as done.
  const items: Item[] = [
    { kind: 'device', points: 20, done: perms.vpnConsent, tip: 'Turn on the website filter' },
    { kind: 'setting', points: 15, done: has('adult'), tip: 'Block adult content' },
    { kind: 'setting', points: 8, done: has('gambling'), tip: 'Block gambling sites' },
    { kind: 'setting', points: 7, done: has('violence'), tip: 'Block violent content' },
    { kind: 'setting', points: 5, done: has('aiCompanion'), tip: 'Block AI companion chatbots' },
    { kind: 'setting', points: 8, done: settings.safeSearch, tip: 'Turn on safe search' },
    { kind: 'device', points: 8, done: perms.accessibility, tip: 'Turn on app blocking' },
    { kind: 'device', points: 8, done: perms.overlay, tip: 'Let Kid Mode show its block screen' },
    { kind: 'device', points: 4, done: perms.usageAccess, tip: 'Turn on app time tracking' },
    { kind: 'device', points: 7, done: perms.defaultLauncher, tip: 'Set the kid home screen' },
    { kind: 'device', points: 4, done: perms.notifications, tip: 'Allow notifications' },
    { kind: 'device', points: 3, done: perms.batteryOptimizationIgnored, tip: 'Let Kid Mode run in the background' },
    { kind: 'device', points: 3, done: perms.autostart !== false, tip: 'Check the phone’s battery settings' },
  ];
  const score = items.reduce((n, i) => n + (i.done ? i.points : 0), 0);
  const next = items.filter((i) => !i.done).sort((a, b) => b.points - a.points).at(0);
  const nextSetting = items.filter((i) => !i.done && i.kind === 'setting').sort((a, b) => b.points - a.points).at(0);
  return {
    score,
    next: next ? { tip: next.tip, points: next.points } : null,
    /** Best choice-type tip; the dashboard shows this next to the status card, which covers the rest. */
    nextSetting: nextSetting ? { tip: nextSetting.tip, points: nextSetting.points } : null,
  };
}
