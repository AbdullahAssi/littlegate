import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/Button';
import { PinPad } from '@/components/PinPad';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { KidMode } from '@/lib/kidMode';
import { recoveryHandoff } from '@/lib/recoveryHandoff';
import { font, radius, space, type as typeScale, useTheme } from '@/theme/tokens';

export default function Recover() {
  const { colors } = useTheme();
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'code' | 'pin'>('code');
  const [length, setLength] = useState<4 | 6>(4);
  const [error, setError] = useState<string | null>(null);

  async function onNewPin(pin: string) {
    const r = await KidMode.resetPinWithRecovery(code, pin);
    if (!r.ok) {
      setError('That recovery code isn’t right.');
      setStep('code');
      return false;
    }
    if (r.recoveryCode) recoveryHandoff.set(r.recoveryCode);
    router.dismissAll();
    router.replace({ pathname: '/onboarding/recovery', params: { then: 'home' } });
  }

  if (step === 'pin') {
    return (
      <Screen scroll={false} contentStyle={styles.pinContent}>
        <View style={styles.header}>
          <Text variant="title">Choose a new PIN</Text>
          <Text tone="secondary">{length} digits.</Text>
        </View>
        <PinPad key={length} length={length} onComplete={onNewPin} />
        <View style={{ alignSelf: 'stretch' }}>
          <Button
            variant="ghost"
            label={length === 4 ? 'Use a 6-digit PIN' : 'Use a 4-digit PIN'}
            onPress={() => setLength(length === 4 ? 6 : 4)}
          />
          <Button variant="ghost" label="Back" onPress={() => setStep('code')} />
        </View>
      </Screen>
    );
  }

  const cleaned = code.replace(/[^a-z0-9]/gi, '');

  return (
    <Screen
      footer={
        <>
          <Button label="Continue" disabled={cleaned.length !== 12} onPress={() => setStep('pin')} />
          <Button variant="ghost" label="Cancel" onPress={() => router.back()} />
        </>
      }>
      <View style={[styles.header, { alignItems: 'flex-start' }]}>
        <Text variant="title">Forgot your PIN?</Text>
        <Text tone="secondary">Enter the 12-character recovery code you saved during setup.</Text>
      </View>
      <TextInput
        value={code}
        onChangeText={(t) => {
          setCode(t.toUpperCase());
          setError(null);
        }}
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        placeholder="XXXX-XXXX-XXXX"
        placeholderTextColor={colors.textTertiary}
        accessibilityLabel="Recovery code"
        style={[
          styles.input,
          typeScale.heading,
          {
            fontFamily: font('600'),
            fontWeight: undefined,
            color: colors.text,
            backgroundColor: colors.surface,
          },
          // Surfaces are told apart by tone; a border appears only to mark the error.
          error ? { borderWidth: 1, borderColor: colors.danger } : null,
        ]}
      />
      {error ? <Text tone="danger">{error}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: space.sm, alignItems: 'center', marginTop: space.lg },
  pinContent: { justifyContent: 'space-between', alignItems: 'center' },
  input: {
    minHeight: 56,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    letterSpacing: 2,
  },
});
