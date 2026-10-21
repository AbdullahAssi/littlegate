import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { PinPad } from '@/components/PinPad';
import { Screen } from '@/components/Screen';
import { IconCircle } from '@/components/IconCircle';
import { Text } from '@/components/Text';
import { KidMode, type PinResult } from '@/lib/kidMode';
import { parentSession } from '@/lib/parentSession';
import { useCountdown } from '@/lib/useCountdown';
import { space } from '@/theme/tokens';
import { I } from '@/components/icons';

type Next = 'exit' | 'settings' | 'permissions' | 'dismissWarnings';

export default function Unlock() {
  const { next = 'settings', section } = useLocalSearchParams<{ next?: Next; section?: string }>();
  const [length, setLength] = useState<number | null>(null);
  const [result, setResult] = useState<PinResult | null>(null);
  useEffect(() => {
    KidMode.getPinLength().then((n) => setLength(n ?? 4));
  }, []);
  const lockedFor = useCountdown(result?.lockedUntil ?? null);

  async function onComplete(pin: string) {
    const r = next === 'exit' ? await KidMode.stopKidMode(pin) : await KidMode.verifyPin(pin);
    setResult(r);
    if (!r.ok) return false;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (next === 'exit') {
      router.dismissAll();
      router.replace('/home');
    } else if (next === 'dismissWarnings') {
      // Clearing tamper warnings needs the PIN, or a child could hide them. One action, then lock again.
      await KidMode.dismissWarnings();
      parentSession.close();
      router.back();
    } else {
      parentSession.open();
      if (next === 'permissions') router.replace('/permissions');
      else router.replace({ pathname: '/settings', params: section ? { section } : {} });
    }
  }

  const locked = lockedFor > 0;
  const message = locked
    ? `Too many tries. Try again in ${formatWait(lockedFor)}.`
    : result && !result.ok
      ? result.attemptsLeft
        ? `Wrong PIN. ${result.attemptsLeft} ${result.attemptsLeft === 1 ? 'try' : 'tries'} left before a short wait.`
        : 'Wrong PIN.'
      : next === 'exit'
        ? 'Enter your PIN to leave Kid Mode.'
        : next === 'dismissWarnings'
          ? 'Enter your PIN to clear the warnings.'
          : 'Enter your PIN to open settings.';

  return (
    <Screen scroll={false} contentStyle={styles.content}>
      <View style={styles.header}>
        <IconCircle Icon={I.lockKey} size={56} on="sunken" />
        <Text variant="title">Parent PIN</Text>
        <Text tone={locked || (result && !result.ok) ? 'danger' : 'secondary'} style={styles.center}>
          {message}
        </Text>
      </View>

      {length ? (
        <PinPad
          length={length}
          disabled={locked}
          onComplete={onComplete}
          extraKey={{ label: 'Forgot?', onPress: () => router.push('/recover') }}
        />
      ) : null}

      <View style={styles.footer}>
        <Button variant="secondary" label="Cancel" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}

function formatWait(ms: number) {
  const s = Math.ceil(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.ceil(s / 60)} min`;
}

const styles = StyleSheet.create({
  content: { justifyContent: 'space-between', alignItems: 'center' },
  header: { alignItems: 'center', gap: space.sm, paddingHorizontal: space.md, marginTop: space.lg },
  center: { textAlign: 'center' },
  footer: { alignSelf: 'stretch', gap: space.xs },
});
