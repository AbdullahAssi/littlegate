import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { Text } from '@/components/Text';
import { MIN_TOUCH, radius, space, useTheme } from '@/theme/tokens';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  /** Icon after the label (forward arrows). */
  trailingIcon?: React.ReactNode;
};

export function Button({ label, onPress, variant = 'primary', disabled, loading, icon, trailingIcon }: Props) {
  const { colors } = useTheme();
  const palette = {
    primary: { bg: colors.hero, fg: colors.onHero },
    secondary: { bg: colors.surface, fg: colors.text },
    ghost: { bg: 'transparent', fg: colors.textSecondary },
    danger: { bg: colors.dangerSoft, fg: colors.danger },
  }[variant];

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.base,
        { backgroundColor: palette.bg },
      ]}>
      <View style={styles.row}>
        {loading ? <ActivityIndicator color={palette.fg} /> : icon}
        <Text variant="heading" style={{ color: palette.fg }}>
          {label}
        </Text>
        {trailingIcon}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH + 8,
    borderRadius: radius.md,
    paddingHorizontal: space.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
