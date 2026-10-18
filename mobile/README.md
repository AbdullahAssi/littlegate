# Kid Mode — mobile app

Android parental-control app. React Native (Expo SDK 58, Expo Router, Reanimated 4) for the UI; a local native Kotlin module (`modules/kid-mode`) for everything that must keep running in the background. Full plan: [`../PLAN.md`](../PLAN.md).

## Layout

```
src/app/            screens (Expo Router)
  onboarding/       welcome → create PIN → recovery code → categories
  home.tsx          parent dashboard
  kid.tsx           kid launcher (allowlisted apps only)
  unlock.tsx        PIN pad for leaving Kid Mode / opening settings
  recover.tsx       reset PIN with the recovery code
  settings.tsx      categories, allowed apps, custom domains (PIN-gated)
  permissions.tsx   permission checklist
src/components/     PressableScale, PinPad, Button, Card, Screen, Text, Enter
src/theme/          tokens.ts (colors, type, spacing), motion.ts (every curve/duration/spring)
src/lib/            kidMode.ts (hooks over the native API), parentSession, recoveryHandoff
modules/kid-mode/   native module: TS contract, dev mock, Kotlin (PinManager, KidModeModule)
```

## Running

UI preview with the mock (no Android SDK needed):

```bash
npx expo start --web
```

The mock (`modules/kid-mode/src/mock.ts`) is used only when the native module is missing, and only in dev — a release build without the native module throws on launch. A banner on the dashboard says when the mock is active.

Real device (needs JDK 17 + Android SDK, or EAS):

```bash
npx expo run:android                                   # local
npx eas-cli@latest build --profile development -p android   # cloud
```

## Checks

```bash
npx tsc --noEmit
npx eslint src modules
npx expo-doctor
npx expo export --platform android   # bundles JS, catches Babel/worklet errors without Gradle
```

## Design references

| Screen | Pattern | From |
| --- | --- | --- |
| Dashboard hero | Protection score ring + "next step" tip | Opal Focus Score |
| Dashboard chart | Stacked by top-3 categories, daily average, week-over-week trend; tap a day | Apple Screen Time, Opal |
| Quick actions | Controls one tap from home | Google Family Link |
| `/blocked` | Breathing circle instead of a hard wall | One Sec |
| Kid launcher | Time-of-day sky (dawn/day/dusk/night); preview with `/kid?sky=night` in dev | Kids' launchers |

## Motion rules

All values live in `src/theme/motion.ts`. Press feedback = 0.97 scale, 120ms strong ease-out (CSS transition). Entrances only on first-time screens (`Enter`). Wrong PIN = shake + error haptic, same frame. Screen transitions are the platform's own. Reduced motion is honoured everywhere.
