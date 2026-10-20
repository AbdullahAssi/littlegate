import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Enter } from '@/components/Enter';
import { Mark } from '@/components/Mark';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { radius, space, useTheme } from '@/theme/tokens';
import { I } from '@/components/icons';

const POINTS = [
  { title: 'Filters on the phone itself', detail: 'Blocked sites never load. Nothing is sent to a server.' },
  { title: 'Only the apps you choose', detail: 'Kid Mode shows a simple home screen with approved apps.' },
  { title: 'Your PIN is the only way out', detail: 'Leaving Kid Mode or changing settings needs your PIN.' },
];

export default function Welcome() {
  const { colors } = useTheme();

  return (
    <Screen
      footer={
        <Button
          label="Get started"
          trailingIcon={<I.forward size={18} color={colors.onHero} />}
          onPress={() => router.push('/onboarding/pin')}
        />
      }>
      {/* The gate itself is the picture: one large mark on the one lilac field. */}
      <Enter index={0}>
        <View style={[styles.field, { backgroundColor: colors.kidSoft }]}>
          <Mark size={120} />
        </View>
      </Enter>

      <Enter index={1} style={styles.headline}>
        <Text variant="display">A safer phone for your kids</Text>
        <Text tone="secondary">Set it up once in about two minutes. You stay in control with a PIN.</Text>
      </Enter>

      <Enter index={2}>
        <View style={[styles.points, { backgroundColor: colors.surface }]}>
          {POINTS.map((p) => (
            <View key={p.title} style={styles.point}>
              <Text variant="heading">{p.title}</Text>
              <Text variant="label" tone="secondary" style={{ fontWeight: '400' }}>
                {p.detail}
              </Text>
            </View>
          ))}
        </View>
      </Enter>
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: { height: 220, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', marginTop: space.sm },
  headline: { gap: space.md, marginTop: space.sm },
  points: { borderRadius: radius.lg, padding: space.lg, gap: space.lg },
  point: { gap: 2 },
});
