// Bridge contract between the React Native UI and the native `kid-mode` module.
// See PLAN.md §2. Keep this file the single source of truth for both sides.

export type CategoryId =
  | 'adult'
  | 'gambling'
  | 'violence'
  | 'social'
  | 'gaming'
  /** Companion and role-play chatbots (Character.AI, Replika…). On by default. */
  | 'aiCompanion'
  /** General AI assistants (ChatGPT, Gemini, Claude…). */
  | 'aiAssistant';

/**
 * One-tap blocks for named services (PLAN §3.5, report #7). Each maps to a
 * curated domain list shipped natively with the blocklists.
 */
export type ServiceId = 'tiktok' | 'instagram' | 'snapchat' | 'discord' | 'roblox' | 'fortnite' | 'twitch' | 'reddit';

/**
 * How long blocked-site history is kept (report #13). 'counts' keeps daily
 * totals per category but no site names; 'off' records nothing.
 */
export type LogRetention = 'off' | 'counts' | '1d' | '7d' | '30d';

export type DeviceMode = 'shared' | 'separate';

export type KidModeStatus = {
  active: boolean;
  /** Epoch ms when the current session started, or null when inactive. */
  since: number | null;
  mode: DeviceMode;
};

export type PinResult = {
  ok: boolean;
  /** Epoch ms until which PIN entry is locked after too many failures. */
  lockedUntil: number | null;
  attemptsLeft: number | null;
};

export type BlockedDomain = { domain: string; count: number; category: CategoryId | 'custom' };

export type DayStat = {
  /** YYYY-MM-DD, local time */
  date: string;
  blocked: number;
  kidModeMs: number;
  /** Blocked attempts split by category; sums to `blocked`. */
  byCategory: Partial<Record<CategoryId | 'custom', number>>;
};

export type Stats = {
  /** Milliseconds spent in Kid Mode in the range. */
  kidModeMs: number;
  blockedCount: number;
  topDomains: BlockedDomain[];
  /** Last 7 days, oldest first, today last. */
  days: DayStat[];
  /** Total blocked in the 7 days before `days`, for the week-over-week trend. */
  prevWeekBlocked: number;
};

export type StatsRange = 'today' | 'week';

export type InstalledApp = {
  packageName: string;
  label: string;
  /** PNG data URI of the real launcher icon (native only). */
  iconUri?: string;
};

export type ScheduleRule = {
  id: string;
  /** Bitmask, bit 0 = Monday … bit 6 = Sunday. */
  days: number;
  startMinute: number;
  endMinute: number;
  enabled: boolean;
};

export type PermissionState = {
  vpnConsent: boolean;
  notifications: boolean;
  accessibility: boolean;
  /** SYSTEM_ALERT_WINDOW: the guard path that survives Advanced Protection (PLAN §5.4). */
  overlay: boolean;
  /** Usage Access: per-app time for daily limits, and the guard's polling path. */
  usageAccess: boolean;
  batteryOptimizationIgnored: boolean;
  /**
   * The phone maker's own autostart / "never sleeping" setting (report #2). It can't be
   * read, so this is the parent's confirmation. null on phones that don't have one.
   */
  autostart: boolean | null;
  defaultLauncher: boolean;
};

/** Something that weakened protection, logged natively as it happens (PLAN §6). */
export type TamperKind =
  | 'vpnRevoked' // the VPN was switched off, or another VPN took over
  | 'guardOff' // accessibility and the overlay were both lost
  | 'clockChanged' // time or time zone changed while limits were running
  | 'privateDns' // Private DNS set to a provider we can't intercept
  | 'advancedProtection'; // Android 17 Advanced Protection turned on

export type TamperEvent = { kind: TamperKind; at: number };

/** Live protection status for the dashboard card (report #1). */
export type Health = {
  /** 'on' = filtering now; 'ready' = consent given, Kid Mode off; 'off' = no consent or revoked. */
  filter: 'on' | 'ready' | 'off';
  /** 'on' = accessibility and overlay; 'partial' = one path only; 'off' = neither. */
  guard: 'on' | 'partial' | 'off';
  battery: boolean;
  autostart: boolean | null;
  /** Build.MANUFACTURER, lower case — picks the phone-maker wording. */
  manufacturer: string;
  /**
   * Set when the filter or guard died during a Kid Mode session. The launcher then
   * locks behind the PIN instead of falling open; ending Kid Mode clears it.
   */
  failClosed: 'filter' | 'guard' | null;
  /** Unacknowledged tamper events, newest first. */
  warnings: TamperEvent[];
};

export type Settings = {
  mode: DeviceMode;
  safeSearch: boolean;
  categories: CategoryId[];
  /** Named services blocked on their own, on top of categories. */
  blockedServices: ServiceId[];
  customBlocked: string[];
  /** Sites always allowed, even inside a blocked category (allow beats block). */
  customAllowed: string[];
  /** Apps on the kid grid. Anything not listed is blocked in Kid Mode. */
  allowedApps: string[];
  /**
   * Daily limits in minutes for apps in `allowedApps` (report #3). Apps without an
   * entry have no limit. Counted on the monotonic clock natively (PLAN §5.5).
   */
  appLimits: Record<string, number>;
  schedule: ScheduleRule[];
  logRetention: LogRetention;
};

export type LaunchResult = 'opened' | 'notAllowed' | 'timeUp';

/** Today's time for one app. `extraMs` is time a grown-up added today (report #6). */
export type AppTime = { usedMs: number; extraMs: number };

/**
 * Ask-a-grown-up (report #6). The child asks from the block screen; a parent
 * approves on the same phone with the PIN. Works offline: nothing leaves the phone.
 * - 'time': more minutes for an app whose daily limit is used up
 * - 'app': open an app that isn't allowed
 * - 'site': open a blocked website
 */
export type RequestKind = 'time' | 'app' | 'site';

/** What a parent gives. Minutes add to today's limit; the others open an app or site. */
export type Grant =
  | { type: 'minutes'; minutes: number }
  | { type: 'for'; minutes: number }
  | { type: 'always' };

export type BlockRequest = {
  id: string;
  kind: RequestKind;
  /** Package name ('time' / 'app') or domain ('site'). */
  subject: string;
  /**
   * Display name, derived natively from `subject` (the app's real label, or the
   * domain). Never supplied by the caller, so a crafted link can't show "Camera"
   * while asking for Settings.
   */
  label: string;
  /** Minutes the child asked for ('time' only). */
  minutes?: number;
  createdAt: number;
  status: 'pending' | 'approved' | 'denied';
  grant?: Grant;
  decidedAt?: number;
};

export type KidModeEvents = {
  onKidModeChanged: (status: KidModeStatus) => void;
  onBlocked: (event: { domain: string; category: CategoryId | 'custom'; timestamp: number }) => void;
  onRequestsChanged: (event: { pending: BlockRequest[] }) => void;
  onHealthChanged: (health: Health) => void;
};

/**
 * Parent session: a correct verifyPin (or createPin during setup) opens a 5-minute
 * native window. updateSettings, clearHistory, requestPermission and dismissWarnings
 * reject with code 'ERR_PARENT_LOCKED' outside it, so patched JS can't skip the PIN.
 * Kid Mode starting, or endParentSession, closes it.
 */
export interface KidModeApi {
  // PIN — hashing and lockout live natively.
  hasPin(): Promise<boolean>;
  /** Digits in the stored PIN (4 or 6), or null when none is set. Sizes the unlock pad. */
  getPinLength(): Promise<number | null>;
  /**
   * Creates the first PIN and returns a one-time recovery code to show the parent.
   * Rejects when a PIN already exists — use changePin / resetPinWithRecovery instead.
   */
  createPin(pin: string): Promise<{ recoveryCode: string }>;
  verifyPin(pin: string): Promise<PinResult>;
  changePin(oldPin: string, newPin: string): Promise<PinResult>;
  resetPinWithRecovery(code: string, newPin: string): Promise<{ ok: boolean; recoveryCode?: string }>;
  endParentSession(): Promise<void>;

  // Kid Mode
  getStatus(): Promise<KidModeStatus>;
  startKidMode(): Promise<KidModeStatus>;
  /** Stops only when the PIN is correct; the check happens natively. */
  stopKidMode(pin: string): Promise<PinResult & { status: KidModeStatus }>;

  // Settings
  getSettings(): Promise<Settings>;
  updateSettings(patch: Partial<Settings>): Promise<Settings>;

  // Data
  getStats(range: StatsRange): Promise<Stats>;
  /** "Wipe now": deletes all blocked-site history and daily counts. Settings are kept. */
  clearHistory(): Promise<void>;
  getInstalledApps(): Promise<InstalledApp[]>;
  /** Opens an allowlisted app from the kid launcher, unless it isn't allowed or today's limit is used up. */
  launchApp(packageName: string): Promise<LaunchResult>;
  /** Time per package today (local midnight to now), including extra time granted today. */
  getUsageToday(): Promise<Record<string, AppTime>>;

  // Ask a grown-up
  /**
   * Called from the block screen. Asking again for the same thing returns the existing pending request.
   * Rejects an unknown kind, an app that isn't installed, a malformed domain, a 'time' request for an
   * app without a limit, and anything on the never-grant list (Settings, Play Store, installer…).
   * An 'app' request must also be for the app the guard last blocked (native only; the
   * dev mock has no guard).
   */
  createRequest(req: { kind: RequestKind; subject: string; minutes?: number }): Promise<BlockRequest>;
  /** Pending requests first (oldest first), then today's decided ones. */
  getRequests(): Promise<BlockRequest[]>;
  /** Grants only when the PIN is correct; the check happens natively. Does not unlock Settings. */
  approveRequest(id: string, pin: string, grant: Grant): Promise<PinResult>;
  denyRequest(id: string): Promise<void>;
  getPermissionState(): Promise<PermissionState>;
  getHealth(): Promise<Health>;
  /** The parent has seen the warnings; clears them from the card. */
  dismissWarnings(): Promise<void>;
  requestPermission(name: keyof PermissionState): Promise<boolean>;

  addListener<E extends keyof KidModeEvents>(event: E, listener: KidModeEvents[E]): { remove(): void };
}
