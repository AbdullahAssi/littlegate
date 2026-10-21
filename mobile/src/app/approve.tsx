import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { IconCircle } from '@/components/IconCircle';
import { PinPad } from '@/components/PinPad';
import { PressableScale } from '@/components/PressableScale';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { type BlockRequest, describeRequest, type Grant, KidMode, type PinResult } from '@/lib/kidMode';
import { useCountdown } from '@/lib/useCountdown';
import { radius, space, useTheme } from '@/theme/tokens';
import { I } from '@/components/icons';

type Option = { label: string; spoken: string; grant: Grant };

const TIME_OPTIONS: Option[] = [
  { label: '+15 min', spoken: '15 more minutes', grant: { type: 'minutes', minutes: 15 } },
  { label: '+30 min', spoken: '30 more minutes', grant: { type: 'minutes', minutes: 30 } },
  { label: '+1 hour', spoken: 'One more hour', grant: { type: 'minutes', minutes: 60 } },
];
const OPEN_OPTIONS: Option[] = [
  { label: '15 min', spoken: 'For 15 minutes', grant: { type: 'for', minutes: 15 } },
  { label: '1 hour', spoken: 'For 1 hour', grant: { type: 'for', minutes: 60 } },
  { label: 'Always', spoken: 'Always', grant: { type: 'always' } },
];

/**
 * A grown-up answers an ask-a-grown-up request on this phone (report #6).
 * The PIN approves this one request only: it never opens Settings or ends Kid Mode.
 */
export default function Approve() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [request, setRequest] = useState<BlockRequest | null | undefined>(undefined);
  const [length, setLength] = useState<number | null>(null);
  const [choice, setChoice] = useState(0);
  const [result, setResult] = useState<PinResult | null>(null);
  // Read once on open: "asked 5 min ago" doesn't need to tick.
  const [openedAt] = useState(Date.now);
  const lockedFor = useCountdown(result?.lockedUntil ?? null);

  useEffect(() => {
    KidMode.getRequests().then((all) => setRequest(all.find((r) => r.id === id) ?? null));
    KidMode.getPinLength().then((n) => setLength(n ?? 4));
  }, [id]);

  async function leave() {
    // Kid Mode may be on (asked from the block screen) or off (answered from the dashboard).
    // In Kid Mode, skip past the block screen that asked: the child lands on their apps.
    const status = await KidMode.getStatus();
    if (status.active) router.dismissTo('/kid');
    else if (router.canGoBack()) router.back();
    else router.replace('/home');
  }

  if (request === undefined) return <Screen scroll={false}>{null}</Screen>;

  if (!request || request.status !== 'pending') {
    return (
      <Screen footer={<Button variant="secondary" label="Back" onPress={leave} />}>
        <View style={styles.header}>
          <Text variant="title">Already answered</Text>
          <Text tone="secondary">This request was answered already, so there’s nothing to do here.</Text>
        </View>
      </Screen>
    );
  }

  const options = request.kind === 'time' ? TIME_OPTIONS : OPEN_OPTIONS;
  const option = options[choice] ?? options[0];
  const ago = Math.round((openedAt - request.createdAt) / 60_000);

  async function onComplete(pin: string) {
    const r = await KidMode.approveRequest(request!.id, pin, option.grant);
    setResult(r);
    if (!r.ok) return false;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await leave();
  }

  const lockedOut = lockedFor > 0;
  const message = lockedOut
    ? 'Too many tries. Wait a moment and try again.'
    : result && !result.ok
      ? 'Wrong PIN.'
      : `Enter your PIN to say yes: ${option.spoken.toLowerCase()}.`;

  return (
    <Screen scroll={false} contentStyle={styles.content}>
      <View style={styles.header}>
        <IconCircle Icon={request.kind === 'time' ? I.hourglass : I.lockKey} size={56} on="sunken" />
        <Text variant="caption" tone="secondary">
          {ago < 1 ? 'Asked just now' : `Asked ${ago} min ago`}
        </Text>
        <Text variant="title" style={styles.center}>
          {describeRequest(request)}
        </Text>
        {/* The exact package or domain being allowed, so what's approved is what's shown. */}
        <Text variant="caption" tone="secondary" selectable style={[styles.center, styles.subject]}>
          {request.subject}
        </Text>
      </View>

      <View accessibilityRole="radiogroup" accessibilityLabel="What to allow" style={styles.options}>
        {options.map((o, i) => {
          const on = i === choice;
          return (
            <PressableScale
              key={o.label}
              containerStyle={{ flex: 1 }}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              accessibilityLabel={o.spoken}
              scaleTo={0.94}
              onPress={() => {
                if (on) return;
                Haptics.selectionAsync();
                setChoice(i);
              }}
              style={[styles.option, { backgroundColor: on ? colors.kid : colors.surface }]}>
              <Text variant="label" style={{ color: on ? colors.onKid : colors.text }}>
                {o.label}
              </Text>
            </PressableScale>
          );
        })}
      </View>

      <Text tone={result && !result.ok ? 'danger' : 'secondary'} style={styles.center} accessibilityLiveRegion="polite">
        {message}
      </Text>

      {length ? <PinPad length={length} disabled={lockedOut} onComplete={onComplete} /> : null}

      <View style={styles.footer}>
        <Button
          variant="secondary"
          label="Not now"
          onPress={async () => {
            await KidMode.denyRequest(request.id);
            await leave();
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'space-between', alignItems: 'center', gap: space.md },
  header: { alignItems: 'center', gap: space.sm, paddingHorizontal: space.md, marginTop: space.md },
  center: { textAlign: 'center' },
  subject: { fontVariant: ['tabular-nums'] },
  options: { flexDirection: 'row', gap: space.sm, alignSelf: 'stretch' },
  option: { minHeight: 44, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  footer: { alignSelf: 'stretch', gap: space.xs },
});
