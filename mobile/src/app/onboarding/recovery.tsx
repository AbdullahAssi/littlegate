import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { Steps } from '@/components/Steps';
import { IconCircle } from '@/components/IconCircle';
import { Text } from '@/components/Text';
import { recoveryHandoff } from '@/lib/recoveryHandoff';
import { layoutAnim } from '@/theme/motion';
import { font, radius, space, type as typeScale, useTheme } from '@/theme/tokens';
import { I } from '@/components/icons';

export default function Recovery() {
  const { colors } = useTheme();
  // `then=home` when shown after a PIN reset instead of during setup.
  const { then } = useLocalSearchParams<{ then?: 'home' }>();
  const [code] = useState(recoveryHandoff.peek);
  // 'show' the code, then 'check' that the parent's written copy is right (report #11).
  const [step, setStep] = useState<'show' | 'check'>('show');
  const [typed, setTyped] = useState('');
  const norm = (c: string) => c.replace(/[^a-z0-9]/gi, '').toUpperCase();
  const complete = norm(typed).length === 12;
  const matches = !!code && norm(typed) === norm(code);

  function next() {
    recoveryHandoff.clear();
    // After a reset, '/' re-routes by real state (Kid Mode may still be on).
    router.replace(then === 'home' ? '/' : '/onboarding/categories');
  }

  // The code only lives in memory; after an app restart it can't be shown again.
  if (!code) {
    return (
      <Screen footer={<Button label="Continue" onPress={() => router.replace('/')} />}>
        <View style={styles.header}>
          <Text variant="title">Recovery code unavailable</Text>
          <Text tone="secondary">
            The app restarted before the code was saved, so it can’t be shown again. Your PIN is set and works. A
            new recovery code can be made from Settings in a later update.
          </Text>
        </View>
      </Screen>
    );
  }

  if (step === 'check') {
    return (
      <Screen
        footer={
          <>
            <Button label="Continue" disabled={!matches} onPress={next} />
            <Button
              variant="ghost"
              label="Show the code again"
              onPress={() => {
                setTyped('');
                setStep('show');
              }}
            />
          </>
        }>
        <View style={styles.header}>
          <IconCircle Icon={I.recovery} size={56} on="sunken" />
          {then !== 'home' ? (
            <Steps at={2} />
          ) : null}
          <Text variant="title">Check your copy</Text>
          <Text tone="secondary">Type the code from where you saved it. This makes sure you can get back in later.</Text>
        </View>
        <TextInput
          value={typed}
          onChangeText={(t) => setTyped(t.toUpperCase())}
          autoFocus
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={14}
          placeholder="XXXX-XXXX-XXXX"
          placeholderTextColor={colors.textTertiary}
          accessibilityLabel="Recovery code"
          style={[
            styles.input,
            typeScale.title,
            { fontFamily: font('600'), fontWeight: undefined, color: colors.text, backgroundColor: colors.surface },
            complete && !matches ? { borderWidth: 1, borderColor: colors.danger } : null,
          ]}
        />
        {complete ? (
          <Animated.View key={String(matches)} entering={layoutAnim.fadeIn()}>
            <Text variant="caption" tone={matches ? 'kid' : 'danger'} accessibilityLiveRegion="polite">
              {matches ? 'That’s it. Keep it somewhere safe.' : 'That doesn’t match. Check your copy, or show the code again.'}
            </Text>
          </Animated.View>
        ) : null}
      </Screen>
    );
  }

  return (
    <Screen footer={<Button label="I’ve saved it" onPress={() => setStep('check')} />}>
      <View style={styles.header}>
        <IconCircle Icon={I.recovery} size={56} on="sunken" />
        {then !== 'home' ? (
          <Steps at={2} />
        ) : null}
        <Text variant="title">Save your recovery code</Text>
        <Text tone="secondary">
          If you forget your PIN, this code is the only way back in. We show it once and never store it in readable
          form.
        </Text>
      </View>

      <Card style={styles.codeCard}>
        <Text
          selectable
          accessibilityLabel={`Recovery code ${code?.split('').join(' ')}`}
          style={[styles.code, { color: colors.text }]}>
          {code}
        </Text>
      </Card>

      <Text variant="label" tone="secondary" style={{ fontWeight: '400' }}>
        Write it down or keep it in a password manager — somewhere your kids can’t reach. Next, we’ll ask you to type it
        back.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: space.sm, marginTop: space.lg },
  codeCard: { alignItems: 'center', paddingVertical: space.xl },
  code: { fontSize: 24, letterSpacing: 2, fontWeight: '600', fontVariant: ['tabular-nums'] },
  input: { minHeight: 64, borderRadius: radius.md, paddingHorizontal: space.lg, textAlign: 'center', letterSpacing: 2 },
});
