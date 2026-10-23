# Emerging Trends, Regulation, Novel Features and Business Model for Littlegate (2025-2026)

Research date: 2026-10-22. All legal/regulatory items are dated. Littlegate baseline features (DNS filtering, SafeSearch, Kid Mode launcher, allowlist, schedules, local stats, tamper events, PIN recovery, later Device Owner Lock mode) are NOT re-suggested. Each idea is tagged **[LOCAL]** (works with nothing leaving the phone except blocklist downloads) or **[BACKEND]** (needs a server/relay or account).

## 1. Kids and AI chatbots: risks, vendor parental controls, and how a parental app can supervise them

### Takeaway
AI chatbots became the main new child-safety issue of 2025-2026. Character.AI ended open-ended chat for under-18s, OpenAI shipped parental controls (Sept 2025) and age prediction (Jan 2026), Meta added AI-character controls, and California's SB 243 (in force 1 Jan 2026) regulates companion bots. None of the vendor controls show parents the conversations, and each works only inside that vendor's app. That leaves room for a cross-vendor "AI access" control at the device level, which Littlegate can do locally with DNS categories and the app allowlist.

### Cited Findings
- Common Sense Media's report "Talk, Trust, and Trade-Offs" (16 July 2025) found that nearly 3 in 4 US teens had used an AI companion, about half used one regularly, a third had chosen an AI companion over a human for a serious conversation, and a quarter had shared personal information with one — [aicompanionpick summary of CSM/FTC evidence](https://www.aicompanionpick.com/ai-companions-teen-safety-evidence-2026) (secondary summary; the primary CSM report was not fetched)
- FTC, 11 Sept 2025: Section 6(b) orders went to seven companion-chatbot operators (Alphabet, Character Technologies, Instagram, Meta, OpenAI, Snap, X.AI), approved 3-0. A 6(b) order is a study that compels information. It does not allege a violation — [FTC press release](https://www.ftc.gov/news-events/news/press-releases/2025/09/ftc-launches-inquiry-ai-chatbots-acting-companions); [DLA Piper](https://www.dlapiper.com/en-us/insights/publications/2025/09/ftc-ai-chatbots)
- California SB 243 (companion chatbots), in force 1 Jan 2026. When the operator knows the user is a minor, it must clearly disclose that the user is talking to an AI and repeat the notice every 3 hours. It also requires suicide/self-harm protocols, limits sexual content for minors, and creates a private right of action of at least $1,000 per violation. One source says about a dozen states had their own companion-chatbot rules by mid-2026 — [FPF](https://fpf.org/blog/understanding-the-new-wave-of-chatbot-legislation-california-sb-243-and-beyond/); [xident.io](https://xident.io/blog/companion-ai-age-verification-sb-243-state-law-wave-2026/) (the "dozen states" count comes from a vendor blog and is unverified)
- Character.AI, announced 29 Oct 2025: open-ended chats for under-18s ended by 25 Nov 2025, after a phase-down that started at a 2-hour daily limit. Enforcement uses in-house behavioural age assurance plus Persona. Lawsuits over teen suicides preceded the change — [TechCrunch](https://techcrunch.com/2025/10/29/character-ai-is-killing-the-chatbot-experience-for-minors/); [Bloomberg](https://www.bloomberg.com/news/articles/2025-10-29/character-ai-to-ban-children-under-18-from-talking-to-its-chatbots); [Rolling Stone](https://www.rollingstone.com/culture/culture-news/character-ai-sued-teens-suicide-banned-minors-chatbots-1235456426/)
- Experts say teens can get around the Character.AI ban with alternate accounts, VPNs, or shared/communal devices — [Cybernews](https://cybernews.com/ai-news/characterai-ban-teenagers/)
- OpenAI parental controls, 29 Sept 2025, work through linked teen accounts. They reduce graphic content and block romantic/sexual roleplay and extreme beauty ideals. Parents can set quiet hours, turn off voice mode, memory and image generation, and opt the teen out of training. Parents cannot see conversations, and experts reported the controls are easy to get around — [Modern Mom Playbook summary](https://modernmomplaybook.substack.com/p/openai-has-launched-parental-controls) (secondary)
- OpenAI age prediction, announced 20 Jan 2026. It estimates whether a user is under 18 from account age, active hours, usage patterns and stated age. When unsure it defaults to the teen experience. Adults flagged in error can verify with a Persona selfie — [OpenAI](https://openai.com/index/our-approach-to-age-prediction/); [BleepingComputer](https://bleepingcomputer.com/news/artificial-intelligence/openai-rolls-out-age-prediction-model-on-chatgpt-to-detect-your-age)
- Unconfirmed: iTWire reports a "ChatGPT for Teens" rollout on 18 Aug 2026, with Australian under-18s moved to the restricted version by 8 Sept 2026 — [iTWire](https://itwire.com/your-it-news/home-it/chatgpt-now-guesses-your-age-and-australian-under-18s-get-the-restricted-version-by-8-september) (not corroborated by OpenAI materials)
- Meta, Oct 2025: parents will be able to turn off a teen's one-on-one chats with AI characters entirely (the Meta AI assistant stays available) or block specific characters. Parents get "topic insights" but not transcripts. Rollout was planned for early 2026 — [Meta newsroom](https://about.fb.com/news/2025/10/teen-ai-safety-approach/); [CNBC](https://www.cnbc.com/2025/10/17/meta-ai-chatbot-parental-controls-ftc.html)
- Google Gemini: Family Link lets parents turn Gemini on or off for children, including under-13s on supervised accounts, but parents cannot see conversations. Sources conflict on whether Family Link added deeper AI oversight — [HeyOtto blog](https://www.heyotto.app/blog/ai-with-parental-controls); [Gentlegate guide](https://gentlegate.ai/blog/ai-parental-controls-complete-guide) (secondary, conflicting)
- Mainstream parental-control apps (Bark, Qustodio, OS screen time) are described as not covering AI chatbot use in a targeted way. This claim comes from a competitor's marketing — [HeyOtto](https://www.heyotto.app/blog/ai-with-parental-controls)

### Inferences (feature ideas)
- **AI chatbot category in the DNS filter [LOCAL]:** a dedicated "AI assistants & companions" category with sub-toggles: (a) companion/roleplay bots (Character.AI, Replika, Talkie, Chai, Janitor AI), blocked by default for every age; (b) general assistants (chatgpt.com, gemini.google.com, claude.ai, copilot, perplexity, meta.ai), each set to allow, block or schedule; (c) AI image generators. Domain lists must be curated, because AI services change domains often. This is the main gap the vendor controls leave: each one works only inside its own product.
- **AI app guard [LOCAL]:** add AI app package names (Character.AI, ChatGPT, Gemini, Replika, Talkie, Poly.AI) to a "high-risk" preset in the allowlist UI. Note that Snapchat My AI and Meta AI sit inside general apps, so they cannot be blocked separately at the DNS level without breaking the host app. Littlegate should say so plainly.
- **"Homework AI window" [LOCAL]:** allow general assistants only during a scheduled homework block. Reuses the existing schedule engine.
- **Kid-safe AI pointer [LOCAL]:** when an AI domain is blocked, the kid-facing block screen can explain why and point to the vendor's teen experience, so a parent can set up a linked ChatGPT teen account. Littlegate does not proxy any AI itself.
- **Setup checklist for vendor controls [LOCAL]:** an in-app guide to linking an OpenAI teen account, setting Meta AI character controls and the Family Link Gemini toggle. The content is static, there is no backend, and it adds value cheaply.
- Do NOT build conversation monitoring. It conflicts with the privacy stance and with the "no content/keyword filtering" constraint.

### Gaps
- I did not fetch the primary Common Sense Media report or Snapchat My AI's current parental controls (Family Center).
- I found no primary Google source on Gemini teen/kid controls in 2026.
- I found no maintained public blocklist of AI-chatbot domains. A category would need Littlegate's own curation, or a check of the existing category lists from OISD, HaGeZi or NextDNS (not verified).

## 2. Regulation and age assurance: status (verified and dated) and what it means for Littlegate

### Takeaway
Age assurance is moving into the OS and app-store layer. Texas SB 2420 has been in effect since 28 May 2026 after the Fifth Circuit stayed the injunction, and Google's Play Age Signals API is live for Texas and Brazil. California AB 1043 requires OS-level age signals from 1 Jan 2027. The UK children's codes have been enforced since 25 July 2025, and Australia's under-16 ban has been in force since 10 Dec 2025. The US federal KIDS Act passed the House but is stalled in the Senate, and the amended COPPA Rule has been fully enforceable since 22 April 2026. Littlegate collects no child data off-device, which keeps its own exposure low. The bigger opportunity is to position it as the parent-side complement to these regimes: platform bans are leaky, and parents still need device-level tools.

### Cited Findings
**UK Online Safety Act**
- The Protection of Children Codes took effect on 25 July 2025. Penalties can reach £18m or 10% of qualifying worldwide revenue, and courts can order access blocked — [Express & Star](https://www.expressandstar.com/uk-news/comply-with-child-age-checks-or-face-consequences-ofcom-tells-tech-firms-5681195)
- Enforcement so far has targeted mostly adult sites: AVS Group £1m (Dec 2025), Kick Online Entertainment £800k (Feb 2026), 8579 LLC £1.35m (Feb 2026, the largest so far), and a £600k fine (9 July 2026) — [Ofcom AVS](https://www.ofcom.org.uk/online-safety/protecting-children/ofcom-fines-porn-company-1million-for-not-having-robust-age-checks); [Ofcom Kick](https://www.ofcom.org.uk/online-safety/protecting-children/ofcom-fines-porn-company-800k-for-failing-to-introduce-age-checks); [Ofcom £630k item](https://www.ofcom.org.uk/online-safety/protecting-children/ofcom-fines-porn-company-630000-for-age-check-failings)
- I found no evidence of children's-code fines against major social platforms as of these results — (search gap, see Gaps)

**Australia, Social Media Minimum Age**
- In force since 10 Dec 2025. Platforms must take reasonable steps to stop under-16s from holding accounts. There are no penalties for children or parents. The covered services are Facebook, Instagram, Snapchat, Threads, TikTok, Twitch, X, YouTube, Kick and Reddit. The rules were amended on 25 March 2026 to target addictive or harmful design features — [eSafety](https://www.esafety.gov.au/about-us/industry-regulation/social-media-age-restrictions)
- Platforms removed or restricted 4.7m accounts by mid-Dec 2025, and more than 300k further sign-ins were blocked by early March 2026. eSafety raised "significant concerns" about Facebook, Instagram, Snapchat, TikTok and YouTube and opened investigations — [eSafety](https://www.esafety.gov.au/about-us/industry-regulation/social-media-age-restrictions); [Euronews 31 Mar 2026](https://euronews.com/next/2026/03/31/australia-warns-social-media-platforms-of-major-gaps-in-under-16-ban-enforcement)
- A BMJ study of 408 teens, reported via a secondary source, found more than 85% of Australian under-16 participants still used social media three months after the ban — [Auslume](https://media.auslume.com.au/insights/under-16-social-media-ban-first-results-report) (secondary)
- The Online Safety Amendment (Strengthening Enforcement for the Social Media Minimum Age) Bill 2026 passed. It expands information-gathering powers, including over age-assurance providers and app store operators, and raises penalties. The maximum is 150,000 penalty units, which eSafety states as A$54.6m; other sources say A$49.5m — [eSafety](https://www.esafety.gov.au/about-us/industry-regulation/social-media-age-restrictions); [JURIST June 2026](https://www.jurist.org/news/2026/06/australia-moves-to-strengthen-under-16-social-media-ban-amid-evidence-of-enforcement-concerns/)

**US app-store age verification**
- Texas SB 2420 (App Store Accountability Act): a district court enjoined it in Dec 2025. The Fifth Circuit stayed the injunction in May 2026, so the law took effect, and the Supreme Court declined to vacate the stay. This was emergency relief, not a ruling on the merits, and the appeal is ongoing — [Texas Tribune, 28 May 2026](https://www.texastribune.org/2026/05/28/texas-apple-google-app-store-age-verification/); [FKKS on the Dec 2025 injunction](https://technologylaw.fkks.com/post/102lz1n/texas-app-store-accountability-act-enjoined-the-happiest-of-holidays). The Supreme Court order date is unconfirmed (one source says July 2026; dockets 25A1389/25A1390)
- Utah and Louisiana reportedly pushed their effective dates to 2027 by legislation — [RecordingLaw comparison](https://www.recordinglaw.com/us-laws/age-verification-laws/app-store-age-verification-laws/) (secondary, not verified against the legislatures)
- California AB 1043 (Digital Age Assurance Act), chaptered 13 Oct 2025. OS providers (named examples include Google Android) must collect age at device/account setup and send a signal in four brackets (<13, 13-15, 16-17, 18+). Developers must request the signal on download/launch and are then treated as knowing the user's age range. The Attorney General enforces it. It takes effect 1 Jan 2027, and the setup interface for pre-existing accounts is due by 1 July 2027 — [CalMatters Digital Democracy](https://calmatters.digitaldemocracy.org/bills/ca_202520260ab1043); [Troutman](https://www.troutmanprivacy.com/2025/10/analyzing-californias-digital-age-assurance-act/); [LegiScan text](https://legiscan.com/CA/text/AB1043/id/3273385)
- Google Play Age Signals API (beta): live for Brazil (Digital ECA) since 17 March 2026, and for Texas accounts created after 28 May 2026. It also supports telling Play about significant app changes that need parental approval, and receiving notices when approval is revoked. Under the terms, data may be used only "to provide age-appropriate content and experiences in compliance with laws". Using it for advertising, marketing, profiling or analytics is prohibited, and violations can lead to app takedown. The page was last updated 20 July 2026 — [Android Developers](https://developer.android.com/google/play/age-signals/overview)

**US federal**
- Amended COPPA Rule: effective 23 June 2025, with compliance required by 22 April 2026. New requirements include separate consent before disclosing a child's data to third parties, a written data-retention policy, and biometric identifiers counted as personal information — [Federal Register, 22 Apr 2025](https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule); [Finnegan](https://www.finnegan.com/en/insights/articles/coppas-amended-rule-is-now-in-full-effect-what-operators-need-to-know.html)
- KIDS Act (H.R. 7757): passed the House 29 June 2026, 267-117, under suspension. It bundles parts of KOSA, COPPA 2.0, the SAFE BOTS Act (AI chatbots), the SCREEN Act and others, but drops KOSA's duty of care, and Senate sponsors (Blackburn, Blumenthal) called it "dead". It was referred to Senate Commerce on 13 July 2026, and I found no further action — [CRS LSB11465](https://www.congress.gov/crs-product/LSB11465); [Crowell](https://www.crowell.com/en/insights/client-alerts/house-advances-bipartisan-kids-online-safety-bill-but-senate-showdown-looms); [Pillsbury](https://www.pillsburylaw.com/en/news-and-insights/kids-act-house-ai-chatbot-safety.html)
- COPPA 2.0 reportedly passed the Senate by unanimous consent on 5 March 2026 — [privacylawmap](https://privacylawmap.com/blog/coppa-rule-amendments-april-2026-compliance-checklist) (single secondary source, unverified)

**EU**
- The DSA Article 28 guidelines on protecting minors were published 14 July 2025. They are non-binding but are the benchmark regulators use to assess compliance, and they apply to all platforms accessible to minors, not only VLOPs. The final text accepts age estimation. An EU age-verification app blueprint was piloted in Denmark, Greece, Spain, France and Italy as a stopgap until the EUDI Wallet arrives (targeted for end of 2026). A 2026 Commission Recommendation on age verification followed — [FPF](https://fpf.org/blog/the-eu-commissions-approach-to-age-verification-mobile-apps-dsa-enforcement-and-challenging-national-social-media-bans/); [EC consultation page](https://digital-strategy.ec.europa.eu/en/library/commission-seeks-feedback-guidelines-protection-minors-online-under-digital-services-act); [2b-advice](https://2b-advice.com/en/2025/08/13/eu-age-verification-data-protection-compliant-age-verification-under-the-digital-services-act/)

### Inferences (obligations and opportunities)
- **Obligation (low):** Littlegate is a parent-operated tool that sends no child data off-device, so most COPPA duties (consent, retention, third-party disclosure) apply only lightly or not at all. Keeping things that way, with no analytics SDKs and no ad SDKs, is itself a compliance position worth stating in the Play listing and Data Safety form. Legal review is still advised.
- **Play Age Signals [LOCAL, Android API]:** Littlegate could read the signal on the kid's device to pre-fill an age-appropriate preset ("graduated freedom", section 3). The terms allow use for age-appropriate experiences but forbid analytics or profiling, which fits a local-only design. Signals exist only in some jurisdictions and only for supervised or newly created accounts, so manual age entry must remain the default.
- **"Ban-gap" filtering preset [LOCAL]:** Australia's ban is leaky (85% still using, if the study holds), and evasion relies on browsers, VPNs and alternate accounts. An "AU under-16 preset" that blocks the ten listed platforms at the DNS and app level, with an explanatory note citing eSafety, is a timely marketing hook. The same applies to UK parents.
- **Anti-circumvention [LOCAL]:** blocking third-party VPN and proxy apps or domains is already common, but this research shows it is the main way kids evade platform-level bans. Littlegate should flag "another VPN app tried to start" as a tamper event. Android allows only one active VpnService, and Littlegate's VPN being displaced is detectable.
- **AB 1043 (2027):** if Android adds an OS-level age signal, Littlegate may itself count as a "developer" required to request it once it ships in California. Monitor this; it is low burden.
- **Marketing copy:** "Laws make platforms check age. Littlegate lets *you* decide, on the device, with nothing uploaded." This frames Littlegate as complementing the regimes, not competing with them.

### Gaps
- I could not confirm the exact Supreme Court order date on Texas SB 2420, or the details of the Utah/Louisiana 2027 delays, from the legislatures.
- I did not verify Ofcom actions against major social platforms under the children's codes, or whether Ofcom's July 2026 age-assurance report was published.
- I did not confirm whether the EU age-verification app launched nationally in 2026.
- I did not check Apple's Declared Age Range API (iOS is out of scope anyway).

## 3. Positive and autonomy-supportive features

### Takeaway
The AAP now uses a conversation-based approach (the "5 Cs" plus the Family Media Plan, with teen input and the same rules applying to parents). A crowded set of small apps sells "earn screen time with chores", mostly on iOS through Apple's Family Controls. All of this can be built locally on Android, and it suits a shared-phone, PIN-gated model well.

### Cited Findings
- The AAP Center of Excellence on Social Media and Youth Mental Health publishes the "5 Cs of Media Use", with age-specific guides from infancy to older teens. The framework was inspired by Lisa Guernsey's "3 Cs" — [AAP 5Cs](https://www.aap.org/5Cs); [AAP clinician tips](https://www.aap.org/en/patient-care/media-and-children/center-of-excellence-on-social-media-and-youth-mental-health/how-to-use-the-5-cs-of-media-use-tips-for-pediatric-clinicians/)
- The AAP Family Media Plan helps families set media priorities. For teens, families review the plan together with teen input on rules, and parents follow the same rules — [AAP older-teens 5Cs PDF](https://downloads.aap.org/AAP/PDF/CoE_5Cs_Older_Teens.pdf); [HealthyChildren 5 Cs school-age](https://www.healthychildren.org/English/family-life/Media/Pages/kids-and-screen-time-5-cs-questions-for-school-age-children.aspx)
- Common patterns in earn-screen-time apps: must-do tasks unlock the daily allowance, plus bonus tasks (ScreenTreat); minutes assigned per task, e.g. clean room = 20 min, with apps relocking at zero (Earn Time); banked minutes that carry over, plus exercise as a task (MoveToPlay). Several rely on Apple Family Controls for enforcement — [App Store: Choretastic](https://apps.apple.com/app/id6760679635); [Earn Screen Time](https://apps.apple.com/app/id6757981439); [MoveToPlay](https://alternativeto.net/software/movetoplay-earn-screen-time/about/); [ScreenCoach](https://apps.apple.com/us/app/screencoach/id1509516221) (developer descriptions only, low ratings counts)

### Inferences (feature ideas)
- **Family Media Agreement builder [LOCAL]:** a guided screen that walks parent and child through priorities (sleep, homework, device-free zones, which apps) and writes the result straight into Littlegate's schedules and allowlist. It includes a "parent pledge" section, following the AAP's same-rules principle, and is shareable as a PDF or image. Avoid using the AAP's name or branding without permission; cite it as inspiration.
- **Earned-time wallet with chore checklist [LOCAL]:** parent-defined tasks with minute values; the parent approves with a PIN on the same phone (fits the shared-phone model); bank caps and expiry; "must-dos before fun apps". Android can enforce this with the existing AccessibilityService guard, an advantage over iOS-only competitors.
- **Request-to-unlock with a reason [LOCAL on shared phone; BACKEND or offline code for a separate device, see section 4]:** the child taps "Ask for 15 more minutes / unblock this site" and picks a reason. On a shared phone the request queues until the parent enters the PIN. The kid-facing block page explains in plain language which category the site is in and why.
- **Graduated-freedom presets by age band [LOCAL]:** use AB 1043-style brackets (<13, 13-15, 16-17) plus younger bands (toddler, 5-8). An optional "level up" review reminder on each birthday or every six months nudges parents to loosen controls. Can be pre-filled from Play Age Signals where available.
- **Wind-down mode [LOCAL]:** 30 minutes before bedtime, grayscale (via the Accessibility/Digital Wellbeing approach if feasible on non-Device Owner setups, which needs verifying), dimmer launcher theme, only "calm" allowlist apps, and a visual countdown, then lock.
- **Focus/homework mode [LOCAL]:** only school apps and education domains, with an optional AI-assistant window (section 1).
- **Weekly reflection card [LOCAL]:** turns the local stats dashboard into conversation prompts in the style of the 5 Cs ("What did you enjoy most this week?"), not surveillance.

### Gaps
- I found no peer-reviewed evidence in this pass on whether earned screen time or chore rewards improve outcomes, versus fixed limits.
- I did not confirm which AAP Family Media Plan updates appeared in 2025-2026.
- I did not verify which of the 5 Cs are which.

## 4. Local-first and privacy-preserving remote control (alternative to cloud dashboards)

### Takeaway
No mainstream parental-control app was found that offers TOTP-style parent-generated offline unlock codes. Google Family Link does have an offline "parent access code" that depends on the device clock, which proves the concept is accepted at scale. The local-first remote-control space looks open; I found only a self-hosted GitHub project.

### Cited Findings
- Google Family Link: a parent access code can unlock a child's Android device or Chromebook when it is offline — [Google For Families Help](https://support.google.com/families/answer/7103340?hl=en)
- Family Link's offline code is reportedly based on date and time, so a wrong clock on the child's device breaks it, and parents report being locked out — [JustAnswer thread](https://www.justanswer.com/android-devices/pfk62-child-tablet-locked-google-parent-monitoring-app.html) (anecdotal)
- Parental OpControl, a self-hosted open-source project: parent dashboard, Windows client with offline enforcement from a local cache, a parent override PIN, and TOTP 2FA for parent accounts — [GitHub](https://github.com/ziur-vela/parental-opcontrol)
- The search turned up no mainstream app using E2EE relays, Matrix, Nostr or LAN pairing for parental control — (absence of evidence from search; see Gaps)

### Inferences (feature ideas, ranked by fit with the privacy stance)
1. **Signed offline unlock codes [LOCAL]:** pair once by having the parent's phone (running Littlegate in "Parent app" mode) scan a QR on the kid device, which exchanges a shared secret or an Ed25519 public key. The parent can then generate a short code for "+30 min" or "unlock site X for 1 h". Two designs: (a) HOTP/TOTP with a drift window and a counter fallback for wrong clocks, which fixes the known Family Link failure; (b) the action is encoded and signed, e.g. "grant:30min:nonce", with a short base32 code. Typing a short code means the payload has to stay tiny, so HMAC truncated to 8-10 characters with the action encoded is realistic. This is the strongest novel differentiator. It needs no server and works on separate devices for Lock mode.
2. **QR handshake for richer commands [LOCAL]:** the kid device shows a QR containing the request (app, minutes, nonce); the parent's phone scans it, approves, and shows a response QR or code. No network is needed, and requests become authenticated in both directions.
3. **LAN sync on home Wi-Fi [LOCAL]:** mDNS/NSD discovery plus a TLS or Noise channel pinned at QR pairing. The parent's phone can view stats and change schedules while both phones are on the same network. Nothing leaves the home.
4. **Optional E2EE relay for remote requests [BACKEND, but zero-knowledge]:** a "dumb" relay (or push via FCM carrying only ciphertext) forwards encrypted request/approve messages. The server sees only opaque blobs. Nostr relays could be used to avoid running infrastructure, but reliability and metadata exposure would need evaluating. This is the natural paid tier.
5. **SMS commands [LOCAL, but risky]:** SEND_SMS/RECEIVE_SMS permissions are restricted by Google Play policy to default SMS handlers and approved exceptions (not verified in this pass, and likely a blocker). Prefer options 1-3.

### Gaps
- I did not find whether Kidslox, OurPact, Qustodio or others offer offline codes; only Family Link was confirmed.
- I did not verify whether Play's SMS/Call Log permission policy exceptions cover parental control.
- I did not research Matrix or Nostr feasibility.

## 5. Toddler and shared-device specific ideas

### Takeaway
I did no dedicated searching on toddler features. The ideas below are inferences that extend Littlegate's shared-phone Kid Mode, so treat them as design hypotheses, not evidence-backed findings.

### Cited Findings
- AAP publishes separate 5 Cs guidance for infancy, toddlers and preschoolers, which signals different needs by age — [AAP 5Cs](https://www.aap.org/5Cs)
- Earn-time and visual timer apps are a busy app-store niche, which suggests parents want this — [App Store listings above](https://apps.apple.com/app/id6757981439)

### Inferences (feature ideas, all [LOCAL])
- **"Pass the phone" quick mode:** a one-tap shortcut (notification tile or a launcher long-press) that picks a preset (for example "YouTube Kids 20 min" or "drawing app only") and pins it immediately, without walking through setup. Unpinning requires the PIN.
- **Video-call-with-grandparents lock:** pins a single app (WhatsApp, Meet, Duo), suppresses notifications and the home/back gestures, and blocks hang-up to stop accidental exits, or only allows hang-up, as a choice. The call ending locks the screen.
- **Visual countdown:** a "sand timer" overlay with colour transitions and a gentle chime, plus a 2-minute warning for pre-readers. Littlegate already has a launcher, so this is cheap to build.
- **Content packs:** curated, downloadable allowlists (domains plus suggested apps) such as "Pre-K learning", "Bedtime stories" and "Grandparent visit". These are fetched like blocklists, so they stay within the privacy stance. They could also be a paid add-on.
- **Touch lock / "watch only" mode:** the screen ignores touches during a video, for toddlers.
- **Profile picker with avatars:** for siblings sharing one phone, with different presets per child.

### Gaps
- I did not research competitor toddler features (for example Kidslox, Kids Place, Samsung Kids) or Android screen-pinning limits without Device Owner.

## 6. Business models and pricing norms

### Takeaway
Category norms are annual subscriptions of about $50-$100 a year per family (Qustodio about $55-60 a year for 5 devices, Kidslox $49.99-$79.99 a year, Bark $49-$99 a year, Aura $10 a month for kids). Google Family Link is free and sets the floor. Privacy-first infrastructure companies sustain themselves with low flat fees (NextDNS Pro $1.99 a month or $19.90 a year; Mullvad a flat €5 a month with anonymous accounts). Because Littlegate has no server costs for its core features, it can credibly offer a one-time purchase. A subscription is only justified for anything that needs a backend (E2EE relay) or ongoing curation (blocklist and AI-category updates, content packs).

### Cited Findings
- Google Family Link: free — [Kidslen comparison](https://kidslen.app/blog/family-link-qustodio-bark-aura-compared)
- Qustodio: a "forever free" tier; Basic $54.95-$59.95 a year for 5 devices (figures vary by source, Jan 2026) — [Battencyber](https://battencyber.com/briefs/best-bark-alternatives/); [Inboxfamily](https://inboxfamily.com/guides/parental-control-apps); [SafeWise](https://www.safewise.com/kids-safety/parental-control-apps/)
- Bark Premium: $14 a month or $99 a year for unlimited kids and devices. Bark Jr: $5 a month or $49 a year with fewer features — [Battencyber](https://battencyber.com/briefs/best-bark-alternatives/)
- Aura: Kids plan about $10 a month; Family plan about $32 a month (security bundle) — [Battencyber](https://battencyber.com/briefs/best-bark-alternatives/); [Timily](https://timily.app/guides/aura-parental-control/)
- Kidslox: $49.99 a year for a single device, $79.99 a year for a family plan of up to 10 devices (another source says $47.99) — [Timily Kidslox review](https://timily.app/guides/kidslox-review/); [Impulsec](https://impulsec.com/parental-control-software/qustodio-vs-kidslox/)
- NextDNS: free up to 300,000 queries a month; Pro $1.99 a month or $19.90 a year; education plans priced per 250 students. One aggregator's $4.99 figure conflicts with this — [Control D blog (competitor)](https://controld.com/blog/nextdns-pricing/); [Reclaim The Net](https://reclaimthenet.org/recommended-tool/nextdns)
- Mullvad: flat €5 a month, no discounts for longer terms, accounts identified by a random number with no email — [VPN.com](https://www.vpn.com/vpn/mullvad/pricing/)
- I found no documented lifetime or one-time licence in mainstream parental control apps. One forum view holds that lifetime plans are unsustainable for server-heavy services — [MalwareTips forum](https://malwaretips.com/threads/mullvad-dns-blocking.112631/) (opinion)

### Inferences (recommended model)
- **Free core [LOCAL]:** DNS category filtering, SafeSearch, Kid Mode launcher, one child profile, basic schedule. This competes with free Family Link on privacy and shared-phone use, which Family Link does not do well because it supervises accounts, not shared phones.
- **Littlegate Plus, one-time purchase of about $19.99-$29.99 [LOCAL]:** multiple child profiles, earned-time wallet, media-agreement builder, graduated presets, offline signed unlock codes plus parent-app pairing (QR/LAN), AI-chatbot category, toddler modes, detailed local stats. This undercuts every competitor's annual price. "Pay once, no account, nothing uploaded" is a distinctive message.
- **Optional low-cost subscription, about $1.99 a month or $14.99-$19.99 a year (NextDNS-like anchor) [BACKEND]:** E2EE remote request relay (away from home), curated blocklist and AI-domain update cadence, and content packs. Mullvad-style anonymous purchase (no email; a Play purchase token as identity) fits the brand.
- Alternative: a family plan is moot, because there are no accounts; a licence is tied to the parent's Google Play account and shared through Play Family Library if the product is eligible (not verified).
- Never monetize with ads or data. This is consistent with the Play Age Signals terms (no ads or profiling) and COPPA, and it is the core brand promise.

### Gaps
- I did not find Blokada's current pricing or business model, or Google Play's revenue share norms and Family Library eligibility for in-app purchases.
- I found no conversion data for one-time versus subscription in this category.
- I did not verify competitor prices on vendor pages; all are from 2026 review sites and vary.
