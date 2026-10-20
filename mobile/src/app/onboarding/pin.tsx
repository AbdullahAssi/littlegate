import * as Haptics from 'expo-haptics';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { PinPad } from '@/components/PinPad';
import { Screen } from '@/components/Screen';
import { Steps } from '@/components/Steps';
import { IconCircle } from '@/components/IconCircle';
import { Text } from '@/components/Text';
import { KidMode } from '@/lib/kidMode';
import { parentSession } from '@/lib/parentSession';
import { recoveryHandoff } from '@/lib/recoveryHandoff';
import { layoutAnim } from '@/theme/motion';
import { space } from '@/theme/tokens';
import { I } from '@/components/icons';

export default function CreatePin() {
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  useEffect(() => {
    KidMode.hasPin().then(setHasPin);
  }, []);
  const [length, setLength] = useState<4 | 6>(4);
  const [first, setFirst] = useState<string | null>(null);
  const [mismatch, setMismatch] = useState(false);

  async function onComplete(pin: string) {
    if (first === null) {
      setFirst(pin);
      setMismatch(false);
      return;
    }
    if (pin !== first) {
      setMismatch(true);
      setFirst(null);
      return false;
    }
    const { recoveryCode } = await KidMode.createPin(pin);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    recoveryHandoff.set(recoveryCode);
    // The parent just proved ownership by creating the PIN: open the session for the rest of setup.
    parentSession.open();
    router.replace('/onboarding/recovery');
  }

  const confirming = first !== null;

  // A PIN already exists: never let onboarding (or a deep link) replace it.
  if (hasPin === null) return null;
  if (hasPin) return <Redirect href="/" />;

  return (
    <Screen scroll={false} contentStyle={styles.content}>
      <View style={styles.header}>
        <IconCircle Icon={I.key} size={56} on="sunken" />
        <Steps at={1} />
        {/* Keyed by step: the new instruction fades in rather than the words swapping under the eye. */}
        <Animated.View key={`${confirming}-${mismatch}`} entering={layoutAnim.fadeIn()} style={styles.headline}>
        <Text variant="title">{confirming ? 'Enter it once more' : 'Create a parent PIN'}</Text>
        <Text tone={mismatch ? 'danger' : 'secondary'} style={styles.center}>
          {mismatch
            ? "Those PINs didn't match. Start again."
            : confirming
              ? 'Confirm your PIN so we know it’s right.'
              : 'You’ll need it to leave Kid Mode or change settings. Don’t share it with your kids.'}
        </Text>
        </Animated.View>
      </View>

      {/* Remount on step change so the dots reset cleanly. */}
      <PinPad key={`${length}-${confirming}`} length={length} onComplete={onComplete} />

      <View style={styles.footer}>
        {!confirming ? (
          <Button
            variant="ghost"
            label={length === 4 ? 'Use a 6-digit PIN' : 'Use a 4-digit PIN'}
            onPress={() => setLength(length === 4 ? 6 : 4)}
          />
        ) : (
          <Button variant="ghost" label="Start over" onPress={() => setFirst(null)} />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { justifyContent: 'space-between', alignItems: 'center' },
  header: { alignItems: 'center', gap: space.sm, paddingHorizontal: space.md, marginTop: space.lg },
  center: { textAlign: 'center' },
  headline: { alignItems: 'center', gap: space.sm },
  footer: { alignSelf: 'stretch' },
});
