# Littlegate — Development Plan

_As of 2026-10-22. Revised with the findings in [reports/Littlegate feature ideas.md](reports/Littlegate%20feature%20ideas.md); idea numbers like **(#6)** refer to that report._

## 1. Overview

Littlegate is an Android parental-control app; **Kid Mode** is its in-app switch. It filters a child's internet through a local VPN on the phone and keeps every exit behind a parent PIN. It has **no backend**: all settings, stats and blocklists live on the device. The UI is React Native; everything that must keep running in the background is native Kotlin.

### Two device modes

- **Shared device (Kid Mode):** parent and child use one phone. The parent turns Kid Mode on; filtering and an app allowlist apply until the PIN is entered.
- **Separate device (Lock):** the phone belongs to the child. Filtering is always on and locked; only the PIN unlocks settings.

### Goals for v1

- Block Adult, Gambling, Violence, Social Media and Gaming domains by category, plus custom domains.
- Force SafeSearch on Google and Restricted Mode on YouTube.
- Show parents it works: time in Kid Mode and the top blocked domains.
- Make Kid Mode hard to leave without the PIN, without device-admin rights — and **fail closed**: if filtering or the app guard dies, the kid launcher locks behind the PIN instead of falling open (#1).
- Turn Kid Mode on and off automatically on a schedule, with **per-app daily limits** (#3). Android 16 ships these free, so they are the price of entry.
- Never block the essentials: dialer, emergency calls, parent contacts (#5).
- Turn a block into a conversation: a kid-facing "why was this blocked" screen with "ask a grown-up" (#6).

### Not in v1

- iOS (needs Apple's Screen Time / FamilyControls APIs — a separate native project).
- Remote parent dashboard, accounts or cloud sync.
- Filtering by page content or keywords (only domains are checked).
- Separate-device Lock mode ships in phase 7, after Kid Mode is solid.

### Deliberately never

These are stated positions, not backlog: location and geofencing, a cloud dashboard, message or AI-chat scanning, screenshots or screen capture, call/SMS logs, stealth or hidden-icon modes, ads or data monetisation. Each needs a server, breaks the privacy promise, or is banned by Play.

---

## 2. Tech stack and architecture

React Native draws the screens; one native Kotlin module, `kid-mode`, owns filtering, app blocking and scheduling. The native side works when JavaScript is not running, so Android killing the app never stops protection.

```
┌──────────────────────────── React Native (TypeScript) ────────────────────────────┐
│  Onboarding · Dashboard · Kid Launcher grid · PIN pad · Settings                   │
└───────────────────────────────┬────────────────────────────────────────────────────┘
                                │  Expo Module bridge (functions + events)
┌───────────────────────────────▼──────────── Native Kotlin: kid-mode module ────────┐
│                                                                                    │
│  KidModeController ──► FilterVpnService  (DNS intercept, blocklist, SafeSearch)    │
│        │           ──► AppGuardService   (AccessibilityService: foreground app)    │
│        │           ──► KidLauncherActivity (HOME intent, hosts RN launcher grid)   │
│        │           ──► ScheduleManager   (AlarmManager / WorkManager)              │
│        │           ──► PinManager        (Keystore + EncryptedSharedPreferences)   │
│        ▼                                                                           │
│  Room database (settings, sessions, blocked events)  ◄── BlocklistStore (files)    │
│  BootReceiver (restores Kid Mode after restart)                                    │
└────────────────────────────────────────────────────────────────────────────────────┘
```

| Layer | Choice | Why |
| --- | --- | --- |
| App framework | React Native + Expo **development build** (not Expo Go) | Fast UI work; dev builds allow custom native code |
| Native bridge | Expo Modules API (Kotlin) | Cleanest way to expose native functions and events to JS |
| UI | React Navigation + React Native Paper | Ready-made forms, toggles, lists |
| JS state | Zustand | Small UI store; the database stays the source of truth |
| Local database | Room / SQLite (native) | Native writes events while JS is asleep; JS reads via the module |
| Secure storage | Android Keystore + EncryptedSharedPreferences | Holds the PIN hash and salt |
| Background work | WorkManager, AlarmManager | Blocklist updates, cleanup, schedule start/stop |
| Languages | TypeScript (JS), Kotlin (native) | Type safety on both sides of the bridge |

### Bridge contract (JS ↔ native)

Keep the boundary small:

- `startKidMode()` / `stopKidMode(pin)` — the PIN is checked natively, never in JS.
- `getStatus()` → `{ active, since, mode }`
- `setCategories(ids[])`, `setCustomDomains(list)`, `setAllowedApps(packages[])`
- `getStats(range)` → time in Kid Mode, blocked count, top domains
- `setSchedule(rules[])`
- `setPin(old, new)`, `verifyPin(pin)` → `{ ok, lockedUntil }`
- `getInstalledApps()` → name, package, icon (for the allowlist picker)
- `getPermissionState()` → VPN consent, accessibility, overlay, usage access, exact alarms, notifications, battery optimisation, default launcher
- `getHealth()` → live protection status: VPN running, guard running, battery unrestricted, OEM autostart confirmed, Private DNS / other VPN / Advanced Protection detected (#1, #17)
- `updateSettings({ allowedApps, appLimits })` + `getUsageToday()` — per-app daily limits; `launchApp` answers `opened` / `notAllowed` / `timeUp` (#3). "Blocked on schedule" arrives with phase 6.
- `createRequest(kind, subject)` / `getRequests()` / `approveRequest(id, pin, grant)` / `denyRequest(id)` — ask-a-grown-up; grants are +N minutes, open for N minutes, or always. The PIN is checked natively, like `stopKidMode`, and approving never unlocks Settings (#6)
- Events to JS: `onKidModeChanged`, `onBlocked` (live counter on the dashboard), `onHealthChanged`

### Suggested folder layout

```
app/
├─ app/                      # Expo Router screens
│  ├─ onboarding/            # pin.tsx, categories.tsx, permissions.tsx
│  ├─ (parent)/              # dashboard.tsx, settings/*.tsx
│  └─ kid/                   # launcher.tsx, pin-exit.tsx
├─ src/
│  ├─ components/            # PinPad, StatCard, CategoryToggle, AppTile
│  ├─ store/                 # zustand stores
│  └─ native/                # typed wrapper around the kid-mode module
├─ modules/kid-mode/
│  ├─ android/src/main/java/.../
│  │  ├─ KidModeModule.kt
│  │  ├─ vpn/FilterVpnService.kt, DnsPacketParser.kt, DnsResolver.kt
│  │  ├─ guard/AppGuardService.kt, KidLauncherActivity.kt
│  │  ├─ data/AppDatabase.kt, dao/*, entities/*
│  │  ├─ blocklist/BlocklistStore.kt, DomainMatcher.kt
│  │  ├─ security/PinManager.kt
│  │  └─ schedule/ScheduleManager.kt, BootReceiver.kt
│  └─ index.ts
└─ assets/blocklists/        # small bundled starter lists
```

---

## 3. Screens and user flows

```
Setup (PIN + categories + permissions)
        │
  Choose device mode
   ├── Shared ──► Kid Mode ON ──► VPN + launcher + app guard ──► Exit: PIN ──┐
   └── Separate ► Lock ON ──────► VPN (always-on, locked) ─────► Unlock: PIN ┤
                                                                            ▼
                                                        Dashboard: stats & settings
```

### 3.1 Onboarding

1. **Welcome** — what the app does, in one screen.
2. **Create PIN** — 4–6 digits, entered twice. Show a **recovery code** (e.g. 12 characters) and ask the parent to write it down, then **make them type it back once** before continuing (#11).
3. **Choose device mode** — Shared (Kid Mode) or Separate (Lock, phase 7).
4. **Pick categories** — Adult, Gambling, Violence and **AI companions** pre-checked; Social Media, Gaming, AI assistants unchecked. SafeSearch on by default. Named-service quick blocks (TikTok, Roblox, Discord…) below the categories (#7, #8).
5. **Permissions wizard** — one step per permission, each with a "why" line and a deep link:
   - VPN consent (`VpnService.prepare`) — required
   - Notifications (Android 13+) — required for the foreground service
   - Ignore battery optimisation — strongly recommended
   - **Phone-maker battery settings** (#2) — per-OEM step: Samsung "Never sleeping apps", Xiaomi Autostart, Huawei/Honor app launch, Oppo/Vivo/OnePlus equivalents; shown only on those makers. Re-offered after an OS update.
   - Accessibility service — app guard, fast path
   - **Display over other apps** (`SYSTEM_ALERT_WINDOW`) — app guard, path that survives Advanced Protection (§5.4)
   - Alarms & reminders (`SCHEDULE_EXACT_ALARM`) — only if a schedule is set (§5.5)
   - Set as default home app — asked when Kid Mode first starts
6. **Done** — land on the dashboard.

### 3.2 Dashboard (parent view)

- Big toggle: **Kid Mode OFF / ON**, plus an "Enter Kid Mode now" button.
- Today: time in Kid Mode, blocked attempts.
- Top 5 blocked domains (last 7 days).
- Next scheduled change ("Kid Mode turns on at 21:00").
- **Protection status card** (#1): "Filter on · Guard on · Battery unrestricted · Autostart OK", each item tappable to fix. Replaces the old "permission revoked" warning card; it grows out of the existing protection score.
- **Requests from the kid** (#6): pending "more time" / "unblock this site" asks, approved with the PIN on this phone.
- **Safety checks** (#17, v1.1): Developer Options on, auto date/time off, Private DNS set, other VPN apps installed, Advanced Protection on.

### 3.3 Kid Mode (active)

- VPN filtering on; blocklist and SafeSearch enforced.
- App replaced as home screen: a grid showing **only allowlisted apps** (Camera, YouTube Kids, chosen games).
- Settings, Play Store, browsers not on the allowlist, and the app's own settings are hidden.
- Persistent notification "Kid Mode is on" (no stop action on it).
- A small lock icon in a corner opens the PIN pad.
- **Never-block essentials** (#5): the dialer (emergency calls) and parent contacts are always reachable; this is hard-coded natively, not a setting.
- **Clean entry** (#10): Recents entries for non-allowed apps are cleared or ignored when Kid Mode starts.
- **Gentle wind-down** (#12): 5-minute and 1-minute warnings before a limit or schedule ends, then a calm "time's up" screen.
- **Why blocked + ask a grown-up** (#6): a blocked app or a time limit opens a friendly screen that says why and offers "Ask for 15 / 30 more minutes" or "Ask to open this site" (once / 1 hour / always). The request waits in a queue until a parent approves it with the PIN on the same phone.
- **Fail closed** (#1): if the VPN is revoked or the guard stops, the launcher shows a "Ask a grown-up to fix Littlegate" screen behind the PIN instead of the app grid.

### 3.4 Exit Kid Mode

- PIN pad → correct PIN → Kid Mode stops, normal launcher restored, session closed.
- Wrong PIN → growing lockout (see Security).
- "Forgot PIN" → recovery code.

### 3.5 Settings (behind PIN)

- Blocklist categories on/off, including **AI chatbots** (#8): companion / role-play bots blocked by default; general assistants (ChatGPT, Gemini, Claude…) allow / block / schedule.
- **Named-service quick blocks** (#7): one-tap toggles for TikTok, Roblox, Fortnite, Discord, Snapchat, etc. Each maps to a curated domain list shipped with the blocklists.
- Custom blocked domains (add / remove, wildcard `*.example.com`).
- Custom allowed domains (exceptions, e.g. a school site).
- **Apps** (#3): picker from installed apps; each app is *Allowed*, *Daily limit* (minutes), *Blocked on schedule* or *Always blocked*. Allowlisting Messages, Gmail, WhatsApp etc. shows "This app can open websites" (#19).
- Schedule rules (days + start/end, e.g. Mon–Fri 21:00–07:00).
- Change PIN, regenerate recovery code.
- Update blocklists now; last updated date.
- **History & privacy** (#13): DNS log retention dial — Off / Counts only / 24 h / 7 days / 30 days — plus "Wipe now" and "What Littlegate knows" (local export).
- **Test my protection** (#11): a guided self-check that opens a blocked test domain, a non-allowed app and the recovery flow.
- Clear stats.

---

## 4. Data model

All local. Room (SQLite) for structured data, files for blocklists, encrypted prefs for secrets.

Every per-child table carries a `profileId` from phase 0, even though v1 has a single profile. Multiple kid profiles with one-tap handoff (#14) arrive in v1.1 without a migration.

### Room tables

| Table | Columns | Notes |
| --- | --- | --- |
| `profile` | `id`, `name`, `emoji`/`color`, `createdAt` | v1 creates one row (`id=1`) |
| `settings` | `id=1`, `mode` (shared/separate), `safeSearch` bool, `categories` JSON, `services` JSON, `logRetention` (off/counts/24h/7d/30d), `updatedAt` | Device-wide single row |
| `profile_settings` | `profileId`, `categories` JSON, `services` JSON | v1.1: overrides per child |
| `custom_domain` | `profileId`, `domain`, `type` (block/allow), `createdAt` | Allow beats block |
| `app_rule` | `profileId`, `packageName`, `label`, `state` (allowed / limited / scheduled / blocked), `dailyLimitMin`?, `addedAt` | Replaces `allowed_app`; kid grid = allowed + limited + scheduled-in-window |
| `app_usage` | `profileId`, `packageName`, `date`, `usedMs` | Today's use per app; written by the guard, survives reboot (#4) |
| `schedule_rule` | `id`, `profileId`, `days` bitmask, `startMinute`, `endMinute`, `enabled`, `target` (kidMode / packageName / serviceId)? | Rules may cross midnight; `target` enables per-service windows in v1.1 (#16) |
| `block_request` | `id`, `profileId`, `kind` (time/site/app), `subject`, `createdAt`, `status` (pending/approved/denied), `grant` (minutes / once / 1h / always)?, `decidedAt`? | Ask-a-grown-up queue (#6) |
| `session` | `id`, `profileId`, `start`, `end` (null while active), `trigger` (manual/schedule/boot) | Time-in-Kid-Mode stats |
| `blocked_event` | `id`, `sessionId`, `domain`, `category`, `timestamp`, `appPackage`? | Kept per `logRetention`; "Counts only" stores daily per-category totals and no domains |
| `daily_count` | `profileId`, `date`, `category`, `count` | Aggregate kept even when per-domain logging is off |
| `tamper_event` | `id`, `kind` (vpn_revoked / guard_off / clock_changed / private_dns / other_vpn / adv_protection), `timestamp` | Shown on the status card |

### Encrypted preferences

- `pinHash`, `pinSalt`, `pinAlgo` (PBKDF2-SHA256, ≥ 100k iterations)
- `recoveryHash`, `recoverySalt`
- `failedAttempts`, `lockedUntil`

### Blocklists

- Bundled starter list per category in `assets/blocklists/<category>.txt` (small, a few thousand domains).
- Full lists downloaded from a static file host (GitHub raw / CDN) with a `manifest.json`: `{ version, categories: { adult: { url, sha256, count } } }`.
- Checked weekly by WorkManager; verify the SHA-256 before swapping files.
- Sources to evaluate: OISD, StevenBlack hosts, Blocklist Project — **check each license**.
- In memory: a hashed set of domains per category (or a compact trie). Matching walks up the domain: `a.b.example.com` → `b.example.com` → `example.com`.

---

## 5. Technical core

### 5.1 VPN DNS filtering (`FilterVpnService`)

1. `VpnService.Builder`: address `10.111.222.1/32`, DNS server `10.111.222.2` (a fake address inside the tunnel), route `10.111.222.2/32` so DNS enters the tunnel; other traffic goes direct (fast, no battery cost). Also route the **IPs of known public resolvers** (v4 and v6: Google, Cloudflare, Quad9, OpenDNS, AdGuard, NextDNS…) into the tunnel and drop everything sent to them, which catches hard-coded DNS, DoH and DoT to those providers. `addRoute` works by IP prefix only — a port-853 route is impossible — so DoT to an *unknown* server can't be captured without a full tunnel; Private DNS detection plus fail-closed is the backstop (§5.2).
2. Read packets from the tunnel's file descriptor; parse IPv4/IPv6 UDP port 53 packets.
3. For each query name:
   - custom allow → forward
   - custom block or category match → reply **NXDOMAIN** (or `0.0.0.0`), log `blocked_event`
   - SafeSearch domain → answer with a CNAME/IP for the safe endpoint
   - otherwise forward to the real upstream **over DoH or DoT** (encrypted — Play requires VPN apps to encrypt traffic to the tunnel endpoint) through a `protect()`-ed socket, then write the reply back into the tunnel. Plain UDP/53 only as a last-resort fallback when the encrypted upstream is unreachable (e.g. captive portals).
4. Cache answers briefly (respect TTL) to cut latency.
5. Run as a foreground service with the "Kid Mode is on" notification.

**SafeSearch mappings**

| Domain | Rewrite to |
| --- | --- |
| `www.google.com` (and country domains) | `forcesafesearch.google.com` |
| `www.youtube.com`, `m.youtube.com`, `youtubei.googleapis.com` | `restrict.youtube.com` |
| `www.bing.com` | `strict.bing.com` |
| `duckduckgo.com` | `safe.duckduckgo.com` |

### 5.2 Bypass mitigations

| Bypass | Mitigation |
| --- | --- |
| Chrome / apps using DNS over HTTPS | Block known DoH hostnames (`dns.google`, `cloudflare-dns.com`, `doh.opendns.com`, …) in our resolver |
| Apps with hard-coded resolvers (8.8.8.8, 1.1.1.1) | Add routes for well-known resolver IPs into the tunnel and drop that traffic |
| Android "Private DNS" (strict mode, DoT) | Known providers' IPs are routed and dropped (§5.1). Unknown providers: detect via `LinkProperties.isPrivateDnsActive` / `privateDnsServerName`, log a tamper event and **fail closed** in Kid Mode. Lock mode: `DISALLOW_CONFIG_PRIVATE_DNS`. Device-validate. |
| IPv6 DNS leak | Add an IPv6 address + DNS server to the tunnel |
| Other VPN apps | Only one VpnService can run; another VPN triggers `onRevoke()` → tamper event + **fail closed**. Lock mode uses always-on VPN |
| Turning the VPN off in Settings | Settings app is hidden in Kid Mode; `onRevoke()` → tamper event + fail closed |
| Changing the clock or time zone | Limits and schedules run on `elapsedRealtime`; `TIME_SET` / `TIMEZONE_CHANGED` receivers re-anchor wall-clock rules and log a tamper event (#4) |
| In-app browsers (Help/Terms links, Messages, Gmail) | DNS filter still applies; guard blocks Settings help links; "This app can open websites" warning when allowlisting (#19) |
| Accessibility Menu, Assistant, split screen, notification shade, app clones | Expanded guard coverage; clones matched by package **and** user ID (#9, device-validate) |
| Reopening apps from Recents | Clean entry at Kid Mode start + guard (#10) |
| Android 17 Advanced Protection revoking accessibility | Overlay guard keeps working; detect via `AdvancedProtectionManager`, alert the parent, lock Kid Mode (§5.4) |
| Private Space / Secure Folder | Launcher never exposes them; detect presence where possible (#17). Fully closed only in Lock mode |

### 5.3 Kid launcher

- `KidLauncherActivity` declares the `HOME` + `DEFAULT` intent filter.
- Entering Kid Mode: ask the parent to choose it as the default home app (one time, via `RoleManager.ROLE_HOME` on Android 10+).
- Exiting: open the system "default home app" picker so the parent can pick their normal launcher (Android doesn't let apps switch this silently).
- When Kid Mode is off, `KidLauncherActivity` passes straight through to the parent's previous launcher.
- Back button does nothing on the launcher; recent-apps is countered by the app guard.

### 5.4 App guard (`AppGuardService`)

Two enforcement paths, both primary. Android 17's Advanced Protection reportedly revokes accessibility from apps that aren't accessibility tools, so the guard must not depend on accessibility alone.

- **Detect the foreground app**
  - Fast path: `AccessibilityService` listening for `TYPE_WINDOW_STATE_CHANGED`. Strictly rule-based ("if X, do Y") — Play permits this and bans autonomous decisions.
  - Independent path: poll `UsageStatsManager` (Usage Access) every ~1 s while Kid Mode is on. Also feeds `app_usage` for daily limits.
- **Act on it**
  - VpnService and foreground services are **not** exempt from background-activity-start limits; user-granted `SYSTEM_ALERT_WINDOW` is. The guard shows a full-screen overlay ("why blocked", §3.3) over a non-allowed app and relaunches the kid launcher from it.
  - Device-validate whether the HOME-role launcher can bring itself to the front without the overlay.
- If the foreground package is not allowed (and not our own app, the system UI or a never-block essential), cover it and return to the kid launcher.
- Always block: Settings (including help/terms WebViews), Play Store, package installer, other launchers, file managers, unapproved browsers, the Accessibility Menu, Assistant, split screen (#9).
- **Never block** (hard-coded, #5): the default dialer and emergency-call UI, plus parent contacts. Device-validate that the Emergency Dialer can't be used as an escape.
- Detect Advanced Protection via `AdvancedProtectionManager` (API 36+); if on, log a tamper event, alert the parent, and rely on the overlay path.
- **Fail closed** (#1): a watchdog checks every minute that the VPN and at least one guard path are alive. If either is down while Kid Mode is on, the launcher switches to the locked "ask a grown-up" screen and the dashboard card turns red.

### 5.5 Schedule and limits (`ScheduleManager`)

- `USE_EXACT_ALARM` is **not** an option — Play limits it to alarm/timer and calendar apps. `SCHEDULE_EXACT_ALARM` is denied by default since Android 14, so:
  - ask for it with a grant flow (`ACTION_REQUEST_SCHEDULE_EXACT_ALARM`) only when the parent sets a schedule;
  - if denied, fall back to `setWindow` (a few minutes of slack) plus a WorkManager safety net, and say so in the UI.
- Turn rules into the next start/end time; set one alarm. On alarm: start or stop Kid Mode, then schedule the next alarm.
- **Monotonic timers** (#4): remaining time for per-app limits and an active session counts `SystemClock.elapsedRealtime`, never wall time; persisted to `app_usage` so it survives a reboot. `TIME_SET` / `TIMEZONE_CHANGED` re-anchor wall-clock schedule rules and log a tamper event.
- **Daily limits** (#3): the guard adds foreground time to `app_usage`; at the limit the app moves to "time's up" for the day. Warnings at 5 and 1 minute (#12).
- `BootReceiver` (`BOOT_COMPLETED`): restore Kid Mode if a session was active or a schedule is currently on.
- VPN consent is granted once during onboarding, so later starts don't need the dialog.
- Any extra foreground service uses the `systemExempted` type (allowed for VPN apps / exact-alarm holders) rather than `specialUse`, which Play reviews by hand.

### 5.6 Separate-device Lock mode (phase 7)

- **No Device Admin tier.** Play's Device Abuse policy names "using device admin features to block removal" as ransomware-like, and legacy device-admin policies are deprecated. Without Device Owner, use a **PIN gate on the uninstall screen** (the guard covers the app-info / uninstall dialog for Littlegate, as Qustodio and Kidslox do) and document a parent removal path.
- **Device Owner** (provisioned by QR or `adb shell dpm set-device-owner`) — the strong option:
  - `setAlwaysOnVpnPackage(lockdown = true)` — no internet without our VPN
  - `addUserRestriction(DISALLOW_CONFIG_VPN, DISALLOW_FACTORY_RESET, DISALLOW_INSTALL_APPS, DISALLOW_SAFE_BOOT)`
  - plus (#25): `DISALLOW_CONFIG_PRIVATE_DNS`, `DISALLOW_CONFIG_DATE_TIME`, `DISALLOW_DEBUGGING_FEATURES`, `DISALLOW_ADD_USER` (blocks Private Space), `DISALLOW_MODIFY_ACCOUNTS`
  - `setPermittedAccessibilityServices`, `setUserControlDisabledPackages` (no force-stop / clear data)
  - Chrome managed configuration to turn DoH off (unverified)
  - `setUninstallBlocked` (only here), `setLockTaskPackages` for kiosk mode
- Device Owner needs a freshly reset phone; document the setup steps clearly.
- v2: **signed offline unlock codes** (#24) — the parent's phone, paired by QR, shows a short HMAC code such as "+30 min" that the child's phone verifies with no server and tolerant of clock drift.

---

## 6. Security

### PIN

- 4–6 digits; store `PBKDF2-SHA256(pin, 16-byte random salt, ≥ 100,000 iterations)`; never the PIN itself.
- Encrypted storage key held in the Android Keystore.
- **Check the PIN in native code** so JS can't be patched to skip it.
- Constant-time comparison of hashes.

### Lockout after wrong PINs

| Failed attempts | Wait |
| --- | --- |
| 1–4 | none |
| 5 | 30 seconds |
| 6 | 1 minute |
| 7 | 5 minutes |
| 8+ | 15 minutes each |

Store `lockedUntil` using elapsed real time plus wall clock, so changing the phone's clock doesn't reset it.

### Recovery

- 12-character recovery code shown once at setup; stored only as a hash.
- Entering it lets the parent set a new PIN. Regenerate from Settings.

### Tamper resistance (shared device, no admin)

- Kid launcher + app guard hide Settings, so the child can't turn off the VPN or force-stop the app.
- `onRevoke()`, the guard stopping, clock changes, Private DNS, another VPN and Advanced Protection are logged as **tamper events** and shown on the status card — and the VPN or guard going down **fails closed** (§5.4).
- Restarting the phone: `BootReceiver` brings Kid Mode back.
- Safe mode (which disables third-party apps) cannot be blocked without Device Owner — document this.
- Be honest in the app: "Kid Mode is designed for young children; Lock mode is stronger."
- **No stealth.** The app icon, the persistent notification and the kid-facing "why blocked" screen are always visible. Children know Littlegate is there and why.

### Privacy

- No analytics on browsing data; nothing leaves the phone except the blocklist download.
- Blocked-event history follows the **retention dial** (#13): Off / Counts only / 24 h / 7 days / 30 days (default 7 days), with "Wipe now". Teens' views show aggregate counts, not browsing history.
- "What Littlegate knows": a local export of everything stored, so the privacy promise is checkable.
- `isMonitoringTool` stays undeclared **only while nothing leaves the device**. Any remote feature brings in Play's monitoring-app requirements and Play Protect warnings.

---

## 7. Phased roadmap

Estimates assume one developer working full time. Each phase ends at a gate you must pass before moving on.

| Phase | Scope | Estimate | Gate (acceptance criteria) |
| --- | --- | --- | --- |
| 0. Setup | Expo dev build, `kid-mode` module skeleton, Room **with `profileId` on per-child tables**, CI build | 3–4 days | App builds and runs on a real device; JS can call a native "hello" |
| 1. PIN + onboarding | Create PIN, recovery code **+ forced type-back test** (#11), lockout, onboarding screens, **per-OEM battery/autostart step** (#2) | 1–1.5 weeks | PIN survives restart; lockout table works; recovery resets PIN; OEM step deep-links correctly on Samsung and Xiaomi |
| 2. **VPN DNS filter (riskiest)** | Tunnel, DNS parse, **encrypted upstream (DoH/DoT)**, block, resolver-IP routes, hard-coded test list | 2–2.5 weeks | A blocked domain fails in Chrome and in an app; others load normally; no noticeable slowdown; survives 24 h; hard-coded 8.8.8.8 and strict Private DNS to Cloudflare don't bypass it |
| 3. Blocklists + SafeSearch | Category lists **incl. AI chatbots** (#8), **named-service quick blocks** (#7), custom domains, allow exceptions, SafeSearch, remote update | 1.5 weeks | Each category and service blocks a sample domain; Google results are SafeSearch; update swaps lists safely |
| 4. Stats + dashboard | Sessions, blocked events, **retention dial** (#13), **protection status card** (#1), live counter | 1–1.5 weeks | Dashboard numbers match a manual test of 20 blocked requests; "Counts only" stores no domains; status card reflects a revoked VPN within 5 s |
| 5. Kid launcher + app guard | Home-app role, apps picker with **per-app states**, accessibility + **overlay guard**, **fail-closed**, **never-block essentials** (#5), **why-blocked + ask-a-grown-up** (#6), clean entry (#10), expanded coverage (#9), uninstall PIN gate, tamper events | 3–3.5 weeks | Child cannot reach Settings or a non-allowed app by home, back, recents, notifications, Accessibility Menu, Assistant or split screen; guard still works with accessibility off; killing the VPN locks the launcher; dialer always opens; a request approved with the PIN grants exactly what was asked |
| 6. Schedule + limits + boot | Schedule rules, exact-alarm grant flow + inexact fallback, **per-app daily limits** (#3), **monotonic timers** (#4), **wind-down** (#12), boot restore | 1.5–2 weeks | Kid Mode starts/stops on time with the screen off (±5 min without exact alarms); limits survive reboot; changing the clock or time zone doesn't add time |
| 7. Lock mode | Device Owner provisioning, always-on VPN, extra DO restrictions (#25) | 2 weeks | With Device Owner: no internet without VPN, app cannot be uninstalled, Private DNS / clock / ADB can't be changed |
| 8. Polish + release | OEM matrix for #2, **"Test my protection"** (#11), bypass checklist from §5.2, error states, Play policy, store listing, beta | 2 weeks | Closed test with 10+ families passes; every row in §5.2 tested on the device matrix; Play review approved |

**Total: roughly 16–19 weeks** (up from 12–14 for the P0 additions). An MVP (phases 0–4 + basic launcher) is about 8 weeks.

### After release

The report's P1/P2 tables are the backlog; see the report for the reasoning behind each.

- **v1.1 — shared device and autonomy:** multiple kid profiles + one-tap handoff (#14), age presets (#15), per-service time windows + homework AI window (#16), safety-check screen (#17), notification shielding (#18), toddler modes (#20), family media agreement (#21), weekly digest + conversation prompts (#22), earned-time wallet (#23).
- **v2 — separate devices:** signed offline unlock codes (#24), LAN sync (#26), on-device classifier for unknown domains (#27), optional E2EE relay (#28, subscription), Play Age Signals pre-fill (#29).

### Business model (hypothesis — test in closed testing)

- **Free:** everything Android 16 offers plus privacy — filtering, named-service and AI blocks, per-app limits, schedules, one profile, health check. Safety features are never paywalled.
- **Plus, one-time ~$19.99–29.99:** multiple profiles, toddler modes, earned-time wallet, agreement builder, longer history, offline unlock codes.
- **Optional subscription, later (~$20/yr):** only what costs money to run — the E2EE relay and curated content packs.
- Never ads, never data.

### Phase 2 checklist (prove this first)

- [ ] `FilterVpnService` with a foreground notification
- [ ] Route only the fake DNS IP into the tunnel
- [ ] Parse IPv4 + UDP + DNS question
- [ ] Forward to upstream via a `protect()`-ed socket, over DoH or DoT
- [ ] Return NXDOMAIN for `example-blocked.com`
- [ ] Handle IPv6 DNS
- [ ] Route known resolver IPs into the tunnel and drop them; confirm strict-mode Private DNS to `one.one.one.one` is caught
- [ ] Test on Android 10, 12, 14 and one Samsung / Xiaomi device (aggressive battery managers)

---

## 8. Testing strategy

- **Unit tests (Kotlin, JUnit):** DNS packet parse/build, domain matcher (subdomains, wildcards, allow-over-block), schedule maths (midnight crossing, DST changes), daily-limit accounting across reboot and clock changes, request grants (once / 1 h / always expire correctly), PIN hashing and lockout timing.
- **Unit tests (TS, Jest):** stores, form validation, the native-module wrapper with mocks.
- **Instrumented tests (Android):** Room DAOs, VPN start/stop, boot receiver.
- **End-to-end (Maestro or Detox):** onboarding → enter Kid Mode → blocked site fails → exit with PIN.
- **Manual "kid tests" (written checklist):** try every escape — home, back, recents, notification shade, quick settings, restarting, safe mode, split screen, Google Assistant, opening links from allowed apps. Add Bitdefender's 2025 Family Link bypass list as test cases: ADB tools, Help/Terms WebViews, Dual Apps / clones, Secure Folder and Private Space, DeX, the Emergency Dialer, the Accessibility Menu, clock and time-zone changes, links sent via messaging apps, reopening from Recents. Plus: another VPN app, strict Private DNS, Advanced Protection on (Android 17).
- **Fail-closed tests:** revoke the VPN, disable accessibility, force battery saver, reboot — the kid launcher must lock each time and the status card must say why.
- **Device matrix:** Pixel (stock), Samsung (One UI), Xiaomi (MIUI/HyperOS); Android 10 → latest.
- **Battery and speed:** 24-hour test; aim for under 3% extra battery per day and under 20 ms added DNS time.

---

## 9. Play Store policy and release checklist

- [ ] **VpnService declaration** in Play Console; VPN is the app's core feature (parental control is an allowed use). Upstream DNS is encrypted (§5.1).
- [ ] **AccessibilityService:** explain in the listing and in the app before turning it on; declare in Play Console; rule-based only; don't use it for anything else. Don't claim `isAccessibilityTool`.
- [ ] **Do not declare `QUERY_ALL_PACKAGES`.** The `<queries>` element for launcher intents covers the apps picker (already in the module manifest).
- [ ] **Usage access** and **Display over other apps**: in-app disclosure before each.
- [ ] **`SCHEDULE_EXACT_ALARM`** only (never `USE_EXACT_ALARM`), requested when a schedule is set.
- [ ] Foreground services typed `systemExempted`, not `specialUse`.
- [ ] **No Device Admin.** Device Owner use documented (Lock mode); uninstall path for parents documented.
- [ ] `isMonitoringTool` left undeclared; re-check before shipping any feature that sends data off the device.
- [ ] Privacy policy URL (even though no data leaves the phone — say so).
- [ ] Data safety form: no data collected or shared.
- [ ] Families / target-audience: the app is for parents (adult users), not a children's app.
- [ ] Store screenshots showing the permission explanations.
- [ ] Closed testing track before production.

---

## 10. Risks and open questions

### Risks

| Risk | Impact | Fallback |
| --- | --- | --- |
| Play rejects Accessibility use | Slower app guard | Usage Stats + overlay guard is already a primary path (§5.4). Distributing outside Play is **not** a fallback: developer verification goes global in 2027 and sideloaded apps hit "restricted settings" |
| Android 17 Advanced Protection revokes accessibility | Child silently disables the fast guard path | Overlay guard; `AdvancedProtectionManager` detection → tamper event + fail closed; Lock mode `setPermittedAccessibilityServices`. Behaviour based on secondary reports — confirm on a release build |
| Android 16 built-in parental controls are free | Free tier looks worse than the OS | Free tier matches it (per-app limits, schedules) and wins on DNS categories, YouTube Restricted Mode, the shared-phone launcher, bypass hardening, no Google account, older Android versions |
| Phone makers kill the VPN service | Filtering stops silently | Per-OEM wizard (#2), watchdog, **fail closed** (#1), status card |
| DNS filtering bypassed (DoH, DoT, VPNs) | Content gets through | Mitigations in 5.2; Lock mode with always-on VPN and `DISALLOW_CONFIG_PRIVATE_DNS` |
| Blocking the phone itself (as Family Link's 2026 call bug did) | Child can't call for help | Hard-coded never-block essentials (#5), tested on every release |
| Large blocklists use too much memory | Crashes on low-end phones | Compact trie / bloom filter; load only enabled categories |
| Parent forgets PIN and recovery code | Parent locked out | Clearly explain at setup; uninstall via safe mode remains possible in shared mode |
| React Native ↔ native build issues | Slower work | Keep the native module self-contained; pin Expo SDK version |

### Open questions

- [ ] Which UI kit: React Native Paper or Tamagui?
- [ ] Minimum Android version: 8.0 (API 26) or 10 (API 29)? API 29 simplifies the home-app role.
- [ ] Which blocklist sources, and are their licenses OK for a commercial app?
- [x] Free app, or paid / subscription? → free core + one-time Plus; subscription only for the optional relay (see §7 Business model). Still to validate in closed testing.
- [ ] Ship Lock mode in v1 or v1.1?
- [ ] Is iOS needed later? (Separate native Screen Time work.)
