// TEMPORARY development mock. Used only when the native module is not in the
// build (Expo Go, web, or before the first dev build). It is NOT secure: the
// real PIN hashing, lockout and filtering live in Kotlin (PLAN.md §6).
// Never ship a build that falls back to this.

import type {
  AppTime,
  BlockedDomain,
  BlockRequest,
  Health,
  DayStat,
  InstalledApp,
  KidModeApi,
  KidModeEvents,
  KidModeStatus,
  PermissionState,
  PinResult,
  Settings,
  Stats,
  TamperEvent,
} from './KidMode.types';

type State = {
  pin: string | null;
  recovery: string | null;
  failed: number;
  lockedUntil: number | null;
  status: KidModeStatus;
  settings: Settings;
  permissions: PermissionState;
  todayMs: number;
  /** Set by clearHistory(): the sample stats read as empty from then on. */
  historyCleared: boolean;
  /** Today's app time. The mock can't see real app use, so each launch adds LAUNCH_MS. */
  usage: { date: string; ms: Record<string, number>; extra: Record<string, number> };
  requests: BlockRequest[];
  /** Tamper log. The mock never produces events itself; edit storage to preview them. */
  tamper: TamperEvent[];
  failClosed: Health['failClosed'];
};

/** Pretend phone maker, so the autostart step shows in the preview. */
const MANUFACTURER = 'samsung';

const LAUNCH_MS = 10 * 60_000;

/** Never granted by a request, whatever it asks: these are the ways out of Kid Mode. Same list natively. */
const NEVER_GRANT = new Set([
  'com.android.settings',
  'com.android.vending',
  'com.google.android.packageinstaller',
  'com.android.packageinstaller',
]);
const PARENT_WINDOW_MS = 5 * 60_000;
/** Mirrors the native parent session (in memory, like native). */
let parentUntil = 0;
function requireParent() {
  if (Date.now() >= parentUntil) throw Object.assign(new Error('Enter the parent PIN first.'), { code: 'ERR_PARENT_LOCKED' });
}
const parentOnly = <T,>(fn: () => Promise<T>) => {
  try {
    requireParent();
  } catch (e) {
    return Promise.reject(e);
  }
  return fn();
};

const DOMAIN = /^([a-z0-9-]+\.)+[a-z]{2,}$/;

const STORAGE_KEY = 'kidmode.mock.v1';

const initial: State = {
  pin: null,
  recovery: null,
  failed: 0,
  lockedUntil: null,
  status: { active: false, since: null, mode: 'shared' },
  settings: {
    mode: 'shared',
    safeSearch: true,
    categories: ['adult', 'gambling', 'violence', 'aiCompanion'],
    blockedServices: [],
    customBlocked: [],
    customAllowed: [],
    allowedApps: ['com.android.camera', 'com.google.android.apps.youtube.kids'],
    appLimits: { 'com.google.android.apps.youtube.kids': 60 },
    schedule: [],
    logRetention: '7d',
  },
  permissions: {
    vpnConsent: false,
    notifications: false,
    accessibility: false,
    overlay: false,
    usageAccess: false,
    batteryOptimizationIgnored: false,
    autostart: false,
    defaultLauncher: false,
  },
  todayMs: 47 * 60_000,
  historyCleared: false,
  usage: { date: '', ms: {}, extra: {} },
  requests: [],
  tamper: [],
  failClosed: null,
};

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Usage resets at local midnight; a fresh day starts with some sample time so limits show. */
function usageToday() {
  if (state.usage.date !== today()) {
    state.usage = {
      date: today(),
      ms: { 'com.google.android.apps.youtube.kids': 38 * 60_000, 'com.duolingo': 12 * 60_000 },
      extra: {},
    };
    save();
  }
  state.usage.extra ??= {};
  return state.usage;
}

/** An approved "for N minutes" grant for this app or site that hasn't run out. */
function activeGrant(subject: string) {
  const now = Date.now();
  return state.requests.some(
    (r) => r.subject === subject && r.status === 'approved' && r.grant?.type === 'for' && (r.decidedAt ?? 0) + r.grant.minutes * 60_000 > now
  );
}

function emitRequests() {
  listeners.onRequestsChanged.forEach((l) => l({ pending: state.requests.filter((r) => r.status === 'pending') }));
}

function load(): State {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (raw) {
      // Nested merge so state saved by an older build picks up newly added fields.
      const saved = JSON.parse(raw) as Partial<State>;
      return {
        ...initial,
        ...saved,
        settings: { ...initial.settings, ...saved.settings },
        permissions: { ...initial.permissions, ...saved.permissions },
      };
    }
  } catch {}
  return structuredClone(initial);
}

let state = load();

function save() {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

const listeners: { [K in keyof KidModeEvents]: Set<KidModeEvents[K]> } = {
  onKidModeChanged: new Set(),
  onBlocked: new Set(),
  onRequestsChanged: new Set(),
  onHealthChanged: new Set(),
};

function health(): Health {
  const p = state.permissions;
  return {
    filter: !p.vpnConsent ? 'off' : state.status.active ? 'on' : 'ready',
    guard: p.accessibility && p.overlay ? 'on' : p.accessibility || p.overlay ? 'partial' : 'off',
    battery: p.batteryOptimizationIgnored,
    autostart: p.autostart,
    manufacturer: MANUFACTURER,
    failClosed: state.status.active ? state.failClosed : null,
    warnings: [...state.tamper].sort((a, b) => b.at - a.at),
  };
}

function emitHealth() {
  listeners.onHealthChanged.forEach((l) => l(health()));
}

// Same lockout table as the native PinManager (PLAN.md §6).
function lockoutMs(failed: number) {
  if (failed < 5) return 0;
  if (failed === 5) return 30_000;
  if (failed === 6) return 60_000;
  if (failed === 7) return 5 * 60_000;
  return 15 * 60_000;
}

function check(pin: string): PinResult {
  const now = Date.now();
  if (state.lockedUntil && state.lockedUntil > now) {
    return { ok: false, lockedUntil: state.lockedUntil, attemptsLeft: 0 };
  }
  if (pin === state.pin) {
    state.failed = 0;
    state.lockedUntil = null;
    save();
    return { ok: true, lockedUntil: null, attemptsLeft: null };
  }
  state.failed += 1;
  const wait = lockoutMs(state.failed);
  state.lockedUntil = wait ? now + wait : null;
  save();
  return { ok: false, lockedUntil: state.lockedUntil, attemptsLeft: Math.max(0, 5 - state.failed) };
}

function recoveryCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 12; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out.replace(/(.{4})(?=.)/g, '$1-');
}

function setStatus(status: KidModeStatus) {
  state.status = status;
  // A new session starts clean; ending one is how a parent clears a fail-closed lock.
  state.failClosed = null;
  save();
  listeners.onKidModeChanged.forEach((l) => l(status));
  emitHealth();
}

const sampleDomains: BlockedDomain[] = [
  { domain: 'tiktok.com', count: 14, category: 'social' },
  { domain: 'roblox.com', count: 9, category: 'gaming' },
  { domain: 'bet365.com', count: 3, category: 'gambling' },
  { domain: 'instagram.com', count: 2, category: 'social' },
];

const apps: InstalledApp[] = [
  { packageName: 'com.android.camera', label: 'Camera' },
  { packageName: 'com.google.android.apps.youtube.kids', label: 'YouTube Kids' },
  { packageName: 'com.duolingo', label: 'Duolingo' },
  { packageName: 'com.android.chrome', label: 'Chrome' },
  { packageName: 'com.whatsapp', label: 'WhatsApp' },
  { packageName: 'com.mojang.minecraftpe', label: 'Minecraft' },
  { packageName: 'com.google.android.apps.photos', label: 'Photos' },
  { packageName: 'org.khanacademy.android', label: 'Khan Academy Kids' },
];

const delay = <T,>(value: T) => new Promise<T>((r) => setTimeout(() => r(value), 60));

export const mockKidMode: KidModeApi = {
  hasPin: () => delay(state.pin !== null),
  getPinLength: () => delay(state.pin?.length ?? null),
  createPin: (pin) => {
    if (state.pin !== null) return Promise.reject(new Error('A PIN already exists'));
    state.pin = pin;
    state.recovery = recoveryCode();
    save();
    parentUntil = Date.now() + PARENT_WINDOW_MS;
    return delay({ recoveryCode: state.recovery });
  },
  verifyPin: (pin) => {
    const r = check(pin);
    if (r.ok) parentUntil = Date.now() + PARENT_WINDOW_MS;
    return delay(r);
  },
  endParentSession: () => {
    parentUntil = 0;
    return delay(undefined);
  },
  changePin: (oldPin, newPin) => {
    const r = check(oldPin);
    if (r.ok) {
      state.pin = newPin;
      save();
    }
    return delay(r);
  },
  resetPinWithRecovery: (code, newPin) => {
    if (code.replace(/-/g, '').toUpperCase() !== state.recovery?.replace(/-/g, '')) return delay({ ok: false });
    state.pin = newPin;
    state.failed = 0;
    state.lockedUntil = null;
    state.recovery = recoveryCode();
    save();
    return delay({ ok: true, recoveryCode: state.recovery });
  },
  getStatus: () => delay(state.status),
  startKidMode: () => {
    parentUntil = 0;
    setStatus({ active: true, since: Date.now(), mode: state.settings.mode });
    return delay(state.status);
  },
  stopKidMode: (pin) => {
    const r = check(pin);
    if (r.ok) {
      if (state.status.since) state.todayMs += Date.now() - state.status.since;
      setStatus({ active: false, since: null, mode: state.settings.mode });
    }
    return delay({ ...r, status: state.status });
  },
  getSettings: () => delay(state.settings),
  updateSettings: (patch) =>
    parentOnly(() => {
      const allowedApps = patch.allowedApps?.filter((p) => !NEVER_GRANT.has(p));
      state.settings = { ...state.settings, ...patch, ...(allowedApps ? { allowedApps } : {}) };
      save();
      return delay(state.settings);
    }),
  getStats: (range): Promise<Stats> => {
    const live = state.status.active && state.status.since ? Date.now() - state.status.since : 0;
    // Mirrors the retention dial: daily counts survive any setting but 'off'; site names
    // are kept per the dial ('1d' = today's only, 'counts' = none).
    const retention = state.settings.logRetention;
    const empty = state.historyCleared || retention === 'off';
    const scale = range === 'week' ? 5 : 1;
    const namedScale = retention === '1d' ? 1 : scale;
    const named = empty || retention === 'counts' ? [] : sampleDomains;
    const blockedToday = empty ? 0 : sampleDomains.reduce((n, d) => n + d.count, 0);
    const pattern = empty ? [0, 0, 0, 0, 0, 0] : [12, 31, 18, 9, 24, 40];
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(Date.now() - (6 - i) * 86_400_000);
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (i === 6) {
        const byCategory: DayStat['byCategory'] = {};
        if (!empty) for (const s of sampleDomains) byCategory[s.category] = (byCategory[s.category] ?? 0) + s.count;
        return { date, blocked: blockedToday, kidModeMs: state.todayMs + live, byCategory };
      }
      const n = pattern.at(i) ?? 0;
      const social = Math.round(n * 0.48);
      const gaming = Math.round(n * 0.3);
      const gambling = Math.round(n * 0.1);
      const byCategory = { social, gaming, gambling, adult: n - social - gaming - gambling };
      return { date, blocked: n, kidModeMs: (40 + i * 13) * 60_000, byCategory };
    });
    return delay({
      days,
      prevWeekBlocked: empty ? 0 : 181,
      kidModeMs: (state.todayMs + live) * scale,
      blockedCount: blockedToday * scale,
      topDomains: named.map((d) => ({ ...d, count: d.count * namedScale })),
    });
  },
  clearHistory: () =>
    parentOnly(() => {
      state.historyCleared = true;
      save();
      return delay(undefined);
    }),
  getInstalledApps: () => delay(apps),
  launchApp: (packageName) => {
    if (NEVER_GRANT.has(packageName)) return delay('notAllowed' as const);
    if (!state.settings.allowedApps.includes(packageName) && !activeGrant(packageName)) return delay('notAllowed' as const);
    const { ms, extra } = usageToday();
    const used = ms[packageName] ?? 0;
    const limit = state.settings.appLimits[packageName];
    if (limit !== undefined && used >= limit * 60_000 + (extra[packageName] ?? 0)) return delay('timeUp' as const);
    ms[packageName] = used + LAUNCH_MS;
    save();
    return delay('opened' as const);
  },
  getUsageToday: () => {
    const { ms, extra } = usageToday();
    const out: Record<string, AppTime> = {};
    for (const pkg of new Set([...Object.keys(ms), ...Object.keys(extra)])) {
      out[pkg] = { usedMs: ms[pkg] ?? 0, extraMs: extra[pkg] ?? 0 };
    }
    return delay(out);
  },
  createRequest: (req) => {
    const app = apps.find((a) => a.packageName === req.subject);
    const valid =
      req.kind === 'site'
        ? DOMAIN.test(req.subject)
        : (req.kind === 'app' || req.kind === 'time') &&
          !!app &&
          !NEVER_GRANT.has(req.subject) &&
          (req.kind === 'app' || state.settings.appLimits[req.subject] !== undefined);
    if (!valid) return Promise.reject(new Error('Invalid request'));
    const existing = state.requests.find((r) => r.status === 'pending' && r.kind === req.kind && r.subject === req.subject);
    if (existing) return delay(existing);
    const request: BlockRequest = {
      kind: req.kind,
      subject: req.subject,
      label: req.kind === 'site' ? req.subject : app!.label,
      minutes: req.kind === 'time' ? Math.min(60, Math.max(5, req.minutes ?? 15)) : undefined,
      id: Math.random().toString(36).slice(2, 10),
      createdAt: Date.now(),
      status: 'pending',
    };
    state.requests.push(request);
    save();
    emitRequests();
    return delay(request);
  },
  getRequests: () => {
    const start = new Date().setHours(0, 0, 0, 0);
    const pending = state.requests.filter((r) => r.status === 'pending');
    const decided = state.requests.filter((r) => r.status !== 'pending' && (r.decidedAt ?? 0) >= start).reverse();
    return delay([...pending, ...decided]);
  },
  approveRequest: (id, pin, grant) => {
    const r = check(pin);
    const request = state.requests.find((x) => x.id === id);
    if (!r.ok || !request || request.status !== 'pending') return delay(r);
    request.status = 'approved';
    request.grant = grant;
    request.decidedAt = Date.now();
    if (grant.type === 'minutes') {
      const { extra } = usageToday();
      extra[request.subject] = (extra[request.subject] ?? 0) + grant.minutes * 60_000;
    } else if (grant.type === 'always') {
      const s = state.settings;
      if (request.kind === 'site') s.customAllowed = [...new Set([...s.customAllowed, request.subject])];
      else s.allowedApps = [...new Set([...s.allowedApps, request.subject])];
    }
    save();
    emitRequests();
    return delay(r);
  },
  denyRequest: (id) => {
    const request = state.requests.find((x) => x.id === id);
    if (request?.status === 'pending') {
      request.status = 'denied';
      request.decidedAt = Date.now();
      save();
      emitRequests();
    }
    return delay(undefined);
  },
  getPermissionState: () => delay(state.permissions),
  requestPermission: (name) =>
    parentOnly(() => {
      state.permissions = { ...state.permissions, [name]: true };
      save();
      emitHealth();
      return delay(true);
    }),
  getHealth: () => delay(health()),
  dismissWarnings: () =>
    parentOnly(() => {
      state.tamper = [];
      save();
      emitHealth();
      return delay(undefined);
    }),
  addListener: (event, listener) => {
    (listeners[event] as Set<typeof listener>).add(listener);
    return { remove: () => (listeners[event] as Set<typeof listener>).delete(listener) };
  },
};
