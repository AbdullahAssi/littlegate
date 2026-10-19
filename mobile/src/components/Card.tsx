import { StyleSheet, Switch, View, type ViewStyle } from 'react-native';
import Animated, { type LinearTransition } from 'react-native-reanimated';

import { Text } from '@/components/Text';
import { radius, space, useTheme } from '@/theme/tokens';

export function Card({
  children,
  style,
  layout,
}: {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  /** For cards that grow, or move with content above them. */
  layout?: LinearTransition;
}) {
  const { colors } = useTheme();
  return (
    <Animated.View layout={layout} style={[styles.card, { backgroundColor: colors.surface }, style]}>
      {children}
    </Animated.View>
  );
}

export function SectionLabel({ children, layout }: { children: string; layout?: LinearTransition }) {
  return (
    <Animated.View layout={layout}>
      <Text variant="label" tone="secondary" style={styles.section}>
        {children}
      </Text>
    </Animated.View>
  );
}

/** A settings row with a native switch. Toggles never animate beyond the platform's own switch. */
export function SwitchRow({
  title,
  detail,
  value,
  onValueChange,
  icon,
}: {
  title: string;
  detail?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  icon?: React.ReactNode;
}) {
  const { colors, dark } = useTheme();
  return (
    <View
      // Rows are separated by space, not rules.
      style={styles.row}>
      {icon}
      <View style={styles.rowText}>
        <Text variant="heading">{title}</Text>
        {detail ? (
          <Text variant="caption" tone="secondary">
            {detail}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        accessibilityLabel={title}
        trackColor={{ true: colors.kid, false: dark ? '#3A3944' : '#DCDBE3' }}
        thumbColor="#FFFFFF"
        // react-native-web ignores thumbColor when on.
        {...({ activeThumbColor: '#FFFFFF' } as object)}
        ios_backgroundColor={dark ? '#3A3944' : '#DCDBE3'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: space.lg },
  section: { marginTop: space.md, marginLeft: space.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.md, minHeight: 56 },
  rowText: { flex: 1, gap: 2 },
});
