import { StyleSheet, View } from 'react-native';

import { IconCircle } from '@/components/IconCircle';
import { PressableScale } from '@/components/PressableScale';
import { Ring } from '@/components/ScoreRing';
import { Text } from '@/components/Text';
import { radius, space, useTheme } from '@/theme/tokens';
import { type AppIcon } from '@/components/icons';

type Props = {
  Icon: AppIcon;
  label: string;
  value: string;
  unit?: string;
  /** A real ratio, 0–100 → drawn as a ring. */
  ratio?: number;
  /** Small text badge instead of a ring (e.g. a trend). */
  badge?: React.ReactNode;
  /** The one lilac card per screen. */
  highlight?: boolean;
  onPress?: () => void;
};

export function StatCard({ Icon, label, value, unit, ratio, badge, highlight, onPress }: Props) {
  const { colors, dark } = useTheme();
  const body = (
    <View style={[styles.card, { backgroundColor: highlight ? colors.kidSoft : colors.surface }]}>
      <View style={styles.top}>
        <IconCircle Icon={Icon} on={highlight ? 'highlight' : 'surface'} />
        {ratio !== undefined ? (
          <Ring
            value={ratio}
            color={highlight ? colors.text : colors.kid}
            track={highlight ? (dark ? 'rgba(255,255,255,0.16)' : 'rgba(34,31,43,0.12)') : colors.surfaceSunken}
            textColor={colors.text}
          />
        ) : (
          badge
        )}
      </View>
      <View style={styles.bottom}>
        <Text variant="label" tone="secondary" style={{ fontWeight: '400' }} numberOfLines={1}>
          {label}
        </Text>
        <View style={styles.valueRow}>
          <Text variant="number" numberOfLines={1}>
            {value}
          </Text>
          {unit ? (
            <Text variant="caption" tone="secondary" numberOfLines={1} style={styles.unit}>
              {unit}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );

  if (!onPress) return <View style={styles.flex}>{body}</View>;
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={`${label}: ${value} ${unit ?? ''}`} scaleTo={0.98} onPress={onPress} containerStyle={styles.flex}>
      {body}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { borderRadius: radius.lg, padding: space.lg, gap: space.xl, minHeight: 164 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bottom: { gap: 2 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  unit: { flexShrink: 1 },
});
