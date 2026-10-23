# Parental-Control and Family-Safety Competitor Landscape (as of Oct 2026), for Littlegate

Scope note: research covered official pages where reachable plus 2025–2026 reviews. Many review sites are affiliate-driven and prices differ by region and promo, so conflicts are flagged inline. Anything older than 2025 is date-stamped.

## Q1. What features do the major parental-control apps offer (with Apple Screen Time as a benchmark)?

### Takeaway
All the mainstream apps follow the same pattern: a child account or child device, a parent app or cloud dashboard, and remote control. Their core set is web filtering, app blocking, per-app limits, schedules, location, reports, and increasingly "AI alerts" on messages. The main differences are how deep the monitoring goes (Bark's message scanning, Qustodio's call/SMS logs) and how they enforce limits (Family Link's OS-level integration, Apple's native Screen Time).

### Cited Findings

**Feature matrix (rows sourced individually)**

| Product | Core features (2025–2026) | Source |
|---|---|---|
| Google Family Link (free) | Screen Time tab, Controls tab (Play app approvals, Chrome/YouTube/Search restrictions, privacy settings), Location view; School Time on phones/tablets (schedule with breaks, choose which apps stay allowed); parent-managed contacts (calls/texts limited to approved contacts, child can request new contacts) | [Techlicious](https://www.techlicious.com/blog/google-family-link-app-upgrade-with-call-text-controls/); [PhoneArena](https://www.phonearena.com/news/google-just-empowered-parents-to-manage-their-kids-devices-with-these-incredible-new-features_id167482); [Chrome Unboxed](https://chromeunboxed.com/googles-family-link-is-rolling-out-some-new-features-for-parents/) |
| Qustodio | Free: SafeSearch, web filtering, pause internet, 7-day reports, 1 device. Basic: + games/app blocking, daily time limits, device-blocking routines, 30-day reports, panic button (Android only), location. Complete: + web/blocked-site alerts, app insights, per-app time limits, custom app/website routines, app download alerts, YouTube monitoring, calls/messages monitoring, AI search/message alerts, saved-places alerts | [Qustodio official comparison](https://www.qustodio.com/en/difference-between-qustodio-free-and-qustodio-premium/) |
| Bark | Jr: screen time management, website filtering, location alerts/check-ins, basic monitoring of texts/email/30+ apps. Premium: full monitoring of texts, email, YouTube, 30+ social platforms; AI alerts for cyberbullying, predators, mental-health concerns; GPS; app/website blocking. On iOS, Premium needs a Bark Sync charger because of Apple restrictions | [Bark support pricing](https://support.bark.us/en/articles/13460996-pricing); [FrontDeskReview, Jun 2026](https://frontdeskreview.com/software/parental-control/bark/) |
| Norton Family | Shows parents the child's search terms and viewed videos, age-appropriate content monitoring, screen limits; included with Norton 360 Deluxe/Premium | [Norton Family](https://us.norton.com/norton-family) |
| Kaspersky Safe Kids (cross-platform) | Free: online content monitoring, YouTube Safe Search, app usage control, screen time management. Premium: screen-time scheduling, location with safe-area alerts, battery tracker, YouTube search history, real-time alerts. Desktop version: the child can request more time or access to a blocked site in both Free and Premium | [Kaspersky cross-platform](https://support.kaspersky.com/safe-kids-cross-platform/204273); [Kaspersky Windows comparison](https://support.kaspersky.com/safe-kids-for-windows/136532) |
| Net Nanny | Location tracking/history, web filtering; content screening inside social apps instead of blocking them outright (2025 review) | [Tom's Guide](https://www.tomsguide.com/au/us/best-parental-control-apps,review-2258.html) |
| Mobicip | App blocking, website blocking, screen-time limits, remote device lock; no permanent free tier | [Mobicip pricing](https://app.mobicip.com/pricing); [FrontDeskReview, Sep 2026](https://frontdeskreview.com/software/parental-control/mobicip/) |
| OurPact | Schedules, app blocking; Premium+ adds screenshots from the child's device; very limited free version (one automated schedule, one device); setup needs a Mac/Windows computer (review undated) | [Tom's Guide](https://www.tomsguide.com/reviews/ourpact); [TechRadar](https://www.techradar.com/reviews/ourpact) |
| Kidslox | Location, location history, routes, screen-time schedules, web filtering, app blocking; Basic = 1 device, Family = 10 | [TechRadar](https://www.techradar.com/reviews/kidslox-parental-control-software) |
| Microsoft Family Safety | Screen-time limits for Windows, Xbox, and Android apps/games, managed from the Android/iOS app. Location and Drive Safety were **removed Nov 29, 2024** | [Microsoft support](https://support.microsoft.com/en-us/help/4293682); [ElevenForum](https://www.elevenforum.com/t/end-of-support-for-location-and-drive-safety-in-microsoft-family-safety-on-nov-29-2024.20441/) |
| Kids Place (kid launcher) | Could not verify; the Play Store fetch failed and the only other results came from an unreliable aggregator | (see Gaps) |
| Apple Screen Time (iOS 26 benchmark) | Apps can be fully blocked (limit of zero, not just one minute); child must ask a parent before replying to unknown numbers (third-party apps can adopt this); on-device nudity blurring in FaceTime and shared albums, on by default for child accounts; App Store hides apps above the child's age rating; Age Range API shares an age band, not the birth date; under-13 accounts get filters and communication limits by default | [Fox13 / iOS 26](https://www.fox13news.com/news/apple-parental-controls-ios26); [iPhoneSoft, Sep 2025](https://iphonesoft.fr/2025/09/16/ios-26-ameliore-securite-enfants-controle-parental) |

- Google sent emails to children nearing 13 telling them they could soon remove supervision. After parent backlash it revised the policy (Jan 2026) — [Bitdefender](https://www.bitdefender.com/en-us/blog/hotforsecurity/google-backtracks-on-teen-parental-controls-after-public-backlash)
- Kaspersky allows up to 100 child profiles and 500 devices per account — [Kaspersky](https://support.kaspersky.com/safe-kids-cross-platform/204273)

### Inferences
- The table-stakes set is: web category filter, app block, per-app daily limit, bedtime/schedule, reports. Littlegate's baseline covers all of these except **per-app daily time limits** and **per-category time budgets**. Those are the most visible missing table-stakes features.
- Monitoring of communications (Bark, Qustodio Complete, Family Link contacts, Apple's unknown-contact approval) is the fastest-growing area. It is also the area most at odds with Littlegate's privacy stance.

### Gaps
- No reliable 2025–2026 source on Kids Place / Kiddoware features or pricing (the Play listing fetch returned no content). The closest shared-device competitor is therefore unverified.
- Could not confirm Net Nanny's or Norton's full current Android feature list from the official pages (Norton's page snippet only).
- No direct source on Kidslox's or OurPact's 2026 feature changes.

## Q2. What do DNS-first tools offer that parental apps don't?

### Takeaway
DNS tools are better at **per-service blocking** (named apps such as TikTok and Fortnite, not just categories), **time-windowed access to specific services** (NextDNS "Recreation Time"), **network-wide coverage across devices**, custom domain overrides, and transparent logging/no-log options. They do nothing for app-level time, launchers, or tamper resistance, and CleanBrowsing explicitly leaves stopping bypasses to the administrator.

### Cited Findings
- NextDNS Parental Control: category blocking (porn, violence, piracy…), blocking of specific sites/apps/games (Facebook, TikTok, Snapchat, Tinder, Fortnite, Instagram, Twitch, YouTube), SafeSearch on all engines including image/video, YouTube Restricted Mode, and "Recreation Time", which allows selected services only during set daily windows. The site offers "try without signup" — [nextdns.io](https://nextdns.io/)
- A NextDNS user feature request says Recreation Time cannot cross midnight or be turned off on weekends (one user's report) — [NextDNS help forum](https://help.nextdns.io/category/ideas?pg=9)
- NextDNS free tier: 300,000 queries/month; unlimited around $1.99/mo — [SimeonOnSecurity](https://simeononsecurity.com/articles/nextdns-vs-adguard-ad-blocker-comparison); conflicting "from $4.99/month" on [Techjockey](https://www.techjockey.com/us/detail/nextdns) (unverified)
- CleanBrowsing: Basic (families) $8.99/mo or $75/yr, 25 devices, 3 profiles, 100 allow / 500 block custom domains; paid plans have activity logs with retention configurable from no logs to 90 days; Pro tiers can block TLDs and all internet. The free filters do no tracking. The page says the administrator is responsible for hardening devices against local DNS changes. Filter counts on the page are inconsistent (14, 21+, 26+) — [CleanBrowsing pricing](https://cleanbrowsing.org/pricing/)
- Cloudflare 1.1.1.1 for Families: free; 1.1.1.2 blocks malware, 1.1.1.3 blocks malware plus adult; criticized for over-blocking at launch (**2020 coverage**) — [BleepingComputer](https://www.bleepingcomputer.com/news/security/cloudflare-launches-a-dns-based-parental-control-service/)
- AdGuard DNS: kids' profiles with controls over which sites and **when**, up to 5 devices (**2023 deal article**) — [TechRepublic](https://www.techrepublic.com/article/adguard-dns-5-year-subscription/)
- Blokada: Blokada 5 is free, open source, Android; Blokada Family is a paid product (safe search, social-media blocking, activity monitoring, multiple devices); claims no tracking and no sale of data; no prices listed — [blokada.org](https://blokada.org/)

### Inferences
- What Littlegate can borrow (all local-only): (a) a **named-service blocklist** (one tap for "TikTok", "Roblox", "Fortnite", covering all their domains), not just categories; (b) **per-service time windows** ("YouTube only 16:00–18:00"), including windows that cross midnight and weekday/weekend variants, which fixes the NextDNS complaint; (c) a **no-log / short-retention toggle** for the local DNS log, so the privacy stance becomes a visible setting.
- The DNS tools' weakness is bypass: DoH in browsers, Private DNS, VPN apps. Littlegate's on-device VPN plus AccessibilityService can address this, which DNS-only services cannot.

### Gaps
- No primary source found on how NextDNS's "block bypass methods" toggle works or on current NextDNS/AdGuard DNS family pricing from official pages.
- Cloudflare and AdGuard data is 2020/2023; current state unverified.

## Q3. Pricing and free-vs-paid splits (2025–2026)

### Takeaway
Free tiers are deliberately thin: one device, filtering plus basic limits. Most paywalls cover **per-app time limits, routines/schedules, YouTube monitoring, alerts, location, and longer report history**. Paid prices cluster at roughly $15–$105/year for apps and $0–$75/year for DNS services.

### Cited Findings
- **Google Family Link**: free — [Cybernews](https://cybernews.com/best-parental-control-apps/android/)
- **Qustodio**: Free (1 device); Basic $59.95/yr; Complete $104.95/yr (official page, 15%-off banner) — [Qustodio](https://www.qustodio.com/en/difference-between-qustodio-free-and-qustodio-premium/). Conflict: [Security.org (Jul 2026)](https://www.security.org/parental-controls/qustodio/) lists $54.95 / $99.95. The official page also contradicts itself on Basic devices ("Unlimited" in the plan box vs "Up to 5" in the table). Paywalled even at Basic: app blocking, daily limits, routines, location. Complete-only: per-app limits, YouTube monitoring, call/SMS, AI alerts.
- **Bark**: Jr $5/mo or $49/yr; Premium $14/mo or $99/yr; 7-day trial — [Bark support](https://support.bark.us/en/articles/13460996-pricing). iOS Premium $20/mo including Bark Sync — [FrontDeskReview](https://frontdeskreview.com/software/parental-control/bark/). Bark Home router pricing conflicts ($6/mo or $79 one-time per FrontDeskReview; other figures from unreliable aggregators).
- **Norton Family**: $49.99 first year; renewal price not shown; 30-day trial — [Norton](https://us.norton.com/norton-family); [Cybernews](https://cybernews.com/best-parental-control-apps/)
- **Kaspersky Safe Kids**: free plan plus about $15/yr premium for unlimited devices (**Tom's Guide 2025**) — [Tom's Guide](https://www.tomsguide.com/au/us/best-parental-control-apps,review-2258.html). Scheduling, location, YouTube history, and real-time alerts are paywalled — [Kaspersky](https://support.kaspersky.com/safe-kids-cross-platform/204273)
- **Mobicip**: Lite $2.99, Standard $4.99, Premium $7.99 per month billed annually (5/10/20 devices); no free tier; 7-day trial + 30-day money-back — [Mobicip pricing](https://app.mobicip.com/pricing). Conflict: a third-party says annual-only billing, and another says $49.99/yr with a 7-day guarantee — [FrontDeskReview](https://frontdeskreview.com/software/parental-control/mobicip/)
- **OurPact**: Premium $6.99/mo ($69.99/yr, 20 devices); Premium+ $9.99/mo ($99.99/yr, adds screenshots); 14-day trial; free = 1 schedule, 1 device (**review dates unclear**) — [Tom's Guide](https://www.tomsguide.com/reviews/ourpact); [TechRadar](https://www.techradar.com/reviews/ourpact)
- **Kidslox**: three-way conflict: $3.09/mo Basic, $4.64/mo Family (annual) per [TechRadar](https://www.techradar.com/reviews/kidslox-parental-control-software); $7.99/mo or $59.99/yr per [U. Idaho guide, Sept 2024](https://cme.wwami.uidaho.edu/sites/default/files/media/2024-09/Parental%20Screen%20Time%20Control%20Apps.pdf); $4.29 / $6.79 per AirDroid (weak source)
- **Net Nanny**: "starting at $40" — [Techjockey](https://www.techjockey.com/alternatives/qustodio) (weak; unverified)
- **Microsoft Family Safety**: core is free; premium features came with Microsoft 365 Family — [Microsoft support](https://eus.prod.support.services.microsoft.com/en-au/account-billing/premium-family-safety-features-with-microsoft-365-family-418b186a-f2a7-5554-1354-e5f30b605a21)
- **CleanBrowsing**: free public filters; Basic $8.99/mo or $75/yr — [CleanBrowsing](https://cleanbrowsing.org/pricing/)
- **Cloudflare for Families**: free (2020) — [BleepingComputer](https://www.bleepingcomputer.com/news/security/cloudflare-launches-a-dns-based-parental-control-service/)
- **Aura**: Kids from $8.33/mo annually; Family $32/mo (conflict: Security.org $20/mo) — [Cybernews](https://cybernews.com/best-parental-control-apps/); [Security.org](https://www.security.org/parental-controls/best/)

### Inferences
- If Littlegate ships **per-app limits, routines, extra-time requests, and long local history for free**, it would beat every paid tier on those specific features, because none of them costs Littlegate server money. Possible monetization: a one-time "supporter" unlock rather than a subscription, since there is no server cost to recover. This is an inference, not sourced.

### Gaps
- Official current pricing pages for Kidslox, OurPact, Net Nanny, Kaspersky (US), and NextDNS were not fetched; figures above are from reviews.

## Q4. Most-cited differentiators and most-used / most-loved features

### Takeaway
The best usage evidence comes from Microsoft: it dropped location and driving because **digital-safety features were used far more**. Reviewers praise Family Link for being free and for OS-level app approval, Bark for AI alerts on messages, Qustodio for breadth, Kaspersky for price, and Net Nanny for in-app content screening.

### Cited Findings
- Microsoft said subscribers used digital-safety features far more than physical (location/driving) ones and retired the latter on Nov 29, 2024 — [Microsoft support](https://support.microsoft.com/en-us/help/4293682); [ElevenForum](https://www.elevenforum.com/t/end-of-support-for-location-and-drive-safety-in-microsoft-family-safety-on-nov-29-2024.20441/)
- Reviewers widely recommend Family Link as the free starting point for kids under 13, Qustodio/Norton for filtering and limits, and Bark for monitoring teen messages and social media — [Cybernews](https://cybernews.com/best-parental-control-apps/android/); [SafeWise](https://www.safewise.com/resources/parental-control-filters-buyers-guide/)
- Family Link Play reviews praise location and remote control, and criticize glitches and weak control over teens — [Kimola review analysis](https://kimola.com/reports/unlock-insights-with-our-family-link-feedback-analysis-report-google-play-en-140955)
- A 2026 roundup calls Kaspersky Safe Kids the most balanced and affordable choice — [Impulsec](https://impulsec.com/?p=25073) (weak source)
- Net Nanny is praised for an intuitive interface and screening inside social apps — [Tom's Guide](https://www.tomsguide.com/au/us/best-parental-control-apps,review-2258.html)
- Apple's iOS 26 headline features were zero-minute app blocking, unknown-contact approval, and on-device nudity blur — [Fox13](https://www.fox13news.com/news/apple-parental-controls-ios26)

### Inferences
- Microsoft's data supports Littlegate's digital-only, no-location stance.
- "Ask for more time" and "ask to unlock app" flows (Family Link app approvals, Kaspersky requests) are loved because they turn a block into a conversation. On a shared phone, the parent is physically present, so a **local request-and-approve-with-PIN flow** is a natural fit.

### Gaps
- No quantitative usage-share data (e.g., % of parents using each feature) found from any vendor except Microsoft's qualitative statement.

## Q5. Gaps few or none of the competitors fill (shared device, privacy-conscious parents)

### Takeaway
Every reviewed product assumes a **separate child device plus a cloud account and parent dashboard**. Common weaknesses are local bypasses (ADB, app cloning, Secure Folder/Private Space, embedded browsers in "always allowed" apps, clock changes), account-based "graduation" at 13, and data-hungry monitoring. A local-first app that is hardened against bypasses and built for sharing one phone faces little direct competition (inference; see Gaps).

### Cited Findings
- Bitdefender (Oct 2025, updated Apr 2026) lists Family Link bypasses: ADB/Developer Options (GitHub "Chronolink"), hidden unfiltered browsers via Help/Terms links in Play Services/WebView, Dual Apps/app cloning, Samsung Secure Folder / Private Space, DeX/Emergency Dialer/Accessibility Menu during downtime, clock/time-zone changes and reboots, account removal/factory reset, links sent through "always allowed" messaging apps that open a browser, and reopening cached apps from Recents — [Bitdefender](https://www.bitdefender.com/en-us/blog/hotforsecurity/family-link-bypass-android-2025)
- Its countermeasures are manual parent checklists (turn off dev options, check for duplicate icons, keep the always-allowed list minimal, close apps before downtime) — [Bitdefender](https://www.bitdefender.com/en-us/blog/hotforsecurity/family-link-bypass-android-2025)
- A complaint says a child removed Family Link without parental authorization — [SikayetVar](https://www.sikayetvar.com/en/family-link-us/google-family-link-lets-my-child-uninstall-parental-controls-without-permission)
- Google emailed kids nearing 13 about removing supervision, then revised after backlash (Jan 2026) — [Bitdefender](https://www.bitdefender.com/en-us/blog/hotforsecurity/google-backtracks-on-teen-parental-controls-after-public-backlash)
- Bark on iOS needs a charger device to scan; OurPact needs a computer to set up — [FrontDeskReview](https://frontdeskreview.com/software/parental-control/bark/); [Tom's Guide](https://www.tomsguide.com/reviews/ourpact)
- CleanBrowsing leaves device hardening against DNS changes to the admin — [CleanBrowsing](https://cleanbrowsing.org/pricing/)

### Inferences
- **Shared-device gap**: none of the products reviewed treat "parent hands own phone to child" as the main use case. They all require a child account or child device. Littlegate's Kid Mode is already positioned here. The ideas below make it stronger.
- **Bypass-hardening gap**: Bitdefender's countermeasures are manual parent checklists. Littlegate can turn them into automatic checks (see Q6), which is a concrete and marketable differentiator.
- **Privacy gap**: competitors' premium value is cloud monitoring (messages, location, AI alerts). A privacy-conscious parent has no good option that offers per-app limits, requests, and reports **without** an account. No-account also means no automatic "graduation at 13" email.

### Gaps
- No direct source (review or survey) that evaluates shared-device / single-phone family use; this gap claim is inferred from the products' architecture.
- No Reddit/forum sentiment collected directly (search returned none).

## Q6. Feature ideas, tagged by whether they work local-only or need a backend

### Takeaway
Most high-value ideas from the competitive gap analysis can be built **local-only** on Android with the components Littlegate already plans (VPN, AccessibilityService, UsageStats, Device Admin). The ideas that inherently need a backend (location, remote dashboard, message/AI monitoring, panic-to-parent) are the ones competitors paywall. They conflict with Littlegate's privacy stance and should be left out on purpose, as a stated position.

### Cited Findings
- Paywalled across competitors and relevant here: per-app time limits, routines, YouTube monitoring, alerts, 30-day reports (Qustodio Complete/Basic) — [Qustodio](https://www.qustodio.com/en/difference-between-qustodio-free-and-qustodio-premium/); scheduling, real-time alerts (Kaspersky Premium) — [Kaspersky](https://support.kaspersky.com/safe-kids-cross-platform/204273)
- Child requests for more time or blocked-site access exist in Kaspersky desktop (free) and Family Link (app approvals) — [Kaspersky](https://support.kaspersky.com/safe-kids-for-windows/136532); [Chrome Unboxed](https://chromeunboxed.com/googles-family-link-is-rolling-out-some-new-features-for-parents/)
- Named-service blocking and Recreation Time windows — [NextDNS](https://nextdns.io/)
- Bypass vectors to harden against — [Bitdefender](https://www.bitdefender.com/en-us/blog/hotforsecurity/family-link-bypass-android-2025)
- Apple zero-minute block, App Store age-gating, Age Range sharing — [Fox13](https://www.fox13news.com/news/apple-parental-controls-ios26)

### Inferences

Tags: **[LOCAL]** works fully on-device · **[BACKEND]** inherently needs a server or second device · **[CONFLICT]** clashes with privacy stance or v1 scope. Baseline items are not repeated.

**A. Time and limits (table-stakes, paywalled elsewhere)**
1. **Per-app daily time limits** inside Kid Mode (e.g., YouTube 45 min/day), enforced by the AccessibilityService guard plus UsageStats. [LOCAL] (Qustodio Complete-only.)
2. **Per-category time budgets** (all games 1h, all video 1h), with app-to-category mapping from Play category or manual. [LOCAL]
3. **Per-service DNS time windows** ("TikTok/YouTube domains allowed only 16:00–18:00"), with windows that cross midnight and weekday/weekend variants. This fixes the NextDNS limitation. [LOCAL]
4. **Kid Mode session timer with countdown and gentle warnings** (5-min / 1-min toasts, then a "time's up" screen instead of a hard cut). [LOCAL]
5. **Bank/rollover or "earned time"**: unused minutes carry over, or a parent grants bonus minutes for chores. [LOCAL]
6. **Zero-minute block / "always blocked" vs "blocked during schedule"** as explicit states (Apple only added this in iOS 26). [LOCAL]

**B. Request and approve (adapted for a shared phone)**
7. **"Ask for more time" / "Ask to open this app" / "Ask to unblock this site" on the block screen.** On a shared phone, the parent approves on the spot with PIN or biometric (+15 min, +30, until bedtime, always). [LOCAL]
8. **Request queue / inbox**: requests the child makes while the parent is away are queued, and the parent reviews them on next unlock. [LOCAL]
9. Remote approval from the parent's own phone. [BACKEND] (or local P2P over LAN/Bluetooth, which is complex; this is the competitors' cloud model)

**C. Bypass hardening (turns Bitdefender's manual checklist into automatic checks; strong differentiator)**
10. **Integrity checklist / "Safety check" screen**: detects Developer Options or USB debugging on, auto date/time off, Accessibility shortcut enabled, Private DNS set, another VPN app installed, Dual Apps/clone or Secure Folder/Private Space present, and shows a "fix it" deep link for each. [LOCAL]
11. **Clock-tamper detection**: compare elapsedRealtime with wall-clock time, flag time-zone or manual-time changes, and log them as tamper events. Base limits on monotonic time. [LOCAL]
12. **Reboot-near-bedtime detection**: log boot events during schedules and resume Kid Mode on boot. [LOCAL]
13. **Embedded-browser leak guard**: warn when an allowlisted app is known to open links (Messages, Gmail, WhatsApp), or block in-app WebView/Custom Tabs launches through the AccessibilityService. [LOCAL]
14. **Settings deep-link blocking in Kid Mode**: block Help/Terms/WebView entry points, the Emergency Dialer route, DeX, split-screen, and the Recents switcher. [LOCAL]
15. **Clear Recents at Kid Mode start/schedule start** so cached apps cannot be reopened. [LOCAL]
16. **DoH / DoT / VPN-app / proxy bypass blocking** in the local VPN (block known DoH endpoints, and flag VPN apps in the allowlist). [LOCAL]

**D. Reports and transparency (local)**
17. **Long local history** (30/90 days or unlimited) with weekly summaries. Competitors paywall 30-day history. [LOCAL]
18. **Weekly digest notification** to the parent on the same phone. [LOCAL] Emailed digest. [BACKEND/CONFLICT]
19. **Privacy dial for the DNS log**: off / counts only / 24h / 7d / 30d retention, plus "wipe now" (borrowed from CleanBrowsing's no-log to 90-day option). [LOCAL]
20. **"What Littlegate knows" screen and export** (local JSON/CSV export the parent controls; nothing uploaded). [LOCAL]
21. **Kid-facing transparency view**: what's blocked and why, and time remaining. Helps a conversation-based approach. [LOCAL]

**E. Shared-device specifics**
22. **Multiple kid profiles on one phone** (siblings with different allowlists/limits/age presets), selected at Kid Mode entry. Kaspersky supports 100 profiles, but cloud-based. [LOCAL]
23. **Age presets** (5–8, 9–12, 13–15, mirroring Apple's age bands) that pre-fill categories, apps, and limits. [LOCAL]
24. **Quick handoff modes**: "Toddler lock" (one app pinned, touch-lock), "Car ride", "Homework" (only edu apps plus allowlisted sites), each a one-tap preset. [LOCAL]
25. **Notification shielding in Kid Mode**: suppress the parent's message, email, and banking notifications while the child holds the phone. Protects the parent's privacy too. [LOCAL]
26. **Auto-exit safety**: Kid Mode ends on a schedule or when the parent's fingerprint is detected. Incoming calls from favourite contacts are allowed through. [LOCAL]
27. **Named-service quick blocks** (TikTok, Roblox, Fortnite, Discord) as one-tap toggles covering all their domains, in addition to categories. [LOCAL] Needs only a blocklist download, which is already allowed.

**F. Separate-device / Lock mode (later phase)**
28. **Play-install approval / block new installs** on a kid's own device via Device Owner. [LOCAL] (Family Link's signature feature, but app-store approval by remote parent is [BACKEND].)
29. **Block account removal / factory reset / safe-boot** via Device Owner policy, which addresses Bitdefender bypass #7. [LOCAL]
30. **Contact allowlist for calls/SMS** (Family Link and iOS 26 have this). [LOCAL] via Device Owner and the default dialer role, but large scope.

**Deliberately excluded (inherently backend or out of scope)**
- Location / geofencing / saved-places alerts. [BACKEND/CONFLICT] (Microsoft dropped it; supports the omission.)
- Remote parent dashboard / cloud reports. [BACKEND] (v1 excluded)
- AI message/social scanning (Bark, Qustodio Complete). [CONFLICT] (could be on-device but is content filtering; v1 excluded)
- Call/SMS log monitoring, screenshots (OurPact Premium+). [CONFLICT]
- Panic/SOS button to a parent (Qustodio). [BACKEND] (needs a second device)
- On-device nudity blur (iOS 26). [LOCAL] in principle with an on-device ML model, but it is content filtering, so it is out of v1 scope.

### Gaps
- Feasibility of individual detections (e.g., detecting Samsung Secure Folder or Android 15 Private Space from a non-system app, blocking Custom Tabs via Accessibility) was not researched. These need technical validation per OEM and Android version.
- No source checked for Play Store policy limits on AccessibilityService use for parental control in 2026. This should be verified before relying on ideas 13–14.
